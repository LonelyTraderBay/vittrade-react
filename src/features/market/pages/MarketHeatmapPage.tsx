import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowDownRight, ArrowUpRight, Filter, Grid3x3 } from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useMarketPairsQuery, type MarketPair } from '@/features/market';

const EMPTY_PAIRS: MarketPair[] = [];

export function MarketHeatmapPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const [category, setCategory] = useState('all');
  const pairsQuery = useMarketPairsQuery({ limit: 100 });
  const pairs = pairsQuery.data?.items ?? EMPTY_PAIRS;
  const categories = useMemo(
    () => ['all', ...Array.from(new Set(pairs.map((pair) => pair.category))).sort()],
    [pairs],
  );
  const filteredPairs = useMemo(
    () => (category === 'all' ? pairs : pairs.filter((pair) => pair.category === category)),
    [category, pairs],
  );
  const maxMarketCap = Math.max(...filteredPairs.map((pair) => pair.marketCap), 1);

  if (pairsQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Market heatmap" back />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải heatmap thị trường…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (pairsQuery.isError) {
    return (
      <PageLayout>
        <Header title="Market heatmap" back />
        <ErrorState onAction={() => void pairsQuery.refetch()} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Market heatmap" subtitle="Size theo market cap · màu theo 24h" back />
      <PageContent gap="default">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={14} color={colors.text3} />
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className="rounded-lg px-3 py-1.5 whitespace-nowrap"
              style={{
                background: category === item ? colors.chipActiveBg : colors.chipBg,
                border: `1px solid ${category === item ? colors.chipActiveBorder : colors.chipBorder}`,
                color: category === item ? colors.chipActiveText : colors.chipText,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {item === 'all' ? 'Tất cả' : item}
            </button>
          ))}
        </div>

        {filteredPairs.length === 0 ? (
          <TrCard className="p-8 text-center">
            <Grid3x3 size={20} color={colors.text3} className="mx-auto mb-2" />
            <p style={{ color: colors.text3, fontSize: 12 }}>Không có dữ liệu cho ngành này.</p>
          </TrCard>
        ) : (
          <TrCard className="p-3">
            <div className="grid grid-cols-4 gap-1" role="list" aria-label="Market heatmap">
              {filteredPairs.map((pair) => (
                <HeatmapTile
                  key={pair.id}
                  pair={pair}
                  maxMarketCap={maxMarketCap}
                  onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                />
              ))}
            </div>
          </TrCard>
        )}

        <div className="flex items-center justify-between">
          <span style={{ color: colors.text3, fontSize: 10 }}>
            {filteredPairs.length} cặp thị trường
          </span>
          <div className="flex items-center gap-3" style={{ fontSize: 10 }}>
            <span className="flex items-center gap-1" style={{ color: '#10B981' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
              Tăng
            </span>
            <span className="flex items-center gap-1" style={{ color: '#EF4444' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
              Giảm
            </span>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  );
}

function HeatmapTile({
  pair,
  maxMarketCap,
  onClick,
}: {
  pair: MarketPair;
  maxMarketCap: number;
  onClick: () => void;
}) {
  const positive = pair.change24h >= 0;
  const intensity = Math.min(Math.abs(pair.change24h) / 10, 1);
  const background = positive
    ? `rgba(16, 185, 129, ${0.12 + intensity * 0.5})`
    : `rgba(239, 68, 68, ${0.12 + intensity * 0.5})`;
  const minHeight = 82 + Math.round((pair.marketCap / maxMarketCap) * 50);

  return (
    <button
      role="listitem"
      onClick={onClick}
      className="rounded-xl p-2 text-left transition-transform active:scale-[0.98]"
      style={{ background, minHeight }}
      title={`${pair.symbol}: ${fmtCompact(pair.marketCap, { prefix: '$' })}`}
    >
      <span className="flex items-center justify-between gap-1">
        <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{pair.baseAsset}</span>
        {positive ? (
          <ArrowUpRight size={12} color="#fff" />
        ) : (
          <ArrowDownRight size={12} color="#fff" />
        )}
      </span>
      <span style={{ color: 'rgba(255,255,255,.82)', display: 'block', fontSize: 10 }}>
        {pair.quoteAsset}
      </span>
      <span
        style={{
          color: '#fff',
          display: 'block',
          fontSize: 11,
          fontFamily: 'monospace',
          marginTop: 10,
        }}
      >
        {fmtPrice(pair.price)}
      </span>
      <span style={{ color: '#fff', display: 'block', fontSize: 10, fontWeight: 700 }}>
        {positive ? '+' : ''}
        {fmtPct(pair.change24h)}
      </span>
    </button>
  );
}
