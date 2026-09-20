import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Smartphone,
  Key,
  RefreshCw,
  Check,
  X,
  Fingerprint,
  ArrowRight,
  Clock,
  Loader2,
  Monitor,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON, WEB_SPACING } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';

/**
 * WebChangePasswordPage — Step-up auth password change flow
 *
 * Route: /w/profile/security/change-password
 *
 * Multi-step wizard:
 *   Step 1: Enter current password (step-up auth)
 *   Step 2: Create new password + confirm (with strength meter)
 *   Step 3: 2FA verification (TOTP / SMS)
 *   Step 4: Success confirmation
 *
 * Guidelines:
 *   - §14.3: High-risk — preview + confirm + step-up auth
 *   - §5: Safety-by-design — destructive action with full confirmation
 *   - §7.2: Inputs — label, placeholder, helper, error
 *   - §15.2: Error structure — problem, reason, action
 */

/* ═══ Types ═══ */
type Step = 'current' | 'new' | '2fa' | 'success';
type TwoFAMethod = 'totp' | 'sms';

interface PasswordRule {
  id: string;
  label: string;
  test: (pw: string) => boolean;
}

/* ═══ Constants ═══ */
const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (pw) => pw.length >= 8 },
  { id: 'upper', label: 'Chứa chữ hoa (A–Z)', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lower', label: 'Chứa chữ thường (a–z)', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'Chứa số (0–9)', test: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: 'Chứa ký tự đặc biệt (!@#$...)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  {
    id: 'norepeat',
    label: 'Không chứa 3 ký tự giống liên tiếp',
    test: (pw) => !/(.)\1{2,}/.test(pw),
  },
];

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'current', label: 'Xác thực', num: 1 },
  { key: 'new', label: 'Mật khẩu mới', num: 2 },
  { key: '2fa', label: 'Xác thực 2FA', num: 3 },
  { key: 'success', label: 'Hoàn tất', num: 4 },
];

