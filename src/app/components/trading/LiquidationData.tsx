/**
 * ══════════════════════════════════════════════════════════════════
 *  LIQUIDATION DATA — P2 Features
 * ══════════════════════════════════════════════════════════════════
 *  Liquidation tracking & analysis:
 *  - Liquidation Heatmap
 *  - Recent Liquidations Feed
 *  - Liquidation Clusters
 *  - Risk Zones
 */

import React, { useState } from 'react';
import { Flame, TrendingUp, TrendingDown, AlertTriangle, Clock, Info, Filter } from 'lucide-react';
import { TrCard } from '../ui/TrCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '../../constants/typography';
import { ICON_SIZE, ICON_STROKE } from '../../constants/icons';
import { ALPHA, withAlpha } from '../../constants/colors';

/* ═══════════════════════════════════════════════════════════════
   1. LIQUIDATION HEATMAP
   ═══════════════════════════════════════════════════════════════ */

interface LiquidationCluster {
  price: number;
  longLiquidations: number; // Amount in USD
  shortLiquidations: number;
  total: number;
  intensity: number; // 0-100 (for coloring)
}

interface LiquidationHeatmapProps {
  pair: string;
  currentPrice: number;
  clusters: LiquidationCluster[];
  className?: string;
}

export function LiquidationHeatmap({
  pair,
  currentPrice,
  clusters,
  className = '',
}: LiquidationHeatmapProps) {
  const c = useThemeColors();

  // Sort clusters by price
  const sortedClusters = [...clusters].sort((a, b) => b.price - a.price);

  // Find max total for scaling
  const maxTotal = Math.max(...clusters.map(c => c.total));

  // Find largest clusters
  const topLongCluster = clusters.reduce((max, c) => c.longLiquidations > max.longLiquidations ? c : max, clusters[0]);
  const topShortCluster = clusters.reduce((max, c) => c.shortLiquidations > max.shortLiquidations ? c : max, clusters[0]);

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={ICON_SIZE.sm} color="#F97316" strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Liquidation Heatmap
          </span>
        </div>
        <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>
          {pair}
        </span>
      </div>

      {/* Current price indicator */}
      <div
        className="rounded-xl p-3 mb-3 flex items-center justify-between"
        style={{ background: withAlpha('#3B82F6', ALPHA.hover) }}
      >
        <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>
          Current Price
        </span>
        <span
          style={{
            color: '#3B82F6',
            fontSize: FONT_SCALE.lg,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
          }}
        >
          ${currentPrice.toLocaleString()}
        </span>
      </div>

      {/* Heatmap visualization */}
      <div className="flex flex-col gap-1 mb-3">
        {sortedClusters.map((cluster, index) => {
          const isAboveCurrent = cluster.price > currentPrice;
          const distancePct = ((cluster.price - currentPrice) / currentPrice) * 100;
          const widthPct = (cluster.total / maxTotal) * 100;

          const longPct = (cluster.longLiquidations / cluster.total) * 100;
          const shortPct = (cluster.shortLiquidations / cluster.total) * 100;

          return (
            <div key={index} className="relative">
              {/* Price level */}
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      color: isAboveCurrent ? '#EF4444' : '#10B981',
                      fontSize: FONT_SCALE.xs,
                      fontWeight: FONT_WEIGHT.semibold,
                      fontFamily: 'monospace',
                    }}
                  >
                    ${cluster.price.toLocaleString()}
                  </span>
                  <span style={{ color: c.text3, fontSize: 10 }}>
                    ({distancePct >= 0 ? '+' : ''}{distancePct.toFixed(1)}%)
                  </span>
                </div>
                <span style={{ color: c.text3, fontSize: 10 }}>
                  ${(cluster.total / 1000000).toFixed(1)}M
                </span>
              </div>

              {/* Bar */}
              <div className="h-6 rounded-lg overflow-hidden flex" style={{ background: c.surface2 }}>
                {/* Long liquidations (below current = green) */}
                <div
                  className="transition-all flex items-center justify-end px-1"
                  style={{
                    width: `${(longPct / 100) * widthPct}%`,
                    background: isAboveCurrent
                      ? `rgba(239,68,68,${0.3 + cluster.intensity * 0.007})`
                      : `rgba(16,185,129,${0.3 + cluster.intensity * 0.007})`,
                  }}
                >
                  {cluster.longLiquidations > maxTotal * 0.1 && (
                    <span style={{ color: '#fff', fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>
                      L
                    </span>
                  )}
                </div>

                {/* Short liquidations (above current = red) */}
                <div
                  className="transition-all flex items-center px-1"
                  style={{
                    width: `${(shortPct / 100) * widthPct}%`,
                    background: isAboveCurrent
                      ? `rgba(16,185,129,${0.3 + cluster.intensity * 0.007})`
                      : `rgba(239,68,68,${0.3 + cluster.intensity * 0.007})`,
                  }}
                >
                  {cluster.shortLiquidations > maxTotal * 0.1 && (
                    <span style={{ color: '#fff', fontSize: 9, fontWeight: FONT_WEIGHT.bold }}>
                      S
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div
          className="rounded-xl p-2.5"
          style={{ background: withAlpha('#EF4444', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Largest Short Liq
          </p>
          <p style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            ${topShortCluster.price.toLocaleString()}
          </p>
          <p style={{ color: c.text3, fontSize: 10 }}>
            ${(topShortCluster.shortLiquidations / 1000000).toFixed(1)}M
          </p>
        </div>
        <div
          className="rounded-xl p-2.5"
          style={{ background: withAlpha('#10B981', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Largest Long Liq
          </p>
          <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            ${topLongCluster.price.toLocaleString()}
          </p>
          <p style={{ color: c.text3, fontSize: 10 }}>
            ${(topLongCluster.longLiquidations / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-2 p-2.5 rounded-xl"
        style={{ background: withAlpha('#F97316', ALPHA.hover) }}
      >
        <Info size={12} color="#F97316" className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          Cluster lớn = nhiều vị thế sẽ bị thanh lý ở mức giá đó. Giá thường bounce hoặc accelerate qua cluster.
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. RECENT LIQUIDATIONS FEED
   ═══════════════════════════════════════════════════════════════ */

interface Liquidation {
  id: string;
  timestamp: number;
  pair: string;
  side: 'long' | 'short';
  size: number; // in USD
  price: number;
  exchange?: string;
}

interface RecentLiquidationsProps {
  liquidations: Liquidation[];
  autoRefresh?: boolean;
  className?: string;
}

export function RecentLiquidations({
  liquidations,
  autoRefresh = true,
  className = '',
}: RecentLiquidationsProps) {
  const c = useThemeColors();
  const [filter, setFilter] = useState<'all' | 'long' | 'short'>('all');

  const filtered = liquidations.filter(liq => 
    filter === 'all' ? true : liq.side === filter
  );

  const totalLiquidated = filtered.reduce((sum, liq) => sum + liq.size, 0);
  const longLiquidated = filtered.filter(l => l.side === 'long').reduce((sum, l) => sum + l.size, 0);
  const shortLiquidated = filtered.filter(l => l.side === 'short').reduce((sum, l) => sum + l.size, 0);

  const formatTimestamp = (ts: number) => {
    const now = Date.now();
    const diff = now - ts;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={ICON_SIZE.sm} color="#EF4444" strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Recent Liquidations
          </span>
        </div>
        {autoRefresh && (
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#10B981' }}
            />
            <span style={{ color: '#10B981', fontSize: 10, fontWeight: FONT_WEIGHT.semibold }}>
              LIVE
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Total
          </p>
          <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            ${(totalLiquidated / 1000000).toFixed(2)}M
          </p>
        </div>
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: withAlpha('#10B981', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Longs
          </p>
          <p style={{ color: '#10B981', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            ${(longLiquidated / 1000000).toFixed(2)}M
          </p>
        </div>
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: withAlpha('#EF4444', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Shorts
          </p>
          <p style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
            ${(shortLiquidated / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex rounded-2xl p-1 gap-1 mb-3" style={{ background: c.surface2 }}>
        {(['all', 'long', 'short'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 py-1.5 rounded-xl transition-all"
            style={{
              background: filter === f ? c.primary : 'transparent',
              color: filter === f ? '#fff' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: filter === f ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            {f === 'all' ? 'All' : f === 'long' ? 'Longs' : 'Shorts'}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
        {filtered.slice(0, 20).map(liq => (
          <div
            key={liq.id}
            className="rounded-xl p-2.5 flex items-center justify-between"
            style={{
              background: liq.side === 'long'
                ? withAlpha('#10B981', ALPHA.hover)
                : withAlpha('#EF4444', ALPHA.hover),
              border: `1px solid ${liq.side === 'long' ? withAlpha('#10B981', ALPHA.soft) : withAlpha('#EF4444', ALPHA.soft)}`,
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {liq.side === 'long' ? (
                <TrendingUp size={14} color="#10B981" strokeWidth={ICON_STROKE.standard} />
              ) : (
                <TrendingDown size={14} color="#EF4444" strokeWidth={ICON_STROKE.standard} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      color: c.text1,
                      fontSize: FONT_SCALE.xs,
                      fontWeight: FONT_WEIGHT.semibold,
                    }}
                  >
                    {liq.pair}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-md"
                    style={{
                      background: liq.side === 'long' ? '#10B981' : '#EF4444',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: FONT_WEIGHT.bold,
                    }}
                  >
                    {liq.side.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: c.text3, fontSize: 10 }}>
                    @ ${liq.price.toLocaleString()}
                  </span>
                  <span style={{ color: c.text3, fontSize: 10 }}>•</span>
                  <span style={{ color: c.text3, fontSize: 10 }}>
                    {formatTimestamp(liq.timestamp)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p
                style={{
                  color: liq.side === 'long' ? '#10B981' : '#EF4444',
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                }}
              >
                ${liq.size >= 1000000
                  ? `${(liq.size / 1000000).toFixed(2)}M`
                  : liq.size >= 1000
                  ? `${(liq.size / 1000).toFixed(1)}K`
                  : liq.size.toFixed(0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div
        className="flex items-start gap-2 mt-3 p-2.5 rounded-xl"
        style={{ background: c.surface2 }}
      >
        <Clock size={12} color={c.text3} className="shrink-0 mt-0.5" />
        <p style={{ color: c.text3, fontSize: 10, lineHeight: 1.5 }}>
          Showing last 20 liquidations. Large liquidations (whales) có thể trigger cascading liquidations → volatility spike.
        </p>
      </div>
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. LIQUIDATION STATISTICS
   ═══════════════════════════════════════════════════════════════ */

interface LiquidationStatsData {
  last24h: {
    total: number;
    longLiquidations: number;
    shortLiquidations: number;
    largestLiquidation: number;
    avgLiquidation: number;
    count: number;
  };
  last7d: {
    total: number;
    count: number;
  };
  last30d: {
    total: number;
    count: number;
  };
}

interface LiquidationStatsProps {
  pair: string;
  data: LiquidationStatsData;
  className?: string;
}

export function LiquidationStats({ pair, data, className = '' }: LiquidationStatsProps) {
  const c = useThemeColors();
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  const currentData = period === '24h' ? data.last24h : period === '7d' ? data.last7d : data.last30d;
  const longPct = period === '24h' ? (data.last24h.longLiquidations / data.last24h.total) * 100 : 50;
  const shortPct = period === '24h' ? (data.last24h.shortLiquidations / data.last24h.total) * 100 : 50;

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Flame size={ICON_SIZE.sm} color="#F59E0B" strokeWidth={ICON_STROKE.standard} />
        <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
          Liquidation Stats
        </span>
      </div>

      {/* Period selector */}
      <div className="flex rounded-2xl p-1 gap-1 mb-3" style={{ background: c.surface2 }}>
        {(['24h', '7d', '30d'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="flex-1 py-2 rounded-xl transition-all"
            style={{
              background: period === p ? c.primary : 'transparent',
              color: period === p ? '#fff' : c.text3,
              fontSize: FONT_SCALE.xs,
              fontWeight: period === p ? FONT_WEIGHT.bold : FONT_WEIGHT.medium,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Main stat */}
      <div
        className="rounded-2xl p-4 text-center mb-3"
        style={{ background: withAlpha('#F59E0B', ALPHA.hover) }}
      >
        <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginBottom: 4 }}>
          Total Liquidated ({period})
        </p>
        <p
          style={{
            color: '#F59E0B',
            fontSize: 36,
            fontWeight: FONT_WEIGHT.bold,
            fontFamily: 'monospace',
            lineHeight: 1,
          }}
        >
          ${(currentData.total / 1000000).toFixed(1)}M
        </p>
        <p style={{ color: c.text3, fontSize: FONT_SCALE.xs, marginTop: 4 }}>
          {currentData.count.toLocaleString()} liquidations
        </p>
      </div>

      {/* 24h breakdown (only for 24h period) */}
      {period === '24h' && (
        <>
          {/* Long vs Short */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} color="#10B981" />
                <span style={{ color: '#10B981', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                  {longPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ color: '#EF4444', fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
                  {shortPct.toFixed(1)}%
                </span>
                <TrendingDown size={14} color="#EF4444" />
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex" style={{ background: c.surface2 }}>
              <div
                className="transition-all"
                style={{ width: `${longPct}%`, background: '#10B981' }}
              />
              <div
                className="transition-all"
                style={{ width: `${shortPct}%`, background: '#EF4444' }}
              />
            </div>
          </div>

          {/* Detailed stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
                Largest Liq
              </p>
              <p style={{ color: '#EF4444', fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                ${(data.last24h.largestLiquidation / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
                Avg Liq
              </p>
              <p style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold, fontFamily: 'monospace' }}>
                ${(data.last24h.avgLiquidation / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </>
      )}
    </TrCard>
  );
}
