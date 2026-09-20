import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Timer, ArrowRight, Shield, Info, LogIn, ArrowLeft, RefreshCw } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * WebSessionExpiredPage — Session expired, user needs to re-login.
 *
 * Route: /w/auth/session-expired
 * Receives via location.state: { email, reason, returnTo }
 *
 * Reasons:
 *   - timeout      → Session timed out due to inactivity
 *   - token        → Session token expired
 *   - security     → Logged out for security reasons (password change, new device, etc.)
 *   - concurrent   → Another session took over
 *
 * Features:
 * - Reason-aware messaging
 * - Return-to-page awareness (remembers where user was)
 * - Quick re-login
 * - Security tip context
 */

type ExpiredReason = 'timeout' | 'token' | 'security' | 'concurrent';

const REASON_CONFIG: Record<
  ExpiredReason,
  {
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    tipTitle: string;
    tipBody: string;
  }
> = {
  timeout: {
    title: 'Phiên đã hết hạn',
    description:
      'Phiên đăng nhập đã hết hạn do không hoạt động trong thời gian dài. Vui lòng đăng nhập lại để tiếp tục.',
    icon: Timer,
    iconColor: '#F59E0B',
    tipTitle: 'Vì sao phiên hết hạn?',
    tipBody:
      'Để bảo vệ tài khoản, hệ thống tự động đăng xuất sau một khoảng thời gian không hoạt động. Bạn có thể điều chỉnh thời gian phiên trong cài đặt bảo mật.',
  },
  token: {
    title: 'Phiên đăng nhập đã hết hạn',
    description: 'Token xác thực đã hết hiệu lực. Điều này xảy ra định kỳ để bảo mật tài khoản.',
    icon: RefreshCw,
    iconColor: '#3B82F6',
    tipTitle: 'Đây là hoạt động bình thường',
    tipBody:
      'Token đăng nhập được làm mới định kỳ để đảm bảo an toàn. Bạn chỉ cần đăng nhập lại bình thường.',
  },
  security: {
    title: 'Đã đăng xuất vì lý do bảo mật',
    description:
      'Tài khoản đã được đăng xuất do một thay đổi bảo mật quan trọng. Vui lòng đăng nhập lại với thông tin cập nhật.',
    icon: Shield,
    iconColor: '#EF4444',
    tipTitle: 'Các thay đổi có thể gây đăng xuất',
    tipBody:
      'Đổi mật khẩu, bật/tắt 2FA, xóa thiết bị tin cậy, hoặc phát hiện đăng nhập bất thường sẽ khiến tất cả phiên đang hoạt động bị đăng xuất.',
  },
  concurrent: {
    title: 'Đã đăng nhập từ thiết bị khác',
    description:
      'Phiên hiện tại đã bị thay thế do đăng nhập từ một thiết bị hoặc trình duyệt khác.',
    icon: LogIn,
    iconColor: '#8B5CF6',
    tipTitle: 'Không phải bạn đăng nhập?',
    tipBody:
      'Nếu bạn không đăng nhập từ thiết bị khác, tài khoản có thể bị xâm phạm. Hãy đổi mật khẩu ngay và kiểm tra danh sách thiết bị.',
  },
};

