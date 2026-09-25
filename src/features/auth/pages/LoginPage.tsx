import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Eye, EyeOff, Fingerprint, Lock, Mail } from 'lucide-react';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useAuth } from '@/shared/session/useAuth';
import { env } from '@/shared/config/env';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';

/** Trang đăng nhập theo contract; adapter chịu trách nhiệm tạo session và chuẩn hóa lỗi. */
export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const colors = useThemeColors();
  const prefix = useRoutePrefix();
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
          },
        });
        return;
      }
      navigate(`${prefix}/home`, { replace: true });
    } catch {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (!email) {
      setError('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    void submit({ email, password });
  };

  const handleDemoLogin = () => {
    if (!env.isDev && !env.isTest) return;
    void submit({ email: 'demo@vittrade.vn', password: 'demo' });
  };

  return (
    <PageLayout>
      <PageContent gap={16}>
        <div className="flex flex-col items-center pb-8 pt-10">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
              boxShadow: '0 8px 32px rgba(59,130,246,0.4)',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path
                d="M6 18L14 10L20 16L28 8"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 26L14 18L20 24L30 14"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 style={{ color: colors.text1, fontSize: 26, fontWeight: 700 }}>VitTrade</h1>
          <p style={{ color: colors.text2, fontSize: 13, marginTop: 4 }}>
            Giao dịch thông minh, an toàn, tốc độ
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <InputField
            label="Email / Số điện thoại"
            data-testid="auth-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            prefix={<Mail size={18} color={colors.text3} />}
            error={error && !email ? ' ' : undefined}
            containerStyle={error && !email ? { borderColor: '#EF4444' } : undefined}
          />

          <InputField
            label="Mật khẩu"
            data-testid="auth-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            onKeyDown={(event) => event.key === 'Enter' && handleLogin()}
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
            error={error && !password ? ' ' : undefined}
            containerStyle={error && !password ? { borderColor: '#EF4444' } : undefined}
          />

          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
              role="alert"
            >
              <AlertCircle size={14} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: 13 }}>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(`${prefix}/auth/forgot-password`)}
            className="text-right"
            style={{ color: colors.link, fontSize: 13 }}
          >
            Quên mật khẩu?
          </button>

          <CTAButton
            data-testid="auth-submit"
            onClick={handleLogin}
            loading={isLoading}
            variant="primary"
          >
            Đăng nhập
          </CTAButton>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: colors.borderSolid }} />
            <span style={{ color: colors.text2, fontSize: 12 }}>hoặc</span>
            <div className="h-px flex-1" style={{ background: colors.borderSolid }} />
          </div>

          {(env.isDev || env.isTest) && (
            <CTAButton
              onClick={handleDemoLogin}
              variant="ghost"
              bg={colors.surface2}
              textColor={colors.text1}
              style={{
                border: `1.5px solid ${colors.borderSolid}`,
                fontSize: 15,
                boxShadow: 'none',
              }}
            >
              <Fingerprint size={20} color="#3B82F6" />
              Đăng nhập Demo
            </CTAButton>
          )}

          <div className="flex items-center justify-center gap-1 pt-2">
            <span style={{ color: colors.text2, fontSize: 13 }}>Chưa có tài khoản?</span>
            <button
              type="button"
              onClick={() => navigate(`${prefix}/auth/register`)}
              style={{ color: colors.link, fontSize: 13, fontWeight: 600 }}
            >
              Đăng ký ngay
            </button>
          </div>
        </div>

        <div className="mt-auto pt-8 text-center">
          <p style={{ color: colors.text2, fontSize: 11 }}>
            Bằng cách đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của
            VitTrade.
          </p>
        </div>
      </PageContent>
    </PageLayout>
  );
}
