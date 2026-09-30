import { useNavigate } from 'react-router';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { WEB_FONT } from '@/shared/theme/webTokens';
import { WebAuthBrandPanel, WebAuthFormShell } from '@/shared/ui/auth/WebAuthBrandPanel';
import { RegistrationForm } from '../components/RegistrationForm';

export function WebRegisterPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen" style={{ background: colors.bg }}>
      <WebAuthBrandPanel tagline="Tạo tài khoản và xác minh email hoặc số điện thoại." />
      <WebAuthFormShell textColor={colors.text1}>
        <div className="mb-6">
          <h1 style={{ color: colors.text1, fontSize: WEB_FONT['2xl'], fontWeight: 700 }}>
            Tạo tài khoản
          </h1>
          <p className="mt-2" style={{ color: colors.text2, fontSize: WEB_FONT.md }}>
            Nhập thông tin để bắt đầu yêu cầu đăng ký.
          </p>
        </div>
        <RegistrationForm />
        <p className="mt-6 text-center text-sm" style={{ color: colors.text2 }}>
          Đã có tài khoản?{' '}
          <button
            type="button"
            onClick={() => navigate('/w/auth/login')}
            style={{ color: colors.link, fontWeight: 600 }}
          >
            Đăng nhập
          </button>
        </p>
      </WebAuthFormShell>
    </div>
  );
}
