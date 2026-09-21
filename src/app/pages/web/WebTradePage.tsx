import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ChevronDown,
  Info,
  ArrowLeftRight,
  BarChart3,
  Repeat,
  Star,
  Settings,
  Maximize2,
  Keyboard,
  CandlestickChart,
  LineChart,
  Minus,
  TrendingUp,
  Trash2,
  PenTool,
  Columns2,
  LayoutGrid,
  Layers,
  X,
  Bell,
  Calculator,
  ExternalLink,
  ScanLine,
  PieChart,
} from 'lucide-react';
import {
  createChart,
  CandlestickSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
} from 'lightweight-charts';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { OrderBook } from '../../components/trading/OrderBook';
import { DrawingOverlay } from '../../components/trading/DrawingOverlay';
import { DepthChart } from '../../components/trading/DepthChart';
import { PriceAlertPanel } from '../../components/trading/PriceAlertPanel';
import { TradeConfirmModal } from '../../components/trading/TradeConfirmModal';
import type { OrderDetails } from '../../components/trading/TradeConfirmModal';
import { PnLCalculator } from '../../components/trading/PnLCalculator';
import { WebAdvancedOrders } from '../../components/trading/WebAdvancedOrders';
import { DetachablePanel, useDetachableWindows } from '../../components/trading/DetachablePanel';
import type { DrawingTool } from '../../components/trading/DrawingOverlay';
import {
  CRYPTO_PAIRS,
  USER_ASSETS,
  OPEN_ORDERS,
  ORDER_HISTORY,
  generateRecentTrades,
  generateChartData,
} from '../../data/mockData';
import { fmtPrice, fmtAmount, fmtUsd, fmtPct, fmtCompact } from '../../data/formatNumber';
import type { RecentTrade } from '../../data/mockData';
import { WEB_FULL_BLEED_HEIGHT } from '../../components/layout/webConstants';

/**
 * ══════════════════════════════════════════════════════════
 *  WebTradePage v3 — Professional Trading Terminal
 * ══════════════════════════════════════════════════════════
 *
 *  v3 additions:
 *  ● Drawing tools (trendline, fibonacci retracement, h-line, eraser)
 *  ● Real-time WebSocket-simulated candle feed (series.update)
 *  ● Depth chart visualization (canvas-based bid/ask curves)
 *  ● Multi-chart layout: Single | Split Horizontal | Split Vertical
 *
 *  Preserved from v2:
 *  ● lightweight-charts v5 (candle + area + volume histogram)
 *  ● Keyboard shortcuts: B/S/Esc + D (drawing toggle) + 1-4 (tools)
 *  ● Dark mode optimized chart theming
 *  ● 3-panel layout: Chart | Orderbook | Order Form
 *  ● Bottom panel: Open Orders / History / Recent Trades / Depth
 */

/* ─── Constants ─── */
const TIMEFRAMES = ['1m', '5m', '15m', '1H', '4H', '1D', '1W'];
const ORDER_TYPES = ['Giới hạn', 'Thị trường', 'Dừng lỗ'];
const PCT_BUTTONS = [25, 50, 75, 100];

const TIMEFRAME_POINTS: Record<string, number> = {
  '1m': 60,
  '5m': 60,
  '15m': 48,
  '1H': 48,
  '4H': 48,
  '1D': 60,
  '1W': 52,
};

const TIMEFRAME_INTERVAL: Record<string, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1H': 3600,
  '4H': 14400,
  '1D': 86400,
  '1W': 604800,
};

type LayoutMode = 'single' | 'split-h' | 'split-v';

/* second pair for split view */
const SPLIT_PAIRS = CRYPTO_PAIRS.filter((p) =>
  ['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt'].includes(p.id),
);

/* ─── Theme Colors for lightweight-charts ─── */
function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    isDark,
    layout: {
      background: { type: ColorType.Solid as const, color: isDark ? '#0F1117' : '#FFFFFF' },
      textColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      fontSize: 12,
    },
    grid: {
      vertLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
      horzLines: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
        width: 1 as const,
        style: LineStyle.Dashed,
        labelBackgroundColor: isDark ? '#1E2028' : '#F3F4F6',
      },
      horzLine: {
        color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
        width: 1 as const,
        style: LineStyle.Dashed,
        labelBackgroundColor: isDark ? '#1E2028' : '#F3F4F6',
      },
    },
    rightPriceScale: {
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    timeScale: {
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      timeVisible: true,
      secondsVisible: false,
    },
    candle: {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    },
    area: {
      topColor: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.25)',
      bottomColor: isDark ? 'rgba(59,130,246,0.02)' : 'rgba(59,130,246,0.02)',
      lineColor: '#3B82F6',
      lineWidth: 2 as const,
    },
    volume: {
      upColor: isDark ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.2)',
      downColor: isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)',
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   TradingChart v3 — with real-time candle feed
   ═══════════════════════════════════════════════════════════ */
