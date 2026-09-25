/**
 * ══════════════════════════════════════════════════════════════════
 *  RECENT TRADES — Sprint 2A: Time & Sales Feed
 * ══════════════════════════════════════════════════════════════════
 */

import { memo } from 'react';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useMarketRecentTradesQuery } from '@/features/market';

interface RecentTradesProps {
  pairId: string;
  maxRows?: number;
}

function fmt(v: number): string {
  if (v > 100)
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v > 1) return v.toFixed(4);
  return v.toFixed(6);
}

export const RecentTrades = memo(function RecentTrades({
  pairId,
  maxRows = 20,
}: RecentTradesProps) {
  const c = useThemeColors();
  const tradesQuery = useMarketRecentTradesQuery(pairId);

  if (tradesQuery.isPending) {
    return (
      <p style={{ color: c.text3, fontSize: 12, padding: '16px 12px' }}>
        Äang táº£i giao dá»‹châ€¦
      </p>
    );
  }

  if (tradesQuery.isError || !tradesQuery.data) {
    return (
      <div className="flex flex-col items-center gap-2 p-4">
        <p style={{ color: '#EF4444', fontSize: 12 }}>KhÃ´ng táº£i Ä‘Æ°á»£c giao dá»‹ch</p>
        <button
          onClick={() => void tradesQuery.refetch()}
          className="rounded-lg px-3 py-1.5"
          style={{ background: c.surface2, color: c.text2, fontSize: 12 }}
        >
          Thá»­ láº¡i
        </button>
      </div>
    );
  }

  const trades = tradesQuery.data.items;

  return (
    <div className="flex flex-col" style={{ fontFamily: "'SF Mono', monospace" }}>
      {/* Headers */}
      <div
        className="flex justify-between px-3 py-1.5"
        style={{ borderBottom: `1px solid ${c.divider}` }}
      >
        {['Giá (USDT)', 'KL', 'Thời gian'].map((h, i) => (
          <span
            key={h}
            style={{
              color: c.text3,
              fontSize: 11,
              textAlign: i === 2 ? 'right' : i === 0 ? 'left' : 'right',
              flex: 1,
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Trades */}
      {trades.slice(0, maxRows).map((trade) => (
        <div
          key={trade.id}
          className="flex justify-between items-center px-3"
          style={{ height: 24 }}
        >
          <span
            style={{
              color: trade.side === 'buy' ? '#10B981' : '#EF4444',
              fontSize: 11,
              fontWeight: 500,
              flex: 1,
              textAlign: 'left',
            }}
          >
            {fmt(trade.price)}
          </span>
          <span style={{ color: c.text1, fontSize: 11, flex: 1, textAlign: 'right' }}>
            {trade.amount.toFixed(4)}
          </span>
          <span style={{ color: c.text3, fontSize: 10, flex: 1, textAlign: 'right' }}>
            {new Date(trade.time).toLocaleTimeString('vi-VN')}
          </span>
        </div>
      ))}
    </div>
  );
});
