import { useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Layers } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { ErrorState } from '@/shared/ui/ErrorState';
import { Header } from '@/shared/ui/layout/Header';
import { PageContent } from '@/shared/ui/layout/PageContent';
import { PageLayout } from '@/shared/ui/layout/PageLayout';
import { TrCard } from '@/shared/ui/TrCard';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { fmtCompact, fmtPrice } from '@/shared/lib/formatNumber';
import {
  useMarketOrderBookQuery,
  useMarketPairQuery,
  useMarketPairsQuery,
  type MarketOrderBookEntry,
} from '@/features/market';

type DepthTab = 'depth' | 'orderbook' | 'whales';

export function MarketDepthPage() {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const prefix = useRoutePrefix();
  const { pairId = '' } = useParams();
  const [tab, setTab] = useState<DepthTab>('depth');
  const pairsQuery = useMarketPairsQuery({ limit: 1 });
  const selectedPairId = pairId || pairsQuery.data?.items[0]?.id || '';
  const pairQuery = useMarketPairQuery(selectedPairId);
  const orderBookQuery = useMarketOrderBookQuery(selectedPairId);

  if ((!pairId && pairsQuery.isPending) || pairQuery.isPending || orderBookQuery.isPending) {
    return (
      <PageLayout>
        <Header title="Market depth" back />
        <PageContent>
          <p style={{ color: colors.text2 }}>Đang tải dữ liệu độ sâu thị trường…</p>
        </PageContent>
      </PageLayout>
    );
  }

  if (!selectedPairId) {
    return (
      <PageLayout>
        <Header title="Market depth" back />
        <ErrorState onAction={() => void pairsQuery.refetch()} />
      </PageLayout>
    );
  }

  if (pairQuery.isError || !pairQuery.data) {
    return (
      <PageLayout>
        <Header title="Market depth" back />
        <ErrorState onAction={() => void pairQuery.refetch()} />
      </PageLayout>
    );
  }

  if (orderBookQuery.isError || !orderBookQuery.data) {
    return (
      <PageLayout>
        <Header title={`${pairQuery.data.baseAsset} Depth`} back />
        <ErrorState onAction={() => void orderBookQuery.refetch()} />
      </PageLayout>
    );
  }

  const pair = pairQuery.data;
  const orderBook = orderBookQuery.data;
  const asks = orderBook.asks.slice().sort((a, b) => a.price - b.price);
  const bids = orderBook.bids.slice().sort((a, b) => b.price - a.price);
  const askDepth = cumulativeDepth(asks);
  const bidDepth = cumulativeDepth(bids);
  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;
  const spread =
    bestAsk !== undefined && bestBid !== undefined ? Math.max(bestAsk - bestBid, 0) : null;
  const spreadPct =
    spread !== null && bestBid !== undefined && bestBid > 0 ? (spread / bestBid) * 100 : null;
  const maxDepth = Math.max(
    ...bidDepth.map((row) => row.total),
    ...askDepth.map((row) => row.total),
    1,
  );

  return (
    <PageLayout>
      <Header title={`${pair.baseAsset} Depth`} subtitle="Market data" back />
      <div
        className="flex gap-2 px-5 py-3"
        style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surface }}
      >
        {[
          { id: 'depth' as const, label: 'Depth chart' },
          { id: 'orderbook' as const, label: 'Order book' },
          { id: 'whales' as const, label: 'Whale alerts' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className="flex-1 rounded-xl py-2 text-xs font-semibold"
            aria-pressed={tab === item.id}
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
      <PageContent gap="default">
        <TrCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p style={{ color: colors.text1, fontSize: 16, fontWeight: 700 }}>{pair.symbol}</p>
              <p style={{ color: colors.text3, fontSize: 12 }}>
                {pair.change24h >= 0 ? (
                  <ArrowUpRight size={12} className="inline" />
                ) : (
                  <ArrowDownRight size={12} className="inline" />
                )}{' '}
                {pair.change24h.toFixed(2)}%
              </p>
            </div>
            <div className="text-right">
              <p
                style={{
                  color: colors.text1,
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                ${fmtPrice(pair.price)}
              </p>
              <button
                onClick={() => navigate(`${prefix}/trade/${pair.id}`)}
                className="mt-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: '#3B82F6', color: '#fff' }}
              >
                Giao dịch
              </button>
            </div>
          </div>
        </TrCard>

        {tab === 'whales' ? (
          <TrCard className="p-5">
            <AlertTriangle size={20} color="#F59E0B" />
            <p className="mt-3" style={{ color: colors.text1, fontWeight: 700 }}>
              Whale alert contract chưa khả dụng
            </p>
            <p className="mt-1" style={{ color: colors.text3, fontSize: 12, lineHeight: 1.6 }}>
              Backend cần cung cấp stream hoặc endpoint audit order lớn trước khi bật tính năng này.
            </p>
          </TrCard>
        ) : tab === 'orderbook' ? (
          <OrderBookTable asks={asks} bids={bids} colors={colors} />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <Metric
                label="Spread"
                value={spread === null ? '—' : `$${fmtPrice(spread)}`}
                sub={spreadPct === null ? 'Chưa đủ hai phía' : `${spreadPct.toFixed(4)}%`}
                colors={colors}
              />
              <Metric
                label="Bid depth"
                value={fmtCompact(bidDepth.at(-1)?.total ?? 0)}
                sub={pair.baseAsset}
                colors={colors}
                color="#10B981"
              />
              <Metric
                label="Ask depth"
                value={fmtCompact(askDepth.at(-1)?.total ?? 0)}
                sub={pair.baseAsset}
                colors={colors}
                color="#EF4444"
              />
            </div>
            <TrCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={16} color={colors.text2} />
                <p style={{ color: colors.text2, fontSize: 13, fontWeight: 700 }}>
                  Cumulative depth
                </p>
              </div>
              <div className="flex flex-col gap-1">
                {askDepth
                  .slice()
                  .reverse()
                  .map((row) => (
                    <DepthBar
                      key={`ask-${row.price}`}
                      row={row}
                      maxDepth={maxDepth}
                      color="#EF4444"
                      colors={colors}
                    />
                  ))}
                <div
                  className="my-2 flex items-center justify-between border-y py-2"
                  style={{ borderColor: colors.divider }}
                >
                  <span style={{ color: colors.text3, fontSize: 11 }}>Spread</span>
                  <span style={{ color: colors.text1, fontSize: 12, fontFamily: 'monospace' }}>
                    {spread === null ? 'Chưa đủ dữ liệu' : `$${fmtPrice(spread)}`}
                  </span>
                </div>
                {asks.length === 0 && (
                  <p role="status" style={{ color: colors.text3, fontSize: 11 }}>
                    Chưa có lệnh bán trong snapshot hiện tại.
                  </p>
                )}
                {bidDepth.map((row) => (
                  <DepthBar
                    key={`bid-${row.price}`}
                    row={row}
                    maxDepth={maxDepth}
                    color="#10B981"
                    colors={colors}
                  />
                ))}
                {bids.length === 0 && (
                  <p role="status" style={{ color: colors.text3, fontSize: 11 }}>
                    Chưa có lệnh mua trong snapshot hiện tại.
                  </p>
                )}
              </div>
            </TrCard>
          </>
        )}
      </PageContent>
    </PageLayout>
  );
}

function cumulativeDepth(rows: MarketOrderBookEntry[]) {
  let total = 0;
  return rows.map((row) => {
    total += row.amount;
    return { ...row, total };
  });
}

function Metric({
  label,
  value,
  sub,
  colors,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  colors: ReturnType<typeof useThemeColors>;
  color?: string;
}) {
  return (
    <TrCard className="p-3">
      <p style={{ color: colors.text3, fontSize: 11 }}>{label}</p>
      <p
        style={{
          color: color ?? colors.text1,
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </p>
      <p style={{ color: colors.text3, fontSize: 10 }}>{sub}</p>
    </TrCard>
  );
}

function DepthBar({
  row,
  maxDepth,
  color,
  colors,
}: {
  row: MarketOrderBookEntry & { total: number };
  maxDepth: number;
  color: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <div className="relative grid grid-cols-3 gap-2 py-1">
      <div
        className="absolute inset-y-0 right-0 opacity-10"
        style={{ width: `${(row.total / maxDepth) * 100}%`, background: color }}
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
        style={{ color: colors.text3, fontSize: 11, fontFamily: 'monospace' }}
      >
        {row.total.toFixed(6)}
      </span>
    </div>
  );
}

function OrderBookTable({
  asks,
  bids,
  colors,
}: {
  asks: MarketOrderBookEntry[];
  bids: MarketOrderBookEntry[];
  colors: ReturnType<typeof useThemeColors>;
}) {
  const maxDepth = Math.max(...asks.map((row) => row.total), ...bids.map((row) => row.total), 1);
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
      {asks.length === 0 && (
        <p role="status" style={{ color: colors.text3, fontSize: 12 }}>
          Chưa có lệnh bán trong snapshot hiện tại.
        </p>
      )}
      {asks.map((row) => (
        <DepthBar
          key={`ask-${row.price}`}
          row={{ ...row, total: row.total }}
          maxDepth={maxDepth}
          color="#EF4444"
          colors={colors}
        />
      ))}
      <div className="my-2" style={{ borderTop: `1px solid ${colors.divider}` }} />
      {bids.length === 0 && (
        <p role="status" style={{ color: colors.text3, fontSize: 12 }}>
          Chưa có lệnh mua trong snapshot hiện tại.
        </p>
      )}
      {bids.map((row) => (
        <DepthBar
          key={`bid-${row.price}`}
          row={{ ...row, total: row.total }}
          maxDepth={maxDepth}
          color="#10B981"
          colors={colors}
        />
      ))}
    </TrCard>
  );
}
