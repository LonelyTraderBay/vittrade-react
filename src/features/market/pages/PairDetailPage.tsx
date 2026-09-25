import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { SparklineChart } from '@/shared/ui/charts/SparklineChart';
import { TrCard } from '@/shared/ui/TrCard';
import { fmtCompact, fmtPct, fmtPrice } from '@/shared/lib/formatNumber';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { useActionToast } from '@/shared/hooks/useActionToast';
import {
  useMarketOrderBookQuery,
  useMarketPairQuery,
  useMarketRecentTradesQuery,
  useMarketWatchlistCreateMutation,
  useMarketWatchlistDeleteMutation,
  useMarketWatchlistQuery,
} from '@/features/market';
import { clearMutationAttempt, getMutationAttemptKey } from '../lib/mutation-attempts';

type DetailTab = 'chart' | 'orderbook' | 'trades';

export function PairDetailPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { pairId = '' } = useParams();
  const { isAuthenticated, user, hasPermission } = useAuth();
  const actionToast = useActionToast();
  const [tab, setTab] = useState<DetailTab>('chart');
  const watchlistAttempts = useRef(new Map<string, { signature: string; key: string }>());
  const pairQuery = useMarketPairQuery(pairId);
  const orderBookQuery = useMarketOrderBookQuery(pairId);
  const tradesQuery = useMarketRecentTradesQuery(pairId);
  const watchlistEnabled = isAuthenticated && Boolean(user?.id);
  const watchlistQuery = useMarketWatchlistQuery({ enabled: watchlistEnabled, userId: user?.id });
  const createWatchlistMutation = useMarketWatchlistCreateMutation();
  const deleteWatchlistMutation = useMarketWatchlistDeleteMutation();
  const canManageWatchlist =
    hasPermission('market:write') || hasPermission('market:watchlist:write');

  if (pairQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Market" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải dữ liệu thị trường…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (pairQuery.isError || !pairQuery.data) {
    return (
      <PageLayout>
        <Header title="Market" back />
        <ErrorState onAction={() => void pairQuery.refetch()} />
      </PageLayout>
    );
  }

  const pair = pairQuery.data;
  const positive = pair.change24h >= 0;
  const watchlistItem = watchlistEnabled
    ? watchlistQuery.data?.items.find((item) => item.pairId === pair.id)
    : undefined;
  const isFavorite = Boolean(watchlistItem);
  const favoriteMutationPending =
    createWatchlistMutation.isPending || deleteWatchlistMutation.isPending;
  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      actionToast.info('Vui lòng đăng nhập để lưu cặp giao dịch theo dõi.', {
        haptic: 'selection',
      });
      navigate(`${prefix}/login`, { state: { from: `${prefix}/pair/${pair.id}` } });
      return;
    }
    if (!canManageWatchlist) {
      actionToast.error('Market watchlist permission is required to change favorites.');
      return;
    }
    if (watchlistQuery.isPending || watchlistQuery.isError) return;

    try {
      if (watchlistItem) {
        const signature = JSON.stringify(['delete', pair.id, watchlistItem.id]);
        const key = getMutationAttemptKey(
          watchlistAttempts.current,
          pair.id,
          signature,
          'market-watchlist',
        );
        await deleteWatchlistMutation.mutateAsync({
          id: watchlistItem.id,
          idempotencyKey: key,
        });
        clearMutationAttempt(watchlistAttempts.current, pair.id, signature);
        actionToast.info(`Đã bỏ ${pair.baseAsset} khỏi danh sách theo dõi.`, {
          haptic: 'selection',
        });
      } else {
        const signature = JSON.stringify(['create', pair.id]);
        const key = getMutationAttemptKey(
          watchlistAttempts.current,
          pair.id,
          signature,
          'market-watchlist',
        );
        await createWatchlistMutation.mutateAsync({
          request: { pairId: pair.id },
          idempotencyKey: key,
        });
        clearMutationAttempt(watchlistAttempts.current, pair.id, signature);
        actionToast.info(`Đã thêm ${pair.baseAsset} vào danh sách theo dõi.`, {
          haptic: 'selection',
        });
      }
    } catch (error) {
      actionToast.error(
        error instanceof Error ? error.message : 'Không thể cập nhật danh sách theo dõi.',
      );
    }
  };
  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'chart', label: 'Biểu đồ' },
    { id: 'orderbook', label: 'Sổ lệnh' },
    { id: 'trades', label: 'Giao dịch' },
  ];

  return (
    <PageLayout>
      <Header
        title={pair.symbol}
        subtitle="Market data"
        back
        left={
          <button type="button" onClick={() => navigate(-1)} aria-label="Quay lại">
            <ChevronLeft size={20} color={colors.text2} />
          </button>
        }
        right={
          <button
            type="button"
            aria-label={isFavorite ? 'Bỏ theo dõi cặp giao dịch' : 'Theo dõi cặp giao dịch'}
            aria-pressed={isFavorite}
            disabled={
              favoriteMutationPending ||
              (isAuthenticated &&
                (!canManageWatchlist || watchlistQuery.isPending || watchlistQuery.isError))
            }
            onClick={() => void toggleFavorite()}
          >
            <Star
              size={20}
              color={isFavorite ? '#F59E0B' : colors.text3}
              fill={isFavorite ? '#F59E0B' : 'none'}
            />
          </button>
        }
      />
      <PageContent gap="default">
        {isAuthenticated && watchlistQuery.isError && (
          <p role="alert" style={{ color: colors.text2, fontSize: 12 }}>
            Không thể tải watchlist; thao tác theo dõi đang tạm khóa.{' '}
            <button type="button" onClick={() => void watchlistQuery.refetch()}>
              Thử tải lại
            </button>
          </p>
        )}
        <TrCard className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p style={{ color: colors.text3, fontSize: 12 }}>
                {pair.baseAsset}/{pair.quoteAsset}
              </p>
              <p
                style={{
                  color: colors.text1,
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                ${fmtPrice(pair.price)}
              </p>
            </div>
            <div className="text-right">
              <p style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700 }}>
                {fmtPct(pair.change24h)}
              </p>
              <p style={{ color: colors.text3, fontSize: 11 }}>24 giờ</p>
            </div>
          </div>
          <div className="mt-4">
            <SparklineChart
              data={pair.sparklineData}
              isPositive={positive}
              width={320}
              height={150}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <p style={{ color: colors.text3, fontSize: 11 }}>Cao nhất 24h</p>
              <p style={{ color: '#10B981', fontSize: 13, fontFamily: 'monospace' }}>
                ${fmtPrice(pair.high24h)}
              </p>
            </div>
            <div>
              <p style={{ color: colors.text3, fontSize: 11 }}>Thấp nhất 24h</p>
              <p style={{ color: '#EF4444', fontSize: 13, fontFamily: 'monospace' }}>
                ${fmtPrice(pair.low24h)}
              </p>
            </div>
            <div>
              <p style={{ color: colors.text3, fontSize: 11 }}>Khối lượng 24h</p>
              <p style={{ color: colors.text1, fontSize: 13, fontFamily: 'monospace' }}>
                {fmtCompact(pair.volume24h)}
              </p>
            </div>
            <div>
              <p style={{ color: colors.text3, fontSize: 11 }}>Market cap</p>
              <p style={{ color: colors.text1, fontSize: 13, fontFamily: 'monospace' }}>
                {fmtCompact(pair.marketCap)}
              </p>
            </div>
          </div>
        </TrCard>
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className="py-2 rounded-xl text-xs font-semibold"
              style={{
                background: tab === item.id ? colors.chipActiveBg : colors.chipBg,
                color: tab === item.id ? colors.chipActiveText : colors.chipText,
                border: `1px solid ${tab === item.id ? colors.chipActiveBorder : colors.chipBorder}`,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === 'chart' && (
          <TrCard className="p-4">
            <p style={{ color: colors.text2, fontSize: 13, fontWeight: 600 }}>Dữ liệu thị trường</p>
            <p style={{ color: colors.text3, fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
              Biểu đồ và chỉ số được lấy từ market data contract. WebSocket realtime sẽ được bật khi
              backend streaming contract hoàn tất.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => navigate(`${prefix}/trade/${pair.id}`)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ background: '#10B981', color: '#fff' }}
              >
                Mua
              </button>
              <button
                type="button"
                onClick={() => navigate(`${prefix}/trade/${pair.id}`)}
                className="flex-1 py-3 rounded-xl font-semibold"
                style={{ background: '#EF4444', color: '#fff' }}
              >
                Bán
              </button>
            </div>
          </TrCard>
        )}
        {tab === 'orderbook' && <OrderBookState query={orderBookQuery} colors={colors} />}
        {tab === 'trades' && <TradesState query={tradesQuery} colors={colors} />}
      </PageContent>
    </PageLayout>
  );
}