function TradingChart({
  pair,
  timeframe,
  chartType,
  compact,
}: {
  pair: (typeof CRYPTO_PAIRS)[0];
  timeframe: string;
  chartType: 'candle' | 'area';
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const ct = useChartTheme();
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const points = TIMEFRAME_POINTS[timeframe] ?? 48;
    const rawData = generateChartData(pair.price, points);
    const interval = TIMEFRAME_INTERVAL[timeframe] ?? 3600;
    const now = Math.floor(Date.now() / 1000);

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: ct.layout,
      grid: ct.grid,
      crosshair: ct.crosshair,
      rightPriceScale: {
        borderColor: ct.rightPriceScale.borderColor,
        scaleMargins: { top: 0.08, bottom: compact ? 0.05 : 0.22 },
      },
      timeScale: ct.timeScale,
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true },
    });
    chartRef.current = chart;

    if (chartType === 'candle') {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: ct.candle.upColor,
        downColor: ct.candle.downColor,
        borderUpColor: ct.candle.borderUpColor,
        borderDownColor: ct.candle.borderDownColor,
        wickUpColor: ct.candle.wickUpColor,
        wickDownColor: ct.candle.wickDownColor,
      });
      const candleData = rawData.map((d, i) => ({
        time: (now - (rawData.length - i) * interval) as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      candleSeries.setData(candleData);
      seriesRef.current = candleSeries;

      if (!compact) {
        const volumeSeries = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' as any },
          priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        const volumeData = rawData.map((d, i) => ({
          time: (now - (rawData.length - i) * interval) as any,
          value: d.volume,
          color: d.close >= d.open ? ct.volume.upColor : ct.volume.downColor,
        }));
        volumeSeries.setData(volumeData);
        volumeSeriesRef.current = volumeSeries;
      }
    } else {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: ct.area.topColor,
        bottomColor: ct.area.bottomColor,
        lineColor: ct.area.lineColor,
        lineWidth: ct.area.lineWidth,
      });
      const areaData = rawData.map((d, i) => ({
        time: (now - (rawData.length - i) * interval) as any,
        value: d.close,
      }));
      areaSeries.setData(areaData);
      seriesRef.current = areaSeries;
    }

    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [pair.price, timeframe, chartType, theme, compact]);

  /* ─── Real-time candle feed simulation ─── */
  useEffect(() => {
    const interval = TIMEFRAME_INTERVAL[timeframe] ?? 3600;
    let lastPrice = pair.price;
    let currentBar: { time: any; open: number; high: number; low: number; close: number } | null =
      null;

    const feedId = setInterval(() => {
      if (!seriesRef.current) return;

      const delta = (Math.random() - 0.495) * lastPrice * 0.0015;
      lastPrice = parseFloat((lastPrice + delta).toFixed(2));

      const now = Math.floor(Date.now() / 1000);
      const barTime = Math.floor(now / interval) * interval;

      if (!currentBar || (currentBar.time as number) !== barTime) {
        // New bar
        currentBar = {
          time: barTime as any,
          open: lastPrice,
          high: lastPrice,
          low: lastPrice,
          close: lastPrice,
        };
      } else {
        // Update existing bar
        currentBar.close = lastPrice;
        currentBar.high = Math.max(currentBar.high, lastPrice);
        currentBar.low = Math.min(currentBar.low, lastPrice);
      }

      try {
        if (chartType === 'candle') {
          seriesRef.current.update(currentBar);
          // Update volume bar too
          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update({
              time: barTime as any,
              value: Math.random() * 50 + 10,
              color:
                currentBar.close >= currentBar.open
                  ? theme === 'dark'
                    ? 'rgba(16,185,129,0.25)'
                    : 'rgba(16,185,129,0.2)'
                  : theme === 'dark'
                    ? 'rgba(239,68,68,0.25)'
                    : 'rgba(239,68,68,0.2)',
            });
          }
        } else {
          seriesRef.current.update({ time: barTime as any, value: lastPrice });
        }
      } catch (_) {
        // Chart may have been disposed
      }
    }, 800);

    return () => clearInterval(feedId);
  }, [pair.price, timeframe, chartType, theme]);

  return <div ref={containerRef} className="w-full h-full" />;
}

/* ═══════════════════════════════════════════════════════════
   Drawing Toolbar
   ═══════════════════════════════════════════════════════════ */
