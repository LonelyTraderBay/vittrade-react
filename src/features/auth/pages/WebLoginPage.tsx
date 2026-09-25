import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, AlertCircle, Fingerprint, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/shared/session/useAuth';
import { env } from '@/shared/config/env';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '@/shared/theme/webTokens';
import { WebAuthBrandPanel, WebAuthFormShell } from '@/shared/ui/auth/WebAuthBrandPanel';

/**
 * WebLoginPage — Enterprise Desktop Login
 * 2-column layout: animated brand panel (left) + form panel (right)
 * Inline validation: email format on blur
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WebLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const c = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailBlurError, setEmailBlurError] = useState('');
  const [focusField, setFocusField] = useState<'email' | 'password' | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const MAX_ATTEMPTS = 5;

  const navigateAfterLogin = (loginResult: Awaited<ReturnType<typeof signIn>>) => {
    if (loginResult.status === 'mfa_required') {
      const { challenge } = loginResult;
      navigate('/w/auth/otp', {
        replace: true,
        state: {
          challengeId: challenge.id,
          method: challenge.method,
          maskedDestination: challenge.maskedDestination,
          expiresAt: challenge.expiresAt,
        },
      });
      return;
    }
    navigate('/w/home', { replace: true });
  };

  /* ─── Inline email validation on blur ─── */
  const handleEmailBlur = () => {
    setFocusField(null);
    if (email && !EMAIL_RE.test(email)) {
      setEmailBlurError('Định dạng email không hợp lệ');
    } else {
      setEmailBlurError('');
    }
  };

  const handleLogin = async () => {
    if (!email) {
      setError('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }
    if (emailBlurError) {
      setError(emailBlurError);
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    setError('');
    setIsLoading(true);
    // Development-only fixtures exercise the locked-account and challenge routes.
    // Production always delegates authentication to the backend adapter below.
    if ((env.isDev || env.isTest) && email === 'wrong@test.com') {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setIsLoading(false);

      if (newAttempts >= MAX_ATTEMPTS) {
        navigate('/w/auth/account-locked', {
          state: {
            email,
            attempts: newAttempts,
            unlockTime: Date.now() + 15 * 60 * 1000,
          },
        });
        return;
      }

      setError(
        `Mật khẩu không đúng. Còn ${MAX_ATTEMPTS - newAttempts} lần thử trước khi tài khoản bị khóa.`,
      );
      return;
    }

    if ((env.isDev || env.isTest) && email === 'device@test.com') {
      setIsLoading(false);
      navigate('/w/auth/device-trust', {
        state: { email, returnTo: '/w/home' },
      });
      return;
    }

    try {
      const loginResult = await signIn({ email, password });
      navigateAfterLogin(loginResult);
    } catch {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!env.isDev && !env.isTest) return;
    setIsLoading(true);
    try {
      const loginResult = await signIn({ email: 'demo@vittrade.vn', password: 'demo' });
      navigateAfterLogin(loginResult);
    } catch {
      setError('Không thể khởi tạo phiên demo.');
    } finally {
      setIsLoading(false);
    }
  };

  const emailBorder =
    focusField === 'email'
      ? '#3B82F6'
      : emailBlurError || (error && !email)
        ? '#EF4444'
        : c.borderSolid;

  const passwordBorder =
    focusField === 'password' ? '#3B82F6' : error && !password ? '#EF4444' : c.borderSolid;

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      {/* ═══ LEFT: Animated Brand Panel ═══ */}
      <WebAuthBrandPanel />

      {/* ═══ RIGHT: Form Panel ═══ */}
      <WebAuthFormShell textColor={c.text1}>
        {/* Form header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 6 }}
          >
            Đăng nhập
          </h1>
          <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5 }}>
            Chào mừng bạn quay lại! Nhập thông tin để truy cập tài khoản.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col" style={{ gap: 20 }}>
          {/* Email field */}
          <div>
            <label
              style={{
                display: 'block',
                color: c.text2,
                fontSize: WEB_FONT.sm,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Email / Số điện thoại
            </label>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                border: `1.5px solid ${emailBorder}`,
                background: c.surface,
                padding: '0 14px',
                gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              <Mail size={16} color={c.text3} className="shrink-0" />
              <input
                data-testid="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setEmailBlurError('');
                }}
                onFocus={() => setFocusField('email')}
                onBlur={handleEmailBlur}
                autoComplete="email"
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
            </div>
            {emailBlurError && !focusField && (
              <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
                <AlertCircle size={12} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{emailBlurError}</span>
              </div>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <label style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                Mật khẩu
              </label>
              <button
                onClick={() => navigate('/w/auth/forgot-password')}
                className="hover:underline"
                style={{
                  color: '#3B82F6',
                  fontSize: WEB_FONT.sm,
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Quên mật khẩu?
              </button>
            </div>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                border: `1.5px solid ${passwordBorder}`,
                background: c.surface,
                padding: '0 14px',
                gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              <Lock size={16} color={c.text3} className="shrink-0" />
              <input
                data-testid="auth-password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField(null)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPw ? <EyeOff size={16} color={c.text3} /> : <Eye size={16} color={c.text3} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertCircle size={14} color="#EF4444" className="shrink-0" />
              <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm }}>{error}</span>
            </div>
          )}

          {/* Login button */}
          <button
            data-testid="auth-submit"
            onClick={handleLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
            style={{
              height: WEB_BUTTON.lg,
              borderRadius: 10,
              background: isLoading
                ? c.surface2
                : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
              color: '#fff',
              fontSize: WEB_FONT.md,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              border: 'none',
              boxShadow: isLoading ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
              transition: 'all 0.15s ease',
              width: '100%',
            }}
          >
            {isLoading ? (
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
                Đăng nhập
                <ArrowRight size={16} />
              </div>
            )}
          </button>

          {/* Demo login is development/test-only and is excluded from production UI. */}
          {(env.isDev || env.isTest) && (
            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="flex items-center justify-center gap-2"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                background: c.surface,
                color: c.text1,
                fontSize: WEB_FONT.md,
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                border: `1.5px solid ${c.borderSolid}`,
                transition: 'all 0.15s ease',
                width: '100%',
              }}
            >
              <Fingerprint size={18} color="#3B82F6" />
              Trải nghiệm Demo
            </button>
          )}

          {/* Register link */}
          <div className="flex items-center justify-center" style={{ gap: 4, paddingTop: 4 }}>
            <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Chưa có tài khoản?</span>
            <button
              onClick={() => navigate('/w/auth/register')}
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
              Đăng ký ngay
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <button
              className="hover:underline"
              style={{ color: c.text2, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Điều khoản dịch vụ
            </button>{' '}
            và{' '}
            <button
              className="hover:underline"
              style={{ color: c.text2, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Chính sách bảo mật
            </button>{' '}
            của VitTrade.
          </p>
        </div>

        {/* Demo flow hints */}
        {(env.isDev || env.isTest) && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(59,130,246,0.03)',
              border: '1px dashed rgba(59,130,246,0.15)',
            }}
          >
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 6 }}>
              Demo flows:
            </p>
            <div className="flex flex-col" style={{ gap: 3 }}>
              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                <span style={{ color: '#8B5CF6', fontFamily: 'monospace', fontWeight: 500 }}>
                  device@test.com
                </span>{' '}
                → new device trust verification
              </p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                <span style={{ color: '#EF4444', fontFamily: 'monospace', fontWeight: 500 }}>
                  wrong@test.com
                </span>{' '}
                → failed attempts → account locked (sau 5 lần)
              </p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                Bất kỳ email khác → đăng nhập thành công
              </p>
            </div>
          </div>
        )}
      </WebAuthFormShell>
    </div>
  );
}
