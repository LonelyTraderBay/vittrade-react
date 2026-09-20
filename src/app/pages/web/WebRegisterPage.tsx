import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Eye, EyeOff, AlertCircle, Mail, Lock, User, Phone,
  ArrowRight, CheckCircle, XCircle,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_BUTTON } from '../../components/layout/webConstants';
import { WebAuthBrandPanel, WebAuthFormShell } from '../../components/web/WebAuthBrandPanel';

/**
 * WebRegisterPage — Enterprise Desktop Registration
 * 2-column layout with animated brand panel + register form
 * Inline validation: email format on blur, password match on blur
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegType = 'email' | 'phone';

/* ─── Password Strength Meter ─── */
function PwStrength({ password }: { password: string }) {
  const c = useThemeColors();
  const checks = [
    { label: 'Ít nhất 8 ký tự', ok: password.length >= 8 },
    { label: 'Chữ hoa & thường', ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Có số', ok: /\d/.test(password) },
    { label: 'Ký tự đặc biệt', ok: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter(ch => ch.ok).length;
  const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'];
  const labels = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];

  return (
    <div style={{ marginTop: 8 }}>
      <div className="flex" style={{ gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < score ? colors[score] : c.borderSolid,
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>
      <div className="flex flex-wrap" style={{ gap: 8 }}>
        {checks.map(ch => (
          <div key={ch.label} className="flex items-center" style={{ gap: 4 }}>
            {ch.ok ? <CheckCircle size={11} color="#10B981" /> : <XCircle size={11} color={c.text3} />}
            <span style={{ color: ch.ok ? '#10B981' : c.text3, fontSize: WEB_FONT.xs }}>{ch.label}</span>
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

export function WebRegisterPage() {
  const navigate = useNavigate();
  const c = useThemeColors();

  const [regType, setRegType] = useState<RegType>('email');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [referral, setReferral] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);

  /* ─── Per-field error state (submit + inline blur) ─── */
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) => setErrors(prev => ({ ...prev, [field]: msg }));
  const clearError = (field: string) => setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  /* ─── Inline validators on blur ─── */
  const handleContactBlur = () => {
    setFocusField(null);
    if (regType === 'email' && contact && !EMAIL_RE.test(contact)) {
      setFieldError('contact', 'Định dạng email không hợp lệ');
    }
  };

  const handleConfirmBlur = () => {
    setFocusField(null);
    if (confirm && password && confirm !== password) {
      setFieldError('confirm', 'Mật khẩu xác nhận không khớp');
    } else {
      clearError('confirm');
    }
  };

  const handlePasswordBlur = () => {
    setFocusField(null);
    // Re-check confirm match if confirm already has value
    if (confirm && password && confirm !== password) {
      setFieldError('confirm', 'Mật khẩu xác nhận không khớp');
    } else if (confirm && password && confirm === password) {
      clearError('confirm');
    }
  };

  /* ─── Full validation on submit ─── */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!contact.trim()) e.contact = regType === 'email' ? 'Vui lòng nhập email' : 'Vui lòng nhập số điện thoại';
    else if (regType === 'email' && !EMAIL_RE.test(contact)) e.contact = 'Định dạng email không hợp lệ';
    if (password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự';
    if (password !== confirm) e.confirm = 'Mật khẩu xác nhận không khớp';
    if (!agreed) e.agreed = 'Vui lòng đồng ý điều khoản dịch vụ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    navigate('/w/auth/otp', { state: { contact, type: regType, purpose: 'register' } });
  };

  const inputBorder = (field: string) =>
    focusField === field ? '#3B82F6' : errors[field] ? '#EF4444' : c.borderSolid;

  return (
    <div className="flex" style={{ minHeight: '100vh', background: c.bg }}>
      {/* ═══ LEFT: Animated Brand Panel ═══ */}
      <WebAuthBrandPanel tagline="Tạo tài khoản miễn phí và bắt đầu giao dịch trong hệ sinh thái Spot, P2P, Prediction Markets và Open Arena." />

      {/* ═══ RIGHT: Form Panel ═══ */}
      <WebAuthFormShell textColor={c.text1}>
        {/* Form header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: c.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700, marginBottom: 6 }}>
            Tạo tài khoản
          </h1>
          <p style={{ color: c.text2, fontSize: WEB_FONT.md, lineHeight: 1.5 }}>
            Đăng ký miễn phí và bắt đầu giao dịch chỉ trong vài phút.
          </p>
        </div>

        {/* Registration type toggle */}
        <div
          className="flex"
          style={{
            background: c.surface, borderRadius: 10, padding: 3,
            marginBottom: 24, border: `1px solid ${c.borderSolid}`,
          }}
        >
          {(['email', 'phone'] as RegType[]).map(t => (
            <button
              key={t}
              onClick={() => { setRegType(t); clearError('contact'); }}
              className="flex-1 flex items-center justify-center"
              style={{
                height: 36, borderRadius: 8,
                background: regType === t ? c.bg : 'transparent',
                color: regType === t ? c.text1 : c.text3,
                fontSize: WEB_FONT.sm, fontWeight: regType === t ? 600 : 500,
                transition: 'all 0.15s ease', border: 'none', cursor: 'pointer',
                boxShadow: regType === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'email' ? 'Email' : 'Số điện thoại'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex flex-col" style={{ gap: 18 }}>
          {/* Full name */}
          <div>
            <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>
              Họ và tên
            </label>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 10,
                border: `1.5px solid ${inputBorder('name')}`,
                background: c.surface, padding: '0 14px', gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              <User size={16} color={c.text3} className="shrink-0" />
              <input
                type="text" placeholder="Nguyễn Văn A" value={name}
                onChange={e => { setName(e.target.value); clearError('name'); }}
                onFocus={() => setFocusField('name')}
                onBlur={() => setFocusField(null)}
                autoComplete="name"
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
            </div>
            <FieldError msg={errors.name} />
          </div>

          {/* Email / Phone */}
          <div>
            <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>
              {regType === 'email' ? 'Email' : 'Số điện thoại'}
            </label>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 10,
                border: `1.5px solid ${inputBorder('contact')}`,
                background: c.surface, padding: '0 14px', gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              {regType === 'email'
                ? <Mail size={16} color={c.text3} className="shrink-0" />
                : <Phone size={16} color={c.text3} className="shrink-0" />}
              <input
                type={regType === 'email' ? 'email' : 'tel'}
                placeholder={regType === 'email' ? 'you@example.com' : '+84 912 345 678'}
                value={contact}
                onChange={e => { setContact(e.target.value); clearError('contact'); }}
                onFocus={() => setFocusField('contact')}
                onBlur={handleContactBlur}
                autoComplete={regType === 'email' ? 'email' : 'tel'}
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
            </div>
            <FieldError msg={focusField !== 'contact' ? errors.contact : undefined} />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>
              Mật khẩu
            </label>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 10,
                border: `1.5px solid ${inputBorder('password')}`,
                background: c.surface, padding: '0 14px', gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              <Lock size={16} color={c.text3} className="shrink-0" />
              <input
                type={showPw ? 'text' : 'password'} placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); clearError('password'); }}
                onFocus={() => setFocusField('password')}
                onBlur={handlePasswordBlur}
                autoComplete="new-password"
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                className="shrink-0 flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPw ? <EyeOff size={16} color={c.text3} /> : <Eye size={16} color={c.text3} />}
              </button>
            </div>
            {errors.password && !password && <FieldError msg={errors.password} />}
            {password && <PwStrength password={password} />}
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>
              Xác nhận mật khẩu
            </label>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 10,
                border: `1.5px solid ${inputBorder('confirm')}`,
                background: c.surface, padding: '0 14px', gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              <Lock size={16} color={c.text3} className="shrink-0" />
              <input
                type={showConfirmPw ? 'text' : 'password'} placeholder="••••••••"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); clearError('confirm'); }}
                onFocus={() => setFocusField('confirm')}
                onBlur={handleConfirmBlur}
                autoComplete="new-password"
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
              <button
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="shrink-0 flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer' }}
                aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPw ? <EyeOff size={16} color={c.text3} /> : <Eye size={16} color={c.text3} />}
              </button>
            </div>
            <FieldError msg={focusField !== 'confirm' ? errors.confirm : undefined} />
            {/* Realtime match indicator when typing (if password exists) */}
            {confirm && password && !errors.confirm && focusField === 'confirm' && (
              <div className="flex items-center gap-1.5" style={{ marginTop: 4 }}>
                {confirm === password
                  ? <><CheckCircle size={12} color="#10B981" /><span style={{ color: '#10B981', fontSize: WEB_FONT.xs }}>Mật khẩu khớp</span></>
                  : <><AlertCircle size={12} color="#F59E0B" /><span style={{ color: '#F59E0B', fontSize: WEB_FONT.xs }}>Chưa khớp...</span></>}
              </div>
            )}
          </div>

          {/* Referral code (optional) */}
          <div>
            <label style={{ display: 'block', color: c.text2, fontSize: WEB_FONT.sm, fontWeight: 500, marginBottom: 6 }}>
              Mã giới thiệu <span style={{ color: c.text3, fontWeight: 400 }}>(tuỳ chọn)</span>
            </label>
            <div
              className="flex items-center"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 10,
                border: `1.5px solid ${focusField === 'referral' ? '#3B82F6' : c.borderSolid}`,
                background: c.surface, padding: '0 14px', gap: 10,
                transition: 'border-color 0.15s ease',
              }}
            >
              <input
                type="text" placeholder="VD: VITTA-A2B3C"
                value={referral}
                onChange={e => setReferral(e.target.value.toUpperCase())}
                onFocus={() => setFocusField('referral')}
                onBlur={() => setFocusField(null)}
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: c.text1, fontSize: WEB_FONT.md, height: '100%' }}
              />
            </div>
          </div>

          {/* Terms checkbox */}
          <button
            onClick={() => { setAgreed(!agreed); clearError('agreed'); }}
            className="flex items-start text-left"
            style={{ gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{
                width: 20, height: 20, borderRadius: 6, marginTop: 1,
                background: agreed ? '#3B82F6' : 'transparent',
                border: `1.5px solid ${errors.agreed ? '#EF4444' : agreed ? '#3B82F6' : c.borderSolid}`,
                transition: 'all 0.15s ease',
              }}
            >
              {agreed && <CheckCircle size={12} color="#fff" strokeWidth={3} />}
            </div>
            <span style={{ color: c.text2, fontSize: WEB_FONT.sm, lineHeight: 1.5 }}>
              Tôi đã đọc và đồng ý với{' '}
              <span style={{ color: '#3B82F6', fontWeight: 500 }}>Điều khoản dịch vụ</span> và{' '}
              <span style={{ color: '#3B82F6', fontWeight: 500 }}>Chính sách bảo mật</span> của VitTrade.
            </span>
          </button>
          {errors.agreed && (
            <div className="flex items-center gap-1.5" style={{ marginTop: -8 }}>
              <AlertCircle size={12} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: WEB_FONT.xs }}>{errors.agreed}</span>
            </div>
          )}

          {/* Register button */}
          <button
            onClick={handleRegister}
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
            style={{
              height: WEB_BUTTON.lg, borderRadius: 10,
              background: isLoading ? c.surface2 : 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
              color: '#fff', fontSize: WEB_FONT.md, fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              border: 'none',
              boxShadow: isLoading ? 'none' : '0 4px 16px rgba(59,130,246,0.25)',
              transition: 'all 0.15s ease', width: '100%', marginTop: 4,
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
                Tạo tài khoản
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
              className="flex-1 flex items-center justify-center"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 10,
                background: c.surface, border: `1.5px solid ${c.borderSolid}`,
                cursor: 'pointer', gap: 8, transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>Google</span>
            </button>
            <button
              className="flex-1 flex items-center justify-center"
              style={{
                height: WEB_BUTTON.lg, borderRadius: 10,
                background: c.surface, border: `1.5px solid ${c.borderSolid}`,
                cursor: 'pointer', gap: 8, transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={c.text1}>
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span style={{ color: c.text1, fontSize: WEB_FONT.sm, fontWeight: 500 }}>Apple</span>
            </button>
          </div>

          {/* Login link */}
          <div className="flex items-center justify-center" style={{ gap: 4, paddingTop: 4 }}>
            <span style={{ color: c.text2, fontSize: WEB_FONT.sm }}>Đã có tài khoản?</span>
            <button
              onClick={() => navigate('/w/auth/login')}
              className="hover:underline"
              style={{ color: '#3B82F6', fontSize: WEB_FONT.sm, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Đăng nhập
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ color: c.text3, fontSize: WEB_FONT.xs, lineHeight: 1.5 }}>
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <button className="hover:underline" style={{ color: c.text2, background: 'none', border: 'none', cursor: 'pointer' }}>Điều khoản dịch vụ</button>
            {' '}và{' '}
            <button className="hover:underline" style={{ color: c.text2, background: 'none', border: 'none', cursor: 'pointer' }}>Chính sách bảo mật</button>
            {' '}của VitTrade.
          </p>
        </div>
      </WebAuthFormShell>
    </div>
  );
}
