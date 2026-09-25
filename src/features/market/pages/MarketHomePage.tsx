import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Flame,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent, PageSection } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useMarketPairsQuery, useMarketWatchlistQuery, type MarketPair } from '@/features/market';

const EMPTY_PAIRS: MarketPair[] = [];

export function MarketHomePage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { isAuthenticated, user } = useAuth();
  const pairsQuery = useMarketPairsQuery({ limit: 50 });
  const watchlistEnabled = isAuthenticated && Boolean(user?.id);
  const watchlistQuery = useMarketWatchlistQuery({ enabled: watchlistEnabled, userId: user?.id });

  const pairs = pairsQuery.data?.items ?? EMPTY_PAIRS;
  const favoritePairIds = useMemo(
    () => new Set(watchlistEnabled ? watchlistQuery.data?.items.map((item) => item.pairId) : []),
    [watchlistEnabled, watchlistQuery.data?.items],
  );
  const favoritePairs = useMemo(
    () => pairs.filter((pair) => favoritePairIds.has(pair.id)).slice(0, 5),
    [favoritePairIds, pairs],
  );
  const gainers = useMemo(
    () => [...pairs].sort((a, b) => b.change24h - a.change24h).slice(0, 5),
    [pairs],
  );
  const losers = useMemo(
    () => [...pairs].sort((a, b) => a.change24h - b.change24h).slice(0, 5),
    [pairs],
  );
  const mostActive = useMemo(
    () => [...pairs].sort((a, b) => b.volume24h - a.volume24h).slice(0, 5),
    [pairs],
  );

  if (pairsQuery.isPending || (watchlistEnabled && watchlistQuery.isPending)) {
    return (
      <PageLayout>
        <Header title="Thị trường" />
        <PageContent>
          <p style={{ color: colors.text2, fontSize: 13 }}>Đang tải dữ liệu thị trường…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (pairsQuery.isError || (watchlistEnabled && watchlistQuery.isError)) {
    return (
      <PageLayout>
        <Header title="Thị trường" />
        <ErrorState
          onAction={() => {
            void pairsQuery.refetch();
            if (watchlistEnabled) void watchlistQuery.refetch();
          }}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Thị trường" subtitle="Dữ liệu market contract" />
      <PageContent gap="relaxed">
        <TrCard variant="hero" className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ color: colors.text3, fontSize: 11 }}>Tài sản theo dõi</p>
              <p style={{ color: colors.text1, fontSize: 24, fontWeight: 700 }}>
                {favoritePairs.length}
              </p>
            </div>
            <button
              onClick={() => navigate(`${prefix}/markets`)}
              className="rounded-xl px-3 py-2 flex items-center gap-1"
              style={{ background: '#3B82F6', color: '#fff', fontSize: 11, fontWeight: 600 }}
            >
              <Search size={13} />
              Khám phá
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SummaryMetric label="Tăng mạnh" value={gainers[0]?.symbol ?? '—'} color="#10B981" />
            <SummaryMetric label="Giảm mạnh" value={losers[0]?.symbol ?? '—'} color="#EF4444" />
            <SummaryMetric
              label="Thanh khoản"
              value={mostActive[0]?.symbol ?? '—'}
              color="#3B82F6"
            />
          </div>
        </TrCard>

        <MarketSection
          title="Đang theo dõi"
          icon={Star}
          color="#F59E0B"
          pairs={favoritePairs}
          emptyLabel="Chưa có cặp trong watchlist"
          onMore={() => navigate(`${prefix}/markets/watchlist`)}
          onPair={(pair) => navigate(`${prefix}/pair/${pair.id}`)}
        />
        <div className="grid grid-cols-2 gap-3">
          <MarketSection
            title="Tăng mạnh"
            icon={TrendingUp}
            color="#10B981"
            pairs={gainers}
            onMore={() => navigate(`${prefix}/markets/movers`)}
            onPair={(pair) => navigate(`${prefix}/pair/${pair.id}`)}
          />
          <MarketSection
            title="Giảm mạnh"
            icon={TrendingDown}
            color="#EF4444"
            pairs={losers}
            onMore={() => navigate(`${prefix}/markets/movers`)}
            onPair={(pair) => navigate(`${prefix}/pair/${pair.id}`)}
          />
        </div>

        <PageSection label="Thanh khoản nổi bật" accentColor="#3B82F6">
          <TrCard className="px-4">
            {mostActive.map((pair) => (
              <PairRow
                key={pair.id}
                pair={pair}
                onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                showVolume
              />
            ))}
          </TrCard>
        </PageSection>

        <div className="grid grid-cols-2 gap-2">
          <QuickLink
            icon={BarChart3}
            label="Tổng quan"
            onClick={() => navigate(`${prefix}/markets/overview`)}
          />
          <QuickLink
            icon={Flame}
            label="Market depth"
            onClick={() => navigate(`${prefix}/markets/depth`)}
          />
        </div>
      </PageContent>
    </PageLayout>
  );
}

