/**
 * ══════════════════════════════════════════════════════════
 *  WEB SECURITY CENTER PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/profile/security
 *
 *  Security & Account Protection hub
 *  - 2FA Management (Authenticator / SMS)
 *  - Biometrics (Fingerprint / Face ID)
 *  - Password management
 *  - Anti-phishing code
 *  - Device management
 *  - Login activity
 *  - Security notifications
 *  - Withdrawal whitelist
 *
 *  Guidelines compliance:
 *  - §14.1: Security Center screens
 *  - §14.2: Sensitive data masking
 *  - §14.3: High-risk actions require preview + confirm
 *  - §21.4: Header with breadcrumb auto-enabled
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  Settings,
  Bell,
  FileKey,
  UserCheck,
  Fingerprint,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface SecuritySetting {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inactive' | 'warning';
  icon: React.ElementType;
  action?: string;
  onClick?: () => void;
}

interface LoginSession {
  id: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: string;
  ip: string;
  lastActive: string;
  isCurrent?: boolean;
}

const SECURITY_SCORE = 85;

const SECURITY_SETTINGS: SecuritySetting[] = [
  {
    id: '2fa',
    title: 'Xác thực 2 bước (2FA)',
    description: 'Google Authenticator đã bật',
    status: 'active',
    icon: ShieldCheck,
    action: 'Quản lý',
  },
  {
    id: 'sms',
    title: 'Xác thực SMS',
    description: '+84 ••• ••• 1234',
    status: 'active',
    icon: Smartphone,
    action: 'Thay đổi',
  },
  {
    id: 'biometric',
    title: 'Sinh trắc học',
    description: 'Vân tay đã bật',
    status: 'active',
    icon: Fingerprint,
    action: 'Cài đặt',
  },
  {
    id: 'password',
    title: 'Mật khẩu đăng nhập',
    description: 'Đổi lần cuối: 45 ngày trước',
    status: 'active',
    icon: Lock,
    action: 'Đổi mật khẩu',
  },
  {
    id: 'anti-phishing',
    title: 'Mã chống lừa đảo',
    description: 'Đã cài đặt: SEC•••78',
    status: 'active',
    icon: ShieldAlert,
    action: 'Xem',
  },
  {
    id: 'withdrawal-whitelist',
    title: 'Whitelist địa chỉ rút tiền',
    description: '3 địa chỉ đã được phê duyệt',
    status: 'active',
    icon: UserCheck,
    action: 'Quản lý',
  },
];

const SECURITY_RECOMMENDATIONS: SecuritySetting[] = [
  {
    id: 'passkey',
    title: 'Passkey (WebAuthn)',
    description: 'Bảo mật cao hơn với khóa sinh trắc học',
    status: 'inactive',
    icon: FileKey,
    action: 'Kích hoạt',
  },
];

const LOGIN_SESSIONS: LoginSession[] = [
  {
    id: 's1',
    device: 'Chrome on Windows',
    deviceType: 'desktop',
    location: 'Hồ Chí Minh, Việt Nam',
    ip: '123.45.67.89',
    lastActive: '5 phút trước',
    isCurrent: true,
  },
  {
    id: 's2',
    device: 'iPhone 15 Pro',
    deviceType: 'mobile',
    location: 'Hồ Chí Minh, Việt Nam',
    ip: '123.45.67.90',
    lastActive: '2 giờ trước',
  },
  {
    id: 's3',
    device: 'Safari on macOS',
    deviceType: 'desktop',
    location: 'Hà Nội, Việt Nam',
    ip: '98.76.54.32',
    lastActive: '1 ngày trước',
  },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebSecurityCenterPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [showIP, setShowIP] = useState(false);

  // Map setting IDs to their routes
  const settingRoutes: Record<string, string> = {
    '2fa': '/w/profile/security/two-factor-auth',
    sms: '/w/profile/security/two-factor-auth',
    'anti-phishing': '/w/profile/security/anti-phishing',
    biometric: '/w/profile/security/passkey',
    'withdrawal-whitelist': '/w/profile/security/withdrawal-whitelist',
    passkey: '/w/profile/security/passkey',
    password: '/w/profile/security/change-password',
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusColor = (status: SecuritySetting['status']) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'inactive':
        return '#94A3B8';
    }
  };

  const getDeviceIcon = (type: LoginSession['deviceType']) => {
    switch (type) {
      case 'desktop':
        return Monitor;
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Monitor;
    }
  };

  return (
    <PageLayout>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* ═══ LEFT SIDEBAR (280px) ═══ */}
        <div
          className="flex flex-col"
          style={{
            width: 280,
            background: c.surface,
            borderRight: `1px solid ${c.divider}`,
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            maxHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5"
            style={{
              height: 60,
              borderBottom: `1px solid ${c.divider}`,
            }}
          >
            <h2
              style={{
                color: c.text1,
                fontSize: WEB_FONT.xl,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Trung tâm bảo mật
            </h2>
            {/* Score badge */}
            <div
              className="flex items-center gap-1.5 cursor-pointer"
              onClick={() => navigate('/w/profile/security/security-audit')}
              title="Điểm bảo mật — Nhấn để xem chi tiết"
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                background: `${getScoreColor(SECURITY_SCORE)}12`,
                border: `1px solid ${getScoreColor(SECURITY_SCORE)}30`,
              }}
            >
              <Shield size={12} color={getScoreColor(SECURITY_SCORE)} />
              <span
                style={{
                  color: getScoreColor(SECURITY_SCORE),
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                }}
              >
                {SECURITY_SCORE}
              </span>
            </div>
          </div>

          {/* Security Score Card */}
          <div
            className="mx-4 mt-4 p-4 rounded-xl cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${getScoreColor(SECURITY_SCORE)}15, ${getScoreColor(SECURITY_SCORE)}05)`,
              border: `1px solid ${getScoreColor(SECURITY_SCORE)}40`,
            }}
            onClick={() => navigate('/w/profile/security/security-audit')}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 48,
                  height: 48,
                  background: getScoreColor(SECURITY_SCORE),
                }}
              >
                <Shield size={24} color="#fff" />
              </div>
              <div>
                <div style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 700 }}>
                  Điểm bảo mật
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: getScoreColor(SECURITY_SCORE),
                    lineHeight: 1,
                  }}
                >
                  {SECURITY_SCORE}
                  <span style={{ fontSize: 16, fontWeight: 600, opacity: 0.7 }}>/100</span>
                </div>
              </div>
            </div>
            <div style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
              Tài khoản của bạn được bảo vệ tốt. Kích hoạt Passkey để đạt 100 điểm.
            </div>
            <div
              className="flex items-center gap-1 mt-2"
              style={{
                color: getScoreColor(SECURITY_SCORE),
                fontSize: WEB_FONT.xs,
                fontWeight: 600,
              }}
            >
              Xem đánh giá chi tiết
              <ChevronRight size={12} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 mt-5">
            <div
              style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 12 }}
            >
              Thao tác nhanh
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/w/profile/security/security-audit')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <Shield size={WEB_ICON.sm} />
                Đánh giá bảo mật
              </button>
              <button
                onClick={() => navigate('/w/profile/security/login-activity')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <Clock size={WEB_ICON.sm} />
                Lịch sử đăng nhập
              </button>
              <button
                onClick={() => navigate('/w/profile/security/withdrawal-whitelist')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <FileKey size={WEB_ICON.sm} />
                Whitelist rút tiền
              </button>
              <button
                onClick={() => navigate('/w/profile/devices')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <Smartphone size={WEB_ICON.sm} />
                Quản lý thiết bị
              </button>
              <button
                onClick={() => navigate('/w/profile/security/notifications')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <Bell size={WEB_ICON.sm} />
                Thông báo bảo mật
              </button>
              <button
                onClick={() => navigate('/w/profile/security/session-management')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <Monitor size={WEB_ICON.sm} />
                Quản lý phiên
              </button>
              <button
                onClick={() => navigate('/w/profile/security/change-password')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <Lock size={WEB_ICON.sm} />
                Đổi mật khẩu
              </button>
              <button
                onClick={() => navigate('/w/profile/security/two-factor-auth')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={WEB_ICON.sm} />
                Quản lý 2FA
              </button>
              <button
                onClick={() => navigate('/w/profile/security/device-trust')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <Fingerprint size={WEB_ICON.sm} />
                Chi tiết thiết bị
              </button>
              <button
                onClick={() => navigate('/w/profile/security/alert-list')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: 'rgba(239,68,68,0.04)',
                  border: `1px solid rgba(239,68,68,0.15)`,
                  color: '#EF4444',
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={WEB_ICON.sm} />
                Cảnh báo bảo mật
                <span
                  style={{
                    marginLeft: 'auto',
                    padding: '0px 6px',
                    borderRadius: 8,
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  2
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-8">
            {/* Security Settings Section */}
            <section className="mb-8">
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Cài đặt bảo mật
              </h3>

              <div className="flex flex-col gap-3">
                {SECURITY_SETTINGS.map((setting) => {
                  const Icon = setting.icon;
                  return (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer"
                      style={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                      }}
                      onClick={() => {
                        if (settingRoutes[setting.id]) {
                          navigate(settingRoutes[setting.id]);
                        } else if (setting.onClick) {
                          setting.onClick();
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex items-center justify-center rounded-xl"
                          style={{
                            width: 36,
                            height: 36,
                            background: `${getStatusColor(setting.status)}15`,
                          }}
                        >
                          <Icon size={WEB_ICON.md} color={getStatusColor(setting.status)} />
                        </div>
                        <div>
                          <div style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600 }}>
                            {setting.title}
                          </div>
                          <div style={{ color: c.text2, fontSize: WEB_FONT.xs, marginTop: 2 }}>
                            {setting.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {setting.status === 'active' && (
                          <div
                            className="flex items-center gap-1 px-2 py-1 rounded-md"
                            style={{
                              background: '#10B98115',
                              color: '#10B981',
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                            }}
                          >
                            <Check size={12} />
                            Đã bật
                          </div>
                        )}
                        {setting.action && (
                          <button
                            className="px-3 py-1.5 rounded-lg transition-colors"
                            style={{
                              background: c.bg,
                              border: `1px solid ${c.border}`,
                              color: c.text2,
                              fontSize: WEB_FONT.xs,
                              fontWeight: 600,
                            }}
                          >
                            {setting.action}
                          </button>
                        )}
                        <ChevronRight size={WEB_ICON.sm} color={c.text3} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recommendations */}
            {SECURITY_RECOMMENDATIONS.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={WEB_ICON.sm} color="#F59E0B" />
                  <h3
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.lg,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Đề xuất nâng cao bảo mật
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {SECURITY_RECOMMENDATIONS.map((rec) => {
                    const Icon = rec.icon;
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer"
                        style={{
                          background: c.surface,
                          border: `1px solid ${c.border}`,
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="flex items-center justify-center rounded-xl"
                            style={{
                              width: 36,
                              height: 36,
                              background: '#F59E0B15',
                            }}
                          >
                            <Icon size={WEB_ICON.md} color="#F59E0B" />
                          </div>
                          <div>
                            <div
                              style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600 }}
                            >
                              {rec.title}
                            </div>
                            <div style={{ color: c.text2, fontSize: WEB_FONT.xs, marginTop: 2 }}>
                              {rec.description}
                            </div>
                          </div>
                        </div>
                        <button
                          className="px-4 py-2 rounded-lg transition-colors"
                          style={{
                            background: '#3B82F6',
                            color: '#fff',
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                            border: 'none',
                          }}
                          onClick={() => {
                            if (settingRoutes[rec.id]) {
                              navigate(settingRoutes[rec.id]);
                            }
                          }}
                        >
                          {rec.action}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Login Sessions */}
            <section>
              <h3
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.lg,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Phiên đăng nhập
              </h3>

              <div className="flex flex-col gap-3">
                {LOGIN_SESSIONS.map((session) => {
                  const DeviceIcon = getDeviceIcon(session.deviceType);
                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{
                        background: c.surface,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex items-center justify-center rounded-xl"
                          style={{
                            width: 36,
                            height: 36,
                            background: session.isCurrent ? '#3B82F615' : `${c.text3}15`,
                          }}
                        >
                          <DeviceIcon
                            size={WEB_ICON.md}
                            color={session.isCurrent ? '#3B82F6' : c.text3}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              style={{ color: c.text1, fontSize: WEB_FONT.base, fontWeight: 600 }}
                            >
                              {session.device}
                            </span>
                            {session.isCurrent && (
                              <span
                                className="px-2 py-0.5 rounded-md"
                                style={{
                                  background: '#10B98115',
                                  color: '#10B981',
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                Hiện tại
                              </span>
                            )}
                          </div>
                          <div
                            className="flex items-center gap-3 mt-1"
                            style={{ color: c.text2, fontSize: WEB_FONT.xs }}
                          >
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {session.location}
                            </span>
                            <span>•</span>
                            <span>{showIP ? session.ip : '•••.•••.•••.•••'}</span>
                            <span>•</span>
                            <span>{session.lastActive}</span>
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          className="px-3 py-1.5 rounded-lg transition-colors"
                          style={{
                            background: 'transparent',
                            border: `1px solid #EF444440`,
                            color: '#EF4444',
                            fontSize: WEB_FONT.xs,
                            fontWeight: 600,
                          }}
                        >
                          Đăng xuất
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowIP(!showIP)}
                className="mt-3 flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text2,
                  fontSize: WEB_FONT.xs,
                  fontWeight: 600,
                }}
              >
                {showIP ? <EyeOff size={14} /> : <Eye size={14} />}
                {showIP ? 'Ẩn IP' : 'Hiện IP'}
              </button>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
