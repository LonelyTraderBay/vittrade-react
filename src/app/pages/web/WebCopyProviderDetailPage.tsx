/**
 * ══════════════════════════════════════════════════════════
 *  WebCopyProviderDetailPage — Enterprise Fintech v3
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/trade/copy/provider/:providerId
 *
 *  Enterprise-grade provider detail with 2-column layout:
 *  ┌────────────────────────────────────┬──────────────────┐
 *  │  Risk Warning Banner               │                  │
 *  ├────────────────────────────────────┤  Sticky Sidebar  │
 *  │  Provider Identity Card            │  ┌────────────┐  │
 *  ├────────────────────────────────────┤  │ Quick Stats │  │
 *  │  Tabs: Overview │ Performance │    │  │ Risk Gauge  │  │
 *  │        Strategy │ Disclosure      │  │ Fee Calc    │  │
 *  ├────────────────────────────────────┤  │ CTA Button  │  │
 *  │  Tab Content (multi-section)       │  └────────────┘  │
 *  └────────────────────────────────────┴──────────────────┘
 *
 *  Canonical tokens: WEB_FONT flat, WEB_ICON flat, useThemeColors.
 *  No double padding (WebShell provides maxWidth + px).
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  Shield,
  CheckCircle,
  Star,
  BarChart3,
  Clock,
  Target,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Eye,
  Copy,
  Lock,
  FileText,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { COPY_TRADERS } from '../../data/mockData';
import { fmtCompact, fmtSignedUsd } from '../../data/formatNumber';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { WEB_FONT, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import {
  COPY_TRADING_FEES,
  CHART_CONFIG,
  TIER_THRESHOLDS,
  RISK_LEVELS,
  PERFORMANCE_BENCHMARKS,
  COMPLIANCE_MESSAGES,
} from '../../constants/copyTrading';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════ */

const R = 14; // border radius
const bdr = (c: any) => `1px solid ${c.border}`;

const RISK_CONFIG: Record<
  string,
  { color: string; label: string; icon: LucideIcon; desc: string }
> = {
  low: {
    color: '#10B981',
    label: 'Thấp',
    icon: Shield,
    desc: 'Chiến lược bảo thủ, biến động thấp',
  },
  medium: {
    color: '#F59E0B',
    label: 'Trung bình',
    icon: Activity,
    desc: 'Cân bằng giữa rủi ro và lợi nhuận',
  },
  high: { color: '#EF4444', label: 'Cao', icon: Zap, desc: 'Chiến lược tích cực, biến động mạnh' },
};

interface TierCfg {
  icon: LucideIcon;
  color: string;
  label: string;
  bg: string;
}
const getTier = (copiers: number): TierCfg => {
  if (copiers > TIER_THRESHOLDS.PRO)
    return { icon: Star, color: '#F59E0B', label: 'Pro Trader', bg: '#F59E0B10' };
  if (copiers > TIER_THRESHOLDS.VERIFIED)
    return { icon: CheckCircle, color: '#10B981', label: 'Verified', bg: '#10B98110' };
  return { icon: AlertCircle, color: '#6B7280', label: 'Basic', bg: '#6B728010' };
};

