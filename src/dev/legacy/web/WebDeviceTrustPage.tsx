import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Monitor,
  Smartphone,
  Globe,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Mail,
  KeyRound,
  CheckCircle,
  XCircle,
  Info,
  Fingerprint,
  Chrome,
} from 'lucide-react';
import { useAuth } from '@/shared/session/useAuth';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '@/shared/theme/webTokens';
import { WebAuthBrandPanel, WebAuthFormShell } from '@/shared/ui/auth/WebAuthBrandPanel';

/**
 * WebDeviceTrustPage — New/unrecognized device verification
 *
 * Route: /w/auth/device-trust
 * Receives via location.state: { email, device, ip, location, browser, returnTo }
 *
 * Flow:
 *   Login → detect unknown device → /w/auth/device-trust
 *     → choose method (email OTP / authenticator)
 *     → verify → optionally trust device
 *     → continue to app
 *
 * Steps:
 *   0 = Device info & choose method
 *   1 = Verification (email OTP or authenticator code)
 *   2 = Trust decision + success
 */

/* ═══ Mock device data ═══ */
const MOCK_DEVICE = {
  name: 'Chrome trên macOS',
  browser: 'Chrome 122',
  os: 'macOS Sonoma 14.3',
  ip: '103.152.xxx.xxx',
  location: 'Hà Nội, Việt Nam',
  time: new Date().toLocaleString('vi-VN'),
  isNew: true,
  riskLevel: 'medium' as const, // low | medium | high
};

type VerifyMethod = 'email' | 'authenticator';
type RiskLevel = 'low' | 'medium' | 'high';

const RISK_CONFIG: Record<RiskLevel, { color: string; label: string; bg: string; border: string }> =
  {
    low: {
      color: '#10B981',
      label: 'Rủi ro thấp',
      bg: 'rgba(16,185,129,0.06)',
      border: 'rgba(16,185,129,0.15)',
    },
    medium: {
      color: '#F59E0B',
      label: 'Cần xác minh',
      bg: 'rgba(245,158,11,0.06)',
      border: 'rgba(245,158,11,0.15)',
    },
    high: {
      color: '#EF4444',
      label: 'Rủi ro cao',
      bg: 'rgba(239,68,68,0.06)',
      border: 'rgba(239,68,68,0.15)',
    },
  };

/* ═══ Spinner ═══ */
function Spinner() {
  return (
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
  );
}

