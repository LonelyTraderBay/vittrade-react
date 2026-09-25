import { useMemo, useState } from 'react';
import { ErrorState } from '@/shared/ui/ErrorState';
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
  if (query.isPending) return <LoadingPage title="Savings comparison" />;
  if (query.isError) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <PageLayout>
      <Header title="Savings comparison" subtitle="Compare server-owned Earn products" back />
      <PageContent gap="default">
        <div className="flex flex-wrap gap-2">
          {products.map((product) => {
            const active = selectedIds.includes(product.id);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() =>
                  setSelectedIds((ids) =>
                    active
                      ? ids.filter((id) => id !== product.id)
                      : ids.length < 3
                        ? [...ids, product.id]
                        : ids,
                  )
                }
                className="rounded-xl px-3 py-2"
                style={{
                  background: active ? `${product.color}25` : colors.surface2,
                  color: colors.text1,
                  border: `1px solid ${active ? product.color : colors.borderSolid}`,
                  fontSize: 11,
                }}
              >
                {product.name}
              </button>
            );
          })}
        </div>
        {!selected.length && (
          <p style={{ color: colors.text2 }}>Chọn tối đa 3 sản phẩm để so sánh.</p>
        )}
        {selected.length > 0 && (
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[520px] gap-2"
              style={{
                gridTemplateColumns: `120px repeat(${selected.length}, minmax(150px, 1fr))`,
              }}
            >
              <div />
              {selected.map((product) => (
                <TrCard key={product!.id} className="p-3">
                  <strong style={{ color: product!.color }}>{product!.asset}</strong>
                  <p style={{ color: colors.text1, fontSize: 12 }}>{product!.name}</p>
                </TrCard>
              ))}
              {['APY', 'Risk', 'Min amount', 'Participants'].map((label) => (
                <ComparisonRow
                  key={label}
                  label={label}
                  values={selected.map((product) => {
                    if (label === 'APY') return `${product!.apy}%`;
                    if (label === 'Risk') return product!.riskLevel;
                    if (label === 'Min amount') return `${product!.minAmount} ${product!.asset}`;
                    return product!.participants.toLocaleString();
                  })}
                />
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}

function LoadingPage({ title }: { title: string }) {
  const colors = useThemeColors();
  return (
    <PageLayout>
      <Header title={title} back />
      <PageContent>
        <p style={{ color: colors.text2 }}>Đang tải dữ liệu API…</p>
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
    <>
      <div className="flex items-center px-2" style={{ color: colors.text3, fontSize: 11 }}>
        {label}
      </div>
      {values.map((value, index) => (
        <div
          key={`${label}-${index}`}
          className="rounded-lg p-3"
          style={{ background: colors.surface2, color: colors.text2, fontSize: 12 }}
        >
          {value}
        </div>
      ))}
    </>
  );
}
