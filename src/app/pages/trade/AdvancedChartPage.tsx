import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ChevronDown, ChevronLeft, Settings, TrendingUp, BarChart2,
  Minus, Plus, RotateCcw, Crosshair, Layers, X, Check,
  ZoomIn, ZoomOut, Maximize2, AlertCircle,
} from 'lucide-react';
import { CRYPTO_PAIRS, generateChartData } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useGoBack } from '../../hooks/useGoBack';
import { fmtPrice, fmtPct } from '../../data/formatNumber';
import { Header } from '../../components/layout/Header';

// ─── Types ──────────────────────────────────────────────────
interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Indicator {
  id: string;
  label: string;
  color: string;
  enabled: boolean;
  period?: number;
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];
const CHART_TYPES = [
  { id: 'candle', label: '蜡烛', icon: '🕯️' },
  { id: 'line', label: 'Line', icon: '📈' },
  { id: 'area', label: 'Area', icon: '📊' },
];

const DEFAULT_INDICATORS: Indicator[] = [
  { id: 'ma7', label: 'MA(7)', color: '#F59E0B', enabled: true, period: 7 },
  { id: 'ma25', label: 'MA(25)', color: '#3B82F6', enabled: true, period: 25 },
  { id: 'ma99', label: 'MA(99)', color: '#8B5CF6', enabled: false, period: 99 },
  { id: 'ema', label: 'EMA(20)', color: '#06B6D4', enabled: false, period: 20 },
  { id: 'bb', label: 'Bollinger', color: '#10B981', enabled: false },
  { id: 'rsi', label: 'RSI(14)', color: '#EF4444', enabled: false },
  { id: 'macd', label: 'MACD', color: '#9945FF', enabled: false },
  { id: 'vol', label: 'Volume', color: '#8B95B3', enabled: true },
];

