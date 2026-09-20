import React, { useMemo } from 'react';
import {
  UserPlus, ShieldCheck, TrendingUp, Award, Gift, Send,
  Clock, UserCheck, AlertCircle, Phone, BarChart3,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useActionToast } from '../../hooks/useActionToast';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { fmtUsd } from '../../data/formatNumber';
import { φ, φSpace, φIcon } from '../../utils/golden';
import {
  getFriendById,
  getFriendCommissions,
  getFriendTimeline,
  getFriendChartData,
  getCurrentTier,
  getReferralStats,
  type FriendTimelineEvent,
} from '../../data/referralData';

/* ─── Status Config ─── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending_kyc: { label: 'Chờ KYC', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  kyc_done: { label: 'Đã KYC', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  active_trader: { label: 'Đang giao dịch', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  inactive: { label: 'Không hoạt động', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

/* ─── Timeline Icon Mapper ─── */
function TimelineIcon({ icon, size = 16, color }: { icon: FriendTimelineEvent['icon']; size?: number; color: string }) {
  const props = { size, color };
  switch (icon) {
    case 'user-plus': return <UserPlus {...props} />;
    case 'shield-check': return <ShieldCheck {...props} />;
    case 'trending-up': return <TrendingUp {...props} />;
    case 'award': return <Award {...props} />;
    case 'gift': return <Gift {...props} />;
    default: return <Clock {...props} />;
  }
}

