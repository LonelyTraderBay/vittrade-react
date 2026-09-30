import { useMemo, useState } from 'react';
import { useMarketSentimentQuery } from '@/features/market';
import type {
  MarketSentimentLabel,
  MarketSentimentResponse,
  MarketSentimentToken,
  MarketSentimentWindow,
} from '@/features/market';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const windows: MarketSentimentWindow[] = ['24h', '7d', '30d'];
const tabs = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'tokens', label: 'Theo token' },
  { value: 'trends', label: 'Xu hướng' },
] as const;
const sortOptions = [
  { value: 'score', label: 'Sentiment' },
  { value: 'mentions', label: 'Mentions' },
  { value: 'trending', label: 'Trending' },
] as const;

type SentimentTab = (typeof tabs)[number]['value'];
type SentimentSort = (typeof sortOptions)[number]['value'];

const sentimentLabels: Record<MarketSentimentLabel, string> = {
  bullish: 'Tích cực',
  neutral: 'Trung lập',
  bearish: 'Tiêu cực',
};
const sentimentColors: Record<MarketSentimentLabel, string> = {
  bullish: '#10B981',
  neutral: '#6B7280',
  bearish: '#EF4444',
};

function compact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(
    value,
  );
}

function signedPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function scoreOffset(score: number): number {
  return (score + 100) / 2;
}

