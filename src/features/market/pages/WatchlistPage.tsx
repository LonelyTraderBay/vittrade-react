import { useMemo, useRef, useState } from 'react';
import { Search, Star, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { SparklineChart } from '@/shared/ui/charts/SparklineChart';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useAuth } from '@/shared/session/useAuth';
import { fmtPct, fmtPrice, fmtUsd } from '@/shared/lib/formatNumber';
import {
  useMarketPairsQuery,
  useMarketWatchlistDeleteMutation,
  useMarketWatchlistQuery,
  useMarketWatchlistUpdateMutation,
} from '@/features/market';
import { clearMutationAttempt, getMutationAttemptKey } from '../lib/mutation-attempts';

export function WatchlistPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { hasPermission, isAuthenticated, user } = useAuth();
  const canManageWatchlist =
    hasPermission('market:write') || hasPermission('market:watchlist:write');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const mutationAttempts = useRef(new Map<string, { signature: string; key: string }>());
  const pairsQuery = useMarketPairsQuery();
  const watchlistQuery = useMarketWatchlistQuery({
    enabled: isAuthenticated && Boolean(user?.id),
    userId: user?.id,
  });
  const updateMutation = useMarketWatchlistUpdateMutation();
  const deleteMutation = useMarketWatchlistDeleteMutation();

  const entries = useMemo(() => {
    const pairMap = new Map((pairsQuery.data?.items ?? []).map((pair) => [pair.id, pair]));
    const normalizedSearch = search.trim().toLowerCase();
    return (watchlistQuery.data?.items ?? [])
      .map((entry) => ({ entry, pair: pairMap.get(entry.pairId) }))
      .filter(({ pair }) => Boolean(pair))
      .filter(({ pair }) => {
        if (!normalizedSearch || !pair) return true;
        return (
          pair.symbol.toLowerCase().includes(normalizedSearch) ||
          pair.baseAsset.toLowerCase().includes(normalizedSearch)
        );
      });
  }, [pairsQuery.data?.items, search, watchlistQuery.data?.items]);

  const handleRemove = async (id: string) => {
    if (!canManageWatchlist) return;
    const signature = JSON.stringify(['delete', id]);
    const key = getMutationAttemptKey(mutationAttempts.current, id, signature, 'watchlist-delete');
    setActionError(null);
    try {
      await deleteMutation.mutateAsync({ id, idempotencyKey: key });
      clearMutationAttempt(mutationAttempts.current, id, signature);
    } catch {
      setActionError('Không thể xóa cặp khỏi danh sách theo dõi. Vui lòng thử lại.');
    }
  };

  const handleNote = async (id: string, currentNote?: string) => {
    if (!canManageWatchlist) return;
    const note = window.prompt('Nhập ghi chú:', currentNote ?? '');
    if (note === null) return;
    const request = { note: note.trim() };
    const signature = JSON.stringify(['update', id, request]);
    const key = getMutationAttemptKey(mutationAttempts.current, id, signature, 'watchlist-update');
    setActionError(null);
    try {
      await updateMutation.mutateAsync({ id, request, idempotencyKey: key });
      clearMutationAttempt(mutationAttempts.current, id, signature);
    } catch {
      setActionError('Không thể lưu ghi chú. Vui lòng thử lại.');
    }
  };

  if (pairsQuery.isPending || watchlistQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Danh sách theo dõi" subtitle="Markets" back />
        <p className="px-5 py-8" style={{ color: colors.text2 }}>
          Đang tải danh sách theo dõi…
        </p>
      </PageLayout>
    );
  }

  if (pairsQuery.isError || watchlistQuery.isError) {
    return (
      <PageLayout>
        <Header title="Danh sách theo dõi" subtitle="Markets" back />
        <ErrorState
          onAction={() => {
            void pairsQuery.refetch();
            void watchlistQuery.refetch();
          }}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Header title="Danh sách theo dõi" subtitle="Theo dõi · Markets" back />
      {!canManageWatchlist && (
        <p role="alert" className="px-5 py-2" style={{ color: colors.text2, fontSize: 12 }}>
          Market watchlist is read-only for this session.
        </p>
      )}
      {actionError && (
        <p role="alert" className="px-5 py-2" style={{ color: colors.error, fontSize: 12 }}>
          {actionError}
        </p>
      )}
      <div
        className="px-5 py-3"
        style={{ background: colors.surface, borderBottom: `1px solid ${colors.divider}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl"
            style={{ background: colors.searchBg, border: `1px solid ${colors.searchBorder}` }}
          >
            <Search size={16} color={colors.text2} />
            <input
              type="search"
              placeholder="Tìm cặp giao dịch…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{ color: colors.text1, fontSize: 13 }}
            />
          </div>
          <button
            onClick={() => navigate(`${prefix}/markets`)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#3B82F6' }}
            aria-label="Thêm cặp giao dịch"
          >
            <span style={{ color: '#fff', fontSize: 22 }}>+</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Star size={14} color="#F59E0B" fill="#F59E0B" />
          <span style={{ color: colors.text2, fontSize: 12 }}>
            {watchlistQuery.data.items.length} cặp đang theo dõi
          </span>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Star size={48} color={colors.borderSolid} />
          <p style={{ color: colors.text3, fontSize: 13 }}>
            {search ? 'Không tìm thấy cặp nào' : 'Chưa có cặp trong danh sách theo dõi'}
          </p>
          {!search && (
            <button
              onClick={() => navigate(`${prefix}/markets`)}
              className="px-4 py-2 rounded-xl"
              style={{ background: '#3B82F6', color: '#fff', fontSize: 13 }}
            >
              Thêm cặp giao dịch
            </button>
          )}
        </div>
      ) : (
        <div className="px-5 py-3">
          {entries.map(({ entry, pair }) => {
            if (!pair) return null;
            const positive = pair.change24h >= 0;
            return (
              <TrCard key={entry.id} className="mb-3 p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${pair.logoColor}22` }}
                  >
                    <span style={{ color: pair.logoColor, fontSize: 11, fontWeight: 700 }}>
                      {pair.baseAsset.slice(0, 3)}
                    </span>
                  </button>
                  <button
                    onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p style={{ color: colors.text1, fontSize: 14, fontWeight: 700 }}>
                      {pair.baseAsset}
                    </p>
                    <p style={{ color: colors.text3, fontSize: 11 }}>{pair.symbol}</p>
                  </button>
                  <div className="text-right">
                    <p
                      style={{
                        color: colors.text1,
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      ${fmtPrice(pair.price)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      {positive ? (
                        <TrendingUp size={13} color="#10B981" />
                      ) : (
                        <TrendingDown size={13} color="#EF4444" />
                      )}
                      <span style={{ color: positive ? '#10B981' : '#EF4444', fontSize: 11 }}>
                        {fmtPct(pair.change24h)}
                      </span>
                    </div>
                  </div>
                </div>
                <SparklineChart
                  data={pair.sparklineData}
                  isPositive={positive}
                  width={280}
                  height={40}
                />
                <div
                  className="grid grid-cols-2 gap-3 mb-3 pb-3"
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                >
                  <div>
                    <p style={{ color: colors.text3, fontSize: 11 }}>24h High</p>
                    <p style={{ color: '#10B981', fontSize: 12, fontFamily: 'monospace' }}>
                      {fmtUsd(pair.high24h)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: colors.text3, fontSize: 11 }}>24h Low</p>
                    <p style={{ color: '#EF4444', fontSize: 12, fontFamily: 'monospace' }}>
                      {fmtUsd(pair.low24h)}
                    </p>
                  </div>
                </div>
                {entry.note && (
                  <p
                    className="rounded-lg px-3 py-2 mb-3"
                    style={{ background: 'rgba(59,130,246,0.05)', color: '#3B82F6', fontSize: 12 }}
                  >
                    📝 {entry.note}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`${prefix}/trade/${pair.id}`)}
                    className="flex-1 h-9 rounded-xl font-semibold"
                    style={{ background: '#3B82F6', color: '#fff', fontSize: 13 }}
                  >
                    Giao dịch
                  </button>
                  <button
                    onClick={() => handleNote(entry.id, entry.note)}
                    disabled={!canManageWatchlist || updateMutation.isPending}
                    className="h-9 px-3 rounded-xl font-semibold"
                    style={{ background: colors.surface2, color: colors.text2, fontSize: 13 }}
                  >
                    {entry.note ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                  </button>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    disabled={!canManageWatchlist || deleteMutation.isPending}
                    className="h-9 w-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)' }}
                    aria-label="Xóa khỏi danh sách theo dõi"
                  >
                    <Trash2 size={14} color="#EF4444" />
                  </button>
                </div>
              </TrCard>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
