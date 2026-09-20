import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeftRight, RefreshCw, Settings, Target, TrendingUp,
  Shield, Zap, ChevronRight, AlertTriangle, Info, Clock,
  CheckCircle, ArrowUpRight, ArrowDownRight, Sliders, Lock,
  Unlock, BarChart3, History, Play, Pause, Calendar,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout, StickyFooter } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import { fmtUsd, fmtPct } from '../../data/formatNumber';
import { BottomSheetV2, BottomSheetRow } from '../../components/ui/BottomSheetV2';
import { useIsDark } from '../../hooks/useIsDark';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA } from '../../constants/colors';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

interface AssetPosition {
  id: string;
  asset: string;
  product: string;
  type: 'flexible' | 'locked';
  currentValue: number;
  currentPct: number;
  targetPct: number;
  drift: number;      // currentPct - targetPct
  apy: number;
  color: string;
  lockDays: number | null;
  daysRemaining: number | null;
  rebalanceable: boolean; // locked positions can't be rebalanced
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  allocations: Record<string, number>; // asset -> target %
  riskLevel: 'low' | 'medium' | 'high';
  expectedAPY: number;
  color: string;
}

interface RebalanceAction {
  asset: string;
  direction: 'increase' | 'decrease';
  fromPct: number;
  toPct: number;
  usdAmount: number;
  color: string;
}

interface RebalanceEvent {
  id: string;
  date: string;
  strategy: string;
  actions: number;
  totalMoved: number;
  status: 'completed' | 'partial' | 'failed';
  driftBefore: number;
  driftAfter: number;
}

/* ═══════════════════════════════════════════════════════════
   Mock Data — Deterministic
   ═══════════════════════════════════════════════════════════ */

const TOTAL_PORTFOLIO = 10340.86;

const POSITIONS: AssetPosition[] = [
  {
    id: 'ms1', asset: 'USDT', product: 'USDT Linh hoạt', type: 'flexible',
    currentValue: 3500, currentPct: 33.85, targetPct: 30, drift: 3.85,
    apy: 4.5, color: '#26A17B', lockDays: null, daysRemaining: null, rebalanceable: true,
  },
  {
    id: 'ms2', asset: 'BTC', product: 'BTC Cố định 60D', type: 'locked',
    currentValue: 1350.86, currentPct: 13.06, targetPct: 25, drift: -11.94,
    apy: 3.5, color: '#F7931A', lockDays: 60, daysRemaining: 7, rebalanceable: false,
  },
  {
    id: 'ms3', asset: 'SOL', product: 'SOL Cố định 30D', type: 'locked',
    currentValue: 3250, currentPct: 31.43, targetPct: 25, drift: 6.43,
    apy: 6.5, color: '#9945FF', lockDays: 30, daysRemaining: 13, rebalanceable: false,
  },
  {
    id: 'ms4', asset: 'ETH', product: 'ETH Linh hoạt', type: 'flexible',
    currentValue: 2240, currentPct: 21.66, targetPct: 20, drift: 1.66,
    apy: 2.8, color: '#627EEA', lockDays: null, daysRemaining: null, rebalanceable: true,
  },
];

const STRATEGIES: Strategy[] = [
  {
    id: 'conservative',
    name: 'An toàn',
    description: 'Ưu tiên stablecoin, giảm biến động',
    icon: <Shield size={ICON_SIZE.base} />,
    allocations: { USDT: 50, BTC: 15, SOL: 10, ETH: 25 },
    riskLevel: 'low',
    expectedAPY: 3.95,
    color: '#10B981',
  },
  {
    id: 'balanced',
    name: 'Cân bằng',
    description: 'Phân bổ đều, cân đối rủi ro & lợi nhuận',
    allocations: { USDT: 30, BTC: 25, SOL: 25, ETH: 20 },
    icon: <Target size={ICON_SIZE.base} />,
    riskLevel: 'medium',
    expectedAPY: 4.48,
    color: '#3B82F6',
  },
  {
    id: 'growth',
    name: 'Tăng trưởng',
    description: 'Ưu tiên APY cao, chấp nhận biến động',
    allocations: { USDT: 15, BTC: 20, SOL: 40, ETH: 25 },
    icon: <TrendingUp size={ICON_SIZE.base} />,
    riskLevel: 'high',
    expectedAPY: 5.22,
    color: '#F59E0B',
  },
];

const REBALANCE_HISTORY: RebalanceEvent[] = [
  {
    id: 'rb1', date: '05/03/2026', strategy: 'Cân bằng', actions: 3,
    totalMoved: 820.50, status: 'completed', driftBefore: 8.2, driftAfter: 0.5,
  },
  {
    id: 'rb2', date: '20/02/2026', strategy: 'Cân bằng', actions: 2,
    totalMoved: 450.00, status: 'completed', driftBefore: 5.8, driftAfter: 0.3,
  },
  {
    id: 'rb3', date: '05/02/2026', strategy: 'An toàn', actions: 4,
    totalMoved: 1200.00, status: 'partial', driftBefore: 12.5, driftAfter: 4.2,
  },
  {
    id: 'rb4', date: '20/01/2026', strategy: 'Cân bằng', actions: 3,
    totalMoved: 680.00, status: 'completed', driftBefore: 7.1, driftAfter: 0.2,
  },
  {
    id: 'rb5', date: '05/01/2026', strategy: 'Tăng trưởng', actions: 2,
    totalMoved: 350.00, status: 'failed', driftBefore: 6.4, driftAfter: 6.4,
  },
];

