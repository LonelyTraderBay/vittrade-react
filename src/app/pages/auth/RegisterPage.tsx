import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, CheckCircle, XCircle, Mail, Lock, User, Phone } from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';
import { useThemeColors } from '../../hooks/useThemeColors';

type RegType = 'email' | 'phone';

function PwStrength({ password }: { password: string }) {
  const c = useThemeColors();
  const checks = [
    { label: 'Ít nhất 8 ký tự', ok: password.length >= 8 },
    { label: 'Chữ hoa & thường', ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Có số', ok: /\d/.test(password) },
    { label: 'Ký tự đặc biệt', ok: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'];
  const labels = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < score ? colors[score] : c.borderSolid }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map((ch, i) => (
          <div key={ch.label} className="flex items-center gap-1">
            {ch.ok ? <CheckCircle size={11} color="#10B981" /> : <XCircle size={11} color={c.text3} />}
            <span style={{ color: ch.ok ? '#10B981' : c.text3, fontSize: 11 }}>{ch.label}</span>
          </div>
        ))}
      </div>
      {score > 0 && <p style={{ color: colors[score], fontSize: 12, marginTop: 4 }}>Mật khẩu {labels[score]}</p>}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [regType, setRegType] = useState<RegType>('email');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [referral, setReferral] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Vui lòng nhập họ tên';
    if (!contact.trim()) e.contact = regType === 'email' ? 'Vui lòng nhập email' : 'Vui lòng nhập số điện thoại';
    if (regType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) e.contact = 'Email không hợp lệ';
    if (password.length < 8) e.password = 'Mật khẩu tối thiểu 8 ký tự';
    if (password !== confirm) e.confirm = 'Mật khẩu xác nhận không khớp';
    if (!agreed) e.agreed = 'Vui lòng đồng ý điều khoản dịch vụ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    navigate(`${prefix}/auth/otp`, { state: { contact, type: regType, purpose: 'register' } });
  };

  const Input = ({ label, icon: Icon, value, onChange, type = 'text', placeholder, error, right }: any) => (
    <InputField
      label={label}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      prefix={<Icon size={18} color={c.text3} />}
      suffix={right}
      error={error}
    />
  );

  return (
    <PageLayout>
      <Header title="Tạo tài khoản" subtitle="Xác thực · Đăng ký" back />
      <PageContent gap={16} padding="default">
        <div className="flex rounded-2xl p-1" style={{ background: c.surface2 }}>
          {(['email', 'phone'] as RegType[]).map(t => (
            <button key={t} onClick={() => setRegType(t)}
              className="flex-1 h-10 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: regType === t ? c.chipActiveBg : 'transparent', color: regType === t ? c.chipActiveText : c.text2 }}>
              {t === 'email' ? 'Email' : 'Điện thoại'}
            </button>
          ))}
        </div>

        <Input label="Họ và tên" icon={User} value={name} onChange={setName} placeholder="Nguyễn Văn A" error={errors.name} />

        <Input
          label={regType === 'email' ? 'Email' : 'Số điện thoại'}
          icon={regType === 'email' ? Mail : Phone}
          value={contact} onChange={setContact}
          type={regType === 'email' ? 'email' : 'tel'}
          placeholder={regType === 'email' ? 'you@example.com' : '+84 912 345 678'}
          error={errors.contact}
        />

        <div>
          <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>Mật khẩu</label>
          <InputField
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            prefix={<Lock size={18} color={c.text3} />}
            suffix={
              <button onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} color={c.text3} /> : <Eye size={18} color={c.text3} />}
              </button>
            }
            error={errors.password}
          />
          {password && <PwStrength password={password} />}
        </div>

        <Input label="Xác nhận mật khẩu" icon={Lock} value={confirm} onChange={setConfirm}
          type={showPw ? 'text' : 'password'} placeholder="••••••••" error={errors.confirm} />

        <div>
          <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>Mã giới thiệu (tuỳ chọn)</label>
          <InputField
            type="text"
            placeholder="VD: VITTA-A2B3C"
            value={referral}
            onChange={e => setReferral(e.target.value.toUpperCase())}
          />
        </div>

        <button onClick={() => setAgreed(!agreed)} className="flex items-start gap-3 text-left">
          <div className="w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center"
            style={{ background: agreed ? '#3B82F6' : 'transparent', border: `1.5px solid ${errors.agreed ? '#EF4444' : agreed ? '#3B82F6' : c.borderSolid}` }}>
            {agreed && <CheckCircle size={12} color="#fff" strokeWidth={3} />}
          </div>
          <span style={{ color: c.text2, fontSize: 13, lineHeight: 1.5 }}>
            Tôi đã đọc và đồng ý với{' '}
            <span style={{ color: '#3B82F6' }}>Điều khoản dịch vụ</span> và{' '}
            <span style={{ color: '#3B82F6' }}>Chính sách bảo mật</span> của VitTrade.
          </span>
        </button>
        {errors.agreed && <p style={{ color: '#EF4444', fontSize: 12, marginTop: -8 }}>{errors.agreed}</p>}

        <CTAButton onClick={handleRegister} loading={isLoading} variant="primary" className="mt-2">
          Tiếp tục
        </CTAButton>

        <div className="flex items-center justify-center gap-1">
          <span style={{ color: c.text2, fontSize: 13 }}>Đã có tài khoản?</span>
          <button onClick={() => navigate(`${prefix}/auth/login`)} style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>Đăng nhập</button>
        </div>
      </PageContent>
    </PageLayout>
  );
}