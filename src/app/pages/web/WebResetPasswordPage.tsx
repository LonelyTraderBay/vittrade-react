import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * WebResetPasswordPage — Standalone desktop page for resetting password
 * via email link. Simulates receiving a reset token from URL.
 *
 * Route: /w/auth/reset-password
 * Accessible from: email link click → opens page with token in state/URL
 *
 * Flow: Set new password → Confirm → Success → Navigate to login
 */

const TOKEN_MOCK = 'valid-token'; // Simulated valid token

/* ─── Password Strength Meter ─── */
function PwStrength({ password }: { password: string }) {
  const c = useThemeColors();
  const checks = [
    { label: 'Ít nhất 8 ký tự', ok: password.length >= 8 },
    { label: 'Chữ hoa & thường', ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Có số', ok: /\d/.test(password) },
    { label: 'Ký tự đặc biệt', ok: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((ch) => ch.ok).length;
  const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'];
  const labels = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];

  return (
    <div style={{ marginTop: 8 }}>
      <div className="flex" style={{ gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: i < score ? colors[score] : c.borderSolid,
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap" style={{ gap: 8 }}>
        {checks.map((ch) => (
          <div key={ch.label} className="flex items-center" style={{ gap: 4 }}>
            {ch.ok ? (
              <CheckCircle size={11} color="#10B981" />
            ) : (
              <XCircle size={11} color={c.text3} />
            )}
            <span style={{ color: ch.ok ? '#10B981' : c.text3, fontSize: WEB_FONT.xs }}>
              {ch.label}
            </span>
          </div>
        ))}
      </div>
      {score > 0 && (
        <p style={{ color: colors[score], fontSize: WEB_FONT.xs, marginTop: 4, fontWeight: 500 }}>
          Mật khẩu {labels[score]}
        </p>
      )}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
      <AlertCircle size={12} color="#EF4444" />
      <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{msg}</span>
    </div>
  );
}

export function WebResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const c = useThemeColors();

  // Simulate token from email link (via state or URL param)
  const state = location.state as { email?: string; token?: string } | null;
  const email = state?.email || 'user@example.com';
  const token = state?.token || TOKEN_MOCK;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusField, setFocusField] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid] = useState(token === TOKEN_MOCK); // Simulate validation

  /* ─── Inline validation ─── */
  const handleConfirmBlur = () => {
    setFocusField(null);
    if (confirmPassword && newPassword && confirmPassword !== newPassword) {
      setErrors((prev) => ({ ...prev, confirm: 'Mật khẩu xác nhận không khớp' }));
    } else {
      setErrors((prev) => {
        const n = { ...prev };
        delete n.confirm;
        return n;
      });
    }
  };

  const handlePasswordBlur = () => {
    setFocusField(null);
    if (confirmPassword && newPassword && confirmPassword !== newPassword) {
      setErrors((prev) => ({ ...prev, confirm: 'Mật khẩu xác nhận không khớp' }));
    } else if (confirmPassword && newPassword && confirmPassword === newPassword) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n.confirm;
        return n;
      });
    }
  };

  const handleReset = async () => {
    const e: Record<string, string> = {};
    if (newPassword.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự';
    if (newPassword !== confirmPassword) e.confirm = 'Mật khẩu xác nhận không khớp';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsLoading(false);
    setSuccess(true);
  };

  const inputBorder = (field: string) =>
    focusField === field ? '#3B82F6' : errors[field] ? '#EF4444' : c.borderSolid;

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      <WebAuthBrandPanel tagline="Đặt mật khẩu mới cho tài khoản của bạn. Mật khẩu mạnh giúp bảo vệ tài sản an toàn hơn." />

      <WebAuthFormShell textColor={c.text1}>
        {/* ─── Token invalid state ─── */}
        {!tokenValid && (
          <div className="flex flex-col items-center" style={{ paddingTop: 40 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'rgba(239,68,68,0.08)',
                marginBottom: 20,
              }}
            >
              <AlertCircle size={32} color="#EF4444" />
            </div>
            <h1
              style={{
                color: c.text1,
                fontSize: WEB_FONT['2xl'],
                fontWeight: 700,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Liên kết không hợp lệ
            </h1>
            <p
              style={{
                color: c.text2,
                fontSize: WEB_FONT.md,
                lineHeight: 1.5,
                textAlign: 'center',
                maxWidth: 340,
                marginBottom: 28,
              }}
            >
              Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.
            </p>
            <button
              onClick={() => navigate('/w/auth/forgot-password')}
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
              Yêu cầu liên kết mới
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ─── Reset form ─── */}
        {tokenValid && !success && (
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
                <Lock size={28} color="#3B82F6" />
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
                Đặt mật khẩu mới
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
                Tạo mật khẩu mới mạnh mẽ cho tài khoản{' '}
                <span style={{ fontWeight: 600, color: c.text1 }}>{email}</span>
              </p>
            </div>

            {/* Security info */}
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
              <ShieldCheck
                size={18}
                color="#3B82F6"
                className="shrink-0"
                style={{ marginTop: 1 }}
              />
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                Sau khi đổi mật khẩu, tất cả phiên đăng nhập hiện tại sẽ bị đăng xuất. Bạn cần đăng
                nhập lại bằng mật khẩu mới.
              </p>
            </div>

            <div className="flex flex-col" style={{ gap: 18 }}>
              {/* New password */}
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
                  Mật khẩu mới
                </label>
                <div
                  className="flex items-center"
                  style={{
                    height: WEB_BUTTON.lg,
                    borderRadius: 10,
                    border: `1.5px solid ${inputBorder('password')}`,
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
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.password;
                        return n;
                      });
                    }}
                    onFocus={() => setFocusField('password')}
                    onBlur={handlePasswordBlur}
                    autoComplete="new-password"
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
                    aria-label={showPw ? 'Ẩn' : 'Hiện'}
                  >
                    {showPw ? (
                      <EyeOff size={16} color={c.text3} />
                    ) : (
                      <Eye size={16} color={c.text3} />
                    )}
                  </button>
                </div>
                {errors.password && !newPassword && <FieldError msg={errors.password} />}
                {newPassword && <PwStrength password={newPassword} />}
              </div>

              {/* Confirm new password */}
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
                  Xác nhận mật khẩu mới
                </label>
                <div
                  className="flex items-center"
                  style={{
                    height: WEB_BUTTON.lg,
                    borderRadius: 10,
                    border: `1.5px solid ${inputBorder('confirm')}`,
                    background: c.surface,
                    padding: '0 14px',
                    gap: 10,
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <Lock size={16} color={c.text3} className="shrink-0" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.confirm;
                        return n;
                      });
                    }}
                    onFocus={() => setFocusField('confirm')}
                    onBlur={handleConfirmBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                    autoComplete="new-password"
                    className="flex-1 bg-transparent outline-none min-w-0"
                    style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
                  />
                  <button
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    aria-label={showConfirmPw ? 'Ẩn' : 'Hiện'}
                  >
                    {showConfirmPw ? (
                      <EyeOff size={16} color={c.text3} />
                    ) : (
                      <Eye size={16} color={c.text3} />
                    )}
                  </button>
                </div>
                <FieldError msg={focusField !== 'confirm' ? errors.confirm : undefined} />
                {/* Realtime match indicator */}
                {confirmPassword && newPassword && !errors.confirm && focusField === 'confirm' && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
                    {confirmPassword === newPassword ? (
                      <>
                        <CheckCircle size={12} color="#10B981" />
                        <span style={{ color: '#10B981', fontSize: WEB_FONT.xs }}>
                          Mật khẩu khớp
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} color="#F59E0B" />
                        <span style={{ color: '#F59E0B', fontSize: WEB_FONT.xs }}>
                          Chưa khớp...
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="flex items-center justify-center gap-2"
                style={{
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  width: '100%',
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
                  marginTop: 4,
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
                    Đặt lại mật khẩu
                    <ArrowRight size={16} />
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── Success state ─── */}
        {tokenValid && success && (
          <div className="flex flex-col items-center" style={{ paddingTop: 24 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                background: 'rgba(16,185,129,0.08)',
                marginBottom: 20,
              }}
            >
              <ShieldCheck size={36} color="#10B981" />
            </div>
            <h1
              style={{
                color: c.text1,
                fontSize: WEB_FONT['2xl'],
                fontWeight: 700,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Đặt lại thành công!
            </h1>
            <p
              style={{
                color: c.text2,
                fontSize: WEB_FONT.md,
                lineHeight: 1.5,
                textAlign: 'center',
                maxWidth: 340,
                marginBottom: 12,
              }}
            >
              Mật khẩu của bạn đã được cập nhật thành công. Tất cả phiên cũ đã bị đăng xuất.
            </p>
            <div
              className="flex items-start gap-3"
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.12)',
                width: '100%',
                marginBottom: 28,
              }}
            >
              <CheckCircle
                size={16}
                color="#10B981"
                className="shrink-0"
                style={{ marginTop: 2 }}
              />
              <p style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
                Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ. Khuyến nghị bật 2FA để tăng bảo
                mật.
              </p>
            </div>
            <button
              onClick={() => navigate('/w/auth/login')}
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
              Đăng nhập ngay
              <ArrowRight size={16} />
            </button>
          </div>
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
              Liên hệ hỗ trợ
            </button>
          </p>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
