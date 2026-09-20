import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from '../../components/layout/Header';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { CTAButton } from '../../components/ui/CTAButton';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';

export function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const state = location.state as { contact?: string; type?: string; purpose?: string } | null;
  const contact = state?.contact ?? 'your@email.com';
  const purpose = state?.purpose ?? 'verify';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '') && newOtp.join('').length === 6) handleVerify(newOtp.join(''));
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); handleVerify(pasted); }
  };
  const handleVerify = async (code: string) => {
    setIsLoading(true); setError('');
    await new Promise(r => setTimeout(r, 1000));
    if (code === '123456') {
      if (purpose === 'register') navigate(`${prefix}/auth/2fa-setup`, { replace: true });
      else if (purpose === '2fa') { login(contact, ''); navigate(`${prefix}/home`, { replace: true }); }
      else navigate(`${prefix}/auth/reset-password`, { replace: true });
    } else {
      setError('Mã OTP không đúng. Vui lòng thử lại.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
    setIsLoading(false);
  };
  const handleResend = async () => { if (!canResend) return; setCanResend(false); setCountdown(59); setError(''); };
  const filled = otp.filter(d => d !== '').length;

  return (
    <PageLayout>
      <Header title="Xác minh OTP" subtitle="Xác thực · Bảo mật" back />
      <PageContent padding="relaxed" gap="relaxed" className="items-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1.5px solid rgba(59,130,246,0.3)' }}>
          <ShieldCheck size={40} color="#3B82F6" />
        </div>

        <div className="text-center">
          <h2 style={{ color: c.text1, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Nhập mã xác minh</h2>
          <p style={{ color: c.text2, fontSize: 13, lineHeight: 1.6 }}>
            Chúng tôi đã gửi mã 6 chữ số đến{'\n'}
            <span style={{ color: c.text1, fontWeight: 600 }}>{contact}</span>
          </p>
          <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
            (Demo: nhập <span style={{ color: '#3B82F6' }}>123456</span>)
          </p>
        </div>

        <div className="flex gap-3" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="tel" inputMode="numeric" maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="text-center rounded-2xl transition-all"
              style={{
                width: 48, height: 56,
                background: digit ? 'rgba(59,130,246,0.1)' : c.surface2,
                border: `2px solid ${error ? '#EF4444' : digit ? '#3B82F6' : c.borderSolid}`,
                color: c.text1, fontSize: 24, fontWeight: 700, outline: 'none',
              }}
              aria-label={`Ký tự OTP ${i + 1}`}
            />
          ))}
        </div>

        <div className="w-full flex gap-1">
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
              style={{ background: i < filled ? '#3B82F6' : c.borderSolid }} />
          ))}
        </div>

        {error && (
          <div className="w-full rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{error}</p>
          </div>
        )}

        <CTAButton onClick={() => handleVerify(otp.join(''))} disabled={filled < 6} loading={isLoading} variant="primary">
          {isLoading ? 'Đang xác minh...' : 'Xác nhận'}
        </CTAButton>

        <div className="flex items-center gap-2">
          <RefreshCw size={14} color={canResend ? '#3B82F6' : c.text3} />
          {canResend ? (
            <button onClick={handleResend} style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>Gửi lại mã OTP</button>
          ) : (
            <span style={{ color: c.text2, fontSize: 13 }}>
              Gửi lại sau <span style={{ color: c.text1, fontWeight: 600 }}>0:{countdown.toString().padStart(2, '0')}</span>
            </span>
          )}
        </div>

        <p style={{ color: c.text3, fontSize: 12, textAlign: 'center' }}>
          Không nhận được? Kiểm tra thư mục Spam hoặc{'\n'}đảm bảo email / SĐT chính xác.
        </p>
      </PageContent>
    </PageLayout>
  );
}