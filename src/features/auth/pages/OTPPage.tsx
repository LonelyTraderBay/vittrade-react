import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from '@/shared/ui/layout/Header';
import { ShieldCheck } from 'lucide-react';
import { isDevelopmentBuild } from '@/shared/config/env';
import { useAuth } from '@/shared/session/useAuth';
import { isApiError } from '@/shared/api/api-error';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { CTAButton } from '@/shared/ui/CTAButton';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { parseLoginMfaChallengeState } from '../lib/login-mfa-route-state';

export function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMfa, verifyLoginMfa } = useAuth();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const state = location.state as { contact?: string; type?: string; purpose?: string } | null;
  const registrationFlow =
    state?.purpose === 'register' && Boolean(state.contact) && isDevelopmentBuild;
  const loginChallenge = parseLoginMfaChallengeState(state);
  const isRouteValid = registrationFlow || Boolean(loginChallenge);
  const contact = loginChallenge
    ? (loginChallenge.maskedDestination ?? 'ứng dụng xác thực')
    : (state?.contact ?? '');
  const loginChallengeExpiry = loginChallenge?.expiresAt;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [returnToLogin, setReturnToLogin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
  useEffect(() => {
    if (!isRouteValid) navigate(`${prefix}/auth/login`, { replace: true });
  }, [isRouteValid, navigate, prefix]);
  useEffect(() => {
    if (!loginChallengeExpiry) return;
    let timeout: ReturnType<typeof setTimeout>;
    const checkExpiry = () => {
      const remaining = Date.parse(loginChallengeExpiry) - Date.now();
      if (remaining <= 0) {
        navigate(`${prefix}/auth/login`, { replace: true });
      } else {
        timeout = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647));
      }
    };
    timeout = setTimeout(
      checkExpiry,
      Math.min(Math.max(0, Date.parse(loginChallengeExpiry) - Date.now()), 2_147_483_647),
    );
    return () => clearTimeout(timeout);
  }, [loginChallengeExpiry, navigate, prefix]);
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6)
      handleVerify(newOtp.join(''));
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      handleVerify(pasted);
    }
  };
  const handleVerify = async (code: string) => {
    if (!isRouteValid || isLoading) return;
    if (loginChallenge && Date.now() >= Date.parse(loginChallenge.expiresAt)) {
      navigate(`${prefix}/auth/login`, { replace: true });
      return;
    }
    setIsLoading(true);
    setError('');
    setReturnToLogin(false);
    try {
      if (loginChallenge) {
        await verifyLoginMfa({ challengeId: loginChallenge.id, code });
        navigate(`${prefix}/home`, { replace: true });
      } else {
        await verifyMfa({ contact, code, purpose: 'register' });
        navigate(`${prefix}/auth/2fa-setup`, { replace: true });
      }
    } catch (verifyError) {
      if (loginChallenge && isApiError(verifyError)) {
        if (verifyError.status === 410) {
          navigate(`${prefix}/auth/login`, { replace: true });
          setIsLoading(false);
          return;
        }
        if (verifyError.status === 423 && prefix === '/w') {
          navigate(`${prefix}/auth/account-locked`, { replace: true });
          setIsLoading(false);
          return;
        }
        if (verifyError.status === 423) {
          setError('Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau.');
          setReturnToLogin(true);
        } else if (verifyError.status === 429) {
          setError('Quá nhiều lần xác thực. Vui lòng chờ trước khi thử lại hoặc đăng nhập lại.');
          setReturnToLogin(true);
        } else if (verifyError.status === 400) {
          setError('Mã OTP không đúng. Vui lòng thử lại.');
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        } else {
          setError('Không thể xác minh lúc này. Vui lòng thử lại.');
        }
      } else {
        setError(
          loginChallenge
            ? 'Không thể xác minh lúc này. Vui lòng thử lại.'
            : 'Mã OTP không đúng. Vui lòng thử lại.',
        );
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }
    setIsLoading(false);
  };
  const filled = otp.filter((d) => d !== '').length;

  if (!isRouteValid) {
    return (
      <PageLayout>
        <PageContent gap={16}>
          <p role="alert" style={{ color: c.text1, textAlign: 'center' }}>
            Phiên xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.
          </p>
          <CTAButton onClick={() => navigate(`${prefix}/auth/login`, { replace: true })}>
            Quay lại đăng nhập
          </CTAButton>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Xác minh OTP" subtitle="Xác thực · Bảo mật" back />
      <PageContent padding="relaxed" gap="relaxed" className="items-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1.5px solid rgba(59,130,246,0.3)' }}
        >
          <ShieldCheck size={40} color="#3B82F6" />
        </div>

        <div className="text-center">
          <h2 style={{ color: c.text1, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Nhập mã xác minh
          </h2>
          <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6 }}>
            {loginChallenge?.method === 'totp'
              ? 'Mở ứng dụng xác thực và nhập mã hiện tại.'
              : 'Chúng tôi đã gửi mã 6 chữ số đến'}
            {'\n'}
            <span style={{ color: c.text1, fontWeight: 600 }}>{contact}</span>
          </p>
        </div>

        <div className="flex gap-3" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="text-center rounded-2xl transition-all"
              style={{
                width: 48,
                height: 56,
                background: digit ? 'rgba(59,130,246,0.1)' : c.surface2,
                border: `2px solid ${error ? '#EF4444' : digit ? '#3B82F6' : c.borderSolid}`,
                color: c.text1,
                fontSize: 24,
                fontWeight: 700,
                outline: 'none',
              }}
              aria-label={`Ký tự OTP ${i + 1}`}
            />
          ))}
        </div>

        <div className="w-full flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full transition-all duration-300"
              style={{ background: i < filled ? '#3B82F6' : c.borderSolid }}
            />
          ))}
        </div>

        {error && (
          <div
            className="w-full rounded-xl px-4 py-3"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{error}</p>
            {returnToLogin && (
              <button
                onClick={() => navigate(`${prefix}/auth/login`, { replace: true })}
                className="mt-2 w-full text-center"
                style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}
              >
                Quay lại đăng nhập
              </button>
            )}
          </div>
        )}

        <CTAButton
          onClick={() => handleVerify(otp.join(''))}
          disabled={filled < 6}
          loading={isLoading}
          variant="primary"
        >
          {isLoading ? 'Đang xác minh...' : 'Xác nhận'}
        </CTAButton>

        {!loginChallenge && (
          <div className="flex flex-col items-center gap-2">
            <span style={{ color: c.text2, fontSize: 13, textAlign: 'center' }}>
              Không nhận được mã? Hãy quay lại đăng ký để bắt đầu yêu cầu mới.
            </span>
            <button
              type="button"
              onClick={() => navigate(`${prefix}/auth/register`, { replace: true })}
              style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}
            >
              Quay lại đăng ký
            </button>
          </div>
        )}

        <p style={{ color: c.text3, fontSize: 12, textAlign: 'center' }}>
          Không nhận được? Kiểm tra thư mục Spam hoặc{'\n'}đảm bảo email / SĐT chính xác.
        </p>
      </PageContent>
    </PageLayout>
  );
}
