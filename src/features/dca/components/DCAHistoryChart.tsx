/**
 * DCA History Chart Component
 *
 * Displays portfolio value over time with purchase markers.
 * Features:
 *  - Pinch-to-zoom & drag-to-pan on mobile
 *  - Double-tap to reset zoom
 *  - Crosshair cursor with floating data label on hover / touch
 *  - Annotation mode: freehand draw, text labels, arrows
 *  - Export to PNG with watermark branding (Web Share API + download fallback)
 *
 * @module components/dca
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import html2canvas from 'html2canvas';
import type { DCAPortfolioHistoryPoint } from '../model/dca-types';
import {
  ChartAnnotationOverlay,
  type ChartAnnotationHandle,
  type SnapPoint,
} from './ChartAnnotationOverlay';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { DCAHistoryChartControls, DCAHistoryChartLegend } from './DCAHistoryChartControls';
import { CrosshairCursor, CrosshairTooltip, PurchaseDot } from './DCAHistoryChartVisuals';
import { drawWatermark, getTouchCenter, getTouchDistance } from './dca-history-chart-utils';

/* ─── Props ──────────────────────────────────────────────── */

export interface DCAHistoryChartProps {
  data: DCAPortfolioHistoryPoint[];
  height?: number;
  /** Optional subtitle override (e.g. "7 ngày qua") */
  subtitle?: string;
  /** Enable interactive zoom/pan/crosshair (default false) */
  interactive?: boolean;
}

/* ─── Formatters ─────────────────────────────────────────── */

const formatVND = (value: number): string => {
  const millions = value / 1_000_000;
  if (millions >= 1000) return `${(millions / 1000).toFixed(1)}B`;
  return `${millions.toFixed(1)}M`;
};

const formatDate = (date: Date): string => `${date.getDate()}/${date.getMonth() + 1}`;

/* ─── Main Component ─────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */

