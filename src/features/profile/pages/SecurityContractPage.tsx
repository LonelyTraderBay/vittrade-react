import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useProfileQuery } from '../model/profile-queries';

export function SecurityContractPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const query = useProfileQuery();
  const data = query.data;
  const score = data?.has2FA ? 3 : 2;
  return (
    <PageLayout>
      <Header title="Bảo mật" subtitle="Bảo mật · Profile" back />
      <PageContent gap="default">
        <div
          role="region"
          aria-label="Trạng thái bảo mật"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {query.isPending ? (
            <p
              role="progressbar"
              aria-label="Đang tải trạng thái bảo mật…"
              style={{ color: colors.text2 }}
            >
              Đang tải trạng thái bảo mật…
            </p>
          ) : query.isError || !data ? (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          ) : (
            <>
              <TrCard className="p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={22} color={colors.primary} />
                  <div>
                    <p style={{ color: colors.text1, fontWeight: 700 }}>Điểm bảo mật {score}/4</p>
                    <p style={{ color: colors.text2, fontSize: 12 }}>
                      2FA {data.has2FA ? 'đang bật' : 'chưa bật'}
                    </p>
                  </div>
                </div>
              </TrCard>
              <nav aria-label="Điều hướng bảo mật">
                <TrCard overflow>
                  <button
                    type="button"
                    className="w-full p-4 text-left"
                    style={{ color: colors.text1 }}
                    onClick={() => navigate(`${prefix}/auth/2fa-setup`)}
                  >
                    Xác thực 2 lớp <span style={{ color: colors.text3, float: 'right' }}>›</span>
                  </button>
                  <button
                    type="button"
                    className="w-full border-t p-4 text-left"
                    style={{ borderColor: colors.divider, color: colors.text1 }}
                    onClick={() => navigate(`${prefix}/profile/devices`)}
                  >
                    Quản lý thiết bị <span style={{ color: colors.text3, float: 'right' }}>›</span>
                  </button>
                </TrCard>
              </nav>
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}
