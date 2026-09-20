/**
 * ══════════════════════════════════════════════════════════
 *  WEB MARKETS WATCHLIST PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/markets/watchlist
 *
 *  Personalized watchlist with:
 *  - Add/Remove pairs
 *  - Custom folders/groups
 *  - Real-time price updates
 *  - Quick trade actions
 *  - Price alerts setup
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Star,
  Plus,
  Trash2,
  Bell,
  TrendingUp,
  TrendingDown,
  Search,
  X,
  Folder,
  Eye,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface WatchlistPair {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  hasAlert?: boolean;
  folder?: string;
}

const WATCHLIST_PAIRS: WatchlistPair[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 98500, change24h: 2.45, volume24h: 45600000000, hasAlert: true, folder: 'Favorites' },
  { symbol: 'ETH', name: 'Ethereum', price: 3420, change24h: 3.82, volume24h: 28400000000, hasAlert: true, folder: 'Favorites' },
  { symbol: 'SOL', name: 'Solana', price: 142.5, change24h: 8.56, volume24h: 3200000000, folder: 'DeFi' },
  { symbol: 'AVAX', name: 'Avalanche', price: 42.3, change24h: -2.34, volume24h: 540000000, folder: 'DeFi' },
  { symbol: 'MATIC', name: 'Polygon', price: 1.15, change24h: 5.67, volume24h: 890000000, folder: 'Layer 2' },
  { symbol: 'ARB', name: 'Arbitrum', price: 1.85, change24h: 4.23, volume24h: 280000000, folder: 'Layer 2' },
  { symbol: 'OP', name: 'Optimism', price: 2.42, change24h: -1.12, volume24h: 195000000, folder: 'Layer 2' },
  { symbol: 'LINK', name: 'Chainlink', price: 18.75, change24h: 6.78, volume24h: 620000000, hasAlert: false },
];

type FilterTab = 'all' | 'favorites' | 'defi' | 'layer2';

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
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebMarketsWatchlistPage() {
  const c = useThemeColors();
  const navigate = useNavigate();

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter watchlist
  const filteredPairs = WATCHLIST_PAIRS.filter((pair) => {
    if (filterTab === 'favorites' && pair.folder !== 'Favorites') return false;
    if (filterTab === 'defi' && pair.folder !== 'DeFi') return false;
    if (filterTab === 'layer2' && pair.folder !== 'Layer 2') return false;
    if (searchQuery && !pair.symbol.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handlePairClick = (symbol: string) => {
    navigate(`/w/trade/${symbol.toLowerCase()}usdt`);
  };

  const handleRemovePair = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Remove', symbol);
  };

  const handleSetAlert = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Set alert for', symbol);
  };

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Danh sách theo dõi"
        subtitle={`${WATCHLIST_PAIRS.length} cặp · ${WATCHLIST_PAIRS.filter((p) => p.hasAlert).length} cảnh báo`}
        back
        right={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl transition-all"
            style={{
              height: WEB_BUTTON.md,
              padding: '0 20px',
              background: c.primary,
              color: '#fff',
              fontSize: WEB_FONT.sm,
              fontWeight: 600,
            }}
          >
            <Plus size={WEB_ICON.sm} />
            <span>Thêm cặp</span>
          </button>
        }
      />
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: `${WEB_SPACING.cardRelaxed}px` }}>

        {/* ─── Filters & Search ─── */}
        <div className="flex items-center gap-4 mb-6">
          {/* Folder Tabs */}
          <div
            className="flex items-center rounded-xl p-1"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            {[
              { key: 'all', label: 'Tất cả', icon: Eye },
              { key: 'favorites', label: 'Favorites', icon: Star },
              { key: 'defi', label: 'DeFi', icon: Folder },
              { key: 'layer2', label: 'Layer 2', icon: Folder },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key as FilterTab)}
                  className="flex items-center gap-2 rounded-lg transition-all"
                  style={{
                    padding: '8px 16px',
                    background: filterTab === tab.key ? c.primary : 'transparent',
                    color: filterTab === tab.key ? '#fff' : c.text2,
                    fontSize: WEB_FONT.sm,
                    fontWeight: 600,
                  }}
                >
                  <Icon size={WEB_ICON.sm} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 flex-1"
            style={{
              height: WEB_BUTTON.md,
              maxWidth: 400,
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            <Search size={WEB_ICON.sm} color={c.text3} />
            <input
              type="text"
              placeholder="Tìm cặp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none"
              style={{
                color: c.text1,
                fontSize: WEB_FONT.sm,
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={WEB_ICON.sm} color={c.text3} />
              </button>
            )}
          </div>
        </div>

        {/* ─── Watchlist Table ─── */}
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
              gridTemplateColumns: '50px 1fr 140px 120px 140px 180px',
              padding: '0 20px',
              height: WEB_SPACING.rowCompact,
              borderBottom: `1px solid ${c.divider}`,
              background: c.bg,
            }}
          >
            {['', 'Cặp', 'Giá', 'Thay đổi 24h', 'Khối lượng 24h', 'Hành động'].map((label) => (
              <div
                key={label}
                className="flex items-center"
                style={{
                  fontSize: WEB_FONT.xs,
                  fontWeight: 700,
                  color: c.text3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  justifyContent: label === 'Hành động' ? 'flex-end' : 'flex-start',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Table Body */}
          {filteredPairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Star size={48} color={c.text3} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: WEB_FONT.md, color: c.text3, marginBottom: 8 }}>
                Chưa có cặp nào
              </p>
              <p style={{ fontSize: WEB_FONT.sm, color: c.text3 }}>
                Thêm cặp để theo dõi giá và thiết lập cảnh báo
              </p>
            </div>
          ) : (
            filteredPairs.map((pair, idx) => {
              const isPositive = pair.change24h >= 0;
              return (
                <div
                  key={pair.symbol}
                  className="grid cursor-pointer transition-all hover:bg-opacity-50"
                  style={{
                    gridTemplateColumns: '50px 1fr 140px 120px 140px 180px',
                    padding: '0 20px',
                    height: WEB_SPACING.rowDefault,
                    borderBottom: idx < filteredPairs.length - 1 ? `1px solid ${c.divider}` : 'none',
                  }}
                  onClick={() => handlePairClick(pair.symbol)}
                >
                  {/* Star Icon */}
                  <div className="flex items-center">
                    <Star
                      size={WEB_ICON.md}
                      fill={pair.folder === 'Favorites' ? '#F59E0B' : 'none'}
                      color={pair.folder === 'Favorites' ? '#F59E0B' : c.text3}
                    />
                  </div>

                  {/* Pair Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full flex items-center justify-center"
                      style={{
                        width: 36,
                        height: 36,
                        background: `linear-gradient(135deg, ${c.primary}40, ${c.primary}20)`,
                      }}
                    >
                      <span style={{ fontSize: WEB_FONT.sm, fontWeight: 700, color: c.primary }}>
                        {pair.symbol[0]}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: WEB_FONT.md, fontWeight: 700, color: c.text1 }}>
                        {pair.symbol}/USDT
                      </div>
                      <div style={{ fontSize: WEB_FONT.xs, color: c.text3 }}>
                        {pair.name}
                        {pair.folder && (
                          <>
                            {' · '}
                            <span style={{ color: c.text3 }}>{pair.folder}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center">
                    <span
                      style={{
                        fontSize: WEB_FONT.md,
                        fontWeight: 700,
                        color: c.text1,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      ${formatPrice(pair.price)}
                    </span>
                  </div>

                  {/* Change */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp size={WEB_ICON.sm} color="#10B981" />
                      ) : (
                        <TrendingDown size={WEB_ICON.sm} color="#EF4444" />
                      )}
                      <span
                        style={{
                          fontSize: WEB_FONT.md,
                          fontWeight: 700,
                          color: isPositive ? '#10B981' : '#EF4444',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {isPositive ? '+' : ''}
                        {pair.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center">
                    <span
                      style={{
                        fontSize: WEB_FONT.sm,
                        fontWeight: 600,
                        color: c.text2,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatVolume(pair.volume24h)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => handleSetAlert(pair.symbol, e)}
                      className="rounded-lg transition-all"
                      style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: pair.hasAlert ? c.primary + '20' : c.bg,
                        border: `1px solid ${pair.hasAlert ? c.primary : c.border}`,
                      }}
                    >
                      <Bell
                        size={WEB_ICON.sm}
                        fill={pair.hasAlert ? c.primary : 'none'}
                        color={pair.hasAlert ? c.primary : c.text3}
                      />
                    </button>
                    <button
                      onClick={(e) => handleRemovePair(pair.symbol, e)}
                      className="rounded-lg transition-all hover:bg-red-500/10"
                      style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <Trash2 size={WEB_ICON.sm} color={c.text3} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Add Pair Modal (TODO) ─── */}
      {showAddModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-2xl p-6"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              maxWidth: 500,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: WEB_FONT.xl, fontWeight: 700, color: c.text1, marginBottom: 16 }}>
              Thêm cặp vào watchlist
            </h3>
            <p style={{ fontSize: WEB_FONT.sm, color: c.text3, marginBottom: 20 }}>Coming soon...</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="rounded-xl w-full"
              style={{
                height: WEB_BUTTON.md,
                background: c.primary,
                color: '#fff',
                fontSize: WEB_FONT.sm,
                fontWeight: 600,
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}