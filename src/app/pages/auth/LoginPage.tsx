import { CTAButton } from '../../components/ui/CTAButton';
import { InputField } from '../../components/ui/InputField';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent } from '../../components/layout/PageContent';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, AlertCircle, Fingerprint, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email) { setError('Vui lòng nhập email hoặc số điện thoại.'); return; }
    if (!password) { setError('Vui lòng nhập mật khẩu.'); return; }
    setError('');
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    login(email, password);
    navigate(`${prefix}/home`, { replace: true });
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));
    login('demo@vittrade.vn', 'demo');
    navigate(`${prefix}/home`, { replace: true });
  };

  return (
    <PageLayout>
      <PageContent gap={16}>
      {/* Hero */}
      <div className="flex flex-col items-center pt-10 pb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)', boxShadow: '0 8px 32px rgba(59,130,246,0.4)' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M6 18L14 10L20 16L28 8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 26L14 18L20 24L30 14" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ color: c.text1, fontSize: 26, fontWeight: 700 }}>VitTrade</h1>
        <p style={{ color: c.text2, fontSize: 13, marginTop: 4 }}>Giao dịch thông minh, an toàn, tốc độ</p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <InputField
          label="Email / Số điện thoại"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          prefix={<Mail size={18} color={c.text3} />}
          error={error && !email ? ' ' : undefined}
          containerStyle={error && !email ? { borderColor: '#EF4444' } : undefined}
        />

        <InputField
          label="Mật khẩu"
          type={showPw ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          prefix={<Lock size={18} color={c.text3} />}
          suffix={
            <button onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
              {showPw ? <EyeOff size={18} color={c.text3} /> : <Eye size={18} color={c.text3} />}
            </button>
          }
          error={error && !password ? ' ' : undefined}
          containerStyle={error && !password ? { borderColor: '#EF4444' } : undefined}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle size={14} color="#EF4444" />
            <span style={{ color: '#EF4444', fontSize: 13 }}>{error}</span>
          </div>
        )}

        <button
          onClick={() => navigate(`${prefix}/auth/forgot-password`)}
          className="text-right"
          style={{ color: '#3B82F6', fontSize: 13 }}
        >
          Quên mật khẩu?
        </button>

        <CTAButton onClick={handleLogin} loading={isLoading} variant="primary">
          Đăng nhập
        </CTAButton>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: c.borderSolid }} />
          <span style={{ color: c.text3, fontSize: 12 }}>hoặc</span>
          <div className="flex-1 h-px" style={{ background: c.borderSolid }} />
        </div>

        <CTAButton
          onClick={handleDemoLogin}
          variant="ghost"
          bg={c.surface2}
          textColor={c.text1}
          style={{ border: `1.5px solid ${c.borderSolid}`, fontSize: 15, boxShadow: 'none' }}
        >
          <Fingerprint size={20} color="#3B82F6" />
          Đăng nhập Demo
        </CTAButton>

        <div className="flex items-center justify-center gap-1 pt-2">
          <span style={{ color: c.text2, fontSize: 13 }}>Chưa có tài khoản?</span>
          <button onClick={() => navigate(`${prefix}/auth/register`)} style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>
            Đăng ký ngay
          </button>
        </div>
      </div>

      <div className="mt-auto pt-8 text-center">
        <p style={{ color: c.text3, fontSize: 11 }}>
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <span style={{ color: c.text2 }}>Điều khoản dịch vụ</span> và{' '}
          <span style={{ color: c.text2 }}>Chính sách bảo mật</span> của VitTrade.
        </p>
      </div>
      </PageContent>
    </PageLayout>
  );
}