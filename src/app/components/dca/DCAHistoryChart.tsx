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
import { ZoomIn, ZoomOut, RotateCcw, Share2, Check, PenLine } from 'lucide-react';
import html2canvas from 'html2canvas';
import { DCAPortfolioHistoryPoint } from '../../types/dca';
import {
  ChartAnnotationOverlay,
  type ChartAnnotationHandle,
  type SnapPoint,
} from './ChartAnnotationOverlay';
import { useThemeColors } from '../../hooks/useThemeColors';

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

const formatVNDFull = (amount: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.round(amount));

const formatDate = (date: Date): string =>
  `${date.getDate()}/${date.getMonth() + 1}`;

const formatDateFull = (date: Date): string =>
  date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

/* ─── Watermark config ───────────────────────────────────── */

const WATERMARK_CONFIG = {
  text: 'CryptoTrade DCA',
  subtext: '', // filled at runtime with date
  opacity: 0.35,
  fontSize: 22,
  subFontSize: 13,
  padding: 20,
};

/* ─── Crosshair Cursor ──────────────────────────────────── */

function CrosshairCursor(props: any) {
  const { points, width, height, top, left } = props;
  if (!points || points.length === 0) return null;

  const { x, y } = points[0];

  return (
    <g>
      {/* Vertical line */}
      <line
        x1={x}
        y1={top}
        x2={x}
        y2={top + height}
        stroke="var(--accent-primary, var(--primary))"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.6}
      />
      {/* Horizontal line */}
      <line
        x1={left}
        y1={y}
        x2={left + width}
        y2={y}
        stroke="var(--accent-primary, var(--primary))"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.4}
      />
      {/* Active dot */}
      <circle
        cx={x}
        cy={y}
        r={5}
        fill="var(--accent-primary, var(--primary))"
        stroke="white"
        strokeWidth={2.5}
      />
      {/* Outer ring */}
      <circle
        cx={x}
        cy={y}
        r={9}
        fill="none"
        stroke="var(--accent-primary, var(--primary))"
        strokeWidth={1}
        opacity={0.25}
      />
    </g>
  );
}

/* ─── Crosshair Tooltip ──────────────────────────────────── */

function CrosshairTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as DCAPortfolioHistoryPoint & {
    date: number;
  };
  const dateObj = new Date(data.date);
  const profitLoss = data.portfolioValue - data.totalInvested;
  const profitLossPercent =
    data.totalInvested > 0 ? (profitLoss / data.totalInvested) * 100 : 0;
  const isProfit = profitLoss >= 0;

  return (
    <div
      className="bg-[var(--surface-1,var(--card))] border border-[var(--border-subtle,var(--border))] rounded-xl shadow-xl pointer-events-none"
      style={{ padding: '10px 12px', minWidth: 180 }}
    >
      <div
        className="text-[11px] text-[var(--text-tertiary,var(--tr-text-3))] mb-2 pb-1.5 border-b border-[var(--border-subtle,var(--border))]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatDateFull(dateObj)}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="text-[11px] text-[var(--text-secondary,var(--muted-foreground))]">
            Giá trị
          </span>
          <span
            className="text-[13px] text-[var(--text-primary,var(--foreground))]"
            style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatVNDFull(data.portfolioValue)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-[11px] text-[var(--text-secondary,var(--muted-foreground))]">
            Đã đầu tư
          </span>
          <span
            className="text-[13px] text-[var(--text-primary,var(--foreground))]"
            style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatVNDFull(data.totalInvested)}
          </span>
        </div>

        <div className="flex justify-between gap-4 pt-1 border-t border-[var(--border-subtle,var(--border))]">
          <span className="text-[11px] text-[var(--text-secondary,var(--muted-foreground))]">
            Lãi/Lỗ
          </span>
          <span
            className={`text-[13px] ${
              isProfit
                ? 'text-[var(--semantic-success,var(--tr-buy))]'
                : 'text-[var(--semantic-error,var(--tr-sell))]'
            }`}
            style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {isProfit ? '+' : ''}
            {formatVNDFull(profitLoss)} ({isProfit ? '+' : ''}
            {profitLossPercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {data.hasPurchase && (
        <div className="mt-2 pt-1.5 border-t border-[var(--border-subtle,var(--border))] flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--accent-primary, var(--primary))' }}
          />
          <span
            className="text-[11px] text-[var(--accent-primary,var(--primary))]"
            style={{ fontWeight: 500 }}
          >
            Đã mua tại điểm này
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Purchase Dot ───────────────────────────────────────── */

function PurchaseDot(props: any) {
  const { cx, cy, payload, index } = props;
  if (!payload.hasPurchase) return <circle key={`no-purchase-${index}`} r={0} />;

  return (
    <circle
      key={`purchase-${index}`}
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--accent-primary, var(--primary))"
      stroke="white"
      strokeWidth={2}
    />
  );
}

/* ─── Pinch/Zoom helpers ─────────────────────────────────── */

function getTouchDistance(touches: React.TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchCenter(
  touches: React.TouchList,
  containerRect: DOMRect,
): number {
  if (touches.length < 2) return 0.5;
  const cx = (touches[0].clientX + touches[1].clientX) / 2;
  return (cx - containerRect.left) / containerRect.width;
}

/* ─── Watermark drawing ──────────────────────────────────── */

function drawWatermark(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { text, opacity, fontSize, subFontSize, padding } = WATERMARK_CONFIG;
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.save();
  ctx.globalAlpha = opacity;

  // Main brand text — bottom-right
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = '#94A3B8'; // slate-400 neutral
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, canvas.width - padding, canvas.height - padding - subFontSize - 4);

  // Date subtext
  ctx.font = `400 ${subFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillText(dateStr, canvas.width - padding, canvas.height - padding);

  // Subtle diagonal repeated watermark (very faint)
  ctx.globalAlpha = 0.06;
  ctx.font = `600 ${fontSize * 1.2}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const step = 260;
  for (let y = -canvas.height; y < canvas.height * 2; y += step) {
    for (let x = -canvas.width; x < canvas.width * 2; x += step) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.35);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════ */
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
          } catch (err: any) {
            if (err?.name !== 'AbortError') {
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
  }, [isExporting, annotationMode]);

  const fallbackDownload = useCallback((canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.download = `dca-chart-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  }, []);

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
      } else if (
        !touchRef.current.isPinching &&
        e.touches.length === 1 &&
        isZoomed
      ) {
        const dx =
          (e.touches[0].clientX - touchRef.current.panStartX) / rect.width;
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
    const diffDays = Math.round(
      (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24),
    );
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
      x: plotLeft + ((d.date as number) - xMin) / xRange * plotWidth,
      y: plotTop + (effYMax - d.portfolioValue) / effYRange * plotHeight,
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
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3
            className="text-[18px] mb-1"
            style={{ fontWeight: 500, color: c.text1 }}
          >
            Lịch Sử Danh Mục
          </h3>
          <p className="text-[14px]" style={{ color: c.text2 }}>
            {effectiveSubtitle}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Annotation toggle */}
          {interactive && (
            <button
              onClick={() => setAnnotationMode((p) => !p)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: annotationMode
                  ? c.primary
                  : hasAnnotations
                    ? 'rgba(59,130,246,0.1)'
                    : 'transparent',
                color: annotationMode
                  ? 'white'
                  : hasAnnotations
                    ? c.primary
                    : c.text2,
              }}
              aria-label={annotationMode ? 'Tắt ghi chú' : 'Bật ghi chú'}
              title="Ghi chú trên biểu đồ"
            >
              <PenLine className="w-4 h-4" />
            </button>
          )}

          {/* Export / Share */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
            style={{
              background: exportSuccess ? 'rgba(16,185,129,0.1)' : 'transparent',
            }}
            aria-label="Chia sẻ biểu đồ"
            title="Tải ảnh / Chia sẻ"
          >
            {isExporting ? (
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full"
                style={{ borderColor: c.text3, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }}
              />
            ) : exportSuccess ? (
              <Check className="w-4 h-4" style={{ color: c.buy }} />
            ) : (
              <Share2 className="w-4 h-4" style={{ color: c.text2 }} />
            )}
          </button>

          {/* Zoom controls (interactive, not annotating) */}
          {interactive && !annotationMode && (
            <div className="flex items-center gap-1 ml-1 pl-1 border-l" style={{ borderColor: c.border }}>
              <button
                onClick={zoomIn}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Phóng to"
              >
                <ZoomIn className="w-4 h-4" style={{ color: c.text2 }} />
              </button>
              <button
                onClick={zoomOut}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                aria-label="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" style={{ color: c.text2 }} />
              </button>
              {isZoomed && (
                <button
                  onClick={resetZoom}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  aria-label="Đặt lại zoom"
                >
                  <RotateCcw className="w-4 h-4" style={{ color: c.primary }} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interaction hint */}
      {interactive && !isZoomed && !annotationMode && (
        <p className="text-[11px] mb-3 text-center" style={{ color: c.text3 }}>
          Giữ ngón để xem giá trị · Chụm để zoom · Chạm 2 lần để reset
        </p>
      )}

      {/* Annotation mode banner */}
      {annotationMode && (
        <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: c.primary + '14', border: `1px solid ${c.primary}26` }}>
          <p className="text-[12px] text-center" style={{ fontWeight: 500, color: c.primary }}>
            Chế độ ghi chú — Vẽ, viết, đánh dấu, di chuyển, nhân đôi hoặc xóa
          </p>
        </div>
      )}

      {/* Chart container (relative for annotation overlay) */}
      <div
        ref={chartAreaRef}
        className="relative"
        style={{ height }}
      >
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
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                key="grid"
                strokeDasharray="3 3"
                stroke={c.border}
              />

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

      {/* Zoom level indicator */}
      {interactive && isZoomed && !annotationMode && (
        <div className="flex items-center justify-center mt-2">
          <div className="relative w-32 h-1.5 rounded-full" style={{ background: c.surface2 }}>
            <div
              className="absolute top-0 h-full rounded-full opacity-60"
              style={{
                background: c.primary,
                left: `${visibleStart * 100}%`,
                width: `${(visibleEnd - visibleStart) * 100}%`,
              }}
            />
          </div>
          <span className="ml-2 text-[11px]" style={{ color: c.text3 }}>
            {Math.round((visibleEnd - visibleStart) * 100)}%
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-5 pt-5 border-t" style={{ borderColor: c.border }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5" style={{ background: c.primary }} />
          <span className="text-[12px]" style={{ color: c.text2 }}>
            Giá trị danh mục
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-4 h-0.5"
            style={{ background: c.text3, borderTop: '2px dashed' }}
          />
          <span className="text-[12px]" style={{ color: c.text2 }}>
            Đã đầu tư
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: c.primary }} />
          <span className="text-[12px]" style={{ color: c.text2 }}>
            Điểm mua
          </span>
        </div>
      </div>
    </div>
  );
}