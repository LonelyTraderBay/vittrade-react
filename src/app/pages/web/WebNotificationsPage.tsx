/**
 * ══════════════════════════════════════════════════════════
 *  WEB NOTIFICATIONS PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/notifications
 *
 *  Notification Center — All app notifications
 *
 *  Sections:
 *  - Unread count & filters
 *  - Category filters (Trading, P2P, Predictions, Arena, System, Security)
 *  - Notifications list with type icons and timestamps
 *  - Mark as read/unread, delete actions
 *  - Empty state
 *
 *  Design:
 *  - 2-column layout: Left sidebar (filters) + Right main content (notifications)
 *  - Enterprise tokens: WEB_FONT, WEB_SPACING, WEB_ICON (canonical)
 *  - Card-based UI with hover states
 *  - Type-specific color coding
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell,
  CheckCheck,
  Trash2,
  Filter,
  BellOff,
  TrendingUp,
  DollarSign,
  Shield,
  Settings,
  Users,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Award,
  Zap,
  ChevronRight,
  Clock,
  Check,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';
import { NOTIFICATIONS, Notification } from '../../data/mockData';

/* ═══════════════════════════════════════════════════════════
   TYPE METADATA
   ═══════════════════════════════════════════════════════════ */

const TYPE_COLORS: Record<Notification['type'], string> = {
  trade: '#10B981',
  deposit: '#3B82F6',
  withdraw: '#8B5CF6',
  security: '#EF4444',
  system: '#8B95B3',
  p2p: '#10B981',
  price_alert: '#F59E0B',
  referral: '#F59E0B',
  arena: '#8B5CF6',
};

const TYPE_LABELS: Record<Notification['type'], string> = {
  trade: 'Giao dịch',
  deposit: 'Nạp tiền',
  withdraw: 'Rút tiền',
  security: 'Bảo mật',
  system: 'Hệ thống',
  p2p: 'P2P',
  price_alert: 'Cảnh báo giá',
  referral: 'Giới thiệu',
  arena: 'Open Arena',
};

const TYPE_ICONS: Record<Notification['type'], any> = {
  trade: TrendingUp,
  deposit: ArrowDownCircle,
  withdraw: ArrowUpCircle,
  security: Shield,
  system: Settings,
  p2p: Users,
  price_alert: AlertCircle,
  referral: Award,
  arena: Zap,
};

