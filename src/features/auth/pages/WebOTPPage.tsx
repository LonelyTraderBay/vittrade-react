import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, AlertCircle, ShieldCheck, Smartphone, Mail } from 'lucide-react';
import { isDevelopmentBuild } from '@/shared/config/env';
import { isApiError } from '@/shared/api/api-error';
import { useAuth } from '@/shared/session/useAuth';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '@/shared/theme/webTokens';
import { WebAuthBrandPanel, WebAuthFormShell } from '@/shared/ui/auth/WebAuthBrandPanel';
import { parseLoginMfaChallengeState } from '../lib/login-mfa-route-state';

/**
 * WebOTPPage — Enterprise Desktop OTP Verification
 * 2-column layout with animated brand panel.
 *
 * Features:
 * - 6-digit input boxes with auto-focus + auto-advance
 * - Paste support (full 6-digit paste)
 * - Auto-submit when all 6 digits entered
 * - Supports contract-backed MFA login and development-only registration
 * - Success state with animated checkmark
 *
 * Route: /w/auth/otp
 * Receives a login challenge via location.state, or a development registration state.
 */

type Purpose = 'register' | '2fa';

export function WebOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMfa, verifyLoginMfa } = useAuth();
  const c = useThemeColors();

  const state = location.state as {
    challengeId?: string;
    method?: string;
    maskedDestination?: string;
    expiresAt?: string;
    contact?: string;
    type?: string;
    purpose?: string;
  } | null;
  const registrationFlow =
    state?.purpose === 'register' && Boolean(state.contact) && isDevelopmentBuild;
  const loginChallenge = parseLoginMfaChallengeState(state);
  const loginChallengeExpiry = loginChallenge?.expiresAt;
  const challengeIsValid = registrationFlow || Boolean(loginChallenge);
  const purpose: Purpose = registrationFlow ? 'register' : '2fa';
  const contact = registrationFlow
    ? (state?.contact ?? '')
    : (loginChallenge?.maskedDestination ?? '');
  const contactType = registrationFlow
    ? (state?.type ?? 'email')
    : loginChallenge?.method === 'sms'
      ? 'phone'
      : loginChallenge?.method === 'totp'
        ? 'totp'
        : 'email';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ─── Auto-focus first input ─── */
  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 200);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!challengeIsValid) navigate('/w/auth/login', { replace: true });
  }, [challengeIsValid, navigate]);
  useEffect(() => {
    if (!loginChallengeExpiry) return;
    let timeout: ReturnType<typeof setTimeout>;
    const checkExpiry = () => {
      const remaining = Date.parse(loginChallengeExpiry) - Date.now();
      if (remaining <= 0) {
        navigate('/w/auth/login', { replace: true });
      } else {
        timeout = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647));
      }
    };
    timeout = setTimeout(
      checkExpiry,
      Math.min(Math.max(0, Date.parse(loginChallengeExpiry) - Date.now()), 2_147_483_647),
    );
    return () => clearTimeout(timeout);
  }, [loginChallengeExpiry, navigate]);

  /* ─── Verify OTP ─── */
  const handleVerify = useCallback(
    async (code: string) => {
      if (!challengeIsValid || isLoading) return;
      if (loginChallenge && Date.now() >= Date.parse(loginChallenge.expiresAt)) {
        navigate('/w/auth/login', { replace: true });
        return;
      }
      setIsLoading(true);
      setError('');
      try {
        if (loginChallenge) {
          await verifyLoginMfa({ challengeId: loginChallenge.id, code });
        } else {
          await verifyMfa({ contact, code, purpose: 'register' });
        }
        setSuccess(true);
        setIsLoading(false);
        // Auto-navigate after success animation
        setTimeout(() => {
          if (purpose === 'register') {
            navigate('/w/auth/2fa-setup', { replace: true });
          } else {
            navigate('/w/home', { replace: true });
          }
        }, 1800);
      } catch (verifyError) {
        if (loginChallenge && isApiError(verifyError)) {
          if (verifyError.status === 410) {
            navigate('/w/auth/login', { replace: true });
            setIsLoading(false);
            return;
          }
          if (verifyError.status === 423) {
            navigate('/w/auth/account-locked', { replace: true });
            setIsLoading(false);
            return;
          }
          if (verifyError.status === 429) {
            setError('Quá nhiều lần xác thực. Vui lòng chờ trước khi thử lại hoặc đăng nhập lại.');
          } else if (verifyError.status === 400) {
            setError('Mã xác thực không đúng. Vui lòng kiểm tra lại.');
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
          } else {
            setError('Không thể xác minh lúc này. Vui lòng thử lại.');
          }
        } else {
          setError(
            loginChallenge
              ? 'Không thể xác minh lúc này. Vui lòng thử lại.'
              : 'Mã xác thực không đúng. Vui lòng kiểm tra lại.',
          );
          setOtp(['', '', '', '', '', '']);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
        setIsLoading(false);
      }
    },
    [
      challengeIsValid,
      isLoading,
      purpose,
      navigate,
      verifyMfa,
      verifyLoginMfa,
      contact,
      loginChallenge,
    ],
  );

  /* ─── Input handlers ─── */
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all filled
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setOtp(digits);
      setError('');
      handleVerify(pasted);
    }
  };

  /* ─── Helpers ─── */
  const maskContact = (val: string) => {
    if (contactType === 'totp') return 'Ứng dụng xác thực';
    if (contactType === 'email') {
      const [local, domain] = val.split('@');
      if (!domain) return val;
      return `${local.slice(0, 2)}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
    }
    return val.replace(/(\d{3})\d{4}(\d{3})/, '$1 •••• $2');
  };

  const purposeTitle: Record<Purpose, string> = {
    register: 'Xác thực tài khoản',
    '2fa': 'Xác thực hai bước',
  };

  const purposeDesc: Record<Purpose, string> = {
    register: 'Nhập mã 6 số đã gửi để hoàn tất đăng ký tài khoản.',
    '2fa': 'Nhập mã xác thực 2FA để đăng nhập vào tài khoản.',
  };

  const backRoute = purpose === 'register' ? '/w/auth/register' : '/w/auth/login';

  const filled = otp.filter((d) => d !== '').length;

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline="Bảo vệ tài khoản với xác thực đa bước. Mỗi giao dịch đều được kiểm soát an toàn." />

      <WebAuthFormShell textColor={c.text1}>
        {/* Back link */}
        <button
          onClick={() => navigate(backRoute)}
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
          Quay lại
        </button>

        {!challengeIsValid ? (
          <div className="flex flex-col items-center text-center" style={{ paddingTop: 32 }}>
            <AlertCircle size={40} color="#EF4444" />
            <h1
              style={{
                color: c.text1,
                fontSize: WEB_FONT['2xl'],
                fontWeight: 700,
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              Phiên xác thực không hợp lệ
            </h1>
            <p role="alert" style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5 }}>
              Vui lòng đăng nhập lại để tạo thử thách xác thực mới.
            </p>
            <button
              onClick={() => navigate('/w/auth/login', { replace: true })}
              className="flex items-center justify-center gap-2"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                width: '100%',
                marginTop: 24,
                background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                color: '#fff',
                fontSize: WEB_FONT.md,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Quay lại đăng nhập
            </button>
          </div>
        ) : !success ? (
          <div>
            {/* Header */}
            <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: 'rgba(59,130,246,0.08)',
                  marginBottom: 16,
                }}
              >
                {contactType === 'email' ? (
                  <Mail size={28} color="#3B82F6" />
                ) : contactType === 'phone' ? (
                  <Smartphone size={28} color="#3B82F6" />
                ) : (
                  <ShieldCheck size={28} color="#3B82F6" />
                )}
              </div>
              <h1
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT['2xl'],
                  fontWeight: 700,
                  marginBottom: 6,
                  textAlign: 'center',
                }}
              >
                {purposeTitle[purpose]}
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
                {loginChallenge?.method === 'totp'
                  ? 'Mở ứng dụng xác thực đã liên kết và nhập mã 6 số hiện tại.'
                  : purposeDesc[purpose]}
              </p>
            </div>

            {/* Contact display */}
            <div
              className="flex items-center justify-center gap-2"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: c.surface,
                border: `1px solid ${c.borderSolid}`,
                marginBottom: 28,
              }}
            >
              {contactType === 'email' ? (
                <Mail size={14} color={c.text3} />
              ) : contactType === 'phone' ? (
                <Smartphone size={14} color={c.text3} />
              ) : (
                <ShieldCheck size={14} color={c.text3} />
              )}
              <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 500 }}>
                {maskContact(contact)}
              </span>
            </div>

            {/* OTP input boxes */}
            <div className="flex justify-center" style={{ gap: 10, marginBottom: 12 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  className="outline-none text-center"
                  style={{
                    width: 52,
                    height: 60,
                    borderRadius: 12,
                    border: `2px solid ${error ? '#EF4444' : digit ? '#3B82F6' : c.borderSolid}`,
                    background: digit ? 'rgba(59,130,246,0.04)' : c.surface,
                    color: c.text1,
                    fontSize: 24,
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                    caretColor: '#3B82F6',
                  }}
                />
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center" style={{ gap: 6, marginBottom: 20 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: i < filled ? '#3B82F6' : c.borderSolid,
                    transition: 'background 0.15s ease',
                  }}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2"
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  marginBottom: 20,
                }}
              >
                <AlertCircle size={14} color="#EF4444" className="shrink-0" />
                <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm }}>{error}</span>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div
                className="flex items-center justify-center"
                style={{ marginBottom: 20, gap: 8 }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '2px solid rgba(59,130,246,0.2)',
                    borderTopColor: '#3B82F6',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Đang xác thực...</span>
              </div>
            )}

            {/* The MFA contract has no resend or remembered-device operation yet. */}
            <div className="flex flex-col items-center" style={{ gap: 8, marginBottom: 28 }}>
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Không nhận được mã?</span>
              <button
                onClick={() => navigate('/w/auth/login', { replace: true })}
                className="hover:underline"
                style={{
                  color: '#3B82F6',
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Quay lại đăng nhập để thử lại
              </button>
            </div>

            {/* Help text */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: c.surface,
                border: `1px solid ${c.borderSolid}`,
              }}
            >
              <p
                style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.6, marginBottom: 8 }}
              >
                <span style={{ fontWeight: 600, color: c.text1 }}>Không nhận được mã?</span>
              </p>
              <ul
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  lineHeight: 1.6,
                  paddingLeft: 16,
                  margin: 0,
                }}
              >
                <li>Kiểm tra thư mục Spam / Junk trong hộp thư</li>
                <li>
                  {contactType === 'totp'
                    ? 'Đảm bảo đồng hồ trên thiết bị và ứng dụng xác thực đang đồng bộ.'
                    : `Đảm bảo ${contactType === 'email' ? 'email' : 'số điện thoại'} ${maskContact(contact)} chính xác.`}
                </li>
                {purpose === 'register' && <li>Thử gửi lại mã sau khi hết thời gian chờ</li>}
                <li>
                  Liên hệ{' '}
                  <button
                    className="hover:underline"
                    style={{
                      color: '#3B82F6',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                      padding: 0,
                    }}
                  >
                    hỗ trợ
                  </button>{' '}
                  nếu vẫn gặp vấn đề
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* ─── Success state ─── */
          <div className="flex flex-col items-center" style={{ paddingTop: 32 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                background: 'rgba(16,185,129,0.1)',
                marginBottom: 20,
              }}
            >
              <ShieldCheck size={36} color="#10B981" />
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
              Xác thực thành công!
            </h1>
            <p
              style={{
                color: c.text2,
                fontSize: WEB_FONT.md,
                lineHeight: 1.5,
                textAlign: 'center',
                maxWidth: 340,
                marginBottom: 28,
              }}
            >
              {purpose === 'register'
                ? 'Tài khoản đã được xác thực. Đang chuyển đến thiết lập bảo mật...'
                : 'Xác thực hai bước thành công. Đang đăng nhập...'}
            </p>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(16,185,129,0.3)',
                  borderTopColor: '#10B981',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Đang chuyển hướng...</span>
            </div>
          </div>
        )}

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
            </button>
          </p>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
