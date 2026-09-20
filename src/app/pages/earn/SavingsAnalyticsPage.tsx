import React, { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar,
  DollarSign, Percent, ArrowUpRight, Layers, Zap, Info,
  RefreshCw, Download, ChevronRight, Target, Sparkles,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtPct, fmtNum } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { useIsDark } from '../../hooks/useIsDark';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, ReferenceLine,
} from 'recharts';
import { ChartGradientDefs, CHART_GRADIENTS } from '../../components/charts/ChartGradientDefs';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

interface YieldDataPoint {
  date: string;
  usdt: number;
  btc: number;
  sol: number;
  eth: number;
  total: number;
}

interface CompoundDataPoint {
  month: string;
  simple: number;
  compound: number;
  difference: number;
}

interface APYTrendPoint {
  date: string;
  flexible: number;
  locked30: number;
  locked60: number;
  weighted: number;
}

interface MonthlyEarningsPoint {
  month: string;
  earned: number;
  deposited: number;
  withdrawn: number;
}

interface AssetAllocation {
  name: string;
  value: number;
  color: string;
  apy: number;
  type: 'flexible' | 'locked';
}

interface ProductPerformance {
  id: string;
  product: string;
  asset: string;
  type: 'flexible' | 'locked';
  invested: number;
  earned: number;
  roi: number;
  apy: number;
  avgApy: number;
  daysActive: number;
  color: string;
  compoundEnabled: boolean;
  compoundBoost: number;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data — Deterministic
   ═══════════════════════════════════════════════════════════ */

const YIELD_HISTORY: YieldDataPoint[] = [
  { date: '01/10', usdt: 0, btc: 0, sol: 0, eth: 0, total: 0 },
  { date: '01/11', usdt: 12.50, btc: 0, sol: 0, eth: 0, total: 12.50 },
  { date: '01/12', usdt: 26.30, btc: 3.20, sol: 0, eth: 0, total: 29.50 },
  { date: '01/01', usdt: 41.80, btc: 7.90, sol: 8.50, eth: 2.10, total: 60.30 },
  { date: '01/02', usdt: 58.20, btc: 13.40, sol: 22.30, eth: 5.80, total: 99.70 },
  { date: '15/02', usdt: 66.90, btc: 16.80, sol: 35.60, eth: 8.20, total: 127.50 },
  { date: '01/03', usdt: 76.40, btc: 20.50, sol: 51.20, eth: 11.60, total: 159.70 },
  { date: '09/03', usdt: 80.12, btc: 22.38, sol: 58.50, eth: 13.36, total: 174.36 },
];

const YIELD_HISTORY_90D: YieldDataPoint[] = [
  { date: '10/12', usdt: 0, btc: 0, sol: 0, eth: 0, total: 0 },
  { date: '25/12', usdt: 8.20, btc: 2.10, sol: 4.30, eth: 1.50, total: 16.10 },
  { date: '10/01', usdt: 18.50, btc: 5.80, sol: 12.40, eth: 3.60, total: 40.30 },
  { date: '25/01', usdt: 29.80, btc: 9.20, sol: 21.50, eth: 5.90, total: 66.40 },
  { date: '10/02', usdt: 42.10, btc: 13.10, sol: 32.80, eth: 8.40, total: 96.40 },
  { date: '25/02', usdt: 55.30, btc: 17.40, sol: 45.20, eth: 11.20, total: 129.10 },
  { date: '09/03', usdt: 62.80, btc: 19.90, sol: 52.60, eth: 13.36, total: 148.66 },
];

const YIELD_HISTORY_30D: YieldDataPoint[] = [
  { date: '08/02', usdt: 0, btc: 0, sol: 0, eth: 0, total: 0 },
  { date: '15/02', usdt: 4.20, btc: 1.80, sol: 3.10, eth: 0.90, total: 10.00 },
  { date: '22/02', usdt: 8.90, btc: 3.60, sol: 6.80, eth: 1.90, total: 21.20 },
  { date: '01/03', usdt: 14.10, btc: 5.50, sol: 11.20, eth: 3.10, total: 33.90 },
  { date: '09/03', usdt: 18.40, btc: 7.20, sol: 14.80, eth: 4.10, total: 44.50 },
];

const COMPOUND_PERFORMANCE: CompoundDataPoint[] = [
  { month: 'T1', simple: 100.00, compound: 100.00, difference: 0 },
  { month: 'T2', simple: 143.75, compound: 144.02, difference: 0.27 },
  { month: 'T3', simple: 287.50, compound: 289.30, difference: 1.80 },
  { month: 'T4', simple: 431.25, compound: 436.12, difference: 4.87 },
  { month: 'T5', simple: 575.00, compound: 584.76, difference: 9.76 },
  { month: 'T6', simple: 718.75, compound: 735.52, difference: 16.77 },
  { month: 'T7', simple: 862.50, compound: 888.70, difference: 26.20 },
  { month: 'T8', simple: 1006.25, compound: 1044.63, difference: 38.38 },
  { month: 'T9', simple: 1150.00, compound: 1203.64, difference: 53.64 },
  { month: 'T10', simple: 1293.75, compound: 1366.08, difference: 72.33 },
  { month: 'T11', simple: 1437.50, compound: 1532.32, difference: 94.82 },
  { month: 'T12', simple: 1581.25, compound: 1702.73, difference: 121.48 },
];

const APY_TRENDS: APYTrendPoint[] = [
  { date: '01/10', flexible: 4.20, locked30: 5.80, locked60: 6.50, weighted: 4.85 },
  { date: '01/11', flexible: 4.50, locked30: 6.00, locked60: 6.80, weighted: 5.10 },
  { date: '01/12', flexible: 4.30, locked30: 5.50, locked60: 6.20, weighted: 4.92 },
  { date: '01/01', flexible: 4.80, locked30: 6.50, locked60: 7.20, weighted: 5.35 },
  { date: '01/02', flexible: 4.50, locked30: 6.20, locked60: 6.80, weighted: 5.15 },
  { date: '15/02', flexible: 4.70, locked30: 6.80, locked60: 7.50, weighted: 5.42 },
  { date: '01/03', flexible: 4.40, locked30: 6.30, locked60: 7.00, weighted: 5.20 },
  { date: '09/03', flexible: 4.50, locked30: 6.50, locked60: 7.20, weighted: 5.30 },
];

const MONTHLY_EARNINGS: MonthlyEarningsPoint[] = [
  { month: 'T10', earned: 12.50, deposited: 3500, withdrawn: 0 },
  { month: 'T11', earned: 17.00, deposited: 1350, withdrawn: 0 },
  { month: 'T12', earned: 30.80, deposited: 3250, withdrawn: 500 },
  { month: 'T01', earned: 39.40, deposited: 2240, withdrawn: 0 },
  { month: 'T02', earned: 52.80, deposited: 0, withdrawn: 1000 },
  { month: 'T03', earned: 22.36, deposited: 500, withdrawn: 0 },
];

const ASSET_ALLOCATION: AssetAllocation[] = [
  { name: 'USDT', value: 3500, color: '#26A17B', apy: 4.5, type: 'flexible' },
  { name: 'BTC', value: 1350.86, color: '#F7931A', apy: 3.5, type: 'locked' },
  { name: 'SOL', value: 3250, color: '#9945FF', apy: 6.5, type: 'locked' },
  { name: 'ETH', value: 2240, color: '#627EEA', apy: 2.8, type: 'flexible' },
];

const PRODUCT_PERFORMANCE: ProductPerformance[] = [
  {
    id: 'p1', product: 'USDT Linh hoạt', asset: 'USDT', type: 'flexible',
    invested: 3500, earned: 80.12, roi: 2.29, apy: 4.50, avgApy: 4.38,
    daysActive: 161, color: '#26A17B', compoundEnabled: true, compoundBoost: 0.18,
  },
  {
    id: 'p2', product: 'BTC Cố định 60D', asset: 'BTC', type: 'locked',
    invested: 1350.86, earned: 22.38, roi: 1.66, apy: 3.50, avgApy: 3.42,
    daysActive: 53, color: '#F7931A', compoundEnabled: false, compoundBoost: 0,
  },
  {
    id: 'p3', product: 'SOL Cố định 30D', asset: 'SOL', type: 'locked',
    invested: 3250, earned: 58.50, roi: 1.80, apy: 6.50, avgApy: 6.35,
    daysActive: 18, color: '#9945FF', compoundEnabled: false, compoundBoost: 0,
  },
  {
    id: 'p4', product: 'ETH Linh hoạt', asset: 'ETH', type: 'flexible',
    invested: 2240, earned: 13.36, roi: 0.60, apy: 2.80, avgApy: 2.72,
    daysActive: 32, color: '#627EEA', compoundEnabled: true, compoundBoost: 0.12,
  },
];

/* ═══════════════════════════════════════════════════════════
   Tabs
   ═══════════════════════════════════════════════════════════ */
const TABS = ['Yield', 'Compound', 'APY', 'Phân bổ'] as const;
type TabKey = typeof TABS[number];

const TIME_RANGES = ['30D', '90D', '6M', 'All'] as const;
type TimeRange = typeof TIME_RANGES[number];

/* ═══════════════════════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════════════════════ */
function ChartSkeleton({ h = 200 }: { h?: number }) {
  const c = useThemeColors();
  return (
    <div className="rounded-2xl animate-pulse" style={{ background: c.surface2, height: h }} />
  );
}

/* ═══════════════════════════════════════════════════════════
   Custom Tooltip
   ═══════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label }: any) {
  const c = useThemeColors();
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4, fontWeight: FONT_WEIGHT.semibold }}>{label}</div>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-3" style={{ marginBottom: 2 }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>{entry.name}</span>
          </div>
          <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace' }}>
            {typeof entry.value === 'number'
              ? entry.value >= 10 ? fmtUsd(entry.value) : `${entry.value.toFixed(2)}%`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function SavingsAnalyticsPage() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true });

  const [tab, setTab] = useState<TabKey>('Yield');
  const [timeRange, setTimeRange] = useState<TimeRange>('6M');
  const [showProductSheet, setShowProductSheet] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductPerformance | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcPrincipal, setCalcPrincipal] = useState('10000');
  const [calcAPY, setCalcAPY] = useState('5.30');
  const [calcMonths, setCalcMonths] = useState('12');

  /* ─── Chart colors ─── */
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  /* ─── Yield data by time range ─── */
  const yieldData = useMemo(() => {
    switch (timeRange) {
      case '30D': return YIELD_HISTORY_30D;
      case '90D': return YIELD_HISTORY_90D;
      default: return YIELD_HISTORY;
    }
  }, [timeRange]);