function OrderBookState({
  query,
  colors,
}: {
  query: ReturnType<typeof useMarketOrderBookQuery>;
  colors: ReturnType<typeof useThemeColors>;
}) {
  if (query.isPending)
    return (
      <TrCard className="p-4">
        <p style={{ color: colors.text2 }}>Đang tải sổ lệnh…</p>
      </TrCard>
    );
  if (query.isError) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <TrCard className="p-4">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <span style={{ color: colors.text3, fontSize: 11 }}>Giá</span>
        <span className="text-right" style={{ color: colors.text3, fontSize: 11 }}>
          Số lượng
        </span>
        <span className="text-right" style={{ color: colors.text3, fontSize: 11 }}>
          Tổng
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {query.data.asks
          .slice()
          .reverse()
          .map((row) => (
            <BookRow key={`ask-${row.price}`} row={row} color="#EF4444" colors={colors} />
          ))}
      </div>
      <div className="my-3" style={{ borderTop: `1px solid ${colors.divider}` }} />
      <div className="flex flex-col gap-1">
        {query.data.bids.map((row) => (
          <BookRow key={`bid-${row.price}`} row={row} color="#10B981" colors={colors} />
        ))}
      </div>
    </TrCard>
  );
}

function BookRow({
  row,
  color,
  colors,
}: {
  row: { price: number; amount: number; total: number; depth: number };
  color: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <div className="relative grid grid-cols-3 gap-2 py-1">
      <div
        className="absolute inset-y-0 right-0 opacity-10"
        style={{ width: `${row.depth * 100}%`, background: color }}
      />
      <span className="relative" style={{ color, fontSize: 11, fontFamily: 'monospace' }}>
        {fmtPrice(row.price)}
      </span>
      <span
        className="relative text-right"
        style={{ color: colors.text2, fontSize: 11, fontFamily: 'monospace' }}
      >
        {row.amount.toFixed(6)}
      </span>
      <span
        className="relative text-right"
        style={{ color: colors.text2, fontSize: 11, fontFamily: 'monospace' }}
      >
        {fmtCompact(row.total)}
      </span>
    </div>
  );
}

