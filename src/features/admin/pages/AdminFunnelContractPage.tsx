import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAdminFunnelQuery } from '../model/admin-queries';

export function AdminFunnelContractPage() {
  const colors = useThemeColors();
  const query = useAdminFunnelQuery();

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Funnel" />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải funnel…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;

  return (
    <PageLayout>
      <Header title="Funnel analytics" />
      <PageContent gap="tight">
        {query.data.steps.map((step) => (
          <TrCard className="flex items-center justify-between p-4" key={step.key}>
            <div>
              <p style={{ color: colors.text1, fontWeight: 600 }}>{step.key}</p>
              <p style={{ color: colors.text3, fontSize: 12 }}>
                {step.count.toLocaleString('vi-VN')} users
              </p>
            </div>
            <strong style={{ color: colors.primary }}>
              {(step.conversionRate * 100).toFixed(1)}%
            </strong>
          </TrCard>
        ))}
      </PageContent>
    </PageLayout>
  );
}
