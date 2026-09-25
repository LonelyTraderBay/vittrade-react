import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/shared/session/useAuth';
import { DiscoverMoreSection } from '@/features/market/components/DiscoverMoreSection';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { useActionToast } from '@/shared/hooks/useActionToast';
import { useRefresh } from '@/shared/hooks/useRefresh';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { TOAST } from '@/shared/constants/toastMessages';
import {
  type MarketPair,
  useMarketPairsQuery,
  useMarketWatchlistCreateMutation,
  useMarketWatchlistDeleteMutation,
  useMarketWatchlistQuery,
} from '@/features/market';
import {
  MarketListHeader,
  MarketPairsList,
  MarketTopMovers,
} from '../components/MarketListSections';
import { clearMutationAttempt, getMutationAttemptKey } from '../lib/mutation-attempts';

export function MarketListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sort, setSort] = useState('default');
  const [showSort, setShowSort] = useState(false);
  const [pairs, setPairs] = useState<MarketPair[]>([]);
  const watchlistAttempts = useRef(new Map<string, { signature: string; key: string }>());
  const {
    data: marketData,
    isLoading: isMarketLoading,
    isError: isMarketError,
    refetch: refetchMarketPairs,
  } = useMarketPairsQuery();
  const { isAuthenticated, user, hasPermission } = useAuth();
  const canManageWatchlist =
    hasPermission('market:write') || hasPermission('market:watchlist:write');
  const watchlistEnabled = isAuthenticated && Boolean(user?.id);
  const watchlistQuery = useMarketWatchlistQuery({ enabled: watchlistEnabled, userId: user?.id });
  const createWatchlistMutation = useMarketWatchlistCreateMutation();
  const deleteWatchlistMutation = useMarketWatchlistDeleteMutation();
  const actionToast = useActionToast();
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();

  useEffect(() => {
    if (marketData?.items) setPairs(marketData.items);
  }, [marketData]);

  const toggleFavorite = async (id: string) => {
    const pair = pairs.find((item) => item.id === id);
    if (!pair) return;
    if (!isAuthenticated) {
      actionToast.info('Vui lòng đăng nhập để lưu cặp giao dịch theo dõi.', {
        haptic: 'selection',
      });
      navigate(`${routePrefix}/login`, { state: { from: `${routePrefix}/markets` } });
      return;
    }
    if (!canManageWatchlist) {
      actionToast.error('Market watchlist permission is required to change favorites.');
      return;
    }
    if (watchlistQuery.isPending) return;
    if (watchlistQuery.isError) {
      actionToast.error('Không thể xác nhận danh sách theo dõi. Tải lại rồi thử lại.');
      return;
    }
    const watchlistItem = watchlistQuery.data?.items.find((item) => item.pairId === id);
    try {
      if (watchlistItem) {
        const signature = JSON.stringify(['delete', id, watchlistItem.id]);
        const key = getMutationAttemptKey(
          watchlistAttempts.current,
          id,
          signature,
          'market-watchlist',
        );
        await deleteWatchlistMutation.mutateAsync({
          id: watchlistItem.id,
          idempotencyKey: key,
        });
        clearMutationAttempt(watchlistAttempts.current, id, signature);
        actionToast.info(TOAST.FAVORITE.removed(pair.baseAsset), { haptic: 'selection' });
      } else {
        const signature = JSON.stringify(['create', id]);
        const key = getMutationAttemptKey(
          watchlistAttempts.current,
          id,
          signature,
          'market-watchlist',
        );
        await createWatchlistMutation.mutateAsync({
          request: { pairId: id },
          idempotencyKey: key,
        });
        clearMutationAttempt(watchlistAttempts.current, id, signature);
        actionToast.info(TOAST.FAVORITE.added(pair.baseAsset), { haptic: 'selection' });
      }
    } catch (error) {
      actionToast.error(
        error instanceof Error ? error.message : 'Không thể cập nhật danh sách theo dõi.',
      );
    }
  };

  const filtered = useMemo(() => {
    let list = pairs;
    if (search) {
      list = list.filter(
        (pair) =>
          pair.symbol.toLowerCase().includes(search.toLowerCase()) ||
          pair.baseAsset.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (category !== 'Tất cả') list = list.filter((pair) => pair.category === category);
    if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
    if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'change_desc') list = [...list].sort((a, b) => b.change24h - a.change24h);
    if (sort === 'change_asc') list = [...list].sort((a, b) => a.change24h - b.change24h);
    if (sort === 'volume_desc') list = [...list].sort((a, b) => b.volume24h - a.volume24h);
    return list;
  }, [category, pairs, search, sort]);
  const favoritePairIds = useMemo(
    () => new Set(watchlistEnabled ? watchlistQuery.data?.items.map((item) => item.pairId) : []),
    [watchlistEnabled, watchlistQuery.data?.items],
  );

  const scroll = useInfiniteScroll({
    data: filtered,
    pageSize: 8,
    loadDelay: 350,
    resetKey: `${search}|${category}|${sort}`,
  });
  const { refresh, lastRefreshedLabel, refreshCount } = useRefresh({
    onEnd: () => void refetchMarketPairs(),
  });

  return (
    <PageLayout>
      <PageContent padding="compact" gap="default">
        {isAuthenticated && !canManageWatchlist && (
          <p role="alert" style={{ color: c.text2, fontSize: 12 }}>
            Market watchlist is read-only for this session.
          </p>
        )}
        {isAuthenticated && watchlistQuery.isError && (
          <p role="alert" style={{ color: c.text2, fontSize: 12 }}>
            Không thể tải watchlist; thao tác yêu thích đang tạm khóa.{' '}
            <button type="button" onClick={() => void watchlistQuery.refetch()}>
              Thử tải lại
            </button>
          </p>
        )}
        <MarketListHeader
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          sort={sort}
          setSort={setSort}
          showSort={showSort}
          setShowSort={setShowSort}
        />
        <MarketTopMovers pairs={pairs} search={search} category={category} />
        <MarketPairsList
          visiblePairs={scroll.items}
          favoritePairIds={favoritePairIds}
          onFavoriteToggle={toggleFavorite}
          favoriteDisabled={
            (isAuthenticated && !canManageWatchlist) ||
            (watchlistEnabled && (watchlistQuery.isPending || watchlistQuery.isError)) ||
            createWatchlistMutation.isPending ||
            deleteWatchlistMutation.isPending
          }
          isMarketLoading={isMarketLoading}
          isInitialLoading={scroll.isInitialLoading}
          isMarketError={isMarketError}
          filteredLength={filtered.length}
          search={search}
          lastRefreshedLabel={lastRefreshedLabel}
          refreshCount={refreshCount}
          refresh={refresh}
          refetchMarketPairs={() => void refetchMarketPairs()}
          clearFilters={() => {
            setSearch('');
            setCategory('Tất cả');
            setSort('default');
          }}
          isLoadingMore={scroll.isLoadingMore}
          hasMore={scroll.hasMore}
          visibleCount={scroll.visibleCount}
          totalCount={scroll.totalCount}
          sentinelRef={scroll.sentinelRef}
        />
        <DiscoverMoreSection />
      </PageContent>
    </PageLayout>
  );
}
