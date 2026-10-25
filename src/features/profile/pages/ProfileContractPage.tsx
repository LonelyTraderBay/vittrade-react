import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { withAlpha } from '@/shared/theme/colors';
import { useAuth } from '@/shared/session/useAuth';
import { useProfileQuery } from '../model/profile-queries';

export function ProfileContractPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const { signOut } = useAuth();
  const query = useProfileQuery();
  const profile = query.data;
  const links = [
    ['Chỉnh sửa hồ sơ', 'edit'],
    ['Bảo mật', 'security'],
    ['Hoạt động tài khoản', 'activity'],
    ['Thiết bị đăng nhập', 'devices'],
    ['Tài khoản phụ', 'sub-accounts'],
  ] as const;
  return (
    <PageLayout>
      <Header title="Profile" />
      <PageContent gap="default">
        <div
          role="region"
          aria-label="Dữ liệu hồ sơ"
          aria-busy={query.isFetching}
          className="flex min-w-0 flex-col gap-4"
        >
          {query.isPending ? (
            <p role="progressbar" aria-label="Đang tải profile…" style={{ color: colors.text2 }}>
              Đang tải profile…
            </p>
          ) : query.isError || !profile ? (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          ) : (
            <>
              <TrCard className="p-5" style={{ overflowWrap: 'anywhere' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      background: colors.primary,
                      color: 'var(--tr-text-on-color)',
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    {profile.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 style={{ color: colors.text1, fontSize: 17, fontWeight: 700 }}>
                      {profile.fullName}
                    </h2>
                    <p style={{ color: colors.text2, fontSize: 12 }}>{profile.email}</p>
                    <p style={{ color: colors.successText, fontSize: 11 }}>
                      KYC: {profile.kycStatus}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric
                    label="Tổng tài sản"
                    value={`$${profile.totalBalance.toLocaleString('en-US')}`}
                  />
                  <Metric label="VIP" value={`VIP ${profile.vipLevel}`} />
                </div>
              </TrCard>
              <nav aria-label="Điều hướng hồ sơ">
                <TrCard overflow>
                  {links.map(([label, path], index) => (
                    <button
                      type="button"
                      key={path}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        color: colors.text1,
                        outlineColor: colors.primary,
                        borderBottom:
                          index === links.length - 1 ? undefined : `1px solid ${colors.divider}`,
                      }}
                      onClick={() => navigate(`${prefix}/profile/${path}`)}
                    >
                      {label}
                      <span style={{ color: colors.text3 }}>›</span>
                    </button>
                  ))}
                </TrCard>
              </nav>
              <button
                type="button"
                data-testid="auth-sign-out"
                className="w-full rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{
                  color: colors.errorText,
                  background: withAlpha(colors.danger, '12'),
                  border: `1px solid ${withAlpha(colors.danger, '40')}`,
                }}
                onClick={() => {
                  void signOut().then(() => navigate(`${prefix}/auth/login`, { replace: true }));
                }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </PageContent>
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div className="min-w-0" style={{ overflowWrap: 'anywhere' }}>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <p style={{ color: colors.text1, fontSize: 15, fontWeight: 700 }}>{value}</p>
    </div>
  );
}
