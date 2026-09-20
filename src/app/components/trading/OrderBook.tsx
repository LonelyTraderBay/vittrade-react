import React, { useMemo, memo } from 'react';
import { generateOrderBook } from '../../data/mockData';
import { useThemeColors } from '../../hooks/useThemeColors';
import { fmtAbsPct } from '../../data/formatNumber';

interface OrderBookProps {
  price: number;
  change24h: number;
}

function fmt(v: number): string {
  if (v > 100) return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v > 1) return v.toFixed(4);
  return v.toFixed(6);
}

function fmtAmt(v: number): string {
  if (v < 0.001) return v.toFixed(6);
  return v.toFixed(4);
}

export const OrderBook = memo(function OrderBook({ price, change24h }: OrderBookProps) {
  const c = useThemeColors();
  const { asks, bids } = useMemo(() => generateOrderBook(price), [price]);
  const isPositive = change24h >= 0;

  return (
    <div className="flex flex-col" style={{ fontFamily: "'SF Mono', monospace" }}>
      {/* Headers */}
      <div className="flex justify-between px-3 py-2" style={{ borderBottom: `1px solid ${c.divider}` }}>
        {['Giá (USDT)', 'KL (BTC)', 'Tổng'].map((h, i) => (
          <span key={h} style={{ color: c.text3, fontSize: 11, fontWeight: 600, textAlign: i === 2 ? 'right' : i === 0 ? 'left' : 'right', flex: 1 }}>{h}</span>
        ))}
      </div>

      {/* Asks (sell orders) — top, red */}
      <div className="flex flex-col-reverse">
        {asks.slice(0, 8).map((ask, i) => (
          <div key={`ask-${ask.price}`} className="flex justify-between items-center px-3 relative" style={{ height: 26 }}>
            <div
              className="absolute right-0 top-0 bottom-0"
              style={{ width: `${ask.depth * 40}%`, background: 'rgba(239,68,68,0.08)' }}
            />
            <span style={{ color: '#EF4444', fontSize: 12, flex: 1, position: 'relative' }}>{fmt(ask.price)}</span>
            <span style={{ color: c.text2, fontSize: 12, flex: 1, textAlign: 'right', position: 'relative' }}>{fmtAmt(ask.amount)}</span>
            <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'right', position: 'relative' }}>{(ask.total).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Spread / Last price */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ background: c.hoverBg, borderTop: `1px solid ${c.divider}`, borderBottom: `1px solid ${c.divider}` }}
      >
        <span style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 18, fontWeight: 700 }}>
          {fmt(price)}
        </span>
        <span style={{ color: c.text3, fontSize: 11 }}>
          ≈ ${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </span>
        <span style={{ color: isPositive ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: 600 }}>
          {isPositive ? '↑' : '↓'} {fmtAbsPct(change24h)}
        </span>
      </div>

      {/* Bids (buy orders) — bottom, green */}
      <div>
        {bids.slice(0, 8).map((bid, i) => (
          <div key={`bid-${bid.price}`} className="flex justify-between items-center px-3 relative" style={{ height: 26 }}>
            <div
              className="absolute right-0 top-0 bottom-0"
              style={{ width: `${bid.depth * 40}%`, background: 'rgba(16,185,129,0.08)' }}
            />
            <span style={{ color: '#10B981', fontSize: 12, flex: 1, position: 'relative' }}>{fmt(bid.price)}</span>
            <span style={{ color: c.text2, fontSize: 12, flex: 1, textAlign: 'right', position: 'relative' }}>{fmtAmt(bid.amount)}</span>
            <span style={{ color: c.text3, fontSize: 11, flex: 1, textAlign: 'right', position: 'relative' }}>{(bid.total).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
});