function MarketSection({
  title,
  icon: Icon,
  color,
  pairs,
  emptyLabel,
  onMore,
  onPair,
}: {
  title: string;
  icon: typeof Star;
  color: string;
  pairs: MarketPair[];
  emptyLabel?: string;
  onMore: () => void;
  onPair: (pair: MarketPair) => void;
}) {
  const colors = useThemeColors();
  return (
    <TrCard className="p-3" role="region" aria-label={title}>
      <button className="flex items-center justify-between w-full mb-2" onClick={onMore}>
        <span className="flex items-center gap-2" style={{ color, fontSize: 12, fontWeight: 700 }}>
          <Icon size={14} />
          {title}
        </span>
        <ChevronRight size={12} color={colors.text3} />
      </button>
      {pairs.length === 0 ? (
        <p className="py-4 text-center" style={{ color: colors.text3, fontSize: 11 }}>
          {emptyLabel ?? 'Chưa có dữ liệu'}
        </p>
      ) : (
        pairs.map((pair) => <PairRow key={pair.id} pair={pair} onClick={() => onPair(pair)} />)
      )}
    </TrCard>
  );
}

function PairRow({
  pair,
  onClick,
  showVolume = false,
}: {
  pair: MarketPair;
  onClick: () => void;
  showVolume?: boolean;
}) {
  const colors = useThemeColors();
  const positive = pair.change24h >= 0;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 py-2 w-full text-left"
      style={{ borderBottom: `1px solid ${colors.divider}` }}
    >
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${pair.logoColor}20` }}
      >
        <span style={{ color: pair.logoColor, fontSize: 9, fontWeight: 700 }}>
          {pair.baseAsset.slice(0, 3)}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span style={{ color: colors.text1, display: 'block', fontSize: 11, fontWeight: 600 }}>
          {pair.symbol}
        </span>
        {showVolume && (
          <span style={{ color: colors.text3, display: 'block', fontSize: 9 }}>
            {fmtCompact(pair.volume24h, { prefix: '$' })}
          </span>
        )}
      </span>
      <span className="text-right">
        <span
          style={{ color: colors.text1, display: 'block', fontSize: 11, fontFamily: 'monospace' }}
        >
          {fmtPrice(pair.price)}
        </span>
        <span
          style={{
            color: positive ? '#10B981' : '#EF4444',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          {positive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {fmtPct(Math.abs(pair.change24h))}
        </span>
      </span>
    </button>
  );
}

function SummaryMetric({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useThemeColors();
  return (
    <div className="rounded-xl p-2" style={{ background: colors.portfolioBtnGhost }}>
      <p style={{ color: colors.text3, fontSize: 9 }}>{label}</p>
      <p style={{ color, fontSize: 12, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof BarChart3;
  label: string;
  onClick: () => void;
}) {
  const colors = useThemeColors();
  return (
    <TrCard as="button" hover className="p-3 flex items-center gap-2" onClick={onClick}>
      <Icon size={16} color="#3B82F6" />
      <span style={{ color: colors.text1, fontSize: 11, fontWeight: 600 }}>{label}</span>
    </TrCard>
  );
}