const NOTIFICATION_CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: Bell },
  { id: 'trade', label: 'Giao dịch', icon: TrendingUp },
  { id: 'p2p', label: 'P2P', icon: Users },
  { id: 'security', label: 'Bảo mật', icon: Shield },
  { id: 'system', label: 'Hệ thống', icon: Settings },
  { id: 'arena', label: 'Arena', icon: Zap },
  { id: 'price_alert', label: 'Cảnh báo', icon: AlertCircle },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebNotificationsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterUnread, setFilterUnread] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((notif) => {
    const matchesCategory = selectedCategory === 'all' || notif.type === selectedCategory;
    const matchesReadFilter = !filterUnread || !notif.isRead;
    return matchesCategory && matchesReadFilter;
  });

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleToggleRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) handleMarkRead(notif.id);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return notifications.length;
    return notifications.filter((n) => n.type === categoryId).length;
  };

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Thông báo"
        subtitle={unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
        back
        right={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setFilterUnread(!filterUnread)}
              style={{
                height: WEB_BUTTON.md,
                padding: `0 16px`,
                borderRadius: 8,
                border: `1px solid ${filterUnread ? c.primary : c.border}`,
                backgroundColor: filterUnread ? `${c.primary}15` : c.surface,
                color: filterUnread ? c.primary : c.text1,
                fontSize: WEB_FONT.base,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!filterUnread) {
                  e.currentTarget.style.backgroundColor = c.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!filterUnread) {
                  e.currentTarget.style.backgroundColor = c.surface;
                }
              }}
            >
              <Filter size={WEB_ICON.md} />
              {filterUnread ? 'Chưa đọc' : 'Tất cả'}
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  height: WEB_BUTTON.md,
                  padding: `0 16px`,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: c.primary,
                  color: '#FFFFFF',
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = c.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = c.primary;
                }}
              >
                <CheckCheck size={WEB_ICON.md} />
                Đọc tất cả
              </button>
            )}
          </div>
        }
      />

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT — 2 COLUMN LAYOUT
          ═══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '24px 32px',
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {/* ═══════════════════════════════════════════════════════════
              LEFT SIDEBAR — CATEGORY FILTERS
              ═══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Categories */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: '12px',
                }}
              >
                Danh mục
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {NOTIFICATION_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const count = getCategoryCount(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor:
                          selectedCategory === category.id ? `${c.primary}15` : 'transparent',
                        color: selectedCategory === category.id ? c.primary : c.text1,
                        fontSize: WEB_FONT.base,
                        fontWeight: selectedCategory === category.id ? 500 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== category.id) {
                          e.currentTarget.style.backgroundColor = c.surfaceHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== category.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={WEB_ICON.md} />
                        <span>{category.label}</span>
                      </div>
                      <span
                        style={{
                          fontSize: WEB_FONT.xs,
                          color: c.text2,
                          fontWeight: 500,
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Card */}
            <div
              style={{
                backgroundColor: c.surface,
                borderRadius: '12px',
                padding: 20,
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  fontSize: WEB_FONT.base,
                  fontWeight: 600,
                  color: c.text1,
                  marginBottom: '12px',
                }}
              >
                Cài đặt
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => navigate('/settings/notifications')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: c.text1,
                    fontSize: WEB_FONT.base,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = c.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Settings size={WEB_ICON.sm} style={{ color: c.text2 }} />
                  Tùy chỉnh thông báo
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              RIGHT MAIN CONTENT — NOTIFICATIONS LIST
              ═══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Notifications List */}
            {filteredNotifications.length > 0 ? (
              <div
                style={{
                  backgroundColor: c.surface,
                  borderRadius: '12px',
                  border: `1px solid ${c.border}`,
                  overflow: 'hidden',
                }}
              >
                {filteredNotifications.map((notif, index) => {
                  const Icon = TYPE_ICONS[notif.type];
                  const typeColor = TYPE_COLORS[notif.type];

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        padding: 20,
                        borderBottom:
                          index < filteredNotifications.length - 1
                            ? `1px solid ${c.border}`
                            : 'none',
                        backgroundColor: notif.isRead ? c.surface : `${c.primary}05`,
                        cursor: notif.actionUrl ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        display: 'flex',
                        gap: '16px',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (notif.actionUrl) {
                          e.currentTarget.style.backgroundColor = c.surfaceHover;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notif.isRead
                          ? c.surface
                          : `${c.primary}05`;
                      }}
                    >
                      {/* Unread Indicator */}
                      {!notif.isRead && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            backgroundColor: c.primary,
                            borderTopLeftRadius: '12px',
                            borderBottomLeftRadius:
                              index === filteredNotifications.length - 1 ? '12px' : '0',
                          }}
                        />
                      )}

                      {/* Icon */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          backgroundColor: `${typeColor}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={WEB_ICON.lg} style={{ color: typeColor }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Header */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <span
                              style={{
                                fontSize: WEB_FONT.xs,
                                color: typeColor,
                                fontWeight: 600,
                              }}
                            >
                              {TYPE_LABELS[notif.type]}
                            </span>
                            <span
                              style={{
                                fontSize: WEB_FONT.xs,
                                color: c.text2,
                                marginLeft: '8px',
                              }}
                            >
                              {notif.time}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <div
                          style={{
                            fontSize: WEB_FONT.base,
                            fontWeight: 600,
                            color: c.text1,
                            marginBottom: '4px',
                          }}
                        >
                          {notif.title}
                        </div>

                        {/* Message */}
                        <div
                          style={{
                            fontSize: WEB_FONT.base,
                            color: c.text2,
                            lineHeight: '1.5',
                          }}
                        >
                          {notif.message}
                        </div>

                        {/* Action Link */}
                        {notif.actionUrl && (
                          <div
                            style={{
                              fontSize: WEB_FONT.sm,
                              color: c.primary,
                              fontWeight: 500,
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            Xem chi tiết
                            <ChevronRight size={14} />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          alignItems: 'flex-start',
                          flexShrink: 0,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRead(notif.id);
                          }}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: `1px solid ${c.border}`,
                            backgroundColor: c.surface,
                            color: c.text2,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = c.surfaceHover;
                            e.currentTarget.style.borderColor = c.primary;
                            e.currentTarget.style.color = c.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = c.surface;
                            e.currentTarget.style.borderColor = c.border;
                            e.currentTarget.style.color = c.text2;
                          }}
                          title={notif.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                        >
                          {notif.isRead ? <Bell size={16} /> : <Check size={16} />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif.id);
                          }}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            border: `1px solid ${c.border}`,
                            backgroundColor: c.surface,
                            color: c.text2,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEF2F2';
                            e.currentTarget.style.borderColor = '#EF4444';
                            e.currentTarget.style.color = '#EF4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = c.surface;
                            e.currentTarget.style.borderColor = c.border;
                            e.currentTarget.style.color = c.text2;
                          }}
                          title="Xóa thông báo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div
                style={{
                  backgroundColor: c.surface,
                  borderRadius: '12px',
                  padding: '60px 20px',
                  border: `1px solid ${c.border}`,
                  textAlign: 'center',
                }}
              >
                <BellOff size={48} style={{ color: c.text2, margin: '0 auto 16px' }} />
                <div
                  style={{
                    fontSize: WEB_FONT.base,
                    fontWeight: 500,
                    color: c.text1,
                    marginBottom: '8px',
                  }}
                >
                  Không có thông báo
                </div>
                <div style={{ fontSize: WEB_FONT.sm, color: c.text2 }}>
                  {filterUnread ? 'Tất cả thông báo đã được đọc' : 'Chưa có thông báo nào'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
