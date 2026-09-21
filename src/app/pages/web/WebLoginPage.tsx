import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, AlertCircle, Fingerprint, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * WebLoginPage — Enterprise Desktop Login
 * 2-column layout: animated brand panel (left) + form panel (right)
 * Inline validation: email format on blur
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WebLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const c = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailBlurError, setEmailBlurError] = useState('');
  const [focusField, setFocusField] = useState<'email' | 'password' | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const MAX_ATTEMPTS = 5;

  /* ─── Inline email validation on blur ─── */
  const handleEmailBlur = () => {
    setFocusField(null);
    if (email && !EMAIL_RE.test(email)) {
      setEmailBlurError('Định dạng email không hợp lệ');
    } else {
      setEmailBlurError('');
    }
  };

  const handleLogin = async () => {
    if (!email) {
      setError('Vui lòng nhập email hoặc số điện thoại.');
      return;
    }
    if (emailBlurError) {
      setError(emailBlurError);
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    setError('');
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    // Demo: "wrong@test.com" with any password = fail, all others = success
    // This simulates failed login attempts for demo purposes
    if (email === 'wrong@test.com') {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setIsLoading(false);

      if (newAttempts >= MAX_ATTEMPTS) {
        navigate('/w/auth/account-locked', {
          state: {
            email,
            attempts: newAttempts,
            unlockTime: Date.now() + 15 * 60 * 1000,
          },
        });
        return;
      }

      setError(
        `Mật khẩu không đúng. Còn ${MAX_ATTEMPTS - newAttempts} lần thử trước khi tài khoản bị khóa.`,
      );
      return;
    }

    // Demo: "2fa@test.com" = trigger 2FA flow
    if (email === '2fa@test.com') {
      setIsLoading(false);
      navigate('/w/auth/otp', {
        state: { contact: email, type: 'email', purpose: '2fa' },
      });
      return;
    }

    // Demo: "device@test.com" = trigger new device trust flow
    if (email === 'device@test.com') {
      setIsLoading(false);
      navigate('/w/auth/device-trust', {
        state: { email, returnTo: '/w/home' },
      });
      return;
    }

    login(email, password);
    navigate('/w/home', { replace: true });
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    login('demo@vittrade.vn', 'demo');
    navigate('/w/home', { replace: true });
  };

  const emailBorder =
    focusField === 'email'
      ? '#3B82F6'
      : emailBlurError || (error && !email)
        ? '#EF4444'
        : c.borderSolid;

  const passwordBorder =
    focusField === 'password' ? '#3B82F6' : error && !password ? '#EF4444' : c.borderSolid;

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      {/* ═══ LEFT: Animated Brand Panel ═══ */}
      <WebAuthBrandPanel />

      {/* ═══ RIGHT: Form Panel ═══ */}
      <WebAuthFormShell textColor={c.text1}>
        {/* Form header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 6 }}
          >
            Đăng nhập
          </h1>
          <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5 }}>
            Chào mừng bạn quay lại! Nhập thông tin để truy cập tài khoản.
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col" style={{ gap: 20 }}>
          {/* Email field */}
          <div>
            <label
              style={{
                display: 'block',
                color: c.text2,
                fontSize: WEB_FONT.sm,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              Email / Số điện thoại
            </label>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                border: `1.5px solid ${emailBorder}`,
                background: c.surface,
                padding: '0 14px',
                gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              <Mail size={16} color={c.text3} className="shrink-0" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setEmailBlurError('');
                }}
                onFocus={() => setFocusField('email')}
                onBlur={handleEmailBlur}
                autoComplete="email"
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
            </div>
            {emailBlurError && !focusField && (
              <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
                <AlertCircle size={12} color="#EF4444" />
                <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{emailBlurError}</span>
              </div>
            )}
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <label style={{ color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500 }}>
                Mật khẩu
              </label>
              <button
                onClick={() => navigate('/w/auth/forgot-password')}
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
                Quên mật khẩu?
              </button>
            </div>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                border: `1.5px solid ${passwordBorder}`,
                background: c.surface,
                padding: '0 14px',
                gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              <Lock size={16} color={c.text3} className="shrink-0" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField(null)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                className="shrink-0 flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPw ? <EyeOff size={16} color={c.text3} /> : <Eye size={16} color={c.text3} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <AlertCircle size={14} color="#EF4444" className="shrink-0" />
              <span style={{ color: '#EF4444', fontSize: WEB_FONT.sm }}>{error}</span>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
            style={{
              height: WEB_BUTTON.lg,
              borderRadius: 10,
              background: isLoading
                ? c.surface2
                : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
              color: '#fff',
              fontSize: WEB_FONT.md,
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              border: 'none',
              boxShadow: isLoading ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
              transition: 'all 0.15s ease',
              width: '100%',
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
                Đăng nhập
                <ArrowRight size={16} />
              </div>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center" style={{ gap: 12 }}>
            <div className="flex-1" style={{ height: 1, background: c.borderSolid }} />
            <span style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 500 }}>hoặc</span>
            <div className="flex-1" style={{ height: 1, background: c.borderSolid }} />
          </div>

          {/* Social login buttons */}
          <div className="flex" style={{ gap: 12 }}>
            <button
              disabled={isLoading}
              className="flex-1 flex items-center justify-center"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                background: c.surface,
                border: `1.5px solid ${c.borderSolid}`,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>Google</span>
            </button>
            <button
              disabled={isLoading}
              className="flex-1 flex items-center justify-center"
              style={{
                height: WEB_BUTTON.lg,
                borderRadius: 10,
                background: c.surface,
                border: `1.5px solid ${c.borderSolid}`,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={c.text1}>
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>Apple</span>
            </button>
          </div>

          {/* Demo login */}
          <button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
            style={{
              height: WEB_BUTTON.lg,
              borderRadius: 10,
              background: c.surface,
              color: c.text1,
              fontSize: WEB_FONT.md,
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              border: `1.5px solid ${c.borderSolid}`,
              transition: 'all 0.15s ease',
              width: '100%',
            }}
          >
            <Fingerprint size={18} color="#3B82F6" />
            Trải nghiệm Demo
          </button>

          {/* Register link */}
          <div className="flex items-center justify-center" style={{ gap: 4, paddingTop: 4 }}>
            <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Chưa có tài khoản?</span>
            <button
              onClick={() => navigate('/w/auth/register')}
              className="hover:underline"
              style={{
                color: '#3B82F6',
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Đăng ký ngay
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <button
              className="hover:underline"
              style={{ color: c.text2, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Điều khoản dịch vụ
            </button>{' '}
            và{' '}
            <button
              className="hover:underline"
              style={{ color: c.text2, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Chính sách bảo mật
            </button>{' '}
            của VitTrade.
          </p>
        </div>

        {/* Demo flow hints */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(59,130,246,0.03)',
            border: '1px dashed rgba(59,130,246,0.15)',
          }}
        >
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, fontWeight: 600, marginBottom: 6 }}>
            Demo flows:
          </p>
          <div className="flex flex-col" style={{ gap: 3 }}>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              <span style={{ color: '#3B82F6', fontFamily: 'monospace', fontWeight: 500 }}>
                2fa@test.com
              </span>{' '}
              → trigger 2FA OTP flow
            </p>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              <span style={{ color: '#8B5CF6', fontFamily: 'monospace', fontWeight: 500 }}>
                device@test.com
              </span>{' '}
              → new device trust verification
            </p>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              <span style={{ color: '#EF4444', fontFamily: 'monospace', fontWeight: 500 }}>
                wrong@test.com
              </span>{' '}
              → failed attempts → account locked (sau 5 lần)
            </p>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
              Bất kỳ email khác → đăng nhập thành công
            </p>
          </div>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
