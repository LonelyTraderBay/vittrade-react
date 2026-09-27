import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Clock3, ExternalLink, RefreshCw, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useMarketNewsQuery } from '@/features/market';
import type { MarketNewsCategory, MarketNewsSentiment } from '@/features/market';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const categories: Array<{ value: MarketNewsCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'market', label: 'Thị trường' },
  { value: 'macro', label: 'Kinh tế' },
  { value: 'regulation', label: 'Pháp lý' },
  { value: 'project', label: 'Dự án' },
];

const sentiments = [
  { value: 'all', label: 'Mọi xu hướng', icon: Minus },
  { value: 'bullish', label: 'Tích cực', icon: TrendingUp },
  { value: 'neutral', label: 'Trung lập', icon: Minus },
  { value: 'bearish', label: 'Tiêu cực', icon: TrendingDown },
] as const;

const sentimentColors: Record<MarketNewsSentiment, string> = {
  bullish: '#10B981',
  neutral: '#94A3B8',
  bearish: '#EF4444',
};

const categoryLabels: Record<MarketNewsCategory, string> = {
  market: 'Thị trường',
  macro: 'Kinh tế',
  regulation: 'Pháp lý',
  project: 'Dự án',
};

const sentimentLabels: Record<MarketNewsSentiment, string> = {
  bullish: 'Tích cực',
  neutral: 'Trung lập',
  bearish: 'Tiêu cực',
};

export function MarketNewsFeedPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [category, setCategory] = useState<MarketNewsCategory | 'all'>('all');
  const [sentiment, setSentiment] = useState<MarketNewsSentiment | 'all'>('all');
  const query = useMarketNewsQuery({
    ...(category !== 'all' ? { category } : {}),
    ...(sentiment !== 'all' ? { sentiment } : {}),
    limit: 50,
  });

  return (
    <PageLayout>
      <Header title="Tin thị trường" subtitle="Nguồn tin theo API contract" back />
      <PageContent gap="default">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Lọc loại tin">
          {categories.map((item) => {
            const active = category === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(item.value)}
                className="shrink-0 rounded-xl px-3 py-2 whitespace-nowrap"
                style={{
                  background: active ? colors.chipActiveBg : colors.chipBg,
                  border: `1px solid ${active ? colors.chipActiveBorder : colors.chipBorder}`,
                  color: active ? colors.chipActiveText : colors.chipText,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Lọc xu hướng">
          {sentiments.map(({ value, label, icon: Icon }) => {
            const active = sentiment === value;
            const color = value === 'all' ? colors.text2 : sentimentColors[value];
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setSentiment(value)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                style={{
                  background: active ? `${color}14` : 'transparent',
                  border: `1px solid ${active ? `${color}35` : colors.borderSolid}`,
                  color: active ? color : colors.text3,
                  fontSize: 10,
                }}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>

        {query.isPending ? (
          <TrCard className="p-5">
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải tin thị trường…</p>
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
                {query.data.items.length} tin · cập nhật{' '}
                {new Date(query.data.updatedAt).toLocaleTimeString('vi-VN')}
              </span>
              <button
                type="button"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
                aria-label="Làm mới tin thị trường"
                style={{ color: colors.text2 }}
              >
                <RefreshCw size={14} className={query.isFetching ? 'animate-spin' : undefined} />
              </button>
            </div>
            {query.data.items.length === 0 ? (
              <div className="py-8 text-center">
                <p style={{ color: colors.text3, fontSize: 12 }}>Chưa có tin phù hợp.</p>
                {(category !== 'all' || sentiment !== 'all') && (
                  <button
                    type="button"
                    className="mt-3 text-xs"
                    style={{ color: colors.link }}
                    onClick={() => {
                      setCategory('all');
                      setSentiment('all');
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            ) : (
              query.data.items.map((news) => (
                <article
                  key={news.id}
                  className="py-4"
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {news.isBreaking && (
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-red-500 bg-red-500/10">
                        NÓNG
                      </span>
                    )}
                    <span style={{ color: colors.text3, fontSize: 10 }}>
                      {categoryLabels[news.category]}
                    </span>
                    <span style={{ color: sentimentColors[news.sentiment], fontSize: 10 }}>
                      {sentimentLabels[news.sentiment]}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold" style={{ color: colors.text1 }}>
                    {news.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: colors.text2 }}>
                    {news.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2">
                    <span style={{ color: colors.text3, fontSize: 10 }}>{news.source}</span>
                    <span aria-hidden="true" style={{ color: colors.text3, fontSize: 10 }}>
                      ·
                    </span>
                    <Clock3 size={11} color={colors.text3} />
                    <time dateTime={news.publishedAt} style={{ color: colors.text3, fontSize: 10 }}>
                      {new Date(news.publishedAt).toLocaleString('vi-VN')}
                    </time>
                    <a
                      href={news.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1 text-xs"
                      style={{ color: colors.link }}
                    >
                      Nguồn <ExternalLink size={12} />
                    </a>
                  </div>
                  {news.relatedPairs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {news.relatedPairs.map((pair) => (
                        <button
                          key={pair.pairId}
                          type="button"
                          onClick={() => navigate(`${prefix}/pair/${pair.pairId}`)}
                          className="rounded-lg px-2 py-1 text-[10px]"
                          style={{
                            background: colors.chipBg,
                            border: `1px solid ${colors.chipBorder}`,
                            color: colors.text1,
                          }}
                        >
                          {pair.symbol}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </TrCard>
        )}
      </PageContent>
    </PageLayout>
  );
}
