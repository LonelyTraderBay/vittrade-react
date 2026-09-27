import { useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import { isApiError } from '@/shared/api/api-error';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { CTAButton } from '@/shared/ui/CTAButton';
import { InputField } from '@/shared/ui/InputField';
import { authApi } from '../api/auth-api-instance';
import type { RegistrationChannel, RegistrationRequest } from '../model/registration-types';

interface RegistrationDraft {
  fullName: string;
  channel: RegistrationChannel;
  contact: string;
  password: string;
  confirmation: string;
  referralCode: string;
  acceptedTerms: boolean;
}

type RegistrationField = 'fullName' | 'contact' | 'password' | 'confirmation' | 'acceptedTerms';

function validateDraft(draft: RegistrationDraft): Partial<Record<RegistrationField, string>> {
  const errors: Partial<Record<RegistrationField, string>> = {};
  if (!draft.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
  if (!draft.contact.trim()) {
    errors.contact =
      draft.channel === 'email' ? 'Vui lòng nhập email' : 'Vui lòng nhập số điện thoại';
  } else if (draft.channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact)) {
    errors.contact = 'Email không hợp lệ';
  }
  if (draft.password.length < 8) errors.password = 'Mật khẩu tối thiểu 8 ký tự';
  if (draft.password !== draft.confirmation) errors.confirmation = 'Mật khẩu xác nhận không khớp';
  if (!draft.acceptedTerms) errors.acceptedTerms = 'Vui lòng đồng ý điều khoản dịch vụ';
  return errors;
}

function PasswordStrength({ password }: { password: string }) {
  const colors = useThemeColors();
  const checks = [
    { label: 'Ít nhất 8 ký tự', valid: password.length >= 8 },
    { label: 'Chữ hoa & thường', valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Có số', valid: /\d/.test(password) },
    { label: 'Ký tự đặc biệt', valid: /[!@#$%^&*]/.test(password) },
  ];
  const strength = checks.filter((check) => check.valid).length;
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {checks.map((check, index) => (
          <span
            key={check.label}
            className="h-1 flex-1 rounded-full"
            style={{ background: index < strength ? '#10B981' : colors.borderSolid }}
          />
        ))}
      </div>
      <p className="mt-1" style={{ color: colors.text3, fontSize: 11 }}>
        Mật khẩu cần ít nhất 8 ký tự. Các dấu hiệu còn lại là gợi ý.
      </p>
    </div>
  );
}

export function RegistrationForm() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const idempotencyKey = useRef<string | null>(null);
  const [draft, setDraft] = useState<RegistrationDraft>({
    fullName: '',
    channel: 'email',
    contact: '',
    password: '',
    confirmation: '',
    referralCode: '',
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<Partial<Record<RegistrationField, string>>>({});
  const [requestError, setRequestError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateDraft = <K extends keyof RegistrationDraft>(
    field: K,
    value: RegistrationDraft[K],
  ) => {
    idempotencyKey.current = null;
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setRequestError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || isSubmitting) return;

    const request: RegistrationRequest = {
      fullName: draft.fullName.trim(),
      channel: draft.channel,
      contact: draft.contact.trim(),
      password: draft.password,
      ...(draft.referralCode.trim() ? { referralCode: draft.referralCode.trim() } : {}),
      acceptedTerms: true,
    };
    idempotencyKey.current ??= crypto.randomUUID();
    setIsSubmitting(true);
    setRequestError('');
    try {
      const challenge = await authApi.register(request, idempotencyKey.current);
      navigate(`${routePrefix}/auth/otp`, {
        state: { ...challenge, purpose: 'register' },
      });
    } catch (error) {
      setRequestError(
        isApiError(error) && error.status === 429
          ? 'Bạn đã gửi quá nhiều yêu cầu. Hãy chờ một lúc rồi thử lại.'
          : 'Chưa thể bắt đầu xác minh. Kiểm tra kết nối rồi thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={(event) => void submit(event)} noValidate>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Kênh đăng ký">
        {(['email', 'phone'] as const).map((channel) => (
          <button
            key={channel}
            type="button"
            aria-pressed={draft.channel === channel}
            disabled={isSubmitting}
            onClick={() => {
              updateDraft('channel', channel);
              updateDraft('contact', '');
            }}
            className="min-h-11 rounded-xl text-sm font-semibold"
            style={{
              background: draft.channel === channel ? colors.chipActiveBg : colors.surface2,
              color: draft.channel === channel ? colors.chipActiveText : colors.text2,
            }}
          >
            {channel === 'email' ? 'Email' : 'Điện thoại'}
          </button>
        ))}
      </div>

      <InputField
        label="Họ và tên"
        autoComplete="name"
        value={draft.fullName}
        disabled={isSubmitting}
        onChange={(event) => updateDraft('fullName', event.target.value)}
        prefix={<User size={17} color={colors.text3} />}
        error={errors.fullName}
      />
      <InputField
        label={draft.channel === 'email' ? 'Email' : 'Số điện thoại'}
        type={draft.channel === 'email' ? 'email' : 'tel'}
        autoComplete={draft.channel === 'email' ? 'email' : 'tel'}
        value={draft.contact}
        disabled={isSubmitting}
        onChange={(event) => updateDraft('contact', event.target.value)}
        prefix={
          draft.channel === 'email' ? (
            <Mail size={17} color={colors.text3} />
          ) : (
            <Phone size={17} color={colors.text3} />
          )
        }
        error={errors.contact}
      />
      <div>
        <InputField
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={draft.password}
          disabled={isSubmitting}
          onChange={(event) => updateDraft('password', event.target.value)}
          prefix={<Lock size={17} color={colors.text3} />}
          suffix={
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((shown) => !shown)}
            >
              {showPassword ? (
                <EyeOff size={17} color={colors.text3} />
              ) : (
                <Eye size={17} color={colors.text3} />
              )}
            </button>
          }
          error={errors.password}
        />
        {draft.password && <PasswordStrength password={draft.password} />}
      </div>
      <InputField
        label="Xác nhận mật khẩu"
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        value={draft.confirmation}
        disabled={isSubmitting}
        onChange={(event) => updateDraft('confirmation', event.target.value)}
        prefix={<Lock size={17} color={colors.text3} />}
        error={errors.confirmation}
      />
      <InputField
        label="Mã giới thiệu (tuỳ chọn)"
        value={draft.referralCode}
        disabled={isSubmitting}
        onChange={(event) => updateDraft('referralCode', event.target.value.toUpperCase())}
      />

      <label className="flex items-start gap-3 text-sm" style={{ color: colors.text2 }}>
        <input
          type="checkbox"
          checked={draft.acceptedTerms}
          disabled={isSubmitting}
          onChange={(event) => updateDraft('acceptedTerms', event.target.checked)}
          aria-invalid={Boolean(errors.acceptedTerms)}
          className="mt-1 h-4 w-4 accent-blue-500"
        />
        <span>Tôi đã đọc và đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của VitTrade.</span>
      </label>
      {errors.acceptedTerms && (
        <p role="alert" style={{ color: '#EF4444', fontSize: 12 }}>
          {errors.acceptedTerms}
        </p>
      )}
      {requestError && (
        <p role="alert" style={{ color: '#EF4444', fontSize: 13 }}>
          {requestError}
        </p>
      )}
      <CTAButton type="submit" loading={isSubmitting}>
        Tiếp tục
      </CTAButton>
    </form>
  );
}
