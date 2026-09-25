import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAdminOverviewQuery } from '../model/admin-queries';

export function AdminOverviewContractPage() {
  const colors = useThemeColors();
  const query = useAdminOverviewQuery();

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="Admin" />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải dữ liệu quản trị…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;

  return (
    <PageLayout>
      <Header title="Admin" />
      <PageContent gap="default">
        <p style={{ color: colors.text2, fontSize: 12 }}>
          Snapshot server-owned lúc {new Date(query.data.generatedAt).toLocaleString('vi-VN')}.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Active users" value={query.data.activeUsers.toLocaleString('vi-VN')} />
          <Metric label="Verified users" value={query.data.verifiedUsers.toLocaleString('vi-VN')} />
        </div>
        <TrCard className="p-4">
          <p style={{ color: colors.text3, fontSize: 11 }}>Gross volume</p>
          <p style={{ color: colors.text1, fontSize: 24, fontWeight: 700 }}>
            {query.data.grossVolume}
          </p>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-4">
      <p style={{ color: colors.text3, fontSize: 11 }}>{label}</p>
      <p style={{ color: colors.text1, fontSize: 20, fontWeight: 700 }}>{value}</p>
    </TrCard>
  );
}
