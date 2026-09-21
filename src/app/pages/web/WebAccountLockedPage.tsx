import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Lock,
  ArrowLeft,
  Clock,
  ShieldAlert,
  Mail,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * WebAccountLockedPage — Account temporarily locked after too many failed login attempts.
 *
 * Route: /w/auth/account-locked
 * Receives via location.state: { email, unlockTime, attempts }
 *
 * Features:
 * - Countdown timer until auto-unlock
 * - Email unlock / support contact options
 * - Security tips
 * - Return to login when unlocked
 */

const DEFAULT_LOCK_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export function WebAccountLockedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();

  const state = location.state as {
    email?: string;
    unlockTime?: number; // timestamp ms
    attempts?: number;
  } | null;

  const email = state?.email || '';
  const attempts = state?.attempts || MAX_ATTEMPTS;
  const unlockTime = state?.unlockTime || Date.now() + DEFAULT_LOCK_MINUTES * 60 * 1000;

  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((unlockTime - Date.now()) / 1000)),
  );
  const [unlockEmailSent, setUnlockEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isUnlocked = remaining <= 0;

  /* ─── Countdown ─── */
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((unlockTime - Date.now()) / 1000));
      setRemaining(left);
    }, 1000);
    return () => clearInterval(id);
  }, [unlockTime, remaining]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  /* ─── Send unlock email (demo) ─── */
  const handleSendUnlockEmail = async () => {
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSending(false);
    setUnlockEmailSent(true);
  };

  /* ─── Mask email ─── */
  const maskEmail = (val: string) => {
    if (!val.includes('@')) return val || '•••@•••.•••';
    const [local, domain] = val.split('@');
    return `${local.slice(0, 2)}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
  };

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline="Tài khoản bị tạm khóa vì lý do bảo mật. Vui lòng đợi hoặc liên hệ hỗ trợ để mở khóa." />

      <WebAuthFormShell textColor={c.text1}>
        {/* Back link */}
        <button
          onClick={() => navigate('/w/auth/login')}
          className="flex items-center hover:underline"
          style={{
            gap: 6,
            color: c.text2,
            fontSize: WEB_FONT.sm,
            marginBottom: 32,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </button>

        {!isUnlocked ? (
          /* ═══════════════════════════════════════
             LOCKED STATE
             ═══════════════════════════════════════ */
          <div>
            {/* Header */}
            <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: 'rgba(239,68,68,0.08)',
                  marginBottom: 20,
                  border: '2px solid rgba(239,68,68,0.15)',
                }}
              >
                <Lock size={32} color="#EF4444" />
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
                Tài khoản tạm khóa
              </h1>
              <p
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.md,
                  lineHeight: 1.5,
                  textAlign: 'center',
                  maxWidth: 360,
                }}
              >
                Tài khoản đã bị khóa tạm thời sau{' '}
                <span style={{ color: '#EF4444', fontWeight: 600 }}>
                  {attempts} lần đăng nhập thất bại
                </span>{' '}
                liên tiếp.
              </p>
            </div>

            {/* Countdown timer */}
            <div
              className="flex flex-col items-center"
              style={{
                padding: '24px 20px',
                borderRadius: 16,
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.12)',
                marginBottom: 24,
              }}
            >
              <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                <Clock size={18} color="#EF4444" />
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                  Tự động mở khóa sau
                </span>
              </div>
              <div
                style={{
                  color: '#EF4444',
                  fontSize: 36,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: 2,
                  fontFamily: 'monospace',
                }}
              >
                {formatTime(remaining)}
              </div>
              <div
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  marginTop: 16,
                  background: 'rgba(239,68,68,0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 2,
                    background: '#EF4444',
                    width: `${Math.max(0, (remaining / (DEFAULT_LOCK_MINUTES * 60)) * 100)}%`,
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </div>

            {/* Account info */}
            {email && (
              <div
                className="flex items-center gap-3"
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: c.surface,
                  border: `1px solid ${c.borderSolid}`,
                  marginBottom: 20,
                }}
              >
                <Mail size={16} color={c.text3} className="shrink-0" />
                <div>
                  <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 2 }}>
                    Tài khoản bị ảnh hưởng
                  </p>
                  <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 500 }}>
                    {maskEmail(email)}
                  </p>
                </div>
              </div>
            )}

            {/* Unlock via email */}
            {!unlockEmailSent ? (
              <button
                onClick={handleSendUnlockEmail}
                disabled={isSending}
                className="flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  width: '100%',
                  background: isSending
                    ? c.surface2
                    : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                  color: '#fff',
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  border: 'none',
                  boxShadow: isSending ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
                  marginBottom: 12,
                  transition: 'all 0.15s ease',
                }}
              >
                {isSending ? (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                ) : (
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <Mail size={16} />
                    Gửi email mở khóa
                  </div>
                )}
              </button>
            ) : (
              <div
                className="flex items-start gap-3"
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  marginBottom: 12,
                }}
              >
                <Mail size={18} color="#10B981" className="shrink-0" style={{ marginTop: 1 }} />
                <div>
                  <p
                    style={{
                      color: '#10B981',
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    Email mở khóa đã gửi!
                  </p>
                  <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
                    Kiểm tra hộp thư{' '}
                    <span style={{ fontWeight: 500, color: c.text1 }}>{maskEmail(email)}</span> và
                    nhấn link để mở khóa tài khoản ngay lập tức.
                  </p>
                </div>
              </div>
            )}

            {/* Forgot password link */}
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
                marginBottom: 24,
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldAlert size={16} color={c.text2} />
              Không phải tôi? Đặt lại mật khẩu
            </button>

            {/* Security tips */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 12,
                background: 'rgba(245,158,11,0.04)',
                border: '1px solid rgba(245,158,11,0.12)',
                marginBottom: 20,
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                <AlertTriangle size={14} color="#F59E0B" />
                <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
                  Gợi ý bảo mật
                </span>
              </div>
              <ul
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  lineHeight: 1.7,
                  paddingLeft: 16,
                  margin: 0,
                }}
              >
                <li>
                  Nếu bạn không thực hiện các lần đăng nhập này, hãy{' '}
                  <strong style={{ color: c.text1 }}>đổi mật khẩu ngay</strong>
                </li>
                <li>Sử dụng mật khẩu mạnh, không trùng với dịch vụ khác</li>
                <li>
                  Bật <strong style={{ color: c.text1 }}>xác thực 2 bước (2FA)</strong> để tăng
                  cường bảo mật
                </li>
                <li>Kiểm tra lại thiết bị đã đăng nhập trong cài đặt bảo mật</li>
              </ul>
            </div>

            {/* Contact support */}
            <div className="flex items-center justify-center" style={{ gap: 6 }}>
              <HelpCircle size={14} color={c.text3} />
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
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
                </button>
              </span>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════
             UNLOCKED STATE — Timer expired
             ═══════════════════════════════════════ */
          <div>
            <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: 'rgba(16,185,129,0.08)',
                  marginBottom: 20,
                  border: '2px solid rgba(16,185,129,0.15)',
                }}
              >
                <ShieldAlert size={32} color="#10B981" />
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
                Tài khoản đã mở khóa
              </h1>
              <p
                style={{
                  color: c.text2,
                  fontSize: WEB_FONT.md,
                  lineHeight: 1.5,
                  textAlign: 'center',
                  maxWidth: 360,
                }}
              >
                Thời gian khóa đã hết. Bạn có thể thử đăng nhập lại. Lưu ý kiểm tra mật khẩu trước
                khi đăng nhập.
              </p>
            </div>

            {/* Warning */}
            <div
              className="flex items-start gap-3"
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
                marginBottom: 24,
              }}
            >
              <AlertTriangle
                size={16}
                color="#F59E0B"
                className="shrink-0"
                style={{ marginTop: 1 }}
              />
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                Tài khoản sẽ bị khóa lại nếu tiếp tục nhập sai. Hãy{' '}
                <strong style={{ color: c.text1 }}>đặt lại mật khẩu</strong> nếu không nhớ.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/w/auth/login', { replace: true })}
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
              }}
            >
              Đặt lại mật khẩu
            </button>
          </div>
        )}
      </WebAuthFormShell>
    </div>
  );
}
