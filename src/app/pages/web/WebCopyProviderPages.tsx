/**
 * WebCopyProviderPages — Enterprise Desktop versions of:
 *   - CopyProviderDetailPage
 *   - PreCopyAssessmentPage
 *   - CopyConfigurationPage
 *   - CopyConfirmationPage
 *   - ProviderApplicationPage
 *   - ProviderComparisonPage
 *   - ProviderLeaderboardPage
 *   - ProviderGovernancePage
 */
import React, { useState, useMemo } from 'react';
import {
  Star,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  BarChart3,
  Clock,
  ChevronRight,
  Eye,
  Award,
  Filter,
  Search,
  ChevronDown,
  XCircle,
  FileText,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Settings,
  X,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { COPY_TRADERS } from '../../data/mockData';
import { fmtSignedUsd, fmtCompact } from '../../data/formatNumber';
import {
  RISK_LEVELS,
  TIER_THRESHOLDS,
  COMPLIANCE_MESSAGES,
  SORT_OPTIONS,
} from '../../constants/copyTrading';
import { WEB_FONT, WEB_ICON, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
} from 'recharts';
import { toast } from 'sonner';

/* ─── shared helpers ─── */
const tooltipS = (c: any) => ({
  background: c.surface,
  border: `1px solid ${c.border}`,
  borderRadius: 10,
  fontSize: 11,
});
const RISK_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: '#10B981', label: 'Thấp' },
  medium: { color: '#F59E0B', label: 'Trung bình' },
  high: { color: '#EF4444', label: 'Cao' },
};
const getTier = (copiers: number) => {
  if (copiers > TIER_THRESHOLDS.PRO) return { icon: Star, color: '#F59E0B', label: 'Pro Trader' };
  if (copiers > TIER_THRESHOLDS.VERIFIED)
    return { icon: CheckCircle, color: '#10B981', label: 'Verified' };
  return { icon: AlertCircle, color: '#6B7280', label: 'Basic' };
};