  /* ─── Summary stats ─── */
  const totalInvested = ASSET_ALLOCATION.reduce((s, a) => s + a.value, 0);
  const totalEarned = YIELD_HISTORY[YIELD_HISTORY.length - 1].total;
  const weightedAPY = totalInvested > 0
    ? ASSET_ALLOCATION.reduce((s, a) => s + (a.apy * a.value), 0) / totalInvested
    : 0;
  const dailyEarnings = totalInvested * (weightedAPY / 100 / 365);
  const compoundBoost = COMPOUND_PERFORMANCE[COMPOUND_PERFORMANCE.length - 1].difference;

  /* ─── Calculator ─── */
  const calcResults = useMemo(() => {
    const P = parseFloat(calcPrincipal) || 0;
    const r = parseFloat(calcAPY) / 100 || 0;
    const months = parseInt(calcMonths) || 0;
    const days = months * 30;
    const t = days / 365;
    const simple = P * r * t;
    const compound = P * (Math.pow(1 + r / 365, days) - 1);
    return {
      simple: Math.round(simple * 100) / 100,
      compound: Math.round(compound * 100) / 100,
      boost: Math.round((compound - simple) * 100) / 100,
      total: Math.round((P + compound) * 100) / 100,
    };
  }, [calcPrincipal, calcAPY, calcMonths]);

