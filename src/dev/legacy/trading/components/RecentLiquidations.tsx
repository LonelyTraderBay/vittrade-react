import { useState } from 'react';
import { AlertTriangle, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '@/shared/theme/legacyTypography';
import { ICON_SIZE, ICON_STROKE } from '@/shared/theme/icons';
import { ALPHA, withAlpha } from '@/shared/theme/colors';

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

  const filtered = liquidations.filter((liq) => (filter === 'all' ? true : liq.side === filter));

  const totalLiquidated = filtered.reduce((sum, liq) => sum + liq.size, 0);
  const longLiquidated = filtered
    .filter((l) => l.side === 'long')
    .reduce((sum, l) => sum + l.size, 0);
  const shortLiquidated = filtered
    .filter((l) => l.side === 'short')
    .reduce((sum, l) => sum + l.size, 0);

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
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
            <span style={{ color: '#10B981', fontSize: 10, fontWeight: FONT_WEIGHT.semibold }}>
              LIVE
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl p-2.5 text-center" style={{ background: c.surface2 }}>
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Total</p>
          <p
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            ${(totalLiquidated / 1000000).toFixed(2)}M
          </p>
        </div>
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: withAlpha('#10B981', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Longs</p>
          <p
            style={{
              color: '#10B981',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            ${(longLiquidated / 1000000).toFixed(2)}M
          </p>
        </div>
        <div
          className="rounded-xl p-2.5 text-center"
          style={{ background: withAlpha('#EF4444', ALPHA.hover) }}
        >
          <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Shorts</p>
          <p
            style={{
              color: '#EF4444',
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.bold,
              fontFamily: 'monospace',
            }}
          >
            ${(shortLiquidated / 1000000).toFixed(2)}M
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex rounded-2xl p-1 gap-1 mb-3" style={{ background: c.surface2 }}>
        {(['all', 'long', 'short'] as const).map((f) => (
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
        {filtered.slice(0, 20).map((liq) => (
          <div
            key={liq.id}
            className="rounded-xl p-2.5 flex items-center justify-between"
            style={{
              background:
                liq.side === 'long'
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
                $
                {liq.size >= 1000000
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
          Showing last 20 liquidations. Large liquidations (whales) có thể trigger cascading
          liquidations → volatility spike.
        </p>
      </div>
    </TrCard>
  );
}
