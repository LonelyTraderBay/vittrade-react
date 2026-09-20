import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp, BarChart3, Clock, CheckCircle, XCircle,
  AlertTriangle, Star, ChevronRight, Users, Repeat, DollarSign,
  Shield, Award, ShoppingCart, ArrowUpRight, ArrowDownRight, Zap,
  Target, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { P2P_STATISTICS, P2P_USER_LEVEL, P2P_TRADING_LEVELS } from '../../data/mockData';
import { fmtVnd, fmtCompact, fmtAmount, fmtPct } from '../../data/formatNumber';
import { TrCard } from '../../components/ui/TrCard';
import { φ, φIcon } from '../../utils/golden';

/* ═══════════════════════════════════════════════════════════
   Stat Card (reusable)
   ═══════════════════════════════════════════════════════════ */
function StatCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string };
}) {
  const c = useThemeColors();
  return (
    <TrCard className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: color + '15' }}
        >
          <Icon size={16} color={color} />
        </div>
        {trend && (
          <div className="flex items-center gap-0.5">
            {trend.value >= 0
              ? <ArrowUpRight size={10} color="#10B981" />
              : <ArrowDownRight size={10} color="#EF4444" />}
            <span style={{
              color: trend.value >= 0 ? '#10B981' : '#EF4444',
              fontSize: 9, fontWeight: 700,
            }}>
              {trend.value >= 0 ? '+' : ''}{fmtPct(trend.value)}
            </span>
          </div>
        )}
      </div>
      <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
        {value}
      </p>
      <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>{label}</p>
      {sub && (
        <p style={{ color: c.text3, fontSize: 9, marginTop: 1 }}>{sub}</p>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   Custom Recharts Tooltip
   ═══════════════════════════════════════════════════════════ */
function CustomTooltip({ active, payload, label }: any) {
  const c = useThemeColors();
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: c.surface, border: `1px solid ${c.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
    >
      <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 10000 ? fmtCompact(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Status configs
   ═══════════════════════════════════════════════════════════ */
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_payment: { label: 'Chờ TT', color: '#F59E0B' },
  paid: { label: 'Đã TT', color: '#3B82F6' },
  released: { label: 'Hoàn tất', color: '#10B981' },
  cancelled: { label: 'Đã hủy', color: '#EF4444' },
  disputed: { label: 'Tranh chấp', color: '#EF4444' },
};

const ASSET_COLORS: Record<string, string> = {
  USDT: '#26A17B',
  BTC: '#F7931A',
  ETH: '#627EEA',
  BNB: '#F3BA2F',
  SOL: '#9945FF',
};

const TIME_FILTERS = [
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: 'all', label: 'Tất cả' },
] as const;

/* ═══════════════════════════════════════════════════════════
   P2P Dashboard Page
   ═══════════════════════════════════════════════════════════ */
export function P2PDashboardPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const prefix = useRoutePrefix();
  const stats = P2P_STATISTICS;
  const userLevel = P2P_USER_LEVEL;
  const currentLevel = P2P_TRADING_LEVELS.find(l => l.id === userLevel.currentLevel);
  const nextLevel = P2P_TRADING_LEVELS.find(l => l.id === userLevel.currentLevel + 1);

  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('30d');

  const volumeDisplay = timeFilter === '7d'
    ? stats.totalVolume7d
    : timeFilter === '30d'
      ? stats.totalVolume30d
      : stats.totalVolumeAll;

  const dailyPct = userLevel.dailyLimit > 0
    ? (userLevel.dailyUsed / userLevel.dailyLimit) * 100
    : 0;

  return (
    <PageLayout>
      <Header title="P2P Dashboard" subtitle="Tổng quan · P2P" back />

      <div className="flex-1 px-5 py-4 flex flex-col gap-4">

        {/* ───── Time Filter ───── */}
        <div className="flex gap-1.5">
          {TIME_FILTERS.map(tf => (
            <button
              key={tf.id}
              onClick={() => { setTimeFilter(tf.id as any); hapticSelection(); }}
              className="px-3 py-1.5 rounded-lg"
              style={{
                background: timeFilter === tf.id ? c.chipActiveBg : c.chipBg,
                color: timeFilter === tf.id ? c.chipActiveText : c.chipText,
                border: `1px solid ${timeFilter === tf.id ? c.chipActiveBorder : c.chipBorder}`,
                fontWeight: 600, fontSize: φ.xs,
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* ───── Hero Volume Card ───── */}
        <TrCard className="p-4" accentBorder="rgba(59,130,246,0.2)">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                <Activity size={16} color="#fff" />
              </div>
              <span style={{ color: c.text2, fontSize: φ.sm, fontWeight: 600 }}>
                Tổng Volume ({TIME_FILTERS.find(t => t.id === timeFilter)?.label})
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <ArrowUpRight size={12} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 700 }}>+12.5%</span>
            </div>
          </div>
          <p style={{ color: c.text1, fontSize: 28, fontWeight: 700, fontFamily: 'monospace', marginBottom: 4 }}>
            {fmtCompact(volumeDisplay, { prefix: '₫' })}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
              <span style={{ color: c.text3, fontSize: 9 }}>
                Mua: {fmtCompact(stats.buyVolume30d, { prefix: '₫' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
              <span style={{ color: c.text3, fontSize: 9 }}>
                Bán: {fmtCompact(stats.sellVolume30d, { prefix: '₫' })}
              </span>
            </div>
          </div>
        </TrCard>

        {/* ───── Key Metrics Grid ───── */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard
            label="Đơn hoàn thành"
            value={stats.completedOrders.toString()}
            sub={`/ ${stats.totalOrders} tổng`}
            icon={CheckCircle}
            color="#10B981"
            trend={{ value: 8.3, label: '30d' }}
          />
          <StatCard
            label="Tỷ lệ hoàn thành"
            value={`${stats.completionRate}%`}
            sub={`Platform: ${stats.platformAvgCompletionRate}%`}
            icon={Target}
            color={stats.completionRate >= stats.platformAvgCompletionRate ? '#10B981' : '#F59E0B'}
          />
          <StatCard
            label="Lợi nhuận Spread"
            value={fmtCompact(stats.spreadRevenue30d, { prefix: '₫' })}
            sub="30 ngày qua"
            icon={DollarSign}
            color="#F59E0B"
            trend={{ value: 15.2, label: '30d' }}
          />
          <StatCard
            label="TB Thời gian"
            value={stats.avgCompletionTime}
            sub={`Platform: ${stats.platformAvgResponseTime}`}
            icon={Clock}
            color="#3B82F6"
          />
        </div>

        {/* ───── Volume Chart ───── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} color={c.text2} />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Volume theo tuần</span>
            </div>
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.volumeByWeek} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs key="defs">
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  key="xaxis"
                  dataKey="week" axisLine={false} tickLine={false}
                  tick={{ fill: c.text3, fontSize: 9 }}
                />
                <YAxis key="yaxis" hide />
                <Tooltip key="tooltip" content={<CustomTooltip />} />
                <Area
                  key="area-volume"
                  type="monotone" dataKey="volume" name="Volume"
                  stroke="#3B82F6" strokeWidth={2} fill="url(#volumeGrad)"
                  dot={{ r: 3, fill: '#3B82F6', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TrCard>

        {/* ───── Orders by Month (Buy vs Sell) ───── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={14} color={c.text2} />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Đơn hàng theo tháng</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: '#10B981' }} />
                <span style={{ color: c.text3, fontSize: 9 }}>Mua</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm" style={{ background: '#EF4444' }} />
                <span style={{ color: c.text3, fontSize: 9 }}>Bán</span>
              </div>
            </div>
          </div>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ordersByMonth} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <XAxis
                  key="xaxis"
                  dataKey="month" axisLine={false} tickLine={false}
                  tick={{ fill: c.text3, fontSize: 9 }}
                />
                <YAxis key="yaxis" hide />
                <Tooltip key="tooltip" content={<CustomTooltip />} />
                <Bar key="bar-buy" dataKey="buy" name="Mua" fill="#10B981" radius={[3, 3, 0, 0]} barSize={12} isAnimationActive={false} />
                <Bar key="bar-sell" dataKey="sell" name="Bán" fill="#EF4444" radius={[3, 3, 0, 0]} barSize={12} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TrCard>

        {/* ───── Asset Distribution ───── */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} color={c.text2} />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Phân bổ tài sản</span>
          </div>
          <div className="flex items-center gap-4">
            <div style={{ width: 90, height: 90 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    key="pie-assets"
                    data={stats.assetDistribution}
                    dataKey="percentage"
                    nameKey="asset"
                    cx="50%" cy="50%"
                    innerRadius={28} outerRadius={42}
                    strokeWidth={0}
                    isAnimationActive={false}
                  >
                    {stats.assetDistribution.map(entry => (
                      <Cell key={entry.asset} fill={ASSET_COLORS[entry.asset] || '#6B7280'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {stats.assetDistribution.map(item => (
                <div key={item.asset} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: ASSET_COLORS[item.asset] || '#6B7280' }} />
                    <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>{item.asset}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>
                      {item.percentage}%
                    </span>
                    <span style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>
                      {fmtCompact(item.volume, { prefix: '₫' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TrCard>

        {/* ───── Level & Daily Limit ───── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award size={14} color={c.text2} />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Cấp & Hạn mức</span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: currentLevel?.gradient }}
            >
              <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>
                Lv.{userLevel.currentLevel} {currentLevel?.name}
              </span>
            </div>
          </div>

          {/* Daily Limit Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ color: c.text3, fontSize: φ.xs }}>Hạn mức hôm nay</span>
              <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>
                {fmtCompact(userLevel.dailyUsed)} / {userLevel.dailyLimit > 0 ? fmtCompact(userLevel.dailyLimit) : 'Không giới hạn'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(dailyPct, 100)}%`,
                  background: dailyPct > 80 ? '#EF4444' : dailyPct > 50 ? '#F59E0B' : '#10B981',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <p style={{ color: c.text3, fontSize: 9, marginTop: 4 }}>
              Còn lại: {fmtVnd(Math.max(0, userLevel.dailyLimit - userLevel.dailyUsed))} VND
            </p>
          </div>

          {/* Next Level Progress */}
          {nextLevel && (
            <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>
                  Lên Lv.{nextLevel.id} {nextLevel.name}
                </span>
                <span style={{ color: c.text3, fontSize: 9 }}>
                  {Math.round(userLevel.nextLevelProgress * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: c.surface3 || c.border }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${userLevel.nextLevelProgress * 100}%`,
                    background: nextLevel.gradient,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {nextLevel.requirements.map((req, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded" style={{ background: c.chipBg, color: c.text3, fontSize: 8 }}>
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
        </TrCard>

        {/* ───── Performance vs Platform ───── */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} color={c.text2} />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>So sánh với Platform</span>
          </div>
          <div className="flex flex-col gap-3">
            {[
              {
                label: 'Tỷ lệ hoàn thành',
                yours: stats.completionRate,
                platform: stats.platformAvgCompletionRate,
                suffix: '%',
              },
              {
                label: 'Phản hồi trung bình',
                yours: parseInt(stats.responseTimeAvg),
                platform: parseInt(stats.platformAvgResponseTime),
                suffix: ' phút',
                lowerBetter: true,
              },
              {
                label: 'Đánh giá nhận được',
                yours: stats.avgRatingReceived,
                platform: 4.3,
                suffix: '/5.0',
              },
              {
                label: 'Tỷ lệ review tích cực',
                yours: stats.positiveReviewRate,
                platform: 91.0,
                suffix: '%',
              },
            ].map(metric => {
              const isBetter = metric.lowerBetter
                ? metric.yours < metric.platform
                : metric.yours > metric.platform;
              return (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: c.text2, fontSize: φ.xs }}>{metric.label}</span>
                    <div className="flex items-center gap-2">
                      <span style={{
                        color: isBetter ? '#10B981' : '#F59E0B',
                        fontSize: φ.xs, fontWeight: 700, fontFamily: 'monospace',
                      }}>
                        {metric.yours}{metric.suffix}
                      </span>
                      <span style={{ color: c.text3, fontSize: 9 }}>
                        vs {metric.platform}{metric.suffix}
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                    <div
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{
                        width: `${Math.min(metric.yours, 100)}%`,
                        background: isBetter ? '#10B981' : '#F59E0B',
                        transition: 'width 0.5s ease',
                      }}
                    />
                    {/* Platform average marker */}
                    <div
                      className="absolute top-0 h-full"
                      style={{
                        left: `${Math.min(metric.platform, 100)}%`,
                        width: 2,
                        background: c.text3,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>

        {/* ───── Additional Stats ───── */}
        <div className="grid grid-cols-3 gap-2">
          <TrCard className="p-3 flex flex-col items-center">
            <Users size={16} color="#8B5CF6" />
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginTop: 4, fontFamily: 'monospace' }}>
              {stats.uniqueCounterparties}
            </p>
            <p style={{ color: c.text3, fontSize: 8, textAlign: 'center' }}>Đối tác</p>
          </TrCard>
          <TrCard className="p-3 flex flex-col items-center">
            <Repeat size={16} color="#F59E0B" />
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginTop: 4, fontFamily: 'monospace' }}>
              {stats.repeatCustomerRate}%
            </p>
            <p style={{ color: c.text3, fontSize: 8, textAlign: 'center' }}>Quay lại</p>
          </TrCard>
          <TrCard className="p-3 flex flex-col items-center">
            <DollarSign size={16} color="#10B981" />
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, marginTop: 4, fontFamily: 'monospace' }}>
              {fmtCompact(stats.avgOrderSize)}
            </p>
            <p style={{ color: c.text3, fontSize: 8, textAlign: 'center' }}>TB đơn hàng</p>
          </TrCard>
        </div>

        {/* ───── Order Breakdown ───── */}
        <TrCard className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={14} color={c.text2} />
            <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Phân tích đơn hàng</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Hoàn thành', count: stats.completedOrders, total: stats.totalOrders, color: '#10B981', icon: CheckCircle },
              { label: 'Đã hủy', count: stats.cancelledOrders, total: stats.totalOrders, color: '#EF4444', icon: XCircle },
              { label: 'Tranh chấp', count: stats.disputedOrders, total: stats.totalOrders, color: '#F59E0B', icon: AlertTriangle },
            ].map(item => {
              const pct = (item.count / item.total) * 100;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <item.icon size={14} color={item.color} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: c.text2, fontSize: φ.xs }}>{item.label}</span>
                      <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>
                        {item.count} ({fmtPct(pct)})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: item.color, transition: 'width 0.5s ease' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>

        {/* ───── Top Merchants ───── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star size={14} color={c.text2} />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Top Merchants</span>
            </div>
            <span style={{ color: c.text3, fontSize: 9 }}>30 ngày qua</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {stats.topMerchants.map((m, i) => (
              <button
                key={m.id}
                onClick={() => { navigate(`${prefix}/p2p/merchant/${m.id}`); hapticSelection(); }}
                className="flex items-center gap-3 w-full text-left"
              >
                <div className="flex items-center justify-center w-6"
                  style={{ color: i < 3 ? ['#F59E0B', '#9CA3AF', '#CD7F32'][i] : c.text3, fontSize: φ.sm, fontWeight: 700 }}>
                  #{i + 1}
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: i === 0 ? 'linear-gradient(135deg, #F59E0B, #FBBF24)' : 'linear-gradient(135deg, #3B82F6, #60A5FA)' }}
                >
                  <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{m.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="truncate block" style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>{m.name}</span>
                  <span style={{ color: c.text3, fontSize: 9 }}>{m.trades} đơn · {fmtCompact(m.volume, { prefix: '₫' })}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Star size={9} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ color: c.text2, fontSize: φ.xs, fontWeight: 600 }}>{m.rating}</span>
                </div>
                <ChevronRight size={12} color={c.text3} />
              </button>
            ))}
          </div>
        </TrCard>

        {/* ───── Recent Activity ───── */}
        <TrCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={14} color={c.text2} />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>Hoạt động gần đây</span>
            </div>
            <button
              onClick={() => { navigate(`${prefix}/p2p/my-orders`); hapticSelection(); }}
              className="flex items-center gap-1"
            >
              <span style={{ color: '#3B82F6', fontSize: φ.xs, fontWeight: 600 }}>Xem tất cả</span>
              <ChevronRight size={12} color="#3B82F6" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {stats.recentActivity.map((act, i) => {
              const statusInfo = STATUS_MAP[act.status] || { label: act.status, color: c.text3 };
              return (
                <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < stats.recentActivity.length - 1 ? `1px solid ${c.divider}` : 'none' }}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: act.type === 'buy' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}
                  >
                    {act.type === 'buy'
                      ? <ArrowDownRight size={14} color="#10B981" />
                      : <ArrowUpRight size={14} color="#EF4444" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600 }}>
                        {act.type === 'buy' ? 'Mua' : 'Bán'} {fmtAmount(act.amount)} {act.asset}
                      </span>
                    </div>
                    <span style={{ color: c.text3, fontSize: 9 }}>
                      {act.merchant} · {act.date}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ color: c.text1, fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>
                      {fmtCompact(act.total, { prefix: '₫' })}
                    </p>
                    <span
                      className="px-1.5 py-0.5 rounded"
                      style={{ background: statusInfo.color + '15', color: statusInfo.color, fontSize: 8, fontWeight: 600 }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </TrCard>

        {/* ───── Quick Navigation ───── */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Đơn hàng', icon: ShoppingCart, color: '#3B82F6', path: `${prefix}/p2p/my-orders` },
            { label: 'Đánh giá', icon: Star, color: '#F59E0B', path: `${prefix}/p2p/reviews` },
            { label: 'Quảng cáo', icon: BarChart3, color: '#8B5CF6', path: `${prefix}/p2p/my-ads` },
            { label: 'Express', icon: Zap, color: '#10B981', path: `${prefix}/p2p/express` },
          ].map(item => (
            <TrCard
              key={item.label}
              as="button"
              hover
              onClick={() => { navigate(item.path); hapticSelection(); }}
              className="p-3 flex items-center gap-3 w-full text-left"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.color + '15' }}
              >
                <item.icon size={16} color={item.color} />
              </div>
              <div className="flex-1">
                <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{item.label}</span>
              </div>
              <ChevronRight size={14} color={c.text3} />
            </TrCard>
          ))}
        </div>

      </div>
    </PageLayout>
  );
}