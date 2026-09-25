import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/shared/session/useAuth';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT } from '@/shared/theme/webTokens';
import { WebAuthBrandPanel, WebAuthFormShell } from '@/shared/ui/auth/WebAuthBrandPanel';
import type { MfaSetupChallenge } from '@/features/auth/api/auth-api';
import { Web2FASetupBackupStep } from './Web2FASetupBackupStep';
import { Web2FASetupQrStep } from './Web2FASetupQrStep';
import { Web2FASetupVerifyStep } from './Web2FASetupVerifyStep';
import { Web2FASetupStepIndicator } from './Web2FASetupStepIndicator';

/**
 * Web2FASetupPage — Enterprise Desktop 2FA Setup
 * 3-step wizard: (1) Scan QR → (2) Verify code → (3) Save backup codes
 * 2-column layout with animated brand panel.
 *
 * Route: /w/auth/2fa-setup
 */

export function Web2FASetupFlow() {
  const navigate = useNavigate();
  const { beginMfaSetup, confirmMfaSetup } = useAuth();
  const c = useThemeColors();

  const [step, setStep] = useState(0); // 0=QR, 1=verify, 2=backup
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [copied, setCopied] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [savedCodes, setSavedCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setup, setSetup] = useState<MfaSetupChallenge | null>(null);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let active = true;
    void beginMfaSetup()
      .then((challenge) => {
        if (active) setSetup(challenge);
      })
      .catch(() => {
        if (active) setError('Không thể khởi tạo thiết lập 2FA. Vui lòng thử lại.');
      });
    return () => {
      active = false;
    };
  }, [beginMfaSetup]);

  /* ─── Copy secret key ─── */
  const handleCopyKey = () => {
    if (!setup) return;
    navigator.clipboard.writeText(setup.secret).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ─── Copy all backup codes ─── */
  const handleCopyBackupCodes = () => {
    if (!setup) return;
    navigator.clipboard.writeText(setup.backupCodes.join('\n')).catch(() => {});
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  /* ─── OTP input handlers ─── */
  const handleOTPChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      setError('');
    }
  };

  /* ─── Verify OTP from authenticator ─── */
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setIsLoading(true);
    try {
      await confirmMfaSetup({ code });
      setStep(2);
    } catch {
      setError('Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Complete setup ─── */
  const handleComplete = async () => {
    setIsLoading(true);
    setIsLoading(false);
    navigate('/w/auth/success', {
      replace: true,
      state: { purpose: 'register', from: '2fa-setup' },
    });
  };

  const brandTaglines = [
    'Thiết lập xác thực hai bước để bảo vệ tài khoản. Mỗi lần đăng nhập đều cần mã xác thực từ thiết bị của bạn.',
    'Xác minh mã từ ứng dụng xác thực để hoàn tất thiết lập bảo mật hai lớp.',
    'Lưu mã dự phòng ở nơi an toàn. Đây là phương án cuối cùng khi mất thiết bị xác thực.',
  ];

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline={brandTaglines[step]} />

      <WebAuthFormShell textColor={c.text1}>
        {/* Back button */}
        {step === 0 && (
          <button
            onClick={() => navigate('/w/auth/register')}
            className="flex items-center hover:underline"
            style={{
              gap: 6,
              color: c.text2,
              fontSize: WEB_FONT.sm,
              marginBottom: 24,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            Bỏ qua thiết lập
          </button>
        )}
        {/* Step indicator */}
        <Web2FASetupStepIndicator current={step} c={c} />
        {step === 0 && (
          <Web2FASetupQrStep
            c={c}
            setup={setup}
            copied={copied}
            handleCopyKey={handleCopyKey}
            setStep={setStep}
            inputRefs={inputRefs}
          />
        )}
        {step === 1 && (
          <Web2FASetupVerifyStep
            c={c}
            otp={otp}
            inputRefs={inputRefs}
            handleOTPChange={handleOTPChange}
            handleOTPKeyDown={handleOTPKeyDown}
            handleOTPPaste={handleOTPPaste}
            isLoading={isLoading}
            error={error}
            setStep={setStep}
            setOtp={setOtp}
            setError={setError}
            handleVerifyOTP={handleVerifyOTP}
          />
        )}
        {step === 2 && (
          <Web2FASetupBackupStep
            c={c}
            setup={setup}
            isLoading={isLoading}
            savedCodes={savedCodes}
            setSavedCodes={setSavedCodes}
            copiedCodes={copiedCodes}
            handleCopyBackupCodes={handleCopyBackupCodes}
            handleComplete={handleComplete}
          />
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
              Hướng dẫn thiết lập 2FA
            </button>
          </p>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
