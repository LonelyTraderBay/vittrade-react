import { useMemo, useState } from 'react';
import { useMarketSignalsQuery } from '@/features/market';
import type { MarketSignalCategory, MarketSignalStatus } from '@/features/market';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const statuses: Array<{ value: MarketSignalStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang mở' },
  { value: 'closed', label: 'Đã đóng' },
  { value: 'expired', label: 'Hết hạn' },
];

const categories: Array<{ value: MarketSignalCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Mọi khung' },
  { value: 'scalp', label: 'Scalp' },
  { value: 'swing', label: 'Swing' },
  { value: 'position', label: 'Position' },
];

const statusLabels: Record<MarketSignalStatus, string> = {
  active: 'Đang mở',
  closed: 'Đã đóng',
  expired: 'Hết hạn',
};

export function MarketSignalsPage() {
  const colors = useThemeColors();
  const [status, setStatus] = useState<MarketSignalStatus | 'all'>('all');
  const [category, setCategory] = useState<MarketSignalCategory | 'all'>('all');
  const query = useMarketSignalsQuery();
  const signals = useMemo(
    () =>
      (query.data?.items ?? []).filter(
        (signal) =>
          (status === 'all' || signal.status === status) &&
          (category === 'all' || signal.category === category),
      ),
    [category, query.data?.items, status],
  );

  return (
    <PageLayout>
      <Header title="Tín hiệu cộng đồng" back />
      <PageContent gap="default">
        <p style={{ color: colors.text3, fontSize: 11 }}>
          Thông tin do nhà cung cấp công bố, chưa được VitTrade xác minh. Đây không phải khuyến nghị
          đầu tư và không tạo lệnh giao dịch.
        </p>

        <FilterGroup
          label="Trạng thái tín hiệu"
          options={statuses}
          value={status}
          onChange={setStatus}
        />
        <FilterGroup
          label="Khung tín hiệu"
          options={categories}
          value={category}
          onChange={setCategory}
        />

        {query.isPending ? (
          <TrCard className="p-5">
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải tín hiệu…</p>
          </TrCard>
        ) : query.isError || !query.data ? (
          <ErrorState onAction={() => void query.refetch()} />
        ) : (
          <>
            <p style={{ color: colors.text3, fontSize: 10 }}>
              {query.data.provider} · đồng bộ{' '}
              {new Date(query.data.updatedAt).toLocaleString('vi-VN', {
                timeZone: 'UTC',
                dateStyle: 'medium',
                timeStyle: 'short',
              })}{' '}
              UTC
            </p>
            {signals.length === 0 ? (
              <TrCard className="p-5">
                <p className="text-center" style={{ color: colors.text3, fontSize: 12 }}>
                  {query.data.items.length === 0
                    ? 'Nguồn chưa cung cấp tín hiệu.'
                    : 'Không có tín hiệu phù hợp bộ lọc.'}
                </p>
              </TrCard>
            ) : (
              <div className="flex flex-col gap-3">
                {signals.map((signal) => (
                  <TrCard key={signal.id} className="p-4">
                    <article>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-semibold" style={{ color: colors.text1 }}>
                          {signal.symbol}
                        </h2>
                        <span
                          style={{
                            color: signal.direction === 'long' ? '#10B981' : '#EF4444',
                            fontSize: 10,
                          }}
                        >
                          {signal.direction === 'long' ? 'Long' : 'Short'}
                        </span>
                        <span
                          className="ml-auto rounded px-2 py-1 text-[10px]"
                          style={{ background: colors.chipBg, color: colors.chipText }}
                        >
                          {statusLabels[signal.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs" style={{ color: colors.text2 }}>
                        {signal.providerName} · {signal.category}
                      </p>
                      <p className="mt-3 text-xs leading-relaxed" style={{ color: colors.text2 }}>
                        {signal.rationale}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <time
                          dateTime={signal.publishedAt}
                          style={{ color: colors.text3, fontSize: 10 }}
                        >
                          {new Date(signal.publishedAt).toLocaleString('vi-VN', {
                            timeZone: 'UTC',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}{' '}
                          UTC
                        </time>
                        {signal.expiresAt && (
                          <span style={{ color: colors.text3, fontSize: 10 }}>
                            Hết hạn{' '}
                            {new Date(signal.expiresAt).toLocaleString('vi-VN', {
                              timeZone: 'UTC',
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}{' '}
                            UTC
                          </span>
                        )}
                        <a
                          href={signal.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs"
                          style={{ color: colors.link }}
                        >
                          Xem nguồn
                        </a>
                      </div>
                    </article>
                  </TrCard>
                ))}
              </div>
            )}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
}) {
  const colors = useThemeColors();
  return (
    <div className="flex gap-2 overflow-x-auto" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="shrink-0 rounded-xl px-3 py-2"
          style={{
            background: value === option.value ? colors.chipActiveBg : colors.chipBg,
            color: value === option.value ? colors.chipActiveText : colors.chipText,
            border: `1px solid ${value === option.value ? colors.chipActiveBorder : colors.chipBorder}`,
            fontSize: 10,
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