export function WebDeviceTrustPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMfa } = useAuth();
  const c = useThemeColors();

  const state = location.state as {
    email?: string;
    returnTo?: string;
  } | null;

  const email = state?.email || 'user@vittrade.vn';
  const returnTo = state?.returnTo || '/w/home';
  const device = MOCK_DEVICE;
  const risk = RISK_CONFIG[device.riskLevel];

  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<VerifyMethod>('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [trustDuration, setTrustDuration] = useState<30 | 90 | 365>(30);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  /* ─── Resend countdown ─── */
  useEffect(() => {
    if (step !== 1 || canResend) return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [step, countdown, canResend]);

  /* ─── Mask email ─── */
  const maskEmail = (val: string) => {
    if (!val.includes('@')) return val;
    const [local, domain] = val.split('@');
    return `${local.slice(0, 2)}${'•'.repeat(Math.max(local.length - 2, 2))}@${domain}`;
  };

  /* ─── OTP handlers ─── */
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

  /* ─── Step actions ─── */
  const handleSendCode = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setStep(1);
    setCountdown(60);
    setCanResend(false);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setIsLoading(true);
    try {
      await verifyMfa({ contact: email, code, purpose: 'device-trust' });
      setStep(2);
    } catch {
      setError('Mã xác thực không đúng. Vui lòng thử lại.');
      setIsLoading(false);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
    setIsLoading(false);
  };

  const handleComplete = () => {
    navigate(returnTo, { replace: true });
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(60);
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
  };

  /* ═══════════════════════════════════════════════════════════
     STEP 0 — Device info + Choose verification method
     ═══════════════════════════════════════════════════════════ */
  const renderStep0 = () => (
    <div>
      {/* Header */}
      <div className="flex flex-col items-center" style={{ marginBottom: 24 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: risk.bg,
            border: `2px solid ${risk.border}`,
            marginBottom: 20,
          }}
        >
          <ShieldAlert size={32} color={risk.color} />
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
          Thiết bị mới được phát hiện
        </h1>
        <p
          style={{
            color: c.text2,
            fontSize: WEB_FONT.md,
            lineHeight: 1.5,
            textAlign: 'center',
            maxWidth: 380,
          }}
        >
          Đăng nhập từ thiết bị chưa được nhận dạng. Xác minh danh tính để tiếp tục.
        </p>
      </div>

      {/* Risk badge */}
      <div className="flex justify-center" style={{ marginBottom: 20 }}>
        <div
          className="flex items-center gap-2"
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            background: risk.bg,
            border: `1px solid ${risk.border}`,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: risk.color }} />
          <span style={{ color: risk.color, fontSize: WEB_FONT.sm, fontWeight: 600 }}>
            {risk.label}
          </span>
        </div>
      </div>

      {/* Device info card */}
      <div
        style={{
          padding: '18px 20px',
          borderRadius: 14,
          background: c.surface,
          border: `1px solid ${c.borderSolid}`,
          marginBottom: 24,
        }}
      >
        <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
          <Monitor size={16} color={c.text2} />
          <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>
            Thông tin thiết bị
          </span>
        </div>

        <div className="flex flex-col" style={{ gap: 10 }}>
          {[
            { icon: Chrome, label: 'Trình duyệt', value: device.browser },
            { icon: Monitor, label: 'Hệ điều hành', value: device.os },
            { icon: Globe, label: 'Địa chỉ IP', value: device.ip },
            { icon: MapPin, label: 'Vị trí', value: device.location },
            { icon: Clock, label: 'Thời gian', value: device.time },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon size={13} color={c.text3} />
                <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>{item.label}</span>
              </div>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* "Not you?" warning */}
      <div
        className="flex items-start gap-3"
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(239,68,68,0.04)',
          border: '1px solid rgba(239,68,68,0.1)',
          marginBottom: 24,
        }}
      >
        <AlertTriangle size={16} color="#EF4444" className="shrink-0" style={{ marginTop: 1 }} />
        <div>
          <p style={{ color: '#EF4444', fontSize: WEB_FONT.sm, fontWeight: 600, marginBottom: 2 }}>
            Không phải bạn?
          </p>
          <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
            Nếu bạn không thực hiện đăng nhập này, hãy{' '}
            <button
              onClick={() => navigate('/w/auth/forgot-password')}
              className="hover:underline"
              style={{
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0,
              }}
            >
              đổi mật khẩu ngay
            </button>{' '}
            và liên hệ hỗ trợ.
          </p>
        </div>
      </div>

      {/* Verification method selector */}
      <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 12 }}>
        Chọn phương thức xác minh
      </p>

      <div className="flex flex-col" style={{ gap: 10, marginBottom: 24 }}>
        {[
          {
            key: 'email' as const,
            icon: Mail,
            label: 'Mã qua email',
            desc: `Gửi mã 6 chữ số đến ${maskEmail(email)}`,
          },
          {
            key: 'authenticator' as const,
            icon: KeyRound,
            label: 'Authenticator app',
            desc: 'Nhập mã từ Google/Microsoft Authenticator',
          },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setMethod(opt.key)}
            className="flex items-center"
            style={{
              gap: 14,
              padding: '14px 16px',
              borderRadius: 12,
              background: method === opt.key ? 'rgba(59,130,246,0.04)' : c.surface,
              border: `1.5px solid ${method === opt.key ? '#3B82F6' : c.borderSolid}`,
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: method === opt.key ? 'rgba(59,130,246,0.08)' : c.bg,
              }}
            >
              <opt.icon size={18} color={method === opt.key ? '#3B82F6' : c.text3} />
            </div>
            <div className="flex-1">
              <p
                style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 500, marginBottom: 2 }}
              >
                {opt.label}
              </p>
              <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.3 }}>{opt.desc}</p>
            </div>
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `2px solid ${method === opt.key ? '#3B82F6' : c.borderSolid}`,
                background: method === opt.key ? '#3B82F6' : 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {method === opt.key && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleSendCode}
        disabled={isLoading}
        className="flex items-center justify-center gap-2"
        style={{
          height: WEB_BUTTON.lg,
          borderRadius: 10,
          width: '100%',
          background: isLoading ? c.surface2 : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
          color: '#fff',
          fontSize: WEB_FONT.md,
          fontWeight: 600,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          border: 'none',
          boxShadow: isLoading ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
        }}
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="flex items-center gap-2">
            {method === 'email' ? 'Gửi mã xác minh' : 'Nhập mã xác minh'}
            <ArrowRight size={16} />
          </div>
        )}
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     STEP 1 — Enter verification code
     ═══════════════════════════════════════════════════════════ */
  const renderStep1 = () => (
    <div>
      {/* Back */}
      <button
        onClick={() => {
          setStep(0);
          setOtp(['', '', '', '', '', '']);
          setError('');
        }}
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
        Chọn phương thức khác
      </button>

      <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'rgba(59,130,246,0.06)',
            marginBottom: 16,
          }}
        >
          {method === 'email' ? (
            <Mail size={28} color="#3B82F6" />
          ) : (
            <KeyRound size={28} color="#3B82F6" />
          )}
        </div>
        <h2
          style={{
            color: c.text1,
            fontSize: WEB_FONT.xl,
            fontWeight: 700,
            marginBottom: 6,
            textAlign: 'center',
          }}
        >
          {method === 'email' ? 'Nhập mã xác minh' : 'Nhập mã từ Authenticator'}
        </h2>
        <p
          style={{
            color: c.text2,
            fontSize: WEB_FONT.sm,
            lineHeight: 1.5,
            textAlign: 'center',
            maxWidth: 360,
          }}
        >
          {method === 'email' ? (
            <>
              Mã 6 chữ số đã được gửi đến{' '}
              <span style={{ color: c.text1, fontWeight: 500 }}>{maskEmail(email)}</span>
            </>
          ) : (
            'Mở ứng dụng Authenticator và nhập mã 6 chữ số hiển thị.'
          )}
        </p>
      </div>

      {/* OTP inputs */}
      <div className="flex justify-center" style={{ gap: 10, marginBottom: 8 }}>
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
            className="text-center outline-none"
            style={{
              width: 48,
              height: 56,
              borderRadius: 12,
              border: `1.5px solid ${error ? '#EF4444' : digit ? '#3B82F6' : c.borderSolid}`,
              background: digit ? 'rgba(59,130,246,0.03)' : c.surface,
              color: c.text1,
              fontSize: 22,
              fontWeight: 700,
              fontFamily: 'monospace',
              transition: 'border-color 0.15s ease',
            }}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center justify-center gap-1.5"
          style={{ marginBottom: 12, marginTop: 8 }}
        >
          <XCircle size={13} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm }}>{error}</span>
        </div>
      )}

      {/* Resend (email only) */}
      {method === 'email' && (
        <div className="flex justify-center" style={{ marginTop: 8, marginBottom: 20 }}>
          {canResend ? (
            <button
              onClick={handleResend}
              className="hover:underline"
              style={{
                color: '#3B82F6',
                fontSize: WEB_FONT.sm,
                fontWeight: 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Gửi lại mã
            </button>
          ) : (
            <span style={{ color: c.text3, fontSize: WEB_FONT.sm }}>
              Gửi lại sau{' '}
              <span style={{ color: c.text1, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {countdown}s
              </span>
            </span>
          )}
        </div>
      )}

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={isLoading || otp.join('').length < 6}
        className="flex items-center justify-center gap-2"
        style={{
          height: WEB_BUTTON.lg,
          borderRadius: 10,
          width: '100%',
          marginTop: method === 'authenticator' ? 20 : 0,
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
        }}
      >
        {isLoading ? <Spinner /> : 'Xác minh thiết bị'}
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     STEP 2 — Success + Trust decision
     ═══════════════════════════════════════════════════════════ */
  const renderStep2 = () => (
    <div>
      {/* Success header */}
      <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(16,185,129,0.08)',
            border: '2px solid rgba(16,185,129,0.15)',
            marginBottom: 20,
          }}
        >
          <ShieldCheck size={32} color="#10B981" />
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
          Xác minh thành công!
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
          Thiết bị đã được xác minh. Chọn có tin tưởng thiết bị này hay không.
        </p>
      </div>

      {/* Trust device toggle */}
      <div
        style={{
          padding: '18px 20px',
          borderRadius: 14,
          background: trustDevice ? 'rgba(59,130,246,0.03)' : c.surface,
          border: `1.5px solid ${trustDevice ? '#3B82F6' : c.borderSolid}`,
          marginBottom: 16,
          transition: 'all 0.2s ease',
        }}
      >
        <button
          onClick={() => setTrustDevice(!trustDevice)}
          className="flex items-center"
          style={{
            gap: 14,
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: trustDevice ? '#3B82F6' : 'transparent',
              border: `2px solid ${trustDevice ? '#3B82F6' : c.borderSolid}`,
              transition: 'all 0.15s ease',
            }}
          >
            {trustDevice && <CheckCircle size={13} color="#fff" strokeWidth={3} />}
          </div>
          <div className="flex-1">
            <p style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600, marginBottom: 2 }}>
              Tin tưởng thiết bị này
            </p>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.4 }}>
              Không yêu cầu xác minh lại khi đăng nhập từ thiết bị này
            </p>
          </div>
        </button>

        {/* Trust duration */}
        {trustDevice && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${c.borderSolid}` }}>
            <p style={{ color: c.text2, fontSize: WEB_FONT.xs, fontWeight: 500, marginBottom: 10 }}>
              Thời gian tin tưởng
            </p>
            <div className="flex" style={{ gap: 8 }}>
              {[
                { days: 30 as const, label: '30 ngày' },
                { days: 90 as const, label: '90 ngày' },
                { days: 365 as const, label: '1 năm' },
              ].map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setTrustDuration(opt.days)}
                  className="flex-1 flex items-center justify-center"
                  style={{
                    height: 36,
                    borderRadius: 8,
                    background: trustDuration === opt.days ? '#3B82F6' : c.bg,
                    color: trustDuration === opt.days ? '#fff' : c.text2,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 500,
                    border: `1px solid ${trustDuration === opt.days ? '#3B82F6' : c.borderSolid}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info about trusted devices */}
      <div
        className="flex items-start gap-3"
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: 'rgba(59,130,246,0.03)',
          border: '1px solid rgba(59,130,246,0.1)',
          marginBottom: 24,
        }}
      >
        <Info size={14} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
        <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
          Bạn có thể quản lý thiết bị tin tưởng trong{' '}
          <span style={{ color: '#3B82F6', fontWeight: 500 }}>
            Cài đặt bảo mật → Quản lý thiết bị
          </span>
          . Gỡ bỏ thiết bị bất cứ lúc nào để bảo vệ tài khoản.
        </p>
      </div>

      {/* Device summary */}
      <div
        className="flex items-center gap-3"
        style={{
          padding: '12px 16px',
          borderRadius: 10,
          background: c.surface,
          border: `1px solid ${c.borderSolid}`,
          marginBottom: 24,
        }}
      >
        <Monitor size={18} color={c.text2} />
        <div className="flex-1">
          <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>{device.name}</p>
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
            {device.location} · {device.ip}
          </p>
        </div>
        <div
          className="flex items-center gap-1"
          style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(16,185,129,0.06)' }}
        >
          <CheckCircle size={11} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: WEB_FONT.xs, fontWeight: 600 }}>
            Đã xác minh
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleComplete}
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
        Tiếp tục vào VitTrade
        <ArrowRight size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline="Bảo vệ tài khoản bằng xác minh thiết bị — mỗi lần đăng nhập từ thiết bị mới sẽ được kiểm tra." />

      <WebAuthFormShell textColor={c.text1}>
        {/* Back to login (only step 0) */}
        {step === 0 && (
          <button
            onClick={() => navigate('/w/auth/login')}
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
            Quay lại đăng nhập
          </button>
        )}

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </WebAuthFormShell>
    </div>
  );
}
