import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Wallet, PiggyBank, Lock, Unlock, ChevronRight,
  Calendar, RefreshCw, ArrowUpFromLine, ArrowDownToLine, Clock,
  Eye, EyeOff, Info, Zap, Shield, AlertTriangle, RotateCcw,
  Sun, CalendarDays, BarChart3,
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
import { fmtUsd, fmtAmount } from '../../data/formatNumber';
import { TrCard, TrCardStat } from '../../components/ui/TrCard';
import { useIsDark } from '../../hooks/useIsDark';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { ChartGradientDefs, CHART_GRADIENTS } from '../../components/charts/ChartGradientDefs';
import { φRadius } from '../../utils/golden';
import { FONT_SCALE, FONT_WEIGHT, LETTER_SPACING } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE, ICON_CONTAINER } from '../../constants/icons';
import { ALPHA, OPACITY, CRYPTO_COLORS, withAlpha } from '../../constants/colors';
import { TOUCH_TARGET } from '../../constants/spacing';

/* ═══════════════════════════════════════════════════════════
   Mock: User's active savings positions (aligned with SavingsPage)
   ═══════════════════════════════════════════════════════════ */
interface SavingsPosition {
  id: string;
  product: string;
  asset: string;
  type: 'flexible' | 'locked';
  amount: number;
  usdValue: number;
  earned: number;
  earnedUsd: number;
  apy: number;
  startDate: string;
  endDate: string | null;
  lockDays: number | null;
  status: 'active' | 'maturing' | 'completed';
  color: string;
  autoCompound: boolean;
}

const POSITIONS: SavingsPosition[] = [
  {
    id: 'ms1', product: 'USDT Linh hoạt', asset: 'USDT', type: 'flexible',
    amount: 3500, usdValue: 3500, earned: 14.58, earnedUsd: 14.58,
    apy: 4.5, startDate: '01/02/2026', endDate: null, lockDays: null,
    status: 'active', color: '#26A17B', autoCompound: true,
  },
  {
    id: 'ms2', product: 'BTC Cố định 60D', asset: 'BTC', type: 'locked',
    amount: 0.02, usdValue: 1350.86, earned: 0.000019, earnedUsd: 1.28,
    apy: 3.5, startDate: '15/01/2026', endDate: '16/03/2026', lockDays: 60,
    status: 'maturing', color: '#F7931A', autoCompound: false,
  },
  {
    id: 'ms3', product: 'SOL Cố định 30D', asset: 'SOL', type: 'locked',
    amount: 25, usdValue: 3250, earned: 0.45, earnedUsd: 58.50,
    apy: 6.5, startDate: '20/02/2026', endDate: '22/03/2026', lockDays: 30,
    status: 'active', color: '#9945FF', autoCompound: false,
  },
  {
    id: 'ms4', product: 'ETH Linh hoạt', asset: 'ETH', type: 'flexible',
    amount: 0.8, usdValue: 2240, earned: 0.0012, earnedUsd: 3.36,
    apy: 2.8, startDate: '05/02/2026', endDate: null, lockDays: null,
    status: 'active', color: '#627EEA', autoCompound: true,
  },
];

/* ─── Earnings trend data (deterministic) ─── */
const EARNINGS_TREND = [
  { date: '01/01', total: 0, cumulative: 0 },
  { date: '15/01', total: 2.10, cumulative: 2.10 },
  { date: '01/02', total: 5.80, cumulative: 7.90 },
  { date: '15/02', total: 9.45, cumulative: 17.35 },
  { date: '01/03', total: 18.20, cumulative: 35.55 },
  { date: '09/03', total: 42.17, cumulative: 77.72 },
];

/* ─── Daily earnings breakdown ─── */
const DAILY_EARNINGS = [
  { date: '03/03', amount: 1.12 },
  { date: '04/03', amount: 1.14 },
  { date: '05/03', amount: 1.15 },
  { date: '06/03', amount: 1.13 },
  { date: '07/03', amount: 1.16 },
  { date: '08/03', amount: 1.18 },
  { date: '09/03', amount: 1.19 },
];

/* ─── Maturity timeline ─── */
const MATURITY_EVENTS = [
  { id: 'ms2', product: 'BTC Cố định 60D', date: '16/03/2026', daysLeft: 7, asset: 'BTC', amount: 0.02, usdValue: 1350.86, apy: 3.5, lockDays: 60, elapsed: 53, color: '#F7931A' },
  { id: 'ms3', product: 'SOL Cố định 30D', date: '22/03/2026', daysLeft: 13, asset: 'SOL', amount: 25, usdValue: 3250, apy: 6.5, lockDays: 30, elapsed: 17, color: '#9945FF' },
  { id: 'ms5', product: 'ETH Cố định 90D', date: '15/05/2026', daysLeft: 67, asset: 'ETH', amount: 0.5, usdValue: 1400, apy: 4.2, lockDays: 90, elapsed: 23, color: '#627EEA' },
];

/** Urgency tier based on days remaining */
function getUrgencyTier(daysLeft: number) {
  if (daysLeft <= 3) return { tier: 'critical' as const, label: 'Sắp đến hạn', color: '#EF4444', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)', icon: '🔴' };
  if (daysLeft <= 7) return { tier: 'urgent' as const, label: 'Gần đáo hạn', color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', icon: '🟡' };
  if (daysLeft <= 14) return { tier: 'soon' as const, label: 'Sắp tới', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.20)', icon: '🔵' };
  return { tier: 'safe' as const, label: 'Còn lâu', color: '#10B981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.15)', icon: '🟢' };
}

/* ─── Tab config ─── */
const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'positions', label: 'Vị thế' },
  { key: 'earnings', label: 'Thu nhập' },
] as const;
type TabKey = typeof TABS[number]['key'];

/* ─── Skeleton ─── */
function SkeletonCard({ h = 160 }: { h?: number }) {
  const c = useThemeColors();
  return (
    <div className="rounded-2xl animate-pulse" style={{ background: c.surface2, height: h }} />
  );
}

