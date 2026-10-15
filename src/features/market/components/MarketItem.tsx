import React, { memo } from 'react';
import { Link } from 'react-router';
import { Star } from 'lucide-react';
import type { MarketPair } from '../model/market-types';
import { SparklineChart } from '@/shared/ui/charts/SparklineChart';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { useRoutePrefix } from '@/shared/navigation/useRoutePrefix';
import { fmtPrice as fmtPriceUtil, fmtPct } from '@/shared/lib/formatNumber';
import { hexToRgba } from '@/shared/lib/string';

interface MarketItemProps {
  pair: MarketPair;
  showSparkline?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string) => void;
  favoriteDisabled?: boolean;
}

/**
 * ══════════════════════════════════════════════════════════
 *  MARKET ITEM — Enterprise Standard Row (P0-P1-P2 chuẩn)
 * ══════════════════════════════════════════════════════════
 *  Row height: ~64pt (14px top/bottom + 34px avatar)
 *  Avatar: 34px circle with brand color
 *  Typography: 14px body, 12px caption, 14px monospace price
 *  Change badge: rounded-lg px-2 py-1, fontSize 12
 *  Padding: px-5 (20px) container level
 */
export const MarketItem = memo(function MarketItem({
  pair,
  showSparkline = true,
  isFavorite = false,
  onFavoriteToggle,
  favoriteDisabled = false,
}: MarketItemProps) {
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const isPositive = pair.change24h >= 0;

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
        {/* Logo — 34px circle */}
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{
            width: 34,
            height: 34,
            background: hexToRgba(pair.logoColor, 15),
            border: `1.5px solid ${hexToRgba(pair.logoColor, 30)}`,
          }}
        >
          <span style={{ color: c.text1, fontSize: 12, fontWeight: 700 }}>
            {pair.baseAsset.slice(0, 3)}
          </span>
        </div>

        {/* Name */}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span
            className="text-truncate"
            style={{ color: c.text1, fontSize: 14, fontWeight: 600, maxWidth: '100%' }}
          >
            {pair.baseAsset}
          </span>
          <span
            className="text-truncate"
            style={{ color: c.text3, fontSize: 12, maxWidth: '100%' }}
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
              fontSize: 14,
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
            }}
          >
            {fmtPriceUtil(pair.price)}
          </span>
          <span
            className="rounded-lg px-2 py-1"
            style={{
              background: isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: isPositive ? c.successText : c.errorText,
              fontSize: 12,
              fontWeight: 600,
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