export function MarketSentimentPage() {
  const colors = useThemeColors();
  const [window, setWindow] = useState<MarketSentimentWindow>('24h');
  const [tab, setTab] = useState<SentimentTab>('overview');
  const [sortBy, setSortBy] = useState<SentimentSort>('score');
  const query = useMarketSentimentQuery({ window });

  const tokens = useMemo(() => {
    const comparators = {
      score: (a: MarketSentimentToken, b: MarketSentimentToken) => b.score - a.score,
      mentions: (a: MarketSentimentToken, b: MarketSentimentToken) => b.mentions24h - a.mentions24h,
      trending: (a: MarketSentimentToken, b: MarketSentimentToken) =>
        (a.trendingRank ?? Number.MAX_SAFE_INTEGER) - (b.trendingRank ?? Number.MAX_SAFE_INTEGER),
    };
    return [...(query.data?.tokens ?? [])].sort(comparators[sortBy]);
  }, [query.data?.tokens, sortBy]);

  return (
    <PageLayout>
      <Header title="Tâm lý thị trường" back />
      <PageContent gap="default">
        <div className="flex gap-2" role="group" aria-label="Khoảng thời gian">
          {windows.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={window === value}
              onClick={() => setWindow(value)}
              className="min-h-9 rounded-xl px-3 py-2"
              style={{
                background: window === value ? colors.chipActiveBg : colors.chipBg,
                color: window === value ? colors.chipActiveText : colors.chipText,
                border: `1px solid ${window === value ? colors.chipActiveBorder : colors.chipBorder}`,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex gap-2" role="group" aria-label="Phân loại dữ liệu tâm lý">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={tab === item.value}
              onClick={() => setTab(item.value)}
              className="min-h-9 rounded-xl px-3 py-2"
              style={{
                background: tab === item.value ? colors.chipActiveBg : colors.chipBg,
                color: tab === item.value ? colors.chipActiveText : colors.chipText,
                border: `1px solid ${tab === item.value ? colors.chipActiveBorder : colors.chipBorder}`,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {query.isPending ? (
          <TrCard className="p-5">
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải dữ liệu tâm lý…</p>
          </TrCard>
        ) : query.isError || !query.data ? (
          <ErrorState onAction={() => void query.refetch()} />
        ) : (
          <>
            <p style={{ color: colors.text3, fontSize: 10 }}>
              {query.data.provider} · cập nhật{' '}
              {new Date(query.data.updatedAt).toLocaleString('vi-VN', { timeZone: 'UTC' })} UTC
            </p>

            {tab === 'overview' && (
              <>
                <OverallSentiment overall={query.data.overall} />
                <div className="grid grid-cols-2 gap-2">
                  <SummaryCard
                    label="Lượt đề cập 24h"
                    value={compact(query.data.overall.totalMentions24h)}
                    detail={signedPercent(query.data.overall.mentionsChange24h)}
                  />
                  <SummaryCard
                    label="Token trending"
                    value={String(query.data.overall.trendingTokenCount)}
                  />
                </div>
                <SocialDominance value={query.data.overall.socialDominance} />
                <PageSection label={`Diễn biến ${window}`}>
                  <SentimentTimeline timeline={query.data.timeline} />
                </PageSection>
                <PageSection label="Token trending">
                  <TrendingTokens tokens={query.data.tokens} />
                </PageSection>
              </>
            )}

            {tab === 'tokens' && (
              <>
                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  role="group"
                  aria-label="Sắp xếp token"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={sortBy === option.value}
                      onClick={() => setSortBy(option.value)}
                      className="shrink-0 rounded-xl px-3 py-2"
                      style={{
                        background: sortBy === option.value ? colors.chipActiveBg : colors.chipBg,
                        color: sortBy === option.value ? colors.chipActiveText : colors.chipText,
                        border: `1px solid ${sortBy === option.value ? colors.chipActiveBorder : colors.chipBorder}`,
                        fontSize: 10,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {tokens.length === 0 ? (
                  <EmptyState label="Không có dữ liệu sentiment theo token." />
                ) : (
                  tokens.map((token) => <SentimentTokenCard key={token.id} token={token} />)
                )}
              </>
            )}

            {tab === 'trends' && (
              <>
                <PageSection label="Chủ đề nổi bật">
                  {query.data.trendingTopics.length === 0 ? (
                    <EmptyState label="Không có chủ đề trending." />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {query.data.trendingTopics.map((topic) => (
                        <div
                          key={topic.topic}
                          className="flex items-center justify-between rounded-xl px-3 py-2"
                          style={{ background: colors.surface }}
                        >
                          <span className="text-xs font-medium" style={{ color: colors.text1 }}>
                            #{topic.topic}
                          </span>
                          <span className="text-[10px]" style={{ color: colors.text3 }}>
                            {compact(topic.mentions24h)} · {signedPercent(topic.change24h)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </PageSection>
                <PageSection label="Tâm lý theo token">
                  <SentimentHeatmap tokens={query.data.tokens} />
                </PageSection>
                <PageSection label="Biến động lượt đề cập 24h">
                  <MentionChanges tokens={query.data.tokens} />
                </PageSection>
              </>
            )}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

function OverallSentiment({ overall }: { overall: MarketSentimentResponse['overall'] }) {
  const colors = useThemeColors();
  const color = sentimentColors[overall.sentiment];
  return (
    <TrCard variant="hero" className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: colors.text3 }}>
          Chỉ số tâm lý chung
        </p>
        <span className="text-xs font-semibold" style={{ color }}>
          {sentimentLabels[overall.sentiment]}
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold" style={{ color }}>
          {overall.score > 0 ? '+' : ''}
          {overall.score}
        </span>
        <span className="text-xs" style={{ color: colors.text3 }}>
          −100 đến +100
        </span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full"
        style={{ background: colors.surface2 }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${scoreOffset(overall.score)}%`, background: color }}
        />
      </div>
      <p className="mt-2 text-[10px]" style={{ color: colors.text3 }}>
        Chỉ số do nguồn dữ liệu cung cấp; phản ánh mẫu thảo luận, không đại diện toàn thị trường.
      </p>
    </TrCard>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3">
      <p className="text-[10px]" style={{ color: colors.text3 }}>
        {label}
      </p>
      <p className="mt-1 text-base font-bold" style={{ color: colors.text1 }}>
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-[10px]" style={{ color: colors.text2 }}>
          {detail}
        </p>
      )}
    </TrCard>
  );
}

function SocialDominance({
  value,
}: {
  value: MarketSentimentResponse['overall']['socialDominance'];
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-4">
      <p className="mb-2 text-xs font-semibold" style={{ color: colors.text2 }}>
        Phân bố lượt đề cập
      </p>
      <div className="flex h-4 overflow-hidden rounded-lg">
        <div style={{ width: `${value.btcPercent}%`, background: '#F7931A' }} />
        <div style={{ width: `${value.ethPercent}%`, background: '#627EEA' }} />
        <div style={{ width: `${value.otherPercent}%`, background: colors.surface2 }} />
      </div>
      <div
        className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px]"
        style={{ color: colors.text3 }}
      >
        <span>BTC {value.btcPercent}%</span>
        <span>ETH {value.ethPercent}%</span>
        <span>Khác {value.otherPercent}%</span>
      </div>
    </TrCard>
  );
}

function SentimentTimeline({
  timeline,
}: {
  timeline: Array<{ at: string; score: number; mentions: number }>;
}) {
  const colors = useThemeColors();
  if (timeline.length === 0) return <EmptyState label="Không có dữ liệu lịch sử." />;
  return (
    <TrCard className="p-4">
      <div className="flex flex-col gap-2">
        {timeline.map((point) => (
          <div key={point.at} className="flex items-center gap-2">
            <time
              dateTime={point.at}
              className="w-14 shrink-0 text-right text-[9px]"
              style={{ color: colors.text3 }}
            >
              {new Date(point.at).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                timeZone: 'UTC',
              })}
            </time>
            <div
              className="relative h-1.5 flex-1 rounded-full"
              style={{ background: colors.surface2 }}
            >
              <div
                className="absolute h-1.5 rounded-full"
                style={{
                  width: `${scoreOffset(point.score)}%`,
                  background:
                    sentimentColors[
                      point.score >= 20 ? 'bullish' : point.score <= -20 ? 'bearish' : 'neutral'
                    ],
                }}
              />
            </div>
            <span
              className="w-8 text-right text-[10px] font-semibold"
              style={{ color: colors.text2 }}
            >
              {point.score}
            </span>
          </div>
        ))}
      </div>
    </TrCard>
  );
}

function TrendingTokens({ tokens }: { tokens: MarketSentimentToken[] }) {
  const trending = [...tokens]
    .filter((token) => token.trendingRank !== undefined)
    .sort((a, b) => (a.trendingRank ?? 0) - (b.trendingRank ?? 0))
    .slice(0, 4);
  if (trending.length === 0) return <EmptyState label="Không có token trending." />;
  return (
    <div className="flex flex-col gap-1">
      {trending.map((token) => (
        <SentimentTokenRow key={token.id} token={token} />
      ))}
    </div>
  );
}

function SentimentTokenRow({ token }: { token: MarketSentimentToken }) {
  const colors = useThemeColors();
  const color = sentimentColors[token.sentiment];
  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-2"
      style={{ background: colors.surface }}
    >
      <div>
        <p className="text-xs font-semibold" style={{ color: colors.text1 }}>
          {token.symbol}
          {token.trendingRank ? ` · #${token.trendingRank}` : ''}
        </p>
        <p className="text-[10px]" style={{ color: colors.text3 }}>
          {compact(token.mentions24h)} lượt đề cập
        </p>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {token.score > 0 ? '+' : ''}
        {token.score}
      </span>
    </div>
  );
}

function SentimentTokenCard({ token }: { token: MarketSentimentToken }) {
  const colors = useThemeColors();
  const shares = token.sentimentSharePercent;
  return (
    <TrCard className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: colors.text1 }}>
            {token.symbol}
            {token.trendingRank ? ` · #${token.trendingRank}` : ''}
          </p>
          <p className="text-[10px]" style={{ color: colors.text3 }}>
            {token.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold" style={{ color: sentimentColors[token.sentiment] }}>
            {token.score > 0 ? '+' : ''}
            {token.score}
          </p>
          <p className="text-[10px]" style={{ color: colors.text3 }}>
            {sentimentLabels[token.sentiment]}
          </p>
        </div>
      </div>
      <div className="mt-3 flex h-1.5 overflow-hidden rounded">
        <div className="bg-emerald-500" style={{ width: `${shares.bullish}%` }} />
        <div className="bg-gray-500" style={{ width: `${shares.neutral}%` }} />
        <div className="bg-red-500" style={{ width: `${shares.bearish}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[9px]">
        <span style={{ color: '#10B981' }}>Tích cực {shares.bullish}%</span>
        <span style={{ color: colors.text3 }}>Trung lập {shares.neutral}%</span>
        <span style={{ color: '#EF4444' }}>Tiêu cực {shares.bearish}%</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <span style={{ color: colors.text3 }}>Đề cập 24h</span>
        <span className="text-right font-semibold" style={{ color: colors.text1 }}>
          {compact(token.mentions24h)} · {signedPercent(token.mentionsChange24h)}
        </span>
      </div>
      {token.topTopics.length > 0 && (
        <div
          className="mt-3 flex flex-wrap gap-1.5 border-t pt-2"
          style={{ borderColor: colors.divider }}
        >
          {token.topTopics.map((topic) => (
            <span
              key={topic}
              className="rounded-lg px-2 py-1 text-[9px]"
              style={{ background: colors.surface2, color: colors.text3 }}
            >
              #{topic}
            </span>
          ))}
        </div>
      )}
    </TrCard>
  );
}

function SentimentHeatmap({ tokens }: { tokens: MarketSentimentToken[] }) {
  const colors = useThemeColors();
  if (tokens.length === 0) return <EmptyState label="Không có dữ liệu theo token." />;
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {tokens.map((token) => (
        <div
          key={token.id}
          className="flex flex-col items-center rounded-xl py-3"
          style={{
            background: `${sentimentColors[token.sentiment]}12`,
            border: `1px solid ${sentimentColors[token.sentiment]}35`,
          }}
        >
          <span className="text-[10px] font-bold" style={{ color: colors.text1 }}>
            {token.symbol}
          </span>
          <span
            className="mt-1 text-sm font-bold"
            style={{ color: sentimentColors[token.sentiment] }}
          >
            {token.score}
          </span>
        </div>
      ))}
    </div>
  );
}

function MentionChanges({ tokens }: { tokens: MarketSentimentToken[] }) {
  const colors = useThemeColors();
  if (tokens.length === 0) return <EmptyState label="Không có dữ liệu lượt đề cập." />;
  const sorted = [...tokens].sort(
    (a, b) => Math.abs(b.mentionsChange24h) - Math.abs(a.mentionsChange24h),
  );
  const maximum = Math.max(0, ...sorted.map((token) => Math.abs(token.mentionsChange24h)));
  return (
    <div className="flex flex-col gap-1">
      {sorted.slice(0, 5).map((token) => (
        <div
          key={token.id}
          className="flex items-center gap-3 rounded-xl px-3 py-2"
          style={{ background: colors.surface }}
        >
          <span className="w-10 text-[10px] font-semibold" style={{ color: colors.text1 }}>
            {token.symbol}
          </span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full"
            style={{ background: colors.surface2 }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${maximum === 0 ? 0 : (Math.abs(token.mentionsChange24h) / maximum) * 100}%`,
                background: token.mentionsChange24h >= 0 ? '#10B981' : '#EF4444',
              }}
            />
          </div>
          <span
            className="w-12 text-right text-[10px]"
            style={{ color: token.mentionsChange24h >= 0 ? '#10B981' : '#EF4444' }}
          >
            {signedPercent(token.mentionsChange24h)}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  const colors = useThemeColors();
  return (
    <p className="py-6 text-center text-xs" style={{ color: colors.text3 }}>
      {label}
    </p>
  );
}