export function DCAHistoryChart({
  data,
  height = 300,
  subtitle,
  interactive = false,
}: DCAHistoryChartProps) {
  const c = useThemeColors();

  /* ── Zoom state ─────────────────────────────────────────── */
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(1);
  const isZoomed = visibleStart > 0.001 || visibleEnd < 0.999;

  /* ── Export state ───────────────────────────────────────── */
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  /* ── Annotation state ───────────────────────────────────── */
  const [annotationMode, setAnnotationMode] = useState(false);
  const annotationRef = useRef<ChartAnnotationHandle>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [chartAreaSize, setChartAreaSize] = useState({ width: 0, height: 0 });

  // Measure chart area for annotation overlay
  useEffect(() => {
    if (!chartAreaRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChartAreaSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(chartAreaRef.current);
    return () => observer.disconnect();
  }, []);

  /* ── Touch refs ─────────────────────────────────────────── */
  const touchRef = useRef<{
    initialDist: number;
    initialStart: number;
    initialEnd: number;
    center: number;
    isPinching: boolean;
    panStartX: number;
    panStart: number;
    panEnd: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);

  /* ── Reset zoom ─────────────────────────────────────────── */
  const resetZoom = useCallback(() => {
    setVisibleStart(0);
    setVisibleEnd(1);
  }, []);

  /* ── Zoom in / out ──────────────────────────────────────── */
  const zoomIn = useCallback(() => {
    setVisibleStart((s) => {
      const range = visibleEnd - s;
      const newRange = Math.max(range * 0.6, 0.05);
      const center = (s + visibleEnd) / 2;
      return Math.max(0, center - newRange / 2);
    });
    setVisibleEnd((e) => {
      const range = e - visibleStart;
      const newRange = Math.max(range * 0.6, 0.05);
      const center = (visibleStart + e) / 2;
      return Math.min(1, center + newRange / 2);
    });
  }, [visibleStart, visibleEnd]);

  const zoomOut = useCallback(() => {
    setVisibleStart((s) => {
      const range = visibleEnd - s;
      const newRange = Math.min(range * 1.5, 1);
      const center = (s + visibleEnd) / 2;
      return Math.max(0, center - newRange / 2);
    });
    setVisibleEnd((e) => {
      const range = e - visibleStart;
      const newRange = Math.min(range * 1.5, 1);
      const center = (visibleStart + e) / 2;
      return Math.min(1, center + newRange / 2);
    });
  }, [visibleStart, visibleEnd]);

  const fallbackDownload = useCallback((canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `dca-chart-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  }, []);

  /* ── Export to PNG (with watermark + annotations) ──────── */
  const handleExport = useCallback(async () => {
    if (!exportContainerRef.current || isExporting) return;
    setIsExporting(true);

    // Temporarily exit annotation mode to get clean capture
    const wasAnnotating = annotationMode;
    if (wasAnnotating) setAnnotationMode(false);

    // Wait a tick for DOM update
    await new Promise((r) => setTimeout(r, 50));

    try {
      const baseCanvas = await html2canvas(exportContainerRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Composite annotations if any
      const annCanvas = annotationRef.current?.getCanvas();
      const hasAnns = annotationRef.current?.hasAnnotations() ?? false;
      if (hasAnns && annCanvas) {
        const ctx = baseCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            annCanvas,
            0,
            0,
            annCanvas.width,
            annCanvas.height,
            0,
            0,
            baseCanvas.width,
            baseCanvas.height,
          );
        }
      }

      // Draw watermark
      drawWatermark(baseCanvas);

      // Share or download
      if (navigator.share && navigator.canShare) {
        baseCanvas.toBlob(async (blob) => {
          if (!blob) {
            fallbackDownload(baseCanvas);
            return;
          }

          const file = new File([blob], `dca-chart-${Date.now()}.png`, {
            type: 'image/png',
          });

          const shareData = {
            title: 'Biểu đồ DCA — CryptoTrade',
            text: 'Xem biểu đồ danh mục DCA của tôi',
            files: [file],
          };

          try {
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              setExportSuccess(true);
              setTimeout(() => setExportSuccess(false), 2000);
            } else {
              fallbackDownload(baseCanvas);
            }
          } catch (error: unknown) {
            const errorName =
              error instanceof Error
                ? error.name
                : typeof error === 'object' && error !== null && 'name' in error
                  ? error.name
                  : undefined;
            if (errorName !== 'AbortError') {
              fallbackDownload(baseCanvas);
            }
          }
        }, 'image/png');
      } else {
        fallbackDownload(baseCanvas);
      }
    } catch {
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
      if (wasAnnotating) setAnnotationMode(true);
    }
  }, [isExporting, annotationMode, fallbackDownload]);

  /* ── Touch handlers (pinch-to-zoom + drag-to-pan) ──────── */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!interactive || annotationMode) return;

      const now = Date.now();
      if (e.touches.length === 1 && now - lastTapRef.current < 300) {
        resetZoom();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (e.touches.length === 2) {
        touchRef.current = {
          initialDist: getTouchDistance(e.touches),
          initialStart: visibleStart,
          initialEnd: visibleEnd,
          center: getTouchCenter(e.touches, rect),
          isPinching: true,
          panStartX: 0,
          panStart: visibleStart,
          panEnd: visibleEnd,
        };
      } else if (e.touches.length === 1 && isZoomed) {
        touchRef.current = {
          initialDist: 0,
          initialStart: visibleStart,
          initialEnd: visibleEnd,
          center: 0,
          isPinching: false,
          panStartX: e.touches[0].clientX,
          panStart: visibleStart,
          panEnd: visibleEnd,
        };
      }
    },
    [interactive, annotationMode, visibleStart, visibleEnd, isZoomed, resetZoom],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!interactive || annotationMode || !touchRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (touchRef.current.isPinching && e.touches.length === 2) {
        const newDist = getTouchDistance(e.touches);
        const scale = touchRef.current.initialDist / newDist;
        const { initialStart, initialEnd, center } = touchRef.current;
        const range = initialEnd - initialStart;
        const newRange = Math.max(0.05, Math.min(1, range * scale));
        const anchorPoint = initialStart + range * center;
        let newStart = anchorPoint - newRange * center;
        let newEnd = anchorPoint + newRange * (1 - center);
        if (newStart < 0) {
          newEnd -= newStart;
          newStart = 0;
        }
        if (newEnd > 1) {
          newStart -= newEnd - 1;
          newEnd = 1;
        }
        setVisibleStart(Math.max(0, newStart));
        setVisibleEnd(Math.min(1, newEnd));
        e.preventDefault();
      } else if (!touchRef.current.isPinching && e.touches.length === 1 && isZoomed) {
        const dx = (e.touches[0].clientX - touchRef.current.panStartX) / rect.width;
        const range = touchRef.current.panEnd - touchRef.current.panStart;
        let newStart = touchRef.current.panStart - dx * range;
        let newEnd = touchRef.current.panEnd - dx * range;
        if (newStart < 0) {
          newEnd -= newStart;
          newStart = 0;
        }
        if (newEnd > 1) {
          newStart -= newEnd - 1;
          newEnd = 1;
        }
        setVisibleStart(Math.max(0, newStart));
        setVisibleEnd(Math.min(1, newEnd));
        e.preventDefault();
      }
    },
    [interactive, annotationMode, isZoomed],
  );

  const handleTouchEnd = useCallback(() => {
    touchRef.current = null;
  }, []);

  /* ── Prepare chart data ─────────────────────────────────── */
  const allChartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        date: point.date.getTime(),
        dateLabel: formatDate(point.date),
      })),
    [data],
  );

  const chartData = useMemo(() => {
    if (!interactive || allChartData.length === 0) return allChartData;
    const startIdx = Math.floor(visibleStart * (allChartData.length - 1));
    const endIdx = Math.ceil(visibleEnd * (allChartData.length - 1));
    return allChartData.slice(startIdx, endIdx + 1);
  }, [allChartData, interactive, visibleStart, visibleEnd]);

  const tickInterval = Math.max(1, Math.floor(chartData.length / 8));

  /* ── Subtitle ───────────────────────────────────────────── */
  const effectiveSubtitle = useMemo(() => {
    if (subtitle) return subtitle;
    if (data.length < 2) return '';
    const first = data[0].date;
    const last = data[data.length - 1].date;
    const diffDays = Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return '7 ngày qua';
    if (diffDays <= 30) return '30 ngày qua';
    if (diffDays <= 90) return '90 ngày qua';
    return `${diffDays} ngày qua`;
  }, [data, subtitle]);

  /* ── Has annotations indicator ──────────────────────────── */
  const hasAnnotations = annotationRef.current?.hasAnnotations() ?? false;

  /* ── Snap points for annotation arrow snap-to-chart ────── */
  const snapPoints: SnapPoint[] = useMemo(() => {
    if (!interactive || chartData.length === 0 || chartAreaSize.width === 0) return [];

    const yAxisWidth = 45; // estimated Recharts YAxis label width
    const margin = { top: 5, right: 5, bottom: 25 }; // bottom includes x-axis labels
    const plotLeft = yAxisWidth;
    const plotRight = chartAreaSize.width - margin.right;
    const plotTop = margin.top;
    const plotBottom = chartAreaSize.height - margin.bottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const timestamps = chartData.map((d) => d.date as number);
    const allValues = [
      ...chartData.map((d) => d.portfolioValue),
      ...chartData.map((d) => d.totalInvested),
    ];
    const xMin = Math.min(...timestamps);
    const xMax = Math.max(...timestamps);
    const yMin = Math.min(...allValues);
    const yMax = Math.max(...allValues);
    const xRange = xMax - xMin || 1;
    const yPad = (yMax - yMin) * 0.05 || 1;
    const effYMin = yMin - yPad;
    const effYMax = yMax + yPad;
    const effYRange = effYMax - effYMin;

    return chartData.map((d) => ({
      x: plotLeft + (((d.date as number) - xMin) / xRange) * plotWidth,
      y: plotTop + ((effYMax - d.portfolioValue) / effYRange) * plotHeight,
      label: d.dateLabel,
    }));
  }, [interactive, chartData, chartAreaSize]);

  /* ═══════════════════════════════════════════════════════── */
  /* ── Render ─────────────────────────────────────────────── */
  /* ═══════════════════════════════════════════════════════── */
  return (
    <div
      ref={exportContainerRef}
      className="rounded-2xl p-5 relative"
      style={{ background: c.surface }}
    >
      <DCAHistoryChartControls
        subtitle={effectiveSubtitle}
        interactive={interactive}
        annotationMode={annotationMode}
        hasAnnotations={hasAnnotations}
        isExporting={isExporting}
        exportSuccess={exportSuccess}
        isZoomed={isZoomed}
        onToggleAnnotation={() => setAnnotationMode((previous) => !previous)}
        onExport={handleExport}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
      />
      {/* Chart container (relative for annotation overlay) */}
      <div ref={chartAreaRef} className="relative" style={{ height }}>
        <div
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="touch-none"
          style={{
            touchAction: interactive && !annotationMode ? 'none' : 'auto',
            height: '100%',
          }}
        >
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.border} />

              <XAxis
                key="xaxis"
                dataKey="date"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(ts) => formatDate(new Date(ts))}
                tick={{
                  fill: c.text3,
                  fontSize: 12,
                }}
                stroke={c.border}
                interval={tickInterval}
              />

              <YAxis
                key="yaxis"
                tickFormatter={formatVND}
                tick={{
                  fill: c.text3,
                  fontSize: 12,
                }}
                stroke={c.border}
              />

              <Tooltip
                key="tooltip"
                content={<CrosshairTooltip />}
                cursor={
                  interactive && !annotationMode ? (
                    <CrosshairCursor />
                  ) : (
                    {
                      stroke: c.border,
                      strokeDasharray: '4 3',
                    }
                  )
                }
                isAnimationActive={false}
              />

              <Line
                key="line-totalInvested"
                type="monotone"
                dataKey="totalInvested"
                stroke={c.text3}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
                activeDot={
                  interactive && !annotationMode
                    ? {
                        r: 4,
                        stroke: c.text3,
                        strokeWidth: 2,
                        fill: 'white',
                      }
                    : false
                }
                name="Đã đầu tư"
              />

              <Line
                key="line-portfolioValue"
                type="monotone"
                dataKey="portfolioValue"
                stroke={c.primary}
                strokeWidth={3}
                dot={<PurchaseDot />}
                activeDot={false}
                name="Giá trị"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Annotation overlay (positioned over chart area) */}
        <ChartAnnotationOverlay
          ref={annotationRef}
          active={annotationMode}
          onClose={() => setAnnotationMode(false)}
          width={chartAreaSize.width}
          height={chartAreaSize.height}
          snapPoints={snapPoints}
        />
      </div>

      <DCAHistoryChartLegend
        interactive={interactive}
        isZoomed={isZoomed}
        annotationMode={annotationMode}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
      />
    </div>
  );
}
