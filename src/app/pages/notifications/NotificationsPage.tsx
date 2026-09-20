import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, Trash2, Filter, BellOff } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { NOTIFICATIONS, Notification } from '../../data/mockData';
import { RefreshableSkeletonList } from '../../components/states/RefreshableSkeletonList';
import { EmptyState } from '../../components/states/EmptyState';
import { useHaptic } from '../../hooks/useHaptic';
import { useThemeColors } from '../../hooks/useThemeColors';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { useLoadingState } from '../../hooks/useLoadingState';
import { useActionToast } from '../../hooks/useActionToast';
import { TOAST } from '../../data/toastMessages';

const TYPE_COLORS: Record<Notification['type'], string> = {
  trade: '#10B981', deposit: '#3B82F6', withdraw: '#8B5CF6',
  security: '#EF4444', system: '#8B95B3', p2p: '#10B981', price_alert: '#F59E0B',
  referral: '#F59E0B', arena: '#8B5CF6',
};
const TYPE_LABELS: Record<Notification['type'], string> = {
  trade: 'Giao dịch', deposit: 'Nạp tiền', withdraw: 'Rút tiền',
  security: 'Bảo mật', system: 'Hệ thống', p2p: 'P2P', price_alert: 'Cảnh báo giá',
  referral: 'Giới thiệu', arena: 'Open Arena',
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { hapticSelection } = useHaptic();
  const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState();
  const actionToast = useActionToast();

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifs = filter === 'all' ? notifications : notifications.filter(n => !n.isRead);
  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    actionToast.success(TOAST.NOTIFICATION.READ_ALL);
  };
  const handleMarkRead = (id: string) => { setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n)); };
  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    actionToast.warning(TOAST.NOTIFICATION.DELETED);
  };
  const handleNotificationClick = (notif: Notification) => { if (!notif.isRead) handleMarkRead(notif.id); if (notif.actionUrl) navigate(notif.actionUrl); };

  return (
    <PageLayout>
      <Header title="Thông báo" subtitle="Thông báo · Hệ thống" back />

      <PageContent gap="default" padding="none">
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: c.surface, borderBottom: `1px solid ${c.divider}`, boxShadow: c.cardShadow }}>
          <div className="flex items-center gap-2">
            <Bell size={16} color="#3B82F6" />
            <span style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{unreadCount} chưa đọc</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setFilter(filter === 'all' ? 'unread' : 'all'); hapticSelection(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Filter size={14} color="#3B82F6" />
              <span style={{ color: '#3B82F6', fontSize: 12, fontWeight: 600 }}>{filter === 'all' ? 'Tất cả' : 'Chưa đọc'}</span>
            </button>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCheck size={14} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: 12, fontWeight: 600 }}>Đọc tất cả</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount}>
            <RefreshableSkeletonList
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              rows={6}
              isEmpty={filteredNotifs.length === 0}
              emptyState={
                <EmptyState icon={BellOff}
                  title={filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                  subtitle="Thông báo giao dịch, bảo mật và hệ thống sẽ hiển thị tại đây"
                  ctaLabel={filter === 'unread' ? 'Xem tất cả' : undefined}
                  onCta={filter === 'unread' ? () => setFilter('all') : undefined}
                />
              }
              lastRefreshedLabel={lastRefreshedLabel}
              refreshCount={refreshCount}
            >
              <div>
                {filteredNotifs.map((notif) => (
                  <div key={notif.id}
                    className="px-5 py-3 flex gap-3 relative active:opacity-70 market-row"
                    style={{
                      background: notif.isRead ? 'transparent' : 'rgba(59,130,246,0.03)',
                      cursor: notif.actionUrl ? 'pointer' : 'default',
                      borderBottom: `1px solid ${c.divider}`,
                    }}
                    onClick={() => handleNotificationClick(notif)}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1"
                      style={{ background: (notif.iconColor || TYPE_COLORS[notif.type]) + '22' }}>
                      <span style={{ fontSize: 18 }}>{notif.icon || '🔔'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-truncate" style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>{notif.title}</h3>
                        {!notif.isRead && (<div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: '#3B82F6' }} />)}
                      </div>
                      <p className="text-clamp-2" style={{ color: c.text2, fontSize: 13, lineHeight: 1.4, marginBottom: 6 }}>{notif.message}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ background: TYPE_COLORS[notif.type] + '22', color: TYPE_COLORS[notif.type] }}>
                          {TYPE_LABELS[notif.type]}
                        </span>
                        <span style={{ color: c.text3, fontSize: 11 }}>{notif.time}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 hover-ghost"
                      style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  </div>
                ))}
              </div>
            </RefreshableSkeletonList>

            {!isLoading && filteredNotifs.length > 0 && (
              <div className="flex items-center justify-center py-6 gap-2">
                <div className="w-8 h-px" style={{ background: c.borderSolid }} />
                <span style={{ color: c.text3, fontSize: 11 }}>{filteredNotifs.length} thông báo</span>
                <div className="w-8 h-px" style={{ background: c.borderSolid }} />
              </div>
            )}
          </PullToRefresh>
        </div>
      </PageContent>
    </PageLayout>
  );
}