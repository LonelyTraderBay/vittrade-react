import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, CheckCircle, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { CTAButton } from '@/shared/ui/CTAButton';
import { Header } from '@/shared/ui/layout/Header';
import { InputField } from '@/shared/ui/InputField';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { passwordResetApi } from '../api/password-reset-api';

const PASSWORD_RULES = [
  { id: 'length', label: 'Tối thiểu 12 ký tự', test: (value: string) => value.length >= 12 },
  { id: 'letter', label: 'Có ít nhất 1 chữ cái', test: (value: string) => /[a-zA-Z]/.test(value) },
  { id: 'digit', label: 'Có ít nhất 1 chữ số', test: (value: string) => /\d/.test(value) },
];

export function ForgotPasswordContractPage() {
  const navigate = useNavigate();
  const colors = useThemeColors();
  const prefix = useRoutePrefix();
  const [step, setStep] = useState<'input' | 'otp' | 'reset' | 'success'>('input');
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 'otp') stepHeadingRef.current?.focus();
  }, [step]);

  const run = async (operation: () => Promise<void>, message: string) => {
    setIsLoading(true);
    setError('');
    try {
      await operation();
    } catch {
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = () => {
    void run(async () => {
      await passwordResetApi.requestCode(email);
      setStep('otp');
    }, 'Không thể gửi mã xác minh. Vui lòng thử lại.');
  };

  const handleVerifyCode = () => {
    void run(async () => {
      const response = await passwordResetApi.verifyCode(email, otp);
      setResetToken(response.resetToken);
      setStep('reset');
    }, 'Mã xác minh không đúng hoặc đã hết hạn.');
  };

  const handleReset = () => {
    void run(async () => {
      await passwordResetApi.resetPassword(email, resetToken, newPassword);
      setStep('success');
    }, 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
  };

  return (
    <PageLayout>
      <Header title="Quên mật khẩu" subtitle="Xác thực · Bảo mật" back />
      <PageContent padding="relaxed" gap="relaxed">
        {error && (
          <p role="alert" style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {step === 'input' && (
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              handleSendCode();
            }}
          >
            <ResetIntro colors={colors} />
            <InputField
              label="Email đăng ký"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              prefix={<Mail size={18} color={colors.text3} />}
            />
            <CTAButton type="submit" disabled={!email} loading={isLoading} variant="primary">
              {isLoading ? 'Đang gửi...' : 'Gửi mã xác minh'}
            </CTAButton>
          </form>
        )}

        {step === 'otp' && (
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              handleVerifyCode();
            }}
          >
            <div className="text-center">
              <h2
                ref={stepHeadingRef}
                tabIndex={-1}
                className="focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                style={{ color: colors.text1, fontSize: 20, fontWeight: 700 }}
              >
                Nhập mã OTP
              </h2>
              <p style={{ color: colors.text2, fontSize: 13, marginTop: 8 }}>
                Mã 6 số đã được gửi đến <span style={{ color: colors.text1 }}>{email}</span>
              </p>
            </div>
            <label style={{ color: colors.text2, fontSize: 13 }}>
              Mã OTP
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mt-2 w-full rounded-2xl text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label="Mã OTP"
                style={{
                  background: colors.surface2,
                  border: `1.5px solid ${colors.borderSolid}`,
                  color: colors.text1,
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: 8,
                  height: 52,
                }}
              />
            </label>
            <CTAButton
              type="submit"
              disabled={otp.length !== 6}
              loading={isLoading}
              variant="primary"
            >
              {isLoading ? 'Đang xác minh...' : 'Xác nhận'}
            </CTAButton>
          </form>
        )}

        {step === 'reset' && (
          <PasswordForm
            colors={colors}
            focusHeading
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            showPassword={showPassword}
            isLoading={isLoading}
            onNewPassword={setNewPassword}
            onConfirmPassword={setConfirmPassword}
            onTogglePassword={() => setShowPassword((current) => !current)}
            onSubmit={handleReset}
          />
        )}

        {step === 'success' && (
          <SuccessState
            colors={colors}
            onLogin={() => navigate(`${prefix}/auth/login`, { replace: true })}
          />
        )}
      </PageContent>
    </PageLayout>
  );
}

