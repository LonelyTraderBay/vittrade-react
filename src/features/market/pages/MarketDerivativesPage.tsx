import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, BarChart3, Scale } from 'lucide-react';
import { useMarketDerivativesQuery } from '@/features/market';
import type { MarketDerivativePair, MarketDerivativesStats } from '@/features/market';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';

const tabs = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'perpetual', label: 'Perpetual' },
  { value: 'liquidations', label: 'Thanh lý' },
] as const;

const sortOptions = [
  { value: 'openInterest', label: 'OI' },
  { value: 'volume24h', label: 'Volume' },
  { value: 'fundingRate', label: 'Funding' },
  { value: 'change24h', label: 'Thay đổi' },
] as const;

type DerivativesTab = (typeof tabs)[number]['value'];
type PairSort = (typeof sortOptions)[number]['value'];

function formatUsd(value: number): string {
  return `$${new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatFundingRate(rate: number): string {
  return `${(rate * 100).toFixed(4)}%`;
}

export function MarketDerivativesPage() {
  const colors = useThemeColors();
  const query = useMarketDerivativesQuery();
  const [tab, setTab] = useState<DerivativesTab>('overview');
  const [sortBy, setSortBy] = useState<PairSort>('openInterest');

  const pairs = useMemo(() => {
    const compare = {
      openInterest: (a: MarketDerivativePair, b: MarketDerivativePair) =>
        b.openInterest - a.openInterest,
      volume24h: (a: MarketDerivativePair, b: MarketDerivativePair) => b.volume24h - a.volume24h,
      fundingRate: (a: MarketDerivativePair, b: MarketDerivativePair) =>
        Math.abs(b.fundingRate) - Math.abs(a.fundingRate),
      change24h: (a: MarketDerivativePair, b: MarketDerivativePair) =>
        Math.abs(b.change24h) - Math.abs(a.change24h),
    }[sortBy];
    return [...(query.data?.pairs ?? [])].sort(compare);
  }, [query.data?.pairs, sortBy]);

  return (
    <PageLayout>
      <Header title="Phái sinh" back />
      <PageContent gap="default">
        <div className="flex gap-2" role="group" aria-label="Dữ liệu phái sinh">
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
            <p style={{ color: colors.text2, fontSize: 12 }}>Đang tải dữ liệu phái sinh…</p>
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
                <div className="grid grid-cols-2 gap-2">
                  <StatCard
                    label="Tổng Open Interest"
                    value={formatUsd(query.data.stats.totalOpenInterest)}
                    detail={formatPercent(query.data.stats.openInterestChange24h)}
                    icon={<BarChart3 size={14} />}
                  />
                  <StatCard
                    label="Khối lượng 24h"
                    value={formatUsd(query.data.stats.totalVolume24h)}
                    detail={formatPercent(query.data.stats.volumeChange24h)}
                    icon={<Activity size={14} />}
                  />
                  <StatCard
                    label="Funding trung bình · 8h"
                    value={formatFundingRate(query.data.stats.averageFundingRate8h)}
                    icon={<Activity size={14} />}
                  />
                  <StatCard
                    label="BTC Long/Short"
                    value={query.data.stats.btcLongShortRatio.toFixed(2)}
                    icon={<Scale size={14} />}
                  />
                </div>
                <PageSection label="Open Interest cao nhất">
                  {pairs.length === 0 ? (
                    <EmptyState label="Không có dữ liệu Open Interest." />
                  ) : (
                    pairs.slice(0, 5).map((pair) => <OpenInterestRow key={pair.id} pair={pair} />)
                  )}
                </PageSection>
                <PageSection label="Thanh lý theo thời gian">
                  <LiquidationHistory history={query.data.liquidationHistory} />
                </PageSection>
              </>
            )}

            {tab === 'perpetual' && (
              <>
                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  role="group"
                  aria-label="Sắp xếp cặp"
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
                {pairs.length === 0 ? (
                  <EmptyState label="Không có dữ liệu perpetual." />
                ) : (
                  pairs.map((pair) => <PerpetualCard key={pair.id} pair={pair} />)
                )}
              </>
            )}

            {tab === 'liquidations' && (
              <>
                <LiquidationSummary stats={query.data.stats} />
                {pairs.length === 0 ? (
                  <EmptyState label="Không có dữ liệu thanh lý theo cặp." />
                ) : (
                  [...pairs]
                    .sort(
                      (a, b) =>
                        b.liquidations24h.long +
                        b.liquidations24h.short -
                        (a.liquidations24h.long + a.liquidations24h.short),
                    )
                    .map((pair) => <LiquidationPair key={pair.id} pair={pair} />)
                )}
                <TrCard className="p-4">
                  <div className="flex gap-3">
                    <AlertTriangle size={16} color="#F59E0B" className="mt-1 shrink-0" />
                    <p style={{ color: colors.text3, fontSize: 11, lineHeight: 1.5 }}>
                      Giao dịch phái sinh có rủi ro cao. Đòn bẩy khuếch đại cả lãi và lỗ; dữ liệu
                      này chỉ mô tả thị trường, không phải khuyến nghị giao dịch.
                    </p>
                  </div>
                </TrCard>
              </>
            )}
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3">
      <div className="flex items-center gap-2">
        <span style={{ color: colors.text3 }}>{icon}</span>
        <span style={{ color: colors.text3, fontSize: 10 }}>{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold" style={{ color: colors.text1 }}>
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

function OpenInterestRow({ pair }: { pair: MarketDerivativePair }) {
  const colors = useThemeColors();
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: colors.surface }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: colors.text1 }}>
          {pair.symbol}
        </p>
        <p className="text-[10px]" style={{ color: colors.text3 }}>
          {pair.name} · {formatUsd(pair.openInterest)}
        </p>
      </div>
      <span className="text-xs" style={{ color: colors.text2 }}>
        {formatPercent(pair.openInterestChange24h)}
      </span>
    </div>
  );
}

function PerpetualCard({ pair }: { pair: MarketDerivativePair }) {
  const colors = useThemeColors();
  const shortShare = 100 - pair.longSharePercent;
  return (
    <TrCard className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: colors.text1 }}>
            {pair.symbol}
          </p>
          <p className="text-[10px]" style={{ color: colors.text3 }}>
            {pair.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: colors.text1 }}>
            ${pair.price.toLocaleString('en-US', { maximumFractionDigits: 8 })}
          </p>
          <p className="text-[10px]" style={{ color: pair.change24h >= 0 ? '#10B981' : '#EF4444' }}>
            {formatPercent(pair.change24h)}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <Metric label="OI" value={formatUsd(pair.openInterest)} />
        <Metric label="Volume 24h" value={formatUsd(pair.volume24h)} />
        <Metric label="Funding" value={formatFundingRate(pair.fundingRate)} />
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px]">
          <span style={{ color: '#10B981' }}>Long {pair.longSharePercent.toFixed(1)}%</span>
          <span style={{ color: '#EF4444' }}>Short {shortShare.toFixed(1)}%</span>
        </div>
        <div className="flex h-1 overflow-hidden rounded">
          <div style={{ width: `${pair.longSharePercent}%`, background: '#10B981' }} />
          <div style={{ width: `${shortShare}%`, background: '#EF4444' }} />
        </div>
      </div>
    </TrCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const colors = useThemeColors();
  return (
    <div>
      <p style={{ color: colors.text3 }}>{label}</p>
      <p className="font-semibold" style={{ color: colors.text1 }}>
        {value}
      </p>
    </div>
  );
}

function LiquidationHistory({
  history,
}: {
  history: Array<{ bucketAt: string; long: number; short: number }>;
}) {
  const colors = useThemeColors();
  const maximum = Math.max(0, ...history.map((bucket) => Math.max(bucket.long, bucket.short)));
  if (history.length === 0) return <EmptyState label="Không có dữ liệu thanh lý theo thời gian." />;
  return (
    <TrCard className="p-4">
      <div className="flex flex-col gap-3">
        {history.map((bucket) => (
          <div key={bucket.bucketAt} className="flex items-center gap-2">
            <time
              dateTime={bucket.bucketAt}
              className="w-14 text-right text-[9px]"
              style={{ color: colors.text3 }}
            >
              {new Date(bucket.bucketAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
              })}
            </time>
            <div className="flex flex-1 gap-0.5">
              <div
                className="h-2 rounded-l bg-emerald-500/80"
                style={{ width: `${maximum === 0 ? 0 : (bucket.long / maximum) * 50}%` }}
              />
              <div
                className="h-2 rounded-r bg-red-500/80"
                style={{ width: `${maximum === 0 ? 0 : (bucket.short / maximum) * 50}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </TrCard>
  );
}

