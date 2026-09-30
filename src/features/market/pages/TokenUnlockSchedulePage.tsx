import { useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useMarketTokenUnlocksQuery } from '@/features/market';
import type { MarketUnlockCategory, MarketUnlockWindow } from '@/features/market';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const windows: MarketUnlockWindow[] = ['7d', '30d', '90d'];
const categories: Array<{ value: MarketUnlockCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'team', label: 'Đội ngũ' },
  { value: 'investor', label: 'Nhà đầu tư' },
  { value: 'ecosystem', label: 'Hệ sinh thái' },
  { value: 'community', label: 'Cộng đồng' },
  { value: 'foundation', label: 'Quỹ' },
];

const scheduleLabels = {
  cliff: 'Cliff',
  linear: 'Tuyến tính',
  milestone: 'Theo mốc',
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(amount);
}

export function TokenUnlockSchedulePage() {
  const colors = useThemeColors();
  const [window, setWindow] = useState<MarketUnlockWindow>('30d');
  const [category, setCategory] = useState<MarketUnlockCategory | 'all'>('all');
  const query = useMarketTokenUnlocksQuery({
    window,
    ...(category !== 'all' ? { category } : {}),
  });

  return (
    <PageLayout>
      <Header title="Lịch mở khóa token" subtitle="Lịch trình theo nguồn dữ liệu" back />
      <PageContent gap="default">
        <div className="flex gap-2" role="group" aria-label="Khoảng thời gian mở khóa">
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

        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Lọc nhóm phân bổ">
          {categories.map((option) => {
            const active = category === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(option.value)}
                className="shrink-0 rounded-xl px-3 py-2 whitespace-nowrap"
                style={{
                  background: active ? colors.chipActiveBg : colors.chipBg,
                  border: `1px solid ${active ? colors.chipActiveBorder : colors.chipBorder}`,
                  color: active ? colors.chipActiveText : colors.chipText,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <TrCard className="p-3">
          <p style={{ color: colors.text3, fontSize: 11, lineHeight: 1.5 }}>
            Lịch mở khóa có thể được cập nhật hoặc điều chỉnh. Tỷ lệ lưu hành và trạng thái xác nhận
            theo dữ liệu của nguồn; lịch này không dự báo biến động giá.
          </p>
        </TrCard>

        {query.isPending ? (
          <TrCard className="p-5">
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải lịch mở khóa…</p>
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
                {query.data.items.length} sự kiện · {query.data.provider} · cập nhật{' '}
                {new Date(query.data.updatedAt).toLocaleTimeString('vi-VN')}
              </div>
              <button
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                aria-label="Làm mới lịch mở khóa"
                style={{ color: colors.text2 }}
              >
                <RefreshCw size={14} className={query.isFetching ? 'animate-spin' : undefined} />
              </button>
            </div>
            {query.data.items.length === 0 ? (
              <p className="py-8 text-center" style={{ color: colors.text3, fontSize: 12 }}>
                Không có sự kiện mở khóa phù hợp.
              </p>
            ) : (
              query.data.items.map((item) => (
                <article
                  key={item.id}
                  className="py-4"
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: colors.text1 }}>
                      {item.symbol}
                    </span>
                    <span style={{ color: colors.text3, fontSize: 10 }}>{item.name}</span>
                    <span
                      className="ml-auto rounded px-1.5 py-0.5 text-[9px]"
                      style={{
                        color: item.status === 'confirmed' ? '#10B981' : '#F59E0B',
                        background: item.status === 'confirmed' ? '#10B98114' : '#F59E0B14',
                      }}
                    >
                      {item.status === 'confirmed' ? 'Đã xác nhận' : 'Ước tính'}
                    </span>
                  </div>
                  <time
                    dateTime={item.eventAt}
                    className="mt-2 block text-xs"
                    style={{ color: colors.text2 }}
                  >
                    {new Date(item.eventAt).toLocaleString('vi-VN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'UTC',
                    })}{' '}
                    UTC
                  </time>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                    <span style={{ color: colors.text2 }}>
                      {formatAmount(item.amount)} {item.symbol}
                    </span>
                    <span style={{ color: colors.text3 }}>
                      {item.circulatingSupplyPercent.toFixed(2)}% nguồn cung lưu hành
                    </span>
                    <span style={{ color: colors.text3 }}>
                      {categories.find((entry) => entry.value === item.category)?.label} ·{' '}
                      {scheduleLabels[item.scheduleType]}
                    </span>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 text-xs"
                      style={{ color: colors.link }}
                    >
                      Nguồn <ExternalLink size={12} />
                    </a>
                  </div>
                </article>
              ))
            )}
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}
