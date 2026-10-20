import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AlertCircle, Eye, EyeOff, Fingerprint, Lock, Mail } from 'lucide-react';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useAuth } from '@/shared/session/useAuth';
import { env, isProductionBuild } from '@/shared/config/env';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { ALPHA, withAlpha } from '@/shared/theme/colors';
import { textRoleStyle } from '@/shared/theme/typography';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { isApiError } from '@/shared/api/api-error';
import { isEmail } from '@/shared/lib/string';
import { AuthBrandMark } from '@/shared/ui/auth/AuthBrandMark';
import { getLoginReturnPath } from '../lib/login-return-path';

/** Trang đăng nhập theo contract; adapter chịu trách nhiệm tạo session và chuẩn hóa lỗi. */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const colors = useThemeColors();
  const isAuthFixtureMode =
    !isProductionBuild && (env.isTest || (env.isDev && env.dataSource === 'mock'));
  const prefix = useRoutePrefix();
  const defaultReturnTo = `${prefix}/home`;
  const returnTo = getLoginReturnPath(location.state, defaultReturnTo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (credentials: { email: string; password: string }) => {
    setError('');
    setIsLoading(true);
    try {
      const loginResult = await signIn(credentials);
      if (loginResult.status === 'mfa_required') {
        const { challenge } = loginResult;
        navigate(`${prefix}/auth/otp`, {
          replace: true,
          state: {
            challengeId: challenge.id,
            method: challenge.method,
            maskedDestination: challenge.maskedDestination,
            expiresAt: challenge.expiresAt,
            ...(returnTo !== defaultReturnTo ? { from: returnTo } : {}),
          },
        });
        return;
      }
      navigate(returnTo, { replace: true });
    } catch (loginError) {
      if (isApiError(loginError) && loginError.status === 423) {
        navigate(`${prefix}/auth/account-locked`, { replace: true });
        return;
      }
      setError('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (!email) {
      setError('Vui lòng nhập email.');
      return;
    }
    if (!isEmail(email)) {
      setError('Định dạng email không hợp lệ');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    void submit({ email, password });
  };

  const handleDemoLogin = () => {
    void submit({ email: 'demo@vittrade.vn', password: 'demo' });
  };

  const emailFieldError = error && (!email || !isEmail(email)) ? error : undefined;
  const passwordFieldError = error && email && isEmail(email) && !password ? error : undefined;

  return (
    <PageLayout>
      <PageContent gap={16}>
        <div className="flex flex-col items-center pb-8 pt-10">
          <div className="mb-4">
            <AuthBrandMark size="lg" />
          </div>
          <h1 style={{ color: colors.text1, ...textRoleStyle('pageTitle') }}>VitTrade</h1>
          <p className="mt-1" style={{ color: colors.text2, ...textRoleStyle('subtitle') }}>
            Giao dịch thông minh, an toàn, tốc độ
          </p>
        </div>

        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            handleLogin();
          }}
          className="flex flex-col gap-4"
        >
          <InputField
            label="Email"
            data-testid="auth-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            autoComplete="email"
            prefix={<Mail size={18} color={colors.text3} />}
            error={emailFieldError}
          />

          <InputField
            label="Mật khẩu"
            data-testid="auth-password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError('');
            }}
            autoComplete="current-password"
            prefix={<Lock size={18} color={colors.text3} />}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.text3} />
                ) : (
                  <Eye size={18} color={colors.text3} />
                )}
              </button>
            }
            error={passwordFieldError}
          />

          {error && !emailFieldError && !passwordFieldError && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: withAlpha(colors.error, ALPHA.muted),
                border: `1px solid ${withAlpha(colors.error, ALPHA.border)}`,
              }}
              role="alert"
            >
              <AlertCircle size={14} color={colors.errorText} />
              <span style={{ color: colors.errorText, ...textRoleStyle('caption') }}>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(`${prefix}/auth/forgot-password`)}
            className="text-right"
            style={{ color: colors.link, ...textRoleStyle('button') }}
          >
            Quên mật khẩu?
          </button>

          <CTAButton type="submit" data-testid="auth-submit" loading={isLoading} variant="primary">
            Đăng nhập
          </CTAButton>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: colors.borderSolid }} />
            <span style={{ color: colors.text2, ...textRoleStyle('caption') }}>hoặc</span>
            <div className="h-px flex-1" style={{ background: colors.borderSolid }} />
          </div>

          {isAuthFixtureMode && (
            <CTAButton
              type="button"
              onClick={handleDemoLogin}
              variant="secondary"
              style={{ border: `1.5px solid ${colors.borderSolid}` }}
            >
              <Fingerprint size={20} color={colors.info} />
              Đăng nhập Demo
            </CTAButton>
          )}

          <div className="flex items-center justify-center gap-1 pt-2">
            <span style={{ color: colors.text2, ...textRoleStyle('caption') }}>
              Chưa có tài khoản?
            </span>
            <button
              type="button"
              onClick={() => navigate(`${prefix}/auth/register`)}
              style={{ color: colors.link, ...textRoleStyle('button') }}
            >
              Đăng ký ngay
            </button>
          </div>
        </form>

        <div className="mt-auto pt-8 text-center">
          <p style={{ color: colors.text2, ...textRoleStyle('caption') }}>
            Bằng cách đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của
            VitTrade.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
