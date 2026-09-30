import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useMarketCorrelationsQuery } from '@/features/market';
import type { MarketCorrelationWindow } from '@/features/market';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const windows: MarketCorrelationWindow[] = ['7d', '30d', '90d'];

export function MarketCorrelationPairsPage() {
  const colors = useThemeColors();
  const [window, setWindow] = useState<MarketCorrelationWindow>('7d');
  const [order, setOrder] = useState<'positive' | 'negative'>('positive');
  const query = useMarketCorrelationsQuery({ window });
  const items = useMemo(() => {
    const pairs = [...(query.data?.items ?? [])];
    return pairs.sort((a, b) =>
      order === 'positive' ? b.coefficient - a.coefficient : a.coefficient - b.coefficient,
    );
  }, [order, query.data?.items]);

  return (
    <PageLayout>
      <Header title="Tương quan thị trường" subtitle="Hệ số lịch sử theo API contract" back />
      <PageContent gap="default">
        <div className="flex gap-2" role="group" aria-label="Khoảng thời gian tương quan">
          {windows.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={window === value}
              onClick={() => setWindow(value)}
              className="min-h-9 rounded-xl px-3 py-2"
              style={{
                background: window === value ? colors.chipActiveBg : colors.chipBg,
                border: `1px solid ${window === value ? colors.chipActiveBorder : colors.chipBorder}`,
                color: window === value ? colors.chipActiveText : colors.chipText,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2" role="group" aria-label="Sắp xếp hệ số">
          <button
            type="button"
            aria-pressed={order === 'positive'}
            onClick={() => setOrder('positive')}
            className="rounded-lg px-3 py-1.5"
            style={{
              background: order === 'positive' ? 'rgba(239,68,68,0.1)' : colors.chipBg,
              color: order === 'positive' ? '#EF4444' : colors.text3,
              fontSize: 11,
            }}
          >
            Dương nhất
          </button>
          <button
            type="button"
            aria-pressed={order === 'negative'}
            onClick={() => setOrder('negative')}
            className="rounded-lg px-3 py-1.5"
            style={{
              background: order === 'negative' ? 'rgba(59,130,246,0.1)' : colors.chipBg,
              color: order === 'negative' ? '#3B82F6' : colors.text3,
              fontSize: 11,
            }}
          >
            Âm nhất
          </button>
        </div>

        <TrCard className="p-3">
          <p style={{ color: colors.text3, fontSize: 11, lineHeight: 1.5 }}>
            Hệ số mô tả mức đồng biến lịch sử trong khoảng thời gian đã chọn; đây không phải dự báo
            giá hoặc khuyến nghị giao dịch.
          </p>
        </TrCard>

        {query.isPending ? (
          <TrCard className="p-5">
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải dữ liệu tương quan…</p>
          </TrCard>
        ) : query.isError || !query.data ? (
          <ErrorState onAction={() => void query.refetch()} />
        ) : (
          <TrCard className="px-4">
            <div
              className="flex items-center justify-between py-3"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <div style={{ color: colors.text3, fontSize: 10 }}>
                {query.data.items.length} cặp · {query.data.provider} · {query.data.method} · cập
                nhật {new Date(query.data.updatedAt).toLocaleTimeString('vi-VN')}
              </div>
              <button
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                aria-label="Làm mới tương quan"
                style={{ color: colors.text2 }}
              >
                <RefreshCw size={14} className={query.isFetching ? 'animate-spin' : undefined} />
              </button>
            </div>
            {items.length === 0 ? (
              <p className="py-8 text-center" style={{ color: colors.text3, fontSize: 12 }}>
                Chưa có hệ số tương quan cho khoảng thời gian này.
              </p>
            ) : (
              items.map((item) => {
                const color =
                  item.coefficient > 0
                    ? '#EF4444'
                    : item.coefficient < 0
                      ? '#3B82F6'
                      : colors.text3;
                const direction =
                  item.coefficient > 0.05
                    ? 'Cùng chiều'
                    : item.coefficient < -0.05
                      ? 'Ngược chiều'
                      : 'Gần trung tính';
                return (
                  <div
                    key={`${item.assetA}/${item.assetB}`}
                    className="flex items-center justify-between gap-3 py-3"
                    style={{ borderBottom: `1px solid ${colors.divider}` }}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: colors.text1 }}>
                        {item.assetA} / {item.assetB}
                      </p>
                      <p className="mt-1 text-[10px]" style={{ color: colors.text3 }}>
                        {direction} · {item.observations} quan sát
                      </p>
                    </div>
                    <output
                      aria-label={`Hệ số tương quan ${item.assetA} và ${item.assetB}`}
                      className="shrink-0 font-semibold tabular-nums"
                      style={{ color, fontSize: 13 }}
                    >
                      {item.coefficient.toFixed(2)}
                    </output>
                  </div>
                );
              })
            )}
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}