const fmtC = (v: number, pfx = '') => {
  if (v >= 1e9) return `${pfx}${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `${pfx}${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${pfx}${(v / 1e3).toFixed(1)}K`;
  return `${pfx}${v.toLocaleString('en-US')}`;
};

const generatePerformanceData = (seed: string = 'default') => {
  const data = [];
  let value = 10000;
  let peak = 10000;
  let maxDD = 0;

  const seededRandom = (index: number) => {
    const x = Math.sin(seed.length * 9999 + index * 123.456) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i <= 90; i++) {
    const change = (seededRandom(i) - 0.45) * 200;
    value += change;
    if (value > peak) peak = value;
    const dd = ((value - peak) / peak) * 100;
    if (dd < maxDD) maxDD = dd;
    data.push({ day: i, value, drawdown: dd });
  }
  return { data, maxDD };
};

const MONTHLY_RETURNS = [
  { month: 'T10/24', pct: 12.4 },
  { month: 'T11/24', pct: -3.2 },
  { month: 'T12/24', pct: 18.7 },
  { month: 'T01/25', pct: 8.1 },
  { month: 'T02/25', pct: -5.6 },
  { month: 'T03/25', pct: 15.3 },
];

const ASSET_DIST = [
  { name: 'BTC', value: 42, color: '#F7931A' },
  { name: 'ETH', value: 28, color: '#627EEA' },
  { name: 'SOL', value: 15, color: '#00FFA3' },
  { name: 'Khác', value: 15, color: '#8B5CF6' },
];

const SLIPPAGE_DATA = [
  { range: '0-0.05%', count: 145, percent: 72.5 },
  { range: '0.05-0.1%', count: 38, percent: 19 },
  { range: '0.1-0.2%', count: 12, percent: 6 },
  { range: '>0.2%', count: 5, percent: 2.5 },
];

const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: Eye },
  { key: 'performance', label: 'Hiệu suất', icon: TrendingUp },
  { key: 'strategy', label: 'Chiến lược', icon: Target },
  { key: 'disclosure', label: 'Công khai', icon: Shield },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/* ═══════════════════════════════════════════════════════════
   SMALL SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function SectionCard({
  title,
  subtitle,
  children,
  style: extraStyle,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const c = useThemeColors();
  return (
    <div
      style={{
        background: c.surface,
        border: bdr(c),
        borderRadius: R,
        overflow: 'hidden',
        ...extraStyle,
      }}
    >
      <div style={{ padding: '18px 24px', borderBottom: `1px solid ${c.divider}` }}>
        <h3
          style={{
            color: c.text1,
            fontSize: WEB_FONT.lg,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, margin: '4px 0 0', lineHeight: 1.4 }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  color,
  mono,
  icon: Icon,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
  icon?: LucideIcon;
}) {
  const c = useThemeColors();
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: '10px 0', borderBottom: `1px solid ${c.divider}` }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={WEB_ICON.sm} color={c.text3} />}
        <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{label}</span>
      </div>
      <span
        style={{
          color: color || c.text1,
          fontSize: WEB_FONT.md,
          fontWeight: 600,
          fontVariantNumeric: mono !== false ? 'tabular-nums' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function QualityBadge({
  label,
  value,
  benchmark,
  unit = '',
}: {
  label: string;
  value: number;
  benchmark: { EXCELLENT: number; GOOD: number; ACCEPTABLE: number };
  unit?: string;
}) {
  const c = useThemeColors();
  const isInverse = benchmark.EXCELLENT < benchmark.ACCEPTABLE; // e.g., max drawdown
  let quality: 'excellent' | 'good' | 'acceptable' | 'poor';
  if (isInverse) {
    quality =
      value >= benchmark.EXCELLENT
        ? 'excellent'
        : value >= benchmark.GOOD
          ? 'good'
          : value >= benchmark.ACCEPTABLE
            ? 'acceptable'
            : 'poor';
  } else {
    quality =
      value >= benchmark.EXCELLENT
        ? 'excellent'
        : value >= benchmark.GOOD
          ? 'good'
          : value >= benchmark.ACCEPTABLE
            ? 'acceptable'
            : 'poor';
  }
  const config = {
    excellent: { color: '#10B981', bg: '#10B98110', text: 'Xuất sắc' },
    good: { color: '#3B82F6', bg: '#3B82F610', text: 'Tốt' },
    acceptable: { color: '#F59E0B', bg: '#F59E0B10', text: 'Chấp nhận' },
    poor: { color: '#EF4444', bg: '#EF444410', text: 'Cần xem xét' },
  };
  const q = config[quality];
  return (
    <div style={{ background: c.surface, border: bdr(c), borderRadius: 10, padding: '14px 16px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600 }}>{label}</span>
        <span
          style={{
            color: q.color,
            fontSize: WEB_FONT.xs,
            fontWeight: 600,
            background: q.bg,
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          {q.text}
        </span>
      </div>
      <span
        style={{
          color: c.text1,
          fontSize: WEB_FONT.xl,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit}
      </span>
    </div>
  );
}

function Sparkline({ data, w = 120, h = 36 }: { data: number[]; w?: number; h?: number }) {
  if (data.length < 2) return null;
  const mn = Math.min(...data),
    mx = Math.max(...data),
    rng = mx - mn || 1,
    pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - mn) / rng) * (h - pad * 2);
    return `${x},${y}`;
  });
  const positive = data[data.length - 1] >= data[0];
  const clr = positive ? '#10B981' : '#EF4444';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`spark-${clr.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={clr} stopOpacity={0.15} />
          <stop offset="100%" stopColor={clr} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${h} ${pts.join(' ')} ${w - pad},${h}`}
        fill={`url(#spark-${clr.slice(1)})`}
      />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={clr}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebCopyProviderDetailPage() {
  const { providerId } = useParams();
  const c = useThemeColors();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [feeAmount, setFeeAmount] = useState(1000);
  const [feeProfit, setFeeProfit] = useState(10);
  const [isFollowing, setIsFollowing] = useState(false);

  const gradientId = `eq-grad-${providerId}`;
  const ddGradientId = `dd-grad-${providerId}`;

  const { data: perfData, maxDD } = useMemo(
    () => generatePerformanceData(providerId ?? 'default'),
    [providerId],
  );

  const provider = COPY_TRADERS.find((t) => t.id === providerId);

  if (!provider) {
    return (
      <PageLayout>
        <Header title="Provider Not Found" back />
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <AlertTriangle
            size={40}
            color={c.text3}
            style={{ margin: '0 auto 16px', opacity: 0.4 }}
          />
          <p style={{ color: c.text2, fontSize: WEB_FONT.lg, fontWeight: 600, marginBottom: 8 }}>
            Provider không tồn tại
          </p>
          <p style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
            Trader có thể đã bị xóa hoặc không còn hoạt động
          </p>
          <button
            onClick={() => navigate('/w/trade/copy')}
            style={{
              marginTop: 24,
              height: WEB_BUTTON.md,
              padding: '0 24px',
              borderRadius: 10,
              background: c.primary,
              color: '#fff',
              fontSize: WEB_FONT.sm,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Quay lại danh sách
          </button>
        </div>
      </PageLayout>
    );
  }

  const risk = RISK_CONFIG[provider.riskLevel];
  const tierCfg = getTier(provider.copiers);
  const TierIcon = tierCfg.icon;
  const RiskIcon = risk.icon;
  const roiPositive = provider.totalPnlPct >= 0;
  const capacityPct = Math.min((provider.copiers / provider.maxCopiers) * 100, 100);

  // Fee calculations
  const platformFee = feeAmount * (COPY_TRADING_FEES.PLATFORM_PCT / 100);
  const performanceFee = feeAmount * (feeProfit / 100) * (COPY_TRADING_FEES.PERFORMANCE_PCT / 100);
  const tradingFee = feeAmount * (COPY_TRADING_FEES.TRADING_PCT / 100);
  const totalFees = platformFee + performanceFee + tradingFee;
  const netProfit = feeAmount * (feeProfit / 100) - totalFees;

  // Radar data for risk profile
  const radarData = [
    { metric: 'Win Rate', value: provider.winRate, max: 100 },
    { metric: 'Sharpe', value: Math.min((provider.sharpeRatio / 4) * 100, 100), max: 100 },
    { metric: 'Ổn định', value: Math.max(100 + provider.maxDrawdown * 2, 0), max: 100 },
    { metric: 'Volume', value: Math.min(provider.totalTrades / 100, 100), max: 100 },
    { metric: 'AUM', value: Math.min(provider.aum / 100000, 100), max: 100 },
    { metric: 'Copiers', value: Math.min(provider.copiers / 50, 100), max: 100 },
  ];

  const tooltipStyle = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 10,
    fontSize: WEB_FONT.xs,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  return (
    <PageLayout>
      <Header title={provider.name} back />

      <div
        style={{
          display: 'flex',
          gap: 24,
          paddingTop: 20,
          paddingBottom: 48,
          alignItems: 'flex-start',
        }}
      >
        {/* ═══════════════════════════════════════════════════════
            MAIN CONTENT (LEFT)
            ═══════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* ── Risk Warning Banner ── */}
          <div
            className="flex items-center gap-3"
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              background: '#FEF3C710',
              border: '1px solid #F59E0B20',
              borderLeft: '3px solid #F59E0B',
            }}
          >
            <AlertTriangle size={WEB_ICON.sm} color="#F59E0B" className="shrink-0" />
            <span style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5, flex: 1 }}>
              {COMPLIANCE_MESSAGES.RISK_WARNING}
            </span>
          </div>

          {/* ── Provider Identity Card ── */}
          <div
            style={{ background: c.surface, border: bdr(c), borderRadius: R, overflow: 'hidden' }}
          >
            {/* Accent bar */}
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${tierCfg.color}, ${risk.color})`,
              }}
            />
            <div style={{ padding: '24px 28px' }}>
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: `${tierCfg.color}15`,
                      border: `2px solid ${tierCfg.color}40`,
                    }}
                  >
                    <span
                      style={{ color: tierCfg.color, fontSize: WEB_FONT['3xl'], fontWeight: 800 }}
                    >
                      {provider.avatar}
                    </span>
                  </div>
                  <div
                    className="absolute flex items-center justify-center"
                    style={{
                      bottom: -4,
                      right: -4,
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      background: c.surface,
                      border: `2px solid ${tierCfg.color}`,
                    }}
                  >
                    <TierIcon size={13} color={tierCfg.color} />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                    <h2
                      className="truncate"
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT['2xl'],
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {provider.name}
                    </h2>
                    <button
                      onClick={() => {
                        setIsFollowing(!isFollowing);
                        toast.success(isFollowing ? 'Đã bỏ theo dõi' : 'Đã theo dõi');
                      }}
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: isFollowing ? '#F59E0B12' : c.bg,
                        border: isFollowing ? '1px solid #F59E0B30' : bdr(c),
                        cursor: 'pointer',
                      }}
                    >
                      <Star
                        size={WEB_ICON.sm}
                        color={isFollowing ? '#F59E0B' : c.text3}
                        fill={isFollowing ? '#F59E0B' : 'none'}
                      />
                    </button>
                  </div>

                  {/* Tags row */}
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 10 }}>
                    <span
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                      style={{
                        background: tierCfg.bg,
                        color: tierCfg.color,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 600,
                      }}
                    >
                      <TierIcon size={11} /> {tierCfg.label}
                    </span>
                    <span
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                      style={{
                        background: `${risk.color}10`,
                        border: `1px solid ${risk.color}18`,
                        color: risk.color,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 600,
                      }}
                    >
                      <RiskIcon size={11} /> Rủi ro: {risk.label}
                    </span>
                    {provider.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg"
                        style={{
                          background: c.bg,
                          color: c.text3,
                          fontSize: WEB_FONT.xs,
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta info */}
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs, margin: 0, lineHeight: 1.5 }}>
                    KYC Level 2 ✓ · Real Account · {provider.totalTrades.toLocaleString()} trades ·
                    Avg hold: {provider.avgHoldingTime} · Joined Nov 2024
                  </p>
                </div>

                {/* Hero ROI */}
                <div className="shrink-0 text-right">
                  <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 4 }}>
                    Tổng ROI (90d)
                  </div>
                  <div className="flex items-baseline justify-end gap-2">
                    <span
                      style={{
                        color: roiPositive ? '#10B981' : '#EF4444',
                        fontSize: WEB_FONT['3xl'],
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                      }}
                    >
                      {roiPositive ? '+' : ''}
                      {provider.totalPnlPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1 justify-end" style={{ marginTop: 4 }}>
                    {roiPositive ? (
                      <ArrowUpRight size={11} color="#10B981" />
                    ) : (
                      <ArrowDownRight size={11} color="#EF4444" />
                    )}
                    <span
                      style={{
                        color: '#10B981',
                        fontSize: WEB_FONT.xs,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {fmtSignedUsd(provider.totalPnl)}
                    </span>
                  </div>
                  <Sparkline data={provider.weeklyPnl} w={100} h={28} />
                </div>
              </div>

              {/* Key Stats Row */}
              <div className="grid grid-cols-5 gap-4" style={{ marginTop: 20 }}>
                {[
                  {
                    label: 'Win Rate',
                    value: `${provider.winRate}%`,
                    color: provider.winRate >= 70 ? '#10B981' : '#F59E0B',
                    icon: Target,
                  },
                  {
                    label: 'Max Drawdown',
                    value: `${provider.maxDrawdown.toFixed(1)}%`,
                    color: '#EF4444',
                    icon: TrendingDown,
                  },
                  {
                    label: 'Sharpe Ratio',
                    value: provider.sharpeRatio.toFixed(2),
                    color: provider.sharpeRatio >= 2 ? '#10B981' : '#F59E0B',
                    icon: BarChart3,
                  },
                  {
                    label: 'Copiers',
                    value: `${fmtC(provider.copiers)} / ${fmtC(provider.maxCopiers)}`,
                    color: '#3B82F6',
                    icon: Users,
                  },
                  {
                    label: 'AUM',
                    value: fmtC(provider.aum, '$'),
                    color: '#8B5CF6',
                    icon: DollarSign,
                  },
                ].map((m) => {
                  const I = m.icon;
                  return (
                    <div
                      key={m.label}
                      style={{
                        background: c.bg,
                        borderRadius: 10,
                        padding: '12px 14px',
                        border: `1px solid ${c.divider}`,
                      }}
                    >
                      <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                        <I size={12} color={c.text3} />
                        <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{m.label}</span>
                      </div>
                      <span
                        style={{
                          color: m.color,
                          fontSize: WEB_FONT.md,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {m.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Tab Bar ── */}
          <div
            className="flex items-center gap-1"
            style={{
              background: c.surface,
              border: bdr(c),
              borderRadius: 10,
              padding: 4,
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              const I = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 transition-all"
                  style={{
                    flex: 1,
                    height: WEB_BUTTON.sm,
                    borderRadius: 8,
                    background: active ? c.bg : 'transparent',
                    border: active ? bdr(c) : '1px solid transparent',
                    color: active ? c.text1 : c.text3,
                    fontSize: WEB_FONT.sm,
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    justifyContent: 'center',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : undefined,
                  }}
                >
                  <I size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════
              TAB CONTENT
              ═══════════════════════════════════════════════════════ */}

          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Performance Metrics Grid */}
              <SectionCard
                title="Chỉ số hiệu suất chính"
                subtitle="Dữ liệu thực, cập nhật realtime"
              >
                <div className="grid grid-cols-2 gap-4">
                  <QualityBadge
                    label="Win Rate"
                    value={provider.winRate}
                    benchmark={PERFORMANCE_BENCHMARKS.WIN_RATE}
                    unit="%"
                  />
                  <QualityBadge
                    label="Sharpe Ratio"
                    value={provider.sharpeRatio}
                    benchmark={PERFORMANCE_BENCHMARKS.SHARPE_RATIO}
                  />
                  <QualityBadge
                    label="Max Drawdown"
                    value={provider.maxDrawdown}
                    benchmark={PERFORMANCE_BENCHMARKS.MAX_DRAWDOWN}
                    unit="%"
                  />
                  <QualityBadge
                    label="Profit Factor"
                    value={1.68}
                    benchmark={PERFORMANCE_BENCHMARKS.PROFIT_FACTOR}
                  />
                </div>
              </SectionCard>

              {/* Monthly Returns */}
              <SectionCard
                title="Lợi nhuận theo tháng"
                subtitle="Return on Investment mỗi tháng gần nhất"
              >
                <div className="grid grid-cols-6 gap-3">
                  {MONTHLY_RETURNS.map((m) => (
                    <div
                      key={m.month}
                      style={{
                        background: m.pct >= 0 ? '#10B98108' : '#EF444408',
                        border: `1px solid ${m.pct >= 0 ? '#10B98118' : '#EF444418'}`,
                        borderRadius: 10,
                        padding: '12px 8px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 6 }}>
                        {m.month}
                      </div>
                      <div
                        style={{
                          color: m.pct >= 0 ? '#10B981' : '#EF4444',
                          fontSize: WEB_FONT.md,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {m.pct >= 0 ? '+' : ''}
                        {m.pct.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Execution Quality */}
              <SectionCard
                title="Chất lượng thực thi"
                subtitle="Dữ liệu từ 200 lệnh gần nhất (30 ngày)"
              >
                <div className="grid grid-cols-3 gap-4" style={{ marginBottom: 20 }}>
                  {[
                    { label: 'Avg Slippage', value: '0.08%', color: '#10B981' },
                    { label: 'Avg Fill Time', value: '1.2s', color: '#3B82F6' },
                    { label: 'Execution Rate', value: '98.5%', color: '#10B981' },
                  ].map((m) => (
                    <div
                      key={m.label}
                      style={{
                        background: c.bg,
                        borderRadius: 10,
                        padding: '14px 16px',
                        textAlign: 'center',
                        border: `1px solid ${c.divider}`,
                      }}
                    >
                      <div
                        style={{
                          color: m.color,
                          fontSize: WEB_FONT.xl,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          marginBottom: 4,
                        }}
                      >
                        {m.value}
                      </div>
                      <div style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={SLIPPAGE_DATA}
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid key="bar-grid" strokeDasharray="3 3" stroke={c.divider} />
                      <XAxis
                        key="bar-x"
                        dataKey="range"
                        tick={{ fill: c.text3, fontSize: WEB_FONT.xs }}
                        stroke={c.divider}
                      />
                      <YAxis
                        key="bar-y"
                        tick={{ fill: c.text3, fontSize: WEB_FONT.xs }}
                        stroke={c.divider}
                      />
                      <Tooltip key="bar-tip" contentStyle={tooltipStyle} />
                      <Bar
                        key="bar-data"
                        dataKey="count"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p
                  style={{
                    color: c.text3,
                    fontSize: WEB_FONT.xs,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  72.5% lệnh có slippage &lt;0.05% — Chất lượng xuất sắc
                </p>
              </SectionCard>
            </div>
          )}

          {activeTab === 'performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Equity Curve */}
              <SectionCard
                title="Đường equity (90 ngày)"
                subtitle={COMPLIANCE_MESSAGES.PAST_PERFORMANCE}
              >
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={perfData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop key="s0" offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop key="s1" offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid key="eq-grid" strokeDasharray="3 3" stroke={c.divider} />
                      <XAxis
                        key="eq-x"
                        dataKey="day"
                        tick={{ fill: c.text3, fontSize: WEB_FONT.xs }}
                        stroke={c.divider}
                        ticks={[...CHART_CONFIG.TICKS]}
                        tickFormatter={(v) => `D${v}`}
                        allowDuplicatedCategory={false}
                      />
                      <YAxis
                        key="eq-y"
                        tick={{ fill: c.text3, fontSize: WEB_FONT.xs }}
                        stroke={c.divider}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        key="eq-tip"
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Equity']}
                      />
                      <Area
                        key="eq-area"
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Drawdown Curve */}
              <SectionCard title="Biểu đồ drawdown" subtitle="Max Drawdown (underwater chart)">
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={perfData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id={ddGradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop key="dd0" offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                          <stop key="dd1" offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid key="dd-grid" strokeDasharray="3 3" stroke={c.divider} />
                      <XAxis
                        key="dd-x"
                        dataKey="day"
                        tick={{ fill: c.text3, fontSize: WEB_FONT.xs }}
                        stroke={c.divider}
                        ticks={[...CHART_CONFIG.TICKS]}
                        tickFormatter={(v) => `D${v}`}
                        allowDuplicatedCategory={false}
                      />
                      <YAxis
                        key="dd-y"
                        tick={{ fill: c.text3, fontSize: WEB_FONT.xs }}
                        stroke={c.divider}
                        tickFormatter={(v) => `${v.toFixed(0)}%`}
                      />
                      <Tooltip
                        key="dd-tip"
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                      />
                      <Area
                        key="dd-area"
                        type="monotone"
                        dataKey="drawdown"
                        stroke="#EF4444"
                        strokeWidth={1.5}
                        fill={`url(#${ddGradientId})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-2 justify-center" style={{ marginTop: 12 }}>
                  <AlertTriangle size={12} color="#EF4444" />
                  <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                    Max Drawdown: {provider.maxDrawdown.toFixed(1)}%
                  </span>
                </div>
              </SectionCard>

              {/* Detailed Metrics Table */}
              <SectionCard title="Chỉ số chi tiết">
                <MetricRow
                  label="Total P/L"
                  value={fmtSignedUsd(provider.totalPnl)}
                  color="#10B981"
                  icon={DollarSign}
                />
                <MetricRow
                  label="Win Rate"
                  value={`${provider.winRate}%`}
                  color={provider.winRate >= 70 ? '#10B981' : '#F59E0B'}
                  icon={Target}
                />
                <MetricRow
                  label="Total Trades"
                  value={provider.totalTrades.toLocaleString()}
                  icon={Activity}
                />
                <MetricRow label="Avg Holding Time" value={provider.avgHoldingTime} icon={Clock} />
                <MetricRow
                  label="Sharpe Ratio"
                  value={provider.sharpeRatio.toFixed(2)}
                  color={provider.sharpeRatio >= 2 ? '#10B981' : '#F59E0B'}
                  icon={BarChart3}
                />
                <MetricRow label="Sortino Ratio" value="2.41" color="#10B981" icon={BarChart3} />
                <MetricRow label="Calmar Ratio" value="3.12" color="#10B981" icon={BarChart3} />
                <MetricRow label="Profit Factor" value="1.68" icon={TrendingUp} />
                <div style={{ borderBottom: 'none' }}>
                  <MetricRow
                    label="Max Drawdown"
                    value={`${provider.maxDrawdown.toFixed(1)}%`}
                    color="#EF4444"
                    icon={TrendingDown}
                  />
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Strategy Overview */}
              <SectionCard title="Tổng quan chiến lược">
                <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                  <MetricRow
                    label="Loại chiến lược"
                    value={provider.tags[0] || 'Swing Trading'}
                    mono={false}
                    icon={Target}
                  />
                  <MetricRow
                    label="Thời gian nắm giữ TB"
                    value={provider.avgHoldingTime}
                    icon={Clock}
                  />
                  <MetricRow
                    label="Số lệnh TB/ngày"
                    value={(provider.totalTrades / 90).toFixed(1)}
                    icon={Activity}
                  />
                  <MetricRow
                    label="Mức rủi ro"
                    value={risk.label}
                    color={risk.color}
                    mono={false}
                    icon={RiskIcon}
                  />
                  <MetricRow label="Leverage TB" value="3x - 5x" icon={Layers} />
                  <MetricRow label="Stop Loss TB" value="-5% ~ -8%" color="#EF4444" icon={Shield} />
                </div>
              </SectionCard>

              {/* Risk Profile Radar */}
              <SectionCard title="Hồ sơ rủi ro" subtitle="Radar phân tích đa chiều">
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={c.divider} />
                      <PolarAngleAxis
                        dataKey="metric"
                        tick={{ fill: c.text3, fontSize: WEB_FONT.xs }}
                      />
                      <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                      <Radar
                        dataKey="value"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              {/* Asset Distribution */}
              <SectionCard
                title="Phân bổ tài sản"
                subtitle="Cặp giao dịch chính trong 30 ngày gần nhất"
              >
                <div className="flex items-center gap-8">
                  <div style={{ width: 180, height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ASSET_DIST}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          isAnimationActive={false}
                          stroke="none"
                        >
                          {ASSET_DIST.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1">
                    {ASSET_DIST.map((a) => (
                      <div
                        key={a.name}
                        className="flex items-center gap-3"
                        style={{ padding: '8px 0', borderBottom: `1px solid ${c.divider}` }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: a.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            color: c.text1,
                            fontSize: WEB_FONT.sm,
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          {a.name}
                        </span>
                        <div
                          style={{
                            flex: 2,
                            height: 6,
                            borderRadius: 3,
                            background: c.bg,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${a.value}%`,
                              background: a.color,
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            color: c.text1,
                            fontSize: WEB_FONT.sm,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            width: 40,
                            textAlign: 'right',
                          }}
                        >
                          {a.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>
          )}

          {activeTab === 'disclosure' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Verification Status */}
              <SectionCard title="Trạng thái xác minh">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    {
                      label: 'Xác minh danh tính (KYC)',
                      status: 'Level 2',
                      ok: true,
                      icon: CheckCircle,
                    },
                    {
                      label: 'Tài khoản thực (Real Account)',
                      status: 'Đã xác minh',
                      ok: true,
                      icon: Shield,
                    },
                    { label: 'Audit hiệu suất', status: 'Đã kiểm tra', ok: true, icon: FileText },
                    { label: 'Lợi ích xung đột', status: 'Không có', ok: true, icon: Eye },
                  ].map((item) => {
                    const I = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3"
                        style={{
                          padding: '12px 16px',
                          borderRadius: 10,
                          background: item.ok ? '#10B98108' : '#EF444408',
                          border: `1px solid ${item.ok ? '#10B98115' : '#EF444415'}`,
                        }}
                      >
                        <I size={WEB_ICON.sm} color={item.ok ? '#10B981' : '#EF4444'} />
                        <span
                          style={{
                            color: c.text1,
                            fontSize: WEB_FONT.sm,
                            fontWeight: 500,
                            flex: 1,
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            color: item.ok ? '#10B981' : '#EF4444',
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                            background: item.ok ? '#10B98112' : '#EF444412',
                            padding: '3px 10px',
                            borderRadius: 6,
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Regulatory Disclosures */}
              <SectionCard title="Tuyên bố pháp lý">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    {
                      title: 'Tuyên bố rủi ro',
                      content: COMPLIANCE_MESSAGES.RISK_WARNING,
                    },
                    {
                      title: 'Hiệu suất quá khứ',
                      content: COMPLIANCE_MESSAGES.PAST_PERFORMANCE,
                    },
                    {
                      title: 'Tuyên bố về ủy thác',
                      content: COMPLIANCE_MESSAGES.FIDUCIARY_DISCLAIMER,
                    },
                    {
                      title: 'Phí hiệu suất',
                      content: COMPLIANCE_MESSAGES.HIGH_WATER_MARK,
                    },
                  ].map((d) => (
                    <div
                      key={d.title}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 10,
                        background: c.bg,
                        border: `1px solid ${c.divider}`,
                      }}
                    >
                      <p
                        style={{
                          color: c.text1,
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                          margin: '0 0 6px',
                        }}
                      >
                        {d.title}
                      </p>
                      <p
                        style={{
                          color: c.text3,
                          fontSize: WEB_FONT.xs,
                          margin: 0,
                          lineHeight: 1.6,
                        }}
                      >
                        {d.content}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Data Sources */}
              <SectionCard title="Nguồn dữ liệu">
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs, margin: 0, lineHeight: 1.7 }}>
                  Tất cả dữ liệu hiệu suất được lấy từ lệnh thực tế trên sàn giao dịch. Không bao
                  gồm dữ liệu từ tài khoản demo hoặc backtest. Dữ liệu cập nhật mỗi 5 phút. Slippage
                  và execution quality dựa trên 200 lệnh gần nhất. Phí đã được tính vào số liệu P/L
                  net.
                </p>
              </SectionCard>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            SIDEBAR (RIGHT — sticky)
            ═══════════════════════════════════════════════════════ */}
        <div
          style={{
            width: 340,
            flexShrink: 0,
            position: 'sticky',
            top: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {/* Quick Stats */}
          <div
            style={{
              background: c.surface,
              border: bdr(c),
              borderRadius: R,
              padding: '20px 20px 16px',
              overflow: 'hidden',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <BarChart3 size={WEB_ICON.sm} color={c.primary} />
              <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                Tổng quan nhanh
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                {
                  label: 'Tổng ROI',
                  value: `${roiPositive ? '+' : ''}${provider.totalPnlPct.toFixed(1)}%`,
                  color: roiPositive ? '#10B981' : '#EF4444',
                },
                { label: 'Tổng P/L', value: fmtSignedUsd(provider.totalPnl), color: '#10B981' },
                {
                  label: 'Win Rate',
                  value: `${provider.winRate}%`,
                  color: provider.winRate >= 70 ? '#10B981' : '#F59E0B',
                },
                {
                  label: 'Max Drawdown',
                  value: `${provider.maxDrawdown.toFixed(1)}%`,
                  color: '#EF4444',
                },
                {
                  label: 'Sharpe Ratio',
                  value: provider.sharpeRatio.toFixed(2),
                  color: provider.sharpeRatio >= 2 ? '#10B981' : '#F59E0B',
                },
              ].map((s, idx, arr) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between"
                  style={{
                    padding: '10px 0',
                    borderBottom: idx < arr.length - 1 ? `1px solid ${c.divider}` : 'none',
                  }}
                >
                  <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{s.label}</span>
                  <span
                    style={{
                      color: s.color,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Copier Capacity */}
          <div style={{ background: c.surface, border: bdr(c), borderRadius: R, padding: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Copier slots</span>
              <span
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {provider.copiers.toLocaleString()} / {provider.maxCopiers.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: c.bg,
                overflow: 'hidden',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  width: `${capacityPct}%`,
                  background:
                    capacityPct > 90 ? '#EF4444' : capacityPct > 70 ? '#F59E0B' : '#3B82F6',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            {capacityPct > 80 && (
              <div className="flex items-center gap-1">
                <AlertTriangle size={11} color="#F59E0B" />
                <span style={{ color: '#F59E0B', fontSize: WEB_FONT.xs }}>
                  Slot gần đầy — hành động sớm
                </span>
              </div>
            )}
          </div>

          {/* Fee Calculator */}
          <div style={{ background: c.surface, border: bdr(c), borderRadius: R, padding: 20 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <DollarSign size={WEB_ICON.sm} color={c.primary} />
              <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                Tính phí dự kiến
              </span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{ color: c.text3, fontSize: WEB_FONT.xs, display: 'block', marginBottom: 6 }}
              >
                Số tiền copy (USD)
              </label>
              <input
                type="number"
                value={feeAmount}
                onChange={(e) => setFeeAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: WEB_BUTTON.sm,
                  padding: '0 12px',
                  borderRadius: 8,
                  background: c.bg,
                  border: bdr(c),
                  color: c.text1,
                  fontSize: WEB_FONT.sm,
                  fontVariantNumeric: 'tabular-nums',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{ color: c.text3, fontSize: WEB_FONT.xs, display: 'block', marginBottom: 6 }}
              >
                Lợi nhuận dự kiến (%)
              </label>
              <input
                type="number"
                value={feeProfit}
                onChange={(e) => setFeeProfit(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: WEB_BUTTON.sm,
                  padding: '0 12px',
                  borderRadius: 8,
                  background: c.bg,
                  border: bdr(c),
                  color: c.text1,
                  fontSize: WEB_FONT.sm,
                  fontVariantNumeric: 'tabular-nums',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                background: c.bg,
                borderRadius: 10,
                padding: 14,
                border: `1px solid ${c.divider}`,
              }}
            >
              {[
                {
                  label: `Platform fee (${COPY_TRADING_FEES.PLATFORM_PCT}%)`,
                  value: `$${platformFee.toFixed(2)}`,
                },
                {
                  label: `Performance fee (${COPY_TRADING_FEES.PERFORMANCE_PCT}%)`,
                  value: `$${performanceFee.toFixed(2)}`,
                },
                {
                  label: `Trading fee (${COPY_TRADING_FEES.TRADING_PCT}%)`,
                  value: `$${tradingFee.toFixed(2)}`,
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between"
                  style={{ padding: '5px 0' }}
                >
                  <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{f.label}</span>
                  <span
                    style={{
                      color: c.text2,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {f.value}
                  </span>
                </div>
              ))}
              <div style={{ height: 1, background: c.divider, margin: '8px 0' }} />
              <div className="flex items-center justify-between" style={{ padding: '4px 0' }}>
                <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                  Tổng phí
                </span>
                <span
                  style={{
                    color: '#EF4444',
                    fontSize: WEB_FONT.sm,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ${totalFees.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '4px 0' }}>
                <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                  Lợi nhuận ròng
                </span>
                <span
                  style={{
                    color: netProfit >= 0 ? '#10B981' : '#EF4444',
                    fontSize: WEB_FONT.sm,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ${netProfit.toFixed(2)}
                </span>
              </div>
            </div>
            <p style={{ color: c.text3, fontSize: 10, margin: '8px 0 0', lineHeight: 1.5 }}>
              * {COMPLIANCE_MESSAGES.HIGH_WATER_MARK}
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate(`/w/trade/copy/provider/${providerId}/assessment`)}
            className="flex items-center justify-center gap-2 transition-all w-full"
            style={{
              height: WEB_BUTTON.lg,
              borderRadius: 12,
              background: c.primary,
              color: '#fff',
              fontSize: WEB_FONT.md,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
            }}
          >
            <Copy size={WEB_ICON.sm} />
            Bắt đầu sao chép
            <ChevronRight size={WEB_ICON.sm} />
          </button>

          {/* Safety note */}
          <div className="flex items-start gap-2" style={{ padding: '0 4px' }}>
            <Lock size={11} color={c.text3} className="shrink-0 mt-0.5" />
            <span style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
              Vốn của bạn được bảo vệ bởi hệ thống stop-loss tự động. Bạn có thể dừng copy bất cứ
              lúc nào.
            </span>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