// ─── Canvas-based Chart Component ──────────────────────────
function CandlestickChart({
  candles,
  indicators,
  chartType,
  crosshair,
  setCrosshair,
}: {
  candles: Candle[];
  indicators: Indicator[];
  chartType: string;
  crosshair: { x: number; y: number; visible: boolean; candleIdx: number };
  setCrosshair: (c: any) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const c = useThemeColors();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PADDING = { top: 12, right: 56, bottom: 40, left: 8 };
    const chartW = W - PADDING.left - PADDING.right;
    const chartH = H - PADDING.top - PADDING.bottom;

    ctx.clearRect(0, 0, W, H);

    const showVol = indicators.find(i => i.id === 'vol')?.enabled;
    const MAIN_H = showVol ? chartH * 0.72 : chartH;
    const VOL_H = showVol ? chartH * 0.22 : 0;
    const VOL_GAP = 6;

    // Compute price range
    const prices = candles.flatMap(c => [c.high, c.low]);
    let minP = Math.min(...prices);
    let maxP = Math.max(...prices);
    const pad = (maxP - minP) * 0.08;
    minP -= pad; maxP += pad;
    const priceRange = maxP - minP;

    const xForIdx = (i: number) => PADDING.left + ((i + 0.5) / candles.length) * chartW;
    const yForPrice = (p: number) => PADDING.top + MAIN_H - ((p - minP) / priceRange) * MAIN_H;

    // Background — theme-aware
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines — theme-aware
    ctx.strokeStyle = c.borderSolid + '80';
    ctx.lineWidth = 0.5;
    const levels = 6;
    for (let i = 0; i <= levels; i++) {
      const y = PADDING.top + (MAIN_H / levels) * i;
      ctx.beginPath(); ctx.moveTo(PADDING.left, y); ctx.lineTo(W - PADDING.right, y); ctx.stroke();
      const price = maxP - (i / levels) * priceRange;
      ctx.fillStyle = c.text3;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price >= 1000 ? price.toFixed(0) : price >= 1 ? price.toFixed(2) : price.toFixed(4), W - PADDING.right + 4, y + 3);
    }

    // X axis labels — theme-aware
    const labelInterval = Math.ceil(candles.length / 6);
    candles.forEach((candle, i) => {
      if (i % labelInterval === 0) {
        const x = xForIdx(i);
        ctx.fillStyle = c.text3;
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(candle.time, x, H - 8);
      }
    });

    const candleW = Math.max(1.5, (chartW / candles.length) * 0.6);

    if (chartType === 'candle') {
      // Draw candles
      candles.forEach((c, i) => {
        const x = xForIdx(i);
        const isUp = c.close >= c.open;
        const color = isUp ? '#10B981' : '#EF4444';
        ctx.strokeStyle = color;
        ctx.fillStyle = isUp ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)';
        ctx.lineWidth = 1;

        const bodyTop = yForPrice(Math.max(c.open, c.close));
        const bodyBot = yForPrice(Math.min(c.open, c.close));
        const bodyH = Math.max(1.5, bodyBot - bodyTop);

        // Wick
        ctx.beginPath();
        ctx.moveTo(x, yForPrice(c.high));
        ctx.lineTo(x, yForPrice(c.low));
        ctx.stroke();

        // Body
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
      });
    } else if (chartType === 'line' || chartType === 'area') {
      // Area/Line
      ctx.beginPath();
      candles.forEach((c, i) => {
        const x = xForIdx(i);
        const y = yForPrice(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      if (chartType === 'area') {
        const lastX = xForIdx(candles.length - 1);
        const firstX = xForIdx(0);
        ctx.lineTo(lastX, PADDING.top + MAIN_H);
        ctx.lineTo(firstX, PADDING.top + MAIN_H);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, PADDING.top, 0, PADDING.top + MAIN_H);
        grad.addColorStop(0, 'rgba(59,130,246,0.35)');
        grad.addColorStop(1, 'rgba(59,130,246,0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // MA lines
    const enabledMAs = indicators.filter(i => i.enabled && i.id.startsWith('ma') && i.period);
    enabledMAs.forEach(ind => {
      const period = ind.period!;
      ctx.beginPath();
      ctx.strokeStyle = ind.color;
      ctx.lineWidth = 1.2;
      let started = false;
      candles.forEach((_, i) => {
        if (i < period - 1) return;
        const sum = candles.slice(i - period + 1, i + 1).reduce((s, c) => s + c.close, 0);
        const ma = sum / period;
        const x = xForIdx(i);
        const y = yForPrice(ma);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // EMA
    if (indicators.find(i => i.id === 'ema')?.enabled) {
      const period = 20;
      const k = 2 / (period + 1);
      let ema = candles[0].close;
      ctx.beginPath();
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 1.2;
      candles.forEach((c, i) => {
        ema = c.close * k + ema * (1 - k);
        if (i < period) return;
        const x = xForIdx(i);
        const y = yForPrice(ema);
        if (i === period) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Bollinger Bands
    if (indicators.find(i => i.id === 'bb')?.enabled) {
      const period = 20;
      const multiplier = 2;
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = 'rgba(16,185,129,0.6)';
      ctx.setLineDash([3, 3]);
      let startedU = false, startedL = false;
      const pathU = new Path2D();
      const pathL = new Path2D();
      candles.forEach((_, i) => {
        if (i < period - 1) return;
        const slice = candles.slice(i - period + 1, i + 1);
        const mean = slice.reduce((s, c) => s + c.close, 0) / period;
        const std = Math.sqrt(slice.reduce((s, c) => s + Math.pow(c.close - mean, 2), 0) / period);
        const upper = mean + multiplier * std;
        const lower = mean - multiplier * std;
        const x = xForIdx(i);
        if (!startedU) { pathU.moveTo(x, yForPrice(upper)); pathL.moveTo(x, yForPrice(lower)); startedU = startedL = true; }
        else { pathU.lineTo(x, yForPrice(upper)); pathL.lineTo(x, yForPrice(lower)); }
      });
      ctx.stroke(pathU);
      ctx.stroke(pathL);
      ctx.setLineDash([]);
    }

    // Volume bars
    if (showVol) {
      const volY0 = PADDING.top + MAIN_H + VOL_GAP;
      const maxVol = Math.max(...candles.map(c => c.volume));
      candles.forEach((candle, i) => {
        const x = xForIdx(i);
        const volH = (candle.volume / maxVol) * VOL_H;
        ctx.fillStyle = candle.close >= candle.open ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)';
        ctx.fillRect(x - candleW / 2, volY0 + VOL_H - volH, candleW, volH);
      });
      ctx.fillStyle = c.text3;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('VOL', W - PADDING.right + 50, volY0 + 10);
    }

    // Crosshair — theme-aware
    if (crosshair.visible) {
      ctx.strokeStyle = c.text2 + '66';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, crosshair.y);
      ctx.lineTo(W - PADDING.right, crosshair.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crosshair.x, PADDING.top);
      ctx.lineTo(crosshair.x, PADDING.top + MAIN_H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price label — theme-aware
      const hoverPrice = maxP - ((crosshair.y - PADDING.top) / MAIN_H) * priceRange;
      ctx.fillStyle = c.surface2;
      ctx.fillRect(W - PADDING.right + 1, crosshair.y - 9, PADDING.right - 3, 18);
      ctx.fillStyle = c.text1;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(hoverPrice >= 1 ? hoverPrice.toFixed(2) : hoverPrice.toFixed(5), W - PADDING.right + 3, crosshair.y + 4);
    }

  }, [candles, indicators, chartType, crosshair, c]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw();
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const idx = Math.floor((x / (canvasRef.current!.width - 64)) * candles.length);
    setCrosshair({ x, y, visible: true, candleIdx: Math.max(0, Math.min(candles.length - 1, idx)) });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const idx = Math.floor((x / (canvasRef.current!.width - 64)) * candles.length);
    setCrosshair({ x, y, visible: true, candleIdx: Math.max(0, Math.min(candles.length - 1, idx)) });
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCrosshair((prev: any) => ({ ...prev, visible: false }))}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setCrosshair((prev: any) => ({ ...prev, visible: false }))}
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}

// ─── Indicator Panel ─────────────────────────────────────────
function IndicatorPanel({ indicators, onChange, onClose }: {
  indicators: Indicator[];
  onChange: (updated: Indicator[]) => void;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const toggle = (id: string) => {
    onChange(indicators.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full rounded-t-3xl flex flex-col"
        style={{ background: c.surface, border: `1px solid ${c.borderSolid}`, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3"><div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} /></div>
        <div className="px-5 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: c.text1, fontSize: 17, fontWeight: 700 }}>Chỉ báo kỹ thuật</h3>
            <button onClick={onClose}><X size={20} color={c.text2} /></button>
          </div>
          <div className="flex flex-col gap-2">
            {indicators.map(ind => (
              <button key={ind.id} onClick={() => toggle(ind.id)}
                className="flex items-center gap-3 w-full rounded-2xl p-3"
                style={{ background: ind.enabled ? c.surface2 : c.surface, border: `1px solid ${ind.enabled ? ind.color + '44' : c.borderSolid}` }}>
                <div className="w-3 h-3 rounded-full" style={{ background: ind.color }} />
                <span style={{ color: ind.enabled ? c.text1 : c.text2, fontSize: 14, fontWeight: ind.enabled ? 600 : 400, flex: 1, textAlign: 'left' }}>
                  {ind.label}
                </span>
                <div className="w-6 h-6 rounded-full border flex items-center justify-center"
                  style={{ borderColor: ind.enabled ? ind.color : c.borderSolid, background: ind.enabled ? ind.color : 'transparent' }}>
                  {ind.enabled && <Check size={13} color="#fff" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export function AdvancedChartPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const goBack = useGoBack();
  const { pairId } = useParams();
  const c = useThemeColors();

  const pair = CRYPTO_PAIRS.find(p => p.id === pairId) ?? CRYPTO_PAIRS[0];

  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('candle');
  const [indicators, setIndicators] = useState<Indicator[]>(DEFAULT_INDICATORS);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showTimeframes, setShowTimeframes] = useState(false);
  const [crosshair, setCrosshair] = useState({ x: 0, y: 0, visible: false, candleIdx: -1 });

  const candles = useMemo(() => {
    const raw = generateChartData(pair.price, 80);
    return raw as Candle[];
  }, [pair.price, timeframe]);

  const hoveredCandle = crosshair.candleIdx >= 0 ? candles[crosshair.candleIdx] : candles[candles.length - 1];
  const isHoveredUp = hoveredCandle ? hoveredCandle.close >= hoveredCandle.open : true;

  const activeIndicatorCount = indicators.filter(i => i.enabled).length;

  return (
    <div className="flex flex-col h-full" style={{ background: c.bg }}>
      {showIndicators && (
        <IndicatorPanel
          indicators={indicators}
          onChange={setIndicators}
          onClose={() => setShowIndicators(false)}
        />
      )}

      {/* Header + Breadcrumb */}
      <Header variant="custom" breadcrumb>
        <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
          <button onClick={goBack}
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: c.hoverBg }}>
            <ChevronLeft size={20} color={c.text1} />
          </button>

          <button onClick={() => navigate(`${prefix}/markets`)}
            className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: pair.logoColor + '22' }}>
              <span style={{ color: pair.logoColor, fontSize: 8, fontWeight: 700 }}>{pair.baseAsset.slice(0,3)}</span>
            </div>
            <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{pair.symbol}</span>
            <ChevronDown size={14} color={c.text2} />
          </button>

          <div className="text-right mr-1">
            <p style={{ color: pair.change24h >= 0 ? '#10B981' : '#EF4444', fontSize: 15, fontWeight: 700, fontFamily: 'monospace' }}>
              {fmtPrice(pair.price)}
            </p>
            <p style={{ color: pair.change24h >= 0 ? '#10B981' : '#EF4444', fontSize: 11 }}>
              {fmtPct(pair.change24h)}
            </p>
          </div>
        </div>
      </Header>

      {/* OHLCV info bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 overflow-x-auto" style={{ borderBottom: `1px solid ${c.divider}`, scrollbarWidth: 'none' }}>
        {hoveredCandle && (
          <div className="contents">
            <span style={{ color: isHoveredUp ? '#10B981' : '#EF4444', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>
              {crosshair.visible ? hoveredCandle.time : 'Mới nhất'}
            </span>
            {[
              { label: 'O', value: hoveredCandle.open },
              { label: 'H', value: hoveredCandle.high, color: '#10B981' },
              { label: 'L', value: hoveredCandle.low, color: '#EF4444' },
              { label: 'C', value: hoveredCandle.close, color: isHoveredUp ? '#10B981' : '#EF4444' },
            ].map(item => (
              <span key={item.label} style={{ color: c.text3, fontSize: 10, whiteSpace: 'nowrap' }}>
                <span style={{ color: c.text2 }}>{item.label}:</span>
                <span style={{ color: (item as any).color ?? c.text1, fontFamily: 'monospace' }}>
                  {item.value >= 100 ? item.value.toFixed(2) : item.value >= 1 ? item.value.toFixed(3) : item.value.toFixed(5)}
                </span>
              </span>
            ))}
            <span style={{ color: c.text3, fontSize: 10, whiteSpace: 'nowrap' }}>
              <span style={{ color: c.text2 }}>Vol:</span>
              <span style={{ color: c.text1, fontFamily: 'monospace' }}>
                {(hoveredCandle.volume / 1000).toFixed(1)}K
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5" style={{ borderBottom: `1px solid ${c.divider}` }}>
        {/* Timeframe */}
        <div className="flex gap-0.5 mr-1">
          {TIMEFRAMES.map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{ background: timeframe === tf ? '#3B82F6' : 'transparent', color: timeframe === tf ? '#fff' : c.text3 }}>
              {tf}
            </button>
          ))}
        </div>

        <div className="w-px h-5 mx-1" style={{ background: c.borderSolid }} />

        {/* Chart type */}
        {CHART_TYPES.map(ct => (
          <button key={ct.id} onClick={() => setChartType(ct.id as any)}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: chartType === ct.id ? c.borderSolid : 'transparent' }}>
            <span style={{ fontSize: 13 }}>{ct.icon}</span>
          </button>
        ))}

        <div className="w-px h-5 mx-1" style={{ background: c.borderSolid }} />

        {/* Indicators */}
        <button onClick={() => setShowIndicators(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <Layers size={13} color={activeIndicatorCount > 0 ? '#3B82F6' : c.text2} />
          <span style={{ color: activeIndicatorCount > 0 ? '#3B82F6' : c.text2, fontSize: 11 }}>
            {activeIndicatorCount > 0 ? `${activeIndicatorCount} chỉ báo` : 'Chỉ báo'}
          </span>
        </button>
      </div>

      {/* Main Chart */}
      <div className="flex-1 relative">
        <CandlestickChart
          candles={candles}
          indicators={indicators}
          chartType={chartType}
          crosshair={crosshair}
          setCrosshair={setCrosshair}
        />

        {/* Active indicator legend */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {indicators.filter(i => i.enabled && i.id !== 'vol').map(ind => (
            <span key={ind.id} className="px-1.5 py-0.5 rounded-md text-xs"
              style={{ background: 'rgba(11,14,23,0.8)', color: ind.color, border: `1px solid ${ind.color}33` }}>
              {ind.label}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="px-3 py-2 flex gap-2" style={{ borderTop: `1px solid ${c.divider}` }}>
        <button
          onClick={() => navigate(`${prefix}/trade/${pairId}`)}
          className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-semibold"
          style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', fontSize: 14 }}>
          MUA
        </button>
        <button
          onClick={() => navigate(`${prefix}/trade/${pairId}?side=sell`)}
          className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-2 font-semibold"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', fontSize: 14 }}>
          BÁN
        </button>
        <button
          onClick={() => navigate(`${prefix}/markets/alerts`)}
          className="h-11 w-11 rounded-2xl flex items-center justify-center"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
          <AlertCircle size={18} color="#F59E0B" />
        </button>
      </div>
    </div>
  );
}