export function ResetPasswordContractPage() {
  const [searchParams] = useSearchParams();
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const email = searchParams.get('email') ?? '';
  const resetToken = searchParams.get('resetToken') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const valid = Boolean(email && resetToken);

  const submit = () => {
    setIsLoading(true);
    setError('');
    void passwordResetApi
      .resetPassword(email, resetToken, newPassword)
      .then(() => setSuccess(true))
      .catch(() => setError('Không thể đặt lại mật khẩu. Vui lòng yêu cầu mã mới.'))
      .finally(() => setIsLoading(false));
  };

  if (success) {
    return (
      <PageLayout>
        <Header title="Đặt lại mật khẩu" subtitle="Xác thực · Bảo mật" back />
        <PageContent padding="relaxed" gap="relaxed" className="items-center">
          <SuccessState
            colors={colors}
            onLogin={() => navigate(`${prefix}/auth/login`, { replace: true })}
          />
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Đặt lại mật khẩu" subtitle="Xác thực · Bảo mật" back />
      <PageContent padding="relaxed" gap="relaxed">
        {!valid && (
          <p role="alert" style={{ color: colors.sell, fontSize: 13 }}>
            Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
          </p>
        )}
        {error && (
          <p role="alert" style={{ color: colors.sell, fontSize: 13 }}>
            {error}
          </p>
        )}
        <PasswordForm
          colors={colors}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          showPassword={showPassword}
          isLoading={isLoading}
          disabled={!valid}
          onNewPassword={setNewPassword}
          onConfirmPassword={setConfirmPassword}
          onTogglePassword={() => setShowPassword((current) => !current)}
          onSubmit={submit}
        />
      </PageContent>
    </PageLayout>
  );
}

function ResetIntro({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
    <div className="text-center">
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1.5px solid rgba(59,130,246,0.3)' }}
      >
        <KeyRound size={32} color="#3B82F6" />
      </div>
      <h2 style={{ color: colors.text1, fontSize: 20, fontWeight: 700 }}>Đặt lại mật khẩu</h2>
      <p style={{ color: colors.text2, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
        Nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác minh để đặt lại mật khẩu.
      </p>
    </div>
  );
}

function PasswordForm({
  colors,
  focusHeading = false,
  newPassword,
  confirmPassword,
  showPassword,
  isLoading,
  disabled = false,
  onNewPassword,
  onConfirmPassword,
  onTogglePassword,
  onSubmit,
}: {
  colors: ReturnType<typeof useThemeColors>;
  focusHeading?: boolean;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  isLoading: boolean;
  disabled?: boolean;
  onNewPassword: (value: string) => void;
  onConfirmPassword: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rulesPass = PASSWORD_RULES.every((rule) => rule.test(newPassword));
  const matches = Boolean(confirmPassword && newPassword === confirmPassword);

  useEffect(() => {
    if (focusHeading) headingRef.current?.focus();
  }, [focusHeading]);

  return (
    <form
      className="contents"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="text-center">
        <h2
          ref={headingRef}
          tabIndex={focusHeading ? -1 : undefined}
          className={
            focusHeading
              ? 'focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
              : undefined
          }
          style={{ color: colors.text1, fontSize: 20, fontWeight: 700 }}
        >
          Mật khẩu mới
        </h2>
        <p style={{ color: colors.text2, fontSize: 13, marginTop: 8 }}>
          Tạo mật khẩu mạnh để bảo vệ tài khoản
        </p>
      </div>
      <InputField
        label="Mật khẩu mới"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={newPassword}
        onChange={(event) => onNewPassword(event.target.value)}
        prefix={<Lock size={18} color={colors.text3} />}
        suffix={
          <button type="button" onClick={onTogglePassword} aria-label="Hiện hoặc ẩn mật khẩu">
            {showPassword ? (
              <EyeOff size={18} color={colors.text3} />
            ) : (
              <Eye size={18} color={colors.text3} />
            )}
          </button>
        }
      />
      <div className="flex flex-col gap-1.5">
        {PASSWORD_RULES.map((rule) => {
          const pass = rule.test(newPassword);
          return (
            <div key={rule.id} className="flex items-center gap-2">
              <Check size={12} color={pass ? '#10B981' : colors.text3} />
              <span style={{ color: pass ? '#10B981' : colors.text2, fontSize: 12 }}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
      <InputField
        label="Nhập lại mật khẩu"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(event) => onConfirmPassword(event.target.value)}
        prefix={<Lock size={18} color={colors.text3} />}
        error={confirmPassword && !matches ? 'Mật khẩu không khớp' : undefined}
      />
      <CTAButton
        type="submit"
        disabled={disabled || !rulesPass || !matches}
        loading={isLoading}
        variant="primary"
      >
        {isLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
      </CTAButton>
    </form>
  );
}

function SuccessState({
  colors,
  onLogin,
}: {
  colors: ReturnType<typeof useThemeColors>;
  onLogin: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}
      >
        <CheckCircle size={48} color="#10B981" />
      </div>
      <div className="text-center">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          style={{ color: colors.text1, fontSize: 22, fontWeight: 700 }}
        >
          Thành công!
        </h2>
        <p style={{ color: colors.text2, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
          Mật khẩu đã được cập nhật. Vui lòng đăng nhập với mật khẩu mới.
        </p>
      </div>
      <CTAButton onClick={onLogin} variant="primary">
        Đến trang đăng nhập
      </CTAButton>
    </div>
  );
}
