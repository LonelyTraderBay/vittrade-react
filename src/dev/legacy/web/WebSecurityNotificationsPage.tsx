import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Bell,
  BellRing,
  BellOff,
  Mail,
  Smartphone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Wallet,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Info,
  Globe,
  Monitor,
  Download,
  Upload,
  Zap,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING } from '@/shared/theme/webTokens';
import { PageLayout } from '@/shared/ui/layout/PageLayout';

/**
 * WebSecurityNotificationsPage — Security notification preferences
 *
 * Route: /w/profile/security/notifications
 *
 * Features:
 *   - Master toggle (all security alerts on/off)
 *   - Category-based notification config:
 *     • Login alerts (new device, new location, failed attempts)
 *     • Withdrawal alerts (initiated, confirmed, whitelist changes)
 *     • API key alerts (created, used, permissions changed)
 *     • Account alerts (password change, 2FA changes, session)
 *   - Per-channel toggle (Email / Push / SMS)
 *   - Quiet hours configuration
 *   - Recent security notification log
 *
 * Guidelines:
 *   - §14.1: Security Center features
 *   - §1: Trust-first — user must feel in control of alerts
 *   - §6: No dark patterns — no hiding critical alerts behind toggles
 */

/* ═══ Types ═══ */
type Channel = 'email' | 'push' | 'sms';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  channels: Record<Channel, boolean>;
  critical?: boolean; // Can't be fully disabled
}

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  items: NotificationItem[];
}

interface RecentAlert {
  id: string;
  title: string;
  detail: string;
  channel: Channel;
  time: string;
  read: boolean;
}

