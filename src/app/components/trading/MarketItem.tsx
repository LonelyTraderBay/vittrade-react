import React, { memo } from 'react';
import { useNavigate } from 'react-router';
import { Star } from 'lucide-react';
import { CryptoPair } from '../../data/mockData';
import { SparklineChart } from './SparklineChart';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtPrice as fmtPriceUtil, fmtPct } from '../../data/formatNumber';
import { hexToRgba } from '../../utils/helpers/string';

interface MarketItemProps {
  pair: CryptoPair;
  showSparkline?: boolean;
  onFavoriteToggle?: (id: string) => void;
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
export const MarketItem = memo(function MarketItem({ pair, showSparkline = true, onFavoriteToggle }: MarketItemProps) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const prefix = useRoutePrefix();
  const isPositive = pair.change24h >= 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`${prefix}/pair/${pair.id}`)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`${prefix}/pair/${pair.id}`); }}
      className="flex items-center gap-3 px-5 w-full active:opacity-70 transition-opacity cursor-pointer"
      style={{
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: `1px solid ${c.divider}`,
      }}
      aria-label={`${pair.symbol} — ${fmtPriceUtil(pair.price)}`}
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
        <span style={{ color: pair.logoColor, fontSize: 12, fontWeight: 700 }}>
          {pair.baseAsset.slice(0, 3)}
        </span>
      </div>

      {/* Name */}
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="text-truncate" style={{ color: c.text1, fontSize: 14, fontWeight: 600, maxWidth: '100%' }}>
          {pair.baseAsset}
        </span>
        <span className="text-truncate" style={{ color: c.text3, fontSize: 12, maxWidth: '100%' }}>
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
        <span style={{
          color: c.text1,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
        }}>
          {fmtPriceUtil(pair.price)}
        </span>
        <span
          className="rounded-lg px-2 py-1"
          style={{
            background: isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: isPositive ? '#10B981' : '#EF4444',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {fmtPct(pair.change24h)}
        </span>
      </div>

      {/* Star */}
      {onFavoriteToggle && (
        <button
          onClick={e => { e.stopPropagation(); onFavoriteToggle(pair.id); }}
          className="ml-1 w-8 h-8 flex items-center justify-center shrink-0"
          aria-label={pair.isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          <Star
            size={14}
            fill={pair.isFavorite ? '#F59E0B' : 'none'}
            color={pair.isFavorite ? '#F59E0B' : c.text3}
          />
        </button>
      )}
    </div>
  );
});