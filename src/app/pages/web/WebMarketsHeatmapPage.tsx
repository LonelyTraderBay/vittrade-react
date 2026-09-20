/**
 * ══════════════════════════════════════════════════════════
 *  WEB MARKETS HEATMAP PAGE
 * ══════════════════════════════════════════════════════════
 *
 *  Route: /w/markets/heatmap
 *
 *  Visual market overview with:
 *  - Treemap visualization (size = market cap, color = 24h change)
 *  - Category filtering
 *  - Hover details
 *  - Click to trade
 *  - Size/Color legend
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  TrendingDown,
  Grid3x3,
  Filter,
  Info,
} from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { WEB_FONT, WEB_SPACING, WEB_ICON, WEB_BUTTON } from '../../components/layout/webConstants';
import { PageLayout } from '../../components/layout/PageLayout';
import { Header } from '../../components/layout/Header';

/* ═══════════════════════════════════════════════════════════
   TYPES & MOCK DATA
   ═══════════════════════════════════════════════════════════ */

interface HeatmapAsset {
  symbol: string;
  name: string;
  marketCap: number;
  change24h: number;
  price: number;
  category: string;
}

const HEATMAP_DATA: HeatmapAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', marketCap: 1920000000000, change24h: 2.45, price: 98500, category: 'Layer 1' },
  { symbol: 'ETH', name: 'Ethereum', marketCap: 410000000000, change24h: 3.82, price: 3420, category: 'Layer 1' },
  { symbol: 'BNB', name: 'BNB', marketCap: 89000000000, change24h: 1.23, price: 615, category: 'Exchange' },
  { symbol: 'SOL', name: 'Solana', marketCap: 65000000000, change24h: 8.56, price: 142.5, category: 'Layer 1' },
  { symbol: 'XRP', name: 'Ripple', marketCap: 31000000000, change24h: -1.45, price: 0.58, category: 'Payment' },
  { symbol: 'ADA', name: 'Cardano', marketCap: 24000000000, change24h: 4.12, price: 0.68, category: 'Layer 1' },
  { symbol: 'AVAX', name: 'Avalanche', marketCap: 15000000000, change24h: -2.34, price: 42.3, category: 'Layer 1' },
  { symbol: 'DOGE', name: 'Dogecoin', marketCap: 12000000000, change24h: 1.56, price: 0.082, category: 'Meme' },
  { symbol: 'MATIC', name: 'Polygon', marketCap: 9800000000, change24h: 5.67, price: 1.15, category: 'Layer 2' },
  { symbol: 'LINK', name: 'Chainlink', marketCap: 8500000000, change24h: 6.78, price: 18.75, category: 'Oracle' },
  { symbol: 'UNI', name: 'Uniswap', marketCap: 6200000000, change24h: -3.21, price: 7.82, category: 'DeFi' },
  { symbol: 'ATOM', name: 'Cosmos', marketCap: 4800000000, change24h: 2.91, price: 11.45, category: 'Interop' },
  { symbol: 'ARB', name: 'Arbitrum', marketCap: 2300000000, change24h: 12.34, price: 1.85, category: 'Layer 2' },
  { symbol: 'OP', name: 'Optimism', marketCap: 1800000000, change24h: 8.91, price: 2.42, category: 'Layer 2' },
  { symbol: 'PEPE', name: 'Pepe', marketCap: 520000000, change24h: 45.67, price: 0.00000123, category: 'Meme' },
];

type CategoryFilter = 'all' | 'layer1' | 'layer2' | 'defi' | 'meme';

/* ═══════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════ */

