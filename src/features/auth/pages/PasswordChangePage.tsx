import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { passwordResetApi } from '../api/password-reset-api';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const PASSWORD_RULES = [
  { id: 'length', label: 'Tối thiểu 12 ký tự', test: (value: string) => value.length >= 12 },
  { id: 'letter', label: 'Có ít nhất 1 chữ cái', test: (value: string) => /[a-zA-Z]/.test(value) },
  { id: 'digit', label: 'Có ít nhất 1 chữ số', test: (value: string) => /\d/.test(value) },
];

export function PasswordChangePage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const [step, setStep] = useState<'verify' | 'change' | 'success'>('verify');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(newPassword));
  const canSubmit =
    passwordValid && newPassword === confirmPassword && /^\d{6}$/.test(totpCode) && !isLoading;

  const verifyCurrentPassword = async () => {
    if (!currentPassword || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      await passwordResetApi.verifyCurrentPassword(currentPassword);
      setStep('change');
    } catch {
      setError('Không thể xác minh mật khẩu hiện tại. Vui lòng kiểm tra và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitPasswordChange = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    setError('');
    try {
      await passwordResetApi.changePassword({
        currentPassword,
        newPassword,
        mfaCode: totpCode,
        mfaMethod: 'totp',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTotpCode('');
      setStep('success');
    } catch {
      setError('Không thể đổi mật khẩu. Vui lòng kiểm tra mã xác thực và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <Header title="Đổi mật khẩu" subtitle="Xác thực · Bảo mật" back />
      <PageContent padding="relaxed" gap="relaxed">
        {error && (
          <p role="alert" style={{ color: colors.sell, fontSize: 13 }}>
            {error}
          </p>
        )}

        {step === 'verify' && (
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              void verifyCurrentPassword();
            }}
          >
            <p style={{ color: colors.text2, fontSize: 13, lineHeight: 1.6 }}>
              Xác minh mật khẩu hiện tại trước khi tiếp tục. Mật khẩu chỉ được gửi qua API bảo mật
              và không được lưu trên thiết bị.
            </p>
            <InputField
              label="Mật khẩu hiện tại"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              prefix={<Lock size={17} color={colors.text3} />}
              required
            />
            <CTAButton type="submit" loading={isLoading} disabled={!currentPassword}>
              Xác minh mật khẩu hiện tại
            </CTAButton>
          </form>
        )}

        {step === 'change' && (
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              void submitPasswordChange();
            }}
          >
            <div>
              <h2 style={{ color: colors.text1, fontSize: 18, fontWeight: 700 }}>
                Mật khẩu hiện tại đã được xác minh
              </h2>
              <p style={{ color: colors.text2, fontSize: 13, marginTop: 6 }}>
                Chọn mật khẩu mới và xác nhận bằng mã từ ứng dụng xác thực.
              </p>
            </div>
            <InputField
              label="Mật khẩu mới"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              prefix={<KeyRound size={17} color={colors.text3} />}
              required
            />
            <ul style={{ color: colors.text3, fontSize: 12, margin: 0, paddingLeft: 20 }}>
              {PASSWORD_RULES.map((rule) => (
                <li
                  key={rule.id}
                  style={{ color: rule.test(newPassword) ? colors.buy : undefined }}
                >
                  {rule.label}
                </li>
              ))}
            </ul>
            <InputField
              label="Nhập lại mật khẩu mới"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={
                confirmPassword && confirmPassword !== newPassword ? 'Mật khẩu chưa khớp.' : ''
              }
              required
            />
            <InputField
              label="Mã xác thực TOTP"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={totpCode}
              onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              prefix={<ShieldCheck size={17} color={colors.text3} />}
              required
            />
            <CTAButton type="submit" loading={isLoading} disabled={!canSubmit}>
              Đổi mật khẩu
            </CTAButton>
            <button
              type="button"
              className="w-full py-2 text-sm font-semibold"
              style={{ color: colors.text2 }}
              onClick={() => {
                setError('');
                setStep('verify');
              }}
            >
              Quay lại xác minh
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle size={44} color={colors.buy} aria-hidden="true" />
            <div>
              <h2 style={{ color: colors.text1, fontSize: 20, fontWeight: 700 }}>
                Mật khẩu đã được đổi thành công.
              </h2>
              <p style={{ color: colors.text2, fontSize: 13, marginTop: 8 }}>
                Các phiên đăng nhập khác có thể bị đăng xuất theo chính sách tài khoản.
              </p>
            </div>
            <CTAButton onClick={() => navigate(`${prefix}/profile/security`, { replace: true })}>
              Về cài đặt bảo mật
            </CTAButton>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
