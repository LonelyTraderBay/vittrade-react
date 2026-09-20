/**
 * ══════════════════════════════════════════════════════════════
 *  CopyNotificationsPage — Phase 1 Week 3: Notifications Feed
 * ══════════════════════════════════════════════════════════════
 * 
 * Purpose:
 * - Real-time notification feed for copy trading events
 * - Filter by type (trades/risk/updates/system)
 * - Mark read/unread
 * - Navigate to relevant detail pages
 * 
 * Compliance:
 * - Critical risk alerts must be prominent
 * - Trade notifications with P/L disclosure
 * - Provider update notifications
 * 
 * Guidelines:
 * - PageLayout + TabBar filter
 * - Empty state for no notifications
 * - Real-time badge counts
 * - Color-coded by severity
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Bell, TrendingUp, TrendingDown, AlertTriangle, Info,
  Settings, Activity, FileText, CheckCircle, Eye,
  Clock, DollarSign, Target, Zap, Users
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

type NotificationType = 'trade' | 'risk' | 'update' | 'system';
type FilterType = 'all' | 'unread' | NotificationType;

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  providerId?: string;
  providerName?: string;
  copyId?: string;
  actionUrl?: string;
  severity?: 'info' | 'warning' | 'critical';
  metadata?: {
    pnl?: number;
    pair?: string;
    side?: 'buy' | 'sell';
  };
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'risk',
    title: 'Cảnh báo rủi ro cao',
    message: 'Copy "CryptoKing" đang lỗ -8.5%, gần ngưỡng stop-loss -10%',
    timestamp: '5 phút trước',
    read: false,
    providerId: 'trader-1',
    providerName: 'CryptoKing',
    copyId: 'copy-1',
    actionUrl: '/trade/copy-trading/active',
    severity: 'critical',
  },
  {
    id: 'n2',
    type: 'trade',
    title: 'Lệnh mới được copy',
    message: 'CryptoKing đã BUY 0.05 BTC @ $67,800',
    timestamp: '15 phút trước',
    read: false,
    providerId: 'trader-1',
    providerName: 'CryptoKing',
    copyId: 'copy-1',
    severity: 'info',
    metadata: {
      pair: 'BTC/USDT',
      side: 'buy',
    },
  },
  {
    id: 'n3',
    type: 'trade',
    title: 'Chốt lời thành công',
    message: 'Lệnh ETH/USDT đã đóng với lợi nhuận +$45',
    timestamp: '1 giờ trước',
    read: false,
    providerId: 'trader-1',
    providerName: 'CryptoKing',
    copyId: 'copy-1',
    severity: 'info',
    metadata: {
      pnl: 45,
      pair: 'ETH/USDT',
      side: 'sell',
    },
  },
  {
    id: 'n4',
    type: 'update',
    title: 'Provider cập nhật chiến lược',
    message: 'SwingMaster đã thông báo: "Tăng tỷ trọng BTC lên 60% portfolio"',
    timestamp: '2 giờ trước',
    read: true,
    providerId: 'trader-2',
    providerName: 'SwingMaster',
    severity: 'warning',
  },
  {
    id: 'n5',
    type: 'system',
    title: 'Copy mới được kích hoạt',
    message: 'Copy "AlgoTrader" đã hết thời gian chờ 24h và được kích hoạt',
    timestamp: '3 giờ trước',
    read: true,
    providerId: 'trader-3',
    providerName: 'AlgoTrader',
    copyId: 'copy-3',
    severity: 'info',
  },
  {
    id: 'n6',
    type: 'risk',
    title: 'Đã đạt ngưỡng take-profit',
    message: 'Copy "CryptoKing" đã đạt +13%, bạn có muốn điều chỉnh take-profit?',
    timestamp: '5 giờ trước',
    read: true,
    providerId: 'trader-1',
    providerName: 'CryptoKing',
    copyId: 'copy-1',
    severity: 'warning',
  },
  {
    id: 'n7',
    type: 'system',
    title: 'Cập nhật hệ thống',
    message: 'Copy Trading hiện hỗ trợ Trailing Stop. Xem chi tiết tại Settings.',
    timestamp: '1 ngày trước',
    read: true,
    severity: 'info',
  },
];

export function CopyNotificationsPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const tradeCount = notifications.filter(n => n.type === 'trade' && !n.read).length;
  const riskCount = notifications.filter(n => n.type === 'risk' && !n.read).length;
  const updateCount = notifications.filter(n => n.type === 'update' && !n.read).length;
  const systemCount = notifications.filter(n => n.type === 'system' && !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(`${prefix}${notification.actionUrl}`);
    }
  };

  const getIcon = (type: NotificationType, severity?: string) => {
    if (severity === 'critical') return AlertTriangle;
    if (type === 'trade') return Activity;
    if (type === 'risk') return Target;
    if (type === 'update') return FileText;
    return Info;
  };

  const getColor = (type: NotificationType, severity?: string) => {
    if (severity === 'critical') return '#EF4444';
    if (severity === 'warning') return '#F59E0B';
    if (type === 'trade') return '#3B82F6';
    if (type === 'risk') return '#EF4444';
    if (type === 'update') return '#8B5CF6';
    return c.text3;
  };

  return (
    <PageLayout>
      <Header 
        title="Thông báo" 
        back
        action={{
          icon: Settings,
          onClick: () => navigate(`${prefix}/trade/copy-trading/settings`),
        }}
      />

      <PageContent gap="relaxed">
        {/* Unread Summary */}
        {unreadCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: c.primary + '15', border: `1px solid ${c.primary}` }}>
            <div className="flex items-center gap-2">
              <Bell size={16} color={c.primary} />
              <span style={{ color: c.primary, fontSize: 12, fontWeight: 600 }}>
                {unreadCount} thông báo chưa đọc
              </span>
            </div>
            <button
              onClick={markAllAsRead}
              style={{ color: c.primary, fontSize: 11, fontWeight: 600, textDecoration: 'underline' }}
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <TabBar
          variant="pill"
          tabs={[
            { id: 'all', label: 'Tất cả', badge: unreadCount || undefined },
            { id: 'unread', label: 'Chưa đọc', badge: unreadCount || undefined },
            { id: 'trade', label: 'Trades', badge: tradeCount || undefined },
            { id: 'risk', label: 'Rủi ro', badge: riskCount || undefined },
            { id: 'update', label: 'Cập nhật', badge: updateCount || undefined },
            { id: 'system', label: 'Hệ thống', badge: systemCount || undefined },
          ]}
          active={filter}
          onChange={(id) => setFilter(id as FilterType)}
        />

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{ background: c.surface2 }}
            >
              <Bell size={32} color={c.text3} />
            </div>
            <p style={{ color: c.text3, fontSize: 13, textAlign: 'center' }}>
              {filter === 'unread' 
                ? 'Không có thông báo chưa đọc'
                : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map(notification => {
              const Icon = getIcon(notification.type, notification.severity);
              const color = getColor(notification.type, notification.severity);
              
              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full p-4 rounded-2xl text-left transition-all"
                  style={{
                    background: notification.read ? c.surface : c.surface2,
                    border: `1px solid ${notification.read ? c.border : color}`,
                    opacity: notification.read ? 0.7 : 1,
                  }}
                >
                  <div className="flex gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: color + '22' }}
                    >
                      <Icon size={18} color={color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 style={{ 
                          color: c.text1, 
                          fontSize: 13, 
                          fontWeight: notification.read ? 600 : 700,
                          marginRight: 8,
                        }}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div 
                            className="w-2 h-2 rounded-full shrink-0 mt-1"
                            style={{ background: c.primary }}
                          />
                        )}
                      </div>

                      <p style={{ 
                        color: c.text2, 
                        fontSize: 11, 
                        lineHeight: 1.5,
                        marginBottom: 6,
                      }}>
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock size={10} color={c.text3} />
                          <span style={{ color: c.text3, fontSize: 10 }}>
                            {notification.timestamp}
                          </span>
                        </div>

                        {notification.providerName && (
                          <>
                            <span style={{ color: c.text3, fontSize: 10 }}>•</span>
                            <div className="flex items-center gap-1">
                              <Users size={10} color={c.text3} />
                              <span style={{ color: c.text3, fontSize: 10 }}>
                                {notification.providerName}
                              </span>
                            </div>
                          </>
                        )}

                        {notification.metadata?.pnl !== undefined && (
                          <>
                            <span style={{ color: c.text3, fontSize: 10 }}>•</span>
                            <span style={{ 
                              color: notification.metadata.pnl >= 0 ? '#10B981' : '#EF4444',
                              fontSize: 10,
                              fontWeight: 600,
                            }}>
                              {notification.metadata.pnl >= 0 ? '+' : ''}${notification.metadata.pnl}
                            </span>
                          </>
                        )}
                      </div>

                      {notification.metadata?.pair && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded" style={{ background: color + '15' }}>
                          <span style={{ color, fontSize: 10, fontWeight: 600 }}>
                            {notification.metadata.side?.toUpperCase()}
                          </span>
                          <span style={{ color, fontSize: 10 }}>
                            {notification.metadata.pair}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
