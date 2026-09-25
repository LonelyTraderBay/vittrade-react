import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Clock,
  CheckCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Eye,
  EyeOff,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Link2,
  Unlink,
} from 'lucide-react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '@/shared/theme/webTokens';
import { PageLayout } from '@/shared/ui/layout/PageLayout';

/**
 * WebSessionManagementPage — Advanced session & trusted device management
 *
 * Route: /w/profile/security/sessions
 *
 * Features:
 *   - Active sessions with full detail (device, IP, location, last active, auth method)
 *   - Revoke individual / all remote sessions
 *   - Trusted devices management (link/unlink)
 *   - Device trust levels (verified, pending, suspicious)
 *   - Session activity timeline per device
 *   - Security posture per session (2FA, passkey, etc.)
 *
 * Guidelines:
 *   - §14.1: Security Center — devices & sessions
 *   - §14.2: Sensitive data — IP masking
 *   - §14.3: High-risk — terminate session = destructive confirm
 */

/* ═══ Types ═══ */
type DeviceType = 'desktop' | 'mobile' | 'tablet';
type TrustLevel = 'trusted' | 'verified' | 'pending' | 'unknown';
type SessionStatus = 'active' | 'idle' | 'suspicious';

interface Session {
  id: string;
  device: string;
  deviceType: DeviceType;
  browser: string;
  os: string;
  ip: string;
  location: string;
  country: string;
  lastActive: string;
  loginTime: string;
  authMethod: string;
  isCurrent: boolean;
  status: SessionStatus;
  trustLevel: TrustLevel;
  activities: SessionActivity[];
}

interface SessionActivity {
  action: string;
  time: string;
  detail?: string;
}

interface TrustedDevice {
  id: string;
  name: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  trustedSince: string;
  lastSeen: string;
  authMethods: string[];
  isActive: boolean;
}

/* ═══ Mock data ═══ */
const MOCK_SESSIONS: Session[] = [
  {
    id: 's1',
    device: 'MacBook Pro 16"',
    deviceType: 'desktop',
    browser: 'Chrome 122',
    os: 'macOS Sonoma 14.3',
    ip: '103.152.xxx.xxx',
    location: 'Hà Nội',
    country: 'Việt Nam',
    lastActive: 'Đang hoạt động',
    loginTime: '13/03/2026, 14:32',
    authMethod: 'Email + 2FA (TOTP)',
    isCurrent: true,
    status: 'active',
    trustLevel: 'trusted',
    activities: [
      { action: 'Xem lịch sử giao dịch', time: '14:35', detail: 'Wallet → Transaction History' },
      { action: 'Đổi cài đặt thông báo', time: '14:33', detail: 'Settings → Notifications' },
      { action: 'Đăng nhập', time: '14:32', detail: 'Email + Google Authenticator' },
    ],
  },
  {
    id: 's2',
    device: 'iPhone 15 Pro',
    deviceType: 'mobile',
    browser: 'Safari 17',
    os: 'iOS 17.4',
    ip: '113.185.xxx.xxx',
    location: 'Hà Nội',
    country: 'Việt Nam',
    lastActive: '5 giờ trước',
    loginTime: '13/03/2026, 09:15',
    authMethod: 'Passkey (Face ID)',
    isCurrent: false,
    status: 'idle',
    trustLevel: 'trusted',
    activities: [
      { action: 'Kiểm tra số dư', time: '09:20', detail: 'Home → Wallet Overview' },
      { action: 'Đăng nhập', time: '09:15', detail: 'Passkey — Face ID' },
    ],
  },
  {
    id: 's3',
    device: 'Windows Desktop',
    deviceType: 'desktop',
    browser: 'Firefox 123',
    os: 'Windows 11',
    ip: '42.115.xxx.xxx',
    location: 'TP.HCM',
    country: 'Việt Nam',
    lastActive: '16 giờ trước',
    loginTime: '12/03/2026, 22:48',
    authMethod: 'Email + 2FA (TOTP)',
    isCurrent: false,
    status: 'idle',
    trustLevel: 'verified',
    activities: [
      { action: 'Đặt lệnh mua BTC', time: '22:55', detail: 'Trade → Market Order — 0.05 BTC' },
      { action: 'Xem biểu đồ BTC/USDT', time: '22:50', detail: 'Trade → BTC/USDT Chart' },
      { action: 'Đăng nhập', time: '22:48', detail: 'Email + Google Authenticator' },
    ],
  },
  {
    id: 's4',
    device: 'Samsung Galaxy S24',
    deviceType: 'mobile',
    browser: 'Chrome 122',
    os: 'Android 14',
    ip: '14.162.xxx.xxx',
    location: 'Đà Nẵng',
    country: 'Việt Nam',
    lastActive: '2 ngày trước',
    loginTime: '11/03/2026, 10:33',
    authMethod: 'Email + OTP (SMS)',
    isCurrent: false,
    status: 'idle',
    trustLevel: 'pending',
    activities: [{ action: 'Đăng nhập', time: '10:33', detail: 'Email + SMS OTP' }],
  },
  {
    id: 's5',
    device: 'Unknown Device',
    deviceType: 'desktop',
    browser: 'Chrome 120',
    os: 'Linux',
    ip: '185.220.xxx.xxx',
    location: 'Moscow',
    country: 'Russia',
    lastActive: '20 giờ trước',
    loginTime: '12/03/2026, 18:05',
    authMethod: 'Email + Password (bị chặn)',
    isCurrent: false,
    status: 'suspicious',
    trustLevel: 'unknown',
    activities: [
      { action: 'Đăng nhập thất bại', time: '18:05', detail: 'Bị chặn do vị trí bất thường' },
    ],
  },
];

