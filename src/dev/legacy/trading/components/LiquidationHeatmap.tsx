import { Flame, Info } from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '@/shared/theme/legacyTypography';
import { ICON_SIZE, ICON_STROKE } from '@/shared/theme/icons';
import { ALPHA, withAlpha } from '@/shared/theme/colors';

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
  const maxTotal = Math.max(...clusters.map((c) => c.total));

  // Find largest clusters
  const topLongCluster = clusters.reduce(
    (max, c) => (c.longLiquidations > max.longLiquidations ? c : max),
    clusters[0],
  );
  const topShortCluster = clusters.reduce(
    (max, c) => (c.shortLiquidations > max.shortLiquidations ? c : max),
    clusters[0],
  );

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={ICON_SIZE.sm} color="#F97316" strokeWidth={ICON_STROKE.standard} />
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Liquidation Heatmap
          </span>
        </div>
        <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{pair}</span>
      </div>

      {/* Current price indicator */}
      <div
        className="rounded-xl p-3 mb-3 flex items-center justify-between"
        style={{ background: withAlpha('#3B82F6', ALPHA.hover) }}
      >
        <span style={{ color: c.text2, fontSize: FONT_SCALE.xs }}>Current Price</span>
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
                    ({distancePct >= 0 ? '+' : ''}
                    {distancePct.toFixed(1)}%)
                  </span>
                </div>
                <span style={{ color: c.text3, fontSize: 10 }}>
                  ${(cluster.total / 1000000).toFixed(1)}M
                </span>
              </div>

              {/* Bar */}
              <div
                className="h-6 rounded-lg overflow-hidden flex"
                style={{ background: c.surface2 }}
              >
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
        <div className="rounded-xl p-2.5" style={{ background: withAlpha('#EF4444', ALPHA.hover) }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Largest Short Liq
          </p>
          <p
            style={{
              color: '#EF4444',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            ${topShortCluster.price.toLocaleString()}
          </p>
          <p style={{ color: c.text3, fontSize: 10 }}>
            ${(topShortCluster.shortLiquidations / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: withAlpha('#10B981', ALPHA.hover) }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>
            Largest Long Liq
          </p>
          <p
            style={{
              color: '#10B981',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
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
          Cluster lớn = nhiều vị thế sẽ bị thanh lý ở mức giá đó. Giá thường bounce hoặc accelerate
          qua cluster.
        </p>
      </div>
    </TrCard>
  );
}
