import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAdminAbTestsQuery } from '../model/admin-queries';

export function AdminAbTestsContractPage() {
  const colors = useThemeColors();
  const query = useAdminAbTestsQuery();

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="A/B tests" />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải A/B tests…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;

  return (
    <PageLayout>
      <Header title="A/B tests" />
      <PageContent gap="tight">
        {query.data.tests.map((test) => (
          <TrCard className="p-4" key={test.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p style={{ color: colors.text1, fontWeight: 600 }}>{test.key}</p>
                <p style={{ color: colors.text3, fontSize: 12 }}>Owner: {test.owner}</p>
              </div>
              <span style={{ color: colors.primary, fontSize: 12 }}>{test.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {test.variants.map((variant) => (
                <span
                  className="rounded-full border px-2 py-1 text-xs"
                  key={variant.key}
                  style={{ borderColor: colors.divider, color: colors.text2 }}
                >
                  {variant.key}: {variant.rolloutPercentage}%
                </span>
              ))}
            </div>
          </TrCard>
        ))}
      </PageContent>
    </PageLayout>
  );
}