export function WebSessionExpiredPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();

  const state = location.state as {
    email?: string;
    reason?: string;
    returnTo?: string;
  } | null;

  const email = state?.email || '';
  const reason = (state?.reason || 'timeout') as ExpiredReason;
  const returnTo = state?.returnTo || '/w/home';
  const config = REASON_CONFIG[reason] || REASON_CONFIG.timeout;

  const [showTip, setShowTip] = useState(false);

  const IconComp = config.icon;

  /* ─── Mask email ─── */
  const maskEmail = (val: string) => {
    if (!val.includes('@')) return '';
    const [local, domain] = val.split('@');
    return `${local.slice(0, 2)}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
  };

  const handleReLogin = () => {
    navigate('/w/auth/login', {
      state: { email, returnTo },
    });
  };

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline="Phiên của bạn đã kết thúc. Đăng nhập lại để tiếp tục sử dụng nền tảng an toàn." />

      <WebAuthFormShell textColor={c.text1}>
        {/* Header */}
        <div className="flex flex-col items-center" style={{ paddingTop: 12, marginBottom: 28 }}>
          {/* Icon with glow */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                background: `${config.iconColor}0a`,
                border: `2px solid ${config.iconColor}18`,
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `${config.iconColor}10`,
                }}
              >
                <IconComp size={28} color={config.iconColor} />
              </div>
            </div>
          </div>

          <h1
            style={{
              color: c.text1,
              fontSize: WEB_FONT['2xl'],
              fontWeight: 700,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {config.title}
          </h1>
          <p
            style={{
              color: c.text2,
              fontSize: WEB_FONT.md,
              lineHeight: 1.5,
              textAlign: 'center',
              maxWidth: 380,
            }}
          >
            {config.description}
          </p>
        </div>

        {/* Account info */}
        {email && (
          <div
            className="flex items-center justify-center gap-2"
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: c.surface,
              border: `1px solid ${c.borderSolid}`,
              marginBottom: 24,
            }}
          >
            <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Tài khoản:</span>
            <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 500 }}>
              {maskEmail(email)}
            </span>
          </div>
        )}

        {/* Return-to notice */}
        {returnTo && returnTo !== '/w/home' && (
          <div
            className="flex items-center gap-3"
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(59,130,246,0.04)',
              border: '1px solid rgba(59,130,246,0.1)',
              marginBottom: 20,
            }}
          >
            <Info size={16} color="#3B82F6" className="shrink-0" />
            <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.4 }}>
              Bạn sẽ được chuyển về trang trước đó sau khi đăng nhập thành công.
            </p>
          </div>
        )}

        {/* Primary CTA */}
        <button
          onClick={handleReLogin}
          className="flex items-center justify-center gap-2"
          style={{
            height: WEB_BUTTON.lg,
            borderRadius: 10,
            width: '100%',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            color: '#fff',
            fontSize: WEB_FONT.md,
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
            marginBottom: 12,
          }}
        >
          Đăng nhập lại
          <ArrowRight size={16} />
        </button>

        {/* Secondary actions */}
        {reason === 'security' && (
          <button
            onClick={() => navigate('/w/auth/forgot-password')}
            className="flex items-center justify-center gap-2"
            style={{
              height: WEB_BUTTON.lg,
              borderRadius: 10,
              width: '100%',
              background: c.surface,
              color: c.text1,
              fontSize: WEB_FONT.md,
              fontWeight: 500,
              cursor: 'pointer',
              border: `1.5px solid ${c.borderSolid}`,
              marginBottom: 12,
            }}
          >
            <Shield size={16} color={c.text2} />
            Đổi mật khẩu
          </button>
        )}

        {reason === 'concurrent' && (
          <button
            onClick={() => navigate('/w/auth/forgot-password')}
            className="flex items-center justify-center gap-2"
            style={{
              height: WEB_BUTTON.lg,
              borderRadius: 10,
              width: '100%',
              background: 'rgba(239,68,68,0.06)',
              color: '#EF4444',
              fontSize: WEB_FONT.md,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1.5px solid rgba(239,68,68,0.2)',
              marginBottom: 12,
            }}
          >
            <Shield size={16} />
            Không phải tôi — Bảo vệ tài khoản
          </button>
        )}

        {/* Expandable info/tip */}
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowTip(!showTip)}
            className="flex items-center gap-2"
            style={{
              color: c.text3,
              fontSize: WEB_FONT.sm,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              width: '100%',
            }}
          >
            <Info size={14} />
            <span>{config.tipTitle}</span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                transform: showTip ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              ▼
            </span>
          </button>

          {showTip && (
            <div
              style={{
                marginTop: 10,
                padding: '14px 16px',
                borderRadius: 10,
                background: c.surface,
                border: `1px solid ${c.borderSolid}`,
              }}
            >
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6 }}>
                {config.tipBody}
              </p>

              {/* Extra actions for security reason */}
              {(reason === 'security' || reason === 'concurrent') && (
                <div
                  className="flex flex-col"
                  style={{
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${c.borderSolid}`,
                  }}
                >
                  <p
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    Khuyến nghị
                  </p>
                  <ul
                    style={{
                      color: c.text3,
                      fontSize: WEB_FONT.xs,
                      lineHeight: 1.7,
                      paddingLeft: 16,
                      margin: 0,
                    }}
                  >
                    <li>Đổi mật khẩu bằng mật khẩu mạnh, duy nhất</li>
                    <li>Bật xác thực 2 bước (2FA) nếu chưa bật</li>
                    <li>Kiểm tra lịch sử đăng nhập & thiết bị</li>
                    <li>Liên hệ hỗ trợ nếu nghi ngờ bị xâm phạm</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            Cần trợ giúp?{' '}
            <button
              className="hover:underline"
              style={{
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Liên hệ hỗ trợ
            </button>{' '}
            ·{' '}
            <button
              className="hover:underline"
              style={{
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Trung tâm trợ giúp
            </button>
          </p>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
