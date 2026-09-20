import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Check } from 'lucide-react';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';
import { useThemeColors } from '../../hooks/useThemeColors';

const PW_RULES = [
  { id: 'len', label: 'Tối thiểu 8 ký tự', test: (v: string) => v.length >= 8 },
  { id: 'letter', label: 'Có ít nhất 1 chữ cái', test: (v: string) => /[a-zA-Z]/.test(v) },
  { id: 'digit', label: 'Có ít nhất 1 chữ số', test: (v: string) => /\d/.test(v) },
];

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const allRulesPass = PW_RULES.every(r => r.test(newPw));
  const passwordsMatch = newPw === confirmPw;
  const canSubmit = allRulesPass && passwordsMatch && confirmPw.length > 0;
  const showMismatch = touched && confirmPw.length > 0 && !passwordsMatch;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <PageLayout>
        <Header title="Đặt lại mật khẩu" subtitle="Xác thực · Bảo mật" back />
        <PageContent padding="relaxed" gap="relaxed" className="items-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
            <CheckCircle size={48} color="#10B981" />
          </div>
          <div className="text-center">
            <h2 style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>Đổi mật khẩu thành công!</h2>
            <p style={{ color: c.text2, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
              Mật khẩu của bạn đã được cập nhật.{'\n'}Vui lòng đăng nhập lại với mật khẩu mới.
            </p>
          </div>
          <CTAButton
            onClick={() => navigate(`${prefix}/auth/login`, { replace: true })}
            variant="primary"
          >
            Đăng nhập
          </CTAButton>
        </PageContent>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Đặt lại mật khẩu" subtitle="Xác thực · Bảo mật" back />
      <PageContent padding="relaxed" gap="relaxed">
        {/* Icon + description */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
            <Lock size={32} color="#3B82F6" />
          </div>
          <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Tạo mật khẩu mới</h2>
          <p style={{ color: c.text2, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
            Chọn mật khẩu mạnh để bảo vệ tài khoản của bạn.
          </p>
        </div>

        {/* New password */}
        <div>
          <InputField
            label="Mật khẩu mới"
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            prefix={<Lock size={18} color={c.text3} />}
            suffix={
              <button onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={18} color={c.text3} /> : <Eye size={18} color={c.text3} />}
              </button>
            }
            containerStyle={newPw && !allRulesPass ? { borderColor: '#EF4444' } : undefined}
          />

          {/* Password rules */}
          <div className="flex flex-col gap-1.5 mt-3">
            {PW_RULES.map(rule => {
              const pass = rule.test(newPw);
              return (
                <div key={rule.id} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: pass ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)' }}>
                    <Check size={10} color={pass ? '#10B981' : c.text3} />
                  </div>
                  <span style={{ color: pass ? '#10B981' : c.text3, fontSize: 12 }}>{rule.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <InputField
            label="Nhập lại mật khẩu"
            type={showConfirmPw ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPw}
            onChange={e => { setConfirmPw(e.target.value); setTouched(true); }}
            prefix={<Lock size={18} color={c.text3} />}
            suffix={
              <button onClick={() => setShowConfirmPw(!showConfirmPw)}>
                {showConfirmPw ? <EyeOff size={18} color={c.text3} /> : <Eye size={18} color={c.text3} />}
              </button>
            }
            containerStyle={showMismatch ? { borderColor: '#EF4444' } : undefined}
          />
          {showMismatch && (
            <div className="flex items-center gap-1.5 mt-2">
              <AlertCircle size={12} color="#EF4444" />
              <p style={{ color: '#EF4444', fontSize: 12 }}>Mật khẩu không khớp</p>
            </div>
          )}
          {touched && passwordsMatch && confirmPw.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <CheckCircle size={12} color="#10B981" />
              <p style={{ color: '#10B981', fontSize: 12 }}>Mật khẩu khớp</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <CTAButton
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={isLoading}
          variant="primary"
        >
          {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
        </CTAButton>

        {/* Back to login */}
        <button onClick={() => navigate(`${prefix}/auth/login`)}
          className="flex items-center justify-center"
          style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>
          Quay lại đăng nhập
        </button>
      </PageContent>
    </PageLayout>
  );
}