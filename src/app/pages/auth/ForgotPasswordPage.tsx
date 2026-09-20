import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../../components/layout/Header';
import { Mail, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [step, setStep] = useState<'input' | 'otp' | 'reset' | 'success'>('input');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => { if (!email) return; setIsLoading(true); await new Promise(r => setTimeout(r, 1000)); setStep('otp'); setIsLoading(false); };
  const handleVerifyOTP = async () => { if (otp.length < 6) return; setIsLoading(true); await new Promise(r => setTimeout(r, 800)); setStep('reset'); setIsLoading(false); };
  const handleReset = async () => { if (!newPw || newPw !== confirmPw) return; setIsLoading(true); await new Promise(r => setTimeout(r, 1000)); setStep('success'); setIsLoading(false); };

  return (
    <PageLayout>
      <Header title="Quên mật khẩu" subtitle="Xác thực · Bảo mật" back />
      <PageContent padding="relaxed" gap="relaxed">
        {step === 'input' && (
          <div className="contents">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
                <KeyRound size={32} color="#3B82F6" />
              </div>
              <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Đặt lại mật khẩu</h2>
              <p style={{ color: c.text2, fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
                Nhập email đã đăng ký. Chúng tôi sẽ gửi mã xác minh để đặt lại mật khẩu.
              </p>
            </div>
            <InputField label="Email đăng ký" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} prefix={<Mail size={18} color={c.text3} />} />
            <CTAButton onClick={handleSendOTP} disabled={!email} loading={isLoading} variant="primary">
              {isLoading ? 'Đang gửi...' : 'Gửi mã xác minh'}
            </CTAButton>
          </div>
        )}

        {step === 'otp' && (
          <div className="contents">
            <div className="text-center">
              <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Nhập mã OTP</h2>
              <p style={{ color: c.text2, fontSize: 13, marginTop: 8 }}>
                Mã 6 số đã được gửi đến <span style={{ color: c.text1 }}>{email}</span>
              </p>
              <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>(Demo: nhập bất kỳ 6 số)</p>
            </div>
            <div>
              <label style={{ color: c.text2, fontSize: 13, marginBottom: 6, display: 'block' }}>Mã OTP</label>
              <input type="tel" inputMode="numeric" maxLength={6} value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-2xl text-center"
                style={{ background: c.surface2, border: `1.5px solid ${c.borderSolid}`, color: c.text1, fontSize: 24, fontWeight: 700, outline: 'none', letterSpacing: 8, height: 52, borderRadius: 14 }} />
            </div>
            <CTAButton onClick={handleVerifyOTP} disabled={otp.length < 6} loading={isLoading} variant="primary">
              {isLoading ? 'Đang xác minh...' : 'Xác nhận'}
            </CTAButton>
          </div>
        )}

        {step === 'reset' && (
          <div className="contents">
            <div className="text-center">
              <h2 style={{ color: c.text1, fontSize: 20, fontWeight: 700 }}>Mật khẩu mới</h2>
              <p style={{ color: c.text2, fontSize: 13, marginTop: 8 }}>Tạo mật khẩu mạnh để bảo vệ tài khoản</p>
            </div>
            {[['Mật khẩu mới', newPw, setNewPw], ['Xác nhận mật khẩu', confirmPw, setConfirmPw]].map(([label, val, setter]: any, i) => (
              <div key={label}>
                <InputField
                  label={label} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={val} onChange={e => setter(e.target.value)}
                  suffix={i === 0 ? <button onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={18} color={c.text3} /> : <Eye size={18} color={c.text3} />}</button> : undefined}
                  error={i === 1 && confirmPw && confirmPw !== newPw ? 'Mật khẩu không khớp' : undefined}
                />
              </div>
            ))}
            <CTAButton onClick={handleReset} disabled={!newPw || newPw !== confirmPw} loading={isLoading} variant="primary">
              {isLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </CTAButton>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
              <CheckCircle size={48} color="#10B981" />
            </div>
            <div className="text-center">
              <h2 style={{ color: c.text1, fontSize: 22, fontWeight: 700 }}>Thành công!</h2>
              <p style={{ color: c.text2, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
                Mật khẩu của bạn đã được đặt lại thành công.{'\n'}Vui lòng đăng nhập với mật khẩu mới.
              </p>
            </div>
            <CTAButton onClick={() => navigate(`${prefix}/auth/login`, { replace: true })} variant="primary">
              Đến trang đăng nhập
            </CTAButton>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}