/* ═══════════════════════════════════════════════════════════ */
export function SavingsPortfolioPage() {
  const c = useThemeColors();
  const isDark = useIsDark();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hapticSelection, hapticLight } = useHaptic();
  const { isLoading } = useLoadingState({ loadOnly: true, initialDelay: 500 });

  const [tab, setTab] = useState<TabKey>('overview');
  const [hideBalance, setHideBalance] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [earningsRange, setEarningsRange] = useState<'7d' | '30d' | '90d' | 'all'>('all');
  const [posFilter, setPosFilter] = useState<'all' | 'flexible' | 'locked'>('all');

  /* ─── Computed totals ─── */
  const totalDeposited = POSITIONS.reduce((s, p) => s + p.usdValue, 0);
  const totalEarned = POSITIONS.reduce((s, p) => s + p.earnedUsd, 0);
  const weightedAPY = totalDeposited > 0
    ? POSITIONS.reduce((s, p) => s + (p.apy * p.usdValue), 0) / totalDeposited
    : 0;
  const dailyEarnings = totalDeposited * (weightedAPY / 100 / 365);
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyProjection = dailyEarnings * 365;

  const activeCount = POSITIONS.filter(p => p.status === 'active').length;
  const maturingCount = POSITIONS.filter(p => p.status === 'maturing').length;
  const flexibleTotal = POSITIONS.filter(p => p.type === 'flexible').reduce((s, p) => s + p.usdValue, 0);
  const lockedTotal = POSITIONS.filter(p => p.type === 'locked').reduce((s, p) => s + p.usdValue, 0);

  /* Allocation pie data */
  const allocationData = POSITIONS.map(p => ({
    name: p.asset,
    value: p.usdValue,
    color: p.color,
  }));

  const handleRefresh = () => {
    setIsRefreshing(true);
    hapticLight();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  /* ─── Render helpers ─── */
  const renderBalance = (val: number, prefix2 = '$') =>
    hideBalance ? '••••••' : `${prefix2}${fmtUsd(val, { prefix: false })}`;

  /* ═══ OVERVIEW TAB ═══ */
  const renderOverview = () => (
    <>
      {/* ─── Hero Portfolio Card (matched to SavingsPage hero card) ─── */}
      <div
        className="relative overflow-hidden"
        style={{
          padding: '22px 20px 20px',
          borderRadius: φRadius.lg,
          background: c.portfolioBg,
          border: `1px solid ${c.portfolioBorder}`,
          boxShadow: c.portfolioShadow,
        }}
      >
        {/* Decorative radial glows */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-64 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
        />

        {/* Header row — matches SavingsPage: label left, icon+actions right */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <span style={{ color: c.portfolioTextDim, fontSize: FONT_SCALE.sm }}>Tổng tiết kiệm (USD)</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setHideBalance(v => !v); hapticLight(); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `rgba(255,255,255,${OPACITY.muted})`,
                border: `1px solid rgba(255,255,255,${OPACITY.border})`,
              }}
            >
              {hideBalance
                ? <EyeOff size={ICON_SIZE.sm} color="rgba(255,255,255,0.6)" strokeWidth={ICON_STROKE.standard} />
                : <Eye size={ICON_SIZE.sm} color="rgba(255,255,255,0.6)" strokeWidth={ICON_STROKE.standard} />}
            </button>
            <button
              onClick={handleRefresh}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: `rgba(255,255,255,${OPACITY.muted})`,
                border: `1px solid rgba(255,255,255,${OPACITY.border})`,
              }}
            >
              <RefreshCw
                size={ICON_SIZE.sm}
                color="rgba(255,255,255,0.6)"
                strokeWidth={ICON_STROKE.standard}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>

        {/* Balance */}
        <p
          className="relative z-10"
          style={{
            color: '#FFFFFF',
            fontSize: FONT_SCALE.xl,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
            letterSpacing: LETTER_SPACING.tight,
            lineHeight: 1.1,
          }}
        >
          {hideBalance ? '••••••' : renderBalance(totalDeposited)}
        </p>

        {/* PnL pill + label — matches SavingsPage single-pill pattern */}
        <div className="flex items-center gap-2.5 mt-2 mb-5 relative z-10">
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <TrendingUp size={ICON_SIZE.sm} color={c.success} strokeWidth={ICON_STROKE.emphasis} />
            <span style={{ color: c.success, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              {hideBalance ? '••••' : `+${renderBalance(totalEarned)}`} ({weightedAPY.toFixed(1)}%)
            </span>
          </div>
          <span style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>lãi tích luỹ</span>
        </div>

        {/* Glass stat pills — 3 columns */}
        <div className="flex gap-3 relative z-10 mb-4">
          {/* Linh hoạt */}
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: `rgba(255,255,255,${OPACITY.muted})`,
              border: `1px solid rgba(255,255,255,${OPACITY.border})`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Linh hoạt</span>
            <span style={{ color: '#FFFFFF', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {hideBalance ? '••••' : renderBalance(flexibleTotal)}
            </span>
          </div>
          {/* Cố định */}
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: `rgba(255,255,255,${OPACITY.muted})`,
              border: `1px solid rgba(255,255,255,${OPACITY.border})`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Cố định</span>
            <span style={{ color: c.warning, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {hideBalance ? '••••' : renderBalance(lockedTotal)}
            </span>
          </div>
          {/* Vị thế */}
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: `rgba(255,255,255,${OPACITY.muted})`,
              border: `1px solid rgba(255,255,255,${OPACITY.border})`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.portfolioTextMuted, fontSize: FONT_SCALE.micro }}>Vị thế</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.success }} />
                <span style={{ color: '#FFFFFF', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{activeCount}</span>
              </div>
              {maturingCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.warning }} />
                  <span style={{ color: c.warning, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{maturingCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons — 3 equal columns, matched to SavingsPage */}
        <div className="flex gap-2.5 relative z-10">
          <button
            onClick={() => { navigate(`${prefix}/earn/savings`); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-1.5"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
              color: '#fff',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              boxShadow: '0 4px 14px rgba(5,150,105,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <ArrowDownToLine size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Gửi thêm
          </button>
          <button
            onClick={() => { navigate(`${prefix}/earn/savings`); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-1.5"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowUpFromLine size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Rút
          </button>
          <button
            onClick={() => { navigate(`${prefix}/earn/savings/history`); hapticSelection(); }}
            className="flex-1 flex items-center justify-center gap-1.5"
            style={{
              height: 44,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              backdropFilter: 'blur(8px)',
            }}
          >
            <Clock size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
            Lịch sử
          </button>
        </div>
      </div>

      {/* Asset allocation — POLISHED: Better legend styling */}
      <PageSection label="Phân bổ tài sản" accentColor="#3B82F6">
        <TrCard className="p-4">
          {/* Donut chart with center total */}
          <div className="flex justify-center mb-5" style={{ position: 'relative' }}>
            <div style={{ width: 160, height: 160, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    key="pie"
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={74}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {allocationData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ pointerEvents: 'none' }}
              >
                <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium, marginBottom: 1 }}>
                  Tổng
                </span>
                <span style={{
                  color: c.text,
                  fontSize: FONT_SCALE.base,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                  letterSpacing: LETTER_SPACING.tight,
                }}>
                  {hideBalance ? '••••' : renderBalance(totalDeposited)}
                </span>
              </div>
            </div>
          </div>

          {/* Legend rows — POLISHED */}
          <div className="flex flex-col gap-3">
            {allocationData.map((item) => {
              const pct = totalDeposited > 0 ? (item.value / totalDeposited) * 100 : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-md shrink-0"
                        style={{
                          background: item.color,
                          boxShadow: `0 2px 6px ${item.color}35`,
                        }}
                      />
                      <span style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{
                        color: c.text2,
                        fontSize: FONT_SCALE.sm,
                        fontWeight: FONT_WEIGHT.semibold,
                        fontFamily: 'monospace',
                      }}>
                        {hideBalance ? '••••' : renderBalance(item.value)}
                      </span>
                      <span
                        className="min-w-[42px] text-right"
                        style={{
                          color: c.text3,
                          fontSize: FONT_SCALE.xs,
                          fontWeight: FONT_WEIGHT.semibold,
                        }}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Percentage bar with gradient */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        background: `linear-gradient(90deg, ${item.color}CC, ${item.color})`,
                        width: `${pct}%`,
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>
      </PageSection>

      {/* Earnings projection — POLISHED: Lucide icons + better visual hierarchy */}
      <PageSection label="Dự phóng thu nhập" accentColor="#10B981">
        <div className="flex gap-2.5">
          {[
            { label: 'Hàng ngày', value: dailyEarnings, Icon: Sun, color: '#F59E0B' },
            { label: 'Hàng tháng', value: monthlyEarnings, Icon: CalendarDays, color: '#3B82F6' },
            { label: 'Hàng năm', value: yearlyProjection, Icon: BarChart3, color: '#10B981' },
          ].map(item => (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center gap-2 py-3.5 px-2.5 rounded-2xl"
              style={{
                background: c.surface2,
                border: `1px solid ${c.divider}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}25`,
                }}
              >
                <item.Icon size={ICON_SIZE.base} color={item.color} strokeWidth={ICON_STROKE.emphasis} />
              </div>
              <span style={{
                color: c.text3,
                fontSize: FONT_SCALE.micro,
                fontWeight: FONT_WEIGHT.medium,
                textAlign: 'center',
              }}>
                {item.label}
              </span>
              <span
                style={{
                  color: '#10B981',
                  fontSize: FONT_SCALE.base,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                  letterSpacing: LETTER_SPACING.tight,
                }}
              >
                ~{hideBalance ? '••••' : fmtUsd(item.value)}
              </span>
            </div>
          ))}
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl mt-2.5"
          style={{
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.12)',
          }}
        >
          <Info size={ICON_SIZE.sm} color="#3B82F6" className="shrink-0" />
          <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.micro, lineHeight: 1.5, fontWeight: FONT_WEIGHT.regular }}>
            Ước tính dựa trên APY hiện tại. Lãi suất có thể thay đổi theo điều kiện thị trường.
          </span>
        </div>
      </PageSection>

      {/* Maturity timeline */}
      {MATURITY_EVENTS.length > 0 && (() => {
        const sorted = [...MATURITY_EVENTS].sort((a, b) => a.daysLeft - b.daysLeft);
        const nearest = sorted[0];
        const nearestUrgency = getUrgencyTier(nearest.daysLeft);
        const totalMaturityValue = MATURITY_EVENTS.reduce((s, e) => s + e.usdValue, 0);

        return (
          <PageSection label="Lịch đáo hạn" accentColor="#F59E0B">
            {/* Timeline overview card — ENTERPRISE REDESIGN */}
            <TrCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.2)',
                    }}
                  >
                    <Calendar size={ICON_SIZE.base} color="#F59E0B" strokeWidth={ICON_STROKE.emphasis} />
                  </div>
                  <div>
                    <span style={{
                      color: c.text3,
                      fontSize: FONT_SCALE.xs,
                      fontWeight: FONT_WEIGHT.medium,
                      display: 'block',
                      marginBottom: 2,
                    }}>
                      Sắp đáo hạn
                    </span>
                    <span style={{
                      color: c.text,
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.semibold,
                    }}>
                      {MATURITY_EVENTS.length} khoản
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span style={{
                    color: c.text3,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                    display: 'block',
                    marginBottom: 2,
                  }}>
                    Tổng giá trị
                  </span>
                  <span style={{
                    color: c.text,
                    fontSize: FONT_SCALE.sm,
                    fontWeight: FONT_WEIGHT.bold,
                    fontFamily: 'monospace',
                  }}>
                    {hideBalance ? '••••••' : renderBalance(totalMaturityValue)}
                  </span>
                </div>
              </div>

              {/* Next maturity countdown — POLISHED */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: nearestUrgency.bg,
                  border: `1.5px solid ${nearestUrgency.border}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${nearestUrgency.color}20`,
                    border: `1px solid ${nearestUrgency.color}30`,
                  }}
                >
                  {(nearestUrgency.tier === 'critical' || nearestUrgency.tier === 'urgent')
                    ? <AlertTriangle size={ICON_SIZE.md} color={nearestUrgency.color} strokeWidth={ICON_STROKE.emphasis} />
                    : <Clock size={ICON_SIZE.md} color={nearestUrgency.color} strokeWidth={ICON_STROKE.emphasis} />}
                </div>
                <div className="flex-1">
                  <span style={{
                    color: nearestUrgency.color,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.semibold,
                    display: 'block',
                    marginBottom: 3,
                  }}>
                    Đáo hạn gần nhất
                  </span>
                  <div style={{
                    color: c.text,
                    fontSize: FONT_SCALE.sm,
                    fontWeight: FONT_WEIGHT.semibold,
                    marginBottom: 2,
                  }}>
                    {nearest.product}
                  </div>
                  <div style={{
                    color: c.text2,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.medium,
                  }}>
                    {nearest.date} — còn {nearest.daysLeft} ngày
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{
                      background: nearestUrgency.color,
                      boxShadow: `0 2px 8px ${nearestUrgency.color}40`,
                    }}
                  >
                    <div style={{
                      color: '#fff',
                      fontSize: FONT_SCALE.lg,
                      fontWeight: FONT_WEIGHT.bold,
                      fontFamily: 'monospace',
                      letterSpacing: LETTER_SPACING.tight,
                      lineHeight: 1,
                    }}>
                      {nearest.daysLeft}
                    </div>
                    <div style={{
                      color: '#fff',
                      fontSize: FONT_SCALE.micro,
                      fontWeight: FONT_WEIGHT.medium,
                      opacity: 0.85,
                      marginTop: 2,
                    }}>
                      ngày
                    </div>
                  </div>
                </div>
              </div>
            </TrCard>

            {/* Individual maturity cards — ENTERPRISE REDESIGN */}
            <div className="flex flex-col gap-3">
              {sorted.map((evt, idx) => {
                const urgency = getUrgencyTier(evt.daysLeft);
                const progress = evt.lockDays > 0
                  ? Math.min(100, Math.max(0, (evt.elapsed / evt.lockDays) * 100))
                  : 0;

                return (
                  <TrCard
                    key={evt.id}
                    className="p-4"
                    accentBorder={urgency.border}
                    style={{
                      borderLeftWidth: 3,
                      borderLeftColor: urgency.color,
                      borderLeftStyle: 'solid',
                    }}
                  >
                    <button
                      onClick={() => { navigate(`${prefix}/earn/savings/redeem/${evt.id}`); hapticSelection(); }}
                      className="w-full text-left"
                    >
                      {/* Row 1: Asset + urgency badge + days (POLISHED) */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: `${evt.color}15`,
                            border: `1.5px solid ${evt.color}30`,
                          }}
                        >
                          <span style={{
                            color: evt.color,
                            fontSize: FONT_SCALE.base,
                            fontWeight: FONT_WEIGHT.bold,
                            letterSpacing: LETTER_SPACING.tight,
                          }}>
                            {evt.asset.substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{
                            color: c.text,
                            fontSize: FONT_SCALE.sm,
                            fontWeight: FONT_WEIGHT.semibold,
                            marginBottom: 4,
                          }}>
                            {evt.product}
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className="flex items-center gap-1 px-2 py-1 rounded-md"
                              style={{
                                background: urgency.bg,
                                border: `1px solid ${urgency.border}`,
                              }}
                            >
                              {urgency.tier === 'critical' || urgency.tier === 'urgent'
                                ? <AlertTriangle size={ICON_SIZE.sm} color={urgency.color} strokeWidth={ICON_STROKE.emphasis} />
                                : <Clock size={ICON_SIZE.sm} color={urgency.color} strokeWidth={ICON_STROKE.emphasis} />}
                              <span style={{
                                color: urgency.color,
                                fontSize: FONT_SCALE.xs,
                                fontWeight: FONT_WEIGHT.semibold,
                              }}>
                                {urgency.label}
                              </span>
                            </div>
                            <span style={{
                              color: c.text3,
                              fontSize: FONT_SCALE.xs,
                              fontWeight: FONT_WEIGHT.medium,
                            }}>
                              APY {evt.apy}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div
                            className="px-3 py-2 rounded-xl"
                            style={{
                              background: urgency.bg,
                              border: `1.5px solid ${urgency.border}`,
                            }}
                          >
                            <div style={{
                              color: urgency.color,
                              fontSize: FONT_SCALE.lg,
                              fontWeight: FONT_WEIGHT.bold,
                              fontFamily: 'monospace',
                              letterSpacing: LETTER_SPACING.tight,
                              lineHeight: 1,
                            }}>
                              {evt.daysLeft}
                            </div>
                            <div style={{
                              color: urgency.color,
                              fontSize: FONT_SCALE.micro,
                              fontWeight: FONT_WEIGHT.medium,
                              opacity: 0.75,
                              marginTop: 2,
                            }}>
                              ngày
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Amount + value (POLISHED) */}
                      <div
                        className="flex items-center justify-between px-4 py-3 rounded-xl mb-4"
                        style={{ background: c.surface2 }}
                      >
                        <div>
                          <span style={{
                            color: c.text3,
                            fontSize: FONT_SCALE.xs,
                            fontWeight: FONT_WEIGHT.medium,
                          }}>
                            Số lượng
                          </span>
                          <div style={{
                            color: c.text,
                            fontSize: FONT_SCALE.base,
                            fontWeight: FONT_WEIGHT.bold,
                            fontFamily: 'monospace',
                            letterSpacing: LETTER_SPACING.tight,
                            marginTop: 2,
                          }}>
                            {hideBalance ? '••••' : `${fmtAmount(evt.amount)} ${evt.asset}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <span style={{
                            color: c.text3,
                            fontSize: FONT_SCALE.xs,
                            fontWeight: FONT_WEIGHT.medium,
                          }}>
                            Giá trị
                          </span>
                          <div style={{
                            color: c.text2,
                            fontSize: FONT_SCALE.sm,
                            fontWeight: FONT_WEIGHT.bold,
                            fontFamily: 'monospace',
                            marginTop: 2,
                          }}>
                            {hideBalance ? '••••' : renderBalance(evt.usdValue)}
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Progress bar + dates (POLISHED) */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span style={{
                            color: c.text2,
                            fontSize: FONT_SCALE.xs,
                            fontWeight: FONT_WEIGHT.semibold,
                          }}>
                            Hoàn thành {progress.toFixed(0)}%
                          </span>
                          <span style={{
                            color: c.text3,
                            fontSize: FONT_SCALE.xs,
                            fontWeight: FONT_WEIGHT.medium,
                          }}>
                            {evt.elapsed}/{evt.lockDays} ngày
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              background: `linear-gradient(90deg, ${urgency.color}CC, ${urgency.color})`,
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={ICON_SIZE.sm} color={c.text2} strokeWidth={ICON_STROKE.standard} />
                            <span style={{
                              color: c.text2,
                              fontSize: FONT_SCALE.xs,
                              fontWeight: FONT_WEIGHT.medium,
                            }}>
                              Đáo hạn: {evt.date}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Row 4: Actions */}
                      <div className="flex gap-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                        <div
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl cursor-pointer"
                          style={{
                            height: TOUCH_TARGET.minimum,
                            background: c.surface2,
                            border: `1px solid ${c.borderSolid}`,
                            color: c.text,
                            fontSize: FONT_SCALE.sm,
                            fontWeight: FONT_WEIGHT.semibold,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${prefix}/earn/savings/product/${evt.id}`);
                            hapticSelection();
                          }}
                        >
                          <RotateCcw size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
                          Gia hạn
                        </div>
                        <div
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl cursor-pointer"
                          style={{
                            height: TOUCH_TARGET.minimum,
                            background: urgency.bg,
                            border: `1.5px solid ${urgency.border}`,
                            color: urgency.color,
                            fontSize: FONT_SCALE.sm,
                            fontWeight: FONT_WEIGHT.semibold,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${prefix}/earn/savings/redeem/${evt.id}`);
                            hapticSelection();
                          }}
                        >
                          <ArrowUpFromLine size={ICON_SIZE.sm} strokeWidth={ICON_STROKE.emphasis} />
                          Rút khi đáo hạn
                        </div>
                      </div>
                    </button>
                  </TrCard>
                );
              })}
            </div>

            {/* Info banner */}
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.12)',
              }}
            >
              <Info size={ICON_SIZE.sm} color="#F59E0B" className="shrink-0 mt-0.5" />
              <span style={{ color: '#F59E0B', fontSize: FONT_SCALE.micro, lineHeight: 1.4, fontWeight: FONT_WEIGHT.regular }}>
                Khi đáo hạn, bạn có thể gia hạn để tiếp tục nhận lãi hoặc rút về ví.
                Rút trước hạn có thể mất lãi tích lũy.
              </span>
            </div>
          </PageSection>
        );
      })()}
    </>
  );

  /* ═══ POSITIONS TAB ═══ */
  const filteredPositions = posFilter === 'all'
    ? POSITIONS
    : POSITIONS.filter(p => p.type === posFilter);

  const renderPositions = () => (
    <>
      {/* ─── Summary hero (aligned with Overview hero styling) ─── */}
      <div
        className="relative overflow-hidden"
        style={{
          padding: '20px',
          borderRadius: φRadius.lg,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.05) 50%, rgba(139,92,246,0.03) 100%)',
          border: `1px solid rgba(99,102,241,0.15)`,
          boxShadow: '0 4px 16px rgba(99,102,241,0.08)',
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)' }}
        />

        {/* Header: icon + label */}
        <div className="flex items-center gap-2 mb-2 relative z-10">
          <Wallet size={ICON_SIZE.sm} color="#6366F1" strokeWidth={ICON_STROKE.emphasis} />
          <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>Danh mục vị thế</span>
        </div>

        {/* Total value */}
        <div className="flex items-center justify-between relative z-10 mb-3">
          <div
            style={{
              color: c.text,
              fontSize: FONT_SCALE.xl,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
              letterSpacing: LETTER_SPACING.tight,
              lineHeight: 1.1,
            }}
          >
            {hideBalance ? '••••••' : renderBalance(totalDeposited)}
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{
              background: withAlpha(c.success, ALPHA.muted),
              border: `1px solid ${withAlpha(c.success, ALPHA.soft)}`,
            }}
          >
            <TrendingUp size={ICON_SIZE.sm} color={c.success} strokeWidth={ICON_STROKE.emphasis} />
            <span style={{ color: c.success, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              APY {weightedAPY.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Stat pills — 3 columns (matching overview hero) */}
        <div className="flex gap-2.5 relative z-10 mb-3">
          <div
            className="flex-1 flex flex-col gap-0.5 px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(99,102,241,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Tổng vị thế</span>
            <span style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>{filteredPositions.length}</span>
          </div>
          <div
            className="flex-1 flex flex-col gap-0.5 px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Linh hoạt</span>
            <span style={{ color: c.success, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {POSITIONS.filter(p => p.type === 'flexible').length}
            </span>
          </div>
          <div
            className="flex-1 flex flex-col gap-0.5 px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(245,158,11,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Cố định</span>
            <span style={{ color: c.warning, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
              {POSITIONS.filter(p => p.type === 'locked').length}
            </span>
          </div>
        </div>

        {/* Filter chips — inline (matching overview action row) */}
        <div className="flex gap-2 relative z-10">
          {([
            { key: 'all' as const, label: 'Tất cả' },
            { key: 'flexible' as const, label: 'Linh hoạt' },
            { key: 'locked' as const, label: 'Cố định' },
          ]).map(f => {
            const isActive = posFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => { setPosFilter(f.key); hapticLight(); }}
                className="flex-1 flex items-center justify-center py-2 rounded-xl"
                style={{
                  background: isActive ? c.primary : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isActive ? c.primary : 'rgba(99,102,241,0.15)'}`,
                  color: isActive ? '#fff' : c.text2,
                  fontSize: FONT_SCALE.sm,
                  fontWeight: isActive ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Position cards (scannable, matching overview allocation style) ─── */}
      <PageSection label="Vị thế đang mở" accentColor="#6366F1">
        <div className="flex flex-col gap-3">
          {filteredPositions.map(pos => {
            const isLocked = pos.type === 'locked';
            const isMaturing = pos.status === 'maturing';
            let progress = 100;
            if (isLocked && pos.lockDays) {
              const start = new Date(pos.startDate.split('/').reverse().join('-'));
              const now = new Date('2026-03-09');
              const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              progress = Math.min(100, Math.max(0, (elapsed / pos.lockDays) * 100));
            }

            return (
              <TrCard key={pos.id} className="p-4">
                {/* Row 1: Asset icon + name + badges → value */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${pos.color}15`,
                      border: `1.5px solid ${pos.color}30`,
                    }}
                  >
                    <span style={{
                      color: pos.color,
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.bold,
                      letterSpacing: LETTER_SPACING.tight,
                    }}>
                      {pos.asset}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{
                      color: c.text,
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.semibold,
                      marginBottom: 3,
                    }}>
                      {pos.product}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                        style={{
                          background: withAlpha(isLocked ? c.warning : c.success, ALPHA.ghost),
                          border: `1px solid ${withAlpha(isLocked ? c.warning : c.success, ALPHA.muted)}`,
                        }}
                      >
                        {isLocked
                          ? <Lock size={10} color={c.warning} strokeWidth={ICON_STROKE.emphasis} />
                          : <Unlock size={10} color={c.success} strokeWidth={ICON_STROKE.emphasis} />}
                        <span style={{
                          color: isLocked ? c.warning : c.success,
                          fontSize: FONT_SCALE.micro,
                          fontWeight: FONT_WEIGHT.semibold,
                        }}>
                          {isLocked ? 'Cố định' : 'Linh hoạt'}
                        </span>
                      </div>
                      {pos.autoCompound && (
                        <div
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                          style={{
                            background: withAlpha(c.primary, ALPHA.ghost),
                            border: `1px solid ${withAlpha(c.primary, ALPHA.muted)}`,
                          }}
                        >
                          <Zap size={10} color={c.primary} strokeWidth={ICON_STROKE.emphasis} />
                          <span style={{ color: c.primary, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>Auto</span>
                        </div>
                      )}
                      {isMaturing && (
                        <div
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                          style={{
                            background: withAlpha(c.warning, ALPHA.muted),
                            border: `1px solid ${withAlpha(c.warning, ALPHA.soft)}`,
                          }}
                        >
                          <Clock size={10} color={c.warning} strokeWidth={ICON_STROKE.emphasis} />
                          <span style={{ color: c.warning, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.semibold }}>Sắp đáo hạn</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div style={{
                      color: c.text,
                      fontSize: FONT_SCALE.sm,
                      fontWeight: FONT_WEIGHT.bold,
                      fontFamily: 'monospace',
                      letterSpacing: LETTER_SPACING.tight,
                      marginBottom: 2,
                    }}>
                      {hideBalance ? '••••' : `${fmtAmount(pos.amount)} ${pos.asset}`}
                    </div>
                    <div style={{
                      color: c.text3,
                      fontSize: FONT_SCALE.xs,
                      fontWeight: FONT_WEIGHT.medium,
                      fontFamily: 'monospace',
                    }}>
                      {hideBalance ? '••••' : `≈ ${renderBalance(pos.usdValue)}`}
                    </div>
                  </div>
                </div>

                {/* Row 2: Inline stats — APY | Earned | Interest (matching overview rows) */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>APY</span>
                      <span style={{
                        color: c.success,
                        fontSize: FONT_SCALE.xs,
                        fontWeight: FONT_WEIGHT.bold,
                        fontFamily: 'monospace',
                      }}>
                        {pos.apy}%
                      </span>
                    </div>
                    <div style={{ width: 1, height: 12, background: c.divider }} />
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Đã nhận</span>
                      <span style={{
                        color: c.text,
                        fontSize: FONT_SCALE.xs,
                        fontWeight: FONT_WEIGHT.semibold,
                        fontFamily: 'monospace',
                      }}>
                        {hideBalance ? '••••' : `${fmtAmount(pos.earned)} ${pos.asset}`}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    color: c.success,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.bold,
                    fontFamily: 'monospace',
                  }}>
                    {hideBalance ? '••••' : `+${fmtUsd(pos.earnedUsd)}`}
                  </span>
                </div>

                {/* Row 3: Progress bar for locked (compact, matching overview bar style) */}
                {isLocked && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>
                        {pos.startDate} → {pos.endDate}
                      </span>
                      <span style={{
                        color: pos.color,
                        fontSize: FONT_SCALE.micro,
                        fontWeight: FONT_WEIGHT.bold,
                        fontFamily: 'monospace',
                      }}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                      <div
                        className="h-full transition-all"
                        style={{
                          background: `linear-gradient(90deg, ${pos.color}CC, ${pos.color})`,
                          width: `${progress}%`,
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Row 4: Action row (compact, matching overview button proportions) */}
                <div className="flex gap-2.5 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
                  <button
                    onClick={() => { navigate(`${prefix}/earn/savings/product/${pos.id}`); hapticSelection(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl"
                    style={{
                      height: 38,
                      background: c.surface2,
                      border: `1px solid ${c.divider}`,
                      color: c.text,
                      fontSize: FONT_SCALE.xs,
                      fontWeight: FONT_WEIGHT.semibold,
                    }}
                  >
                    Chi tiết
                    <ChevronRight size={14} color={c.text3} strokeWidth={ICON_STROKE.standard} />
                  </button>
                  <button
                    onClick={() => { navigate(`${prefix}/earn/savings/redeem/${pos.id}`); hapticSelection(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl"
                    style={{
                      height: 38,
                      background: withAlpha(isLocked ? c.error : c.primary, ALPHA.ghost),
                      border: `1px solid ${withAlpha(isLocked ? c.error : c.primary, ALPHA.muted)}`,
                      color: isLocked ? c.error : c.primary,
                      fontSize: FONT_SCALE.xs,
                      fontWeight: FONT_WEIGHT.semibold,
                    }}
                  >
                    <ArrowUpFromLine size={14} strokeWidth={ICON_STROKE.emphasis} />
                    {isLocked ? 'Rút sớm' : 'Rút'}
                  </button>
                </div>
              </TrCard>
            );
          })}
        </div>
      </PageSection>

      {/* Empty state for filtered */}
      {filteredPositions.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: c.surface2,
              border: `1px solid ${c.divider}`,
            }}
          >
            <PiggyBank size={ICON_SIZE.lg} color={c.text3} strokeWidth={ICON_STROKE.standard} />
          </div>
          <div className="text-center">
            <p style={{
              color: c.text,
              fontSize: FONT_SCALE.base,
              fontWeight: FONT_WEIGHT.semibold,
              marginBottom: 4,
            }}>
              Không có vị thế {posFilter === 'flexible' ? 'linh hoạt' : posFilter === 'locked' ? 'cố định' : ''} nào
            </p>
            <p style={{
              color: c.text3,
              fontSize: FONT_SCALE.sm,
            }}>
              Bắt đầu gửi tiết kiệm để nhận lãi suất hấp dẫn
            </p>
          </div>
          <button
            onClick={() => { navigate(`${prefix}/earn/savings`); hapticSelection(); }}
            className="px-5 py-2.5 rounded-xl"
            style={{
              background: withAlpha(c.primary, ALPHA.muted),
              border: `1.5px solid ${withAlpha(c.primary, ALPHA.soft)}`,
              color: c.primary,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
            }}
          >
            Gửi tiết kiệm ngay
          </button>
        </div>
      )}
    </>
  );

  /* ═══ EARNINGS TAB ═══ */
  const earningsRangeOpts = [
    { key: '7d', label: '7N' },
    { key: '30d', label: '30N' },
    { key: '90d', label: '90N' },
    { key: 'all', label: 'Tất cả' },
  ] as const;

  const renderEarnings = () => (
    <>
      {/* ─── Earnings hero (matched with Overview hero sizing exactly) ─── */}
      <div
        className="relative overflow-hidden"
        style={{
          padding: '22px 20px 20px',
          borderRadius: φRadius.lg,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.05) 50%, rgba(4,120,87,0.03) 100%)',
          border: `1px solid rgba(16,185,129,0.15)`,
          boxShadow: '0 4px 16px rgba(16,185,129,0.08)',
        }}
      >
        {/* Decorative glows (same 2-glow pattern as overview hero) */}
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 65%)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 65%)' }}
        />

        {/* Header row: icon + label + ROI pill (same layout as overview) */}
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <TrendingUp size={ICON_SIZE.base} color="#10B981" strokeWidth={ICON_STROKE.emphasis} />
            <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>Tổng lãi nhận được</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{
              background: withAlpha(c.success, ALPHA.muted),
              border: `1px solid ${withAlpha(c.success, ALPHA.soft)}`,
            }}
          >
            <span style={{ color: c.success, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' }}>
              +{((totalEarned / totalDeposited) * 100).toFixed(3)}%
            </span>
          </div>
        </div>

        {/* Sub-label (same as overview) */}
        <p className="relative z-10" style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
          Tổng lãi tích lũy (USD)
        </p>

        {/* Hero number — FONT_SCALE.xl (28px), exact same as overview balance */}
        <p
          className="relative z-10"
          style={{
            color: '#10B981',
            fontSize: FONT_SCALE.xl,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
            letterSpacing: LETTER_SPACING.tight,
            lineHeight: 1.1,
          }}
        >
          +{renderBalance(totalEarned)}
        </p>

        {/* APY pill row (same pattern as overview PnL pills) */}
        <div className="flex items-center gap-2.5 mt-2 mb-5 relative z-10">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{
              background: withAlpha(c.primary, ALPHA.muted),
              border: `1px solid ${withAlpha(c.primary, ALPHA.soft)}`,
            }}
          >
            <Zap size={ICON_SIZE.sm} color={c.primary} strokeWidth={ICON_STROKE.emphasis} />
            <span style={{ color: c.primary, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.semibold }}>
              APY {weightedAPY.toFixed(2)}%
            </span>
          </div>
          <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Lãi tiết kiệm</span>
        </div>

        {/* Glass stat pills — 3 columns (exact same sizing as overview: px-3 py-2.5, label micro, value sm bold mono) */}
        <div className="flex gap-3 relative z-10">
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Hôm nay</span>
            <span style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              +{fmtUsd(dailyEarnings)}
            </span>
          </div>
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Tháng này</span>
            <span style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              +{fmtUsd(monthlyEarnings)}
            </span>
          </div>
          <div
            className="flex-1 flex flex-col gap-1 px-3 py-2.5 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span style={{ color: c.text3, fontSize: FONT_SCALE.micro, fontWeight: FONT_WEIGHT.medium }}>Tích lũy</span>
            <span style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              {hideBalance ? '••••' : `+${renderBalance(totalEarned)}`}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Earnings trend chart ─── */}
      <PageSection label="Xu hướng lãi" accentColor="#10B981">
        <TrCard className="p-4">
          {/* Range selector (same chip sizing as overview) */}
          <div className="flex gap-2 mb-4">
            {earningsRangeOpts.map(opt => {
              const isActive = earningsRange === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => { setEarningsRange(opt.key); hapticLight(); }}
                  className="flex-1 py-2 rounded-xl text-center"
                  style={{
                    background: isActive ? withAlpha(c.success, ALPHA.muted) : c.surface2,
                    color: isActive ? c.success : c.text3,
                    fontSize: FONT_SCALE.xs,
                    fontWeight: isActive ? FONT_WEIGHT.semibold : FONT_WEIGHT.medium,
                    border: `1px solid ${isActive ? withAlpha(c.success, ALPHA.soft) : c.divider}`,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div style={{ width: '100%', height: 160, marginBottom: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={EARNINGS_TREND} margin={{ top: 8, right: 8, bottom: 4, left: -20 }}>
                <ChartGradientDefs
                  gradients={[CHART_GRADIENTS.green('savingsEarningsGrad')]}
                />
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke={c.divider} opacity={0.4} />
                <XAxis
                  key="x"
                  dataKey="date"
                  tick={{ fill: c.text3, fontSize: FONT_SCALE.micro }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  key="y"
                  tick={{ fill: c.text3, fontSize: FONT_SCALE.micro }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  key="tooltip"
                  contentStyle={{
                    background: isDark ? 'rgba(26,26,46,0.95)' : 'rgba(255,255,255,0.95)',
                    border: `1px solid ${c.divider}`,
                    borderRadius: 12,
                    fontSize: FONT_SCALE.xs,
                    backdropFilter: 'blur(8px)',
                    padding: '8px 12px',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Lãi tích lũy']}
                  labelStyle={{ color: c.text2, fontSize: FONT_SCALE.micro, marginBottom: 4 }}
                />
                <Area
                  key="area"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#savingsEarningsGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart footer (same divider + FONT_SCALE sizing as overview allocation legend) */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
            <span style={{ color: c.text3, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>Lãi tích lũy</span>
            <span style={{ color: c.success, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              ${EARNINGS_TREND[EARNINGS_TREND.length - 1].cumulative.toFixed(2)}
            </span>
          </div>
        </TrCard>
      </PageSection>

      {/* ─── Daily breakdown (same h-2 bar as overview allocation bars) ─── */}
      <PageSection label="Lãi hàng ngày (7 ngày gần nhất)" accentColor="#3B82F6">
        <TrCard className="p-4">
          <div className="flex flex-col gap-3">
            {DAILY_EARNINGS.map((day) => {
              const maxDaily = Math.max(...DAILY_EARNINGS.map(d => d.amount));
              const barWidth = (day.amount / maxDaily) * 100;
              return (
                <div key={day.date}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ color: c.text2, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.medium }}>
                      {day.date}/2026
                    </span>
                    <span style={{ color: c.success, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                      +${day.amount.toFixed(2)}
                    </span>
                  </div>
                  {/* Bar (same h-2 + gradient style as overview allocation) */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        background: 'linear-gradient(90deg, #10B981CC, #10B981)',
                        width: `${barWidth}%`,
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total footer */}
          <div
            className="flex items-center justify-between mt-4 pt-3"
            style={{ borderTop: `1px solid ${c.divider}` }}
          >
            <span style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>Tổng 7 ngày</span>
            <span style={{ color: c.success, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
              +${DAILY_EARNINGS.reduce((s, d) => s + d.amount, 0).toFixed(2)}
            </span>
          </div>
        </TrCard>
      </PageSection>

      {/* ─── Earnings by asset (same layout as overview allocation legend — color dot + name + value + pct + bar) ─── */}
      <PageSection label="Lãi theo tài sản" accentColor="#8B5CF6">
        <TrCard className="p-4">
          <div className="flex flex-col gap-3">
            {POSITIONS.map(pos => {
              const pct = totalEarned > 0 ? (pos.earnedUsd / totalEarned) * 100 : 0;
              return (
                <div key={pos.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-md shrink-0"
                        style={{
                          background: pos.color,
                          boxShadow: `0 2px 6px ${pos.color}35`,
                        }}
                      />
                      <span style={{ color: c.text, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.semibold }}>
                        {pos.product}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{
                        color: c.success,
                        fontSize: FONT_SCALE.sm,
                        fontWeight: FONT_WEIGHT.semibold,
                        fontFamily: 'monospace',
                      }}>
                        +{fmtAmount(pos.earned)} {pos.asset}
                      </span>
                      <span
                        className="min-w-[42px] text-right"
                        style={{
                          color: c.text3,
                          fontSize: FONT_SCALE.xs,
                          fontWeight: FONT_WEIGHT.semibold,
                        }}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Bar (exact same as overview allocation bars) */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div
                      className="h-full transition-all"
                      style={{
                        background: `linear-gradient(90deg, ${pos.color}CC, ${pos.color})`,
                        width: `${pct}%`,
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>
      </PageSection>

      {/* Disclaimer (same info banner style as overview) */}
      <div
        className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
        style={{
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.12)',
        }}
      >
        <Shield size={ICON_SIZE.sm} color="#3B82F6" className="shrink-0 mt-0.5" />
        <span style={{ color: '#3B82F6', fontSize: FONT_SCALE.micro, lineHeight: 1.4, fontWeight: FONT_WEIGHT.regular }}>
          Lãi suất APY là ước tính và có thể thay đổi tùy theo điều kiện thị trường.
          Số liệu hiển thị không bao gồm phí và thuế. Hiệu suất quá khứ không đảm bảo kết quả tương lai.
        </span>
      </div>
    </>
  );

  return (
    <PageLayout>
      <Header title="Savings Portfolio" back />
      <TabBar
        tabs={TABS.map(t => ({ id: t.key, label: t.label }))}
        active={tab}
        onChange={(k) => { setTab(k as TabKey); hapticLight(); }}
      />
      <PageContent gap="default">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <SkeletonCard h={200} />
            <SkeletonCard h={120} />
            <SkeletonCard h={100} />
          </div>
        ) : (
          <>
            {tab === 'overview' && renderOverview()}
            {tab === 'positions' && renderPositions()}
            {tab === 'earnings' && renderEarnings()}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}