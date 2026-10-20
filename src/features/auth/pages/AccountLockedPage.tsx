import { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { CTAButton } from '@/shared/ui/CTAButton';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

/** Static frontend response to a server-declared locked account; it does not infer an unlock time. */
export function AccountLockedPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <PageLayout>
      <Header title="Bảo mật tài khoản" subtitle="Trạng thái đăng nhập" />
      <PageContent padding="relaxed" gap="relaxed">
        <section
          aria-labelledby="account-locked-title"
          className="flex flex-col items-center gap-4"
        >
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: colors.sellAlpha10, border: `1px solid ${colors.sellAlpha20}` }}
          >
            <Lock size={28} color={colors.sell} />
          </div>
          <h2
            ref={headingRef}
            id="account-locked-title"
            tabIndex={-1}
            className="text-center text-xl font-bold focus:outline-solid focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
            style={{ color: colors.text1 }}
          >
            Tài khoản tạm khóa
          </h2>
          <p
            role="status"
            className="text-center text-sm leading-relaxed"
            style={{ color: colors.text2 }}
          >
            Hệ thống xác thực hiện chưa cho phép đăng nhập tài khoản này. Hãy quay lại đăng nhập để
            kiểm tra trạng thái mới nhất.
          </p>
        </section>

        <div className="flex flex-col gap-3">
          <CTAButton onClick={() => navigate(`${prefix}/auth/login`, { replace: true })}>
            Quay lại đăng nhập
          </CTAButton>
          <CTAButton
            variant="secondary"
            style={{ background: colors.surface, border: `1px solid ${colors.borderSolid}` }}
            onClick={() => navigate(`${prefix}/auth/forgot-password`)}
          >
            Không phải bạn? Đặt lại mật khẩu
          </CTAButton>
        </div>

        <section
          aria-label="Gợi ý bảo mật"
          className="rounded-xl p-4"
          style={{ background: colors.surface2, border: `1px solid ${colors.border}` }}
        >
          <h2 className="text-sm font-semibold" style={{ color: colors.text1 }}>
            Gợi ý bảo mật
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: colors.text1 }}>
            <li>Sử dụng mật khẩu mạnh, không trùng với dịch vụ khác.</li>
            <li>Bật xác thực hai bước để bảo vệ tài khoản.</li>
          </ul>
        </section>
      </PageContent>
    </PageLayout>
  );
}