function TradesState({
  query,
  colors,
}: {
  query: ReturnType<typeof useMarketRecentTradesQuery>;
  colors: ReturnType<typeof useThemeColors>;
}) {
  if (query.isPending)
    return (
      <TrCard className="p-4">
        <p style={{ color: colors.text2 }}>Đang tải giao dịch…</p>
      </TrCard>
    );
  if (query.isError) return <ErrorState onAction={() => void query.refetch()} />;
  return (
    <TrCard className="p-4">
      <div className="grid grid-cols-3 gap-2 mb-2">
        <span style={{ color: colors.text3, fontSize: 11 }}>Giá</span>
        <span className="text-right" style={{ color: colors.text3, fontSize: 11 }}>
          Số lượng
        </span>
        <span className="text-right" style={{ color: colors.text3, fontSize: 11 }}>
          Thời gian
        </span>
      </div>
      {query.data.items.map((trade) => (
        <div key={trade.id} className="grid grid-cols-3 gap-2 py-1.5">
          <span
            style={{
              color: trade.side === 'buy' ? '#10B981' : '#EF4444',
              fontSize: 11,
              fontFamily: 'monospace',
            }}
          >
            {trade.side === 'buy' ? (
              <ArrowUp size={11} className="inline" />
            ) : (
              <ArrowDown size={11} className="inline" />
            )}{' '}
            {fmtPrice(trade.price)}
          </span>
          <span
            className="text-right"
            style={{ color: colors.text2, fontSize: 11, fontFamily: 'monospace' }}
          >
            {trade.amount.toFixed(6)}
          </span>
          <span className="text-right" style={{ color: colors.text3, fontSize: 10 }}>
            {new Date(trade.time).toLocaleTimeString('vi-VN')}
          </span>
        </div>
      ))}
    </TrCard>
  );
}