/* ═══ Mock data ═══ */
const initialCategories: NotificationCategory[] = [
  {
    id: 'login',
    title: 'Đăng nhập & Phiên',
    description: 'Thông báo khi có hoạt động đăng nhập mới',
    icon: LogIn,
    color: '#3B82F6',
    items: [
      {
        id: 'new-device',
        title: 'Đăng nhập từ thiết bị mới',
        description: 'Nhận cảnh báo khi tài khoản được truy cập từ thiết bị chưa từng sử dụng',
        icon: Monitor,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'new-location',
        title: 'Đăng nhập từ vị trí mới',
        description: 'Cảnh báo khi phát hiện đăng nhập từ quốc gia hoặc thành phố mới',
        icon: Globe,
        channels: { email: true, push: true, sms: false },
        critical: true,
      },
      {
        id: 'failed-login',
        title: 'Đăng nhập thất bại',
        description: 'Thông báo sau 3 lần nhập sai mật khẩu liên tiếp',
        icon: ShieldAlert,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'session-expired',
        title: 'Phiên hết hạn',
        description: 'Thông báo khi phiên đăng nhập bị kết thúc do không hoạt động',
        icon: LogOut,
        channels: { email: false, push: true, sms: false },
      },
      {
        id: 'new-ip',
        title: 'Đăng nhập từ IP mới',
        description: 'Cảnh báo khi đăng nhập từ địa chỉ IP chưa từng sử dụng',
        icon: Globe,
        channels: { email: true, push: false, sms: false },
      },
    ],
  },
  {
    id: 'withdrawal',
    title: 'Rút tiền & Chuyển khoản',
    description: 'Thông báo về hoạt động rút và chuyển tài sản',
    icon: Wallet,
    color: '#F59E0B',
    items: [
      {
        id: 'withdraw-initiated',
        title: 'Lệnh rút được tạo',
        description: 'Xác nhận mỗi khi có lệnh rút tiền mới',
        icon: Upload,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'withdraw-confirmed',
        title: 'Rút tiền hoàn tất',
        description: 'Thông báo khi lệnh rút được xác nhận trên blockchain',
        icon: CheckCircle,
        channels: { email: true, push: true, sms: false },
      },
      {
        id: 'large-withdrawal',
        title: 'Rút số lượng lớn',
        description: 'Cảnh báo đặc biệt khi rút trên ngưỡng $5,000',
        icon: AlertTriangle,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'whitelist-change',
        title: 'Thay đổi whitelist',
        description: 'Thông báo khi thêm, xóa hoặc thay đổi địa chỉ whitelist',
        icon: Shield,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'deposit-received',
        title: 'Nhận tiền nạp',
        description: 'Thông báo khi có tài sản được nạp vào tài khoản',
        icon: Download,
        channels: { email: true, push: true, sms: false },
      },
    ],
  },
  {
    id: 'api',
    title: 'API Key & Tích hợp',
    description: 'Hoạt động liên quan đến API keys và kết nối bên thứ ba',
    icon: Key,
    color: '#8B5CF6',
    items: [
      {
        id: 'api-created',
        title: 'API key mới được tạo',
        description: 'Thông báo khi có API key mới được sinh ra',
        icon: Key,
        channels: { email: true, push: true, sms: false },
        critical: true,
      },
      {
        id: 'api-permission',
        title: 'Thay đổi quyền API',
        description: 'Cảnh báo khi quyền của API key bị thay đổi',
        icon: ShieldCheck,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'api-usage',
        title: 'Hoạt động API bất thường',
        description: 'Phát hiện tần suất gọi API cao bất thường hoặc IP lạ',
        icon: Zap,
        channels: { email: true, push: true, sms: false },
      },
      {
        id: 'api-deleted',
        title: 'API key bị xóa',
        description: 'Xác nhận khi API key bị thu hồi',
        icon: AlertTriangle,
        channels: { email: true, push: false, sms: false },
      },
    ],
  },
  {
    id: 'account',
    title: 'Tài khoản & Bảo mật',
    description: 'Thay đổi cài đặt bảo mật và thông tin tài khoản',
    icon: Lock,
    color: '#10B981',
    items: [
      {
        id: 'password-change',
        title: 'Đổi mật khẩu',
        description: 'Xác nhận khi mật khẩu đăng nhập được thay đổi',
        icon: Lock,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: '2fa-change',
        title: 'Thay đổi 2FA',
        description: 'Cảnh báo khi bật/tắt hoặc thay đổi phương thức xác thực 2 bước',
        icon: Shield,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'email-change',
        title: 'Thay đổi email',
        description: 'Xác nhận qua email cũ khi yêu cầu đổi email liên kết',
        icon: Mail,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'phone-change',
        title: 'Thay đổi số điện thoại',
        description: 'Xác nhận qua SMS cũ khi yêu cầu đổi số điện thoại',
        icon: Smartphone,
        channels: { email: true, push: true, sms: true },
        critical: true,
      },
      {
        id: 'anti-phishing-change',
        title: 'Thay đổi mã anti-phishing',
        description: 'Thông báo khi mã chống giả mạo được cập nhật',
        icon: ShieldAlert,
        channels: { email: true, push: false, sms: false },
      },
    ],
  },
];

const RECENT_ALERTS: RecentAlert[] = [
  {
    id: 'r1',
    title: 'Đăng nhập từ thiết bị mới',
    detail: 'Chrome trên MacBook Pro — Hà Nội, VN',
    channel: 'push',
    time: '5 phút trước',
    read: false,
  },
  {
    id: 'r2',
    title: 'Rút 0.15 BTC hoàn tất',
    detail: 'Đến bc1qxy...0wlh — Xác nhận 3/3',
    channel: 'email',
    time: '2 giờ trước',
    read: true,
  },
  {
    id: 'r3',
    title: 'Đăng nhập thất bại (3 lần)',
    detail: 'IP 185.220.xxx.xxx — Moscow, RU',
    channel: 'sms',
    time: '20 giờ trước',
    read: false,
  },
  {
    id: 'r4',
    title: 'Whitelist: Thêm địa chỉ mới',
    detail: 'BNB / BEP-20 — Chờ kích hoạt 24h',
    channel: 'email',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 'r5',
    title: 'API key #3 bị xóa',
    detail: 'Key "Trading Bot Prod" đã bị thu hồi',
    channel: 'email',
    time: '2 ngày trước',
    read: true,
  },
  {
    id: 'r6',
    title: 'Mật khẩu đã đổi thành công',
    detail: 'Đổi từ Chrome trên Windows — TP.HCM',
    channel: 'push',
    time: '3 ngày trước',
    read: true,
  },
];