function StatCard({
  label,
  value,
  color,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
  icon?: React.ElementType;
}) {
  const c = useThemeColors();
  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        padding: '16px 18px',
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        {Icon && <Icon size={14} color={color || c.text3} />}
        <span
          style={{
            color: c.text3,
            fontSize: WEB_FONT.xs,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          color: color || c.text1,
          fontSize: WEB_FONT.xl,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ color: c.text3, fontSize: WEB_FONT.xs, margin: 0, marginTop: 3 }}>{sub}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Mock perf data
   ═══════════════════════════════════════════════════ */
const PERF_DATA = Array.from({ length: 90 }, (_, i) => ({
  day: i,
  value: 100 + Math.sin(i / 10) * 20 + i * 0.5 + (Math.random() - 0.3) * 8,
}));
const ALLOCATION_DATA = [
  { name: 'BTC', value: 40, color: '#F59E0B' },
  { name: 'ETH', value: 25, color: '#3B82F6' },
  { name: 'SOL', value: 15, color: '#8B5CF6' },
  { name: 'Others', value: 20, color: '#10B981' },
];
const RADAR_DATA = [
  { subject: 'Win Rate', value: 78 },
  { subject: 'Sharpe', value: 85 },
  { subject: 'Stability', value: 72 },
  { subject: 'Volume', value: 90 },
  { subject: 'Experience', value: 88 },
  { subject: 'Risk Mgmt', value: 76 },
];

/* ═══════════════════════════════════════════════════
   1. WebCopyProviderDetailPage
   ═══════════════════════════════════════════════════ */

export function WebCopyProviderDetailPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { providerId } = useParams();
  const trader = COPY_TRADERS.find((t) => t.id === providerId) || COPY_TRADERS[0];
  const risk = RISK_CONFIG[trader.riskLevel];
  const tier = getTier(trader.copiers);
  const TierIcon = tier.icon;
  const [tab, setTab] = useState<'overview' | 'performance' | 'strategy' | 'disclosure'>(
    'overview',
  );

  const tabs = [
    { id: 'overview' as const, label: 'Tổng quan' },
    { id: 'performance' as const, label: 'Hiệu suất' },
    { id: 'strategy' as const, label: 'Chiến lược' },
    { id: 'disclosure' as const, label: 'Công khai' },
  ];

  return (
    <PageLayout>
      <Header title={trader.name} subtitle="Provider Detail · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Provider Hero */}
        <div
          className="flex items-start gap-6"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: '24px 28px',
            marginBottom: 24,
          }}
        >
          <div className="relative shrink-0">
            <div
              className="flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: c.primary + '22',
                border: `3px solid ${c.primary}44`,
              }}
            >
              <span style={{ color: c.primary, fontSize: 28, fontWeight: 700 }}>
                {trader.avatar}
              </span>
            </div>
            <div
              className="absolute -bottom-1 -right-1 flex items-center justify-center"
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: c.surface,
                border: `2px solid ${tier.color}`,
              }}
            >
              <TierIcon size={14} color={tier.color} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700 }}>
                {trader.name}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                  background: tier.color + '15',
                  color: tier.color,
                }}
              >
                {tier.label}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                  background: risk.color + '15',
                  color: risk.color,
                }}
              >
                Rủi ro: {risk.label}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {trader.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 500,
                    background: c.surface2,
                    color: c.text2,
                  }}
                >
                  {tag}
                </span>
              ))}
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
                · Holding trung bình: {trader.avgHoldingTime}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-baseline gap-3">
              <span
                style={{
                  color: trader.totalPnlPct >= 0 ? '#10B981' : '#EF4444',
                  fontSize: WEB_FONT['2xl'],
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {trader.totalPnlPct >= 0 ? '+' : ''}
                {trader.totalPnlPct.toFixed(1)}%
              </span>
              <span
                style={{
                  color: '#EF4444',
                  fontSize: WEB_FONT.lg,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {trader.maxDrawdown.toFixed(1)}% DD
              </span>
            </div>
            <button
              onClick={() => navigate(`/w/trade/copy-provider/${trader.id}/assessment`)}
              style={{
                height: WEB_BUTTON.lg,
                padding: '0 32px',
                borderRadius: 12,
                fontSize: WEB_FONT.md,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primary}bb 100%)`,
                color: '#fff',
                boxShadow: `0 4px 16px ${c.primary}30`,
              }}
            >
              Bắt đầu Copy
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1"
          style={{
            background: c.surface2,
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            display: 'inline-flex',
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                fontSize: WEB_FONT.base,
                fontWeight: tab === t.id ? 700 : 500,
                cursor: 'pointer',
                border: 'none',
                background: tab === t.id ? c.surface : 'transparent',
                color: tab === t.id ? c.text1 : c.text3,
                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && (
          <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>
            <div className="flex flex-col gap-5">
              {/* Stats Grid */}
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard
                  icon={Target}
                  label="Win Rate"
                  value={`${trader.winRate}%`}
                  color="#10B981"
                />
                <StatCard
                  icon={DollarSign}
                  label="Tổng PnL"
                  value={fmtSignedUsd(trader.totalPnl)}
                  color={trader.totalPnl >= 0 ? '#10B981' : '#EF4444'}
                />
                <StatCard
                  icon={Users}
                  label="Copiers"
                  value={`${trader.copiers.toLocaleString()}`}
                  color="#3B82F6"
                  sub={`/ ${trader.maxCopiers.toLocaleString()} max`}
                />
                <StatCard
                  icon={BarChart3}
                  label="Sharpe Ratio"
                  value={trader.sharpeRatio.toFixed(2)}
                  color="#F59E0B"
                />
              </div>
              {/* Performance Chart */}
              <div
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <h3
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.lg,
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: 16,
                  }}
                >
                  Hiệu suất 90 ngày
                </h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PERF_DATA}>
                      <defs>
                        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.divider} />
                      <XAxis dataKey="day" stroke={c.text3} fontSize={10} />
                      <YAxis stroke={c.text3} fontSize={10} />
                      <Tooltip contentStyle={tooltipS(c)} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        fill="url(#perfGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {/* Sidebar: Radar + Quick Info */}
            <div className="flex flex-col gap-5">
              <div
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <h3
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: 16,
                  }}
                >
                  Đánh giá tổng hợp
                </h3>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={RADAR_DATA}>
                      <PolarGrid stroke={c.divider} />
                      <PolarAngleAxis dataKey="subject" style={{ fontSize: 10, fill: c.text3 }} />
                      <PolarRadiusAxis style={{ fontSize: 9 }} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="#3B82F6"
                        fill="#3B82F6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <h3
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: 12,
                  }}
                >
                  Phân bổ tài sản
                </h3>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ALLOCATION_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {ALLOCATION_DATA.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipS(c)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {ALLOCATION_DATA.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div
                        style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }}
                      />
                      <span style={{ color: c.text2, fontSize: WEB_FONT.xs }}>
                        {d.name} {d.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Risk Warning */}
              <div
                style={{
                  background: 'rgba(245,158,11,0.06)',
                  border: '1px solid rgba(245,158,11,0.15)',
                  borderRadius: 14,
                  padding: '14px 16px',
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle size={WEB_ICON.sm} color="#F59E0B" className="shrink-0 mt-0.5" />
                  <p
                    style={{ color: '#F59E0B', fontSize: WEB_FONT.xs, lineHeight: 1.6, margin: 0 }}
                  >
                    {COMPLIANCE_MESSAGES.FIDUCIARY_DISCLAIMER}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'performance' && (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <StatCard
              icon={TrendingUp}
              label="Tổng ROI"
              value={`+${trader.totalPnlPct.toFixed(1)}%`}
              color="#10B981"
              sub="Kể từ khi tạo"
            />
            <StatCard
              icon={TrendingDown}
              label="Max Drawdown"
              value={`${trader.maxDrawdown.toFixed(1)}%`}
              color="#EF4444"
              sub="Worst case"
            />
            <StatCard
              icon={Activity}
              label="Tổng giao dịch"
              value={trader.totalTrades.toLocaleString()}
              sub="Lệnh đã thực hiện"
            />
            <StatCard
              icon={Clock}
              label="Thời gian giữ TB"
              value={trader.avgHoldingTime}
              sub="Trung bình"
            />
          </div>
        )}
        {tab === 'strategy' && (
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '24px 28px',
            }}
          >
            <h3
              style={{
                color: c.text1,
                fontSize: WEB_FONT.lg,
                fontWeight: 700,
                margin: 0,
                marginBottom: 16,
              }}
            >
              Chiến lược giao dịch
            </h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[
                { label: 'Phong cách', value: trader.tags.join(', ') },
                { label: 'Holding trung bình', value: trader.avgHoldingTime },
                { label: 'Risk level', value: risk.label },
                { label: 'Sharpe Ratio', value: trader.sharpeRatio.toFixed(2) },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ background: c.surface2, borderRadius: 12, padding: '14px 18px' }}
                >
                  <p style={{ color: c.text3, fontSize: WEB_FONT.sm, margin: 0, marginBottom: 4 }}>
                    {item.label}
                  </p>
                  <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, margin: 0 }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === 'disclosure' && (
          <div className="flex flex-col gap-5">
            {[
              {
                title: 'Cảnh báo rủi ro',
                text: COMPLIANCE_MESSAGES.RISK_WARNING,
                color: '#F59E0B',
                icon: AlertTriangle,
              },
              {
                title: 'Miễn trừ trách nhiệm',
                text: COMPLIANCE_MESSAGES.FIDUCIARY_DISCLAIMER,
                color: '#EF4444',
                icon: Shield,
              },
              {
                title: 'Hiệu suất quá khứ',
                text: COMPLIANCE_MESSAGES.PAST_PERFORMANCE,
                color: '#3B82F6',
                icon: Info,
              },
              {
                title: 'High-Water Mark',
                text: COMPLIANCE_MESSAGES.HIGH_WATER_MARK,
                color: '#10B981',
                icon: CheckCircle,
              },
            ].map((d, i) => {
              const DIcon = d.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-4"
                  style={{
                    background: d.color + '08',
                    border: `1px solid ${d.color}22`,
                    borderRadius: 14,
                    padding: '18px 22px',
                  }}
                >
                  <DIcon size={WEB_ICON.lg} color={d.color} className="shrink-0 mt-0.5" />
                  <div>
                    <h4
                      style={{
                        color: d.color,
                        fontSize: WEB_FONT.md,
                        fontWeight: 700,
                        margin: 0,
                        marginBottom: 6,
                      }}
                    >
                      {d.title}
                    </h4>
                    <p
                      style={{
                        color: c.text2,
                        fontSize: WEB_FONT.base,
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {d.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   2. WebCopyPreAssessmentPage
   ═══════════════════════════════════════════════════ */

const ASSESSMENT_QUESTIONS = [
  { q: 'Kinh nghiệm đầu tư của bạn?', options: ['Dưới 1 năm', '1-3 năm', '3-5 năm', 'Trên 5 năm'] },
  { q: 'Mức tổn thất bạn chấp nhận được?', options: ['5-10%', '10-20%', '20-30%', 'Trên 30%'] },
  {
    q: 'Mục tiêu đầu tư?',
    options: ['Bảo toàn vốn', 'Thu nhập ổn định', 'Tăng trưởng', 'Tăng trưởng mạnh'],
  },
  {
    q: 'Thu nhập hàng tháng?',
    options: ['Dưới 10M VND', '10-30M VND', '30-50M VND', 'Trên 50M VND'],
  },
];

export function WebCopyPreAssessmentPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { providerId } = useParams();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const allAnswered = Object.keys(answers).length === ASSESSMENT_QUESTIONS.length;

  return (
    <PageLayout>
      <Header title="Đánh giá Phù hợp" subtitle="Pre-Copy Assessment · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: '1fr 340px', alignItems: 'flex-start' }}
        >
          <div className="flex flex-col gap-5">
            <div
              className="flex items-start gap-3"
              style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 14,
                padding: '14px 18px',
              }}
            >
              <Info size={WEB_ICON.md} color="#3B82F6" className="shrink-0 mt-0.5" />
              <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
                Theo quy định MiFID II, chúng tôi cần đánh giá mức phù hợp trước khi bạn bắt đầu
                copy trading.
              </p>
            </div>
            {ASSESSMENT_QUESTIONS.map((aq, qi) => (
              <div
                key={qi}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 14,
                  padding: '20px 24px',
                }}
              >
                <p
                  style={{
                    color: c.text1,
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: 14,
                  }}
                >
                  {qi + 1}. {aq.q}
                </p>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {aq.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers((p) => ({ ...p, [qi]: opt }))}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: answers[qi] === opt ? c.primary : c.surface2,
                        color: answers[qi] === opt ? '#fff' : c.text2,
                        border: `1px solid ${answers[qi] === opt ? c.primary : c.border}`,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Sidebar */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <Shield size={WEB_ICON.md} color={c.primary} />
                <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                  Tiến trình
                </span>
              </div>
              <div
                style={{
                  background: c.surface2,
                  borderRadius: 8,
                  height: 8,
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: `${(Object.keys(answers).length / ASSESSMENT_QUESTIONS.length) * 100}%`,
                    height: '100%',
                    background: c.primary,
                    borderRadius: 8,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <p style={{ color: c.text3, fontSize: WEB_FONT.sm, margin: 0, marginBottom: 16 }}>
                {Object.keys(answers).length} / {ASSESSMENT_QUESTIONS.length} câu hỏi
              </p>
              <button
                onClick={() => {
                  if (allAnswered) navigate(`/w/trade/copy-provider/${providerId}/configuration`);
                }}
                disabled={!allAnswered}
                style={{
                  width: '100%',
                  height: WEB_BUTTON.lg,
                  borderRadius: 12,
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  cursor: allAnswered ? 'pointer' : 'not-allowed',
                  border: 'none',
                  background: allAnswered ? c.primary : c.surface2,
                  color: allAnswered ? '#fff' : c.text3,
                }}
              >
                {allAnswered ? 'Tiếp tục cấu hình' : 'Trả lời tất cả câu hỏi'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   3. WebCopyConfigurationPage
   ═══════════════════════════════════════════════════ */

export function WebCopyConfigurationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { providerId } = useParams();
  const trader = COPY_TRADERS.find((t) => t.id === providerId) || COPY_TRADERS[0];
  const [amount, setAmount] = useState('500');
  const [stopLoss, setStopLoss] = useState('20');
  const [maxDailyLoss, setMaxDailyLoss] = useState('5');
  const [copyMode, setCopyMode] = useState<'proportional' | 'fixed'>('proportional');

  const amtNum = parseFloat(amount) || 0;
  const platformFee = amtNum * 0.001;
  const perfFee = '10% of profit (HWM)';

  return (
    <PageLayout>
      <Header title="Cấu hình Copy" subtitle="Configuration · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: '1fr 380px', alignItems: 'flex-start' }}
        >
          <div className="flex flex-col gap-5">
            {/* Copy Amount */}
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                Số tiền Copy
              </h3>
              <div
                className="flex items-center gap-3"
                style={{
                  background: c.surface2,
                  border: `1.5px solid ${c.primary}33`,
                  height: WEB_SPACING.rowRelaxed,
                  borderRadius: 12,
                  padding: '0 16px',
                }}
              >
                <DollarSign size={WEB_ICON.sm} color={c.text3} />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: c.text1,
                    fontSize: WEB_FONT.lg,
                    flex: 1,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>USDT</span>
              </div>
              <div className="flex gap-2 mt-3">
                {['100', '500', '1000', '5000'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: amount === v ? c.primary : c.surface2,
                      color: amount === v ? '#fff' : c.text2,
                      border: `1px solid ${amount === v ? c.primary : c.border}`,
                    }}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>
            {/* Copy Mode */}
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                Chế độ Copy
              </h3>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {[
                  { id: 'proportional' as const, label: 'Tỷ lệ', desc: 'Copy theo tỷ lệ vốn' },
                  { id: 'fixed' as const, label: 'Cố định', desc: 'Copy số lượng cố định' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setCopyMode(m.id)}
                    className="text-left"
                    style={{
                      padding: '16px 18px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: copyMode === m.id ? c.primary + '0A' : c.surface2,
                      border: `2px solid ${copyMode === m.id ? c.primary : c.border}`,
                    }}
                  >
                    <span
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.md,
                        fontWeight: 700,
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      {m.label}
                    </span>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Risk Controls */}
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                Quản lý rủi ro
              </h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div>
                  <label
                    style={{
                      color: c.text2,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Stop Loss (%)
                  </label>
                  <div
                    className="flex items-center gap-3"
                    style={{
                      background: c.surface2,
                      border: `1.5px solid rgba(239,68,68,0.25)`,
                      height: WEB_SPACING.rowDefault,
                      borderRadius: 12,
                      padding: '0 16px',
                    }}
                  >
                    <input
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: c.text1,
                        fontSize: WEB_FONT.md,
                        flex: 1,
                      }}
                    />
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm }}>%</span>
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      color: c.text2,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 500,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Max Daily Loss (%)
                  </label>
                  <div
                    className="flex items-center gap-3"
                    style={{
                      background: c.surface2,
                      border: `1.5px solid rgba(245,158,11,0.25)`,
                      height: WEB_SPACING.rowDefault,
                      borderRadius: 12,
                      padding: '0 16px',
                    }}
                  >
                    <input
                      type="number"
                      value={maxDailyLoss}
                      onChange={(e) => setMaxDailyLoss(e.target.value)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: c.text1,
                        fontSize: WEB_FONT.md,
                        flex: 1,
                      }}
                    />
                    <span style={{ color: '#F59E0B', fontSize: WEB_FONT.sm }}>%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Summary Sidebar */}
          <div style={{ position: 'sticky', top: 24 }}>
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 16,
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  margin: 0,
                  marginBottom: 16,
                }}
              >
                Tóm tắt
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Provider', value: trader.name },
                  { label: 'Số tiền', value: `$${amtNum.toLocaleString()}` },
                  { label: 'Chế độ', value: copyMode === 'proportional' ? 'Tỷ lệ' : 'Cố định' },
                  { label: 'Stop Loss', value: `${stopLoss}%` },
                  { label: 'Max Daily Loss', value: `${maxDailyLoss}%` },
                  { label: 'Phí nền tảng', value: `$${platformFee.toFixed(2)}` },
                  { label: 'Performance Fee', value: perfFee },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex justify-between"
                    style={{ padding: '8px 0', borderBottom: `1px solid ${c.divider}` }}
                  >
                    <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{r.label}</span>
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate(`/w/trade/copy-provider/${providerId}/confirmation`)}
                disabled={amtNum < 100}
                style={{
                  width: '100%',
                  height: WEB_BUTTON.lg,
                  borderRadius: 12,
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  marginTop: 20,
                  cursor: amtNum >= 100 ? 'pointer' : 'not-allowed',
                  border: 'none',
                  background: amtNum >= 100 ? c.primary : c.surface2,
                  color: amtNum >= 100 ? '#fff' : c.text3,
                }}
              >
                Xem lại & Xác nhận
              </button>
              {amtNum < 100 && (
                <p
                  style={{
                    color: '#EF4444',
                    fontSize: WEB_FONT.xs,
                    margin: 0,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  Tối thiểu $100
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   4. WebCopyConfirmationPage
   ═══════════════════════════════════════════════════ */

export function WebCopyConfirmationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const { providerId } = useParams();
  const trader = COPY_TRADERS.find((t) => t.id === providerId) || COPY_TRADERS[0];
  const [agreed, setAgreed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <PageLayout>
        <Header title="Xác nhận thành công" back />
        <div style={{ padding: '24px 0 40px' }}>
          <div
            className="flex flex-col items-center justify-center"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '64px 40px',
              maxWidth: 560,
              margin: '0 auto',
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(16,185,129,0.12)',
                marginBottom: 20,
              }}
            >
              <CheckCircle size={36} color="#10B981" />
            </div>
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT['2xl'],
                fontWeight: 700,
                margin: 0,
                marginBottom: 8,
              }}
            >
              Copy Trading đã được kích hoạt!
            </h2>
            <p
              style={{
                color: c.text2,
                fontSize: WEB_FONT.base,
                textAlign: 'center',
                margin: 0,
                marginBottom: 24,
              }}
            >
              Bạn đã bắt đầu copy {trader.name}. Theo dõi hiệu suất tại mục Copy đang hoạt động.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/w/trade/copy-trading/active')}
                style={{
                  height: WEB_BUTTON.lg,
                  padding: '0 24px',
                  borderRadius: 12,
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: c.primary,
                  color: '#fff',
                }}
              >
                Xem Copy hoạt động
              </button>
              <button
                onClick={() => navigate('/w/trade/copy-trading')}
                style={{
                  height: WEB_BUTTON.lg,
                  padding: '0 24px',
                  borderRadius: 12,
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${c.border}`,
                  background: c.surface,
                  color: c.text1,
                }}
              >
                Về trang chính
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Xác nhận Copy" subtitle="Confirmation · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Summary Card */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: '24px 28px',
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                color: c.text1,
                fontSize: WEB_FONT.lg,
                fontWeight: 700,
                margin: 0,
                marginBottom: 20,
              }}
            >
              Chi tiết Copy Trading
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Provider', value: trader.name },
                { label: 'Số tiền Copy', value: '$500.00' },
                { label: 'Chế độ', value: 'Tỷ lệ (Proportional)' },
                { label: 'Stop Loss', value: '20%' },
                { label: 'Max Daily Loss', value: '5%' },
                { label: 'Phí nền tảng', value: '$0.50 (0.1%)' },
                { label: 'Performance Fee', value: '10% of profit (HWM)' },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between"
                  style={{ padding: '10px 0', borderBottom: `1px solid ${c.divider}` }}
                >
                  <span style={{ color: c.text3, fontSize: WEB_FONT.base }}>{r.label}</span>
                  <span style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600 }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Risk Warning */}
          <div
            className="flex items-start gap-3"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 14,
              padding: '14px 18px',
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={WEB_ICON.md} color="#EF4444" className="shrink-0 mt-0.5" />
            <p style={{ color: '#EF4444', fontSize: WEB_FONT.sm, lineHeight: 1.6, margin: 0 }}>
              {COMPLIANCE_MESSAGES.RISK_WARNING}
            </p>
          </div>
          {/* Agreement */}
          <button
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 w-full text-left"
            style={{
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: 0,
              marginBottom: 20,
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                marginTop: 1,
                border: `2px solid ${agreed ? c.primary : c.border}`,
                background: agreed ? c.primary : 'transparent',
              }}
            >
              {agreed && <CheckCircle size={14} color="#fff" />}
            </div>
            <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6 }}>
              Tôi đã đọc và hiểu các rủi ro. Tôi đồng ý với điều khoản Copy Trading và chấp nhận mọi
              tổn thất có thể xảy ra.
            </span>
          </button>
          {/* CTA */}
          <button
            onClick={() => {
              if (agreed) setConfirmed(true);
            }}
            disabled={!agreed}
            style={{
              width: '100%',
              height: WEB_BUTTON.lg,
              borderRadius: 12,
              fontSize: WEB_FONT.md,
              fontWeight: 700,
              cursor: agreed ? 'pointer' : 'not-allowed',
              border: 'none',
              background: agreed ? c.primary : c.surface2,
              color: agreed ? '#fff' : c.text3,
            }}
          >
            {agreed ? 'Xác nhận bắt đầu Copy' : 'Đọc và đồng ý điều khoản'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   5. WebCopyProviderApplicationPage
   ═══════════════════════════════════════════════════ */

export function WebCopyProviderApplicationPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const steps = ['Thông tin cá nhân', 'Kinh nghiệm', 'Chiến lược', 'Pháp lý'];

  return (
    <PageLayout>
      <Header title="Đăng ký Provider" subtitle="Provider Application · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Steps */}
        <div className="flex items-center gap-2" style={{ marginBottom: 28 }}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: i <= step ? c.primary : c.surface2,
                    color: i <= step ? '#fff' : c.text3,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    color: i <= step ? c.text1 : c.text3,
                    fontSize: WEB_FONT.sm,
                    fontWeight: i === step ? 700 : 500,
                  }}
                >
                  {s}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: i < step ? c.primary : c.divider,
                    borderRadius: 1,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: '24px 28px',
            maxWidth: 720,
          }}
        >
          <h3
            style={{
              color: c.text1,
              fontSize: WEB_FONT.lg,
              fontWeight: 700,
              margin: 0,
              marginBottom: 20,
            }}
          >
            {steps[step]}
          </h3>
          <div className="flex flex-col gap-4">
            {[
              {
                label:
                  step === 0
                    ? 'Tên hiển thị'
                    : step === 1
                      ? 'Số năm kinh nghiệm'
                      : step === 2
                        ? 'Tên chiến lược'
                        : 'Số CMND/CCCD',
                placeholder: 'Nhập...',
              },
              {
                label:
                  step === 0
                    ? 'Bio / Mô tả'
                    : step === 1
                      ? 'Lĩnh vực chuyên môn'
                      : step === 2
                        ? 'Mô tả chiến lược'
                        : 'Quốc tịch',
                placeholder: 'Nhập...',
              },
            ].map((f, i) => (
              <div key={i}>
                <label
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: 8,
                  }}
                >
                  {f.label}
                </label>
                <input
                  placeholder={f.placeholder}
                  style={{
                    width: '100%',
                    height: WEB_SPACING.rowDefault,
                    borderRadius: 12,
                    padding: '0 16px',
                    fontSize: WEB_FONT.md,
                    background: c.surface2,
                    border: `1.5px solid ${c.border}`,
                    color: c.text1,
                    outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  height: WEB_BUTTON.lg,
                  padding: '0 24px',
                  borderRadius: 12,
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${c.border}`,
                  background: c.surface,
                  color: c.text1,
                }}
              >
                Quay lại
              </button>
            )}
            <button
              onClick={() => {
                if (step < steps.length - 1) setStep((s) => s + 1);
                else {
                  toast.success('Đã gửi đơn đăng ký!');
                  navigate('/w/trade/copy-trading');
                }
              }}
              style={{
                height: WEB_BUTTON.lg,
                padding: '0 32px',
                borderRadius: 12,
                fontSize: WEB_FONT.md,
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: c.primary,
                color: '#fff',
              }}
            >
              {step < steps.length - 1 ? 'Tiếp tục' : 'Gửi đơn'}
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   6. WebCopyProviderComparisonPage
   ═══════════════════════════════════════════════════ */

export function WebCopyProviderComparisonPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(COPY_TRADERS.slice(0, 3).map((t) => t.id));
  const traders = COPY_TRADERS.filter((t) => selected.includes(t.id));
  const metrics = [
    'Win Rate',
    'Tổng ROI',
    'Max DD',
    'Sharpe',
    'Copiers',
    'AUM',
    'Trades',
    'Hold Time',
  ];

  return (
    <PageLayout>
      <Header title="So sánh Providers" subtitle="Comparison · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* Header Row */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `160px repeat(${traders.length}, 1fr)`,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <div style={{ padding: '16px 20px' }}>
              <span
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                }}
              >
                Chỉ số
              </span>
            </div>
            {traders.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3"
                style={{ padding: '16px 20px', borderLeft: `1px solid ${c.divider}` }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: c.primary + '22',
                  }}
                >
                  <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                    {t.avatar}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 700,
                      display: 'block',
                    }}
                  >
                    {t.name}
                  </span>
                  <span style={{ color: RISK_CONFIG[t.riskLevel].color, fontSize: WEB_FONT.xs }}>
                    {RISK_CONFIG[t.riskLevel].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Data Rows */}
          {metrics.map((m, mi) => {
            const getVal = (t: (typeof COPY_TRADERS)[0]) => {
              switch (mi) {
                case 0:
                  return `${t.winRate}%`;
                case 1:
                  return `+${t.totalPnlPct.toFixed(1)}%`;
                case 2:
                  return `${t.maxDrawdown.toFixed(1)}%`;
                case 3:
                  return t.sharpeRatio.toFixed(2);
                case 4:
                  return t.copiers.toLocaleString();
                case 5:
                  return `$${fmtCompact(t.aum)}`;
                case 6:
                  return t.totalTrades.toLocaleString();
                case 7:
                  return t.avgHoldingTime;
                default:
                  return '-';
              }
            };
            return (
              <div
                key={m}
                className="grid"
                style={{
                  gridTemplateColumns: `160px repeat(${traders.length}, 1fr)`,
                  borderBottom: mi < metrics.length - 1 ? `1px solid ${c.divider}` : 'none',
                  background: mi % 2 === 0 ? 'transparent' : c.surface2 + '40',
                }}
              >
                <div style={{ padding: '12px 20px' }}>
                  <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                    {m}
                  </span>
                </div>
                {traders.map((t) => (
                  <div
                    key={t.id}
                    style={{ padding: '12px 20px', borderLeft: `1px solid ${c.divider}` }}
                  >
                    <span
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {getVal(t)}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <p
          style={{
            color: c.text3,
            fontSize: WEB_FONT.xs,
            lineHeight: 1.6,
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          {COMPLIANCE_MESSAGES.PAST_PERFORMANCE}
        </p>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   7. WebCopyProviderLeaderboardPage
   ═══════════════════════════════════════════════════ */

export function WebCopyProviderLeaderboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'roi' | 'sharpe' | 'followers'>('roi');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const sorted = useMemo(() => {
    let list = [...COPY_TRADERS];
    if (riskFilter !== 'all') list = list.filter((t) => t.riskLevel === riskFilter);
    return list.sort((a, b) => {
      if (sortBy === 'roi') return b.totalPnlPct - a.totalPnlPct;
      if (sortBy === 'sharpe') return b.sharpeRatio - a.sharpeRatio;
      return b.copiers - a.copiers;
    });
  }, [sortBy, riskFilter]);

  return (
    <PageLayout>
      <Header title="Bảng xếp hạng" subtitle="Leaderboard · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Survivorship Bias Warning */}
        <div
          className="flex items-start gap-3"
          style={{
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 14,
            padding: '14px 18px',
            marginBottom: 20,
          }}
        >
          <Info size={WEB_ICON.md} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6, margin: 0 }}>
            Survivorship bias: Bảng xếp hạng chỉ hiển thị providers đang hoạt động. Providers đã
            ngừng hoạt động hoặc bị loại không nằm trong danh sách.
          </p>
        </div>
        {/* Filters */}
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <div
            className="flex items-center gap-1"
            style={{ background: c.surface2, borderRadius: 10, padding: 3 }}
          >
            {[
              { id: 'roi' as const, label: 'ROI' },
              { id: 'sharpe' as const, label: 'Sharpe' },
              { id: 'followers' as const, label: 'Followers' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.sm,
                  fontWeight: sortBy === s.id ? 700 : 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: sortBy === s.id ? c.surface : 'transparent',
                  color: sortBy === s.id ? c.text1 : c.text3,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['all', 'low', 'medium', 'high'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.sm,
                  fontWeight: riskFilter === r ? 700 : 500,
                  cursor: 'pointer',
                  background:
                    riskFilter === r
                      ? r === 'low'
                        ? '#10B98118'
                        : r === 'medium'
                          ? '#F59E0B18'
                          : r === 'high'
                            ? '#EF444418'
                            : c.surface
                      : c.surface,
                  border: `1px solid ${riskFilter === r ? (r === 'low' ? '#10B981' : r === 'medium' ? '#F59E0B' : r === 'high' ? '#EF4444' : c.border) : c.border}`,
                  color:
                    riskFilter === r
                      ? r === 'low'
                        ? '#10B981'
                        : r === 'medium'
                          ? '#F59E0B'
                          : r === 'high'
                            ? '#EF4444'
                            : c.text1
                      : c.text2,
                }}
              >
                {r === 'all' ? 'Tất cả' : RISK_CONFIG[r].label}
              </button>
            ))}
          </div>
        </div>
        {/* Table */}
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: '50px 1fr 100px 100px 100px 100px 100px 120px',
              padding: '12px 20px',
              borderBottom: `1px solid ${c.divider}`,
              background: c.surface2,
            }}
          >
            {['#', 'Provider', 'ROI', 'Max DD', 'Sharpe', 'Win Rate', 'Copiers', ''].map((h) => (
              <span
                key={h}
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                }}
              >
                {h}
              </span>
            ))}
          </div>
          {sorted.map((t, i) => (
            <div
              key={t.id}
              className="grid items-center web-cmd-btn"
              style={{
                gridTemplateColumns: '50px 1fr 100px 100px 100px 100px 100px 120px',
                padding: '14px 20px',
                borderBottom: i < sorted.length - 1 ? `1px solid ${c.divider}` : 'none',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/w/trade/copy-provider/${t.id}`)}
            >
              <span
                style={{
                  color: i < 3 ? '#F59E0B' : c.text3,
                  fontSize: WEB_FONT.md,
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: c.primary + '22',
                  }}
                >
                  <span style={{ color: c.primary, fontSize: 14, fontWeight: 700 }}>
                    {t.avatar}
                  </span>
                </div>
                <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                  {t.name}
                </span>
              </div>
              <span
                style={{
                  color: '#10B981',
                  fontSize: WEB_FONT.sm,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                +{t.totalPnlPct.toFixed(1)}%
              </span>
              <span
                style={{
                  color: '#EF4444',
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.maxDrawdown.toFixed(1)}%
              </span>
              <span
                style={{
                  color: '#F59E0B',
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.sharpeRatio.toFixed(2)}
              </span>
              <span
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.sm,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.winRate}%
              </span>
              <span
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.sm,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.copiers.toLocaleString()}
              </span>
              <button
                style={{
                  height: WEB_BUTTON.sm,
                  padding: '0 14px',
                  borderRadius: 8,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${c.primary}30`,
                  background: c.primary + '08',
                  color: c.primary,
                }}
              >
                Xem
              </button>
            </div>
          ))}
        </div>
        <p style={{ color: c.text3, fontSize: WEB_FONT.xs, textAlign: 'center', marginTop: 16 }}>
          {COMPLIANCE_MESSAGES.PAST_PERFORMANCE}
        </p>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   8. WebCopyProviderGovernancePage
   ═══════════════════════════════════════════════════ */

export function WebCopyProviderGovernancePage() {
  const c = useThemeColors();
  const RULES = [
    {
      title: 'Yêu cầu KYC',
      desc: 'Provider phải hoàn thành xác minh KYC Level 2 trở lên',
      status: 'active',
      icon: Shield,
    },
    {
      title: 'Giới hạn Copiers',
      desc: 'Mỗi provider có giới hạn copiers dựa trên track record và AUM',
      status: 'active',
      icon: Users,
    },
    {
      title: 'Tiêu chuẩn hiệu suất',
      desc: 'Provider bị loại nếu Max DD > 50% hoặc Sharpe < 0.5 trong 90 ngày',
      status: 'active',
      icon: BarChart3,
    },
    {
      title: 'Conflict of Interest',
      desc: 'Provider phải công khai mọi xung đột lợi ích. Front-running bị cấm',
      status: 'active',
      icon: AlertTriangle,
    },
    {
      title: 'Audit Trail',
      desc: 'Mọi thay đổi chiến lược được ghi log và hiển thị cho copiers',
      status: 'active',
      icon: FileText,
    },
    {
      title: 'Cooling-off Period',
      desc: 'Copier có 24h cooling-off sau khi bắt đầu copy',
      status: 'active',
      icon: Clock,
    },
  ];

  return (
    <PageLayout>
      <Header title="Quản trị Provider" subtitle="Governance · Copy Trading" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {RULES.map((r, i) => {
            const RIcon = r.icon;
            return (
              <div
                key={i}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: '20px 24px',
                }}
              >
                <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: c.primary + '12',
                    }}
                  >
                    <RIcon size={WEB_ICON.md} color={c.primary} />
                  </div>
                  <div className="flex-1">
                    <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700 }}>
                      {r.title}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      background: '#10B98115',
                      color: '#10B981',
                    }}
                  >
                    Hoạt động
                  </span>
                </div>
                <p style={{ color: c.text2, fontSize: WEB_FONT.base, lineHeight: 1.6, margin: 0 }}>
                  {r.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
