import React, { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, BarChart3, Clock, ChevronRight,
  ArrowUpRight, ArrowDownRight, ArrowRight, AlertTriangle,
  Shield, Info, X, Play, RotateCcw, CheckCircle, Sliders,
  PiggyBank, Lock, Unlock, Zap, DollarSign, Percent,
  Calendar, Target, Activity, Sparkles, Eye,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtPct, fmtAmount } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { useIsDark } from '../../hooks/useIsDark';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import { ChartGradientDefs } from '../../components/charts/ChartGradientDefs';
import { FONT_SCALE, FONT_WEIGHT, LETTER_SPACING } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type BacktestPeriod = '3m' | '6m' | '1y' | '2y';
type AllocationPreset = 'conservative' | 'balanced' | 'aggressive' | 'custom';

interface AllocationSlot {
  id: string;
  product: string;
  asset: string;
  type: 'flexible' | 'locked';
  lockDays: number | null;
  color: string;
  percentage: number;
  avgAPY: number;
}

interface BacktestResult {
  totalReturn: number;
  totalReturnPct: number;
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  monthsPositive: number;
  monthsNegative: number;
  bestMonth: number;
  worstMonth: number;
  avgMonthlyReturn: number;
  finalValue: number;
  totalInterestEarned: number;
  chartData: { month: string; value: number; interest: number; cumInterest: number }[];
  monthlyBreakdown: { month: string; return: number; returnPct: number; apy: number }[];
}

/* ═══════════════════════════════════════════════════════════
   Mock Data & Presets
   ═══════════════════════════════════════════════════════════ */

const ALLOCATION_PRESETS: Record<AllocationPreset, { label: string; desc: string; icon: React.ComponentType<any>; color: string; riskLevel: string; slots: AllocationSlot[] }> = {
  conservative: {
    label: 'An toàn', desc: 'Ưu tiên stablecoin và linh hoạt, rủi ro thấp',
    icon: Shield, color: '#10B981', riskLevel: 'Thấp',
    slots: [
      { id: 'c1', product: 'USDT Linh hoạt', asset: 'USDT', type: 'flexible', lockDays: null, color: '#26A17B', percentage: 50, avgAPY: 4.3 },
      { id: 'c2', product: 'USDT Cố định 30D', asset: 'USDT', type: 'locked', lockDays: 30, color: '#22C55E', percentage: 30, avgAPY: 5.2 },
      { id: 'c3', product: 'BTC Cố định 60D', asset: 'BTC', type: 'locked', lockDays: 60, color: '#F7931A', percentage: 10, avgAPY: 3.5 },
      { id: 'c4', product: 'ETH Linh hoạt', asset: 'ETH', type: 'flexible', lockDays: null, color: '#627EEA', percentage: 10, avgAPY: 3.9 },
    ],
  },
  balanced: {
    label: 'Cân bằng', desc: 'Pha trộn linh hoạt và cố định, rủi ro trung bình',
    icon: Target, color: '#3B82F6', riskLevel: 'Trung bình',
    slots: [
      { id: 'b1', product: 'USDT Linh hoạt', asset: 'USDT', type: 'flexible', lockDays: null, color: '#26A17B', percentage: 30, avgAPY: 4.3 },
      { id: 'b2', product: 'BTC Cố định 60D', asset: 'BTC', type: 'locked', lockDays: 60, color: '#F7931A', percentage: 20, avgAPY: 3.5 },
      { id: 'b3', product: 'ETH Linh hoạt', asset: 'ETH', type: 'flexible', lockDays: null, color: '#627EEA', percentage: 20, avgAPY: 3.9 },
      { id: 'b4', product: 'SOL Cố định 30D', asset: 'SOL', type: 'locked', lockDays: 30, color: '#9945FF', percentage: 20, avgAPY: 6.8 },
      { id: 'b5', product: 'AVAX Cố định 90D', asset: 'AVAX', type: 'locked', lockDays: 90, color: '#E84142', percentage: 10, avgAPY: 7.2 },
    ],
  },
  aggressive: {
    label: 'Tăng trưởng', desc: 'Ưu tiên cố định dài hạn, APY cao, rủi ro cao hơn',
    icon: Zap, color: '#F59E0B', riskLevel: 'Cao',
    slots: [
      { id: 'a1', product: 'SOL Cố định 90D', asset: 'SOL', type: 'locked', lockDays: 90, color: '#9945FF', percentage: 30, avgAPY: 7.5 },
      { id: 'a2', product: 'AVAX Cố định 90D', asset: 'AVAX', type: 'locked', lockDays: 90, color: '#E84142', percentage: 25, avgAPY: 7.2 },
      { id: 'a3', product: 'ETH Cố định 60D', asset: 'ETH', type: 'locked', lockDays: 60, color: '#627EEA', percentage: 20, avgAPY: 5.1 },
      { id: 'a4', product: 'BTC Cố định 60D', asset: 'BTC', type: 'locked', lockDays: 60, color: '#F7931A', percentage: 15, avgAPY: 3.5 },
      { id: 'a5', product: 'USDT Linh hoạt', asset: 'USDT', type: 'flexible', lockDays: null, color: '#26A17B', percentage: 10, avgAPY: 4.3 },
    ],
  },
  custom: {
    label: 'Tùy chỉnh', desc: 'Tự tạo phân bổ theo ý bạn',
    icon: Sliders, color: '#8B5CF6', riskLevel: 'Tùy chỉnh',
    slots: [
      { id: 'u1', product: 'USDT Linh hoạt', asset: 'USDT', type: 'flexible', lockDays: null, color: '#26A17B', percentage: 40, avgAPY: 4.3 },
      { id: 'u2', product: 'BTC Cố định 60D', asset: 'BTC', type: 'locked', lockDays: 60, color: '#F7931A', percentage: 30, avgAPY: 3.5 },
      { id: 'u3', product: 'SOL Cố định 30D', asset: 'SOL', type: 'locked', lockDays: 30, color: '#9945FF', percentage: 30, avgAPY: 6.8 },
    ],
  },
};

