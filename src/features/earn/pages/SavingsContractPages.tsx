import { useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { EmptyState } from '@/shared/ui/EmptyState';
import { ErrorState } from '@/shared/ui/ErrorState';
import { FilterButton } from '@/shared/ui/FilterButton';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useEarnSnapshotQuery } from '../model/earn-queries';

export function SavingsComparisonContractPage() {
  const colors = useThemeColors();
  const query = useEarnSnapshotQuery();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const products = (query.data?.products ?? []).filter((product) => product.domain === 'savings');
  const selected = useMemo(
    () => selectedIds.map((id) => products.find((product) => product.id === id)).filter(Boolean),
    [products, selectedIds],
  );
  return (
    <PageLayout>
      <Header title="Savings comparison" subtitle="Compare server-owned Earn products" back />
      <PageContent gap="default">
        <fieldset
          className="min-w-0"
          aria-describedby={
            query.isSuccess
              ? 'savings-comparison-guidance savings-comparison-selection'
              : 'savings-comparison-selection'
          }
        >
          <legend className="mb-3" style={{ color: colors.text2 }}>
            Chọn sản phẩm để so sánh
          </legend>
          <div className="flex flex-wrap gap-2">
            {products.map((product) => {
              const active = selectedIds.includes(product.id);
              return (
                <FilterButton
                  key={product.id}
                  selected={active}
                  label={product.name}
                  disabled={!query.isSuccess || (!active && selected.length >= 3)}
                  onClick={() =>
                    setSelectedIds((ids) => {
                      const currentIds = ids.filter((id) =>
                        products.some((available) => available.id === id),
                      );
                      return currentIds.includes(product.id)
                        ? currentIds.filter((id) => id !== product.id)
                        : currentIds.length < 3
                          ? [...currentIds, product.id]
                          : currentIds;
                    })
                  }
                />
              );
            })}
          </div>
        </fieldset>
        {query.isSuccess && (
          <p id="savings-comparison-guidance" style={{ color: colors.text2 }}>
            Chọn tối đa 3 sản phẩm để so sánh.
          </p>
        )}
        <p id="savings-comparison-selection" role="status" style={{ color: colors.text2 }}>
          Đã chọn {selected.length}/3 sản phẩm.
          {selected.length === 3 && ' Bỏ chọn một sản phẩm để chọn sản phẩm khác.'}
        </p>
        <div role="region" aria-label="Kết quả so sánh tiết kiệm" aria-busy={query.isFetching}>
          {query.isPending ? (
            <p role="status" style={{ color: colors.text2 }}>
              Đang tải dữ liệu API…
            </p>
          ) : query.isError ? (
            <div role="alert">
              <ErrorState onAction={() => void query.refetch()} />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Chưa có sản phẩm tiết kiệm"
              subtitle="Sản phẩm tiết kiệm sẽ xuất hiện tại đây khi API có dữ liệu."
            />
          ) : selected.length > 0 ? (
            <div
              role="region"
              aria-label="Bảng so sánh có thể cuộn ngang"
              tabIndex={0}
              className="overflow-x-auto rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ outlineColor: colors.primary }}
            >
              <table className="w-full min-w-[520px] border-separate border-spacing-2">
                <caption className="sr-only">So sánh sản phẩm tiết kiệm</caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="text-left px-2"
                      style={{ minWidth: 120, color: colors.text3, fontSize: 11 }}
                    >
                      Chỉ số
                    </th>
                    {selected.map((product) => (
                      <th key={product!.id} scope="col" style={{ minWidth: 150 }}>
                        <TrCard className="p-3">
                          <strong style={{ color: colors.text1, overflowWrap: 'anywhere' }}>
                            {product!.asset}
                          </strong>
                          <p
                            style={{ color: colors.text1, fontSize: 12, overflowWrap: 'anywhere' }}
                          >
                            {product!.name}
                          </p>
                        </TrCard>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['APY', 'Risk', 'Min amount', 'Participants'].map((label) => (
                    <ComparisonRow
                      key={label}
                      label={label}
                      values={selected.map((product) => {
                        if (label === 'APY') return `${product!.apy}%`;
                        if (label === 'Risk') return product!.riskLevel;
                        if (label === 'Min amount')
                          return `${product!.minAmount} ${product!.asset}`;
                        return product!.participants.toLocaleString();
                      })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </PageContent>
    </PageLayout>
  );
}

function ComparisonRow({
  label,
  values,
}: {
  label: string;
  values: Array<string | number | undefined>;
}) {
  const colors = useThemeColors();
  return (
    <tr>
      <th scope="row" className="px-2 text-left" style={{ color: colors.text3, fontSize: 11 }}>
        {label}
      </th>
      {values.map((value, index) => (
        <td
          key={`${label}-${index}`}
          className="rounded-lg p-3"
          style={{
            background: colors.surface2,
            color: colors.text2,
            fontSize: 12,
            overflowWrap: 'anywhere',
          }}
        >
          {value}
        </td>
      ))}
    </tr>
  );
}
