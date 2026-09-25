import { AlertCircle, ArrowLeft, ArrowRight, KeyRound, Smartphone } from 'lucide-react';
import { WEB_BUTTON, WEB_FONT } from '@/shared/theme/webTokens';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
interface Props {
  c: ThemeColors;
  otp: string[];
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  handleOTPChange: (index: number, value: string) => void;
  handleOTPKeyDown: (index: number, event: React.KeyboardEvent) => void;
  handleOTPPaste: (event: React.ClipboardEvent) => void;
  isLoading: boolean;
  error: string;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  handleVerifyOTP: () => Promise<void>;
}

export function Web2FASetupVerifyStep(props: Props) {
  const {
    c,
    otp,
    inputRefs,
    handleOTPChange,
    handleOTPKeyDown,
    handleOTPPaste,
    isLoading,
    error,
    setStep,
    setOtp,
    setError,
    handleVerifyOTP,
  } = props;
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(59,130,246,0.08)',
            marginBottom: 16,
          }}
        >
          <Smartphone size={28} color="#3B82F6" />
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
          Xác minh mã
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
          Nhập mã 6 chữ số từ ứng dụng xác thực để hoàn tất liên kết.
        </p>
      </div>

      {/* OTP input boxes */}
      <div className="flex justify-center" style={{ gap: 10, marginBottom: 16 }}>
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
            onChange={(e) => handleOTPChange(i, e.target.value)}
            onKeyDown={(e) => handleOTPKeyDown(i, e)}
            onPaste={i === 0 ? handleOTPPaste : undefined}
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

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2"
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            marginBottom: 16,
          }}
        >
          <AlertCircle size={14} color="#EF4444" className="shrink-0" />
          <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm }}>{error}</span>
        </div>
      )}

      {/* Info */}
      <div
        className="flex items-start gap-3"
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.12)',
          marginBottom: 24,
        }}
      >
        <KeyRound size={16} color="#3B82F6" className="shrink-0" style={{ marginTop: 1 }} />
        <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
          Mã xác thực thay đổi mỗi 30 giây. Nhập mã hiện tại đang hiển thị trên ứng dụng
          authenticator.
        </p>
      </div>

      {/* Actions */}
      <div className="flex" style={{ gap: 12 }}>
        <button
          onClick={() => {
            setStep(0);
            setOtp(['', '', '', '', '', '']);
            setError('');
          }}
          className="flex items-center justify-center"
          style={{
            height: WEB_BUTTON.lg,
            borderRadius: 10,
            padding: '0 24px',
            background: c.surface,
            color: c.text1,
            fontSize: WEB_FONT.md,
            fontWeight: 500,
            cursor: 'pointer',
            border: `1.5px solid ${c.borderSolid}`,
          }}
        >
          <ArrowLeft size={16} style={{ marginRight: 6 }} />
          Quay lại
        </button>
        <button
          onClick={handleVerifyOTP}
          disabled={isLoading || otp.join('').length < 6}
          className="flex-1 flex items-center justify-center gap-2"
          style={{
            height: WEB_BUTTON.lg,
            borderRadius: 10,
            background:
              isLoading || otp.join('').length < 6
                ? c.surface2
                : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
            color: '#fff',
            fontSize: WEB_FONT.md,
            fontWeight: 600,
            cursor: isLoading || otp.join('').length < 6 ? 'not-allowed' : 'pointer',
            border: 'none',
            boxShadow:
              isLoading || otp.join('').length < 6 ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
            transition: 'all 0.15s ease',
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
              Xác minh
              <ArrowRight size={16} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