const PERIOD_OPTIONS: { id: BacktestPeriod; label: string; months: number }[] = [
  { id: '3m', label: '3 tháng', months: 3 },
  { id: '6m', label: '6 tháng', months: 6 },
  { id: '1y', label: '1 năm', months: 12 },
  { id: '2y', label: '2 năm', months: 24 },
];

/* Deterministic backtest simulation */
function runBacktest(slots: AllocationSlot[], initialAmount: number, months: number): BacktestResult {
  const weightedAPY = slots.reduce((s, sl) => s + (sl.avgAPY * sl.percentage / 100), 0);
  const monthlyRate = weightedAPY / 100 / 12;

  // Add deterministic variance
  const variance = [0.15, -0.08, 0.22, -0.12, 0.18, -0.05, 0.25, -0.10, 0.12, -0.15, 0.20, -0.06,
    0.14, -0.09, 0.19, -0.11, 0.16, -0.07, 0.23, -0.13, 0.17, -0.04, 0.21, -0.08];

  let value = initialAmount;
  let cumInterest = 0;
  const chartData: BacktestResult['chartData'] = [];
  const monthlyBreakdown: BacktestResult['monthlyBreakdown'] = [];
  const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  let maxValue = initialAmount;
  let maxDrawdown = 0;
  let monthsPos = 0;
  let monthsNeg = 0;
  let bestMonth = -Infinity;
  let worstMonth = Infinity;

  for (let i = 0; i < months; i++) {
    const v = variance[i % variance.length];
    const effectiveRate = monthlyRate + (v * monthlyRate * 0.3);
    const interest = value * effectiveRate;
    value += interest;
    cumInterest += interest;

    const monthStr = monthNames[i % 12] + '/' + (2025 + Math.floor(i / 12));
    const monthReturn = interest;
    const monthReturnPct = (interest / (value - interest)) * 100;

    chartData.push({ month: monthStr, value: Math.round(value * 100) / 100, interest: Math.round(interest * 100) / 100, cumInterest: Math.round(cumInterest * 100) / 100 });
    monthlyBreakdown.push({ month: monthStr, return: Math.round(monthReturn * 100) / 100, returnPct: Math.round(monthReturnPct * 1000) / 1000, apy: weightedAPY + v * weightedAPY * 0.3 });

    if (value > maxValue) maxValue = value;
    const dd = ((maxValue - value) / maxValue) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
    if (monthReturnPct > 0) monthsPos++; else monthsNeg++;
    if (monthReturn > bestMonth) bestMonth = monthReturn;
    if (monthReturn < worstMonth) worstMonth = monthReturn;
  }

  const totalReturn = value - initialAmount;
  const totalReturnPct = (totalReturn / initialAmount) * 100;
  const annualizedReturn = ((Math.pow(value / initialAmount, 12 / months) - 1) * 100);
  const avgMonthlyReturn = totalReturn / months;
  const sharpeRatio = annualizedReturn / (maxDrawdown || 1);

  return {
    totalReturn: Math.round(totalReturn * 100) / 100,
    totalReturnPct: Math.round(totalReturnPct * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 1000) / 1000,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    monthsPositive: monthsPos,
    monthsNegative: monthsNeg,
    bestMonth: Math.round(bestMonth * 100) / 100,
    worstMonth: Math.round(worstMonth * 100) / 100,
    avgMonthlyReturn: Math.round(avgMonthlyReturn * 100) / 100,
    finalValue: Math.round(value * 100) / 100,
    totalInterestEarned: Math.round(cumInterest * 100) / 100,
    chartData,
    monthlyBreakdown,
  };
}