const MOCK_TRUSTED_DEVICES: TrustedDevice[] = [
  {
    id: 'd1',
    name: 'MacBook Pro 16" (Chrome)',
    deviceType: 'desktop',
    os: 'macOS Sonoma',
    browser: 'Chrome 122',
    trustedSince: '01/01/2026',
    lastSeen: 'Đang hoạt động',
    authMethods: ['2FA (TOTP)', 'Passkey (Touch ID)'],
    isActive: true,
  },
  {
    id: 'd2',
    name: 'iPhone 15 Pro (Safari)',
    deviceType: 'mobile',
    os: 'iOS 17.4',
    browser: 'Safari 17',
    trustedSince: '15/01/2026',
    lastSeen: '5 giờ trước',
    authMethods: ['Passkey (Face ID)'],
    isActive: true,
  },
  {
    id: 'd3',
    name: 'iPad Air (Safari)',
    deviceType: 'tablet',
    os: 'iPadOS 17.3',
    browser: 'Safari 17',
    trustedSince: '20/02/2026',
    lastSeen: '2 ngày trước',
    authMethods: ['2FA (TOTP)'],
    isActive: false,
  },
];

/* ═══ Helpers ═══ */
const DEVICE_ICONS: Record<DeviceType, React.ElementType> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

const TRUST_CONFIG: Record<
  TrustLevel,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  trusted: {
    label: 'Tin tưởng',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.15)',
    icon: ShieldCheck,
  },
  verified: {
    label: 'Đã xác minh',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.15)',
    icon: Shield,
  },
  pending: {
    label: 'Chờ xác minh',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.15)',
    icon: Clock,
  },
  unknown: {
    label: 'Không xác định',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.15)',
    icon: ShieldAlert,
  },
};

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; dotColor: string }> = {
  active: { label: 'Đang hoạt động', color: '#10B981', dotColor: '#10B981' },
  idle: { label: 'Không hoạt động', color: '#6B7280', dotColor: '#6B7280' },
  suspicious: { label: 'Đáng ngờ', color: '#EF4444', dotColor: '#EF4444' },
};

type TabView = 'sessions' | 'trusted';