  const handleProductTap = useCallback((product: ProductPerformance) => {
    hapticSelection();
    setSelectedProduct(product);
    setShowProductSheet(true);
  }, [hapticSelection]);

  /* ═══════════════════════════════════════════════════════════
     Tab: Yield History
     ═══════════════════════════════════════════════════════════ */
  const renderYieldTab = () => (
    <>
      {/* Time range selector */}
      <div className="flex gap-2">
        {TIME_RANGES.map(r => (
          <button
            key={r}
            onClick={() => { setTimeRange(r); hapticSelection(); }}
            className="flex-1 py-2 rounded-lg"
            style={{
              background: timeRange === r ? '#3B82F614' : c.surface2,
              border: timeRange === r ? '1.5px solid #3B82F640' : `1px solid ${c.border}`,
              color: timeRange === r ? '#3B82F6' : c.text3,
              fontSize: 12,
              fontWeight: timeRange === r ? 700 : 500,
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Cumulative yield area chart */}
      <TrCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div style={{ fontSize: 11, color: c.text3, fontWeight: 600 }}>Tổng yield tích lũy</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
              {fmtUsd(totalEarned)}
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: '#10B98114' }}>
            <ArrowUpRight size={12} color="#10B981" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>
              {fmtPct((totalEarned / totalInvested) * 100)}
            </span>
          </div>
        </div>

        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yieldData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <ChartGradientDefs
                key="gradient-defs"
                gradients={[
                  { id: 'yieldUsdt', color: '#26A17B', opacityFrom: 0.25 },
                  { id: 'yieldBtc', color: '#F7931A', opacityFrom: 0.2 },
                  { id: 'yieldSol', color: '#9945FF', opacityFrom: 0.2 },
                  { id: 'yieldEth', color: '#627EEA', opacityFrom: 0.15 },
                ]}
              />
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                key="x-axis"
                dataKey="date"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                key="y-axis"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip key="tooltip" content={<ChartTooltip />} />
              <Area
                key="area-usdt"
                type="monotone"
                dataKey="usdt"
                name="USDT"
                stackId="1"
                stroke="#26A17B"
                strokeWidth={2}
                fill="url(#yieldUsdt)"
              />
              <Area
                key="area-btc"
                type="monotone"
                dataKey="btc"
                name="BTC"
                stackId="1"
                stroke="#F7931A"
                strokeWidth={2}
                fill="url(#yieldBtc)"
              />
              <Area
                key="area-sol"
                type="monotone"
                dataKey="sol"
                name="SOL"
                stackId="1"
                stroke="#9945FF"
                strokeWidth={2}
                fill="url(#yieldSol)"
              />
              <Area
                key="area-eth"
                type="monotone"
                dataKey="eth"
                name="ETH"
                stackId="1"
                stroke="#627EEA"
                strokeWidth={2}
                fill="url(#yieldEth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Asset legend */}
        <div className="flex items-center justify-center gap-4 mt-2">
          {[
            { label: 'USDT', color: '#26A17B' },
            { label: 'BTC', color: '#F7931A' },
            { label: 'SOL', color: '#9945FF' },
            { label: 'ETH', color: '#627EEA' },
          ].map(a => (
            <div key={a.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
              <span style={{ fontSize: 10, color: c.text3 }}>{a.label}</span>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Monthly earnings bar chart */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} color="#3B82F6" />
          <span style={{ fontSize: 13, fontWeight: 700, color: c.text1 }}>Thu nhập hàng tháng</span>
        </div>

        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_EARNINGS} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid key="grid-bar" strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                key="x-bar"
                dataKey="month"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                key="y-bar"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip key="tooltip-bar" content={<ChartTooltip />} />
              <Bar key="bar-earned" dataKey="earned" name="Thu nhập" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TrCard>

      {/* Yield breakdown stats */}
      <div className="flex gap-2">
        <TrCard className="flex-1 p-3 text-center">
          <DollarSign size={16} color="#3B82F6" className="mx-auto mb-1" />
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
            {fmtUsd(dailyEarnings)}
          </div>
          <div style={{ fontSize: 10, color: c.text3 }}>Thu nhập/ngày</div>
        </TrCard>
        <TrCard className="flex-1 p-3 text-center">
          <Calendar size={16} color="#F59E0B" className="mx-auto mb-1" />
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
            {fmtUsd(dailyEarnings * 30)}
          </div>
          <div style={{ fontSize: 10, color: c.text3 }}>Thu nhập/tháng</div>
        </TrCard>
        <TrCard className="flex-1 p-3 text-center">
          <TrendingUp size={16} color="#10B981" className="mx-auto mb-1" />
          <div style={{ fontSize: 14, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
            {fmtUsd(dailyEarnings * 365)}
          </div>
          <div style={{ fontSize: 10, color: c.text3 }}>Dự kiến/năm</div>
        </TrCard>
      </div>
    </>
  );

  /* ═══════════════════════════════════════════════════════════
     Tab: Compound Performance
     ═══════════════════════════════════════════════════════════ */
  const renderCompoundTab = () => (
    <>
      {/* Compound vs Simple comparison chart */}
      <TrCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div style={{ fontSize: 11, color: c.text3, fontWeight: 600 }}>Lãi kép vs Lãi đơn</div>
            <div style={{ fontSize: 13, color: c.text2 }}>
              Dựa trên {fmtUsd(totalInvested)} vốn · APY {weightedAPY.toFixed(2)}%
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: '#8B5CF614' }}>
            <Sparkles size={12} color="#8B5CF6" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#8B5CF6' }}>
              +{fmtUsd(compoundBoost)}
            </span>
          </div>
        </div>

        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={COMPOUND_PERFORMANCE} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
              <ChartGradientDefs
                key="gradient-defs"
                gradients={[
                  { id: 'compoundFill', color: '#8B5CF6', opacityFrom: 0.2 },
                  { id: 'simpleFill', color: '#94A3B8', opacityFrom: 0.1 },
                ]}
              />
              <CartesianGrid key="grid-cmp" strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                key="x-cmp"
                dataKey="month"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                key="y-cmp"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip key="tooltip-cmp" content={<ChartTooltip />} />
              <Area
                key="area-compound"
                type="monotone"
                dataKey="compound"
                name="Lãi kép"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fill="url(#compoundFill)"
              />
              <Area
                key="area-simple"
                type="monotone"
                dataKey="simple"
                name="Lãi đơn"
                stroke="#94A3B8"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                fill="url(#simpleFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: '#8B5CF6' }} />
            <span style={{ fontSize: 10, color: c.text3 }}>Lãi kép</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full" style={{ background: '#94A3B8', borderBottom: '1px dashed #94A3B8' }} />
            <span style={{ fontSize: 10, color: c.text3 }}>Lãi đơn</span>
          </div>
        </div>
      </TrCard>

      {/* Difference over time bar chart */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} color="#F59E0B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: c.text1 }}>
            Lợi ích lãi kép tích lũy
          </span>
        </div>

        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={COMPOUND_PERFORMANCE.slice(1)} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <ChartGradientDefs
                key="gradient-defs"
                gradients={[
                  { id: 'diffFill', color: '#F59E0B', opacityFrom: 0.8, opacityTo: 0.3, direction: 'vertical' },
                ]}
              />
              <CartesianGrid key="grid-diff" strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                key="x-diff"
                dataKey="month"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                key="y-diff"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip key="tooltip-diff" content={<ChartTooltip />} />
              <Bar key="bar-diff" dataKey="difference" name="Chênh lệch" fill="url(#diffFill)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TrCard>

      {/* Compound calculator CTA */}
      <TrCard className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#3B82F614' }}
          >
            <Target size={18} color="#3B82F6" />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>Tính lãi kép</div>
            <div style={{ fontSize: 11, color: c.text3 }}>Ước tính lợi nhuận theo thời gian</div>
          </div>
          <button
            onClick={() => { setShowCalculator(true); hapticSelection(); }}
            className="px-3 py-1.5 rounded-lg"
            style={{ background: '#3B82F614', border: '1px solid #3B82F630', fontSize: 12, fontWeight: 600, color: '#3B82F6' }}
          >
            Tính ngay
          </button>
        </div>
      </TrCard>

      {/* Compound status per product */}
      <PageSection label="Trạng thái lãi kép theo sản phẩm" accentColor="#8B5CF6">
        {PRODUCT_PERFORMANCE.map(p => (
          <TrCard key={p.id} className="p-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${p.color}14`, color: p.color }}
              >
                <span style={{ fontSize: 11, fontWeight: 700 }}>{p.asset}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>
                  {p.product}
                </div>
                <div style={{ fontSize: 11, color: c.text3 }}>
                  APY {p.apy}% · {p.daysActive} ngày
                </div>
              </div>
              <div className="text-right">
                {p.compoundEnabled ? (
                  <>
                    <div className="flex items-center gap-1 justify-end">
                      <Zap size={10} color="#10B981" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>Bật</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#8B5CF6', fontFamily: 'monospace' }}>
                      +{p.compoundBoost.toFixed(2)}%
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: c.text3 }}>Tắt</span>
                )}
              </div>
            </div>
          </TrCard>
        ))}
      </PageSection>
    </>
  );

  /* ═══════════════════════════════════════════════════════════
     Tab: APY Trends
     ═══════════════════════════════════════════════════════════ */
  const renderAPYTab = () => (
    <>
      {/* APY trend line chart */}
      <TrCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div style={{ fontSize: 11, color: c.text3, fontWeight: 600 }}>Xu hướng APY</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
              {weightedAPY.toFixed(2)}%
            </div>
            <div style={{ fontSize: 11, color: c.text3 }}>APY bình quân gia quyền</div>
          </div>
          <Percent size={20} color="#3B82F6" />
        </div>

        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={APY_TRENDS} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid key="grid-apy" strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                key="x-apy"
                dataKey="date"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                key="y-apy"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
                domain={['auto', 'auto']}
              />
              <Tooltip key="tooltip-apy" content={<ChartTooltip />} />
              <ReferenceLine
                key="ref-line"
                y={weightedAPY}
                stroke="#3B82F6"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <Line
                key="line-flex"
                type="monotone"
                dataKey="flexible"
                name="Linh hoạt"
                stroke="#26A17B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#26A17B' }}
              />
              <Line
                key="line-l30"
                type="monotone"
                dataKey="locked30"
                name="Cố định 30D"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#F59E0B' }}
              />
              <Line
                key="line-l60"
                type="monotone"
                dataKey="locked60"
                name="Cố định 60D"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#8B5CF6' }}
              />
              <Line
                key="line-weighted"
                type="monotone"
                dataKey="weighted"
                name="Bình quân"
                stroke="#3B82F6"
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={false}
                activeDot={{ r: 4, fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2">
          {[
            { label: 'Linh hoạt', color: '#26A17B' },
            { label: 'Cố định 30D', color: '#F59E0B' },
            { label: 'Cố định 60D', color: '#8B5CF6' },
            { label: 'Bình quân', color: '#3B82F6', dashed: true },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-0.5 rounded-full"
                style={{
                  background: l.color,
                  borderBottom: l.dashed ? `1px dashed ${l.color}` : undefined,
                }}
              />
              <span style={{ fontSize: 10, color: c.text3 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </TrCard>

      {/* APY stats cards */}
      <div className="flex gap-2">
        <TrCard className="flex-1 p-3">
          <div style={{ fontSize: 10, color: c.text3, marginBottom: 4 }}>Cao nhất</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>7.50%</div>
          <div style={{ fontSize: 10, color: c.text3 }}>Cố đ��nh 60D · 15/02</div>
        </TrCard>
        <TrCard className="flex-1 p-3">
          <div style={{ fontSize: 10, color: c.text3, marginBottom: 4 }}>Thấp nhất</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', fontFamily: 'monospace' }}>4.20%</div>
          <div style={{ fontSize: 10, color: c.text3 }}>Linh hoạt · 01/10</div>
        </TrCard>
        <TrCard className="flex-1 p-3">
          <div style={{ fontSize: 10, color: c.text3, marginBottom: 4 }}>Biến động</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F59E0B', fontFamily: 'monospace' }}>±0.45%</div>
          <div style={{ fontSize: 10, color: c.text3 }}>Trong 6 tháng</div>
        </TrCard>
      </div>

      {/* Product performance table */}
      <PageSection label="Hiệu suất theo sản phẩm" accentColor="#3B82F6">
        {PRODUCT_PERFORMANCE.map(p => (
          <TrCard key={p.id} hover as="button" className="p-3 w-full text-left" onClick={() => handleProductTap(p)}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${p.color}14` }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.asset}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>{p.product}</div>
                <div style={{ fontSize: 11, color: c.text3 }}>
                  {p.type === 'flexible' ? 'Linh hoạt' : 'Cố định'} · {p.daysActive} ngày
                </div>
              </div>
              <div className="text-right shrink-0">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
                  +{fmtUsd(p.earned)}
                </div>
                <div style={{ fontSize: 10, color: c.text3 }}>
                  ROI {fmtPct(p.roi)}
                </div>
              </div>
              <ChevronRight size={14} color={c.text3} className="shrink-0" />
            </div>
          </TrCard>
        ))}
      </PageSection>
    </>
  );

  /* ═══════════════════════════════════════════════════════════
     Tab: Asset Allocation
     ═══════════════════════════════════════════════════════════ */
  const renderAllocationTab = () => {
    const flexibleTotal = ASSET_ALLOCATION.filter(a => a.type === 'flexible').reduce((s, a) => s + a.value, 0);
    const lockedTotal = ASSET_ALLOCATION.filter(a => a.type === 'locked').reduce((s, a) => s + a.value, 0);

    return (
      <>
        {/* Pie chart */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon size={16} color="#3B82F6" />
            <span style={{ fontSize: 13, fontWeight: 700, color: c.text1 }}>Phân bổ tài sản</span>
          </div>

          <div className="flex items-center gap-4">
            <div style={{ width: 140, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    key="pie-alloc"
                    data={ASSET_ALLOCATION}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {ASSET_ALLOCATION.map(a => (
                      <Cell key={a.name} fill={a.color} />
                    ))}
                  </Pie>
                  <Tooltip key="tooltip-pie" content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              {ASSET_ALLOCATION.map(a => {
                const pct = (a.value / totalInvested) * 100;
                return (
                  <div key={a.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} />
                    <span className="flex-1" style={{ fontSize: 12, color: c.text1, fontWeight: 500 }}>{a.name}</span>
                    <span style={{ fontSize: 11, color: c.text2, fontFamily: 'monospace' }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </TrCard>

        {/* Flexible vs Locked split */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={16} color="#F59E0B" />
            <span style={{ fontSize: 13, fontWeight: 700, color: c.text1 }}>Linh hoạt vs Cố định</span>
          </div>

          {/* Stacked bar */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-3 rounded-l-full"
              style={{
                width: `${(flexibleTotal / totalInvested) * 100}%`,
                background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                transition: 'width 0.4s ease',
              }}
            />
            <div
              className="h-3 rounded-r-full"
              style={{
                width: `${(lockedTotal / totalInvested) * 100}%`,
                background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div className="flex gap-3">
            <div
              className="flex-1 rounded-xl p-3"
              style={{ background: '#3B82F60D', border: '1px solid #3B82F620' }}
            >
              <div style={{ fontSize: 10, color: '#3B82F6', fontWeight: 600, marginBottom: 2 }}>Linh hoạt</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
                {fmtUsd(flexibleTotal)}
              </div>
              <div style={{ fontSize: 10, color: c.text3 }}>
                {((flexibleTotal / totalInvested) * 100).toFixed(1)}% · Rút bất kỳ lúc nào
              </div>
            </div>
            <div
              className="flex-1 rounded-xl p-3"
              style={{ background: '#F59E0B0D', border: '1px solid #F59E0B20' }}
            >
              <div style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, marginBottom: 2 }}>Cố định</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
                {fmtUsd(lockedTotal)}
              </div>
              <div style={{ fontSize: 10, color: c.text3 }}>
                {((lockedTotal / totalInvested) * 100).toFixed(1)}% · APY cao hơn
              </div>
            </div>
          </div>
        </TrCard>

        {/* Individual asset cards */}
        <PageSection label="Chi tiết từng tài sản" accentColor="#10B981">
          {ASSET_ALLOCATION.map(a => {
            const pct = (a.value / totalInvested) * 100;
            const product = PRODUCT_PERFORMANCE.find(p => p.asset === a.name);
            return (
              <TrCard key={a.name} className="p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${a.color}14` }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.name}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13, fontWeight: 600, color: c.text1 }}>{a.name}</span>
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          background: a.type === 'flexible' ? '#3B82F614' : '#F59E0B14',
                          color: a.type === 'flexible' ? '#3B82F6' : '#F59E0B',
                        }}
                      >
                        {a.type === 'flexible' ? 'Linh hoạt' : 'Cố định'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: c.text3 }}>
                      APY {a.apy}% · {pct.toFixed(1)}% danh mục
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
                      {fmtUsd(a.value)}
                    </div>
                    {product && (
                      <div style={{ fontSize: 10, color: '#10B981', fontFamily: 'monospace' }}>
                        +{fmtUsd(product.earned)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Allocation bar */}
                <div className="mt-2 rounded-full overflow-hidden" style={{ height: 4, background: c.surface2 }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: a.color,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </TrCard>
            );
          })}
        </PageSection>
      </>
    );
  };

  /* ═══════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════ */
  return (
    <PageLayout>
      <Header title="Phân tích Tiết kiệm" subtitle="Yield, compound & phân bổ" back />
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={(t) => { setTab(t); hapticSelection(); }}
      />

      <PageContent gap="default">
        {isLoading ? (
          <>
            <ChartSkeleton h={100} />
            <ChartSkeleton h={260} />
            <ChartSkeleton h={200} />
          </>
        ) : (
          <>
            {/* ─── Summary hero ─── */}
            <TrCard variant="hero" className="p-4">
              <div className="flex gap-2">
                <TrCardStat className="flex-1 text-center">
                  <div style={{ fontSize: 10, color: c.text3, marginBottom: 2 }}>Tổng tiết kiệm</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.text1, fontFamily: 'monospace' }}>
                    {fmtUsd(totalInvested)}
                  </div>
                </TrCardStat>
                <TrCardStat className="flex-1 text-center">
                  <div style={{ fontSize: 10, color: c.text3, marginBottom: 2 }}>Tổng yield</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
                    +{fmtUsd(totalEarned)}
                  </div>
                </TrCardStat>
                <TrCardStat className="flex-1 text-center">
                  <div style={{ fontSize: 10, color: c.text3, marginBottom: 2 }}>APY BQ</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#3B82F6', fontFamily: 'monospace' }}>
                    {weightedAPY.toFixed(2)}%
                  </div>
                </TrCardStat>
              </div>
            </TrCard>

            {/* ─── Tab content ─── */}
            {tab === 'Yield' && renderYieldTab()}
            {tab === 'Compound' && renderCompoundTab()}
            {tab === 'APY' && renderAPYTab()}
            {tab === 'Phân bổ' && renderAllocationTab()}
          </>
        )}
      </PageContent>

      {/* ═══ Product Detail Sheet ═══ */}
      <BottomSheetV2
        open={showProductSheet}
        onClose={() => setShowProductSheet(false)}
        title={selectedProduct?.product || 'Chi tiết sản phẩm'}
      >
        {selectedProduct && (
          <div className="flex flex-col gap-3 pb-4">
            <div className="flex items-center gap-3 py-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${selectedProduct.color}14` }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: selectedProduct.color }}>
                  {selectedProduct.asset}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: c.text1 }}>{selectedProduct.product}</div>
                <div style={{ fontSize: 12, color: c.text3 }}>
                  {selectedProduct.type === 'flexible' ? 'Linh hoạt' : 'Cố định'} · {selectedProduct.daysActive} ngày
                </div>
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <BottomSheetRow label="Số tiền đầu tư" value={fmtUsd(selectedProduct.invested)} highlight />
              <BottomSheetRow label="Thu nhập" value={`+${fmtUsd(selectedProduct.earned)}`} valueColor="#10B981" />
              <BottomSheetRow label="ROI" value={fmtPct(selectedProduct.roi)} valueColor="#10B981" />
              <BottomSheetRow label="APY hiện tại" value={`${selectedProduct.apy}%`} />
              <BottomSheetRow label="APY trung bình" value={`${selectedProduct.avgApy}%`} />
              <BottomSheetRow label="Thời gian" value={`${selectedProduct.daysActive} ngày`} />
              <BottomSheetRow
                label="Lãi kép"
                value={selectedProduct.compoundEnabled ? `Bật (+${selectedProduct.compoundBoost.toFixed(2)}%)` : 'Tắt'}
                valueColor={selectedProduct.compoundEnabled ? '#10B981' : c.text3}
              />
            </div>

            <CTAButton
              onClick={() => {
                setShowProductSheet(false);
                navigate(`${prefix}/earn/savings/product/${selectedProduct.id}`);
              }}
            >
              Xem chi tiết sản phẩm
            </CTAButton>
          </div>
        )}
      </BottomSheetV2>

      {/* ═══ Calculator Sheet ═══ */}
      <BottomSheetV2
        open={showCalculator}
        onClose={() => setShowCalculator(false)}
        title="Tính lãi kép"
      >
        <div className="flex flex-col gap-4 pb-4">
          {/* Principal */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.text2, display: 'block', marginBottom: 6 }}>
              Số tiền gốc (USDT)
            </label>
            <input
              type="number"
              value={calcPrincipal}
              onChange={e => setCalcPrincipal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ background: c.surface2, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14, fontFamily: 'monospace' }}
            />
          </div>

          {/* APY */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.text2, display: 'block', marginBottom: 6 }}>
              APY (%)
            </label>
            <input
              type="number"
              value={calcAPY}
              onChange={e => setCalcAPY(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ background: c.surface2, border: `1px solid ${c.border}`, color: c.text1, fontSize: 14, fontFamily: 'monospace' }}
            />
          </div>

          {/* Months */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: c.text2, display: 'block', marginBottom: 6 }}>
              Thời gian (tháng)
            </label>
            <div className="flex gap-2">
              {['3', '6', '12', '24', '36'].map(m => (
                <button
                  key={m}
                  onClick={() => setCalcMonths(m)}
                  className="flex-1 py-2 rounded-lg"
                  style={{
                    background: calcMonths === m ? '#3B82F614' : c.surface2,
                    border: calcMonths === m ? '1.5px solid #3B82F640' : `1px solid ${c.border}`,
                    color: calcMonths === m ? '#3B82F6' : c.text2,
                    fontSize: 13,
                    fontWeight: calcMonths === m ? 700 : 400,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <BottomSheetRow label="Lãi đơn" value={fmtUsd(calcResults.simple)} />
            <BottomSheetRow label="Lãi kép (hàng ngày)" value={fmtUsd(calcResults.compound)} highlight valueColor="#10B981" />
            <BottomSheetRow label="Chênh lệch" value={`+${fmtUsd(calcResults.boost)}`} valueColor="#8B5CF6" />
            <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${c.divider}` }}>
              <BottomSheetRow label="Tổng nhận được" value={fmtUsd(calcResults.total)} highlight />
            </div>
          </div>

          <div
            className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: '#3B82F60D', border: '1px solid #3B82F620' }}
          >
            <Info size={14} color="#3B82F6" className="shrink-0 mt-0.5" />
            <span style={{ fontSize: 11, color: c.text2 }}>
              Ước tính dựa trên APY cố định. APY thực tế có thể thay đổi theo thị trường. Lãi kép được tính theo chu kỳ hàng ngày.
            </span>
          </div>
        </div>
      </BottomSheetV2>
    </PageLayout>
  );
}