const CHANNEL_META: Record<Channel, { label: string; icon: React.ElementType; color: string }> = {
  email: { label: 'Email', icon: Mail, color: '#3B82F6' },
  push: { label: 'Push', icon: BellRing, color: '#8B5CF6' },
  sms: { label: 'SMS', icon: MessageSquare, color: '#10B981' },
};

export function WebSecurityNotificationsPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [categories, setCategories] = useState(initialCategories);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>('login');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('23:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [showRecent, setShowRecent] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  /* ─── Toggle channel ─── */
  const toggleChannel = (catId: string, itemId: string, channel: Channel) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) => {
            if (item.id !== itemId) return item;
            // Critical items must keep at least email on
            if (item.critical && channel === 'email' && item.channels.email) {
              const otherOn = item.channels.push || item.channels.sms;
              if (!otherOn) return item; // can't disable last channel on critical
            }
            return { ...item, channels: { ...item.channels, [channel]: !item.channels[channel] } };
          }),
        };
      }),
    );
  };

  /* ─── Toggle all in a category ─── */
  const toggleCategoryAll = (catId: string, channel: Channel, value: boolean) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) => {
            if (!value && item.critical && channel === 'email') {
              const otherOn = item.channels.push || item.channels.sms;
              if (!otherOn) return item;
            }
            return { ...item, channels: { ...item.channels, [channel]: value } };
          }),
        };
      }),
    );
  };

  /* ─── Save ─── */
  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  /* ─── Stats ─── */
  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const enabledCount = categories.reduce(
    (s, cat) =>
      s + cat.items.filter((i) => i.channels.email || i.channels.push || i.channels.sms).length,
    0,
  );

  /* ─── Helpers ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault,
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  const Toggle = ({
    on,
    onChange,
    size = 'md',
    disabled,
  }: {
    on: boolean;
    onChange: () => void;
    size?: 'sm' | 'md';
    disabled?: boolean;
  }) => {
    const w = size === 'sm' ? 36 : 44;
    const h = size === 'sm' ? 20 : 24;
    const dot = size === 'sm' ? 14 : 18;
    return (
      <button
        onClick={disabled ? undefined : onChange}
        style={{
          width: w,
          height: h,
          borderRadius: h / 2,
          cursor: disabled ? 'not-allowed' : 'pointer',
          border: 'none',
          background: on ? '#3B82F6' : c.borderSolid,
          position: 'relative',
          transition: 'background 0.2s',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <div
          style={{
            width: dot,
            height: dot,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: (h - dot) / 2,
            left: on ? w - dot - (h - dot) / 2 : (h - dot) / 2,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </button>
    );
  };

  return (
    <PageLayout>
      {/* ─── Header ─── */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 24px',
          borderBottom: `1px solid ${c.borderSolid}`,
          background: c.surface,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/w/profile/security')}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
              Thông báo bảo mật
            </h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bảo mật &gt; Cấu hình thông báo</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5"
          style={{
            padding: '7px 18px',
            borderRadius: 8,
            background: '#3B82F6',
            color: '#fff',
            fontSize: WEB_FONT.sm,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <CheckCircle size={14} /> Lưu thay đổi
        </button>
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 24px' }}>
        <div className="flex flex-col" style={{ gap: 24 }}>
          {/* Toast */}
          {savedToast && (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.18)',
              }}
            >
              <CheckCircle size={15} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                Đã lưu cấu hình thông báo bảo mật
              </span>
            </div>
          )}

          {/* ═══ Master toggle + stats ═══ */}
          <div style={card()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: masterEnabled ? 'rgba(59,130,246,0.06)' : 'rgba(107,114,128,0.06)',
                  }}
                >
                  {masterEnabled ? (
                    <BellRing size={20} color="#3B82F6" />
                  ) : (
                    <BellOff size={20} color="#6B7280" />
                  )}
                </div>
                <div>
                  <p
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.md,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    Thông báo bảo mật
                  </p>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                    {masterEnabled
                      ? `${enabledCount}/${totalItems} loại thông báo đang bật`
                      : 'Tất cả thông báo đã tắt'}
                  </p>
                </div>
              </div>
              <Toggle on={masterEnabled} onChange={() => setMasterEnabled(!masterEnabled)} />
            </div>

            {!masterEnabled && (
              <div
                className="flex items-start gap-2"
                style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.04)',
                  border: '1px solid rgba(239,68,68,0.1)',
                }}
              >
                <AlertTriangle
                  size={14}
                  color="#EF4444"
                  className="shrink-0"
                  style={{ marginTop: 1 }}
                />
                <p style={{ color: '#EF4444', fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                  <strong>Cảnh báo:</strong> Tắt tất cả thông báo bảo mật sẽ khiến bạn không nhận
                  được cảnh báo về hoạt động đáng ngờ, đăng nhập trái phép, hoặc rút tiền bất
                  thường.
                </p>
              </div>
            )}

            {/* Channel summary */}
            {masterEnabled && (
              <div className="flex items-center" style={{ gap: 16, marginTop: 16 }}>
                {(Object.keys(CHANNEL_META) as Channel[]).map((ch) => {
                  const meta = CHANNEL_META[ch];
                  const count = categories.reduce(
                    (s, cat) => s + cat.items.filter((i) => i.channels[ch]).length,
                    0,
                  );
                  return (
                    <div
                      key={ch}
                      className="flex items-center gap-2"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: `${meta.color}06`,
                        border: `1px solid ${meta.color}15`,
                      }}
                    >
                      <meta.icon size={13} color={meta.color} />
                      <span style={{ color: meta.color, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                        {meta.label}
                      </span>
                      <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                        {count}/{totalItems}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══ Categories ═══ */}
          {masterEnabled &&
            categories.map((cat) => {
              const isExpanded = expandedCat === cat.id;
              const catEnabled = cat.items.filter(
                (i) => i.channels.email || i.channels.push || i.channels.sms,
              ).length;

              return (
                <div key={cat.id} style={card()}>
                  {/* Category header */}
                  <button
                    onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                    className="flex items-center justify-between"
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: `${cat.color}08`,
                        }}
                      >
                        <cat.icon size={18} color={cat.color} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p
                          style={{
                            color: c.text1,
                            fontSize: WEB_FONT.md,
                            fontWeight: 600,
                            marginBottom: 1,
                          }}
                        >
                          {cat.title}
                        </p>
                        <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{cat.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          color: catEnabled === cat.items.length ? '#10B981' : c.text3,
                          fontSize: WEB_FONT.xs,
                          fontWeight: 600,
                        }}
                      >
                        {catEnabled}/{cat.items.length}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} color={c.text3} />
                      ) : (
                        <ChevronDown size={16} color={c.text3} />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: 16 }}>
                      {/* Bulk channel toggles */}
                      <div
                        className="flex items-center justify-end"
                        style={{
                          gap: 8,
                          marginBottom: 12,
                          paddingBottom: 10,
                          borderBottom: `1px solid ${c.borderSolid}`,
                        }}
                      >
                        <span style={{ color: c.text3, fontSize: WEB_FONT.xs, marginRight: 4 }}>
                          Tất cả:
                        </span>
                        {(Object.keys(CHANNEL_META) as Channel[]).map((ch) => {
                          const allOn = cat.items.every((i) => i.channels[ch]);
                          return (
                            <button
                              key={ch}
                              onClick={() => toggleCategoryAll(cat.id, ch, !allOn)}
                              className="flex items-center gap-1"
                              style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                background: allOn ? `${CHANNEL_META[ch].color}10` : 'transparent',
                                border: `1px solid ${allOn ? `${CHANNEL_META[ch].color}25` : c.borderSolid}`,
                                color: allOn ? CHANNEL_META[ch].color : c.text3,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {React.createElement(CHANNEL_META[ch].icon, { size: 10 })}
                              {CHANNEL_META[ch].label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Items */}
                      <div className="flex flex-col" style={{ gap: 0 }}>
                        {cat.items.map((item, idx) => (
                          <div key={item.id}>
                            {idx > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                            <div
                              className="flex items-center"
                              style={{ padding: '12px 0', gap: 14 }}
                            >
                              <div
                                className="flex items-center justify-center shrink-0"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: `${cat.color}06`,
                                }}
                              >
                                <item.icon size={15} color={cat.color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="flex items-center gap-2"
                                  style={{ marginBottom: 1 }}
                                >
                                  <p
                                    style={{
                                      color: c.text1,
                                      fontSize: WEB_FONT.sm,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {item.title}
                                  </p>
                                  {item.critical && (
                                    <span
                                      style={{
                                        padding: '0px 5px',
                                        borderRadius: 4,
                                        background: 'rgba(239,68,68,0.06)',
                                        color: '#EF4444',
                                        fontSize: 9,
                                        fontWeight: 700,
                                      }}
                                    >
                                      BẮT BUỘC
                                    </span>
                                  )}
                                </div>
                                <p
                                  style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}
                                >
                                  {item.description}
                                </p>
                              </div>
                              {/* Channel toggles */}
                              <div className="flex items-center shrink-0" style={{ gap: 8 }}>
                                {(Object.keys(CHANNEL_META) as Channel[]).map((ch) => {
                                  const isOn = item.channels[ch];
                                  const meta = CHANNEL_META[ch];
                                  return (
                                    <button
                                      key={ch}
                                      onClick={() => toggleChannel(cat.id, item.id, ch)}
                                      title={`${meta.label}: ${isOn ? 'Bật' : 'Tắt'}`}
                                      className="flex items-center justify-center"
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        background: isOn ? `${meta.color}10` : 'transparent',
                                        border: `1.5px solid ${isOn ? `${meta.color}30` : c.borderSolid}`,
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      {React.createElement(meta.icon, {
                                        size: 13,
                                        color: isOn ? meta.color : c.text3,
                                      })}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* ═══ Quiet Hours ═══ */}
          {masterEnabled && (
            <div style={card()}>
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: quietHoursEnabled ? 14 : 0 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(107,114,128,0.06)',
                    }}
                  >
                    <BellOff size={18} color="#6B7280" />
                  </div>
                  <div>
                    <p
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.md,
                        fontWeight: 600,
                        marginBottom: 1,
                      }}
                    >
                      Giờ yên tĩnh
                    </p>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                      Tạm dừng push notifications trong khoảng thời gian nhất định
                    </p>
                  </div>
                </div>
                <Toggle
                  on={quietHoursEnabled}
                  onChange={() => setQuietHoursEnabled(!quietHoursEnabled)}
                />
              </div>

              {quietHoursEnabled && (
                <div>
                  <div className="flex items-center" style={{ gap: 12 }}>
                    <div className="flex-1">
                      <label
                        style={{
                          display: 'block',
                          color: c.text2,
                          fontSize: WEB_FONT.xs,
                          fontWeight: 500,
                          marginBottom: 4,
                        }}
                      >
                        Bắt đầu
                      </label>
                      <input
                        type="time"
                        value={quietStart}
                        onChange={(e) => setQuietStart(e.target.value)}
                        className="outline-none"
                        style={{
                          width: '100%',
                          height: 38,
                          borderRadius: 8,
                          border: `1.5px solid ${c.borderSolid}`,
                          background: c.bg,
                          padding: '0 12px',
                          color: c.text1,
                          fontSize: WEB_FONT.sm,
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        style={{
                          display: 'block',
                          color: c.text2,
                          fontSize: WEB_FONT.xs,
                          fontWeight: 500,
                          marginBottom: 4,
                        }}
                      >
                        Kết thúc
                      </label>
                      <input
                        type="time"
                        value={quietEnd}
                        onChange={(e) => setQuietEnd(e.target.value)}
                        className="outline-none"
                        style={{
                          width: '100%',
                          height: 38,
                          borderRadius: 8,
                          border: `1.5px solid ${c.borderSolid}`,
                          background: c.bg,
                          padding: '0 12px',
                          color: c.text1,
                          fontSize: WEB_FONT.sm,
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="flex items-start gap-2"
                    style={{
                      marginTop: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(245,158,11,0.04)',
                      border: '1px solid rgba(245,158,11,0.1)',
                    }}
                  >
                    <Info size={12} color="#F59E0B" className="shrink-0" style={{ marginTop: 2 }} />
                    <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
                      Push bị tạm dừng trong giờ yên tĩnh.{' '}
                      <span style={{ color: c.text1, fontWeight: 500 }}>
                        Email và SMS vẫn gửi bình thường
                      </span>{' '}
                      cho các cảnh báo bắt buộc.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ Recent alerts ═══ */}
          <div style={card()}>
            <button
              onClick={() => setShowRecent(!showRecent)}
              className="flex items-center justify-between"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <div className="flex items-center gap-2">
                <Bell size={16} color={c.text2} />
                <h3 style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                  Thông báo gần đây
                </h3>
                {RECENT_ALERTS.filter((a) => !a.read).length > 0 && (
                  <span
                    style={{
                      padding: '1px 7px',
                      borderRadius: 10,
                      background: '#EF4444',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {RECENT_ALERTS.filter((a) => !a.read).length}
                  </span>
                )}
              </div>
              {showRecent ? (
                <ChevronUp size={16} color={c.text3} />
              ) : (
                <ChevronDown size={16} color={c.text3} />
              )}
            </button>

            {showRecent && (
              <div className="flex flex-col" style={{ marginTop: 14, gap: 0 }}>
                {RECENT_ALERTS.map((alert, idx) => {
                  const chMeta = CHANNEL_META[alert.channel];
                  return (
                    <div key={alert.id}>
                      {idx > 0 && <div style={{ height: 1, background: c.borderSolid }} />}
                      <div
                        className="flex items-center"
                        style={{ padding: '10px 0', gap: 12, opacity: alert.read ? 0.7 : 1 }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: `${chMeta.color}08`,
                          }}
                        >
                          <chMeta.icon size={13} color={chMeta.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              style={{
                                color: c.text1,
                                fontSize: WEB_FONT.sm,
                                fontWeight: alert.read ? 400 : 600,
                              }}
                            >
                              {alert.title}
                            </p>
                            {!alert.read && (
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: '#3B82F6',
                                }}
                              />
                            )}
                          </div>
                          <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{alert.detail}</p>
                        </div>
                        <span
                          style={{ color: c.text3, fontSize: WEB_FONT.xs, whiteSpace: 'nowrap' }}
                        >
                          {alert.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div
            className="flex items-start gap-3"
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: 'rgba(59,130,246,0.03)',
              border: '1px solid rgba(59,130,246,0.1)',
            }}
          >
            <Info size={14} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              Các thông báo được đánh dấu{' '}
              <span style={{ color: '#EF4444', fontWeight: 600 }}>BẮT BUỘC</span> không thể tắt hoàn
              toàn — luôn phải bật ít nhất một kênh. Đây là biện pháp bảo vệ tối thiểu để đảm bảo
              bạn luôn nhận được cảnh báo quan trọng.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
