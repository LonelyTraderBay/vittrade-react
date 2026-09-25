import { useState } from 'react';
import { Flame, TrendingDown, TrendingUp } from 'lucide-react';
import { TrCard } from '@/shared/ui/TrCard';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { FONT_SCALE, FONT_WEIGHT } from '@/shared/theme/legacyTypography';
import { ICON_SIZE, ICON_STROKE } from '@/shared/theme/icons';
import { ALPHA, withAlpha } from '@/shared/theme/colors';

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

  const currentData =
    period === '24h' ? data.last24h : period === '7d' ? data.last7d : data.last30d;
  const longPct =
    period === '24h' ? (data.last24h.longLiquidations / data.last24h.total) * 100 : 50;
  const shortPct =
    period === '24h' ? (data.last24h.shortLiquidations / data.last24h.total) * 100 : 50;

  return (
    <TrCard className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Flame size={ICON_SIZE.sm} color="#F59E0B" strokeWidth={ICON_STROKE.standard} />
        <div className="flex flex-1 items-center justify-between">
          <span style={{ color: c.text1, fontSize: FONT_SCALE.sm, fontWeight: FONT_WEIGHT.bold }}>
            Liquidation Stats
          </span>
          <span style={{ color: c.text3, fontSize: FONT_SCALE.xs }}>{pair}</span>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex rounded-2xl p-1 gap-1 mb-3" style={{ background: c.surface2 }}>
        {(['24h', '7d', '30d'] as const).map((p) => (
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
                <span
                  style={{
                    color: '#10B981',
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.bold,
                  }}
                >
                  {longPct.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    color: '#EF4444',
                    fontSize: FONT_SCALE.xs,
                    fontWeight: FONT_WEIGHT.bold,
                  }}
                >
                  {shortPct.toFixed(1)}%
                </span>
                <TrendingDown size={14} color="#EF4444" />
              </div>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden flex"
              style={{ background: c.surface2 }}
            >
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
              <p
                style={{
                  color: '#EF4444',
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                }}
              >
                ${(data.last24h.largestLiquidation / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: c.surface2 }}>
              <p style={{ color: c.text3, fontSize: FONT_SCALE.micro, marginBottom: 2 }}>Avg Liq</p>
              <p
                style={{
                  color: c.text1,
                  fontSize: FONT_SCALE.sm,
                  fontWeight: FONT_WEIGHT.bold,
                  fontFamily: 'monospace',
                }}
              >
                ${(data.last24h.avgLiquidation / 1000).toFixed(1)}K
              </p>
            </div>
          </div>
        </>
      )}
    </TrCard>
  );
}