export function WebChangePasswordPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  /* ─── State ─── */
  const [step, setStep] = useState<Step>('current');
  const [currentPw, setCurrentPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [currentPwError, setCurrentPwError] = useState('');
  const [currentPwLoading, setCurrentPwLoading] = useState(false);

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [newPwTouched, setNewPwTouched] = useState(false);
  const [confirmPwTouched, setConfirmPwTouched] = useState(false);

  const [twoFAMethod, setTwoFAMethod] = useState<TwoFAMethod>('totp');
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', '']);
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);

  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ─── Timers ─── */
  useEffect(() => {
    if (smsCountdown <= 0) return;
    const t = setTimeout(() => setSmsCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [smsCountdown]);

  /* ─── Password strength ─── */
  const passedRules = PASSWORD_RULES.filter((r) => r.test(newPw));
  const strength =
    newPw.length === 0
      ? 0
      : Math.min(100, Math.round((passedRules.length / PASSWORD_RULES.length) * 100));
  const strengthLabel =
    strength >= 90
      ? 'Rất mạnh'
      : strength >= 70
        ? 'Mạnh'
        : strength >= 50
          ? 'Trung bình'
          : strength > 0
            ? 'Yếu'
            : '';
  const strengthColor =
    strength >= 90
      ? '#10B981'
      : strength >= 70
        ? '#3B82F6'
        : strength >= 50
          ? '#F59E0B'
          : '#EF4444';
  const allRulesPassed = passedRules.length === PASSWORD_RULES.length;
  const passwordsMatch = newPw === confirmPw && confirmPw.length > 0;
  const canProceedNew = allRulesPassed && passwordsMatch;
  const newPwSameAsCurrent = newPw.length > 0 && newPw === currentPw;

  /* ─── Actions ─── */
  const handleVerifyCurrent = async () => {
    if (!currentPw.trim()) {
      setCurrentPwError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    setCurrentPwLoading(true);
    setCurrentPwError('');
    await new Promise((r) => setTimeout(r, 1200));
    // Simulate: any password >= 6 chars is "correct"
    if (currentPw.length < 6) {
      setCurrentPwError('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      setCurrentPwLoading(false);
      return;
    }
    setCurrentPwLoading(false);
    setStep('new');
  };

  const handleProceedTo2FA = () => {
    if (!canProceedNew || newPwSameAsCurrent) return;
    setStep('2fa');
  };

  const handleSendSMS = () => {
    if (smsCountdown > 0) return;
    setSmsSent(true);
    setSmsCountdown(60);
  };

  const handleTotpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCodes = [...totpCode];
    newCodes[index] = value.slice(-1);
    setTotpCode(newCodes);
    if (value && index < 5) {
      totpRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !totpCode[index] && index > 0) {
      totpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify2FA = async () => {
    const code = twoFAMethod === 'totp' ? totpCode.join('') : totpCode.join('');
    if (code.length < 6) {
      setTwoFAError('Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setTwoFALoading(true);
    setTwoFAError('');
    await new Promise((r) => setTimeout(r, 1500));
    // Simulate: "123456" fails, others pass
    if (code === '123456') {
      setTwoFAError('Mã xác thực không hợp lệ. Vui lòng kiểm tra và thử lại.');
      setTwoFALoading(false);
      return;
    }
    setTwoFALoading(false);
    setStep('success');
  };

  /* ─── Styles ─── */
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: WEB_SPACING.cardDefault,
    borderRadius: 14,
    background: c.surface,
    border: `1px solid ${c.borderSolid}`,
    ...extra,
  });

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    height: WEB_BUTTON.lg,
    borderRadius: 10,
    border: `1.5px solid ${hasError ? '#EF4444' : c.borderSolid}`,
    background: c.bg,
    padding: '0 14px',
    color: c.text1,
    fontSize: WEB_FONT.md,
    outline: 'none',
    transition: 'border-color 0.15s',
  });

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <PageLayout>
      {/* ─── Header ─── */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 56,
          padding: '0 24px',
          borderBottom: `1px solid ${c.borderSolid}`,
          background: c.surface,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              step === 'current'
                ? navigate('/w/profile/security')
                : setStep(step === '2fa' ? 'new' : step === 'new' ? 'current' : 'current')
            }
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: c.bg,
              border: `1px solid ${c.borderSolid}`,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={16} color={c.text1} />
          </button>
          <div>
            <h1 style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>Đổi mật khẩu</h1>
            <p style={{ color: c.text3, fontSize: WEB_FONT.xs }}>Bảo mật &gt; Mật khẩu đăng nhập</p>
          </div>
        </div>
        {step !== 'success' && (
          <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>
            Bước {stepIdx + 1}/{STEPS.length}
          </span>
        )}
      </div>

      {/* ─── Content ─── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>
        <div className="flex flex-col" style={{ gap: 28 }}>
          {/* ═══ Step Indicator ═══ */}
          <div className="flex items-center" style={{ gap: 0 }}>
            {STEPS.map((s, i) => {
              const isActive = i === stepIdx;
              const isPast = i < stepIdx;
              const color = isPast ? '#10B981' : isActive ? '#3B82F6' : c.borderSolid;
              return (
                <div
                  key={s.key}
                  className="flex items-center"
                  style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}
                >
                  <div className="flex flex-col items-center" style={{ gap: 4 }}>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isPast ? '#10B981' : isActive ? '#3B82F6' : 'transparent',
                        border: `2px solid ${color}`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isPast ? (
                        <Check size={14} color="#fff" />
                      ) : (
                        <span
                          style={{
                            color: isActive ? '#fff' : c.text3,
                            fontSize: WEB_FONT.xs,
                            fontWeight: 700,
                          }}
                        >
                          {s.num}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        color: isActive ? c.text1 : isPast ? '#10B981' : c.text3,
                        fontSize: 10,
                        fontWeight: isActive ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        background: isPast ? '#10B981' : c.borderSolid,
                        marginBottom: 18,
                        marginLeft: 8,
                        marginRight: 8,
                        borderRadius: 1,
                        transition: 'background 0.3s',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══ STEP 1: Current Password ═══ */}
          {step === 'current' && (
            <div style={card()}>
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(59,130,246,0.06)',
                  }}
                >
                  <Lock size={20} color="#3B82F6" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                    Xác thực tài khoản
                  </p>
                  <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                    Nhập mật khẩu hiện tại để tiếp tục
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-2"
                style={{
                  marginBottom: 20,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(59,130,246,0.03)',
                  border: '1px solid rgba(59,130,246,0.08)',
                }}
              >
                <Info size={13} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                  Đây là bước xác thực nâng cao (<strong>step-up auth</strong>) để đảm bảo chỉ chủ
                  tài khoản mới có thể thay đổi mật khẩu.
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Mật khẩu hiện tại
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => {
                      setCurrentPw(e.target.value);
                      setCurrentPwError('');
                    }}
                    placeholder="Nhập mật khẩu hiện tại"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyCurrent()}
                    style={inputStyle(!!currentPwError)}
                  />
                  <button
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="flex items-center justify-center"
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    {showCurrentPw ? (
                      <EyeOff size={16} color={c.text3} />
                    ) : (
                      <Eye size={16} color={c.text3} />
                    )}
                  </button>
                </div>
                {currentPwError && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                    <XCircle size={12} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>
                      {currentPwError}
                    </span>
                  </div>
                )}
                <p style={{ color: c.text3, fontSize: WEB_FONT.xs, marginTop: 6 }}>
                  Quên mật khẩu?{' '}
                  <button
                    onClick={() => navigate('/w/auth/forgot-password')}
                    style={{
                      color: '#3B82F6',
                      fontWeight: 500,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Đặt lại qua email
                  </button>
                </p>
              </div>

              <button
                onClick={handleVerifyCurrent}
                disabled={!currentPw.trim() || currentPwLoading}
                className="flex items-center justify-center gap-2"
                style={{
                  width: '100%',
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: currentPw.trim() && !currentPwLoading ? '#3B82F6' : c.borderSolid,
                  color: '#fff',
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  border: 'none',
                  cursor: currentPw.trim() && !currentPwLoading ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s',
                }}
              >
                {currentPwLoading ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ArrowRight size={16} />
                )}
                {currentPwLoading ? 'Đang xác thực...' : 'Tiếp tục'}
              </button>
            </div>
          )}

          {/* ═══ STEP 2: New Password ═══ */}
          {step === 'new' && (
            <div style={card()}>
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(139,92,246,0.06)',
                  }}
                >
                  <Key size={20} color="#8B5CF6" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                    Tạo mật khẩu mới
                  </p>
                  <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                    Chọn mật khẩu mạnh và không trùng mật khẩu cũ
                  </p>
                </div>
              </div>

              {/* New password */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    onBlur={() => setNewPwTouched(true)}
                    placeholder="Nhập mật khẩu mới"
                    autoFocus
                    style={inputStyle(newPwTouched && !allRulesPassed)}
                  />
                  <button
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="flex items-center justify-center"
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    {showNewPw ? (
                      <EyeOff size={16} color={c.text3} />
                    ) : (
                      <Eye size={16} color={c.text3} />
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                {newPw.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <span
                        style={{ color: strengthColor, fontSize: WEB_FONT.xs, fontWeight: 600 }}
                      >
                        {strengthLabel}
                      </span>
                      <span style={{ color: c.text3, fontSize: 10 }}>{strength}%</span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: c.borderSolid,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${strength}%`,
                          height: '100%',
                          borderRadius: 2,
                          background: strengthColor,
                          transition: 'width 0.3s, background 0.3s',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Rules checklist */}
                {newPw.length > 0 && (
                  <div className="grid grid-cols-2" style={{ gap: 4, marginTop: 10 }}>
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(newPw);
                      return (
                        <div key={rule.id} className="flex items-center gap-1.5">
                          {passed ? (
                            <Check size={11} color="#10B981" />
                          ) : (
                            <X size={11} color={newPwTouched ? '#EF4444' : c.text3} />
                          )}
                          <span
                            style={{
                              color: passed ? '#10B981' : newPwTouched ? '#EF4444' : c.text3,
                              fontSize: 11,
                            }}
                          >
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Same as current warning */}
                {newPwSameAsCurrent && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 8 }}>
                    <AlertTriangle size={12} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>
                      Mật khẩu mới không được trùng mật khẩu hiện tại
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Xác nhận mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    onBlur={() => setConfirmPwTouched(true)}
                    placeholder="Nhập lại mật khẩu mới"
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      canProceedNew &&
                      !newPwSameAsCurrent &&
                      handleProceedTo2FA()
                    }
                    style={inputStyle(confirmPwTouched && !passwordsMatch)}
                  />
                  <button
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="flex items-center justify-center"
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    {showConfirmPw ? (
                      <EyeOff size={16} color={c.text3} />
                    ) : (
                      <Eye size={16} color={c.text3} />
                    )}
                  </button>
                </div>
                {confirmPwTouched && confirmPw.length > 0 && !passwordsMatch && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                    <XCircle size={12} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>
                      Mật khẩu xác nhận không khớp
                    </span>
                  </div>
                )}
                {passwordsMatch && (
                  <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
                    <CheckCircle size={12} color="#10B981" />
                    <span style={{ color: '#10B981', fontSize: WEB_FONT.xs }}>Mật khẩu khớp</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleProceedTo2FA}
                disabled={!canProceedNew || newPwSameAsCurrent}
                className="flex items-center justify-center gap-2"
                style={{
                  width: '100%',
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background: canProceedNew && !newPwSameAsCurrent ? '#3B82F6' : c.borderSolid,
                  color: '#fff',
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  border: 'none',
                  cursor: canProceedNew && !newPwSameAsCurrent ? 'pointer' : 'not-allowed',
                }}
              >
                <ArrowRight size={16} />
                Tiếp tục xác thực 2FA
              </button>
            </div>
          )}

          {/* ═══ STEP 3: 2FA Verification ═══ */}
          {step === '2fa' && (
            <div style={card()}>
              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(16,185,129,0.06)',
                  }}
                >
                  <Shield size={20} color="#10B981" />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: WEB_FONT.lg, fontWeight: 700 }}>
                    Xác thực 2 bước
                  </p>
                  <p style={{ color: c.text2, fontSize: WEB_FONT.sm }}>
                    Xác nhận thay đổi mật khẩu bằng mã bảo mật
                  </p>
                </div>
              </div>

              {/* Method selector */}
              <div className="flex" style={{ gap: 8, marginBottom: 20 }}>
                {[
                  {
                    key: 'totp' as TwoFAMethod,
                    label: 'Google Authenticator',
                    icon: Shield,
                    desc: 'Mã 6 chữ số',
                  },
                  {
                    key: 'sms' as TwoFAMethod,
                    label: 'SMS',
                    icon: Smartphone,
                    desc: '+84 ••• 1234',
                  },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setTwoFAMethod(m.key);
                      setTotpCode(['', '', '', '', '', '']);
                      setTwoFAError('');
                    }}
                    className="flex-1 flex items-center gap-3"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: twoFAMethod === m.key ? 'rgba(59,130,246,0.04)' : 'transparent',
                      border: `1.5px solid ${twoFAMethod === m.key ? '#3B82F6' : c.borderSolid}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <m.icon size={18} color={twoFAMethod === m.key ? '#3B82F6' : c.text3} />
                    <div style={{ textAlign: 'left' }}>
                      <p
                        style={{
                          color: twoFAMethod === m.key ? c.text1 : c.text2,
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                        }}
                      >
                        {m.label}
                      </p>
                      <p style={{ color: c.text3, fontSize: 11 }}>{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* SMS send button */}
              {twoFAMethod === 'sms' && (
                <button
                  onClick={handleSendSMS}
                  disabled={smsCountdown > 0}
                  className="flex items-center justify-center gap-2"
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 8,
                    marginBottom: 16,
                    background: smsCountdown > 0 ? 'transparent' : 'rgba(59,130,246,0.06)',
                    border: `1px solid ${smsCountdown > 0 ? c.borderSolid : 'rgba(59,130,246,0.2)'}`,
                    color: smsCountdown > 0 ? c.text3 : '#3B82F6',
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    cursor: smsCountdown > 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Smartphone size={14} />
                  {smsCountdown > 0
                    ? `Gửi lại sau ${smsCountdown}s`
                    : smsSent
                      ? 'Gửi lại mã OTP'
                      : 'Gửi mã OTP qua SMS'}
                </button>
              )}

              {/* TOTP / SMS code input */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    color: c.text1,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    marginBottom: 10,
                    textAlign: 'center',
                  }}
                >
                  {twoFAMethod === 'totp'
                    ? 'Nhập mã từ ứng dụng Authenticator'
                    : 'Nhập mã OTP đã gửi qua SMS'}
                </label>
                <div className="flex items-center justify-center" style={{ gap: 8 }}>
                  {totpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        totpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleTotpInput(i, e.target.value)}
                      onKeyDown={(e) => handleTotpKeyDown(i, e)}
                      className="outline-none"
                      style={{
                        width: 48,
                        height: 56,
                        borderRadius: 10,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        color: c.text1,
                        background: c.bg,
                        border: `2px solid ${twoFAError ? '#EF4444' : digit ? '#3B82F6' : c.borderSolid}`,
                        transition: 'border-color 0.15s',
                      }}
                    />
                  ))}
                </div>
                {twoFAError && (
                  <div
                    className="flex items-center justify-center gap-1.5"
                    style={{ marginTop: 8 }}
                  >
                    <XCircle size={12} color="#EF4444" />
                    <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{twoFAError}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleVerify2FA}
                disabled={totpCode.join('').length < 6 || twoFALoading}
                className="flex items-center justify-center gap-2"
                style={{
                  width: '100%',
                  height: WEB_BUTTON.lg,
                  borderRadius: 10,
                  background:
                    totpCode.join('').length === 6 && !twoFALoading ? '#3B82F6' : c.borderSolid,
                  color: '#fff',
                  fontSize: WEB_FONT.md,
                  fontWeight: 600,
                  border: 'none',
                  cursor:
                    totpCode.join('').length === 6 && !twoFALoading ? 'pointer' : 'not-allowed',
                }}
              >
                {twoFALoading ? (
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {twoFALoading ? 'Đang xác thực...' : 'Xác nhận đổi mật khẩu'}
              </button>

              {/* Warning */}
              <div
                className="flex items-start gap-2"
                style={{
                  marginTop: 16,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(245,158,11,0.04)',
                  border: '1px solid rgba(245,158,11,0.1)',
                }}
              >
                <AlertTriangle
                  size={13}
                  color="#F59E0B"
                  className="shrink-0"
                  style={{ marginTop: 1 }}
                />
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                  Sau khi đổi mật khẩu, tất cả phiên đăng nhập khác sẽ bị kết thúc. Bạn cần đăng
                  nhập lại trên các thiết bị.
                </p>
              </div>
            </div>
          )}

          {/* ═══ STEP 4: Success ═══ */}
          {step === 'success' && (
            <div style={card({ textAlign: 'center' as const })}>
              <div className="flex justify-center" style={{ marginBottom: 16 }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(16,185,129,0.08)',
                  }}
                >
                  <CheckCircle size={32} color="#10B981" />
                </div>
              </div>
              <h2
                style={{ color: c.text1, fontSize: WEB_FONT.xl, fontWeight: 700, marginBottom: 6 }}
              >
                Đổi mật khẩu thành công!
              </h2>
              <p
                style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.6, marginBottom: 8 }}
              >
                Mật khẩu đã được cập nhật lúc{' '}
                <span style={{ color: c.text1, fontWeight: 600 }}>13/03/2026, 15:12</span>
              </p>

              {/* Summary */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: c.bg,
                  border: `1px solid ${c.borderSolid}`,
                  textAlign: 'left' as const,
                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    color: c.text2,
                    fontSize: WEB_FONT.xs,
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  Tóm tắt thay đổi
                </p>
                {[
                  { label: 'Độ mạnh mật khẩu', value: strengthLabel, color: strengthColor },
                  {
                    label: 'Xác thực 2FA',
                    value: twoFAMethod === 'totp' ? 'Google Authenticator' : 'SMS OTP',
                    color: '#3B82F6',
                  },
                  { label: 'Phiên khác', value: 'Đã đăng xuất tất cả', color: '#F59E0B' },
                  { label: 'Thiết bị hiện tại', value: 'Vẫn đăng nhập', color: '#10B981' },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                    style={{ padding: '6px 0' }}
                  >
                    <span style={{ color: c.text3, fontSize: WEB_FONT.xs }}>{row.label}</span>
                    <span style={{ color: row.color, fontSize: WEB_FONT.xs, fontWeight: 600 }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col" style={{ gap: 8 }}>
                <button
                  onClick={() => navigate('/w/profile/security')}
                  className="flex items-center justify-center gap-2"
                  style={{
                    width: '100%',
                    height: WEB_BUTTON.lg,
                    borderRadius: 10,
                    background: '#3B82F6',
                    color: '#fff',
                    fontSize: WEB_FONT.md,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Shield size={16} />
                  Về Trung tâm bảo mật
                </button>
                <button
                  onClick={() => navigate('/w/profile/security/session-management')}
                  className="flex items-center justify-center gap-2"
                  style={{
                    width: '100%',
                    height: WEB_BUTTON.lg,
                    borderRadius: 10,
                    background: 'transparent',
                    color: c.text2,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                    border: `1px solid ${c.borderSolid}`,
                    cursor: 'pointer',
                  }}
                >
                  <Monitor size={14} />
                  Kiểm tra phiên đăng nhập
                </button>
              </div>

              {/* Info */}
              <div
                className="flex items-start gap-2"
                style={{
                  marginTop: 16,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(59,130,246,0.03)',
                  border: '1px solid rgba(59,130,246,0.08)',
                  textAlign: 'left' as const,
                }}
              >
                <Info size={12} color="#3B82F6" className="shrink-0" style={{ marginTop: 2 }} />
                <p style={{ color: c.text2, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
                  Nếu bạn không thực hiện thay đổi này, hãy{' '}
                  <button
                    onClick={() => navigate('/w/profile/security/session-management')}
                    style={{
                      color: '#EF4444',
                      fontWeight: 600,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    kết thúc tất cả phiên ngay
                  </button>{' '}
                  và liên hệ bộ phận hỗ trợ.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
