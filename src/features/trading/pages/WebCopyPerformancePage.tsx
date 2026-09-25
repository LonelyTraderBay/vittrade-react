import { useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useCopyRelationshipsQuery } from '../model/trading-queries';

export function WebCopyPerformancePage() {
  const { copyId } = useParams();
  const colors = useThemeColors();
  const query = useCopyRelationshipsQuery();

  if (query.isPending)
    return (
      <PageLayout>
        <Header title="Hiệu suất Copy" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải hiệu suất…</p>
        </PageContent>
      </PageLayout>
    );
  if (query.isError || !query.data) return <ErrorState onAction={() => void query.refetch()} />;
  const relationship = query.data.items.find((item) => item.id === copyId);
  if (!relationship) return <ErrorState onAction={() => void query.refetch()} />;

  return (
    <PageLayout>
      <Header title="Hiệu suất Copy" subtitle={relationship.provider.name} back />
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Metric
              label="P/L"
              value={`${relationship.pnlPct.toFixed(2)}%`}
              positive={relationship.pnl >= 0}
            />
            <Metric label="Trades" value={String(relationship.trades)} />
            <Metric label="Win rate" value={`${relationship.winRate}%`} />
          </div>
        </TrCard>
        <TrCard className="p-4">
          <h3 style={{ color: colors.text1, fontWeight: 700 }}>Lịch sử giá trị</h3>
          <div className="mt-3 flex flex-col gap-2" style={{ color: colors.text2, fontSize: 12 }}>
            {relationship.performanceHistory.map((point) => (
              <div className="flex justify-between" key={point.date}>
                <span>{point.date}</span>
                <strong>${point.value.toLocaleString('en-US')}</strong>
              </div>
            ))}
          </div>
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const colors = useThemeColors();
  return (
    <div>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <p
        style={{
          color: positive === undefined ? colors.text1 : positive ? '#10B981' : '#EF4444',
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {value}
      </p>
    </div>
  );
}