/* ─── Drift history for bar chart ─── */
const DRIFT_HISTORY = [
  { date: '01/01', drift: 6.4 },
  { date: '15/01', drift: 7.1 },
  { date: '20/01', drift: 0.2 },
  { date: '01/02', drift: 5.1 },
  { date: '05/02', drift: 4.2 },
  { date: '15/02', drift: 5.8 },
  { date: '20/02', drift: 0.3 },
  { date: '01/03', drift: 4.5 },
  { date: '05/03', drift: 0.5 },
  { date: '09/03', drift: 5.94 },
];

/* ═══════════════════════════════════════════════════════════
   Tabs & Config
   ═══════════════════════════════════════════════════════════ */

const TABS = ['Tổng quan', 'Chiến lược', 'Lịch sử', 'Cài đặt'] as const;
type TabKey = typeof TABS[number];

const RISK_COLORS: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };
const RISK_LABELS: Record<string, string> = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const STATUS_COLORS: Record<string, string> = { completed: '#10B981', partial: '#F59E0B', failed: '#EF4444' };
const STATUS_LABELS: Record<string, string> = { completed: 'Hoàn tất', partial: 'Một phần', failed: 'Thất bại' };

/* ═══════════════════════════════════════════════════════════
   Chart Tooltip
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
        minWidth: 100,
      }}
    >
      <div style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginBottom: 4, fontWeight: FONT_WEIGHT.semibold }}>{label}</div>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-3">
          <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>{entry.name}</span>
          <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace' }}>
            {typeof entry.value === 'number' ? `${entry.value.toFixed(1)}%` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Skeleton
   ═══════════════════════════════════════════════════════════ */
function ChartSkeleton({ h = 160 }: { h?: number }) {
  const c = useThemeColors();
  return <div className="rounded-2xl animate-pulse" style={{ background: c.surface2, height: h }} />;
}

/* ═══════════════════════════════════════════════════════════
   Mini Allocation Ring
   ═══════════════════════════════════════════════════════════ */
