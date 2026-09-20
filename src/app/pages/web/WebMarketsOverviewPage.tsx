/**
 * ══════════════════════════════════════════════════════════
 *  WEB MARKETS OVERVIEW PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/markets/overview
 *
 *  Enterprise market overview with:
 *  - Global market stats
 *  - Trending pairs grid
 *  - Volume leaders
 *  - New listings
 *  - Market sentiment indicators
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Star,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface MarketPair {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  isNew?: boolean;
}

const TRENDING_PAIRS: MarketPair[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 98500,
    change24h: 2.45,
    volume24h: 45600000000,
    marketCap: 1920000000000,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3420,
    change24h: 3.82,
    volume24h: 28400000000,
    marketCap: 410000000000,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 142.5,
    change24h: 8.56,
    volume24h: 3200000000,
    marketCap: 65000000000,
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    price: 615,
    change24h: 1.23,
    volume24h: 1800000000,
    marketCap: 89000000000,
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    price: 0.58,
    change24h: -1.45,
    volume24h: 2100000000,
    marketCap: 31000000000,
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.68,
    change24h: 4.12,
    volume24h: 980000000,
    marketCap: 24000000000,
  },
];

const NEW_LISTINGS: MarketPair[] = [
  {
    symbol: 'PEPE',
    name: 'Pepe',
    price: 0.00000123,
    change24h: 45.67,
    volume24h: 450000000,
    marketCap: 520000000,
    isNew: true,
  },
  {
    symbol: 'ARB',
    name: 'Arbitrum',
    price: 1.85,
    change24h: 12.34,
    volume24h: 280000000,
    marketCap: 2300000000,
    isNew: true,
  },
  {
    symbol: 'OP',
    name: 'Optimism',
    price: 2.42,
    change24h: 8.91,
    volume24h: 195000000,
    marketCap: 1800000000,
    isNew: true,
  },
];

const VOLUME_LEADERS: MarketPair[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 98500,
    change24h: 2.45,
    volume24h: 45600000000,
    marketCap: 1920000000000,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3420,
    change24h: 3.82,
    volume24h: 28400000000,
    marketCap: 410000000000,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 142.5,
    change24h: 8.56,
    volume24h: 3200000000,
    marketCap: 65000000000,
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    price: 0.58,
    change24h: -1.45,
    volume24h: 2100000000,
    marketCap: 31000000000,
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    price: 615,
    change24h: 1.23,
    volume24h: 1800000000,
    marketCap: 89000000000,
  },
];

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
  if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
  return `$${volume.toFixed(2)}`;
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function StatCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: number;
  icon: any;
}) {
  const c = useThemeColors();
  const isPositive = change >= 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: WEB_FONT.sm, color: c.text3, fontWeight: 600 }}>{label}</span>
        <Icon size={WEB_ICON.lg} color={c.text3} />
      </div>
      <div style={{ fontSize: WEB_FONT['2xl'], fontWeight: 700, color: c.text1, marginBottom: 4 }}>
        {value}
      </div>
      <div className="flex items-center gap-1">
        {isPositive ? (
          <ArrowUpRight size={WEB_ICON.sm} color="#10B981" />
        ) : (
          <ArrowDownRight size={WEB_ICON.sm} color="#EF4444" />
        )}
        <span
          style={{
            fontSize: WEB_FONT.sm,
            fontWeight: 600,
            color: isPositive ? '#10B981' : '#EF4444',
          }}
        >
          {isPositive ? '+' : ''}
          {change.toFixed(2)}%
        </span>
        <span style={{ fontSize: WEB_FONT.sm, color: c.text3, marginLeft: 4 }}>24h</span>
      </div>
    </div>
  );
}

function PairCard({ pair, onClick }: { pair: MarketPair; onClick: () => void }) {
  const c = useThemeColors();
  const isPositive = pair.change24h >= 0;

  return (
    <div
      className="rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02]"
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              background: `linear-gradient(135deg, ${c.primary}40, ${c.primary}20)`,
            }}
          >
            <span style={{ fontSize: WEB_FONT.md, fontWeight: 700, color: c.primary }}>
              {pair.symbol[0]}
            </span>
          </div>
          <div>
            <div style={{ fontSize: WEB_FONT.md, fontWeight: 700, color: c.text1 }}>
              {pair.symbol}/USDT
            </div>
            <div style={{ fontSize: WEB_FONT.xs, color: c.text3 }}>{pair.name}</div>
          </div>
        </div>
        {pair.isNew && (
          <div
            className="px-2 py-1 rounded"
            style={{
              background: '#10B981' + '20',
              border: `1px solid #10B981`,
            }}
          >
            <span style={{ fontSize: WEB_FONT.xs, fontWeight: 700, color: '#10B981' }}>NEW</span>
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: WEB_FONT.xl,
          fontWeight: 700,
          color: c.text1,
          marginBottom: 8,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        ${formatPrice(pair.price)}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {isPositive ? (
            <TrendingUp size={WEB_ICON.sm} color="#10B981" />
          ) : (
            <TrendingDown size={WEB_ICON.sm} color="#EF4444" />
          )}
          <span
            style={{
              fontSize: WEB_FONT.sm,
              fontWeight: 700,
              color: isPositive ? '#10B981' : '#EF4444',
            }}
          >
            {isPositive ? '+' : ''}
            {pair.change24h.toFixed(2)}%
          </span>
        </div>
        <span style={{ fontSize: WEB_FONT.xs, color: c.text3 }}>
          Vol: {formatVolume(pair.volume24h)}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebMarketsOverviewPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  const handlePairClick = (symbol: string) => {
    navigate(`/w/trade/${symbol.toLowerCase()}usdt`);
  };

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Tổng quan thị trường"
        subtitle="Theo dõi xu hướng và cơ hội đầu tư"
        back
      />
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: `${WEB_SPACING.cardRelaxed}px` }}>
        {/* ─── Global Stats ─── */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Tổng giá trị thị trường"
            value="$2.85T"
            change={2.34}
            icon={DollarSign}
          />
          <StatCard label="Khối lượng 24h" value="$156.8B" change={8.45} icon={Activity} />
          <StatCard label="Bitcoin Dominance" value="67.4%" change={0.12} icon={TrendingUp} />
          <StatCard label="Số cặp giao dịch" value="1,247" change={1.2} icon={Zap} />
        </div>

        {/* ─── Trending Pairs ─── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
              Xu hướng nổi bật
            </h2>
            <button
              onClick={() => navigate('/w/markets')}
              style={{
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
                color: c.primary,
              }}
            >
              Xem tất cả →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {TRENDING_PAIRS.map((pair) => (
              <PairCard
                key={pair.symbol}
                pair={pair}
                onClick={() => handlePairClick(pair.symbol)}
              />
            ))}
          </div>
        </div>

        {/* ─── Volume Leaders & New Listings ─── */}
        <div className="grid grid-cols-2 gap-6">
          {/* Volume Leaders */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={WEB_ICON.lg} color={c.text1} />
              <h2 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
                Top khối lượng
              </h2>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
              }}
            >
              {VOLUME_LEADERS.map((pair, idx) => {
                const isPositive = pair.change24h >= 0;
                return (
                  <div
                    key={pair.symbol}
                    className="flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-opacity-50"
                    style={{
                      borderBottom:
                        idx < VOLUME_LEADERS.length - 1 ? `1px solid ${c.divider}` : 'none',
                    }}
                    onClick={() => handlePairClick(pair.symbol)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          fontSize: WEB_FONT.sm,
                          color: c.text3,
                          fontWeight: 700,
                          width: 24,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <div style={{ fontSize: WEB_FONT.md, fontWeight: 700, color: c.text1 }}>
                          {pair.symbol}/USDT
                        </div>
                        <div style={{ fontSize: WEB_FONT.xs, color: c.text3 }}>
                          {formatVolume(pair.volume24h)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        style={{
                          fontSize: WEB_FONT.md,
                          fontWeight: 700,
                          color: c.text1,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        ${formatPrice(pair.price)}
                      </div>
                      <div
                        style={{
                          fontSize: WEB_FONT.sm,
                          fontWeight: 600,
                          color: isPositive ? '#10B981' : '#EF4444',
                        }}
                      >
                        {isPositive ? '+' : ''}
                        {pair.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New Listings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={WEB_ICON.lg} color={c.text1} />
              <h2 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1 }}>
                Niêm yết mới
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {NEW_LISTINGS.map((pair) => (
                <PairCard
                  key={pair.symbol}
                  pair={pair}
                  onClick={() => handlePairClick(pair.symbol)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