function getChangeColor(change: number): string {
  if (change >= 10) return '#10B981'; // Strong green
  if (change >= 5) return '#34D399';
  if (change >= 0) return '#6EE7B7';
  if (change >= -5) return '#FCA5A5';
  if (change >= -10) return '#F87171';
  return '#EF4444'; // Strong red
}

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${(marketCap / 1e3).toFixed(2)}K`;
}

function formatPrice(price: number): string {
  if (price < 0.01) return price.toFixed(8);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function HeatmapCell({ asset, size, onClick }: { asset: HeatmapAsset; size: 'large' | 'medium' | 'small' | 'tiny'; onClick: () => void }) {
  const c = useThemeColors();
  const changeColor = getChangeColor(asset.change24h);
  const isPositive = asset.change24h >= 0;

  // Size mapping
  const sizeMap = {
    large: { width: '320px', height: '180px', fontSize: WEB_FONT.lg },
    medium: { width: '220px', height: '140px', fontSize: WEB_FONT.md },
    small: { width: '160px', height: '120px', fontSize: WEB_FONT.sm },
    tiny: { width: '120px', height: '100px', fontSize: WEB_FONT.xs },
  };

  const dimensions = sizeMap[size];

  return (
    <div
      className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.05] hover:shadow-lg relative overflow-hidden"
      style={{
        width: dimensions.width,
        height: dimensions.height,
        background: changeColor + '30',
        border: `2px solid ${changeColor}`,
      }}
      onClick={onClick}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(135deg, ${changeColor}80, transparent)`,
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between">
        <div>
          <div
            style={{
              fontSize: dimensions.fontSize,
              fontWeight: 700,
              color: c.text1,
              marginBottom: 2,
            }}
          >
            {asset.symbol}
          </div>
          <div
            style={{
              fontSize: size === 'large' || size === 'medium' ? WEB_FONT.xs : 10,
              color: c.text3,
            }}
          >
            {asset.name}
          </div>
        </div>

        <div>
          {size !== 'tiny' && (
            <div
              style={{
                fontSize: size === 'large' ? WEB_FONT.md : WEB_FONT.sm,
                fontWeight: 600,
                color: c.text2,
                marginBottom: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              ${formatPrice(asset.price)}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp size={size === 'large' ? WEB_ICON.sm : WEB_ICON.xs} color={changeColor} />
              ) : (
                <TrendingDown size={size === 'large' ? WEB_ICON.sm : WEB_ICON.xs} color={changeColor} />
              )}
              <span
                style={{
                  fontSize: size === 'large' ? WEB_FONT.md : WEB_FONT.sm,
                  fontWeight: 700,
                  color: changeColor,
                }}
              >
                {isPositive ? '+' : ''}
                {asset.change24h.toFixed(2)}%
              </span>
            </div>
            {size !== 'tiny' && (
              <span
                style={{
                  fontSize: WEB_FONT.xs,
                  color: c.text3,
                }}
              >
                {formatMarketCap(asset.marketCap)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function WebMarketsHeatmapPage() {
  const c = useThemeColors();
  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Filter data
  const filteredData = HEATMAP_DATA.filter((asset) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'layer1') return asset.category === 'Layer 1';
    if (categoryFilter === 'layer2') return asset.category === 'Layer 2';
    if (categoryFilter === 'defi') return asset.category === 'DeFi';
    if (categoryFilter === 'meme') return asset.category === 'Meme';
    return true;
  });

  // Sort by market cap and assign sizes
  const sortedData = [...filteredData].sort((a, b) => b.marketCap - a.marketCap);

  const handleAssetClick = (symbol: string) => {
    navigate(`/w/trade/${symbol.toLowerCase()}usdt`);
  };

  return (
    <PageLayout>
      <Header
        variant="page"
        title="Market Heatmap"
        subtitle="Trực quan hóa thị trường theo vốn hóa và biến động"
        back
        right={
          <div
            className="flex items-center rounded-xl p-1"
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
            }}
          >
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'layer1', label: 'Layer 1' },
              { key: 'layer2', label: 'Layer 2' },
              { key: 'defi', label: 'DeFi' },
              { key: 'meme', label: 'Meme' },
            ].map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key as CategoryFilter)}
                className="rounded-lg transition-all"
                style={{
                  padding: '8px 16px',
                  background: categoryFilter === cat.key ? c.primary : 'transparent',
                  color: categoryFilter === cat.key ? '#fff' : c.text2,
                  fontSize: WEB_FONT.sm,
                  fontWeight: 600,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        }
      />
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: `${WEB_SPACING.cardRelaxed}px` }}>

        {/* ─── Heatmap Grid ─── */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: c.surface,
            border: `1px solid ${c.border}`,
          }}
        >
          <div className="flex flex-wrap gap-4 justify-center">
            {sortedData.map((asset, idx) => {
              // Assign size based on rank
              let size: 'large' | 'medium' | 'small' | 'tiny';
              if (idx < 2) size = 'large';
              else if (idx < 6) size = 'medium';
              else if (idx < 12) size = 'small';
              else size = 'tiny';

              return (
                <HeatmapCell
                  key={asset.symbol}
                  asset={asset}
                  size={size}
                  onClick={() => handleAssetClick(asset.symbol)}
                />
              );
            })}
          </div>

          {sortedData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Grid3x3 size={48} color={c.text3} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: WEB_FONT.md, color: c.text3 }}>
                Không có dữ liệu cho danh mục này
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}