export function ReferralFriendDetailPage() {
  const { friendId } = useParams<{ friendId: string }>();
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const { refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const friend = useMemo(() => getFriendById(friendId ?? ''), [friendId]);
  const timeline = useMemo(() => friend ? getFriendTimeline(friend) : [], [friend]);
  const commissions = useMemo(() => friend ? getFriendCommissions(friend.name) : [], [friend]);
  const chartData = useMemo(() => getFriendChartData(friendId ?? ''), [friendId]);
  const stats = getReferralStats();
  const { current: currentTier } = getCurrentTier(stats.totalFriends);

  const completedComm = commissions.filter(r => r.status === 'completed');
  const totalFromFriend = completedComm.reduce((s, r) => s + r.amount, 0);

  if (!friend) {
    return (
      <PageLayout>
        <Header title="Chi tiết bạn bè" subtitle="Bạn bè · Referral" back onBack={() => navigate(prefix + '/referral/history')} />
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <AlertCircle size={40} color={c.text3} style={{ opacity: 0.4, marginBottom: 12 }} />
          <p style={{ color: c.text2, fontSize: 16, fontWeight: 600, textAlign: 'center' }}>Không tìm thấy bạn bè</p>
          <p style={{ color: c.text3, fontSize: 13, textAlign: 'center', marginTop: 4 }}>ID không hợp lệ hoặc đã bị xóa</p>
          <button
            onClick={() => navigate(prefix + '/referral/history')}
            className="mt-5 px-6 rounded-xl flex items-center justify-center"
            style={{ minHeight: 44, background: c.chipActiveBg, color: c.chipActiveText, fontSize: 14, fontWeight: 600 }}
          >
            Quay lại danh sách
          </button>
        </div>
      </PageLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[friend.status];

  return (
    <PageLayout>
      <Header title="Chi tiết bạn bè" subtitle="Bạn bè · Referral" back onBack={() => navigate(prefix + '/referral/history')} />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
        <PageContent gap="default">
        {/* ── Profile Hero ── */}
        <motion.div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: c.portfolioBg, border: '1px solid ' + c.portfolioBorder, boxShadow: c.portfolioShadow }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
            style={{ background: 'radial-gradient(circle, ' + statusCfg.color + '18 0%, transparent 65%)' }} />

          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: statusCfg.bg, border: '2px solid ' + statusCfg.color + '44' }}>
              <span style={{ color: statusCfg.color, fontSize: φ.lg, fontWeight: 700 }}>{friend.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p style={{ color: c.portfolioTextDim, fontSize: 18, fontWeight: 700 }} className="truncate">{friend.name}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: φ.xs, fontWeight: 600 }}>
                {friend.status === 'active_trader' && <TrendingUp size={φ.xs} />}
                {friend.status === 'pending_kyc' && <Clock size={φ.xs} />}
                {friend.status === 'kyc_done' && <UserCheck size={φ.xs} />}
                {statusCfg.label}
              </span>
              {friend.phone && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Phone size={φ.xs} color={c.portfolioTextMuted} />
                  <span style={{ color: c.portfolioTextMuted, fontSize: φ.xs }}>{friend.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 relative z-10">
            {[
              { label: 'Hoa hồng', value: totalFromFriend > 0 ? '+' + fmtUsd(totalFromFriend) : '—', color: '#10B981' },
              { label: 'Khối lượng', value: friend.totalVolume > 0 ? '$' + friend.totalVolume.toLocaleString() : '—', color: '#3B82F6' },
              { label: 'Giao dịch', value: (friend.tradeCount ?? 0).toString(), color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-2.5 text-center"
                style={{ background: c.portfolioBtnGhost, border: '1px solid ' + c.portfolioBtnGhostBorder }}>
                <p style={{ color: s.color, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
                <p style={{ color: c.portfolioTextMuted, fontSize: φ.xs, marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Detail Stats */}
          <div className="grid grid-cols-3 gap-2 mt-2 relative z-10">
            {[
              { label: 'Tham gia', value: friend.joinedDate },
              { label: 'TB/lệnh', value: friend.avgTradeSize ? '$' + friend.avgTradeSize : '—' },
              { label: 'Hoạt động', value: friend.lastActiveDate ?? '—' },
            ].map(s => (
              <div key={s.label} className="text-center py-1.5">
                <p style={{ color: c.portfolioTextMuted, fontSize: 9 }}>{s.label}</p>
                <p style={{ color: c.portfolioTextDim, fontSize: φ.xs, fontWeight: 600, fontFamily: 'monospace' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CTA for pending KYC ── */}
        {friend.status === 'pending_kyc' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <button
              onClick={() => actionToast.success({ title: 'Đã gửi nhắc nhở', description: `Nhắc ${friend.name} hoàn tất KYC` })}
              className="w-full flex items-center justify-center gap-2 rounded-2xl"
              style={{
                minHeight: 48, background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                color: '#fff', fontSize: φ.body, fontWeight: 600,
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
              }}
            >
              <Send size={φ.base} />
              Nhắc hoàn tất KYC
            </button>
          </motion.div>
        )}

        {/* ── CTA for kyc_done (no trade yet) ── */}
        {friend.status === 'kyc_done' && (
          <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <Clock size={φ.base} color="#3B82F6" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
              {friend.name} đã hoàn tất KYC nhưng chưa giao dịch.
              Khi bạn bè bắt đầu trade, bạn sẽ nhận hoa hồng {currentTier.commission}% phí GD.
            </p>
          </div>
        )}

        {/* ── Commission Chart ── */}
        {friend.totalCommission > 0 && (
          <div>
            <SectionHeader title="Hoa hồng theo tháng" accent accentColor="#10B981"
              right={<span style={{ color: '#10B981', fontSize: φ.xs, fontWeight: 600 }}>+{fmtUsd(totalFromFriend)} tổng</span>} />
            <TrCard className="p-4">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData}>
                  <defs key="gradient-defs">
                    <linearGradient id="friendCommGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis key="fd-x" dataKey="month" tick={{ fill: c.text3, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    key="fd-tip"
                    contentStyle={{ background: c.surface2, border: '1px solid ' + c.borderSolid, borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [fmtUsd(v), 'Hoa hồng']}
                  />
                  <Area key="fd-area" type="monotone" dataKey="commission" stroke="#10B981" strokeWidth={2} fill="url(#friendCommGrad)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </TrCard>
          </div>
        )}

        {/* ── Activity Timeline ── */}
        <div>
          <SectionHeader title="Dòng thời gian" accent accentColor="#3B82F6" />
          <TrCard className="p-4">
            {timeline.length === 0 ? (
              <div className="py-6 text-center">
                <Clock size={28} color={c.text3} className="mx-auto mb-2" style={{ opacity: 0.4 }} />
                <p style={{ color: c.text3, fontSize: φ.sm }}>Chưa có hoạt động</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {timeline.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    className="flex gap-3"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                  >
                    {/* Timeline vertical line + dot */}
                    <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: event.color + '15', border: '1.5px solid ' + event.color + '33' }}>
                        <TimelineIcon icon={event.icon} size={φ.base} color={event.color} />
                      </div>
                      {idx < timeline.length - 1 && (
                        <div className="flex-1 w-0.5 my-1" style={{ background: c.divider, minHeight: 20 }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>{event.title}</p>
                        <span style={{ color: c.text3, fontSize: φ.xs, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{event.date}</span>
                      </div>
                      <p style={{ color: c.text3, fontSize: φ.xs, lineHeight: 1.4, marginTop: 2 }}>{event.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TrCard>
        </div>

        {/* ── Commission Records from this Friend ── */}
        {commissions.length > 0 && (
          <div>
            <SectionHeader
              title="Lịch sử hoa hồng"
              accent accentColor="#8B5CF6"
              right={<span style={{ color: c.text3, fontSize: φ.xs }}>{completedComm.length} giao dịch</span>}
            />
            <TrCard overflow>
              {commissions.slice(0, 8).map((record, i) => {
                const isPending = record.status === 'pending';
                return (
                  <div key={record.id} className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: i < Math.min(commissions.length, 8) - 1 ? '1px solid ' + c.divider : 'none',
                      opacity: isPending ? 0.6 : 1,
                    }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: record.type === 'kyc_bonus' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)' }}>
                      {record.type === 'kyc_bonus' ? <Gift size={φ.base} color="#8B5CF6" /> : <TrendingUp size={φ.base} color="#10B981" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }} className="truncate">{record.action}</p>
                      <p style={{ color: c.text3, fontSize: φ.xs }}>{record.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p style={{
                        color: isPending ? '#F59E0B' : (record.type === 'kyc_bonus' ? '#8B5CF6' : '#10B981'),
                        fontSize: φ.sm, fontWeight: 700, fontFamily: 'monospace',
                      }}>
                        {isPending ? '~' : '+'}{fmtUsd(record.amount)}
                      </p>
                      <p style={{ color: c.text3, fontSize: 9 }}>{record.currency}</p>
                    </div>
                  </div>
                );
              })}

              {commissions.length > 8 && (
                <button
                  onClick={() => navigate(prefix + '/referral/rewards')}
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-3"
                  style={{ borderTop: '1px solid ' + c.divider, minHeight: 44 }}
                >
                  <span style={{ color: c.primary, fontSize: φ.sm, fontWeight: 600 }}>Xem tất cả hoa hồng</span>
                  <ChevronRight size={φ.body} color={c.primary} />
                </button>
              )}
            </TrCard>
          </div>
        )}

        {/* ── Trading Summary for active friends ── */}
        {friend.status === 'active_trader' && (
          <div>
            <SectionHeader title="Thống kê giao dịch" accent accentColor="#F59E0B" />
            <div className="grid grid-cols-2 gap-3">
              <TrCard className="p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={φ.body} color="#3B82F6" />
                  <span style={{ color: c.text3, fontSize: φ.xs }}>Cặp GD nhiều nhất</span>
                </div>
                <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>{friend.topPair ?? '—'}</p>
              </TrCard>
              <TrCard className="p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={φ.body} color="#10B981" />
                  <span style={{ color: c.text3, fontSize: φ.xs }}>TB mỗi lệnh</span>
                </div>
                <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}>
                  ${friend.avgTradeSize ?? 0}
                </p>
              </TrCard>
            </div>
          </div>
        )}

        {/* ── Commission Rate Info ── */}
        <div>
          <TrCard className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Award size={φ.body} color={currentTier.color} />
              <p style={{ color: c.text2, fontSize: φ.sm, lineHeight: 1.5 }}>
                Bạn đang nhận <span style={{ color: '#10B981', fontWeight: 700 }}>{currentTier.commission}%</span> phí GD của {friend.name}.
                Hoa hồng cộng real-time vào ví USDT, không giới hạn thời gian.
              </p>
            </div>
          </TrCard>
        </div>
        </PageContent>
      </PullToRefresh>
    </PageLayout>
  );
}