function LiquidationSummary({ stats }: { stats: MarketDerivativesStats }) {
  const colors = useThemeColors();
  const combined = stats.longLiquidations24h + stats.shortLiquidations24h;
  const longPercent = combined === 0 ? 0 : (stats.longLiquidations24h / combined) * 100;
  return (
    <TrCard variant="hero" className="p-4">
      <p className="text-xs" style={{ color: colors.text3 }}>
        Tổng thanh lý 24h
      </p>
      <p className="mt-1 text-xl font-bold" style={{ color: colors.text1 }}>
        {formatUsd(stats.totalLiquidations24h)}
      </p>
      <div className="mt-4 flex h-4 overflow-hidden rounded-lg">
        <div className="bg-emerald-500" style={{ width: `${longPercent}%` }} />
        <div
          className="bg-red-500"
          style={{ width: `${combined === 0 ? 0 : 100 - longPercent}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px]">
        <span style={{ color: '#10B981' }}>Long {formatUsd(stats.longLiquidations24h)}</span>
        <span style={{ color: '#EF4444' }}>Short {formatUsd(stats.shortLiquidations24h)}</span>
      </div>
    </TrCard>
  );
}

function LiquidationPair({ pair }: { pair: MarketDerivativePair }) {
  const colors = useThemeColors();
  const total = pair.liquidations24h.long + pair.liquidations24h.short;
  const longPercent = total === 0 ? 0 : (pair.liquidations24h.long / total) * 100;
  return (
    <TrCard className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: colors.text1 }}>
          {pair.symbol}
        </span>
        <span className="text-xs font-semibold" style={{ color: colors.text1 }}>
          {formatUsd(total)}
        </span>
      </div>
      <div className="mt-2 flex h-1 overflow-hidden rounded">
        <div className="bg-emerald-500" style={{ width: `${longPercent}%` }} />
        <div className="bg-red-500" style={{ width: `${total === 0 ? 0 : 100 - longPercent}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px]">
        <span style={{ color: '#10B981' }}>Long {formatUsd(pair.liquidations24h.long)}</span>
        <span style={{ color: '#EF4444' }}>Short {formatUsd(pair.liquidations24h.short)}</span>
      </div>
    </TrCard>
  );
}

function EmptyState({ label }: { label: string }) {
  const colors = useThemeColors();
  return (
    <p className="py-8 text-center text-xs" style={{ color: colors.text3 }}>
      {label}
    </p>
  );
}
