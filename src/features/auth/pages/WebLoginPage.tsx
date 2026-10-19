import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, AlertCircle, Fingerprint, Lock, Mail, ArrowRight } from 'lucide-react';
import { isApiError } from '@/shared/api/api-error';
import { useAuth } from '@/shared/session/useAuth';
import { env, isProductionBuild } from '@/shared/config/env';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '@/shared/theme/webTokens';
import { WebAuthBrandPanel, WebAuthFormShell } from '@/shared/ui/auth/WebAuthBrandPanel';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';

/**
 * WebLoginPage — Enterprise Desktop Login
 * 2-column layout: animated brand panel (left) + form panel (right)
 * Inline validation: email format on blur
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type LoginField = 'email' | 'password';
type LoginFieldErrors = Partial<Record<LoginField, string>>;

const isAuthFixtureMode =
  !isProductionBuild && (env.isTest || (env.isDev && env.dataSource === 'mock'));

export function WebLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const c = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [failedAttempts, setFailedAttempts] = useState(0);

  const MAX_ATTEMPTS = 5;

  const setFieldError = (field: LoginField, message?: string) => {
    setFieldErrors((current) => {
      const next = { ...current };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

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
    if (email && !EMAIL_RE.test(email)) {
      setFieldError('email', 'Định dạng email không hợp lệ');
    } else {
      setFieldError('email');
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!email) {
      setFieldErrors({ email: 'Vui lòng nhập email.' });
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setFieldErrors({ email: 'Định dạng email không hợp lệ' });
      return;
    }
    if (!password) {
      setFieldErrors({ password: 'Vui lòng nhập mật khẩu.' });
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    // Local fixture flows are available only in mock development and unit tests.
    if (isAuthFixtureMode && email === 'wrong@test.com') {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setIsLoading(false);

      if (newAttempts >= MAX_ATTEMPTS) {
        navigate('/w/auth/account-locked');
        return;
      }

      setError(
        `Mật khẩu không đúng. Còn ${MAX_ATTEMPTS - newAttempts} lần thử trước khi tài khoản bị khóa.`,
      );
      return;
    }

    if (isAuthFixtureMode && email === 'device@test.com') {
      setIsLoading(false);
      navigate('/w/auth/device-trust', {
        state: { email, returnTo: '/w/home' },
      });
      return;
    }

    try {
      const loginResult = await signIn({ email, password });
      navigateAfterLogin(loginResult);
    } catch (loginError) {
      if (isApiError(loginError) && loginError.status === 423) {
        navigate('/w/auth/account-locked', { replace: true });
        return;
      }
      if (isApiError(loginError) && loginError.status === 401) {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.');
        return;
      }
      setError('Không thể đăng nhập lúc này. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
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
          <form noValidate onSubmit={handleLogin} className="flex flex-col" style={{ gap: 20 }}>
            {/* Email field */}
            <InputField
              id="web-login-email"
              data-testid="auth-email"
              label="Email"
              type="email"
              required
              density="compact"
              surfaceTone="base"
              prefix={<Mail size={16} color={c.text3} className="shrink-0" aria-hidden="true" />}
              placeholder="you@example.com"
              value={email}
              error={fieldErrors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
                setFieldError('email');
              }}
              onBlur={handleEmailBlur}
              autoComplete="email"
              className="flex-1 bg-transparent outline-none min-w-0"
            />
            {/* Password field */}
            <InputField
              id="web-login-password"
              data-testid="auth-password"
              label="Mật khẩu"
              labelAction={
                <button
                  type="button"
                  onClick={() => navigate('/w/auth/forgot-password')}
                  className="hover:underline"
                  style={{
                    color: c.link,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Quên mật khẩu?
                </button>
              }
              type={showPw ? 'text' : 'password'}
              required
              density="compact"
              surfaceTone="base"
              prefix={<Lock size={16} color={c.text3} className="shrink-0" aria-hidden="true" />}
              suffix={
                <button
                  type="button"
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
                  {showPw ? (
                    <EyeOff size={16} color={c.text3} aria-hidden="true" />
                  ) : (
                    <Eye size={16} color={c.text3} aria-hidden="true" />
                  )}
                </button>
              }
              placeholder="••••••••"
              value={password}
              error={fieldErrors.password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
                setFieldError('password');
              }}
              autoComplete="current-password"
              className="flex-1 bg-transparent outline-none min-w-0"
            />
            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2"
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <AlertCircle size={14} color="#EF4444" className="shrink-0" />
                <span style={{ color: c.errorText, fontSize: WEB_FONT.sm }}>{error}</span>
              </div>
            )}

            {/* Login button */}
            <CTAButton
              type="submit"
              data-testid="auth-submit"
              loading={isLoading}
              variant="primary"
            >
              <span className="flex items-center gap-2">
                Đăng nhập
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </CTAButton>
          </form>

          {/* Demo login is development/test-only and is excluded from production UI. */}
          {isAuthFixtureMode && (
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
                color: c.link,
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
          <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
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
        {isAuthFixtureMode && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(59,130,246,0.03)',
              border: '1px dashed rgba(59,130,246,0.15)',
            }}
          >
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 6 }}>
              Demo flows:
            </p>
            <div className="flex flex-col" style={{ gap: 3 }}>
              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                <span style={{ color: c.link, fontFamily: 'monospace', fontWeight: 500 }}>
                  developer@vittrade.local / Preview-123!
                </span>{' '}
                → đăng nhập trực tiếp
              </p>
              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                <span style={{ color: c.link, fontFamily: 'monospace', fontWeight: 500 }}>
                  mfa@vittrade.local / Preview-123!
                </span>{' '}
                → nhập mã email 123456
              </p>
              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                <span style={{ color: c.errorText, fontFamily: 'monospace', fontWeight: 500 }}>
                  locked@vittrade.local / Preview-123!
                </span>{' '}
                → tài khoản tạm khóa
              </p>
              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                <span style={{ color: c.link, fontFamily: 'monospace', fontWeight: 500 }}>
                  demo@vittrade.vn / demo
                </span>{' '}
                → nút Trải nghiệm Demo
              </p>
              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                <span style={{ color: c.link, fontFamily: 'monospace', fontWeight: 500 }}>
                  device@test.com
                </span>{' '}
                → new device trust verification
              </p>
              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                <span style={{ color: c.errorText, fontFamily: 'monospace', fontWeight: 500 }}>
                  wrong@test.com
                </span>{' '}
                → failed attempts → account locked (sau 5 lần)
              </p>
              <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                Email khác → thông tin đăng nhập không hợp lệ
              </p>
            </div>
          </div>
        )}
      </WebAuthFormShell>
    </div>
  );
}
