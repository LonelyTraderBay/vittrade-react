import React, { memo } from 'react';
import { Link } from 'react-router';
import { Star } from 'lucide-react';
import type { MarketPair } from '../model/market-types';
import { SparklineChart } from '@/shared/ui/charts/SparklineChart';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { fmtPrice as fmtPriceUtil, fmtPct } from '@/shared/lib/formatNumber';
import { hexToRgba } from '@/shared/lib/string';
import { FONT_SCALE, FONT_WEIGHT } from '@/shared/theme/legacyTypography';

interface MarketItemProps {
  pair: MarketPair;
  showSparkline?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  favoriteDisabled?: boolean;
}

/** Dense, data-focused row; asset tint comes from the market data. */
export const MarketItem = memo(function MarketItem({
  pair,
  showSparkline = true,
  isFavorite = false,
  onFavoriteToggle,
  favoriteDisabled = false,
}: MarketItemProps) {
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const isPositive = pair.change24h > 0;
  const isNegative = pair.change24h < 0;

  return (
    <div
      className="flex items-center gap-3 px-5 w-full"
      style={{
        borderBottom: `1px solid ${c.divider}`,
      }}
    >
      <Link
        to={`${prefix}/pair/${encodeURIComponent(pair.id)}`}
        aria-label={`${pair.symbol} — ${fmtPriceUtil(pair.price)}`}
        className="flex flex-1 min-w-0 items-center gap-3 active:opacity-70 transition-opacity cursor-pointer"
        style={{ paddingTop: 14, paddingBottom: 14 }}
      >
        {/* Asset logo tint is market data, not a semantic status color. */}
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{
            width: 'var(--φ-avatar-sm)',
            height: 'var(--φ-avatar-sm)',
            background: hexToRgba(pair.logoColor, 15),
            border: `1.5px solid ${hexToRgba(pair.logoColor, 30)}`,
          }}
        >
          <span style={{ color: c.text1, fontSize: FONT_SCALE.xs, fontWeight: FONT_WEIGHT.bold }}>
            {pair.baseAsset.slice(0, 3)}
          </span>
        </div>

        {/* Name */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span
            className="text-truncate"
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              maxWidth: '100%',
            }}
          >
            {pair.baseAsset}
          </span>
          <span
            className="text-truncate"
            style={{ color: c.text3, fontSize: FONT_SCALE.xs, maxWidth: '100%' }}
          >
            {pair.quoteAsset}
          </span>
        </div>

        {/* Sparkline */}
        {showSparkline && (
          <div className="shrink-0">
            <SparklineChart data={pair.sparklineData} isPositive={isPositive} />
          </div>
        )}

        {/* Price + Change */}
        <div className="flex flex-col items-end shrink-0">
          <span
            style={{
              color: c.text1,
              fontSize: FONT_SCALE.sm,
              fontWeight: FONT_WEIGHT.semibold,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {fmtPriceUtil(pair.price)}
          </span>
          <span
            className="rounded-lg px-2 py-1"
            style={{
              background: isPositive ? c.buyAlpha10 : isNegative ? c.sellAlpha10 : c.surface2,
              color: isPositive ? c.successText : isNegative ? c.errorText : c.text2,
              fontSize: FONT_SCALE.xs,
              fontWeight: FONT_WEIGHT.semibold,
            }}
          >
            {fmtPct(pair.change24h)}
          </span>
        </div>
      </Link>

      {/* Star */}
      {onFavoriteToggle && (
        <button
          type="button"
          disabled={favoriteDisabled}
          onClick={() => onFavoriteToggle(pair.id)}
          className="ml-1 w-8 h-8 flex items-center justify-center shrink-0"
          aria-label={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
          aria-pressed={isFavorite}
        >
          <Star
            size={14}
            fill={isFavorite ? c.primary : 'none'}
            color={isFavorite ? c.primary : c.text3}
          />
        </button>
      )}
    </div>
  );
});
