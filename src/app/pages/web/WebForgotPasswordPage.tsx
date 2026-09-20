import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Mail, ArrowRight, ArrowLeft, AlertCircle,
  CheckCircle, KeyRound,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * WebForgotPasswordPage — Enterprise Desktop Forgot Password
 * 2-step flow: (1) Enter email → (2) Confirmation sent
 *
 * Step 3 (reset password) is handled by WebResetPasswordPage
 * which the user accesses via the email link.
 *
 * Route: /w/auth/forgot-password
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'sent';

/* ─── Step indicator ─── */
function StepIndicator({ current, c }: { current: number; c: any }) {
  const steps = ['Nhập email', 'Kiểm tra email'];
  return (
    <div className="flex items-center" style={{ gap: 8, marginBottom: 28 }}>
      {steps.map((label, i) => (
        <div key={i} className="flex items-center" style={{ gap: 8 }}>
          <div className="flex items-center" style={{ gap: 6 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: i <= current ? '#3B82F6' : c.surface,
                border: i <= current ? 'none' : `1.5px solid ${c.borderSolid}`,
                transition: 'all 0.2s ease',
              }}
            >
              {i < current ? (
                <CheckCircle size={14} color="#fff" strokeWidth={2.5} />
              ) : (
                <span style={{
                  color: i === current ? '#fff' : c.text3,
                  fontSize: 11, fontWeight: 600,
                }}>{i + 1}</span>
              )}
            </div>
            <span style={{
              color: i <= current ? c.text1 : c.text3,
              fontSize: WEB_FONT.xs, fontWeight: i === current ? 600 : 400,
            }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 24, height: 1,
              background: i < current ? '#3B82F6' : c.borderSolid,
              transition: 'background 0.2s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Inline field error ─── */
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
      <AlertCircle size={12} color="#EF4444" />
      <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{msg}</span>
    </div>
  );
}

export function WebForgotPasswordPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);

  const stepIndex = step === 'email' ? 0 : 1;

  /* ─── Inline email validation on blur ─── */
  const handleEmailBlur = () => {
    setFocusField(null);
    if (email && !EMAIL_RE.test(email)) {
      setEmailError('Định dạng email không hợp lệ');
    }
  };

  const handleSubmitEmail = async () => {
    if (!email.trim()) { setEmailError('Vui lòng nhập email'); return; }
    if (!EMAIL_RE.test(email)) { setEmailError('Định dạng email không hợp lệ'); return; }
    setEmailError('');
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    setStep('sent');
  };

  const handleResend = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setIsLoading(false);
  };

  const emailBorder =
    focusField === 'email' ? '#3B82F6'
    : emailError ? '#EF4444'
    : c.borderSolid;

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline="Đặt lại mật khẩu nhanh chóng và an toàn. Chúng tôi sẽ gửi hướng dẫn tới email đã đăng ký của bạn." />

      <WebAuthFormShell textColor={c.text1}>
        {/* Back to login */}
        <button
          onClick={() => navigate('/w/auth/login')}
          className="flex items-center hover:underline"
          style={{
            gap: 6, color: c.text2, fontSize: WEB_FONT.sm,
            marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </button>

        {/* Step indicator */}
        <StepIndicator current={stepIndex} c={c} />

        {/* ─── Step 1: Enter email ─── */}
        {step === 'email' && (
          <div>
            <div className="flex flex-col items-center" style={{ marginBottom: 28 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(59,130,246,0.08)', marginBottom: 16,
                }}
              >
                <KeyRound size={28} color="#3B82F6" />
              </div>
              <h1 style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
                Quên mật khẩu?
              </h1>
              <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5, textAlign: 'center', maxWidth: 340 }}>
                Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.
              </p>
            </div>

            {/* Email input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>
                Email đã đăng ký
              </label>
              <div
                className="flex items-center"
                style={{
                  height: WEB_BUTTON.lg, borderRadius: 10,
                  border: `1.5px solid ${emailBorder}`,
                  background: c.surface, padding: '0 14px', gap: 10,
                  transition: 'border-color 0.15s ease',
                }}
              >
                <Mail size={16} color={c.text3} className="shrink-0" />
                <input
                  type="email" placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  onFocus={() => setFocusField('email')}
                  onBlur={handleEmailBlur}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitEmail()}
                  autoComplete="email"
                  className="flex-1 bg-transparent outline-none min-w-0"
                  style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
                />
              </div>
              <FieldError msg={focusField !== 'email' ? emailError : undefined} />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmitEmail}
              disabled={isLoading}
              className="flex items-center justify-center gap-2"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 10, width: '100%',
                background: isLoading ? c.surface2 : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                border: 'none',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
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
                  Gửi liên kết đặt lại
                  <ArrowRight size={16} />
                </div>
              )}
            </button>
          </div>
        )}

        {/* ─── Step 2: Email sent confirmation ─── */}
        {step === 'sent' && (
          <div className="flex flex-col items-center" style={{ paddingTop: 12 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'rgba(16,185,129,0.08)', marginBottom: 20,
              }}
            >
              <Mail size={32} color="#10B981" />
            </div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
              Kiểm tra email
            </h1>
            <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5, textAlign: 'center', maxWidth: 360, marginBottom: 8 }}>
              Chúng tôi đã gửi liên kết đặt lại mật khẩu tới:
            </p>
            <div
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: c.surface, border: `1px solid ${c.borderSolid}`,
                marginBottom: 24,
              }}
            >
              <span style={{ color: c.text1, fontSize: WEB_FONT.md, fontWeight: 600 }}>{email}</span>
            </div>

            {/* Info box */}
            <div
              style={{
                padding: '14px 18px', borderRadius: 12,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.12)',
                width: '100%', marginBottom: 24,
              }}
            >
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                Liên kết sẽ hết hạn sau <span style={{ color: c.text1, fontWeight: 600 }}>15 phút</span>. Nếu không nhận được email, kiểm tra thư mục Spam hoặc thử lại.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col" style={{ gap: 12, width: '100%' }}>
              {/* Simulate "open email link" → go to reset-password page */}
              <button
                onClick={() => navigate('/w/auth/reset-password', { state: { email, token: 'valid-token' } })}
                className="flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg, borderRadius: 10, width: '100%',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
                  color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
                  cursor: 'pointer', border: 'none',
                  boxShadow: '0 4px 16px rgba(59,130,246,0.25)',
                }}
              >
                Tôi đã nhận email — Đặt lại mật khẩu
                <ArrowRight size={16} />
              </button>
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="flex items-center justify-center"
                style={{
                  height: WEB_BUTTON.lg, borderRadius: 10, width: '100%',
                  background: c.surface, color: c.text1,
                  fontSize: WEB_FONT.md, fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  border: `1.5px solid ${c.borderSolid}`,
                }}
              >
                {isLoading ? 'Đang gửi lại...' : 'Gửi lại email'}
              </button>
            </div>

            {/* Help tips */}
            <div
              style={{
                marginTop: 24, padding: '14px 18px', borderRadius: 12,
                background: c.surface, border: `1px solid ${c.borderSolid}`,
                width: '100%',
              }}
            >
              <p style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 600, marginBottom: 6 }}>
                Không nhận được email?
              </p>
              <ul style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
                <li>Kiểm tra thư mục Spam / Junk</li>
                <li>Đảm bảo email <span style={{ color: c.text2, fontWeight: 500 }}>{email}</span> chính xác</li>
                <li>Thử gửi lại email bằng nút phía trên</li>
                <li>Liên hệ{' '}
                  <button className="hover:underline" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
                    hỗ trợ
                  </button> nếu vẫn gặp vấn đề
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            Cần trợ giúp?{' '}
            <button className="hover:underline" style={{ color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
              Liên hệ hỗ trợ
            </button>
          </p>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
