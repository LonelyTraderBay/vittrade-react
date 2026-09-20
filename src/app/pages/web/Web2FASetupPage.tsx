import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Shield, Copy, CheckCircle, Download, ArrowRight,
  ArrowLeft, AlertCircle, KeyRound, Smartphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * Web2FASetupPage — Enterprise Desktop 2FA Setup
 * 3-step wizard: (1) Scan QR → (2) Verify code → (3) Save backup codes
 * 2-column layout with animated brand panel.
 *
 * Route: /w/auth/2fa-setup
 */

const SECRET_KEY = 'JBSWY3DPEHPK3PXP';
const BACKUP_CODES = [
  '84923-13721', '29381-84752', '56743-29187',
  '93847-65432', '12837-49283', '67421-38597',
  '45129-87634', '31892-54617',
];

/* ─── QR Code SVG ─── */
function QRCodeSVG() {
  const pattern: [number, number][] = [
    [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
    [1,0],[1,6],[2,0],[2,2],[2,3],[2,4],[2,6],
    [3,0],[3,2],[3,4],[3,6],[4,0],[4,2],[4,3],[4,4],[4,6],
    [5,0],[5,6],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],
    [2,9],[3,8],[3,10],[4,9],[5,8],[5,11],[6,9],[6,10],
    [8,2],[8,3],[9,2],[9,4],[10,3],[10,4],[11,2],[11,3],
  ];
  return (
    <svg width="180" height="180" viewBox="0 0 15 15" fill="none">
      <rect width="15" height="15" fill="#FFFFFF" rx="1" />
      {pattern.map(([r, col], i) => (
        <rect key={i} x={col} y={r} width="1" height="1" fill="#111827" />
      ))}
      <rect x="1" y="1" width="5" height="5" fill="none" stroke="#111827" strokeWidth="0.5" />
      <rect x="2" y="2" width="3" height="3" fill="#111827" />
      <rect x="9" y="1" width="5" height="5" fill="none" stroke="#111827" strokeWidth="0.5" />
      <rect x="10" y="2" width="3" height="3" fill="#111827" />
      <rect x="1" y="9" width="5" height="5" fill="none" stroke="#111827" strokeWidth="0.5" />
      <rect x="2" y="10" width="3" height="3" fill="#111827" />
    </svg>
  );
}

