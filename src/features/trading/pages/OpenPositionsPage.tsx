import { useState } from 'react';
import { ApiError } from '@/shared/api/api-error';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { fmtAmount, fmtPrice } from '@/shared/lib/formatNumber';
import { useAuth } from '@/shared/session/useAuth';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useOpenPositionsQuery } from '../model/trading-queries';
import type { TradingProductType } from '../model/trading-types';

const PAGE_SIZE = 50;
const PRODUCT_FILTERS: Array<{ value: TradingProductType | undefined; label: string }> = [
  { value: undefined, label: 'Tất cả' },
  { value: 'spot', label: 'Spot' },
  { value: 'futures', label: 'Futures' },
  { value: 'margin', label: 'Margin' },
];
const PRODUCT_LABELS: Record<TradingProductType, string> = {
  spot: 'Spot',
  futures: 'Futures',
  margin: 'Margin',
};

export function OpenPositionsPage() {
  const colors = useThemeColors();
  const { hasPermission } = useAuth();
  const [productType, setProductType] = useState<TradingProductType | undefined>();
  const canReadPositions = hasPermission('trade:read');
  const query = useOpenPositionsQuery({ productType, limit: PAGE_SIZE }, canReadPositions);
  const positions = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <PageLayout>
      <Header title="Vị thế đang mở" subtitle="Trade · Tài khoản" back />
      <PageContent gap="default">
        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Lọc loại vị thế">
          {PRODUCT_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              aria-pressed={productType === filter.value}
              onClick={() => setProductType(filter.value)}
              className="shrink-0 rounded-xl px-3 py-2"
              style={{
                background: productType === filter.value ? colors.chipActiveBg : colors.chipBg,
                color: productType === filter.value ? colors.chipActiveText : colors.chipText,
                border: `1px solid ${productType === filter.value ? colors.chipActiveBorder : colors.chipBorder}`,
                fontSize: 11,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {!canReadPositions ? (
          <p role="alert" className="py-12 text-center" style={{ color: colors.text2 }}>
            Tài khoản của bạn không có quyền xem vị thế.
          </p>
        ) : query.isPending ? (
          <TrCard className="p-5">
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải vị thế…</p>
          </TrCard>
        ) : query.isError && !query.data ? (
          <ErrorState
            title={
              query.error instanceof ApiError && query.error.code === 'positions_source_unavailable'
                ? 'Nguồn dữ liệu vị thế chưa được kết nối'
                : undefined
            }
            message={
              query.error instanceof ApiError && query.error.code === 'positions_source_unavailable'
                ? 'Frontend chưa có backend cung cấp dữ liệu tài khoản.'
                : undefined
            }
            onAction={() => void query.refetch()}
          />
        ) : positions.length === 0 ? (
          <TrCard className="p-5">
            <p className="text-center" style={{ color: colors.text3, fontSize: 12 }}>
              Không có vị thế phù hợp.
            </p>
          </TrCard>
        ) : (
          <>
            {query.data?.pages[0]?.updatedAt && (
              <p style={{ color: colors.text3, fontSize: 10 }}>
                Dữ liệu cập nhật{' '}
                {new Date(query.data.pages[0].updatedAt).toLocaleString('vi-VN', {
                  timeZone: 'UTC',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}{' '}
                UTC · số liệu do máy chủ cung cấp
              </p>
            )}

            <div className="flex flex-col gap-3">
              {positions.map((position) => (
                <TrCard key={position.id} className="p-4">
                  <article
                    aria-label={`${PRODUCT_LABELS[position.productType]} ${position.symbol}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded px-2 py-1 text-[10px] font-semibold"
                        style={{ background: colors.chipBg, color: colors.chipText }}
                      >
                        {PRODUCT_LABELS[position.productType]}
                      </span>
                      <h2 className="text-sm font-semibold" style={{ color: colors.text1 }}>
                        {position.symbol}
                      </h2>
                      <span
                        className="ml-auto text-xs font-semibold"
                        style={{ color: position.side === 'long' ? '#10B981' : '#EF4444' }}
                      >
                        {position.side === 'long' ? 'Long' : 'Short'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <PositionValue
                        label="Khối lượng"
                        value={`${fmtAmount(position.quantity)} ${position.baseAsset}`}
                      />
                      <PositionValue
                        label="Giá vào"
                        value={`${fmtPrice(position.entryPrice)} ${position.quoteAsset}`}
                      />
                      <PositionValue
                        label="Giá đánh dấu"
                        value={`${fmtPrice(position.markPrice)} ${position.quoteAsset}`}
                      />
                      <PositionValue
                        label="P/L chưa thực hiện"
                        value={`${position.unrealizedPnl >= 0 ? '+' : '−'}${fmtAmount(Math.abs(position.unrealizedPnl))} ${position.quoteAsset}`}
                        color={position.unrealizedPnl >= 0 ? '#10B981' : '#EF4444'}
                      />
                    </div>

                    <time
                      dateTime={position.openedAt}
                      className="mt-3 block"
                      style={{ color: colors.text3, fontSize: 10 }}
                    >
                      Mở lúc{' '}
                      {new Date(position.openedAt).toLocaleString('vi-VN', {
                        timeZone: 'UTC',
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      UTC
                    </time>
                  </article>
                </TrCard>
              ))}
            </div>

            {query.isFetchNextPageError && (
              <ErrorState
                title="Không tải được các vị thế tiếp theo"
                onAction={() => void query.fetchNextPage()}
              />
            )}

            {query.isError && query.data && !query.isFetchNextPageError && (
              <p role="alert" style={{ color: colors.error, fontSize: 12 }}>
                Không thể làm mới dữ liệu. Các số liệu đang hiển thị là bản gần nhất từ máy chủ.
              </p>
            )}

            {query.hasNextPage && !query.isFetchNextPageError && (
              <button
                type="button"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                style={{ background: colors.chipBg, color: colors.chipText }}
              >
                {query.isFetchingNextPage ? 'Đang tải…' : 'Tải thêm vị thế'}
              </button>
            )}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

function PositionValue({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors = useThemeColors();
  return (
    <div>
      <p style={{ color: colors.text3, fontSize: 10 }}>{label}</p>
      <p
        className="mt-1 break-all font-mono text-xs font-semibold"
        style={{ color: color ?? colors.text1 }}
      >
        {value}
      </p>
    </div>
  );
}
