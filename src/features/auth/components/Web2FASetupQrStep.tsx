import { AlertCircle, ArrowRight, CheckCircle, Copy, Shield } from 'lucide-react';
import { WEB_BUTTON, WEB_FONT } from '@/shared/theme/webTokens';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import type { MfaSetupChallenge } from '@/features/auth/api/auth-api';
interface Props {
  c: ThemeColors;
  setup: MfaSetupChallenge | null;
  copied: boolean;
  handleCopyKey: () => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}
function QRCodeSVG({ src }: { src?: string }) {
  return src ? (
    <img src={src} width="180" height="180" alt="Mã QR thiết lập xác thực hai bước" />
  ) : (
    <div
      style={{ width: 180, height: 180, display: 'grid', placeItems: 'center', color: '#6B7280' }}
      aria-label="Đang tải mã QR"
    >
      Đang tải...
    </div>
  );
}

export function Web2FASetupQrStep(props: Props) {
  const { c, setup, copied, handleCopyKey, setStep, inputRefs } = props;
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
          <Shield size={28} color="#3B82F6" />
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
          Quét mã QR
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
          Mở ứng dụng <span style={{ fontWeight: 600, color: c.text1 }}>Google Authenticator</span>{' '}
          hoặc <span style={{ fontWeight: 600, color: c.text1 }}>Authy</span> và quét mã bên dưới.
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center" style={{ marginBottom: 24 }}>
        <div
          style={{
            borderRadius: 20,
            padding: 20,
            background: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: `1px solid ${c.borderSolid}`,
          }}
        >
          <QRCodeSVG src={setup?.qrCodeUrl} />
        </div>
      </div>

      {/* Secret key manual entry */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 12,
          background: c.surface,
          border: `1px solid ${c.borderSolid}`,
          marginBottom: 16,
        }}
      >
        <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 8 }}>
          Hoặc nhập thủ công khóa bí mật:
        </p>
        <div className="flex items-center justify-between" style={{ gap: 12 }}>
          <span
            style={{
              color: c.text1,
              fontSize: WEB_FONT.md,
              fontFamily: 'monospace',
              fontWeight: 600,
              letterSpacing: 2,
            }}
          >
            {setup?.secret ?? 'Đang tải khóa bảo mật...'}
          </span>
          <button
            onClick={handleCopyKey}
            className="flex items-center shrink-0"
            style={{
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.08)',
              color: copied ? '#10B981' : '#3B82F6',
              fontSize: WEB_FONT.xs,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>
        </div>
      </div>

      {/* Warning */}
      <div
        className="flex items-start gap-3"
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.15)',
          marginBottom: 24,
        }}
      >
        <AlertCircle size={16} color="#F59E0B" className="shrink-0" style={{ marginTop: 1 }} />
        <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
          Giữ bí mật khóa này. Không chia sẻ với bất kỳ ai, kể cả nhân viên hỗ trợ.
        </p>
      </div>

      {/* Next button */}
      <button
        onClick={() => {
          setStep(1);
          setTimeout(() => inputRefs.current[0]?.focus(), 200);
        }}
        className="flex items-center justify-center gap-2"
        style={{
          height: WEB_BUTTON.lg,
          borderRadius: 10,
          width: '100%',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
          color: '#fff',
          fontSize: WEB_FONT.md,
          fontWeight: 600,
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
        }}
      >
        Tiếp theo — Xác minh mã
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
