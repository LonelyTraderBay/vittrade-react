import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import {
  Eye, MousePointerClick, ShoppingCart, CheckCircle, XCircle,
  AlertTriangle, TrendingUp, Clock, Star, Trophy, Zap,
  BarChart3, Activity, CreditCard, Users,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, Legend,
} from 'recharts';
import { motion } from 'motion/react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { useThemeColors } from '../../hooks/useThemeColors';
import { P2P_AD_ANALYTICS, P2P_MY_ADS } from '../../data/mockData';
import { fmtVnd, fmtCompact } from '../../data/formatNumber';
import { φ } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';

/* ═══════════════════════════════════════════════════════════
   Helper — Funnel Metric Card
   ═══════════════════════════════════════════════════════════ */
function MetricCard({
  icon: Icon, label, value, sub, color, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  color: string; delay?: number;
}) {
  const c = useThemeColors();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
    >
      <TrCard className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: color + '14' }}
          >
            <Icon size={13} color={color} />
          </div>
          <span style={{ color: c.text3, fontSize: 10 }}>{label}</span>
        </div>
        <p style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
          {value}
        </p>
        {sub && (
          <p style={{ color: c.text3, fontSize: 9, marginTop: 2 }}>{sub}</p>
        )}
      </TrCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Hourly Heatmap Grid
   ═══════════════════════════════════════════════════════════ */
