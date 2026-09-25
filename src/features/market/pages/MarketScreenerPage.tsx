import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowDownRight, ArrowUpRight, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { SparklineChart } from '@/shared/ui/charts/SparklineChart';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useMarketPairsQuery, type MarketPair } from '@/features/market';

const EMPTY_PAIRS: MarketPair[] = [];

type ScreenerSort = 'change24h' | 'marketCap' | 'volume24h';

export function MarketScreenerPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<ScreenerSort>('change24h');
  const pairsQuery = useMarketPairsQuery({ limit: 100 });
  const pairs = pairsQuery.data?.items ?? EMPTY_PAIRS;
  const categories = ['all', ...Array.from(new Set(pairs.map((pair) => pair.category))).sort()];
  const filteredPairs = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return [...pairs]
      .filter((pair) => category === 'all' || pair.category === category)
      .filter(
        (pair) =>
          !normalized || `${pair.symbol} ${pair.baseAsset}`.toLowerCase().includes(normalized),
      )
      .sort((a, b) => b[sort] - a[sort]);
  }, [category, pairs, search, sort]);

  if (pairsQuery.isPending) {
    return <LoadingPage colors={colors} />;
  }
  if (pairsQuery.isError) {
    return <ErrorPage onRetry={() => void pairsQuery.refetch()} />;
  }

  return (
    <PageLayout>
      <Header title="Market screener" subtitle="Lọc dữ liệu từ market API" back />
      <PageContent gap="default">
        <div className="flex gap-2">
          <label
            className="flex items-center gap-2 flex-1 rounded-xl px-3"
            style={{ background: colors.surface2 }}
          >
            <Search size={14} color={colors.text3} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tài sản…"
              className="flex-1 py-2.5 bg-transparent outline-none"
              style={{ color: colors.text1, fontSize: 12 }}
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl px-2"
            style={{ background: colors.chipBg, color: colors.chipText, fontSize: 11 }}
            aria-label="Lọc ngành"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'Tất cả' : item}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal size={14} color={colors.text3} />
          {[
            { value: 'change24h' as const, label: '24h' },
            { value: 'marketCap' as const, label: 'Market cap' },
            { value: 'volume24h' as const, label: 'Volume' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setSort(item.value)}
              className="rounded-lg px-3 py-1.5"
              style={{
                background: sort === item.value ? colors.chipActiveBg : colors.chipBg,
                color: sort === item.value ? colors.chipActiveText : colors.chipText,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <TrCard className="px-4">
          <div
            className="flex items-center justify-between py-3"
            style={{ borderBottom: `1px solid ${colors.divider}` }}
          >
            <span style={{ color: colors.text3, fontSize: 11 }}>
              <Filter size={12} className="inline" /> {filteredPairs.length} tài sản
            </span>
            <span style={{ color: colors.text3, fontSize: 10 }}>Sắp xếp giảm dần</span>
          </div>
          {filteredPairs.length === 0 ? (
            <p className="py-8 text-center" style={{ color: colors.text3, fontSize: 12 }}>
              Không có tài sản phù hợp.
            </p>
          ) : (
            filteredPairs.map((pair, index) => (
              <ScreenerRow
                key={pair.id}
                pair={pair}
                rank={index + 1}
                onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
              />
            ))
          )}
        </TrCard>
      </PageContent>
    </PageLayout>
  );
}

function ScreenerRow({
  pair,
  rank,
  onClick,
}: {
  pair: MarketPair;
  rank: number;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  const positive = pair.change24h >= 0;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 py-3 w-full text-left"
      style={{ borderBottom: `1px solid ${colors.divider}` }}
    >
      <span style={{ color: colors.text3, width: 20, fontSize: 10 }}>{rank}</span>
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `${pair.logoColor}20` }}
      >
        <span style={{ color: pair.logoColor, fontSize: 9, fontWeight: 700 }}>
          {pair.baseAsset.slice(0, 3)}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span style={{ color: colors.text1, display: 'block', fontSize: 12, fontWeight: 600 }}>
          {pair.symbol}
        </span>
        <span style={{ color: colors.text3, display: 'block', fontSize: 10 }}>
          {fmtCompact(pair.marketCap, { prefix: '$' })} mcap
        </span>
      </span>
      <span style={{ width: 56, height: 25 }}>
        <SparklineChart data={pair.sparklineData} isPositive={positive} />
      </span>
      <span className="text-right" style={{ minWidth: 78 }}>
        <span
          style={{ color: colors.text1, display: 'block', fontSize: 11, fontFamily: 'monospace' }}
        >
          {fmtPrice(pair.price)}
        </span>
        <span style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 10, fontWeight: 700 }}>
          {positive ? (
            <ArrowUpRight size={10} className="inline" />
          ) : (
            <ArrowDownRight size={10} className="inline" />
          )}{' '}
          {fmtPct(Math.abs(pair.change24h))}
        </span>
      </span>
    </button>
  );
}

function LoadingPage({ colors }: { colors: ReturnType<typeof useThemeColors> }) {
  return (
    <PageLayout>
      <Header title="Market screener" back />
      <PageContent>
        <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải screener…</p>
      </PageContent>
    </PageLayout>
  );
}
function ErrorPage({ onRetry }: { onRetry: () => void }) {
  return (
    <PageLayout>
      <Header title="Market screener" back />
      <ErrorState onAction={onRetry} />
    </PageLayout>
  );
}
