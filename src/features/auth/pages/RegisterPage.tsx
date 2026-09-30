import { useNavigate } from 'react-router';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { RegistrationForm } from '../components/RegistrationForm';

export function RegisterPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  return (
    <PageLayout>
      <Header title="Tạo tài khoản" subtitle="Xác thực · Đăng ký" back />
      <PageContent gap="default" padding="default">
        <RegistrationForm />
        <div className="flex items-center justify-center gap-1 text-sm">
          <span style={{ color: colors.text2 }}>Đã có tài khoản?</span>
          <button
            type="button"
            onClick={() => navigate(`${prefix}/auth/login`)}
            style={{ color: colors.link, fontWeight: 600 }}
          >
            Đăng nhập
          </button>
        </div>
      </PageContent>
    </PageLayout>
  );
}