/* ═══════════════════════════════════════════════════════════
   Allocation Pie (pure CSS)
   ═══════════════════════════════════════════════════════════ */

function AllocationRing({ slots, size = 100 }: { slots: AllocationSlot[]; size?: number }) {
  const c = useThemeColors();
  let cumulativePct = 0;
  const segments = slots.map(s => {
    const start = cumulativePct;
    cumulativePct += s.percentage;
    return { ...s, start, end: cumulativePct };
  });

  const gradientStr = segments.map(s =>
    `${s.color} ${s.start}% ${s.end}%`
  ).join(', ');

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `conic-gradient(${gradientStr})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: size * 0.6, height: size * 0.6, borderRadius: '50%',
        background: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: c.text1, fontSize: size * 0.14, fontWeight: FONT_WEIGHT.bold }}>
          {slots.length}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Custom Slider
   ═══════════════════════════════════════════════════════════ */

function AmountSlider({ value, onChange, min, max, step, color }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step: number; color: string;
}) {
  const c = useThemeColors();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative w-full" style={{ height: 24 }}>
      <div className="absolute top-2.5 left-0 right-0 h-1.5 rounded-full" style={{ background: c.borderSolid }}>
        <div className="h-full rounded-full" style={{ background: color, width: `${pct}%` }} />
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
        style={{ height: 24 }} />
      <div className="absolute top-0.5 w-5 h-5 rounded-full border-2 shadow-md"
        style={{ left: `calc(${pct}% - 10px)`, background: '#fff', borderColor: color }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */

export function SavingsBacktestPage() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight, hapticSuccess } = useHaptic();

  /* State */
  const [tab, setTab] = useState<'setup' | 'results' | 'compare'>('setup');
  const [preset, setPreset] = useState<AllocationPreset>('balanced');
  const [period, setPeriod] = useState<BacktestPeriod>('1y');
  const [initialAmount, setInitialAmount] = useState(10000);
  const [hasRun, setHasRun] = useState(false);
  const [showSlotDetail, setShowSlotDetail] = useState<AllocationSlot | null>(null);
  const [showMonthlySheet, setShowMonthlySheet] = useState(false);

  /* Current allocation */
  const currentSlots = ALLOCATION_PRESETS[preset].slots;
  const currentPresetInfo = ALLOCATION_PRESETS[preset];
  const periodInfo = PERIOD_OPTIONS.find(p => p.id === period)!;

  /* Run backtest */
  const result = useMemo(() => {
    if (!hasRun) return null;
    return runBacktest(currentSlots, initialAmount, periodInfo.months);
  }, [hasRun, preset, period, initialAmount]);

  /* Compare results (all presets) */
  const compareResults = useMemo(() => {
    if (tab !== 'compare') return [];
    return (Object.keys(ALLOCATION_PRESETS) as AllocationPreset[])
      .filter(k => k !== 'custom')
      .map(key => {
        const p = ALLOCATION_PRESETS[key];
        const r = runBacktest(p.slots, initialAmount, periodInfo.months);
        return { key, label: p.label, color: p.color, icon: p.icon, riskLevel: p.riskLevel, ...r };
      });
  }, [tab, initialAmount, period]);

  const handleRun = useCallback(() => {
    hapticSuccess();
    setHasRun(true);
    setTab('results');
  }, [hapticSuccess]);

  const handleReset = useCallback(() => {
    hapticLight();
    setHasRun(false);
    setTab('setup');
  }, [hapticLight]);

  const weightedAPY = currentSlots.reduce((s, sl) => s + (sl.avgAPY * sl.percentage / 100), 0);

  const TABS = [
    { id: 'setup' as const, label: 'Thiết lập' },
    { id: 'results' as const, label: 'Kết quả' },
    { id: 'compare' as const, label: 'So sánh' },
  ];

  return (
    <PageLayout>
      {/* ─── Slot Detail Sheet ─── */}
      <BottomSheetV2 open={!!showSlotDetail} onClose={() => setShowSlotDetail(null)} title="Chi tiết sản phẩm">
        {showSlotDetail && (() => {
          const sl = showSlotDetail;
          return (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: sl.color + '22', border: `2px solid ${sl.color}44` }}>
                  <span style={{ color: sl.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{sl.asset}</span>
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold }}>{sl.product}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {sl.type === 'flexible' ? <Unlock size={ICON_SIZE.sm} color="#10B981" /> : <Lock size={ICON_SIZE.sm} color="#F59E0B" />}
                    <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
                      {sl.type === 'flexible' ? 'Linh hoạt' : `Cố định ${sl.lockDays} ngày`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="Tỷ trọng" value={`${sl.percentage}%`} valueColor={sl.color} />
                <BottomSheetRow label="APY trung bình" value={`${sl.avgAPY}%`} valueColor="#10B981" />
                <BottomSheetRow label="Số tiền phân bổ" value={fmtUsd(initialAmount * sl.percentage / 100)} />
                <BottomSheetRow label="Dự kiến lãi/năm" value={fmtUsd(initialAmount * sl.percentage / 100 * sl.avgAPY / 100)} valueColor="#10B981" />
              </div>
            </div>
          );
        })()}
      </BottomSheetV2>

      {/* ─── Monthly Breakdown Sheet ─── */}
      <BottomSheetV2 open={showMonthlySheet} onClose={() => setShowMonthlySheet(false)} title="Lãi hằng tháng">
        {result && (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
            {result.monthlyBreakdown.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-1"
                style={{ borderBottom: `1px solid ${c.divider}` }}>
                <div className="flex items-center gap-2">
                  <Calendar size={ICON_SIZE.sm} color={c.text3} />
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{m.month}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: m.return >= 0 ? '#10B981' : '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
                    {m.return >= 0 ? '+' : ''}{fmtUsd(m.return)}
                  </span>
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontFamily: 'monospace', minWidth: 50, textAlign: 'right' }}>
                    {m.returnPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheetV2>

      {/* ─── Header ─── */}
      <Header title="Mô phỏng đầu tư" back />

      {/* ─── Hero ─── */}
      <TrCard variant="hero" rounded="lg" className="mx-5 mt-4 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={ICON_SIZE.base} color="#8B5CF6" />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Backtest Simulator</span>
        </div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Vốn ban đầu</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {fmtUsd(initialAmount)}
            </p>
          </div>
          {hasRun && result && (
            <div className="text-right">
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Giá trị cuối kỳ</p>
              <p style={{ color: '#10B981', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                {fmtUsd(result.finalValue)}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Chiến lược</p>
            <p style={{ color: currentPresetInfo.color, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{currentPresetInfo.label}</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY TB</p>
            <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{weightedAPY.toFixed(1)}%</p>
          </TrCardStat>
          <TrCardStat className="flex-1">
            <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Thời gian</p>
            <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{periodInfo.label}</p>
          </TrCardStat>
        </div>
      </TrCard>

      {/* ─── TabBar ─── */}
      <div className="px-5 mt-4">
        <TabBar tabs={TABS} active={tab} onChange={(t) => setTab(t as typeof tab)} />
      </div>

      {/* ═══ Setup Tab ═══ */}
      {tab === 'setup' && (
        <PageContent padding="compact" gap="default">
          {/* Initial Amount */}
          <PageSection label="Vốn ban đầu (USD)">
            <div className="flex items-center gap-3 rounded-2xl px-4"
              style={{ background: c.surface2, border: `1.5px solid rgba(59,130,246,0.3)`, height: 52, borderRadius: 14 }}>
              <DollarSign size={ICON_SIZE.base} color="#3B82F6" />
              <input type="number" inputMode="decimal" value={initialAmount}
                onChange={e => setInitialAmount(Math.max(100, Number(e.target.value) || 0))}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: c.text1, fontSize: FONT_SCALE.base, flex: 1, fontFamily: 'monospace', fontWeight: FONT_WEIGHT.bold }} />
              <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>USD</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[1000, 5000, 10000, 25000, 50000].map(v => (
                <button key={v} onClick={() => { setInitialAmount(v); hapticLight(); }}
                  className="flex-1 py-1.5 rounded-xl text-xs"
                  style={{
                    background: initialAmount === v ? 'rgba(59,130,246,0.12)' : c.chipBg,
                    color: initialAmount === v ? '#3B82F6' : c.chipText,
                    border: `1px solid ${initialAmount === v ? '#3B82F640' : c.chipBorder}`,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}>
                  {v >= 1000 ? `${v / 1000}K` : v}
                </button>
              ))}
            </div>
          </PageSection>

          {/* Period */}
          <PageSection label="Thời gian mô phỏng">
            <div className="flex gap-2">
              {PERIOD_OPTIONS.map(p => (
                <button key={p.id} onClick={() => { setPeriod(p.id); hapticLight(); }}
                  className="flex-1 py-2.5 rounded-xl text-xs"
                  style={{
                    background: period === p.id ? 'rgba(139,92,246,0.12)' : c.chipBg,
                    color: period === p.id ? '#8B5CF6' : c.chipText,
                    border: `1px solid ${period === p.id ? '#8B5CF640' : c.chipBorder}`,
                    fontWeight: FONT_WEIGHT.semibold,
                  }}>
                  {p.label}
                </button>
              ))}
            </div>
          </PageSection>

          {/* Strategy presets */}
          <PageSection label="Chiến lược phân bổ">
            <div className="flex flex-col gap-2">
              {(Object.keys(ALLOCATION_PRESETS) as AllocationPreset[]).map(key => {
                const p = ALLOCATION_PRESETS[key];
                const Icon = p.icon;
                return (
                  <button key={key}
                    onClick={() => { setPreset(key); hapticSelection(); }}
                    className="flex items-start gap-3 p-3.5 rounded-xl text-left"
                    style={{
                      background: preset === key ? p.color + '10' : c.surface2,
                      border: `1.5px solid ${preset === key ? p.color + '40' : 'transparent'}`,
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: preset === key ? p.color + '22' : c.borderSolid + '66' }}>
                      <Icon size={ICON_SIZE.sm} color={preset === key ? p.color : c.text3} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>{p.label}</p>
                        <span className="px-1.5 py-0.5 rounded"
                          style={{ background: p.color + '15', color: p.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                          {p.riskLevel}
                        </span>
                      </div>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{p.desc}</p>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 3 }}>
                        {p.slots.length} sản phẩm · APY TB: {p.slots.reduce((s, sl) => s + (sl.avgAPY * sl.percentage / 100), 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1"
                      style={{ borderColor: preset === key ? p.color : c.borderSolid }}>
                      {preset === key && <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </PageSection>

          {/* Current allocation preview */}
          <PageSection label="Phân bổ hiện tại">
            <TrCard className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <AllocationRing slots={currentSlots} size={80} />
                <div className="flex-1 flex flex-col gap-1.5">
                  {currentSlots.map(sl => (
                    <button key={sl.id} onClick={() => { setShowSlotDetail(sl); hapticSelection(); }}
                      className="flex items-center gap-2 text-left">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sl.color }} />
                      <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, flex: 1 }}>{sl.product}</span>
                      <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>{sl.percentage}%</span>
                      <span style={{ color: '#10B981', fontSize: FONT_SCALE.micro, fontFamily: 'monospace' }}>{sl.avgAPY}%</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY TB</p>
                  <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{weightedAPY.toFixed(1)}%</p>
                </div>
                <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Sản phẩm</p>
                  <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{currentSlots.length}</p>
                </div>
                <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Dự kiến lãi/năm</p>
                  <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{fmtUsd(initialAmount * weightedAPY / 100)}</p>
                </div>
              </div>
            </TrCard>
          </PageSection>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Kết quả mô phỏng dựa trên dữ liệu APY lịch sử và giả định ổn định.
              Hiệu suất quá khứ không đảm bảo kết quả tương lai. Đây không phải lời khuyên đầu tư.
            </p>
          </div>

          {/* Run CTA */}
          <CTAButton onClick={handleRun}>
            <Play size={ICON_SIZE.sm} className="mr-2 inline" />
            Chạy mô phỏng
          </CTAButton>
        </PageContent>
      )}

      {/* ═══ Results Tab ═══ */}
      {tab === 'results' && (
        <PageContent padding="compact" gap="default">
          {!result ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: c.surface2 }}>
                <Play size={ICON_SIZE.xl} color={c.text3} />
              </div>
              <p style={{ color: c.text2, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Chưa chạy mô phỏng</p>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, textAlign: 'center', maxWidth: 260 }}>
                Thiết lập chiến lược và bấm "Chạy mô phỏng" để xem kết quả.
              </p>
              <button onClick={() => { setTab('setup'); hapticSelection(); }}
                className="mt-2 px-6 py-3 rounded-2xl text-white"
                style={{ background: c.primary, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                Thiết lập
              </button>
            </div>
          ) : (
            <>
              {/* Performance summary */}
              <TrCard className="p-4" accentBorder={result.totalReturn >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={ICON_SIZE.sm} color="#10B981" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Hiệu suất tổng quan</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)' }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tổng lãi</p>
                    <p style={{ color: '#10B981', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      +{fmtUsd(result.totalReturn)}
                    </p>
                    <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>+{result.totalReturnPct}%</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Giá trị cuối kỳ</p>
                    <p style={{ color: c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      {fmtUsd(result.finalValue)}
                    </p>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{periodInfo.label}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY hiệu quả</p>
                    <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{result.annualizedReturn}%</p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Max Drawdown</p>
                    <p style={{ color: result.maxDrawdown > 1 ? '#EF4444' : '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {result.maxDrawdown.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                    <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Sharpe Ratio</p>
                    <p style={{ color: result.sharpeRatio > 2 ? '#10B981' : '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                      {result.sharpeRatio}
                    </p>
                  </div>
                </div>
              </TrCard>

              {/* Growth chart */}
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={ICON_SIZE.sm} color="#3B82F6" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Tăng trưởng tài sản</span>
                </div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                      <ChartGradientDefs key="gradient-defs" gradients={[
                        { id: 'fillGrowth', color: '#10B981', opacityFrom: 0.2 },
                      ]} />
                      <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                      <XAxis key="x" dataKey="month" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} />
                      <YAxis key="y" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
                      <Tooltip key="tooltip" contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                      <ReferenceLine key="ref-initial" y={initialAmount} stroke="#F59E0B" strokeDasharray="4 4"
                        label={{ value: `Vốn: ${fmtUsd(initialAmount)}`, fill: '#F59E0B', fontSize: 9, position: 'right' }} />
                      <Area key="area" type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2}
                        fill="url(#fillGrowth)" name="Giá trị" />
                      <Bar key="bar" dataKey="interest" fill="#3B82F680" name="Lãi tháng" barSize={6} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </TrCard>

              {/* Cumulative interest chart */}
              <TrCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={ICON_SIZE.sm} color="#8B5CF6" />
                  <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Lãi tích lũy</span>
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                      <ChartGradientDefs key="gradient-defs" gradients={[
                        { id: 'fillCumInt', color: '#8B5CF6', opacityFrom: 0.25 },
                      ]} />
                      <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                      <XAxis key="x" dataKey="month" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} />
                      <YAxis key="y" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                        tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
                      <Tooltip key="tooltip" contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Tổng lãi']} />
                      <Area key="area" type="monotone" dataKey="cumInterest" stroke="#8B5CF6" strokeWidth={2}
                        fill="url(#fillCumInt)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TrCard>

              {/* Monthly stats */}
              <div className="grid grid-cols-2 gap-3">
                <TrCard className="p-3">
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tháng dương</p>
                  <p style={{ color: '#10B981', fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{result.monthsPositive}</p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 2 }}>Tháng tốt nhất</p>
                  <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>+{fmtUsd(result.bestMonth)}</p>
                </TrCard>
                <TrCard className="p-3">
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tháng âm</p>
                  <p style={{ color: result.monthsNegative > 0 ? '#EF4444' : c.text1, fontSize: FONT_SCALE.lg, fontWeight: FONT_WEIGHT.bold }}>{result.monthsNegative}</p>
                  <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginTop: 2 }}>Tháng tệ nhất</p>
                  <p style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>{fmtUsd(result.worstMonth)}</p>
                </TrCard>
              </div>

              {/* Monthly breakdown link */}
              <button onClick={() => { setShowMonthlySheet(true); hapticSelection(); }}
                className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                <div className="flex items-center gap-2">
                  <Calendar size={ICON_SIZE.sm} color="#3B82F6" />
                  <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>Xem lãi hàng tháng chi tiết</span>
                </div>
                <ChevronRight size={ICON_SIZE.sm} color={c.text3} />
              </button>

              {/* Actions */}
              <div className="flex gap-2">
                <CTAButton variant="secondary" onClick={handleReset} className="flex-1">
                  <RotateCcw size={ICON_SIZE.sm} className="mr-1.5 inline" />
                  Chạy lại
                </CTAButton>
                <CTAButton onClick={() => { navigate(`${prefix}/earn/savings/recommendations`); hapticSuccess(); }} className="flex-1">
                  <Sparkles size={ICON_SIZE.sm} className="mr-1.5 inline" />
                  Áp dụng
                </CTAButton>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
                <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="mt-0.5 shrink-0" />
                <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
                  Kết quả mô phỏng dựa trên dữ liệu lịch sử và giả định APY ổn định.
                  Hiệu suất thực tế có thể khác biệt do biến động thị trường, thay đổi APY, và các yếu tố khác.
                </p>
              </div>
            </>
          )}
        </PageContent>
      )}

      {/* ═══ Compare Tab ═══ */}
      {tab === 'compare' && (
        <PageContent padding="compact" gap="default">
          {/* Comparison overview chart */}
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={ICON_SIZE.sm} color="#3B82F6" />
              <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>So sánh tăng trưởng</span>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} />
                  <XAxis key="x" dataKey="month" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                    type="category" allowDuplicatedCategory={false} />
                  <YAxis key="y" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
                  <Tooltip key="tooltip" contentStyle={{ background: c.surface, border: `1px solid ${c.borderSolid}`, borderRadius: 8, fontSize: 11 }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                  <ReferenceLine key="ref-initial" y={initialAmount} stroke="#999" strokeDasharray="4 4" />
                  {compareResults.map(cr => (
                    <Line key={cr.key} data={cr.chartData} type="monotone" dataKey="value" name={cr.label}
                      stroke={cr.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {compareResults.map(cr => (
                <div key={cr.key} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: cr.color }} />
                  <span style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>{cr.label}</span>
                </div>
              ))}
            </div>
          </TrCard>

          {/* Comparison cards */}
          <div className="flex flex-col gap-3">
            {compareResults.map((cr, idx) => {
              const Icon = cr.icon;
              return (
                <TrCard key={cr.key} className="p-4"
                  accentBorder={idx === 0 ? 'rgba(16,185,129,0.3)' : undefined}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cr.color + '18' }}>
                      <Icon size={ICON_SIZE.base} color={cr.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>{cr.label}</p>
                        <span className="px-1.5 py-0.5 rounded"
                          style={{ background: cr.color + '15', color: cr.color, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                          {cr.riskLevel}
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold }}>
                            Tốt nhất
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{ color: '#10B981', fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                        +{cr.totalReturnPct}%
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Tổng lãi</p>
                      <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>+{fmtUsd(cr.totalReturn)}</p>
                    </div>
                    <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Giá trị cuối</p>
                      <p style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>{fmtUsd(cr.finalValue)}</p>
                    </div>
                    <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>APY hiệu quả</p>
                      <p style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>{cr.annualizedReturn}%</p>
                    </div>
                    <div className="p-2 rounded-xl" style={{ background: c.surface2 }}>
                      <p style={{ color: c.text3, fontSize: FONT_SCALE.micro }}>Drawdown</p>
                      <p style={{ color: cr.maxDrawdown > 1 ? '#EF4444' : '#F59E0B', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                        {cr.maxDrawdown.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </TrCard>
              );
            })}
          </div>

          {/* Comparison insight */}
          <div className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
            <Info size={ICON_SIZE.sm} color="#3B82F6" className="mt-0.5 shrink-0" />
            <p style={{ color: c.text2, fontSize: FONT_SCALE.xs, lineHeight: 1.5 }}>
              Chiến lược Tăng trưởng có APY hiệu quả cao nhất nhưng cũng có Drawdown lớn hơn.
              Chiến lược An toàn ổn định hơn nhưng lãi thấp hơn. Chọn theo khả năng chịu rủi ro của bạn.
            </p>
          </div>
        </PageContent>
      )}
    </PageLayout>
  );
}