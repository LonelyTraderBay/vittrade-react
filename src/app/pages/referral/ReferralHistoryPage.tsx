import React, { useState } from 'react';
import {
  UserCheck, Clock, TrendingUp, AlertCircle,
  ChevronRight, Search, ArrowDownUp, Bell, Send,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { TrCard } from '../../components/ui/TrCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { fmtUsd } from '../../data/formatNumber';
import { φ, φRadius, φSpace, φIcon } from '../../utils/golden';
import {
  REFERRAL_FRIENDS,
  getReferralStats,
  getCurrentTier,
  type ReferralFriend,
} from '../../data/referralData';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof UserCheck }> = {
  pending_kyc: { label: 'Chờ KYC', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  kyc_done: { label: 'Đã KYC', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: UserCheck },
  active_trader: { label: 'Đang giao dịch', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: TrendingUp },
  inactive: { label: 'Không hoạt động', color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', icon: AlertCircle },
};

/* ═══════════════════════════════════════════════════════════
   SPACING CONSTANTS — 8pt rhythm (Guidelines §2.3)
   ═══════════════════════════════════════════════════════════
   Notification zone internal:  8px  (φSpace[3])
   Section gap (PageContent):  16px  (gap="default")
   Card internal padding:      16px  (p-4)
   Sub-item gap:                8px  (gap-2)
   ═══════════════════════════════════════════════════════════ */

const S = {
  /** Gap inside notification zone */
  notifyGap: φSpace[3],    // 8px
  /** Card inner padding */
  cardPad: 16,
  /** Sub-item gap */
  itemGap: φSpace[3],      // 8px
} as const;

type FilterType = 'all' | 'pending_kyc' | 'kyc_done' | 'active_trader';
type SortType = 'date' | 'commission' | 'volume';

export function ReferralHistoryPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const actionToast = useActionToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const { refresh, lastRefreshedLabel, refreshCount } = useLoadingState({ initialDelay: 400 });

  const stats = getReferralStats();
  const { current: currentTier } = getCurrentTier(stats.totalFriends);

  const sortFn = (a: ReferralFriend, b: ReferralFriend) => {
    if (sortBy === 'commission') return b.totalCommission - a.totalCommission;
    if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
    return 0; // date = default order
  };

  const filteredFriends = REFERRAL_FRIENDS
    .filter(f => filter === 'all' || f.status === filter)
    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort(sortFn);

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'Tất cả', count: REFERRAL_FRIENDS.length },
    { id: 'active_trader', label: 'Đang GD', count: REFERRAL_FRIENDS.filter(f => f.status === 'active_trader').length },
    { id: 'kyc_done', label: 'Đã KYC', count: REFERRAL_FRIENDS.filter(f => f.status === 'kyc_done').length },
    { id: 'pending_kyc', label: 'Chờ KYC', count: REFERRAL_FRIENDS.filter(f => f.status === 'pending_kyc').length },
  ];

  const sortOptions: { id: SortType; label: string }[] = [
    { id: 'date', label: 'Ngày tham gia' },
    { id: 'commission', label: 'Hoa hồng' },
    { id: 'volume', label: 'Khối lượng' },
  ];

  const handleRemindKyc = (friendName: string) => {
    actionToast.success('Đã gửi nhắc nhở KYC cho ' + friendName);
  };

  return (
    <PageLayout>
      <Header title="Lịch sử giới thiệu" subtitle="Lịch sử · Referral" back onBack={() => navigate(prefix + '/referral')} />

      <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="pb-8">
        <PageContent gap="default">
        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Tổng bạn bè', value: stats.totalFriends.toString(), color: '#3B82F6' },
            { label: 'Đã KYC', value: stats.kycCompleted.toString(), color: '#10B981' },
            { label: 'Hoạt động', value: stats.activeFriends.toString(), color: '#8B5CF6' },
          ].map(s => (
            <TrCard key={s.label} className="p-3 text-center">
              <p style={{ color: s.color, fontSize: φ.md, fontWeight: 700, fontFamily: 'monospace' }}>{s.value}</p>
              <p style={{ color: c.text3, fontSize: φ.xs, marginTop: 2 }}>{s.label}</p>
            </TrCard>
          ))}
        </div>

        {/* ─── Search ─── */}
        <div>
          <div className="flex items-center gap-2 rounded-2xl px-4"
            style={{ background: c.searchBg, border: `1px solid ${c.searchBorder}`, height: 44 }}>
            <Search size={φIcon.sm} color={c.searchPlaceholder} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm bạn bè..."
              className="flex-1 bg-transparent outline-none"
              style={{ color: c.text1, fontSize: φ.body }}
            />
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="flex gap-2 -mx-5 px-5 overflow-x-auto no-scrollbar">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="shrink-0 px-3.5 flex items-center justify-center"
              style={{
                borderRadius: φRadius.sm,
                background: filter === f.id ? c.chipActiveBg : c.chipBg,
                border: `1px solid ${filter === f.id ? c.chipActiveBorder : c.chipBorder}`,
                color: filter === f.id ? c.chipActiveText : c.chipText,
                fontSize: φ.sm,
                fontWeight: filter === f.id ? 600 : 400,
                minHeight: 44,
              }}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* ─── Sort ─── */}
        <div className="flex items-center gap-2">
          <ArrowDownUp size={φIcon.sm} color={c.text3} />
          <span style={{ color: c.text3, fontSize: φ.xs }}>Sắp xếp:</span>
          {sortOptions.map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)}
              className="px-2.5 rounded-lg flex items-center justify-center"
              style={{
                minHeight: 28,
                background: sortBy === s.id ? c.chipActiveBg : 'transparent',
                color: sortBy === s.id ? c.chipActiveText : c.text3,
                fontSize: φ.xs,
                fontWeight: sortBy === s.id ? 600 : 400,
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ─── Friends List ─── */}
        <div>
          {filteredFriends.length === 0 ? (
            <TrCard className="p-8 text-center">
              <Search size={32} color={c.text3} className="mx-auto mb-3" style={{ opacity: 0.5 }} />
              <p style={{ color: c.text2, fontSize: φ.body, fontWeight: 600 }}>Không tìm thấy</p>
              <p style={{ color: c.text3, fontSize: φ.sm, marginTop: 4 }}>Thử thay đổi bộ lọc hoặc từ khóa</p>
            </TrCard>
          ) : (
            <div className="flex flex-col" style={{ gap: S.itemGap }}>
              {filteredFriends.map(friend => {
                const statusCfg = STATUS_CONFIG[friend.status];
                return (
                  <TrCard key={friend.id} className="p-4 text-left w-full" as="button" onClick={() => navigate(prefix + '/referral/friend/' + friend.id)}>
                    <div className="flex items-center gap-3 mb-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}` }}>
                        <span style={{ color: c.text2, fontSize: φ.base, fontWeight: 700 }}>{friend.avatar}</span>
                      </div>
                      {/* Name + Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p style={{ color: c.text1, fontSize: φ.body, fontWeight: 600 }} className="truncate">{friend.name}</p>
                          <span className="shrink-0 px-2 py-0.5 rounded-full"
                            style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: φ.xs, fontWeight: 600 }}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>Tham gia: {friend.joinedDate}</p>
                      </div>
                      {/* Commission */}
                      <div className="text-right shrink-0">
                        <p style={{ color: friend.totalCommission > 0 ? '#10B981' : c.text3, fontSize: φ.body, fontWeight: 700, fontFamily: 'monospace' }}>
                          {friend.totalCommission > 0 ? `+${fmtUsd(friend.totalCommission)}` : '—'}
                        </p>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>Hoa hồng</p>
                      </div>
                    </div>

                    {/* Detail stats */}
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-xl p-2.5" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>KYC</p>
                        <div className="flex items-center gap-1 mt-1">
                          {friend.kycCompleted ? (
                            <div className="contents">
                              <UserCheck size={12} color="#10B981" />
                              <span style={{ color: '#10B981', fontSize: φ.sm, fontWeight: 600 }}>Hoàn tất</span>
                            </div>
                          ) : (
                            <div className="contents">
                              <Clock size={12} color="#F59E0B" />
                              <span style={{ color: '#F59E0B', fontSize: φ.sm, fontWeight: 600 }}>Đang chờ</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 rounded-xl p-2.5" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>Khối lượng GD</p>
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, fontFamily: 'monospace', marginTop: 2 }}>
                          {friend.totalVolume > 0 ? fmtUsd(friend.totalVolume) : '—'}
                        </p>
                      </div>
                      <div className="flex-1 rounded-xl p-2.5" style={{ background: c.surface2 }}>
                        <p style={{ color: c.text3, fontSize: φ.xs }}>GD đầu tiên</p>
                        <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600, marginTop: 2 }}>
                          {friend.firstTradeDate ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* Remind KYC action for pending friends */}
                    {friend.status === 'pending_kyc' && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); handleRemindKyc(friend.name); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleRemindKyc(friend.name); } }}
                        className="flex items-center justify-center gap-2 w-full mt-3 rounded-xl cursor-pointer"
                        style={{
                          minHeight: 44,
                          background: 'rgba(59,130,246,0.08)',
                          border: '1px solid rgba(59,130,246,0.15)',
                          color: '#3B82F6',
                          fontSize: φ.sm,
                          fontWeight: 600,
                        }}
                      >
                        <Send size={φ.body} />
                        Nhắc hoàn tất KYC
                      </div>
                    )}
                  </TrCard>
                );
              })}
            </div>
          )}
        </div>
        </PageContent>
      </PullToRefresh>
    </PageLayout>
  );
}