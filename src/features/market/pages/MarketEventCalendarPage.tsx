import { useState } from 'react';
import { CalendarDays, ExternalLink, RefreshCw } from 'lucide-react';
import { useMarketCalendarQuery } from '@/features/market';
import type { MarketCalendarEventType, MarketEventImpact } from '@/features/market';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const eventTypes: Array<{ value: MarketCalendarEventType | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unlock', label: 'Mở khóa' },
  { value: 'upgrade', label: 'Nâng cấp' },
  { value: 'halving', label: 'Halving' },
  { value: 'airdrop', label: 'Airdrop' },
  { value: 'listing', label: 'Niêm yết' },
  { value: 'fork', label: 'Fork' },
  { value: 'burn', label: 'Đốt token' },
  { value: 'conference', label: 'Hội nghị' },
  { value: 'report', label: 'Báo cáo' },
];

const impacts: Array<{ value: MarketEventImpact | 'all'; label: string; color: string }> = [
  { value: 'all', label: 'Mọi mức tác động', color: '#94A3B8' },
  { value: 'high', label: 'Cao', color: '#EF4444' },
  { value: 'medium', label: 'Trung bình', color: '#F59E0B' },
  { value: 'low', label: 'Thấp', color: '#10B981' },
];

export function MarketEventCalendarPage() {
  const colors = useThemeColors();
  const [type, setType] = useState<MarketCalendarEventType | 'all'>('all');
  const [impact, setImpact] = useState<MarketEventImpact | 'all'>('all');
  const query = useMarketCalendarQuery({
    ...(type !== 'all' ? { type } : {}),
    ...(impact !== 'all' ? { impact } : {}),
  });

  return (
    <PageLayout>
      <Header title="Lịch sự kiện" subtitle="Sự kiện sắp tới theo API contract" back />
      <PageContent gap="default">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Lọc loại sự kiện">
          {eventTypes.map((option) => {
            const active = type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setType(option.value)}
                className="shrink-0 rounded-xl px-3 py-2 whitespace-nowrap"
                style={{
                  background: active ? colors.chipActiveBg : colors.chipBg,
                  border: `1px solid ${active ? colors.chipActiveBorder : colors.chipBorder}`,
                  color: active ? colors.chipActiveText : colors.chipText,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Lọc mức tác động">
          {impacts.map((option) => {
            const active = impact === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setImpact(option.value)}
                className="shrink-0 rounded-lg px-2.5 py-1.5"
                style={{
                  background: active ? `${option.color}14` : 'transparent',
                  border: `1px solid ${active ? `${option.color}35` : colors.borderSolid}`,
                  color: active ? option.color : colors.text3,
                  fontSize: 10,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {query.isPending ? (
          <TrCard className="p-5">
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải lịch sự kiện…</p>
          </TrCard>
        ) : query.isError || !query.data ? (
          <ErrorState onAction={() => void query.refetch()} />
        ) : (
          <TrCard className="px-4">
            <div
              className="flex items-center justify-between py-3"
              style={{ borderBottom: `1px solid ${colors.divider}` }}
            >
              <span style={{ color: colors.text3, fontSize: 11 }}>
                {query.data.items.length} sự kiện · cập nhật{' '}
                {new Date(query.data.updatedAt).toLocaleTimeString('vi-VN')}
              </span>
              <button
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                aria-label="Làm mới lịch sự kiện"
                style={{ color: colors.text2 }}
              >
                <RefreshCw size={14} className={query.isFetching ? 'animate-spin' : undefined} />
              </button>
            </div>
            {query.data.items.length === 0 ? (
              <p className="py-8 text-center" style={{ color: colors.text3, fontSize: 12 }}>
                Không có sự kiện phù hợp.
              </p>
            ) : (
              query.data.items.map((event) => {
                const eventType = eventTypes.find((option) => option.value === event.type);
                const eventImpact = impacts.find((option) => option.value === event.impact);
                return (
                  <article
                    key={event.id}
                    className="py-4"
                    style={{ borderBottom: `1px solid ${colors.divider}` }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span style={{ color: colors.text3, fontSize: 10 }}>
                        {eventType?.label ?? event.type}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px]"
                        style={{
                          color: eventImpact?.color,
                          background: `${eventImpact?.color}14`,
                        }}
                      >
                        {eventImpact?.label ?? event.impact}
                      </span>
                      <span
                        style={{ color: event.confirmed ? '#10B981' : colors.text3, fontSize: 9 }}
                      >
                        {event.confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
                      </span>
                      {event.symbol && (
                        <span
                          className="ml-auto rounded px-2 py-1 text-[10px]"
                          style={{ background: colors.chipBg, color: colors.text1 }}
                        >
                          {event.symbol}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-sm font-semibold" style={{ color: colors.text1 }}>
                      {event.title}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: colors.text2 }}>
                      {event.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
                      <CalendarDays size={12} color={colors.text3} />
                      <time dateTime={event.eventAt} style={{ color: colors.text3, fontSize: 10 }}>
                        {new Date(event.eventAt).toLocaleString('vi-VN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                          timeZone: 'UTC',
                        })}{' '}
                        UTC
                      </time>
                      {event.sourceUrl && (
                        <a
                          href={event.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1 text-xs"
                          style={{ color: colors.link }}
                        >
                          Nguồn <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}
