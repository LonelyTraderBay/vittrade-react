import { AlertCircle, ArrowRight, CheckCircle, Copy, Download } from 'lucide-react';
import { WEB_BUTTON, WEB_FONT } from '@/shared/theme/webTokens';
import type { ThemeColors } from '@/shared/hooks/useThemeColors';
import type { MfaSetupChallenge } from '@/features/auth/api/auth-api';
interface Props {
  c: ThemeColors;
  setup: MfaSetupChallenge | null;
  isLoading: boolean;
  savedCodes: boolean;
  setSavedCodes: React.Dispatch<React.SetStateAction<boolean>>;
  copiedCodes: boolean;
  handleCopyBackupCodes: () => void;
  handleComplete: () => Promise<void>;
}

export function Web2FASetupBackupStep(props: Props) {
  const {
    c,
    setup,
    isLoading,
    savedCodes,
    setSavedCodes,
    copiedCodes,
    handleCopyBackupCodes,
    handleComplete,
  } = props;
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col items-center" style={{ marginBottom: 24 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(16,185,129,0.08)',
            marginBottom: 16,
          }}
        >
          <Download size={28} color="#10B981" />
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
          Lưu mã dự phòng
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
          Lưu các mã này ở nơi an toàn. Dùng khi bạn mất thiết bị xác thực.
        </p>
      </div>

      {/* Success banner */}
      <div
        className="flex items-center gap-3"
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.15)',
          marginBottom: 20,
        }}
      >
        <CheckCircle size={18} color="#10B981" className="shrink-0" />
        <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, color: '#10B981' }}>2FA đã được kích hoạt!</span> Bây giờ
          hãy lưu lại các mã dự phòng bên dưới.
        </p>
      </div>

      {/* Backup codes grid */}
      <div
        style={{
          padding: '18px 20px',
          borderRadius: 12,
          background: c.surface,
          border: `1px solid ${c.borderSolid}`,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px 24px',
          }}
        >
          {(setup?.backupCodes ?? []).map((code, i) => (
            <div key={code} className="flex items-center" style={{ gap: 8 }}>
              <span
                style={{
                  color: c.text3,
                  fontSize: WEB_FONT.xs,
                  width: 18,
                  textAlign: 'right',
                }}
              >
                {i + 1}.
              </span>
              <span
                style={{
                  color: c.text1,
                  fontSize: WEB_FONT.md,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                {code}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Copy codes button */}
      <button
        onClick={handleCopyBackupCodes}
        className="flex items-center justify-center"
        style={{
          gap: 8,
          height: 40,
          borderRadius: 10,
          width: '100%',
          background: copiedCodes ? 'rgba(16,185,129,0.08)' : c.surface,
          color: copiedCodes ? '#10B981' : c.text1,
          fontSize: WEB_FONT.sm,
          fontWeight: 500,
          cursor: 'pointer',
          border: `1.5px solid ${copiedCodes ? 'rgba(16,185,129,0.3)' : c.borderSolid}`,
          marginBottom: 16,
          transition: 'all 0.15s ease',
        }}
      >
        {copiedCodes ? <CheckCircle size={14} /> : <Copy size={14} />}
        {copiedCodes ? 'Đã sao chép tất cả mã' : 'Sao chép tất cả mã'}
      </button>

      {/* Warning */}
      <div
        className="flex items-start gap-3"
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.15)',
          marginBottom: 20,
        }}
      >
        <AlertCircle size={16} color="#EF4444" className="shrink-0" style={{ marginTop: 1 }} />
        <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
          Mỗi mã chỉ dùng được <span style={{ fontWeight: 600, color: '#EF4444' }}>1 lần</span>.
          Không chia sẻ mã với bất kỳ ai. Lưu ở nơi an toàn ngoại tuyến.
        </p>
      </div>

      {/* Confirm checkbox */}
      <button
        onClick={() => setSavedCodes(!savedCodes)}
        className="flex items-center"
        style={{
          gap: 12,
          marginBottom: 20,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: savedCodes ? '#3B82F6' : 'transparent',
            border: `2px solid ${savedCodes ? '#3B82F6' : c.borderSolid}`,
            transition: 'all 0.15s ease',
          }}
        >
          {savedCodes && <CheckCircle size={13} color="#fff" strokeWidth={3} />}
        </div>
        <span style={{ color: c.text2, fontSize: WEB_FONT.sm, textAlign: 'left' }}>
          Tôi đã lưu mã dự phòng ở nơi an toàn
        </span>
      </button>

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={!savedCodes || isLoading}
        className="flex items-center justify-center gap-2"
        style={{
          height: WEB_BUTTON.lg,
          borderRadius: 10,
          width: '100%',
          background:
            !savedCodes || isLoading
              ? c.surface2
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          color: '#fff',
          fontSize: WEB_FONT.md,
          fontWeight: 600,
          cursor: !savedCodes || isLoading ? 'not-allowed' : 'pointer',
          border: 'none',
          boxShadow: !savedCodes || isLoading ? 'none' : '0 4px 16px rgba(16,185,129,0.3)',
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
            Hoàn tất thiết lập
            <ArrowRight size={16} />
          </div>
        )}
      </button>
    </div>
  );
}
