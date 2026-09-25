/**
 * WebBotAnalyticsPages — Enterprise Desktop versions of:
 *   - BotHistoryPage
 *   - BotPerformanceAnalyticsPage
 *   - BotRiskDashboardPage
 *   - BotPortfolioDashboardPage
 *   - BotStrategyComparePage
 *   - BotOptimizationPage
 *   - BotDrawdownAnalyzerPage
 *   - BotEquityCurvePage
 */
import React, { useState } from 'react';
import {
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Activity,
  Shield,
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  Settings,
  Play,
} from 'lucide-react';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_ICON, WEB_BUTTON } from '@/shared/theme/webTokens';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

/* ─── shared helpers ─── */
const tooltipS = (c: ThemeColors) => ({
  background: c.surface,
  border: `1px solid ${c.border}`,
  borderRadius: 10,
  fontSize: 11,
});
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
   1. WebBotHistoryPage — Desktop trade history table
   ═══════════════════════════════════════════════════ */

const TRADES = [
  {
    id: 't1',
    ts: '2026-03-08 14:32:15',
    bot: 'DCA Bot #1',
    strat: 'DCA',
    pair: 'BTC/USDT',
    side: 'buy' as const,
    qty: '0.001',
    price: '$68,450',
    fee: '$0.034',
    pnl: 0,
  },
  {
    id: 't2',
    ts: '2026-03-08 13:15:08',
    bot: 'Grid Bot #1',
    strat: 'Grid',
    pair: 'ETH/USDT',
    side: 'sell' as const,
    qty: '0.05',
    price: '$3,850',
    fee: '$0.096',
    pnl: 12.5,
  },
  {
    id: 't3',
    ts: '2026-03-08 12:00:42',
    bot: 'Grid Bot #1',
    strat: 'Grid',
    pair: 'ETH/USDT',
    side: 'buy' as const,
    qty: '0.05',
    price: '$3,800',
    fee: '$0.095',
    pnl: 0,
  },
  {
    id: 't4',
    ts: '2026-03-08 10:45:30',
    bot: 'Momentum #1',
    strat: 'Momentum',
    pair: 'SOL/USDT',
    side: 'buy' as const,
    qty: '5',
    price: '$142.30',
    fee: '$0.356',
    pnl: 0,
  },
  {
    id: 't5',
    ts: '2026-03-08 09:20:15',
    bot: 'DCA Bot #1',
    strat: 'DCA',
    pair: 'BTC/USDT',
    side: 'buy' as const,
    qty: '0.001',
    price: '$68,200',
    fee: '$0.034',
    pnl: 0,
  },
  {
    id: 't6',
    ts: '2026-03-07 22:15:45',
    bot: 'Grid Bot #1',
    strat: 'Grid',
    pair: 'ETH/USDT',
    side: 'sell' as const,
    qty: '0.05',
    price: '$3,830',
    fee: '$0.096',
    pnl: 8.3,
  },
  {
    id: 't7',
    ts: '2026-03-07 18:42:30',
    bot: 'Grid Bot #1',
    strat: 'Grid',
    pair: 'ETH/USDT',
    side: 'buy' as const,
    qty: '0.05',
    price: '$3,780',
    fee: '$0.095',
    pnl: 0,
  },
  {
    id: 't8',
    ts: '2026-03-07 14:10:22',
    bot: 'Momentum #1',
    strat: 'Momentum',
    pair: 'SOL/USDT',
    side: 'sell' as const,
    qty: '5',
    price: '$145.60',
    fee: '$0.364',
    pnl: 16.14,
  },
];