function DrawingToolbar({
  activeTool,
  onToolChange,
  drawingCount,
  isDark,
  panelBorder,
}: {
  activeTool: DrawingTool;
  onToolChange: (t: DrawingTool) => void;
  drawingCount: number;
  isDark: boolean;
  panelBorder: string;
}) {
  const c = useThemeColors();
  const tools: { id: DrawingTool; icon: React.ComponentType<any>; label: string; key: string }[] = [
    { id: 'trendline', icon: TrendingUp, label: 'Trendline', key: '1' },
    { id: 'fibonacci', icon: Layers, label: 'Fibonacci', key: '2' },
    { id: 'hline', icon: Minus, label: 'H-Line', key: '3' },
    { id: 'eraser', icon: Trash2, label: 'Xóa', key: '4' },
  ];

  return (
    <div
      className="flex items-center gap-0.5 px-1 py-0.5 rounded-lg"
      style={{
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${panelBorder}`,
      }}
    >
      {tools.map((t) => {
        const Icon = t.icon;
        const active = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onToolChange(active ? 'none' : t.id)}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{
              background: active
                ? t.id === 'eraser'
                  ? 'rgba(239,68,68,0.15)'
                  : 'rgba(59,130,246,0.15)'
                : 'transparent',
            }}
            title={`${t.label} (${t.key})`}
          >
            <Icon
              size={13}
              color={active ? (t.id === 'eraser' ? '#EF4444' : '#3B82F6') : c.text3}
            />
          </button>
        );
      })}
      {drawingCount > 0 && (
        <span style={{ color: c.text3, fontSize: 10, marginLeft: 2 }}>{drawingCount}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Layout Selector
   ═══════════════════════════════════════════════════════════ */
function LayoutSelector({
  layout,
  onLayoutChange,
  isDark,
  panelBorder,
}: {
  layout: LayoutMode;
  onLayoutChange: (l: LayoutMode) => void;
  isDark: boolean;
  panelBorder: string;
}) {
  const c = useThemeColors();
  const layouts: { id: LayoutMode; icon: React.ComponentType<any>; label: string }[] = [
    { id: 'single', icon: Maximize2, label: 'Single' },
    { id: 'split-h', icon: Columns2, label: 'Split H' },
    { id: 'split-v', icon: LayoutGrid, label: 'Split V' },
  ];

  return (
    <div
      className="flex items-center gap-0.5 px-1 py-0.5 rounded-lg"
      style={{
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${panelBorder}`,
      }}
    >
      {layouts.map((l) => {
        const Icon = l.icon;
        return (
          <button
            key={l.id}
            onClick={() => onLayoutChange(l.id)}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
            style={{ background: layout === l.id ? 'rgba(59,130,246,0.15)' : 'transparent' }}
            title={l.label}
          >
            <Icon size={13} color={layout === l.id ? '#3B82F6' : c.text3} />
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Compact Order Form (unchanged from v2)
   ═══════════════════════════════════════════════════════════ */
function CompactOrderForm({
  pair,
  side: controlledSide,
  onSideChange,
  onSubmit,
}: {
  pair: (typeof CRYPTO_PAIRS)[0];
  side: 'buy' | 'sell';
  onSideChange: (s: 'buy' | 'sell') => void;
  onSubmit?: (order: OrderDetails) => void;
}) {
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const usdtAsset = USER_ASSETS.find((a) => a.symbol === 'USDT')!;
  const baseAsset = USER_ASSETS.find((a) => a.symbol === pair.baseAsset);

  const [orderType, setOrderType] = useState('Giới hạn');
  const [limitPrice, setLimitPrice] = useState(pair.price.toFixed(2));
  const [amount, setAmount] = useState('');
  const [activePct, setActivePct] = useState<number | null>(null);

  const side = controlledSide;
  const available = side === 'buy' ? usdtAsset.available : (baseAsset?.available ?? 0);
  const availableLabel = side === 'buy' ? 'USDT' : pair.baseAsset;
  const price = orderType === 'Thị trường' ? pair.price : parseFloat(limitPrice || '0');
  const amountNum = parseFloat(amount || '0');
  const total = price * amountNum;
  const fee = total * 0.001;
  const sideColor = side === 'buy' ? '#10B981' : '#EF4444';
  const canPlace = amountNum > 0 && (orderType === 'Thị trường' || parseFloat(limitPrice) > 0);

  useEffect(() => {
    setAmount('');
    setActivePct(null);
  }, [controlledSide]);

  const handlePct = (pct: number) => {
    setActivePct(pct);
    if (side === 'buy') setAmount(((available * pct) / 100 / price).toFixed(6));
    else setAmount(((available * pct) / 100).toFixed(6));
  };

  const fmt = (v: string) => v.replace(/[^\d.]/g, '');
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <div className="flex flex-col gap-3">
      {/* Buy / Sell */}
      <div
        className="flex rounded-lg overflow-hidden"
        style={{ border: `1px solid ${inputBorder}` }}
      >
        <button
          onClick={() => onSideChange('buy')}
          className="flex-1 py-2.5 flex items-center justify-center transition-colors"
          style={{
            background: side === 'buy' ? '#10B981' : 'transparent',
            color: side === 'buy' ? '#fff' : c.text3,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          MUA{' '}
          <span className="ml-1.5 opacity-50" style={{ fontSize: 10 }}>
            B
          </span>
        </button>
        <button
          onClick={() => onSideChange('sell')}
          className="flex-1 py-2.5 flex items-center justify-center transition-colors"
          style={{
            background: side === 'sell' ? '#EF4444' : 'transparent',
            color: side === 'sell' ? '#fff' : c.text3,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          BÁN{' '}
          <span className="ml-1.5 opacity-50" style={{ fontSize: 10 }}>
            S
          </span>
        </button>
      </div>

      {/* Order type */}
      <div className="flex gap-1.5">
        {ORDER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className="px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: orderType === type ? sideColor + '15' : 'transparent',
              color: orderType === type ? sideColor : c.text3,
              border: `1px solid ${orderType === type ? sideColor + '40' : inputBorder}`,
              fontSize: 12,
              fontWeight: orderType === type ? 700 : 500,
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Available */}
      <div className="flex items-center justify-between">
        <span style={{ color: c.text3, fontSize: 12 }}>Khả dụng</span>
        <span
          style={{
            color: c.text1,
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmtAmount(available, side === 'buy' ? 2 : 6)} {availableLabel}
        </span>
      </div>

      {/* Price input */}
      {orderType !== 'Thị trường' && (
        <div>
          <label
            style={{
              color: c.text3,
              fontSize: 11,
              fontWeight: 600,
              display: 'block',
              marginBottom: 5,
            }}
          >
            {orderType === 'Dừng lỗ' ? 'Giá kích hoạt' : 'Giá'} (USDT)
          </label>
          <div
            className="flex items-center rounded-lg px-3.5"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, height: 40 }}
          >
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={limitPrice}
              onChange={(e) => setLimitPrice(fmt(e.target.value))}
              className="flex-1 bg-transparent outline-none"
              style={{
                color: c.text1,
                fontSize: 14,
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
              }}
            />
            <span style={{ color: c.text3, fontSize: 12, fontWeight: 600 }}>USDT</span>
          </div>
        </div>
      )}

      {/* Amount */}
      <div>
        <label
          style={{
            color: c.text3,
            fontSize: 11,
            fontWeight: 600,
            display: 'block',
            marginBottom: 5,
          }}
        >
          Khối lượng ({pair.baseAsset})
        </label>
        <div
          className="flex items-center rounded-lg px-3.5"
          style={{ background: inputBg, border: `1px solid ${inputBorder}`, height: 40 }}
        >
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.000000"
            value={amount}
            onChange={(e) => {
              setAmount(fmt(e.target.value));
              setActivePct(null);
            }}
            className="flex-1 bg-transparent outline-none"
            style={{
              color: c.text1,
              fontSize: 14,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <span style={{ color: c.text3, fontSize: 12, fontWeight: 600 }}>{pair.baseAsset}</span>
        </div>
      </div>

      {/* Pct buttons */}
      <div className="flex gap-2">
        {PCT_BUTTONS.map((pct) => (
          <button
            key={pct}
            onClick={() => handlePct(pct)}
            className="flex-1 py-1.5 rounded-lg transition-colors"
            style={{
              background: activePct === pct ? sideColor + '15' : 'transparent',
              color: activePct === pct ? sideColor : c.text3,
              border: `1px solid ${activePct === pct ? sideColor + '40' : inputBorder}`,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-lg p-3" style={{ background: inputBg }}>
        <div className="flex justify-between items-center mb-1.5">
          <span style={{ color: c.text3, fontSize: 12 }}>Thành tiền</span>
          <span
            style={{
              color: c.text1,
              fontSize: 14,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtUsd(total)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1" style={{ color: c.text3, fontSize: 11 }}>
            Phí (0.1%) <Info size={11} />
          </span>
          <span style={{ color: c.text3, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
            ≈ ${fee.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        disabled={!canPlace}
        className="w-full rounded-xl flex items-center justify-center text-white transition-all"
        style={{
          height: 44,
          background: !canPlace
            ? inputBg
            : side === 'buy'
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
          color: !canPlace ? c.text3 : '#fff',
          fontSize: 14,
          fontWeight: 700,
          boxShadow: canPlace
            ? side === 'buy'
              ? '0 4px 12px rgba(16,185,129,0.3)'
              : '0 4px 12px rgba(239,68,68,0.3)'
            : 'none',
        }}
        onClick={() => {
          if (onSubmit) {
            onSubmit({
              side,
              type: orderType,
              pair: pair.symbol,
              baseAsset: pair.baseAsset,
              price,
              amount: amountNum,
              total,
              fee,
              available,
              availableAsset: availableLabel,
              livePrice: pair.price,
            });
          }
        }}
      >
        {!canPlace ? 'Nhập thông tin lệnh' : `${side === 'buy' ? 'Mua' : 'Bán'} ${pair.baseAsset}`}
      </button>

      {/* Keyboard hint */}
      <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
        {[
          { k: 'B', l: 'Mua' },
          { k: 'S', l: 'Bán' },
          { k: 'D', l: 'Draw' },
          { k: 'A', l: 'Alert' },
          { k: 'P', l: 'PnL' },
          { k: 'Esc', l: 'Reset' },
        ].map((h) => (
          <span
            key={h.k}
            className="flex items-center gap-1"
            style={{ color: c.text3, fontSize: 10 }}
          >
            <kbd
              className="px-1.5 py-0.5 rounded"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, fontSize: 10 }}
            >
              {h.k}
            </kbd>{' '}
            {h.l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Recent Trades Panel ─── */
function RecentTradesPanel({ price }: { price: number }) {
  const c = useThemeColors();
  const [trades, setTrades] = useState<RecentTrade[]>(() => generateRecentTrades(price));
  useEffect(() => {
    const id = setInterval(() => setTrades(generateRecentTrades(price)), 3000);
    return () => clearInterval(id);
  }, [price]);

  return (
    <div className="flex flex-col">
      <div
        className="grid items-center py-2 px-4"
        style={{ gridTemplateColumns: '1fr 1fr 64px', borderBottom: `1px solid ${c.divider}` }}
      >
        <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>Giá</span>
        <span style={{ color: c.text3, fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
          KL
        </span>
        <span style={{ color: c.text3, fontSize: 11, fontWeight: 600, textAlign: 'right' }}>
          Giờ
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none" style={{ maxHeight: 220 }}>
        {trades.slice(0, 15).map((t, i) => (
          <div
            key={`${t.id}-${i}`}
            className="grid items-center py-1 px-4"
            style={{ gridTemplateColumns: '1fr 1fr 64px' }}
          >
            <span
              style={{
                color: t.side === 'buy' ? '#10B981' : '#EF4444',
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {fmtPrice(t.price)}
            </span>
            <span
              style={{
                color: c.text2,
                fontSize: 12,
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'right',
              }}
            >
              {fmtAmount(t.amount, 4)}
            </span>
            <span style={{ color: c.text3, fontSize: 11, textAlign: 'right' }}>{t.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Keyboard Shortcuts Toast ─── */
function ShortcutToast({ action, visible }: { action: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-lg"
      style={{
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        backdropFilter: 'blur(12px)',
        animation: 'fadeInOut 1.2s ease-in-out forwards',
      }}
    >
      <span className="flex items-center gap-2">
        <Keyboard size={14} /> {action}
      </span>
    </div>
  );
}

/* ─── Live Feed Indicator ─── */
function LiveIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
      style={{ background: 'rgba(16,185,129,0.08)' }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: '#10B981', animation: 'livePulse 2s ease-in-out infinite' }}
      />
      <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>LIVE</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — WebTradePage v3
   ═══════════════════════════════════════════════════════════ */
export function WebTradePage() {
  const navigate = useNavigate();
  const { pairId } = useParams();
  const [searchParams] = useSearchParams();
  const c = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const prefix = useRoutePrefix();

  const pair = CRYPTO_PAIRS.find((p) => p.id === pairId) ?? CRYPTO_PAIRS[0];
  const isPositive = pair.change24h >= 0;

  // State
  const [timeframe, setTimeframe] = useState('1H');
  const [chartType, setChartType] = useState<'candle' | 'area'>('candle');
  const [bottomTab, setBottomTab] = useState<'orders' | 'history' | 'trades' | 'depth'>('orders');
  const [isFavorite, setIsFavorite] = useState(pair.isFavorite);
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>(
    (searchParams.get('side') ?? 'buy') as any,
  );

  // v3 features
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('none');
  const [drawingCount, setDrawingCount] = useState(0);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single');
  const [splitPairId, setSplitPairId] = useState('ethusdt');

  const splitPair = CRYPTO_PAIRS.find((p) => p.id === splitPairId) ?? CRYPTO_PAIRS[1];

  // v4 features: alerts, confirm modal, PnL calculator
  const [showAlerts, setShowAlerts] = useState(false);
  const [showPnL, setShowPnL] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<OrderDetails | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ action: string; visible: boolean }>({
    action: '',
    visible: false,
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const showToast = useCallback((action: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ action, visible: true });
    toastTimer.current = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 1200);
  }, []);

  // Live price
  const [livePrice, setLivePrice] = useState(pair.price);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setLivePrice((prev) => {
        const delta = (Math.random() - 0.495) * prev * 0.001;
        const next = parseFloat((prev + delta).toFixed(2));
        setPriceFlash(next > prev ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 500);
        return next;
      });
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // ─── Keyboard shortcuts (extended) ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'b':
        case 'B':
          e.preventDefault();
          setOrderSide('buy');
          showToast('Chuyển sang MUA (B)');
          break;
        case 's':
        case 'S':
          e.preventDefault();
          setOrderSide('sell');
          showToast('Chuyển sang BÁN (S)');
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          setDrawingTool((prev) => (prev === 'none' ? 'trendline' : 'none'));
          showToast(drawingTool === 'none' ? 'Drawing ON — Trendline' : 'Drawing OFF');
          break;
        case '1':
          if (drawingTool !== 'none' || e.ctrlKey) break;
          e.preventDefault();
          setDrawingTool('trendline');
          showToast('Tool: Trendline (1)');
          break;
        case '2':
          if (drawingTool !== 'none' && drawingTool !== 'trendline') break;
          e.preventDefault();
          setDrawingTool('fibonacci');
          showToast('Tool: Fibonacci (2)');
          break;
        case '3':
          e.preventDefault();
          setDrawingTool('hline');
          showToast('Tool: H-Line (3)');
          break;
        case '4':
          e.preventDefault();
          setDrawingTool('eraser');
          showToast('Tool: Eraser (4)');
          break;
        case 'Escape':
          e.preventDefault();
          if (confirmModal) {
            setConfirmModal(false);
            setPendingOrder(null);
            showToast('Đóng xác nhận (Esc)');
          } else if (showAlerts) {
            setShowAlerts(false);
            showToast('Đóng cảnh báo (Esc)');
          } else if (showPnL) {
            setShowPnL(false);
            showToast('Đóng PnL (Esc)');
          } else if (drawingTool !== 'none') {
            setDrawingTool('none');
            showToast('Drawing OFF (Esc)');
          } else {
            setOrderSide('buy');
            showToast('Reset form (Esc)');
          }
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          setShowAlerts((p) => !p);
          setShowPnL(false);
          showToast(showAlerts ? 'Đóng cảnh báo' : 'Mở cảnh báo giá (A)');
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setShowPnL((p) => !p);
          setShowAlerts(false);
          showToast(showPnL ? 'Đóng PnL' : 'Mở PnL Calculator (P)');
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showToast, drawingTool, confirmModal, showAlerts, showPnL]);

  // Theme-derived colors
  const panelBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const panelBg = isDark ? '#0F1117' : '#FFFFFF';
  const topBarBg = isDark ? '#13151D' : '#F8F9FA';
  const activeBtnBg = isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)';

  /* ─── Chart Area based on layout mode ─── */
  const renderChartArea = () => {
    const mainChart = (
      <div className="relative flex-1 min-h-0" style={{ background: panelBg }}>
        <TradingChart pair={pair} timeframe={timeframe} chartType={chartType} />
        <DrawingOverlay activeTool={drawingTool} onDrawingCount={setDrawingCount} />
      </div>
    );

    if (layoutMode === 'single') return mainChart;

    if (layoutMode === 'split-h') {
      return (
        <div className="flex flex-1 min-h-0">
          <div
            className="relative flex-1 min-w-0"
            style={{ background: panelBg, borderRight: `1px solid ${panelBorder}` }}
          >
            {/* Label */}
            <div
              className="absolute top-2 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{
                background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span style={{ color: pair.logoColor, fontSize: 11, fontWeight: 700 }}>
                {pair.symbol}
              </span>
            </div>
            <TradingChart pair={pair} timeframe={timeframe} chartType={chartType} compact />
            <DrawingOverlay activeTool={drawingTool} onDrawingCount={setDrawingCount} />
          </div>
          <div className="relative flex-1 min-w-0" style={{ background: panelBg }}>
            <div
              className="absolute top-2 left-3 z-10 flex items-center gap-2 px-2 py-1 rounded-lg"
              style={{
                background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span style={{ color: splitPair.logoColor, fontSize: 11, fontWeight: 700 }}>
                {splitPair.symbol}
              </span>
              <select
                value={splitPairId}
                onChange={(e) => setSplitPairId(e.target.value)}
                className="bg-transparent outline-none"
                style={{ color: c.text3, fontSize: 10, width: 56 }}
              >
                {SPLIT_PAIRS.filter((p) => p.id !== pair.id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.baseAsset}
                  </option>
                ))}
              </select>
            </div>
            <TradingChart pair={splitPair} timeframe={timeframe} chartType={chartType} compact />
          </div>
        </div>
      );
    }

    // split-v: chart on top, depth on bottom
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="relative flex-1 min-h-0" style={{ background: panelBg }}>
          <TradingChart pair={pair} timeframe={timeframe} chartType={chartType} />
          <DrawingOverlay activeTool={drawingTool} onDrawingCount={setDrawingCount} />
        </div>
        <div
          className="shrink-0"
          style={{ height: 160, borderTop: `1px solid ${panelBorder}`, background: panelBg }}
        >
          <div className="px-4 py-1.5" style={{ borderBottom: `1px solid ${panelBorder}` }}>
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
              Depth Chart — {pair.symbol}
            </span>
          </div>
          <div style={{ height: 130 }}>
            <DepthChart midPrice={livePrice} levels={35} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-0" style={{ height: WEB_FULL_BLEED_HEIGHT }}>
      <ShortcutToast action={toast.action} visible={toast.visible} />

      {/* pulse animation for live indicator */}
      <style>{`@keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ─── Top Bar ─── */}
      <div
        className="flex items-center gap-5 px-5 py-2.5 shrink-0"
        style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
      >
        {/* Pair */}
        <button
          className="flex items-center gap-2.5 shrink-0"
          onClick={() => navigate(`${prefix}/markets`)}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: pair.logoColor + '18' }}
          >
            <span style={{ color: pair.logoColor, fontSize: 11, fontWeight: 700 }}>
              {pair.baseAsset.slice(0, 3)}
            </span>
          </div>
          <span style={{ color: c.text1, fontSize: 16, fontWeight: 700 }}>{pair.symbol}</span>
          <ChevronDown size={15} color={c.text3} />
        </button>

        {/* Price */}
        <div className="flex items-center gap-2.5">
          <span
            style={{
              color: priceFlash === 'up' ? '#10B981' : priceFlash === 'down' ? '#EF4444' : c.text1,
              fontSize: 20,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.3s',
            }}
          >
            ${fmtPrice(livePrice)}
          </span>
          <span
            className="rounded px-2 py-0.5"
            style={{
              background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: isPositive ? '#10B981' : '#EF4444',
              fontSize: 12,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtPct(pair.change24h)}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 flex-1">
          {[
            { l: '24h Cao', v: fmtPrice(pair.high24h), cl: '#10B981' },
            { l: '24h Thấp', v: fmtPrice(pair.low24h), cl: '#EF4444' },
            { l: 'Volume', v: fmtCompact(pair.volume24h, { prefix: '$' }), cl: c.text2 },
            { l: 'MCap', v: fmtCompact(pair.marketCap, { prefix: '$' }), cl: c.text2 },
          ].map((s) => (
            <div key={s.l} className="flex flex-col">
              <span style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>{s.l}</span>
              <span
                style={{
                  color: s.cl,
                  fontSize: 13,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.v}
              </span>
            </div>
          ))}
        </div>

        <LiveIndicator />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="web-cmd-btn w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          >
            <Star
              size={16}
              fill={isFavorite ? '#F59E0B' : 'none'}
              color={isFavorite ? '#F59E0B' : c.text3}
            />
          </button>
          <button
            onClick={() => navigate(`${prefix}/trade/convert`)}
            className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: `1px solid ${panelBorder}` }}
          >
            <ArrowLeftRight size={14} color="#10B981" />
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Convert</span>
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem('dca_preselect', pair.baseAsset);
              navigate(`${prefix}/dca`);
            }}
            className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{
              border: '1px solid rgba(139,92,246,0.2)',
              background: 'rgba(139,92,246,0.04)',
            }}
          >
            <Repeat size={14} color="#8B5CF6" />
            <span style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 600 }}>DCA</span>
          </button>
          <button
            onClick={() => navigate(`${prefix}/trade/${pair.id}/futures`)}
            className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{ border: `1px solid ${panelBorder}` }}
          >
            <BarChart3 size={14} color="#EF4444" />
            <span style={{ color: c.text2, fontSize: 12, fontWeight: 600 }}>Futures</span>
          </button>
          <button
            onClick={() => navigate(`${prefix}/trade/analytics`)}
            className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{
              border: '1px solid rgba(59,130,246,0.2)',
              background: 'rgba(59,130,246,0.04)',
            }}
          >
            <PieChart size={14} color="#3B82F6" />
            <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>Analytics</span>
          </button>
          <button
            onClick={() => navigate(`${prefix}/scanner`)}
            className="web-cmd-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
            style={{
              border: '1px solid rgba(16,185,129,0.2)',
              background: 'rgba(16,185,129,0.04)',
            }}
          >
            <ScanLine size={14} color="#10B981" />
            <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>Scanner</span>
          </button>
          <button
            onClick={() => navigate(`${prefix}/trade/settings`)}
            className="web-cmd-btn w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          >
            <Settings size={16} color={c.text3} />
          </button>
        </div>
      </div>

      {/* ─── Main 3-panel ─── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT: Chart area + bottom */}
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ borderRight: `1px solid ${panelBorder}` }}
        >
          {/* Toolbar bar */}
          <div
            className="flex items-center gap-1.5 px-4 py-2 shrink-0"
            style={{ borderBottom: `1px solid ${panelBorder}`, background: panelBg }}
          >
            {/* Timeframes */}
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className="px-2.5 py-1 rounded-lg transition-colors"
                style={{
                  background: timeframe === tf ? activeBtnBg : 'transparent',
                  color: timeframe === tf ? '#3B82F6' : c.text3,
                  fontSize: 12,
                  fontWeight: timeframe === tf ? 700 : 500,
                }}
              >
                {tf}
              </button>
            ))}

            <div className="w-px h-5 mx-1.5" style={{ background: panelBorder }} />

            {/* Chart type */}
            <button
              onClick={() => setChartType('candle')}
              className="web-cmd-btn w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: chartType === 'candle' ? activeBtnBg : 'transparent' }}
              title="Nến"
            >
              <CandlestickChart size={15} color={chartType === 'candle' ? '#3B82F6' : c.text3} />
            </button>
            <button
              onClick={() => setChartType('area')}
              className="web-cmd-btn w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: chartType === 'area' ? activeBtnBg : 'transparent' }}
              title="Vùng"
            >
              <LineChart size={15} color={chartType === 'area' ? '#3B82F6' : c.text3} />
            </button>

            <div className="w-px h-5 mx-1.5" style={{ background: panelBorder }} />

            {/* Drawing tools */}
            <DrawingToolbar
              activeTool={drawingTool}
              onToolChange={setDrawingTool}
              drawingCount={drawingCount}
              isDark={isDark}
              panelBorder={panelBorder}
            />

            <div className="w-px h-5 mx-1.5" style={{ background: panelBorder }} />

            {/* Layout selector */}
            <LayoutSelector
              layout={layoutMode}
              onLayoutChange={setLayoutMode}
              isDark={isDark}
              panelBorder={panelBorder}
            />

            <div className="flex-1" />

            {/* Drawing mode indicator */}
            {drawingTool !== 'none' && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                <PenTool size={11} color="#3B82F6" />
                <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>
                  {drawingTool === 'trendline'
                    ? 'Trendline'
                    : drawingTool === 'fibonacci'
                      ? 'Fibonacci'
                      : drawingTool === 'hline'
                        ? 'H-Line'
                        : 'Eraser'}
                </span>
                <button onClick={() => setDrawingTool('none')} className="ml-0.5">
                  <X size={10} color="#3B82F6" />
                </button>
              </div>
            )}

            {/* Shortcuts hint */}
            <div className="flex items-center gap-1.5 mr-1">
              <Keyboard size={12} color={c.text3} style={{ opacity: 0.4 }} />
              <span style={{ color: c.text3, fontSize: 10, opacity: 0.4 }}>B/S/D/1-4/Esc</span>
            </div>
          </div>

          {/* Chart area */}
          {renderChartArea()}

          {/* Bottom panel: Orders/History/Trades/Depth */}
          <div
            className="shrink-0"
            style={{ borderTop: `1px solid ${panelBorder}`, maxHeight: 280 }}
          >
            <div
              className="flex items-center gap-0 px-4 py-1.5"
              style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
            >
              {[
                { id: 'orders' as const, label: `Lệnh mở (${OPEN_ORDERS.length})` },
                { id: 'history' as const, label: 'Lịch sử' },
                { id: 'trades' as const, label: 'Giao dịch' },
                { id: 'depth' as const, label: 'Depth' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBottomTab(t.id)}
                  className="px-3.5 py-2 transition-colors"
                  style={{
                    color: bottomTab === t.id ? c.text1 : c.text3,
                    fontSize: 12,
                    fontWeight: bottomTab === t.id ? 700 : 500,
                    borderBottom:
                      bottomTab === t.id ? '2px solid #3B82F6' : '2px solid transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => navigate(`${prefix}/trade/orders-history`)}
                style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}
              >
                Xem tất cả
              </button>
            </div>

            <div
              className="overflow-y-auto scrollbar-none"
              style={{ maxHeight: 220, background: panelBg }}
            >
              {bottomTab === 'orders' &&
                (OPEN_ORDERS.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <span style={{ color: c.text3, fontSize: 13 }}>Không có lệnh đang mở</span>
                  </div>
                ) : (
                  <div>
                    <div
                      className="grid items-center px-4 py-2"
                      style={{
                        gridTemplateColumns: '68px 1fr 1fr 1fr 1fr 68px',
                        borderBottom: `1px solid ${panelBorder}`,
                      }}
                    >
                      {['Loại', 'Cặp', 'Giá', 'KL / Filled', 'Tổng', ''].map((h) => (
                        <span key={h} style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>
                          {h}
                        </span>
                      ))}
                    </div>
                    {OPEN_ORDERS.map((o) => (
                      <div
                        key={o.id}
                        className="grid items-center px-4 py-2 web-cmd-btn transition-colors"
                        style={{
                          gridTemplateColumns: '68px 1fr 1fr 1fr 1fr 68px',
                          borderBottom: `1px solid ${panelBorder}`,
                          minHeight: 40,
                        }}
                      >
                        <span
                          className="rounded px-2 py-0.5 text-center"
                          style={{
                            background:
                              o.side === 'buy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: o.side === 'buy' ? '#10B981' : '#EF4444',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {o.side === 'buy' ? 'MUA' : 'BÁN'}
                        </span>
                        <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                          {o.symbol}
                        </span>
                        <span
                          style={{
                            color: c.text2,
                            fontSize: 12,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {fmtPrice(o.price)}
                        </span>
                        <span
                          style={{
                            color: c.text2,
                            fontSize: 12,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {o.filled}/{o.amount}
                        </span>
                        <span
                          style={{
                            color: c.text2,
                            fontSize: 12,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {fmtUsd(o.price * o.amount)}
                        </span>
                        <button
                          className="px-2.5 py-1 rounded text-center transition-colors"
                          style={{
                            background: 'rgba(239,68,68,0.08)',
                            color: '#EF4444',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

              {bottomTab === 'history' && (
                <div>
                  <div
                    className="grid items-center px-4 py-2"
                    style={{
                      gridTemplateColumns: '68px 1fr 1fr 1fr 1fr 88px',
                      borderBottom: `1px solid ${panelBorder}`,
                    }}
                  >
                    {['Loại', 'Cặp', 'Giá', 'KL', 'Tổng', 'Trạng thái'].map((h) => (
                      <span key={h} style={{ color: c.text3, fontSize: 11, fontWeight: 600 }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  {ORDER_HISTORY.slice(0, 5).map((o) => (
                    <div
                      key={o.id}
                      className="grid items-center px-4 py-2 web-cmd-btn transition-colors"
                      style={{
                        gridTemplateColumns: '68px 1fr 1fr 1fr 1fr 88px',
                        borderBottom: `1px solid ${panelBorder}`,
                        minHeight: 40,
                      }}
                    >
                      <span
                        className="rounded px-2 py-0.5 text-center"
                        style={{
                          background:
                            o.side === 'buy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: o.side === 'buy' ? '#10B981' : '#EF4444',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {o.side === 'buy' ? 'MUA' : 'BÁN'}
                      </span>
                      <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>
                        {o.symbol}
                      </span>
                      <span
                        style={{ color: c.text2, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {fmtPrice(o.price)}
                      </span>
                      <span
                        style={{ color: c.text2, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {o.amount}
                      </span>
                      <span
                        style={{ color: c.text2, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {fmtUsd(o.price * o.amount)}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-center"
                        style={{
                          background:
                            o.status === 'filled'
                              ? 'rgba(16,185,129,0.1)'
                              : o.status === 'cancelled'
                                ? 'rgba(239,68,68,0.1)'
                                : 'rgba(245,158,11,0.1)',
                          color:
                            o.status === 'filled'
                              ? '#10B981'
                              : o.status === 'cancelled'
                                ? '#EF4444'
                                : '#F59E0B',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {o.status === 'filled'
                          ? 'Khớp'
                          : o.status === 'cancelled'
                            ? 'Đã hủy'
                            : 'Một phần'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {bottomTab === 'trades' && <RecentTradesPanel price={livePrice} />}

              {bottomTab === 'depth' && (
                <div style={{ height: 210 }}>
                  <DepthChart midPrice={livePrice} levels={40} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE: Orderbook */}
        <div
          className="flex flex-col shrink-0"
          style={{ width: 280, borderRight: `1px solid ${panelBorder}`, background: panelBg }}
        >
          <div
            className="px-4 py-2.5 shrink-0"
            style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
          >
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Sổ lệnh</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <OrderBook price={livePrice} change24h={pair.change24h} />
          </div>
        </div>

        {/* RIGHT: Order Form */}
        <div className="flex flex-col shrink-0" style={{ width: 340, background: panelBg }}>
          <div
            className="px-4 py-2.5 shrink-0 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${panelBorder}`, background: topBarBg }}
          >
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Đặt lệnh</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setShowAlerts((p) => !p);
                  setShowPnL(false);
                }}
                className="web-cmd-btn w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ background: showAlerts ? 'rgba(245,158,11,0.1)' : 'transparent' }}
                title="Cảnh báo giá (A)"
              >
                <Bell size={13} color={showAlerts ? '#F59E0B' : c.text3} />
              </button>
              <button
                onClick={() => {
                  setShowPnL((p) => !p);
                  setShowAlerts(false);
                }}
                className="web-cmd-btn w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ background: showPnL ? 'rgba(139,92,246,0.1)' : 'transparent' }}
                title="PnL Calculator (P)"
              >
                <Calculator size={13} color={showPnL ? '#8B5CF6' : c.text3} />
              </button>
              <button
                onClick={() => {
                  setShowAdvanced((p) => !p);
                  setShowAlerts(false);
                  setShowPnL(false);
                }}
                className="web-cmd-btn w-7 h-7 rounded-md flex items-center justify-center transition-colors"
                style={{ background: showAdvanced ? 'rgba(59,130,246,0.1)' : 'transparent' }}
                title="Lệnh nâng cao (OCO/TWAP)"
              >
                <Layers size={13} color={showAdvanced ? '#3B82F6' : c.text3} />
              </button>
              <span style={{ color: c.text3, fontSize: 11 }}>{pair.symbol}</span>
            </div>
          </div>
          <div className="relative flex-1 overflow-y-auto scrollbar-none p-4">
            <CompactOrderForm
              pair={pair}
              side={orderSide}
              onSideChange={setOrderSide}
              onSubmit={(order) => {
                setPendingOrder(order);
                setConfirmModal(true);
              }}
            />
            {/* Overlay panels */}
            <PriceAlertPanel
              open={showAlerts}
              onClose={() => setShowAlerts(false)}
              livePrice={livePrice}
              symbol={pair.symbol}
              onAlertTriggered={(a) =>
                showToast(
                  `🔔 Alert: $${a.targetPrice} ${a.direction === 'above' ? '≥' : '≤'} reached!`,
                )
              }
            />
            <PnLCalculator
              open={showPnL}
              onClose={() => setShowPnL(false)}
              livePrice={livePrice}
              symbol={pair.symbol}
              baseAsset={pair.baseAsset}
            />
            <WebAdvancedOrders
              open={showAdvanced}
              onClose={() => setShowAdvanced(false)}
              livePrice={livePrice}
              symbol={pair.symbol}
              baseAsset={pair.baseAsset}
            />
          </div>
        </div>
      </div>

      {/* ─── Trade Confirm Modal ─── */}
      <TradeConfirmModal
        open={confirmModal}
        order={pendingOrder}
        onConfirm={() => {
          setConfirmModal(false);
          setPendingOrder(null);
          showToast('Lệnh đã đặt thành công!');
        }}
        onCancel={() => {
          setConfirmModal(false);
          setPendingOrder(null);
        }}
      />
    </div>
  );
}