function AllocationRing({
  data,
  size = 120,
  innerRadius = 34,
  outerRadius = 52,
  label,
}: {
  data: { name: string; value: number; color: string }[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  label?: string;
}) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              key="ring"
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map(d => <Cell key={d.name} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {label && (
        <span style={{ fontSize: FONT_SCALE.micro, color: c.text3, marginTop: 4, fontWeight: FONT_WEIGHT.semibold }}>{label}</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════ */
export function SavingsAutoRebalancePage() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true });

  const [tab, setTab] = useState<TabKey>('Tổng quan');
  const [activeStrategy, setActiveStrategy] = useState<string>('balanced');
  const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({
    USDT: 30, BTC: 25, SOL: 25, ETH: 20,
  });

  /* Settings state */
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [driftThreshold, setDriftThreshold] = useState(5);
  const [skipLocked, setSkipLocked] = useState(true);
  const [minTradeSize, setMinTradeSize] = useState(50);

  /* Sheets */
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showStrategyDetail, setShowStrategyDetail] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [showHistoryDetail, setShowHistoryDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RebalanceEvent | null>(null);
  const [rebalancing, setRebalancing] = useState(false);
  const [rebalanceDone, setRebalanceDone] = useState(false);

  /* Chart colors */
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  /* ─── Derived data ─── */
  const currentAlloc = POSITIONS.map(p => ({
    name: p.asset, value: p.currentPct, color: p.color,
  }));

  const strategy = STRATEGIES.find(s => s.id === activeStrategy) || STRATEGIES[1];
  const targetAlloc = POSITIONS.map(p => ({
    name: p.asset, value: strategy.allocations[p.asset] ?? p.targetPct, color: p.color,
  }));

  const totalDrift = useMemo(() => {
    return POSITIONS.reduce((sum, p) => {
      const target = strategy.allocations[p.asset] ?? p.targetPct;
      return sum + Math.abs(p.currentPct - target);
    }, 0) / 2; // Divide by 2 since drift is measured as total deviation
  }, [strategy]);

  const driftSeverity = totalDrift < 3 ? 'low' : totalDrift < 8 ? 'medium' : 'high';
  const driftSeverityColor = RISK_COLORS[driftSeverity];

  /* ─── Rebalance actions preview ─── */
  const rebalanceActions: RebalanceAction[] = useMemo(() => {
    return POSITIONS
      .filter(p => p.rebalanceable || !skipLocked)
      .map(p => {
        const target = strategy.allocations[p.asset] ?? p.targetPct;
        const diff = target - p.currentPct;
        const usdAmount = Math.abs(diff / 100) * TOTAL_PORTFOLIO;
        if (Math.abs(diff) < 0.5 || usdAmount < minTradeSize) return null;
        return {
          asset: p.asset,
          direction: diff > 0 ? 'increase' as const : 'decrease' as const,
          fromPct: p.currentPct,
          toPct: target,
          usdAmount,
          color: p.color,
        };
      })
      .filter(Boolean) as RebalanceAction[];
  }, [strategy, skipLocked, minTradeSize]);

  const totalToMove = rebalanceActions.reduce((s, a) => s + a.usdAmount, 0) / 2;

  /* ─── Handlers ─── */
  const handleApplyStrategy = useCallback((s: Strategy) => {
    setActiveStrategy(s.id);
    setCustomAllocations(s.allocations);
    hapticSelection();
  }, [hapticSelection]);

  const handleRebalance = useCallback(() => {
    setRebalancing(true);
    hapticLight();
    setTimeout(() => {
      setRebalancing(false);
      setRebalanceDone(true);
      setTimeout(() => {
        setShowConfirm(false);
        setShowPreview(false);
        setRebalanceDone(false);
      }, 1500);
    }, 2000);
  }, [hapticLight]);

  const handleSliderChange = useCallback((asset: string, value: number) => {
    setCustomAllocations(prev => {
      const newAlloc = { ...prev, [asset]: value };
      const total = Object.values(newAlloc).reduce((s, v) => s + v, 0);
      // Auto-adjust others proportionally if total > 100
      if (total > 100) {
        const excess = total - 100;
        const others = Object.keys(newAlloc).filter(k => k !== asset);
        const othersTotal = others.reduce((s, k) => s + newAlloc[k], 0);
        others.forEach(k => {
          newAlloc[k] = Math.max(0, newAlloc[k] - (excess * (newAlloc[k] / othersTotal)));
        });
      }
      return newAlloc;
    });
    setActiveStrategy('custom');
    hapticSelection();
  }, [hapticSelection]);

  /* ═══════════════════════════════════════════════════════════
     Tab: Tổng quan
     ═════════════════��═════════════════════════════════════════ */
  const renderOverview = () => (
    <>
      {/* Current vs Target allocation comparison */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight size={ICON_SIZE.sm} color="#3B82F6" />
          <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
            Hiện tại vs Mục tiêu
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 mb-4">
          <AllocationRing data={currentAlloc} label="Hiện tại" />
          <div className="flex flex-col items-center gap-1">
            <ArrowLeftRight size={ICON_SIZE.base} color={c.text3} />
            <div
              className="px-2 py-0.5 rounded-md"
              style={{ background: `${driftSeverityColor}14`, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold, color: driftSeverityColor }}
            >
              Drift {totalDrift.toFixed(1)}%
            </div>
          </div>
          <AllocationRing data={targetAlloc} label={strategy.name} />
        </div>

        {/* Per-asset drift bars */}
        <div className="flex flex-col gap-2">
          {POSITIONS.map(p => {
            const target = strategy.allocations[p.asset] ?? p.targetPct;
            const drift = p.currentPct - target;
            const absDrift = Math.abs(drift);
            const driftColor = absDrift < 2 ? '#10B981' : absDrift < 5 ? '#F59E0B' : '#EF4444';
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${p.color}14` }}
                >
                  <span style={{ fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.bold, color: p.color }}>{p.asset}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>
                      {p.currentPct.toFixed(1)}% → {target}%
                    </span>
                    <div className="flex items-center gap-1">
                      {!p.rebalanceable && (
                        <Lock size={ICON_SIZE.sm} color={c.text3} />
                      )}
                      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: driftColor, fontFamily: 'monospace' }}>
                        {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Drift bar visualization */}
                  <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        left: `${Math.min(p.currentPct, target)}%`,
                        width: `${absDrift}%`,
                        background: driftColor,
                        opacity: 0.6,
                        transition: 'all 0.3s ease',
                      }}
                    />
                    {/* Current marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 rounded-full"
                      style={{
                        left: `${p.currentPct}%`,
                        background: p.color,
                      }}
                    />
                    {/* Target marker */}
                    <div
                      className="absolute top-0 h-full w-0.5 rounded-full"
                      style={{
                        left: `${target}%`,
                        background: c.text1,
                        opacity: 0.4,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </TrCard>

      {/* Drift status card */}
      <TrCard className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${driftSeverityColor}14` }}
          >
            {totalDrift < 3 ? (
              <CheckCircle size={ICON_SIZE.base} color={driftSeverityColor} />
            ) : totalDrift < 8 ? (
              <AlertTriangle size={ICON_SIZE.base} color={driftSeverityColor} />
            ) : (
              <AlertTriangle size={ICON_SIZE.base} color={driftSeverityColor} />
            )}
          </div>
          <div className="flex-1">
            <div style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
              {totalDrift < 3 ? 'Danh mục cân bằng' : totalDrift < 8 ? 'Lệch nhẹ' : 'Cần tái cân bằng'}
            </div>
            <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              Tổng drift: {totalDrift.toFixed(1)}% · Ngưỡng: {driftThreshold}%
            </div>
          </div>
          {totalDrift >= 3 && (
            <button
              onClick={() => { setShowPreview(true); hapticSelection(); }}
              className="px-3 py-1.5 rounded-lg"
              style={{
                background: '#3B82F614',
                border: '1px solid #3B82F630',
                fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: '#3B82F6',
              }}
            >
              Xem trước
            </button>
          )}
        </div>
      </TrCard>

      {/* Drift history chart */}
      <TrCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={ICON_SIZE.sm} color="#F59E0B" />
          <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>Lịch sử Drift</span>
        </div>

        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DRIFT_HISTORY} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                key="x-axis"
                dataKey="date"
                tick={{ fontSize: 9, fill: axisColor }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                key="y-axis"
                tick={{ fontSize: 10, fill: axisColor }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip key="tooltip" content={<ChartTooltip />} />
              <Bar key="bar-drift" dataKey="drift" name="Drift" radius={[4, 4, 0, 0]}>
                {DRIFT_HISTORY.map((d, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={d.drift < 3 ? '#10B981' : d.drift < 8 ? '#F59E0B' : '#EF4444'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-4 mt-2">
          {[
            { label: '< 3% Tốt', color: '#10B981' },
            { label: '3-8% Lệch', color: '#F59E0B' },
            { label: '> 8% Cao', color: '#EF4444' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
              <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </TrCard>

      {/* Auto-rebalance status */}
      <TrCard className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: autoEnabled ? '#10B98114' : `${c.text3}14` }}
          >
            {autoEnabled ? <Play size={ICON_SIZE.base} color="#10B981" /> : <Pause size={ICON_SIZE.base} color={c.text3} />}
          </div>
          <div className="flex-1">
            <div style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
              Tự động tái cân bằng
            </div>
            <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              {autoEnabled
                ? `${frequency === 'daily' ? 'Hàng ngày' : frequency === 'weekly' ? 'Hàng tuần' : frequency === 'biweekly' ? '2 tuần/lần' : 'Hàng tháng'} · Ngưỡng ${driftThreshold}%`
                : 'Đã tắt'
              }
            </div>
          </div>
          <button
            onClick={() => { setAutoEnabled(v => !v); hapticSelection(); }}
            className="relative w-12 h-7 rounded-full transition-colors"
            style={{ background: autoEnabled ? '#10B981' : c.surface2, border: `1px solid ${autoEnabled ? '#10B981' : c.border}` }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
              style={{ left: autoEnabled ? 24 : 2 }}
            />
          </button>
        </div>
      </TrCard>

      {/* Quick stats */}
      <div className="flex gap-2">
        <TrCard className="flex-1 p-3 text-center">
          <RefreshCw size={ICON_SIZE.sm} color="#3B82F6" className="mx-auto mb-1" />
          <div style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
            {REBALANCE_HISTORY.filter(e => e.status === 'completed').length}
          </div>
          <div style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Lần cân bằng</div>
        </TrCard>
        <TrCard className="flex-1 p-3 text-center">
          <ArrowLeftRight size={ICON_SIZE.sm} color="#10B981" className="mx-auto mb-1" />
          <div style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
            {fmtUsd(REBALANCE_HISTORY.reduce((s, e) => s + e.totalMoved, 0))}
          </div>
          <div style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Tổng di chuyển</div>
        </TrCard>
        <TrCard className="flex-1 p-3 text-center">
          <TrendingUp size={ICON_SIZE.sm} color="#F59E0B" className="mx-auto mb-1" />
          <div style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1, fontFamily: 'monospace' }}>
            {strategy.expectedAPY.toFixed(2)}%
          </div>
          <div style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>APY kỳ vọng</div>
        </TrCard>
      </div>
    </>
  );

  /* ═══════════════════════════════════════════════════════════
     Tab: Chiến lược
     ═══════════════════════════════════════════════════════════ */
  const renderStrategy = () => {
    const customTotal = Object.values(customAllocations).reduce((s, v) => s + v, 0);
    const customValid = Math.abs(customTotal - 100) < 1;

    return (
      <>
        {/* Preset strategies */}
        <PageSection label="Chiến lược đề xuất" accentColor="#3B82F6">
          {STRATEGIES.map(s => {
            const isActive = activeStrategy === s.id;
            return (
              <TrCard
                key={s.id}
                hover
                as="button"
                className="p-3 w-full text-left"
                accentBorder={isActive ? `${s.color}40` : undefined}
                onClick={() => handleApplyStrategy(s)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${s.color}14`, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>{s.name}</span>
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{
                          fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold,
                          background: `${RISK_COLORS[s.riskLevel]}14`,
                          color: RISK_COLORS[s.riskLevel],
                        }}
                      >
                        {RISK_LABELS[s.riskLevel]}
                      </span>
                      {isActive && (
                        <CheckCircle size={ICON_SIZE.sm} color={s.color} className="shrink-0" />
                      )}
                    </div>
                    <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>{s.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, color: s.color, fontFamily: 'monospace' }}>
                      {s.expectedAPY.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>APY</div>
                  </div>
                  <ChevronRight
                    size={ICON_SIZE.sm}
                    color={c.text3}
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStrategy(s);
                      setShowStrategyDetail(true);
                    }}
                  />
                </div>

                {/* Allocation preview */}
                {isActive && (
                  <div className="mt-3 flex gap-1">
                    {Object.entries(s.allocations).map(([asset, pct]) => {
                      const pos = POSITIONS.find(p => p.asset === asset);
                      return (
                        <div
                          key={asset}
                          className="rounded-full"
                          style={{
                            flex: pct,
                            height: 6,
                            background: pos?.color ?? c.text3,
                            transition: 'flex 0.4s ease',
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </TrCard>
            );
          })}
        </PageSection>

        {/* Custom allocation */}
        <PageSection label="Tùy chỉnh phân bổ" accentColor="#8B5CF6">
          <TrCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders size={ICON_SIZE.sm} color="#8B5CF6" />
                <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>Phân bổ tùy chỉnh</span>
              </div>
              <span
                style={{
                  fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace',
                  color: customValid ? '#10B981' : '#EF4444',
                }}
              >
                Tổng: {customTotal.toFixed(0)}%
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {POSITIONS.map(p => {
                const val = customAllocations[p.asset] ?? 25;
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                        <span style={{ fontSize: FONT_SCALE.xs, color: c.text1, fontWeight: FONT_WEIGHT.medium }}>{p.asset}</span>
                      </div>
                      <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: p.color, fontFamily: 'monospace' }}>
                        {val.toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={80}
                      step={5}
                      value={val}
                      onChange={e => handleSliderChange(p.asset, parseFloat(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${p.color} 0%, ${p.color} ${(val / 80) * 100}%, ${c.surface2} ${(val / 80) * 100}%, ${c.surface2} 100%)`,
                        accentColor: p.color,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Visual bar */}
            <div className="flex gap-0.5 mt-3 rounded-full overflow-hidden">
              {POSITIONS.map(p => {
                const val = customAllocations[p.asset] ?? 25;
                return (
                  <div
                    key={p.asset}
                    className="h-2 transition-all duration-300"
                    style={{ flex: val, background: p.color }}
                  />
                );
              })}
            </div>

            {!customValid && (
              <div
                className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
                style={{ background: '#EF444414', border: '1px solid #EF444420' }}
              >
                <AlertTriangle size={ICON_SIZE.sm} color="#EF4444" />
                <span style={{ fontSize: FONT_SCALE.xs, color: '#EF4444' }}>
                  Tổng phân bổ phải bằng 100%. Hiện tại: {customTotal.toFixed(0)}%
                </span>
              </div>
            )}

            {activeStrategy === 'custom' && customValid && (
              <button
                onClick={() => { setShowPreview(true); hapticSelection(); }}
                className="w-full mt-3 py-2.5 rounded-xl"
                style={{
                  background: '#8B5CF614', border: '1px solid #8B5CF630',
                  fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: '#8B5CF6',
                }}
              >
                Xem trước tái cân bằng
              </button>
            )}
          </TrCard>
        </PageSection>

        {/* Strategy comparison */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info size={ICON_SIZE.sm} color="#3B82F6" />
            <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>So sánh chiến lược</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: FONT_SCALE.xs }}>
              <thead>
                <tr>
                  <th className="text-left py-1.5 pr-2" style={{ color: c.text3, fontWeight: FONT_WEIGHT.medium }}>Chỉ số</th>
                  {STRATEGIES.map(s => (
                    <th key={s.id} className="text-center py-1.5 px-1" style={{ color: s.color, fontWeight: FONT_WEIGHT.semibold }}>
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'APY', values: STRATEGIES.map(s => `${s.expectedAPY.toFixed(2)}%`) },
                  { label: 'Rủi ro', values: STRATEGIES.map(s => RISK_LABELS[s.riskLevel]) },
                  { label: 'Stablecoin', values: STRATEGIES.map(s => `${s.allocations.USDT}%`) },
                  { label: 'BTC', values: STRATEGIES.map(s => `${s.allocations.BTC}%`) },
                  { label: 'Altcoin', values: STRATEGIES.map(s => `${(s.allocations.SOL || 0) + (s.allocations.ETH || 0)}%`) },
                ].map(row => (
                  <tr key={row.label} style={{ borderTop: `1px solid ${c.divider}` }}>
                    <td className="py-1.5 pr-2" style={{ color: c.text2 }}>{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="text-center py-1.5 px-1" style={{ color: c.text1, fontFamily: 'monospace', fontWeight: FONT_WEIGHT.medium }}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TrCard>
      </>
    );
  };

  /* ═══════════════════════════════════════════════════════════
     Tab: Lịch sử
     ═══════════════════════════════════════════════════════════ */
  const renderHistory = () => (
    <>
      {REBALANCE_HISTORY.length === 0 ? (
        <TrCard className="p-8 text-center">
          <History size={ICON_SIZE.xl} color={c.text3} className="mx-auto mb-3" style={{ opacity: 0.4 }} />
          <div style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold, color: c.text2 }}>Chưa có lịch sử</div>
          <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>Tái cân bằng đầu tiên sẽ hiển thị ở đây</div>
        </TrCard>
      ) : (
        <PageSection label={`${REBALANCE_HISTORY.length} lần tái cân bằng`} accentColor="#3B82F6">
          {REBALANCE_HISTORY.map(event => (
            <TrCard
              key={event.id}
              hover
              as="button"
              className="p-3 w-full text-left"
              onClick={() => {
                setSelectedEvent(event);
                setShowHistoryDetail(true);
                hapticSelection();
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${STATUS_COLORS[event.status]}14` }}
                >
                  {event.status === 'completed' ? (
                    <CheckCircle size={ICON_SIZE.base} color={STATUS_COLORS[event.status]} />
                  ) : event.status === 'partial' ? (
                    <AlertTriangle size={ICON_SIZE.base} color={STATUS_COLORS[event.status]} />
                  ) : (
                    <AlertTriangle size={ICON_SIZE.base} color={STATUS_COLORS[event.status]} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                      {event.strategy}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{
                        fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold,
                        background: `${STATUS_COLORS[event.status]}14`,
                        color: STATUS_COLORS[event.status],
                      }}
                    >
                      {STATUS_LABELS[event.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                    {event.date} · {event.actions} thao tác · {fmtUsd(event.totalMoved)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span style={{ fontSize: FONT_SCALE.xs, color: '#EF4444', fontFamily: 'monospace' }}>
                      {event.driftBefore.toFixed(1)}%
                    </span>
                    <ArrowLeftRight size={ICON_SIZE.sm} color={c.text3} />
                    <span style={{ fontSize: FONT_SCALE.xs, color: '#10B981', fontFamily: 'monospace' }}>
                      {event.driftAfter.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>Drift</div>
                </div>
                <ChevronRight size={ICON_SIZE.sm} color={c.text3} className="shrink-0" />
              </div>
            </TrCard>
          ))}
        </PageSection>
      )}
    </>
  );

  /* ═══════════════════════════════════════════════════════════
     Tab: Cài đặt
     ═══════════════════════════════════════════════════════════ */
  const renderSettings = () => (
    <>
      {/* Auto-rebalance toggle */}
      <TrCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: autoEnabled ? '#10B98114' : `${c.text3}14` }}
          >
            <RefreshCw size={ICON_SIZE.base} color={autoEnabled ? '#10B981' : c.text3} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
              Tự động tái cân bằng
            </div>
            <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
              Tự động điều chỉnh khi drift vượt ngưỡng
            </div>
          </div>
          <button
            onClick={() => { setAutoEnabled(v => !v); hapticSelection(); }}
            className="relative w-12 h-7 rounded-full transition-colors"
            style={{ background: autoEnabled ? '#10B981' : c.surface2, border: `1px solid ${autoEnabled ? '#10B981' : c.border}` }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
              style={{ left: autoEnabled ? 24 : 2 }}
            />
          </button>
        </div>

        {autoEnabled && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl"
            style={{ background: '#10B9810D', border: '1px solid #10B98120' }}
          >
            <Info size={ICON_SIZE.sm} color="#10B981" className="shrink-0 mt-0.5" />
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>
              Hệ thống sẽ tự động thực hiện tái cân bằng khi drift vượt ngưỡng đã cài đặt. Chỉ áp dụng cho vị thế linh hoạt.
            </span>
          </div>
        )}
      </TrCard>

      {/* Frequency */}
      <PageSection label="Tần suất kiểm tra" accentColor="#3B82F6">
        <TrCard className="p-4">
          <div className="flex gap-2">
            {([
              { key: 'daily', label: 'Hàng ngày' },
              { key: 'weekly', label: 'Hàng tuần' },
              { key: 'biweekly', label: '2 tuần' },
              { key: 'monthly', label: 'Hàng tháng' },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => { setFrequency(f.key); hapticSelection(); }}
                className="flex-1 py-2 rounded-lg"
                style={{
                  background: frequency === f.key ? '#3B82F614' : c.surface2,
                  border: frequency === f.key ? '1.5px solid #3B82F640' : `1px solid ${c.border}`,
                  color: frequency === f.key ? '#3B82F6' : c.text3,
                  fontSize: FONT_SCALE.xs, fontWeight: frequency === f.key ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </TrCard>
      </PageSection>

      {/* Drift threshold */}
      <PageSection label="Ngưỡng Drift" accentColor="#F59E0B">
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>Tái cân bằng khi drift vượt</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#F59E0B', fontFamily: 'monospace' }}>
              {driftThreshold}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={driftThreshold}
            onChange={e => setDriftThreshold(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${((driftThreshold - 1) / 14) * 100}%, ${c.surface2} ${((driftThreshold - 1) / 14) * 100}%, ${c.surface2} 100%)`,
              accentColor: '#F59E0B',
            }}
          />
          <div className="flex items-center justify-between mt-1">
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>1% (Nhạy)</span>
            <span style={{ fontSize: FONT_SCALE.micro, color: c.text3 }}>15% (Chậm)</span>
          </div>
        </TrCard>
      </PageSection>

      {/* Min trade size */}
      <PageSection label="Giá trị giao dịch tối thiểu" accentColor="#8B5CF6">
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>Bỏ qua nếu dưới</span>
            <span style={{ fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, color: '#8B5CF6', fontFamily: 'monospace' }}>
              {fmtUsd(minTradeSize)}
            </span>
          </div>
          <div className="flex gap-2">
            {[10, 25, 50, 100, 200].map(v => (
              <button
                key={v}
                onClick={() => { setMinTradeSize(v); hapticSelection(); }}
                className="flex-1 py-2 rounded-lg"
                style={{
                  background: minTradeSize === v ? '#8B5CF614' : c.surface2,
                  border: minTradeSize === v ? '1.5px solid #8B5CF640' : `1px solid ${c.border}`,
                  color: minTradeSize === v ? '#8B5CF6' : c.text3,
                  fontSize: FONT_SCALE.xs, fontWeight: minTradeSize === v ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
                }}
              >
                ${v}
              </button>
            ))}
          </div>
        </TrCard>
      </PageSection>

      {/* Locked positions */}
      <PageSection label="Vị thế cố định" accentColor="#EF4444">
        <TrCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#EF444414' }}>
              <Lock size={ICON_SIZE.base} color="#EF4444" />
            </div>
            <div className="flex-1">
              <div style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                Bỏ qua vị thế đang khóa
              </div>
              <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                Không di chuyển tiền từ vị thế cố định chưa đáo hạn
              </div>
            </div>
            <button
              onClick={() => { setSkipLocked(v => !v); hapticSelection(); }}
              className="relative w-12 h-7 rounded-full transition-colors"
              style={{ background: skipLocked ? '#10B981' : c.surface2, border: `1px solid ${skipLocked ? '#10B981' : c.border}` }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
                style={{ left: skipLocked ? 24 : 2 }}
              />
            </button>
          </div>

          {!skipLocked && (
            <div
              className="flex items-start gap-2 mt-3 p-3 rounded-xl"
              style={{ background: '#EF44440D', border: '1px solid #EF444420' }}
            >
              <AlertTriangle size={ICON_SIZE.sm} color="#EF4444" className="shrink-0 mt-0.5" />
              <span style={{ fontSize: FONT_SCALE.xs, color: '#EF4444' }}>
                Rút sớm vị thế cố định có thể mất lãi tích lũy. Chỉ bật nếu thật sự cần thiết.
              </span>
            </div>
          )}
        </TrCard>
      </PageSection>
    </>
  );

  /* ═══════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════ */
  return (
    <PageLayout variant={tab === 'Tổng quan' ? 'flush' : 'default'}>
      <Header title="Tái cân bằng" subtitle="Auto-rebalance portfolio" back />
      <TabBar
        tabs={TABS}
        active={tab}
        onChange={t => { setTab(t); hapticSelection(); }}
      />

      <PageContent gap="default" grow={tab === 'Tổng quan'}>
        {isLoading ? (
          <>
            <ChartSkeleton h={100} />
            <ChartSkeleton h={220} />
            <ChartSkeleton h={160} />
          </>
        ) : (
          <>
            {tab === 'Tổng quan' && renderOverview()}
            {tab === 'Chiến lược' && renderStrategy()}
            {tab === 'Lịch sử' && renderHistory()}
            {tab === 'Cài đặt' && renderSettings()}
          </>
        )}
      </PageContent>

      {/* Sticky CTA for overview tab */}
      {tab === 'Tổng quan' && !isLoading && totalDrift >= 3 && (
        <StickyFooter>
          <CTAButton onClick={() => { setShowPreview(true); hapticSelection(); }}>
            <RefreshCw size={ICON_SIZE.base} />
            Tái cân bằng ngay
          </CTAButton>
        </StickyFooter>
      )}

      {/* ═══ Preview Sheet ═══ */}
      <BottomSheetV2
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Xem trước tái cân bằng"
      >
        <div className="flex flex-col gap-3 pb-4">
          {/* Summary */}
          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <BottomSheetRow label="Chiến lược" value={strategy.name} highlight />
            <BottomSheetRow label="Drift hiện tại" value={`${totalDrift.toFixed(1)}%`} valueColor={driftSeverityColor} />
            <BottomSheetRow label="Tổng di chuyển (ước tính)" value={fmtUsd(totalToMove)} />
            <BottomSheetRow label="Số thao tác" value={`${rebalanceActions.length}`} />
          </div>

          {/* Actions list */}
          <PageSection label="Các thay đổi" accentColor="#3B82F6">
            {rebalanceActions.length === 0 ? (
              <div
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{ background: '#10B9810D', border: '1px solid #10B98120' }}
              >
                <CheckCircle size={ICON_SIZE.sm} color="#10B981" />
                <span style={{ fontSize: FONT_SCALE.xs, color: '#10B981' }}>
                  Không có thao tác nào cần thiết. Danh mục đã cân bằng!
                </span>
              </div>
            ) : (
              rebalanceActions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: i < rebalanceActions.length - 1 ? `1px solid ${c.divider}` : undefined }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${action.color}14` }}
                  >
                    {action.direction === 'increase' ? (
                      <ArrowUpRight size={ICON_SIZE.sm} color="#10B981" />
                    ) : (
                      <ArrowDownRight size={ICON_SIZE.sm} color="#EF4444" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1 }}>
                      {action.direction === 'increase' ? 'Tăng' : 'Giảm'} {action.asset}
                    </div>
                    <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>
                      {action.fromPct.toFixed(1)}% → {action.toPct.toFixed(1)}%
                    </div>
                  </div>
                  <span style={{
                    fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace',
                    color: action.direction === 'increase' ? '#10B981' : '#EF4444',
                  }}>
                    {action.direction === 'increase' ? '+' : '-'}{fmtUsd(action.usdAmount)}
                  </span>
                </div>
              ))
            )}
          </PageSection>

          {/* Warning for locked */}
          {POSITIONS.some(p => !p.rebalanceable) && skipLocked && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl"
              style={{ background: '#F59E0B0D', border: '1px solid #F59E0B20' }}
            >
              <Lock size={ICON_SIZE.sm} color="#F59E0B" className="shrink-0 mt-0.5" />
              <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>
                Vị thế cố định (BTC 60D, SOL 30D) sẽ được bỏ qua. Tái cân bằng hoàn toàn sau khi đáo hạn.
              </span>
            </div>
          )}

          {rebalanceActions.length > 0 && (
            <CTAButton
              variant="primary"
              onClick={() => { setShowConfirm(true); hapticSelection(); }}
            >
              Xác nhận tái cân bằng
            </CTAButton>
          )}
        </div>
      </BottomSheetV2>

      {/* ═══ Confirm Sheet ═══ */}
      <BottomSheetV2
        open={showConfirm}
        onClose={() => !rebalancing && setShowConfirm(false)}
        title="Xác nhận tái cân bằng"
        preventClose={rebalancing}
      >
        <div className="flex flex-col gap-4 pb-4">
          {rebalanceDone ? (
            <div className="text-center py-6">
              <CheckCircle size={ICON_SIZE.xl} color="#10B981" className="mx-auto mb-3" />
              <div style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: '#10B981' }}>Thành công!</div>
              <div style={{ fontSize: FONT_SCALE.xs, color: c.text2, marginTop: 4 }}>
                Danh mục đã được tái cân bằng theo chiến lược {strategy.name}
              </div>
            </div>
          ) : (
            <>
              <div
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: '#F59E0B0D', border: '1px solid #F59E0B20' }}
              >
                <AlertTriangle size={ICON_SIZE.sm} color="#F59E0B" className="shrink-0 mt-0.5" />
                <span style={{ fontSize: FONT_SCALE.xs, color: c.text2 }}>
                  Tái cân bằng sẽ di chuyển khoảng {fmtUsd(totalToMove)} giữa các sản phẩm tiết kiệm.
                  Vị thế linh hoạt sẽ được rút và gửi lại. Quá trình có thể mất vài phút.
                </span>
              </div>

              <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
                <BottomSheetRow label="Chiến lược" value={strategy.name} />
                <BottomSheetRow label="Số thao tác" value={`${rebalanceActions.length}`} />
                <BottomSheetRow label="Ước tính di chuyển" value={fmtUsd(totalToMove)} highlight />
                <BottomSheetRow label="Phí" value="Miễn phí" valueColor="#10B981" />
              </div>

              <CTAButton
                variant="warning"
                loading={rebalancing}
                onClick={handleRebalance}
              >
                {rebalancing ? 'Đang xử lý...' : 'Xác nhận tái cân bằng'}
              </CTAButton>
            </>
          )}
        </div>
      </BottomSheetV2>

      {/* ═══ Strategy Detail Sheet ═══ */}
      <BottomSheetV2
        open={showStrategyDetail}
        onClose={() => setShowStrategyDetail(false)}
        title={selectedStrategy?.name || 'Chi tiết chiến lược'}
      >
        {selectedStrategy && (
          <div className="flex flex-col gap-3 pb-4">
            <div className="flex items-center gap-3 py-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${selectedStrategy.color}14`, color: selectedStrategy.color }}
              >
                {selectedStrategy.icon}
              </div>
              <div>
                <div style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>{selectedStrategy.name}</div>
                <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>{selectedStrategy.description}</div>
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <BottomSheetRow label="APY kỳ vọng" value={`${selectedStrategy.expectedAPY.toFixed(2)}%`} valueColor={selectedStrategy.color} highlight />
              <BottomSheetRow label="Mức rủi ro" value={RISK_LABELS[selectedStrategy.riskLevel]} valueColor={RISK_COLORS[selectedStrategy.riskLevel]} />
            </div>

            <PageSection label="Phân bổ mục tiêu" accentColor={selectedStrategy.color}>
              {Object.entries(selectedStrategy.allocations).map(([asset, pct]) => {
                const pos = POSITIONS.find(p => p.asset === asset);
                return (
                  <div key={asset} className="flex items-center gap-3 py-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: pos?.color ?? c.text3 }} />
                    <span className="flex-1" style={{ fontSize: FONT_SCALE.xs, color: c.text1 }}>{asset}</span>
                    <span style={{ fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, color: c.text1, fontFamily: 'monospace' }}>{pct}%</span>
                  </div>
                );
              })}
            </PageSection>

            {/* Allocation bar */}
            <div className="flex gap-0.5 rounded-full overflow-hidden">
              {Object.entries(selectedStrategy.allocations).map(([asset, pct]) => {
                const pos = POSITIONS.find(p => p.asset === asset);
                return (
                  <div
                    key={asset}
                    className="h-2.5"
                    style={{ flex: pct, background: pos?.color ?? c.text3, transition: 'flex 0.3s ease' }}
                  />
                );
              })}
            </div>

            <CTAButton onClick={() => {
              handleApplyStrategy(selectedStrategy);
              setShowStrategyDetail(false);
            }}>
              Áp dụng chiến lược này
            </CTAButton>
          </div>
        )}
      </BottomSheetV2>

      {/* ═══ History Detail Sheet ═══ */}
      <BottomSheetV2
        open={showHistoryDetail}
        onClose={() => setShowHistoryDetail(false)}
        title="Chi tiết tái cân bằng"
      >
        {selectedEvent && (
          <div className="flex flex-col gap-3 pb-4">
            <div className="flex items-center gap-3 py-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${STATUS_COLORS[selectedEvent.status]}14` }}
              >
                {selectedEvent.status === 'completed'
                  ? <CheckCircle size={ICON_SIZE.md} color={STATUS_COLORS[selectedEvent.status]} />
                  : <AlertTriangle size={ICON_SIZE.md} color={STATUS_COLORS[selectedEvent.status]} />
                }
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: FONT_SCALE.base, fontWeight: FONT_WEIGHT.bold, color: c.text1 }}>
                    {selectedEvent.strategy}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded"
                    style={{
                      fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold,
                      background: `${STATUS_COLORS[selectedEvent.status]}14`,
                      color: STATUS_COLORS[selectedEvent.status],
                    }}
                  >
                    {STATUS_LABELS[selectedEvent.status]}
                  </span>
                </div>
                <div style={{ fontSize: FONT_SCALE.xs, color: c.text3 }}>{selectedEvent.date}</div>
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <BottomSheetRow label="Số thao tác" value={`${selectedEvent.actions}`} />
              <BottomSheetRow label="Tổng di chuyển" value={fmtUsd(selectedEvent.totalMoved)} highlight />
              <BottomSheetRow label="Drift trước" value={`${selectedEvent.driftBefore.toFixed(1)}%`} valueColor="#EF4444" />
              <BottomSheetRow label="Drift sau" value={`${selectedEvent.driftAfter.toFixed(1)}%`} valueColor="#10B981" />
              <BottomSheetRow
                label="Cải thiện"
                value={`-${(selectedEvent.driftBefore - selectedEvent.driftAfter).toFixed(1)}%`}
                valueColor="#10B981"
              />
            </div>
          </div>
        )}
      </BottomSheetV2>
    </PageLayout>
  );
}
