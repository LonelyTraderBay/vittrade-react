import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import {
  UserX, Search, X, Shield, AlertTriangle, ChevronRight,
  Plus, Clock, CheckCircle, Ban,
  MessageSquare, Info, UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { φ } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { SearchBar } from '../../components/ui/SearchBar';
import { CTAButton } from '../../components/ui/CTAButton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import {
  P2P_BLACKLIST, P2PBlacklistEntry,
  P2P_BLACKLIST_REASON_LABELS, P2P_BLACKLIST_REASON_COLORS,
} from '../../data/mockData';

type ReasonFilter = P2PBlacklistEntry['reason'] | 'all';

const REASON_ICONS: Record<P2PBlacklistEntry['reason'], React.ElementType> = {
  scam: AlertTriangle, unresponsive: Clock, fake_payment: Ban,
  harassment: MessageSquare, other: Info,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Hôm nay';
  if (days === 1) return '1 ngày trước';
  if (days < 30) return `${days} ngày trước`;
  if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
}

export function P2PBlacklistPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticError } = useHaptic();
  const prefix = useRoutePrefix();

  const [entries, setEntries] = useState<P2PBlacklistEntry[]>(P2P_BLACKLIST);
  const [searchText, setSearchText] = useState('');
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<P2PBlacklistEntry | null>(null);

  const filtered = useMemo(() => {
    let list = entries;
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(e => e.username.toLowerCase().includes(q));
    }
    if (reasonFilter !== 'all') list = list.filter(e => e.reason === reasonFilter);
    return list.sort((a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime());
  }, [entries, searchText, reasonFilter]);

  const stats = useMemo(() => {
    const byReason: Record<string, number> = {};
    entries.forEach(e => { byReason[e.reason] = (byReason[e.reason] || 0) + 1; });
    const recent30d = entries.filter(e => Date.now() - new Date(e.blockedAt).getTime() < 30 * 86_400_000).length;
    return { total: entries.length, recent30d, byReason };
  }, [entries]);

  const handleUnblock = () => {
    if (!unblockTarget) return;
    setEntries(prev => prev.filter(e => e.id !== unblockTarget.id));
    setUnblockTarget(null);
    if (expandedId === unblockTarget.id) setExpandedId(null);
    hapticError();
  };

  return (
    <PageLayout>
      <Header title="Danh sách chặn" subtitle="An toàn · P2P" back right={
        <button
          onClick={() => { navigate(`${prefix}/p2p/blacklist/add`); hapticSelection(); }}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(239,68,68,0.1)' }}>
          <UserPlus size={16} color="#EF4444" />
        </button>
      } />

      {/* Stats Overview */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <TrCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              <UserX size={18} color="#EF4444" />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>{stats.total} người dùng</p>
              <p style={{ color: c.text3, fontSize: 10 }}>{stats.recent30d} chặn trong 30 ngày qua</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(stats.byReason) as [P2PBlacklistEntry['reason'], number][]).map(([reason, count]) => {
              const ReasonIcon = REASON_ICONS[reason];
              const color = P2P_BLACKLIST_REASON_COLORS[reason];
              return (
                <div key={reason} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ background: color + '0D' }}>
                  <ReasonIcon size={10} color={color} />
                  <span style={{ color, fontSize: 10, fontWeight: 600 }}>{P2P_BLACKLIST_REASON_LABELS[reason]}</span>
                  <span className="px-1 rounded" style={{ background: color + '1A', color, fontSize: 9, fontWeight: 700 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </TrCard>
      </motion.div>

      {/* Search & Filter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <SearchBar
          value={searchText}
          onChange={setSearchText}
          placeholder="Tìm người dùng đã chặn..."
          variant="compact"
          className="mb-3"
        />
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => { setReasonFilter('all'); hapticSelection(); }}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: reasonFilter === 'all' ? c.chipActiveBg : c.chipBg, color: reasonFilter === 'all' ? c.chipActiveText : c.chipText, border: `1px solid ${reasonFilter === 'all' ? c.chipActiveBorder : c.chipBorder}`, fontWeight: 700 }}>
            Tất cả ({entries.length})
          </button>
          {(Object.keys(P2P_BLACKLIST_REASON_LABELS) as P2PBlacklistEntry['reason'][]).map(reason => {
            const color = P2P_BLACKLIST_REASON_COLORS[reason];
            const count = stats.byReason[reason] || 0;
            if (count === 0) return null;
            return (
              <button key={reason} onClick={() => { setReasonFilter(reason); hapticSelection(); }}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs"
                style={{ background: reasonFilter === reason ? color + '18' : c.chipBg, color: reasonFilter === reason ? color : c.chipText, border: `1px solid ${reasonFilter === reason ? color + '40' : c.chipBorder}`, fontWeight: 700 }}>
                {P2P_BLACKLIST_REASON_LABELS[reason]} ({count})
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Blocked Users List */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-12">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: c.surface2 }}>
            <Shield size={28} color={c.text3} />
          </div>
          <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 700 }}>
            {searchText ? 'Không tìm thấy kết quả' : 'Danh sách trống'}
          </p>
          <p style={{ color: c.text3, fontSize: 11, textAlign: 'center', maxWidth: 240 }}>
            {searchText ? `Không có người dùng nào khớp "${searchText}"` : 'Bạn chưa chặn người dùng nào.'}
          </p>
          {!searchText && (
            <CTAButton onClick={() => navigate(`${prefix}/p2p/blacklist/add`)} variant="danger" fullWidth={false}>
              <div className="flex items-center gap-1.5 px-4"><Plus size={14} /> Thêm vào blacklist</div>
            </CTAButton>
          )}
        </motion.div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p style={{ color: c.text3, fontSize: 10, fontWeight: 600 }}>{filtered.length} kết quả</p>
          {filtered.map((entry, i) => {
            const isExpanded = expandedId === entry.id;
            const ReasonIcon = REASON_ICONS[entry.reason];
            const reasonColor = P2P_BLACKLIST_REASON_COLORS[entry.reason];
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 + i * 0.04 }}>
                <TrCard className="overflow-hidden" accentBorder={isExpanded ? reasonColor + '30' : undefined}>
                  <button onClick={() => { setExpandedId(isExpanded ? null : entry.id); hapticSelection(); }} className="w-full flex items-center gap-3 p-3.5">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
                        <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 700 }}>{entry.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: reasonColor, border: `2px solid ${c.surface}` }}>
                        <ReasonIcon size={7} color="#fff" />
                      </div>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="truncate" style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{entry.username}</span>
                        {entry.isVerified && <Shield size={10} color="#3B82F6" fill="rgba(59,130,246,0.2)" />}
                        {entry.badge && (
                          <span className="px-1.5 py-px rounded" style={{
                            background: entry.badge === 'elite' ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)',
                            color: entry.badge === 'elite' ? '#F59E0B' : '#8B5CF6', fontSize: 8, fontWeight: 700,
                          }}>{entry.badge === 'elite' ? 'Elite' : 'Pro'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded" style={{ background: reasonColor + '14', color: reasonColor, fontSize: 9, fontWeight: 700 }}>
                          {P2P_BLACKLIST_REASON_LABELS[entry.reason]}
                        </span>
                        <span style={{ color: c.text3, fontSize: 9 }}>{timeAgo(entry.blockedAt)}</span>
                      </div>
                    </div>
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight size={14} color={c.text3} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-3.5 pb-3.5" style={{ borderTop: `1px solid ${c.divider}` }}>
                          {entry.reasonText && (
                            <div className="mt-3 rounded-xl p-3" style={{ background: reasonColor + '08' }}>
                              <div className="flex items-start gap-2">
                                <ReasonIcon size={12} color={reasonColor} className="shrink-0 mt-0.5" />
                                <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.6 }}>{entry.reasonText}</p>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
                              <p style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{entry.tradesBefore}</p>
                              <p style={{ color: c.text3, fontSize: 8 }}>Đơn trước chặn</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
                              <p style={{ color: entry.completionRate < 50 ? '#EF4444' : entry.completionRate < 80 ? '#F59E0B' : '#10B981', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{entry.completionRate}%</p>
                              <p style={{ color: c.text3, fontSize: 8 }}>Tỷ lệ HT</p>
                            </div>
                            <div className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
                              <p style={{ color: c.text2, fontSize: 10, fontWeight: 600 }}>{new Date(entry.blockedAt).toLocaleDateString('vi')}</p>
                              <p style={{ color: c.text3, fontSize: 8 }}>Ngày chặn</p>
                            </div>
                          </div>
                          {entry.orderId && (
                            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-xl"
                              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                              <Info size={11} color="#3B82F6" />
                              <span style={{ color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>Đơn liên quan: {entry.orderId}</span>
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => { setUnblockTarget(entry); hapticSelection(); }}
                              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                              <CheckCircle size={12} color="#10B981" />
                              <span style={{ color: '#10B981', fontSize: 11, fontWeight: 700 }}>Bỏ chặn</span>
                            </button>
                            <button onClick={() => hapticSelection()}
                              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
                              style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}>
                              <AlertTriangle size={12} color="#F59E0B" />
                              <span style={{ color: c.text2, fontSize: 11, fontWeight: 700 }}>Báo cáo</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </TrCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info Note */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="rounded-2xl p-3" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <div className="flex items-start gap-2">
            <Shield size={12} color="#3B82F6" className="shrink-0 mt-0.5" />
            <div>
              <p style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Về danh sách chặn</p>
              <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.6 }}>
                Người dùng bị chặn sẽ không thể tạo đơn với bạn, gửi tin nhắn, hoặc xem quảng cáo của bạn.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Unblock Confirmation */}
      <ConfirmationDialog
        open={!!unblockTarget}
        onClose={() => setUnblockTarget(null)}
        onConfirm={handleUnblock}
        variant="success"
        icon={<CheckCircle size={24} color="#10B981" />}
        title="Bỏ chặn người dùng?"
        description={unblockTarget ? (
          <span>Bạn có chắc muốn bỏ chặn <span style={{ fontWeight: 700 }}>"{unblockTarget.username}"</span>?</span>
        ) : ''}
        confirmText="Bỏ chặn"
      />
    </PageLayout>
  );
}