function HourlyHeatmap({ data, maxOrders }: { data: { hour: number; orders: number }[]; maxOrders: number }) {
  const c = useThemeColors();
  return (
    <div className="grid grid-cols-12 gap-1">
      {data.map(d => {
        const intensity = maxOrders > 0 ? d.orders / maxOrders : 0;
        return (
          <div key={d.hour} className="flex flex-col items-center gap-0.5">
            <div
              className="w-full aspect-square rounded-sm"
              style={{
                background: intensity > 0
                  ? `rgba(16,185,129,${0.1 + intensity * 0.7})`
                  : c.surface2,
                minHeight: 16,
              }}
              title={`${d.hour}:00 — ${d.orders} đơn`}
            />
            {d.hour % 3 === 0 && (
              <span style={{ color: c.text3, fontSize: 7 }}>{d.hour}h</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Order Funnel Bar
   ═══════════════════════════════════════════════════════════ */
function FunnelBar({ stages }: { stages: { label: string; value: number; color: string; pct: number }[] }) {
  const c = useThemeColors();
  return (
    <div className="flex flex-col gap-2">
      {stages.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: c.text2, fontSize: 10 }}>{s.label}</span>
            <div className="flex items-center gap-2">
              <span style={{ color: c.text1, fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>
                {s.value.toLocaleString()}
              </span>
              {i > 0 && (
                <span style={{ color: s.color, fontSize: 9, fontWeight: 600 }}>
                  {s.pct.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${s.pct}%` }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: s.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   P2P Ad Analytics Page
   ═══════════════════════════════════════════════════════════ */
export function P2PAdAnalyticsPage() {
  const c = useThemeColors();
  const { adId } = useParams();

  const analytics = P2P_AD_ANALYTICS[adId || 'myad001'] || P2P_AD_ANALYTICS.myad001;
  const ad = P2P_MY_ADS.find(a => a.id === (adId || 'myad001'));

  const maxHourlyOrders = useMemo(
    () => Math.max(...analytics.hourlyHeatmap.map(h => h.orders)),
    [analytics],
  );

  const funnelStages = useMemo(() => {
    const base = analytics.impressions;
    return [
      { label: 'Lượt xem', value: analytics.impressions, color: '#3B82F6', pct: 100 },
      { label: 'Lượt click', value: analytics.clicks, color: '#8B5CF6', pct: (analytics.clicks / base) * 100 },
      { label: 'Đơn tạo', value: analytics.ordersCreated, color: '#F59E0B', pct: (analytics.ordersCreated / base) * 100 },
      { label: 'Hoàn thành', value: analytics.ordersCompleted, color: '#10B981', pct: (analytics.ordersCompleted / base) * 100 },
    ];
  }, [analytics]);

  const radarData = useMemo(() => {
    return analytics.competitorComparison.map(item => {
      const maxVal = Math.max(item.yours, item.avg, item.top);
      const normalize = (v: number) => maxVal > 0 ? (v / maxVal) * 100 : 0;
      // For response time, lower is better — invert
      const isInverse = item.metric.includes('Phản hồi');
      return {
        metric: item.metric,
        yours: isInverse ? normalize(maxVal - item.yours + 1) : normalize(item.yours),
        avg: isInverse ? normalize(maxVal - item.avg + 1) : normalize(item.avg),
        top: isInverse ? normalize(maxVal - item.top + 1) : normalize(item.top),
      };
    });
  }, [analytics]);

  const totalPaymentVolume = analytics.paymentBreakdown.reduce((s, p) => s + p.volume, 0);

  return (
    <PageLayout>
      <Header
        title="Phân tích quảng cáo"
        subtitle="Phân tích · P2P"
        back
      />

      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Ad Identity Header */}
        {ad && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TrCard className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs"
                    style={{
                      background: ad.type === 'sell' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                      color: ad.type === 'sell' ? '#EF4444' : '#10B981',
                      fontWeight: 700,
                    }}
                  >
                    {ad.type === 'sell' ? 'BÁN' : 'MUA'} {ad.asset}
                  </span>
                  <span style={{ color: c.text1, fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>
                    {fmtVnd(ad.price)}
                  </span>
                  <span style={{ color: c.text3, fontSize: φ.xs }}>{ad.currency}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <Trophy size={11} color="#F59E0B" />
                  <span style={{ color: '#F59E0B', fontSize: 10, fontWeight: 700 }}>
                    #{analytics.ranking}/{analytics.totalActiveAds}
                  </span>
                </div>
              </div>
            </TrCard>
          </motion.div>
        )}

        {/* ═══ KPI Grid ═══ */}
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            icon={Eye} label="Lượt xem" color="#3B82F6"
            value={analytics.impressions.toLocaleString()}
            sub="7 ngày qua" delay={0.05}
          />
          <MetricCard
            icon={MousePointerClick} label="Lượt click" color="#8B5CF6"
            value={analytics.clicks.toLocaleString()}
            sub={`CTR ${((analytics.clicks / analytics.impressions) * 100).toFixed(1)}%`}
            delay={0.1}
          />
          <MetricCard
            icon={ShoppingCart} label="Đơn tạo" color="#F59E0B"
            value={analytics.ordersCreated.toLocaleString()}
            sub={`CVR ${analytics.conversionRate.toFixed(1)}%`}
            delay={0.15}
          />
          <MetricCard
            icon={CheckCircle} label="Hoàn thành" color="#10B981"
            value={analytics.ordersCompleted.toLocaleString()}
            sub={`${analytics.completionRate}% tỷ lệ HT`}
            delay={0.2}
          />
          <MetricCard
            icon={TrendingUp} label="Tổng volume" color="#3B82F6"
            value={fmtCompact(analytics.totalVolume, { prefix: '₫' })}
            sub={`TB ${fmtCompact(analytics.avgOrderValue, { prefix: '₫' })}/đơn`}
            delay={0.25}
          />
          <MetricCard
            icon={Zap} label="Doanh thu" color="#10B981"
            value={fmtCompact(analytics.totalRevenue, { prefix: '₫' })}
            sub="phí + spread" delay={0.3}
          />
        </div>

        {/* ═══ Quick Stats Row ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <TrCard className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Clock, label: 'Phản hồi', value: `${analytics.avgResponseTime}s`, color: '#3B82F6' },
                { icon: Activity, label: 'HT TB', value: `${analytics.avgCompletionTime}m`, color: '#10B981' },
                { icon: Star, label: 'Rating', value: `${analytics.rating}`, color: '#F59E0B' },
                { icon: Users, label: 'Reviews', value: `${analytics.reviewsCount}`, color: '#8B5CF6' },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center gap-1 py-1">
                  <s.icon size={13} color={s.color} />
                  <span style={{ color: c.text1, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                    {s.value}
                  </span>
                  <span style={{ color: c.text3, fontSize: 8 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ Conversion Funnel ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} color="#3B82F6" />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Phễu chuyển đổi
              </span>
            </div>
            <FunnelBar stages={funnelStages} />
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${c.divider}` }}>
              <div className="flex items-center gap-2">
                <XCircle size={11} color="#EF4444" />
                <span style={{ color: c.text3, fontSize: 10 }}>
                  Hủy: {analytics.ordersCancelled}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={11} color="#F59E0B" />
                <span style={{ color: c.text3, fontSize: 10 }}>
                  Tranh chấp: {analytics.ordersDisputed}
                </span>
              </div>
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ Daily Performance Chart ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} color="#10B981" />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Hiệu suất 7 ngày
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 9, marginBottom: 12 }}>
              Lượt xem & Đơn hàng theo ngày
            </p>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.dailyPerformance}>
                  <defs key="gradient-defs">
                    <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid key="aa-grid" strokeDasharray="3 3" stroke={c.divider} />
                  <XAxis key="aa-x" dataKey="date" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} />
                  <YAxis key="aa-yl" yAxisId="left" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} />
                  <YAxis key="aa-yr" yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    key="aa-tip"
                    contentStyle={{
                      background: c.surface, border: `1px solid ${c.borderSolid}`,
                      borderRadius: 12, fontSize: 10, color: c.text1, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    }}
                    labelStyle={{ color: c.text2, fontWeight: 600 }}
                  />
                  <Area key="aa-impressions" yAxisId="left" type="monotone" dataKey="impressions" name="Lượt xem"
                    stroke="#3B82F6" strokeWidth={2} fill="url(#gradImpressions)" isAnimationActive={false} />
                  <Area key="aa-orders" yAxisId="right" type="monotone" dataKey="orders" name="Đơn hàng"
                    stroke="#10B981" strokeWidth={2} fill="url(#gradOrders)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3B82F6' }} />
                <span style={{ color: c.text3, fontSize: 9 }}>Lượt xem</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10B981' }} />
                <span style={{ color: c.text3, fontSize: 9 }}>Đơn hàng</span>
              </div>
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ Volume Chart ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} color="#8B5CF6" />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Volume giao dịch
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 9, marginBottom: 12 }}>Tổng giá trị giao dịch theo ngày (VND)</p>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailyPerformance}>
                  <CartesianGrid key="av-grid" strokeDasharray="3 3" stroke={c.divider} />
                  <XAxis key="av-x" dataKey="date" tick={{ fontSize: 9, fill: c.text3 }} axisLine={false} tickLine={false} />
                  <YAxis
                    key="av-y"
                    tick={{ fontSize: 9, fill: c.text3 }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v: number) => fmtCompact(v)}
                  />
                  <Tooltip
                    key="av-tip"
                    contentStyle={{
                      background: c.surface, border: `1px solid ${c.borderSolid}`,
                      borderRadius: 12, fontSize: 10, color: c.text1,
                    }}
                    formatter={(value: number) => [fmtVnd(value), 'Volume']}
                  />
                  <Bar key="av-bar" dataKey="volume" name="Volume" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={24} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ Hourly Heatmap ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} color="#10B981" />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Heatmap theo giờ
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 9, marginBottom: 12 }}>
              Số đơn hàng phân bố theo giờ trong ngày (0-23h)
            </p>
            <HourlyHeatmap data={analytics.hourlyHeatmap} maxOrders={maxHourlyOrders} />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(16,185,129,0.1)' }} />
                <span style={{ color: c.text3, fontSize: 8 }}>Ít</span>
              </div>
              <div className="flex items-center gap-1">
                {[0.2, 0.4, 0.6, 0.8].map(o => (
                  <div key={o} className="w-3 h-3 rounded-sm" style={{ background: `rgba(16,185,129,${0.1 + o * 0.7})` }} />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(16,185,129,0.8)' }} />
                <span style={{ color: c.text3, fontSize: 8 }}>Nhiều</span>
              </div>
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ Payment Breakdown ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={14} color="#F59E0B" />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Thanh toán phân bổ
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {analytics.paymentBreakdown.map((p, i) => {
                const pct = totalPaymentVolume > 0 ? (p.volume / totalPaymentVolume) * 100 : 0;
                const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];
                const barColor = colors[i % colors.length];
                return (
                  <div key={p.method}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{p.method}</span>
                      <div className="flex items-center gap-3">
                        <span style={{ color: c.text3, fontSize: 10 }}>{p.count} đơn</span>
                        <span style={{ color: c.text1, fontSize: 10, fontWeight: 600, fontFamily: 'monospace' }}>
                          {fmtCompact(p.volume, { prefix: '₫' })}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.surface2 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ Competitor Comparison Radar ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} color="#F59E0B" />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                So sánh đối thủ
              </span>
            </div>
            <p style={{ color: c.text3, fontSize: 9, marginBottom: 8 }}>
              So với trung bình thị trường & top merchant
            </p>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid key="rc-grid" stroke={c.divider} />
                  <PolarAngleAxis key="rc-angle" dataKey="metric" tick={{ fontSize: 9, fill: c.text2 }} />
                  <Radar key="rc-yours" name="Bạn" dataKey="yours" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} strokeWidth={2} isAnimationActive={false} />
                  <Radar key="rc-avg" name="TB thị trường" dataKey="avg" stroke="#6B7280" fill="#6B7280" fillOpacity={0.08} strokeWidth={1} strokeDasharray="4 4" isAnimationActive={false} />
                  <Radar key="rc-top" name="Top" dataKey="top" stroke="#10B981" fill="#10B981" fillOpacity={0.08} strokeWidth={1} strokeDasharray="2 2" isAnimationActive={false} />
                  <Legend key="rc-legend" wrapperStyle={{ fontSize: 9 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Raw comparison table */}
            <div
              className="rounded-xl overflow-hidden mt-3"
              style={{ border: `1px solid ${c.divider}` }}
            >
              <div className="grid grid-cols-4 px-3 py-2" style={{ background: c.surface2 }}>
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 600 }}>Chỉ số</span>
                <span className="text-center" style={{ color: '#3B82F6', fontSize: 9, fontWeight: 600 }}>Bạn</span>
                <span className="text-center" style={{ color: c.text3, fontSize: 9, fontWeight: 600 }}>TB</span>
                <span className="text-center" style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>Top</span>
              </div>
              {analytics.competitorComparison.map((row, i) => (
                <div
                  key={row.metric}
                  className="grid grid-cols-4 px-3 py-2"
                  style={{ borderTop: `1px solid ${c.divider}` }}
                >
                  <span style={{ color: c.text2, fontSize: 9 }}>{row.metric}</span>
                  <span className="text-center" style={{
                    color: c.text1, fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
                  }}>
                    {row.metric === 'Giá' ? fmtCompact(row.yours) : row.yours}
                  </span>
                  <span className="text-center" style={{ color: c.text3, fontSize: 9, fontFamily: 'monospace' }}>
                    {row.metric === 'Giá' ? fmtCompact(row.avg) : row.avg}
                  </span>
                  <span className="text-center" style={{ color: '#10B981', fontSize: 9, fontFamily: 'monospace' }}>
                    {row.metric === 'Giá' ? fmtCompact(row.top) : row.top}
                  </span>
                </div>
              ))}
            </div>
          </TrCard>
        </motion.div>

        {/* ═══ Insights / Tips ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <TrCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} color="#F59E0B" />
              <span style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
                Gợi ý tối ưu
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                {
                  color: '#10B981',
                  text: 'Tỷ lệ hoàn thành tốt! Duy trì phản hồi nhanh để giữ vị trí top 3.',
                  icon: CheckCircle,
                },
                {
                  color: '#3B82F6',
                  text: `Giờ cao điểm 9h-11h & 20h-21h. Đảm bảo online trong khung giờ này.`,
                  icon: Clock,
                },
                {
                  color: '#F59E0B',
                  text: analytics.conversionRate < 15
                    ? 'CVR hơi thấp. Thử giảm giá 0.1% hoặc thêm payment methods.'
                    : 'CVR tốt! Xem xét tăng available amount để đón thêm đơn.',
                  icon: TrendingUp,
                },
              ].map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: tip.color + '08', border: `1px solid ${tip.color}18` }}
                >
                  <tip.icon size={12} color={tip.color} className="shrink-0 mt-0.5" />
                  <span style={{ color: c.text2, fontSize: 10, lineHeight: 1.6 }}>{tip.text}</span>
                </div>
              ))}
            </div>
          </TrCard>
        </motion.div>
      </div>
    </PageLayout>
  );
}