export function WebSessionManagementPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [tab, setTab] = useState<TabView>('sessions');
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [trustedDevices, setTrustedDevices] = useState(MOCK_TRUSTED_DEVICES);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showIP, setShowIP] = useState(false);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [linkStep, setLinkStep] = useState<'idle' | 'form' | 'success'>('idle');
  const [linkName, setLinkName] = useState('');

  /* ─── Actions ─── */
  const handleTerminate = async (id: string) => {
    setTerminatingId(id);
    await new Promise((r) => setTimeout(r, 800));
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setTerminatingId(null);
  };

  const handleRevokeAll = async () => {
    setRevokeAllLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setRevokeAllLoading(false);
    setConfirmRevokeAll(false);
  };

  const handleUnlink = async (id: string) => {
    setUnlinkLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setTrustedDevices((prev) => prev.filter((d) => d.id !== id));
    setUnlinkLoading(false);
    setUnlinkConfirm(null);
  };

  const handleLinkDevice = async () => {
    if (!linkName.trim()) return;
    await new Promise((r) => setTimeout(r, 1000));
    const newDev: TrustedDevice = {
      id: `d-${Date.now()}`,
      name: linkName.trim(),
      deviceType: 'desktop',
      os: navigator.platform || 'Unknown',
      browser: 'Current Browser',
      trustedSince: new Date().toLocaleDateString('vi-VN'),
      lastSeen: 'Vừa xong',
      authMethods: ['2FA (TOTP)'],
      isActive: true,
    };
    setTrustedDevices((prev) => [newDev, ...prev]);
    setLinkStep('success');
  };

  /* ─── Helpers ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault,
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  const remoteSessions = sessions.filter((s) => !s.isCurrent);
  const suspiciousSessions = sessions.filter((s) => s.status === 'suspicious');

  const tabs: { key: TabView; label: string; count: number }[] = [
    { key: 'sessions', label: 'Phiên đăng nhập', count: sessions.length },
    { key: 'trusted', label: 'Thiết bị tin tưởng', count: trustedDevices.length },
  ];

  return (
    <PageLayout>
      {/* Header */}
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
              Quản lý phiên & Thiết bị
            </h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
              Bảo mật &gt; Phiên đăng nhập & Thiết bị tin tưởng
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowIP(!showIP)}
            className="flex items-center gap-1.5"
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              color: c.text2,
              fontSize: WEB_FONT.xs,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {showIP ? <EyeOff size={13} /> : <Eye size={13} />}
            {showIP ? 'Ẩn IP' : 'Hiện IP'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 24px' }}>
        <div className="flex flex-col" style={{ gap: 24 }}>
          {/* Suspicious alert */}
          {suspiciousSessions.length > 0 && (
            <div
              className="flex items-start gap-3"
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.12)',
              }}
            >
              <ShieldAlert
                size={18}
                color="#EF4444"
                className="shrink-0"
                style={{ marginTop: 1 }}
              />
              <div className="flex-1">
                <p
                  style={{
                    color: '#EF4444',
                    fontSize: WEB_FONT.md,
                    fontWeight: 600,
                    marginBottom: 3,
                  }}
                >
                  Phiên đáng ngờ phát hiện
                </p>
                <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                  {suspiciousSessions.length} phiên từ vị trí bất thường. Nên kết thúc ngay nếu
                  không phải bạn.
                </p>
              </div>
              <button
                onClick={() => {
                  suspiciousSessions.forEach((s) => handleTerminate(s.id));
                }}
                className="shrink-0 flex items-center gap-1"
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#EF4444',
                  color: '#fff',
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={12} /> Kết thúc tất cả
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4" style={{ gap: 12 }}>
            {[
              {
                label: 'Phiên hoạt động',
                value: sessions.filter((s) => s.status === 'active').length,
                color: '#10B981',
              },
              {
                label: 'Phiên chờ',
                value: sessions.filter((s) => s.status === 'idle').length,
                color: '#6B7280',
              },
              { label: 'Đáng ngờ', value: suspiciousSessions.length, color: '#EF4444' },
              { label: 'Thiết bị tin tưởng', value: trustedDevices.length, color: '#3B82F6' },
            ].map((s) => (
              <div key={s.label} style={card({ textAlign: 'center' as const, padding: 14 })}>
                <p
                  style={{
                    color: s.color,
                    fontSize: WEB_FONT['2xl'],
                    fontWeight: 700,
                    marginBottom: 2,
                  }}
                >
                  {s.value}
                </p>
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div
            className="flex"
            style={{
              gap: 4,
              background: c.bg,
              borderRadius: 10,
              padding: 4,
              border: `1px solid ${c.borderSolid}`,
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex-1 flex items-center justify-center gap-2"
                style={{
                  height: 38,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: tab === t.key ? c.surface : 'transparent',
                  color: tab === t.key ? c.text1 : c.text3,
                  fontSize: WEB_FONT.sm,
                  fontWeight: tab === t.key ? 600 : 400,
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 8,
                    background: tab === t.key ? 'rgba(59,130,246,0.08)' : 'transparent',
                    color: tab === t.key ? '#3B82F6' : c.text3,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* ═══ SESSIONS TAB ═══ */}
          {tab === 'sessions' && (
            <>
              {/* Revoke all bar */}
              {remoteSessions.length > 0 && !confirmRevokeAll && (
                <div
                  className="flex items-center justify-between"
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.03)',
                    border: '1px solid rgba(239,68,68,0.08)',
                  }}
                >
                  <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                    {remoteSessions.length} phiên đang hoạt động trên thiết bị khác
                  </span>
                  <button
                    onClick={() => setConfirmRevokeAll(true)}
                    className="flex items-center gap-1.5"
                    style={{
                      padding: '6px 14px',
                      borderRadius: 8,
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.12)',
                      color: '#EF4444',
                      fontSize: WEB_FONT.xs,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={13} /> Kết thúc tất cả phiên khác
                  </button>
                </div>
              )}

              {/* Revoke all confirm */}
              {confirmRevokeAll && (
                <div style={card({ borderColor: 'rgba(239,68,68,0.2)' })}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(239,68,68,0.06)',
                      }}
                    >
                      <LogOut size={20} color="#EF4444" />
                    </div>
                    <div>
                      <p style={{ color: '#EF4444', fontSize: WEB_FONT.md, fontWeight: 600 }}>
                        Kết thúc tất cả phiên khác?
                      </p>
                      <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                        {remoteSessions.length} phiên sẽ bị đăng xuất ngay lập tức. Các thiết bị cần
                        đăng nhập lại.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end" style={{ gap: 8 }}>
                    <button
                      onClick={() => setConfirmRevokeAll(false)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        background: c.bg,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text2,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleRevokeAll}
                      disabled={revokeAllLoading}
                      className="flex items-center gap-1.5"
                      style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        border: 'none',
                        cursor: revokeAllLoading ? 'not-allowed' : 'pointer',
                        opacity: revokeAllLoading ? 0.7 : 1,
                      }}
                    >
                      {revokeAllLoading ? (
                        <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <LogOut size={13} />
                      )}
                      {revokeAllLoading ? 'Đang xử lý...' : 'Xác nhận kết thúc'}
                    </button>
                  </div>
                </div>
              )}

              {/* Session cards */}
              <div className="flex flex-col" style={{ gap: 12 }}>
                {sessions.map((session) => {
                  const DevIcon = DEVICE_ICONS[session.deviceType];
                  const trust = TRUST_CONFIG[session.trustLevel];
                  const sts = STATUS_CONFIG[session.status];
                  const isExpanded = expandedSession === session.id;

                  return (
                    <div
                      key={session.id}
                      style={card({
                        borderColor:
                          session.status === 'suspicious'
                            ? 'rgba(239,68,68,0.2)'
                            : session.isCurrent
                              ? 'rgba(59,130,246,0.15)'
                              : undefined,
                        background:
                          session.status === 'suspicious'
                            ? 'rgba(239,68,68,0.01)'
                            : session.isCurrent
                              ? 'rgba(59,130,246,0.01)'
                              : c.surface,
                      })}
                    >
                      {/* Main row */}
                      <div className="flex items-center" style={{ gap: 14 }}>
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: trust.bg,
                            border: `1px solid ${trust.border}`,
                          }}
                        >
                          <DevIcon size={20} color={trust.color} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                              {session.device}
                            </p>
                            {session.isCurrent && (
                              <span
                                style={{
                                  padding: '1px 8px',
                                  borderRadius: 10,
                                  background: 'rgba(59,130,246,0.08)',
                                  color: '#3B82F6',
                                  fontSize: WEB_FONT.xs,
                                  fontWeight: 600,
                                }}
                              >
                                Phiên hiện tại
                              </span>
                            )}
                            {/* Status dot + label */}
                            <div className="flex items-center gap-1">
                              <div
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: sts.dotColor,
                                }}
                              />
                              <span
                                style={{ color: sts.color, fontSize: WEB_FONT.xs, fontWeight: 500 }}
                              >
                                {sts.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
                            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                              {session.browser} · {session.os}
                            </span>
                            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                              {session.location}, {session.country}
                            </span>
                            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                              {showIP ? session.ip : '•••.•••.xxx.xxx'}
                            </span>
                          </div>
                          <div className="flex items-center" style={{ gap: 8, marginTop: 4 }}>
                            <span
                              style={{
                                padding: '1px 6px',
                                borderRadius: 6,
                                background: trust.bg,
                                border: `1px solid ${trust.border}`,
                                color: trust.color,
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {trust.label}
                            </span>
                            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                              Đăng nhập: {session.loginTime}
                            </span>
                            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                              Phương thức: {session.authMethod}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Expand */}
                          <button
                            onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                            className="flex items-center justify-center"
                            title="Xem chi tiết"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: c.bg,
                              border: `1px solid ${c.borderSolid}`,
                              cursor: 'pointer',
                            }}
                          >
                            {isExpanded ? (
                              <ChevronUp size={14} color={c.text3} />
                            ) : (
                              <ChevronDown size={14} color={c.text3} />
                            )}
                          </button>
                          {/* Terminate */}
                          {!session.isCurrent && (
                            <button
                              onClick={() => handleTerminate(session.id)}
                              disabled={terminatingId === session.id}
                              className="flex items-center gap-1 shrink-0"
                              style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                background:
                                  session.status === 'suspicious'
                                    ? '#EF4444'
                                    : 'rgba(239,68,68,0.06)',
                                border:
                                  session.status === 'suspicious'
                                    ? 'none'
                                    : '1px solid rgba(239,68,68,0.12)',
                                color: session.status === 'suspicious' ? '#fff' : '#EF4444',
                                fontSize: WEB_FONT.xs,
                                fontWeight: 600,
                                cursor: terminatingId === session.id ? 'not-allowed' : 'pointer',
                                opacity: terminatingId === session.id ? 0.6 : 1,
                              }}
                            >
                              <LogOut size={12} />
                              {terminatingId === session.id ? 'Đang...' : 'Kết thúc'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded: activity timeline */}
                      {isExpanded && session.activities.length > 0 && (
                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 14,
                            borderTop: `1px solid ${c.borderSolid}`,
                          }}
                        >
                          <p
                            style={{
                              color: c.text2,
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                              marginBottom: 10,
                            }}
                          >
                            Hoạt động trong phiên
                          </p>
                          <div
                            className="flex flex-col"
                            style={{ gap: 0, position: 'relative', paddingLeft: 20 }}
                          >
                            {/* Vertical line */}
                            <div
                              style={{
                                position: 'absolute',
                                left: 5,
                                top: 6,
                                bottom: 6,
                                width: 1,
                                background: c.borderSolid,
                              }}
                            />
                            {session.activities.map((act, i) => (
                              <div
                                key={i}
                                className="flex items-start"
                                style={{
                                  gap: 10,
                                  paddingBottom: i < session.activities.length - 1 ? 10 : 0,
                                  position: 'relative',
                                }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: -16,
                                    top: 5,
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    background: i === 0 ? '#3B82F6' : c.borderSolid,
                                    border: `2px solid ${c.surface}`,
                                  }}
                                />
                                <div className="flex-1">
                                  <p
                                    style={{
                                      color: c.text1,
                                      fontSize: WEB_FONT.sm,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {act.action}
                                  </p>
                                  {act.detail && (
                                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                                      {act.detail}
                                    </p>
                                  )}
                                </div>
                                <span
                                  style={{
                                    color: c.text3,
                                    fontSize: WEB_FONT.xs,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {act.time}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {sessions.length === 0 && (
                <div className="flex flex-col items-center" style={{ padding: '40px 0' }}>
                  <Monitor size={32} color={c.text3} style={{ marginBottom: 12 }} />
                  <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Chỉ còn phiên hiện tại</p>
                </div>
              )}
            </>
          )}

          {/* ═══ TRUSTED DEVICES TAB ═══ */}
          {tab === 'trusted' && (
            <>
              {/* Link new device */}
              {linkStep === 'idle' && (
                <button
                  onClick={() => setLinkStep('form')}
                  className="flex items-center justify-center gap-2"
                  style={{
                    height: 44,
                    borderRadius: 10,
                    width: '100%',
                    background: 'rgba(59,130,246,0.04)',
                    border: '1.5px dashed rgba(59,130,246,0.3)',
                    color: '#3B82F6',
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Link2 size={15} /> Liên kết thiết bị hiện tại
                </button>
              )}

              {linkStep === 'form' && (
                <div style={card({ borderColor: 'rgba(59,130,246,0.2)' })}>
                  <h3
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.md,
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    Liên kết thiết bị hiện tại
                  </h3>
                  <p
                    style={{
                      color: c.text2,
                      fontSize: WEB_FONT.sm,
                      lineHeight: 1.5,
                      marginBottom: 16,
                    }}
                  >
                    Thiết bị tin tưởng sẽ được bỏ qua bước xác thực nâng cao khi đăng nhập. Bạn cần
                    xác thực 2FA để hoàn tất.
                  </p>
                  <div style={{ marginBottom: 14 }}>
                    <label
                      style={{
                        display: 'block',
                        color: c.text2,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 500,
                        marginBottom: 6,
                      }}
                    >
                      Tên thiết bị
                    </label>
                    <input
                      type="text"
                      placeholder="VD: MacBook Pro văn phòng"
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      maxLength={40}
                      className="outline-none"
                      style={{
                        width: '100%',
                        height: WEB_BUTTON.lg,
                        borderRadius: 10,
                        border: `1.5px solid ${c.borderSolid}`,
                        background: c.bg,
                        padding: '0 14px',
                        color: c.text1,
                        fontSize: WEB_FONT.md,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-end" style={{ gap: 8 }}>
                    <button
                      onClick={() => {
                        setLinkStep('idle');
                        setLinkName('');
                      }}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        background: c.bg,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text2,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleLinkDevice}
                      disabled={!linkName.trim()}
                      className="flex items-center gap-1.5"
                      style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        background: linkName.trim() ? '#3B82F6' : c.surface2,
                        color: '#fff',
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        border: 'none',
                        cursor: linkName.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <Link2 size={13} /> Liên kết
                    </button>
                  </div>
                </div>
              )}

              {linkStep === 'success' && (
                <div style={card({ borderColor: 'rgba(16,185,129,0.2)' })}>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={20} color="#10B981" />
                    <div className="flex-1">
                      <p style={{ color: '#10B981', fontSize: WEB_FONT.md, fontWeight: 600 }}>
                        Thiết bị đã liên kết!
                      </p>
                      <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                        "{linkName}" đã được thêm vào danh sách tin tưởng.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setLinkStep('idle');
                        setLinkName('');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: c.bg,
                        border: `1px solid ${c.borderSolid}`,
                        color: c.text2,
                        fontSize: WEB_FONT.xs,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}

              {/* Device list */}
              <div className="flex flex-col" style={{ gap: 12 }}>
                {trustedDevices.map((device) => {
                  const DevIcon = DEVICE_ICONS[device.deviceType];
                  const isUnlinkTarget = unlinkConfirm === device.id;

                  return (
                    <div key={device.id} style={card()}>
                      <div className="flex items-center" style={{ gap: 14 }}>
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: device.isActive
                              ? 'rgba(16,185,129,0.06)'
                              : 'rgba(107,114,128,0.06)',
                            border: `1px solid ${device.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.1)'}`,
                          }}
                        >
                          <DevIcon size={20} color={device.isActive ? '#10B981' : '#6B7280'} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
                              {device.name}
                            </p>
                            {device.isActive && (
                              <div className="flex items-center gap-1">
                                <div
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background: '#10B981',
                                  }}
                                />
                                <span
                                  style={{
                                    color: '#10B981',
                                    fontSize: WEB_FONT.xs,
                                    fontWeight: 500,
                                  }}
                                >
                                  Online
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            className="flex items-center flex-wrap"
                            style={{ gap: 8, marginBottom: 4 }}
                          >
                            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                              {device.browser} · {device.os}
                            </span>
                            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                              Tin tưởng từ: {device.trustedSince}
                            </span>
                            <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                              Lần cuối: {device.lastSeen}
                            </span>
                          </div>
                          <div className="flex items-center" style={{ gap: 4 }}>
                            {device.authMethods.map((m, i) => (
                              <span
                                key={i}
                                style={{
                                  padding: '1px 6px',
                                  borderRadius: 6,
                                  background: 'rgba(59,130,246,0.06)',
                                  border: '1px solid rgba(59,130,246,0.1)',
                                  color: '#3B82F6',
                                  fontSize: 10,
                                  fontWeight: 500,
                                }}
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Unlink */}
                        {!isUnlinkTarget ? (
                          <button
                            onClick={() => setUnlinkConfirm(device.id)}
                            className="flex items-center gap-1 shrink-0"
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              background: 'transparent',
                              border: `1px solid ${c.borderSolid}`,
                              color: c.text3,
                              fontSize: WEB_FONT.xs,
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            <Unlink size={12} /> Gỡ liên kết
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setUnlinkConfirm(null)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: c.bg,
                                border: `1px solid ${c.borderSolid}`,
                                color: c.text2,
                                fontSize: WEB_FONT.xs,
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleUnlink(device.id)}
                              disabled={unlinkLoading}
                              className="flex items-center gap-1"
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: '#EF4444',
                                color: '#fff',
                                fontSize: WEB_FONT.xs,
                                fontWeight: 600,
                                border: 'none',
                                cursor: unlinkLoading ? 'not-allowed' : 'pointer',
                                opacity: unlinkLoading ? 0.7 : 1,
                              }}
                            >
                              <Unlink size={11} /> {unlinkLoading ? 'Đang...' : 'Xác nhận gỡ'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {trustedDevices.length === 0 && (
                <div className="flex flex-col items-center" style={{ padding: '40px 0' }}>
                  <Shield size={32} color={c.text3} style={{ marginBottom: 12 }} />
                  <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                    Chưa có thiết bị tin tưởng nào
                  </p>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginTop: 4 }}>
                    Liên kết thiết bị để đăng nhập nhanh hơn
                  </p>
                </div>
              )}
            </>
          )}

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
              {tab === 'sessions' ? (
                <>
                  Phiên đăng nhập được tự động kết thúc sau{' '}
                  <span style={{ color: c.text1, fontWeight: 500 }}>30 phút</span> không hoạt động.
                  Kết thúc phiên sẽ đăng xuất thiết bị ngay lập tức. Nếu phát hiện phiên lạ, hãy{' '}
                  <button
                    onClick={() => navigate('/w/auth/forgot-password')}
                    className="hover:underline"
                    style={{
                      color: '#3B82F6',
                      fontWeight: 500,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    đổi mật khẩu ngay
                  </button>
                  .
                </>
              ) : (
                <>
                  Thiết bị tin tưởng được bỏ qua xác thực nâng cao (device challenge) khi đăng nhập.
                  Gỡ liên kết sẽ yêu cầu thiết bị xác thực lại đầy đủ ở lần đăng nhập tiếp theo. Nên{' '}
                  <span style={{ color: c.text1, fontWeight: 500 }}>kiểm tra định kỳ</span> và gỡ
                  thiết bị không còn sử dụng.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
