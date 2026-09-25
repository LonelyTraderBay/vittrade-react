import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useCopyProvidersQuery } from '../model/trading-queries';

export function ProviderComparisonContractPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const colors = useThemeColors();
  const query = useCopyProvidersQuery();
  const selectedIds = useMemo(
    () => searchParams.get('ids')?.split(',').filter(Boolean) ?? [],
    [searchParams],
  );

  if (query.isPending) {
    return (
      <PageLayout>
        <Header title="So sánh Providers" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải provider…</p>
        </PageContent>
      </PageLayout>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState onAction={() => void query.refetch()} />;
  }
  const providers = query.data.items.filter(
    (provider) => selectedIds.length === 0 || selectedIds.includes(provider.id),
  );
  return (
    <PageLayout>
      <Header title="So sánh Providers" subtitle={`${providers.length} provider`} back />
      <PageContent gap="default">
        <TrCard className="p-3" style={{ background: colors.warningBg }}>
          <p style={{ color: colors.warningText, fontSize: 12 }}>
            So sánh chỉ là thông tin tham khảo, không phải khuyến nghị đầu tư.
          </p>
        </TrCard>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ color: colors.text2, fontSize: 12 }}>
            <thead>
              <tr>
                <th className="p-2 text-left">Metric</th>
                {providers.map((provider) => (
                  <th className="p-2 text-left" key={provider.id}>
                    {provider.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row
                label="ROI"
                values={providers.map((provider) => `${provider.totalPnlPct.toFixed(1)}%`)}
              />
              <Row
                label="Max DD"
                values={providers.map((provider) => `${provider.maxDrawdown.toFixed(1)}%`)}
              />
              <Row
                label="Sharpe"
                values={providers.map((provider) => provider.sharpeRatio.toFixed(2))}
              />
              <Row label="Win rate" values={providers.map((provider) => `${provider.winRate}%`)} />
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="w-full rounded-xl py-3"
          style={{ background: colors.primary, color: '#fff', fontWeight: 700 }}
          onClick={() => navigate(`${prefix}/trade/copy-trading`)}
        >
          Quay lại Copy Trading
        </button>
      </PageContent>
    </PageLayout>
  );
}

function Row({ label, values }: { label: string; values: string[] }) {
  const colors = useThemeColors();
  return (
    <tr>
      <td className="border-t p-2" style={{ color: colors.text1 }}>
        {label}
      </td>
      {values.map((value, index) => (
        <td className="border-t p-2" key={`${label}-${index}`}>
          {value}
        </td>
      ))}
    </tr>
  );
}
