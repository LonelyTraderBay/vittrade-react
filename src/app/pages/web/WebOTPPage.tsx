import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * WebOTPPage — Enterprise Desktop OTP Verification
 * 2-column layout with animated brand panel.
 *
 * Features:
 * - 6-digit input boxes with auto-focus + auto-advance
 * - Paste support (full 6-digit paste)
 * - Countdown timer + resend button
 * - Auto-submit when all 6 digits entered
 * - Purpose-aware routing (register → 2fa-setup, 2fa → home, verify → reset-password)
 * - Success state with animated checkmark
 *
 * Route: /w/auth/otp
 * Receives via location.state: { contact, type, purpose }
 */

const VALID_CODE = '123456'; // Demo: accept this code

type Purpose = 'register' | '2fa' | 'verify' | 'forgot-password';

export function WebOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const c = useThemeColors();

  const state = location.state as { contact?: string; type?: string; purpose?: string } | null;
  const contact = state?.contact || 'your@email.com';
  const contactType = state?.type || 'email';
  const purpose = (state?.purpose || 'verify') as Purpose;

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ─── Auto-focus first input ─── */
  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  /* ─── Countdown timer ─── */
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  /* ─── Verify OTP ─── */
  const handleVerify = useCallback(
    async (code: string) => {
      setIsLoading(true);
      setError('');
      await new Promise((r) => setTimeout(r, 1000));

      if (code === VALID_CODE) {
        setSuccess(true);
        setIsLoading(false);
        // Auto-navigate after success animation
        setTimeout(() => {
          if (purpose === 'register') {
            navigate('/w/auth/2fa-setup', { replace: true });
          } else if (purpose === '2fa') {
            login(contact, '');
            navigate('/w/home', { replace: true });
          } else if (purpose === 'forgot-password') {
            navigate('/w/auth/reset-password', {
              replace: true,
              state: { email: contact, token: 'valid-token' },
            });
          } else {
            navigate('/w/auth/reset-password', { replace: true });
          }
        }, 1800);
      } else {
        setError('Mã xác thực không đúng. Vui lòng kiểm tra lại.');
        setIsLoading(false);
        // Reset and refocus
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    },
    [purpose, navigate, login, contact],
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

  /* ─── Resend ─── */
  const handleResend = async () => {
    setIsResending(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsResending(false);
    setCanResend(false);
    setCountdown(59);
    setOtp(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  /* ─── Helpers ─── */
  const maskContact = (val: string) => {
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
    verify: 'Xác minh danh tính',
    'forgot-password': 'Xác thực email',
  };

  const purposeDesc: Record<Purpose, string> = {
    register: 'Nhập mã 6 số đã gửi để hoàn tất đăng ký tài khoản.',
    '2fa': 'Nhập mã xác thực 2FA để đăng nhập vào tài khoản.',
    verify: 'Nhập mã xác minh để tiếp tục thao tác.',
    'forgot-password': 'Nhập mã 6 số đã gửi để xác thực yêu cầu đặt lại mật khẩu.',
  };

  const backRoute =
    purpose === 'register'
      ? '/w/auth/register'
      : purpose === 'forgot-password'
        ? '/w/auth/forgot-password'
        : '/w/auth/login';

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

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

        {!success ? (
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
                ) : (
                  <Smartphone size={28} color="#3B82F6" />
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
                {purposeDesc[purpose]}
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
              ) : (
                <Smartphone size={14} color={c.text3} />
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

            {/* Resend section */}
            <div className="flex flex-col items-center" style={{ gap: 8, marginBottom: 28 }}>
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="flex items-center gap-2 hover:underline"
                  style={{
                    color: '#3B82F6',
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: isResending ? 'wait' : 'pointer',
                  }}
                >
                  <RefreshCw
                    size={14}
                    style={{ animation: isResending ? 'spin 0.7s linear infinite' : 'none' }}
                  />
                  {isResending ? 'Đang gửi lại...' : 'Gửi lại mã xác thực'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>Gửi lại sau</span>
                  <span
                    style={{
                      color: c.text1,
                      fontSize: WEB_FONT.sm,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatTime(countdown)}
                  </span>
                </div>
              )}
            </div>

            {/* Remember this device — only for 2FA flow */}
            {purpose === '2fa' && (
              <div style={{ marginBottom: 20 }}>
                <button
                  onClick={() => setRememberDevice(!rememberDevice)}
                  className="flex items-center"
                  style={{
                    gap: 12,
                    padding: '12px 16px',
                    borderRadius: 12,
                    width: '100%',
                    background: rememberDevice ? 'rgba(59,130,246,0.04)' : c.surface,
                    border: `1.5px solid ${rememberDevice ? '#3B82F6' : c.borderSolid}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background: rememberDevice ? '#3B82F6' : 'transparent',
                      border: `2px solid ${rememberDevice ? '#3B82F6' : c.borderSolid}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {rememberDevice && <CheckCircle size={13} color="#fff" strokeWidth={3} />}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p
                      style={{
                        color: c.text1,
                        fontSize: WEB_FONT.sm,
                        fontWeight: 500,
                        marginBottom: 2,
                      }}
                    >
                      Ghi nhớ thiết bị này
                    </p>
                    <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.3 }}>
                      Không yêu cầu xác thực 2FA trong 30 ngày trên thiết bị này
                    </p>
                  </div>
                </button>
              </div>
            )}

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
                  Đảm bảo {contactType === 'email' ? 'email' : 'số điện thoại'}{' '}
                  <span style={{ color: c.text2, fontWeight: 500 }}>{maskContact(contact)}</span>{' '}
                  chính xác
                </li>
                <li>Thử gửi lại mã sau khi hết thời gian chờ</li>
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

            {/* Demo hint */}
            <div
              className="flex items-center justify-center"
              style={{
                marginTop: 20,
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(59,130,246,0.04)',
                border: '1px dashed rgba(59,130,246,0.2)',
              }}
            >
              <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
                Demo: nhập{' '}
                <span style={{ color: '#3B82F6', fontWeight: 600, fontFamily: 'monospace' }}>
                  123456
                </span>{' '}
                để xác thực thành công
              </span>
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
                : purpose === '2fa'
                  ? 'Xác thực hai bước thành công. Đang đăng nhập...'
                  : purpose === 'forgot-password'
                    ? 'Email đã được xác thực. Đang chuyển đến đặt lại mật khẩu...'
                    : 'Xác minh thành công. Đang chuyển hướng...'}
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