/* ─── Step Indicator ─── */
function StepIndicator({ current, c }: { current: number; c: any }) {
  const steps = ['Quét mã QR', 'Xác minh', 'Mã dự phòng'];
  return (
    <div className="flex items-center" style={{ gap: 0, marginBottom: 32 }}>
      {steps.map((label, i) => (
        <div key={i} className="flex items-center" style={{ gap: 0 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i <= current ? '#3B82F6' : c.surface,
                border: i <= current ? 'none' : `1.5px solid ${c.borderSolid}`,
                transition: 'all 0.25s ease',
              }}
            >
              {i < current ? (
                <CheckCircle size={14} color="#fff" strokeWidth={2.5} />
              ) : (
                <span style={{
                  color: i === current ? '#fff' : c.text3,
                  fontSize: 12, fontWeight: 600,
                }}>{i + 1}</span>
              )}
            </div>
            <span style={{
              color: i <= current ? c.text1 : c.text3,
              fontSize: WEB_FONT.xs, fontWeight: i === current ? 600 : 400,
              whiteSpace: 'nowrap',
            }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 32, height: 1, marginLeft: 8, marginRight: 8,
              background: i < current ? '#3B82F6' : c.borderSolid,
              transition: 'background 0.25s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

export function Web2FASetupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const c = useThemeColors();

  const [step, setStep] = useState(0); // 0=QR, 1=verify, 2=backup
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [copied, setCopied] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [savedCodes, setSavedCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ─── Copy secret key ─── */
  const handleCopyKey = () => {
    navigator.clipboard.writeText(SECRET_KEY).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ─── Copy all backup codes ─── */
  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(BACKUP_CODES.join('\n')).catch(() => {});
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
    if (code.length < 6) { setError('Vui lòng nhập đủ 6 chữ số'); return; }
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    // Demo: accept any 6-digit code
    setIsLoading(false);
    setStep(2);
  };

  /* ─── Complete setup ─── */
  const handleComplete = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    login('demo@vittrade.vn', '');
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
              gap: 6, color: c.text2, fontSize: WEB_FONT.sm,
              marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} />
            Bỏ qua thiết lập
          </button>
        )}

        {/* Step indicator */}
        <StepIndicator current={step} c={c} />

        {/* ═══════════════════════════════════════
            Step 1: Scan QR Code
           ═══════════════════════════════════════ */}
        {step === 0 && (
          <div>
            {/* Header */}
            <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(59,130,246,0.08)', marginBottom: 16,
                }}
              >
                <Shield size={28} color="#3B82F6" />
              </div>
              <h1 style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
                Quét mã QR
              </h1>
              <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5, textAlign: 'center', maxWidth: 360 }}>
                Mở ứng dụng <span style={{ fontWeight: 600, color: c.text1 }}>Google Authenticator</span> hoặc{' '}
                <span style={{ fontWeight: 600, color: c.text1 }}>Authy</span> và quét mã bên dưới.
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center" style={{ marginBottom: 24 }}>
              <div
                style={{
                  borderRadius: 20, padding: 20,
                  background: '#fff',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  border: `1px solid ${c.borderSolid}`,
                }}
              >
                <QRCodeSVG />
              </div>
            </div>

            {/* Secret key manual entry */}
            <div
              style={{
                padding: '14px 18px', borderRadius: 12,
                background: c.surface, border: `1px solid ${c.borderSolid}`,
                marginBottom: 16,
              }}
            >
              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginBottom: 8 }}>
                Hoặc nhập thủ công khóa bí mật:
              </p>
              <div className="flex items-center justify-between" style={{ gap: 12 }}>
                <span style={{
                  color: c.text1, fontSize: WEB_FONT.md,
                  fontFamily: 'monospace', fontWeight: 600, letterSpacing: 2,
                }}>
                  {SECRET_KEY}
                </span>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center shrink-0"
                  style={{
                    gap: 6, padding: '6px 12px', borderRadius: 8,
                    background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.08)',
                    color: copied ? '#10B981' : '#3B82F6',
                    fontSize: WEB_FONT.xs, fontWeight: 500,
                    border: 'none', cursor: 'pointer',
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
                padding: '12px 16px', borderRadius: 10,
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
                height: WEB_BUTTON.lg, borderRadius: 10, width: '100%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                cursor: 'pointer', border: 'none',
                boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
              }}
            >
              Tiếp theo — Xác minh mã
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════
            Step 2: Verify OTP from Authenticator
           ═══════════════════════════════════════ */}
        {step === 1 && (
          <div>
            {/* Header */}
            <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(59,130,246,0.08)', marginBottom: 16,
                }}
              >
                <Smartphone size={28} color="#3B82F6" />
              </div>
              <h1 style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
                Xác minh mã
              </h1>
              <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5, textAlign: 'center', maxWidth: 360 }}>
                Nhập mã 6 chữ số từ ứng dụng xác thực để hoàn tất liên kết.
              </p>
            </div>

            {/* OTP input boxes */}
            <div className="flex justify-center" style={{ gap: 10, marginBottom: 16 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOTPChange(i, e.target.value)}
                  onKeyDown={e => handleOTPKeyDown(i, e)}
                  onPaste={i === 0 ? handleOTPPaste : undefined}
                  disabled={isLoading}
                  className="outline-none text-center"
                  style={{
                    width: 52, height: 60, borderRadius: 12,
                    border: `2px solid ${
                      error ? '#EF4444'
                      : digit ? '#3B82F6'
                      : c.borderSolid
                    }`,
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
                  padding: '10px 14px', borderRadius: 10,
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
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.12)',
                marginBottom: 24,
              }}
            >
              <KeyRound size={16} color="#3B82F6" className="shrink-0" style={{ marginTop: 1 }} />
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                Mã xác thực thay đổi mỗi 30 giây. Nhập mã hiện tại đang hiển thị trên ứng dụng authenticator.
              </p>
            </div>

            {/* Actions */}
            <div className="flex" style={{ gap: 12 }}>
              <button
                onClick={() => { setStep(0); setOtp(['', '', '', '', '', '']); setError(''); }}
                className="flex items-center justify-center"
                style={{
                  height: WEB_BUTTON.lg, borderRadius: 10,
                  padding: '0 24px',
                  background: c.surface, color: c.text1,
                  fontSize: WEB_FONT.md, fontWeight: 500,
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
                  height: WEB_BUTTON.lg, borderRadius: 10,
                  background: (isLoading || otp.join('').length < 6) ? c.surface2 : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                  color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                  cursor: (isLoading || otp.join('').length < 6) ? 'not-allowed' : 'pointer',
                  border: 'none',
                  boxShadow: (isLoading || otp.join('').length < 6) ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isLoading ? (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                ) : (
                  <div className="flex items-center" style={{ gap: 8 }}>
                    Xác minh
                    <ArrowRight size={16} />
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════
            Step 3: Backup Codes
           ═══════════════════════════════════════ */}
        {step === 2 && (
          <div>
            {/* Header */}
            <div className="flex flex-col items-center" style={{ marginBottom: 24 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(16,185,129,0.08)', marginBottom: 16,
                }}
              >
                <Download size={28} color="#10B981" />
              </div>
              <h1 style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
                Lưu mã dự phòng
              </h1>
              <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5, textAlign: 'center', maxWidth: 360 }}>
                Lưu các mã này ở nơi an toàn. Dùng khi bạn mất thiết bị xác thực.
              </p>
            </div>

            {/* Success banner */}
            <div
              className="flex items-center gap-3"
              style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                marginBottom: 20,
              }}
            >
              <CheckCircle size={18} color="#10B981" className="shrink-0" />
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 600, color: '#10B981' }}>2FA đã được kích hoạt!</span>
                {' '}Bây giờ hãy lưu lại các mã dự phòng bên dưới.
              </p>
            </div>

            {/* Backup codes grid */}
            <div
              style={{
                padding: '18px 20px', borderRadius: 12,
                background: c.surface, border: `1px solid ${c.borderSolid}`,
                marginBottom: 16,
              }}
            >
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '10px 24px',
              }}>
                {BACKUP_CODES.map((code, i) => (
                  <div key={code} className="flex items-center" style={{ gap: 8 }}>
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs, width: 18, textAlign: 'right' }}>
                      {i + 1}.
                    </span>
                    <span style={{
                      color: c.text1, fontSize: WEB_FONT.md,
                      fontFamily: 'monospace', fontWeight: 600, letterSpacing: 1,
                    }}>
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
                gap: 8, height: 40, borderRadius: 10, width: '100%',
                background: copiedCodes ? 'rgba(16,185,129,0.08)' : c.surface,
                color: copiedCodes ? '#10B981' : c.text1,
                fontSize: WEB_FONT.sm, fontWeight: 500,
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
                padding: '12px 16px', borderRadius: 10,
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
                gap: 12, marginBottom: 20,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 22, height: 22, borderRadius: 6,
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
                height: WEB_BUTTON.lg, borderRadius: 10, width: '100%',
                background: (!savedCodes || isLoading) ? c.surface2 : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                cursor: (!savedCodes || isLoading) ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: (!savedCodes || isLoading) ? 'none' : '0 4px 16px rgba(16,185,129,0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              {isLoading ? (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : (
                <div className="flex items-center" style={{ gap: 8 }}>
                  Hoàn tất thiết lập
                  <ArrowRight size={16} />
                </div>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            Cần trợ giúp?{' '}
            <button className="hover:underline" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Hướng dẫn thiết lập 2FA
            </button>
          </p>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