export function WebBotHistoryPage() {
  const c = useThemeColors();
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState<'all' | 'buy' | 'sell'>('all');
  const filtered = TRADES.filter(
    (t) =>
      (filterSide === 'all' || t.side === filterSide) &&
      (!search ||
        t.bot.toLowerCase().includes(search.toLowerCase()) ||
        t.pair.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <PageLayout>
      <Header
        title="Lịch sử giao dịch"
        subtitle="Bot History · Trading Bots"
        back
        action={{ icon: Download, onClick: () => toast.success('Đang xuất...') }}
      />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Toolbar */}
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <div className="relative flex-1" style={{ maxWidth: 400 }}>
            <Search
              size={WEB_ICON.sm}
              color={c.text3}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              placeholder="Tìm theo bot hoặc cặp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 36,
                paddingRight: 12,
                height: WEB_BUTTON.md,
                borderRadius: 10,
                fontSize: WEB_FONT.sm,
                background: c.surface,
                border: `1px solid ${c.border}`,
                color: c.text1,
                outline: 'none',
              }}
            />
          </div>
          {(['all', 'buy', 'sell'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSide(s)}
              style={{
                height: WEB_BUTTON.md,
                padding: '0 16px',
                borderRadius: 10,
                fontSize: WEB_FONT.sm,
                fontWeight: filterSide === s ? 700 : 500,
                cursor: 'pointer',
                background:
                  filterSide === s
                    ? s === 'buy'
                      ? 'rgba(16,185,129,0.1)'
                      : s === 'sell'
                        ? 'rgba(239,68,68,0.1)'
                        : c.surface2
                    : c.surface,
                border: `1px solid ${filterSide === s ? (s === 'buy' ? '#10B981' : s === 'sell' ? '#EF4444' : c.border) : c.border}`,
                color:
                  filterSide === s
                    ? s === 'buy'
                      ? '#10B981'
                      : s === 'sell'
                        ? '#EF4444'
                        : c.text1
                    : c.text2,
              }}
            >
              {s === 'all' ? 'Tất cả' : s === 'buy' ? 'Mua' : 'Bán'}
            </button>
          ))}
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
          {/* Header row */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: '160px 130px 100px 80px 80px 90px 80px 80px',
              padding: '12px 20px',
              borderBottom: `1px solid ${c.divider}`,
              background: c.surface2,
            }}
          >
            {['Thời gian', 'Bot', 'Cặp', 'Loại', 'KL', 'Giá', 'Phí', 'P/L'].map((h) => (
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
          {/* Data rows */}
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className="grid"
              style={{
                gridTemplateColumns: '160px 130px 100px 80px 80px 90px 80px 80px',
                padding: '12px 20px',
                borderBottom: i < filtered.length - 1 ? `1px solid ${c.divider}` : 'none',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.sm,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.ts}
              </span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                {t.bot}
              </span>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm }}>{t.pair}</span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                  background: t.side === 'buy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: t.side === 'buy' ? '#10B981' : '#EF4444',
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {t.side === 'buy' ? 'MUA' : 'BÁN'}
              </span>
              <span
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.sm,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.qty}
              </span>
              <span
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.sm,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.price}
              </span>
              <span
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.sm,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.fee}
              </span>
              <span
                style={{
                  color: t.pnl > 0 ? '#10B981' : t.pnl < 0 ? '#EF4444' : c.text3,
                  fontSize: WEB_FONT.sm,
                  fontWeight: t.pnl !== 0 ? 700 : 400,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.pnl > 0
                  ? `+$${t.pnl.toFixed(2)}`
                  : t.pnl < 0
                    ? `-$${Math.abs(t.pnl).toFixed(2)}`
                    : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   2. WebBotPerformanceAnalyticsPage
   ═══════════════════════════════════════════════════ */

const PNL_DATA = [
  { date: 'Mar 1', pnl: 12.5 },
  { date: 'Mar 2', pnl: 28.3 },
  { date: 'Mar 3', pnl: 45.7 },
  { date: 'Mar 4', pnl: 32.1 },
  { date: 'Mar 5', pnl: 58.9 },
  { date: 'Mar 6', pnl: 91.2 },
  { date: 'Mar 7', pnl: 127.4 },
  { date: 'Mar 8', pnl: 199.3 },
];
const WIN_LOSS = [
  { week: 'W1', wins: 18, losses: 7 },
  { week: 'W2', wins: 22, losses: 5 },
  { week: 'W3', wins: 15, losses: 12 },
  { week: 'W4', wins: 25, losses: 8 },
];
const STRAT_PERF = [
  { strategy: 'DCA', pnl: 84.2, color: '#3B82F6' },
  { strategy: 'Grid', pnl: 127.4, color: '#F59E0B' },
  { strategy: 'Momentum', pnl: -12.3, color: '#10B981' },
];

export function WebBotPerformanceAnalyticsPage() {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title="Phân tích hiệu suất" subtitle="Performance Analytics · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Stats row */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}
        >
          <StatCard
            icon={DollarSign}
            label="Tổng P/L"
            value="+$199.30"
            color="#10B981"
            sub="Tháng này"
          />
          <StatCard
            icon={Target}
            label="Win Rate"
            value="72.3%"
            color="#10B981"
            sub="234 giao dịch"
          />
          <StatCard icon={Award} label="Sharpe Ratio" value="2.14" sub="Xuất sắc" />
          <StatCard
            icon={Activity}
            label="Profit Factor"
            value="2.87"
            color="#3B82F6"
            sub="Avg win/loss"
          />
        </div>
        {/* Charts */}
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}
        >
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              P/L tích lũy
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={PNL_DATA}>
                <defs>
                  <linearGradient id="plG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} />
                <YAxis
                  stroke={c.text3}
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={tooltipS(c)}
                  formatter={(v: unknown) => [`$${String(v)}`, 'P/L']}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#plG)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Win / Loss theo tuần
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WIN_LOSS}>
                <XAxis dataKey="week" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} />
                <YAxis stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} />
                <Tooltip contentStyle={tooltipS(c)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="wins" fill="#10B981" name="Thắng" radius={[4, 4, 0, 0]} />
                <Bar dataKey="losses" fill="#EF4444" name="Thua" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Strategy breakdown */}
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 14 }}>
            Hiệu suất theo chiến lược
          </p>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {STRAT_PERF.map((s) => (
              <div
                key={s.strategy}
                style={{
                  background: c.surface2,
                  borderRadius: 12,
                  padding: '16px 18px',
                  borderLeft: `4px solid ${s.color}`,
                }}
              >
                <p
                  style={{
                    color: s.color,
                    fontSize: WEB_FONT.md,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {s.strategy}
                </p>
                <p
                  style={{
                    color: s.pnl >= 0 ? '#10B981' : '#EF4444',
                    fontSize: WEB_FONT.xl,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    margin: 0,
                  }}
                >
                  {s.pnl >= 0 ? '+' : ''}${s.pnl.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   3. WebBotRiskDashboardPage
   ═══════════════════════════════════════════════════ */

const DD_DATA_RD = [
  { time: '00:00', drawdown: 0 },
  { time: '04:00', drawdown: -2.3 },
  { time: '08:00', drawdown: -5.1 },
  { time: '12:00', drawdown: -8.4 },
  { time: '16:00', drawdown: -12.2 },
  { time: '20:00', drawdown: -15.2 },
  { time: 'Now', drawdown: -15.2 },
];

export function WebBotRiskDashboardPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  return (
    <PageLayout>
      <Header
        title="Risk Dashboard"
        subtitle="Bảng rủi ro · Trading Bots"
        back
        action={{ icon: Settings, onClick: () => navigate('/w/trade/bots/security-settings') }}
      />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Risk stats */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}
        >
          <StatCard
            icon={TrendingDown}
            label="Drawdown hiện tại"
            value="-15.2%"
            color="#EF4444"
            sub="Giới hạn: -25%"
          />
          <StatCard
            icon={Shield}
            label="Risk Score"
            value="67/100"
            color="#F59E0B"
            sub="Trung bình"
          />
          <StatCard
            icon={DollarSign}
            label="VaR (1 ngày)"
            value="$127.50"
            color="#EF4444"
            sub="95% confidence"
          />
          <StatCard icon={Activity} label="Exposure" value="$2,500" sub="3 cặp giao dịch" />
        </div>
        {/* Charts */}
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}
        >
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Drawdown 24h
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={DD_DATA_RD}>
                <defs>
                  <linearGradient id="rdG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} />
                <YAxis
                  stroke={c.text3}
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipS(c)}
                  formatter={(v: unknown) => [`${String(v)}%`, 'Drawdown']}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#rdG)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Phân bổ rủi ro
            </p>
            <div className="flex flex-col" style={{ gap: 12 }}>
              {[
                { asset: 'BTC', pct: 50, value: '$1,250', color: '#F7931A' },
                { asset: 'ETH', pct: 30, value: '$750', color: '#627EEA' },
                { asset: 'SOL', pct: 20, value: '$500', color: '#9945FF' },
              ].map((a) => (
                <div key={a.asset}>
                  <div className="flex justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                      {a.asset}
                    </span>
                    <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                      {a.value} ({a.pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: c.surface2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${a.pct}%`,
                        background: a.color,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Emergency actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/w/trade/bots/emergency-stop')}
            className="flex items-center gap-2"
            style={{
              height: WEB_BUTTON.lg,
              padding: '0 24px',
              borderRadius: 12,
              fontSize: WEB_FONT.md,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: '#EF4444',
              color: '#fff',
            }}
          >
            <AlertOctagon size={WEB_ICON.sm} /> Emergency Stop
          </button>
          <button
            onClick={() => navigate('/w/trade/bots/risk-disclosure')}
            className="flex items-center gap-2"
            style={{
              height: WEB_BUTTON.lg,
              padding: '0 24px',
              borderRadius: 12,
              fontSize: WEB_FONT.md,
              fontWeight: 600,
              cursor: 'pointer',
              background: c.surface,
              border: `1px solid ${c.border}`,
              color: c.text1,
            }}
          >
            <Shield size={WEB_ICON.sm} /> Risk Disclosure
          </button>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   4. WebBotPortfolioDashboardPage
   ═══════════════════════════════════════════════════ */

const ALLOC_DATA = [
  { name: 'DCA', value: 1000, pnl: 84, color: '#3B82F6' },
  { name: 'Grid', value: 500, pnl: 127, color: '#F59E0B' },
  { name: 'Momentum', value: 500, pnl: -12, color: '#10B981' },
];

export function WebBotPortfolioDashboardPage() {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title="Portfolio Dashboard" subtitle="Danh mục · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}
        >
          <StatCard icon={DollarSign} label="Tổng vốn" value="$3,245" sub="Đầu tư: $2,500" />
          <StatCard icon={TrendingUp} label="Tổng P/L" value="+$745" color="#10B981" sub="+29.8%" />
          <StatCard icon={Award} label="Sharpe" value="1.92" sub="Portfolio" />
          <StatCard icon={Target} label="Đa dạng hóa" value="78/100" color="#3B82F6" sub="Tốt" />
        </div>
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
          {/* Pie chart */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Phân bổ danh mục
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ALLOC_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {ALLOC_DATA.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipS(c)}
                  formatter={(v: unknown) => [`$${String(v)}`, 'Vốn']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Strategy cards */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Chi tiết chiến lược
            </p>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {ALLOC_DATA.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between"
                  style={{
                    background: c.surface2,
                    borderRadius: 12,
                    padding: '14px 16px',
                    borderLeft: `4px solid ${s.color}`,
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: s.color,
                        fontSize: WEB_FONT.md,
                        fontWeight: 700,
                        marginBottom: 2,
                      }}
                    >
                      {s.name}
                    </p>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                      Vốn: ${s.value.toLocaleString()}
                    </p>
                  </div>
                  <p
                    style={{
                      color: s.pnl >= 0 ? '#10B981' : '#EF4444',
                      fontSize: WEB_FONT.lg,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {s.pnl >= 0 ? '+' : ''}${s.pnl}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   5. WebBotStrategyComparePage
   ═══════════════════════════════════════════════════ */

const RADAR_DATA = [
  { metric: 'Return', DCA: 42, Grid: 74, Momentum: 56, Martingale: 89 },
  { metric: 'Sharpe', DCA: 61, Grid: 85, Momentum: 72, Martingale: 48 },
  { metric: 'Win Rate', DCA: 55, Grid: 80, Momentum: 68, Martingale: 85 },
  { metric: 'Drawdown', DCA: 90, Grid: 70, Momentum: 60, Martingale: 30 },
  { metric: 'Consistency', DCA: 85, Grid: 75, Momentum: 50, Martingale: 35 },
  { metric: 'Simplicity', DCA: 95, Grid: 60, Momentum: 40, Martingale: 70 },
];

export function WebBotStrategyComparePage() {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title="So sánh chiến lược" subtitle="Strategy Compare · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}
        >
          {/* Radar */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Radar so sánh
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke={c.divider} />
                <PolarAngleAxis dataKey="metric" tick={{ fill: c.text3, fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: c.text3, fontSize: 9 }} domain={[0, 100]} />
                <Radar
                  name="DCA"
                  dataKey="DCA"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                />
                <Radar
                  name="Grid"
                  dataKey="Grid"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.15}
                />
                <Radar
                  name="Momentum"
                  dataKey="Momentum"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.15}
                />
                <Radar
                  name="Martingale"
                  dataKey="Martingale"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.15}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipS(c)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Table comparison */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Bảng so sánh chi tiết
            </p>
            <div className="flex flex-col" style={{ gap: 0 }}>
              {/* Header */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: '100px repeat(4, 1fr)',
                  padding: '8px 0',
                  borderBottom: `1px solid ${c.divider}`,
                }}
              >
                <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                  Metric
                </span>
                {['DCA', 'Grid', 'Moment.', 'Marting.'].map((s) => (
                  <span
                    key={s}
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
              {[
                { label: 'Return', vals: ['+42.3%', '+74.5%', '+55.9%', '+89.4%'], best: 3 },
                { label: 'Sharpe', vals: ['1.52', '2.14', '1.76', '1.18'], best: 1 },
                { label: 'Max DD', vals: ['-8.4%', '-4.5%', '-12.7%', '-28.7%'], best: 1 },
                { label: 'Win Rate', vals: ['65.2%', '72.3%', '68.4%', '78.9%'], best: 3 },
                { label: 'Risk', vals: ['Low', 'Med', 'Med', 'High'], best: 0 },
              ].map((row) => (
                <div
                  key={row.label}
                  className="grid"
                  style={{
                    gridTemplateColumns: '100px repeat(4, 1fr)',
                    padding: '10px 0',
                    borderBottom: `1px solid ${c.divider}`,
                  }}
                >
                  <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{row.label}</span>
                  {row.vals.map((v, i) => (
                    <span
                      key={i}
                      style={{
                        color: i === row.best ? '#10B981' : c.text1,
                        fontSize: WEB_FONT.sm,
                        fontWeight: i === row.best ? 700 : 400,
                        textAlign: 'center',
                      }}
                    >
                      {v}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   6. WebBotOptimizationPage
   ═══════════════════════════════════════════════════ */

const OPT_RESULTS = [
  { param1: 10, param2: 50, sharpe: 1.23, returns: 35.2, drawdown: -12.4 },
  { param1: 15, param2: 45, sharpe: 1.67, returns: 48.7, drawdown: -10.2 },
  { param1: 20, param2: 40, sharpe: 2.14, returns: 68.7, drawdown: -8.9 },
  { param1: 25, param2: 35, sharpe: 1.89, returns: 55.3, drawdown: -11.7 },
  { param1: 30, param2: 30, sharpe: 1.45, returns: 42.1, drawdown: -14.3 },
  { param1: 35, param2: 25, sharpe: 1.12, returns: 31.8, drawdown: -16.8 },
];

export function WebBotOptimizationPage() {
  const c = useThemeColors();
  const best = OPT_RESULTS.reduce((a, b) => (a.sharpe > b.sharpe ? a : b));
  return (
    <PageLayout>
      <Header title="Tối ưu hóa" subtitle="Optimization · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        {/* Best result */}
        <div
          className="flex items-center gap-4"
          style={{
            background: 'rgba(16,185,129,0.06)',
            border: '1.5px solid rgba(16,185,129,0.2)',
            borderRadius: 16,
            padding: '16px 24px',
            marginBottom: 24,
          }}
        >
          <CheckCircle2 size={WEB_ICON.xl} color="#10B981" />
          <div className="flex-1">
            <p
              style={{ color: '#10B981', fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 2 }}
            >
              Thông số tối ưu tìm thấy
            </p>
            <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
              Param1={best.param1}, Param2={best.param2} → Sharpe {best.sharpe}, Return +
              {best.returns}%
            </p>
          </div>
          <button
            style={{
              height: WEB_BUTTON.md,
              padding: '0 20px',
              borderRadius: 10,
              fontSize: WEB_FONT.sm,
              fontWeight: 700,
              background: '#10B981',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Play size={14} style={{ marginRight: 6, display: 'inline' }} /> Áp dụng
          </button>
        </div>
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {/* Scatter chart */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Return vs Drawdown
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <XAxis
                  type="number"
                  dataKey="returns"
                  name="Return"
                  stroke={c.text3}
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="number"
                  dataKey="drawdown"
                  name="Drawdown"
                  stroke={c.text3}
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <ZAxis type="number" dataKey="sharpe" range={[100, 400]} name="Sharpe" />
                <Tooltip
                  contentStyle={tooltipS(c)}
                  formatter={(v: unknown, name: string) => [
                    `${v}${name.includes('Sharpe') ? '' : '%'}`,
                    name,
                  ]}
                />
                <Scatter data={OPT_RESULTS} fill="#3B82F6">
                  {OPT_RESULTS.map((e, i) => (
                    <Cell key={i} fill={e.sharpe === best.sharpe ? '#10B981' : '#3B82F660'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          {/* Results table */}
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Kết quả tối ưu hóa
            </p>
            <div className="flex flex-col">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  padding: '8px 0',
                  borderBottom: `1px solid ${c.divider}`,
                }}
              >
                {['P1', 'P2', 'Sharpe', 'Return', 'DD'].map((h) => (
                  <span
                    key={h}
                    style={{
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {OPT_RESULTS.map((r, i) => {
                const isBest = r.sharpe === best.sharpe;
                return (
                  <div
                    key={i}
                    className="grid"
                    style={{
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      padding: '10px 0',
                      borderBottom: `1px solid ${c.divider}`,
                      background: isBest ? 'rgba(16,185,129,0.06)' : 'transparent',
                    }}
                  >
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, textAlign: 'center' }}>
                      {r.param1}
                    </span>
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, textAlign: 'center' }}>
                      {r.param2}
                    </span>
                    <span
                      style={{
                        color: isBest ? '#10B981' : c.text1,
                        fontSize: WEB_FONT.sm,
                        fontWeight: isBest ? 700 : 400,
                        textAlign: 'center',
                      }}
                    >
                      {r.sharpe}
                    </span>
                    <span style={{ color: '#10B981', fontSize: WEB_FONT.sm, textAlign: 'center' }}>
                      +{r.returns}%
                    </span>
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm, textAlign: 'center' }}>
                      {r.drawdown}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   7. WebBotDrawdownAnalyzerPage
   ═══════════════════════════════════════════════════ */

const UW_DATA = [
  { date: 'Sep', underwater: -2.3 },
  { date: 'Oct', underwater: -8.2 },
  { date: 'Nov', underwater: -3.1 },
  { date: 'Dec', underwater: -6.7 },
  { date: 'Jan', underwater: -10.3 },
  { date: 'Feb', underwater: -4.1 },
  { date: 'Mar', underwater: -1.2 },
];
const DD_EVENTS = [
  { period: 'Oct 15 - Nov 10', depth: -8.2, recovery: '26 ngày', trigger: 'Flash crash BTC' },
  { period: 'Jan 5 - Jan 28', depth: -10.3, recovery: '23 ngày', trigger: 'ETH sell-off' },
  { period: 'Dec 20 - Jan 5', depth: -6.7, recovery: '16 ngày', trigger: 'Year-end volatility' },
];

export function WebBotDrawdownAnalyzerPage() {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title="Phân tích Drawdown" subtitle="Drawdown Analyzer · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}
        >
          <StatCard
            icon={TrendingDown}
            label="Max Drawdown"
            value="-10.3%"
            color="#EF4444"
            sub="Jan 5, 2026"
          />
          <StatCard
            icon={Activity}
            label="Avg Drawdown"
            value="-5.1%"
            color="#F59E0B"
            sub="7 sự kiện"
          />
          <StatCard icon={Target} label="Avg Recovery" value="21 ngày" sub="Median: 23 ngày" />
        </div>
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 24 }}
        >
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Underwater Chart
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={UW_DATA}>
                <defs>
                  <linearGradient id="uwG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} />
                <YAxis
                  stroke={c.text3}
                  style={{ fontSize: 10 }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={tooltipS(c)}
                  formatter={(v: unknown) => [`${String(v)}%`, 'Underwater']}
                />
                <Area
                  type="monotone"
                  dataKey="underwater"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fill="url(#uwG)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 16 }}>
              Sự kiện Drawdown lớn
            </p>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {DD_EVENTS.map((ev, i) => (
                <div
                  key={i}
                  style={{ background: c.surface2, borderRadius: 12, padding: '14px 16px' }}
                >
                  <div className="flex justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                      {ev.period}
                    </span>
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm, fontWeight: 700 }}>
                      {ev.depth}%
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                      Recovery: {ev.recovery}
                    </span>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                      Trigger: {ev.trigger}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════
   8. WebBotEquityCurvePage
   ═══════════════════════════════════════════════════ */

const EQ_DATA = [
  { date: 'Sep', equity: 1000, buyHold: 1000 },
  { date: 'Oct', equity: 1087, buyHold: 1098 },
  { date: 'Nov', equity: 1189, buyHold: 1142 },
  { date: 'Dec', equity: 1298, buyHold: 1256 },
  { date: 'Jan', equity: 1423, buyHold: 1334 },
  { date: 'Feb', equity: 1567, buyHold: 1412 },
  { date: 'Mar', equity: 1745, buyHold: 1489 },
];

export function WebBotEquityCurvePage() {
  const c = useThemeColors();
  return (
    <PageLayout>
      <Header title="Equity Curve" subtitle="Đường vốn · Trading Bots" back />
      <div style={{ padding: '24px 0 40px' }}>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}
        >
          <StatCard icon={DollarSign} label="Vốn hiện tại" value="$1,745" color="#10B981" />
          <StatCard
            icon={TrendingUp}
            label="Tổng Return"
            value="+74.5%"
            color="#10B981"
            sub="vs Buy & Hold: +48.9%"
          />
          <StatCard
            icon={Award}
            label="Alpha"
            value="+25.6%"
            color="#3B82F6"
            sub="Vượt trội so với thị trường"
          />
          <StatCard icon={Activity} label="Rolling Sharpe" value="2.14" sub="30-day" />
        </div>
        <div
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 700, marginBottom: 20 }}>
            Bot vs Buy & Hold
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={EQ_DATA}>
              <XAxis dataKey="date" stroke={c.text3} style={{ fontSize: 10 }} tickLine={false} />
              <YAxis
                stroke={c.text3}
                style={{ fontSize: 10 }}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={tooltipS(c)}
                formatter={(v: unknown, name: string) => [`$${String(v)}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#10B981"
                strokeWidth={2.5}
                name="Bot"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="buyHold"
                stroke={c.text3}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                name="Buy & Hold"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageLayout>
  );
}
