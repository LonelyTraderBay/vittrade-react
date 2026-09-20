/**
 * ══════════════════════════════════════════════════════════
 *  WEB MARKETS MOVERS PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/markets/movers
 *
 *  Top gainers & losers with:
 *  - Dual-column layout (gainers vs losers)
 *  - Real-time price changes
 *  - Volume indicators
 *  - Timeframe filters (1h, 24h, 7d)
 *  - Click to trade
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Flame,
  Snowflake,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface Mover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

const GAINERS_24H: Mover[] = [
  {
    symbol: 'PEPE',
    name: 'Pepe',
    price: 0.00000123,
    change: 45.67,
    volume24h: 450000000,
    high24h: 0.00000128,
    low24h: 0.00000084,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 142.5,
    change: 18.56,
    volume24h: 3200000000,
    high24h: 145.2,
    low24h: 120.3,
  },
  {
    symbol: 'ARB',
    name: 'Arbitrum',
    price: 1.85,
    change: 15.34,
    volume24h: 280000000,
    high24h: 1.92,
    low24h: 1.58,
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    price: 1.15,
    change: 12.89,
    volume24h: 890000000,
    high24h: 1.18,
    low24h: 1.01,
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 42.3,
    change: 11.45,
    volume24h: 540000000,
    high24h: 43.1,
    low24h: 37.8,
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    price: 18.75,
    change: 10.23,
    volume24h: 620000000,
    high24h: 19.2,
    low24h: 16.8,
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    price: 7.82,
    change: 9.67,
    volume24h: 380000000,
    high24h: 8.05,
    low24h: 7.05,
  },
  {
    symbol: 'ATOM',
    name: 'Cosmos',
    price: 11.45,
    change: 8.91,
    volume24h: 290000000,
    high24h: 11.82,
    low24h: 10.42,
  },
];

const LOSERS_24H: Mover[] = [
  {
    symbol: 'LUNA',
    name: 'Terra',
    price: 0.85,
    change: -15.67,
    volume24h: 120000000,
    high24h: 1.05,
    low24h: 0.82,
  },
  {
    symbol: 'FTM',
    name: 'Fantom',
    price: 0.62,
    change: -12.34,
    volume24h: 95000000,
    high24h: 0.72,
    low24h: 0.6,
  },
  {
    symbol: 'ALGO',
    name: 'Algorand',
    price: 0.28,
    change: -10.45,
    volume24h: 78000000,
    high24h: 0.32,
    low24h: 0.27,
  },
  {
    symbol: 'XTZ',
    name: 'Tezos',
    price: 1.15,
    change: -9.82,
    volume24h: 65000000,
    high24h: 1.29,
    low24h: 1.12,
  },
  {
    symbol: 'EGLD',
    name: 'MultiversX',
    price: 52.3,
    change: -8.67,
    volume24h: 48000000,
    high24h: 58.2,
    low24h: 51.5,
  },
  {
    symbol: 'ICP',
    name: 'Internet Computer',
    price: 8.45,
    change: -7.91,
    volume24h: 92000000,
    high24h: 9.28,
    low24h: 8.32,
  },
  {
    symbol: 'FLOW',
    name: 'Flow',
    price: 1.52,
    change: -7.23,
    volume24h: 42000000,
    high24h: 1.67,
    low24h: 1.48,
  },
  {
    symbol: 'SAND',
    name: 'The Sandbox',
    price: 0.58,
    change: -6.54,
    volume24h: 58000000,
    high24h: 0.63,
    low24h: 0.56,
  },
];

type Timeframe = '1h' | '24h' | '7d';

/* ═══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  if (price < 0.01) return price.toFixed(8);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
  return `$${(volume / 1e3).toFixed(2)}K`;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function MoverRow({ mover, rank, onClick }: { mover: Mover; rank: number; onClick: () => void }) {
  const c = useThemeColors();
  const isGainer = mover.change > 0;
  const changeColor = isGainer ? '#10B981' : '#EF4444';

  return (
    <div
      className="grid cursor-pointer transition-all hover:bg-opacity-50"
      style={{
        gridTemplateColumns: '40px 1fr 120px 100px 120px',
        padding: '0 20px',
        height: WEB_SPACING.rowDefault,
        borderBottom: `1px solid ${c.divider}`,
      }}
      onClick={onClick}
    >
      {/* Rank */}
      <div className="flex items-center">
        <span
          style={{
            fontSize: WEB_FONT.sm,
            fontWeight: 700,
            color: rank <= 3 ? c.primary : c.text3,
          }}
        >
          #{rank}
        </span>
      </div>

      {/* Pair */}
      <div className="flex items-center gap-3">
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            background: `linear-gradient(135deg, ${changeColor}40, ${changeColor}20)`,
          }}
        >
          <span style={{ fontSize: WEB_FONT.sm, fontWeight: 700, color: changeColor }}>
            {mover.symbol[0]}
          </span>
        </div>
        <div>
          <div style={{ fontSize: WEB_FONT.md, fontWeight: 700, color: c.text1 }}>
            {mover.symbol}/USDT
          </div>
          <div style={{ fontSize: WEB_FONT.xs, color: c.text3 }}>{mover.name}</div>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-end">
        <span
          style={{
            fontSize: WEB_FONT.md,
            fontWeight: 700,
            color: c.text1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ${formatPrice(mover.price)}
        </span>
      </div>

      {/* Change */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1">
          {isGainer ? (
            <ArrowUpRight size={WEB_ICON.sm} color={changeColor} />
          ) : (
            <ArrowDownRight size={WEB_ICON.sm} color={changeColor} />
          )}
          <span
            style={{
              fontSize: WEB_FONT.md,
              fontWeight: 700,
              color: changeColor,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {isGainer ? '+' : ''}
            {mover.change.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center justify-end">
        <span
          style={{
            fontSize: WEB_FONT.sm,
            fontWeight: 600,
            color: c.text2,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatVolume(mover.volume24h)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebMarketsMoversPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<Timeframe>('24h');

  const handlePairClick = (symbol: string) => {
    navigate(`/w/trade/${symbol.toLowerCase()}usdt`);
  };

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Top Movers"
        subtitle="Các cặp biến động mạnh nhất"
        back
        right={
          <div
            className="flex items-center rounded-xl p-1"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            {(['1h', '24h', '7d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className="rounded-lg transition-all"
                style={{
                  padding: '8px 20px',
                  background: timeframe === tf ? c.primary : 'transparent',
                  color: timeframe === tf ? '#fff' : c.text2,
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        }
      />
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: `${WEB_SPACING.cardRelaxed}px` }}>
        {/* ─── Stats Summary ─── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div
            className="rounded-2xl p-5"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame size={WEB_ICON.lg} color="#10B981" />
              <span style={{ fontSize: WEB_FONT.sm, color: c.text3, fontWeight: 600 }}>
                Top Gainer
              </span>
            </div>
            <div style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
              {GAINERS_24H[0].symbol}/USDT
            </div>
            <div style={{ fontSize: WEB_FONT.md, fontWeight: 700, color: '#10B981' }}>
              +{GAINERS_24H[0].change.toFixed(2)}%
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Snowflake size={WEB_ICON.lg} color="#EF4444" />
              <span style={{ fontSize: WEB_FONT.sm, color: c.text3, fontWeight: 600 }}>
                Top Loser
              </span>
            </div>
            <div style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
              {LOSERS_24H[0].symbol}/USDT
            </div>
            <div style={{ fontSize: WEB_FONT.md, fontWeight: 700, color: '#EF4444' }}>
              {LOSERS_24H[0].change.toFixed(2)}%
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity size={WEB_ICON.lg} color={c.primary} />
              <span style={{ fontSize: WEB_FONT.sm, color: c.text3, fontWeight: 600 }}>
                Tổng khối lượng
              </span>
            </div>
            <div style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
              {formatVolume(
                [...GAINERS_24H, ...LOSERS_24H].reduce((sum, m) => sum + m.volume24h, 0),
              )}
            </div>
            <div style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>16 cặp</div>
          </div>
        </div>

        {/* ─── Gainers & Losers (Two Column Layout) ─── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={WEB_ICON.xl} color="#10B981" />
              <h2 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
                Top Gainers
              </h2>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              {/* Table Header */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: '40px 1fr 120px 100px 120px',
                  padding: '0 20px',
                  height: WEB_SPACING.rowCompact,
                  borderBottom: `1px solid ${c.divider}`,
                  background: c.bg,
                }}
              >
                {['#', 'Cặp', 'Giá', 'Thay đổi', 'Khối lượng'].map((label) => (
                  <div
                    key={label}
                    className="flex items-center"
                    style={{
                      fontSize: WEB_FONT.xs,
                      fontWeight: 700,
                      color: c.text3,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      justifyContent: label === '#' || label === 'Cặp' ? 'flex-start' : 'flex-end',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {GAINERS_24H.map((mover, idx) => (
                <MoverRow
                  key={mover.symbol}
                  mover={mover}
                  rank={idx + 1}
                  onClick={() => handlePairClick(mover.symbol)}
                />
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={WEB_ICON.xl} color="#EF4444" />
              <h2 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>Top Losers</h2>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              {/* Table Header */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: '40px 1fr 120px 100px 120px',
                  padding: '0 20px',
                  height: WEB_SPACING.rowCompact,
                  borderBottom: `1px solid ${c.divider}`,
                  background: c.bg,
                }}
              >
                {['#', 'Cặp', 'Giá', 'Thay đổi', 'Khối lượng'].map((label) => (
                  <div
                    key={label}
                    className="flex items-center"
                    style={{
                      fontSize: WEB_FONT.xs,
                      fontWeight: 700,
                      color: c.text3,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      justifyContent: label === '#' || label === 'Cặp' ? 'flex-start' : 'flex-end',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {LOSERS_24H.map((mover, idx) => (
                <MoverRow
                  key={mover.symbol}
                  mover={mover}
                  rank={idx + 1}
                  onClick={() => handlePairClick(mover.symbol)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
