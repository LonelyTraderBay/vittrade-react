import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Clock,
  GitCompare,
  MoreHorizontal,
  Shield,
  Star,
  X,
  Zap,
} from 'lucide-react';
import { fmtAmount, fmtVnd, fmtPct } from '@/shared/lib/formatNumber';
import { φ } from '@/shared/lib/golden';
import { useHaptic } from '@/shared/hooks/useHaptic';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { TrCard } from '@/shared/ui/TrCard';
import type { P2PAd } from '../model/p2p-types';
export function SwipeableAdCard({
  ad,
  tradeType,
  prefix,
  index,
  onContextMenu,
  onQuickAction,
}: {
  ad: P2PAd;
  tradeType: 'buy' | 'sell';
  prefix: string;
  index: number;
  onContextMenu: (ad: P2PAd) => void;
  onQuickAction: (ad: P2PAd, type: 'buy' | 'sell') => void;
}) {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection, hapticMedium } = useHaptic();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const margin =
    ad.referencePrice && ad.referencePrice > 0
      ? ((ad.price - ad.referencePrice) / ad.referencePrice) * 100
      : null;

  const badgeConfig =
    ad.merchantBadge === 'elite'
      ? { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Elite' }
      : ad.merchantBadge === 'pro'
        ? { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Pro' }
        : null;

  const avatarGradient =
    ad.merchantBadge === 'elite'
      ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
      : ad.merchantBadge === 'pro'
        ? 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
        : 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)';

  /* ─── Swipe handlers ─── */
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    longPressTimer.current = setTimeout(() => {
      hapticMedium();
      onContextMenu(ad);
      touchStart.current = null;
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;

    // Cancel long press if finger moves
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    // Only allow horizontal swipe (ignore vertical scroll)
    if (Math.abs(dy) > Math.abs(dx) * 0.8) return;

    const clamped = Math.max(0, Math.min(100, dx));
    setSwipeX(clamped);
    setSwiping(true);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Swipe right threshold → quick buy/sell
    if (swipeX > 60) {
      hapticSelection();
      onQuickAction(ad, tradeType);
    }

    setSwipeX(0);
    setSwiping(false);
    touchStart.current = null;
  };

  // Swipe reveal layer colors
  const leftRevealColor = tradeType === 'buy' ? c.buy : c.sell;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Swipe reveal layer — LEFT (quick buy/sell) */}
      <div
        className="absolute inset-0 flex items-center justify-start pl-5 rounded-2xl"
        style={{ background: leftRevealColor, opacity: swipeX > 20 ? 0.95 : 0 }}
      >
        <div className="flex flex-col items-center gap-1">
          <Zap size={20} color="#fff" />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
            {tradeType === 'buy' ? 'Mua nhanh' : 'Bán nhanh'}
          </span>
        </div>
      </div>

      {/* Card content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <TrCard hover className="p-4">
          {/* Row 1: Merchant + Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: avatarGradient }}
                >
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    {ad.merchant.charAt(0)}
                  </span>
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                  style={{ background: ad.isOnline ? c.buy : c.text3, borderColor: c.surface }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="truncate"
                    style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}
                  >
                    {ad.merchant}
                  </span>
                  {ad.merchantVerified && (
                    <Shield size={11} color={c.primary} fill={c.primaryAlpha20} />
                  )}
                  {badgeConfig && (
                    <span
                      className="px-1.5 py-px rounded flex-shrink-0"
                      style={{
                        background: badgeConfig.bg,
                        color: badgeConfig.color,
                        fontWeight: 700,
                        fontSize: 9,
                      }}
                    >
                      {badgeConfig.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>{ad.completedOrders} đơn</span>
                  <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                  <span style={{ color: c.buy, fontSize: 10, fontWeight: 600 }}>
                    {ad.completionRate}%
                  </span>
                  {ad.merchantRating && (
                    <div className="flex items-center gap-0.5">
                      <Star size={9} fill="#F59E0B" color="#F59E0B" />
                      <span style={{ color: c.text3, fontSize: 10 }}>{ad.merchantRating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Context menu trigger + CTA */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  hapticSelection();
                  onContextMenu(ad);
                }}
                aria-label={`Tuỳ chọn offer của ${ad.merchant}`}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: c.surface2, minWidth: 28, minHeight: 28 }}
              >
                <MoreHorizontal size={14} color={c.text3} />
              </button>
              <button
                onClick={() => navigate(`${prefix}/p2p/ad/${ad.id}`)}
                className="flex-shrink-0 px-4 py-2 rounded-xl"
                style={{
                  background:
                    tradeType === 'buy'
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #EF4444 0%, #dc2626 100%)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {tradeType === 'buy' ? 'Mua' : 'Bán'}
              </button>
            </div>
          </div>

          {/* Row 2: Price */}
          <div className="flex items-baseline gap-2 mb-2">
            <span
              style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}
            >
              {fmtVnd(ad.price)}
            </span>
            <span style={{ color: c.text3, fontSize: 11 }}>{ad.currency}</span>
            {margin !== null && (
              <span
                style={{ color: margin >= 0 ? c.buy : c.primary, fontSize: 10, fontWeight: 600 }}
              >
                {margin >= 0 ? '+' : ''}
                {fmtPct(margin)}
              </span>
            )}
            {ad.priceType === 'floating' && (
              <span
                className="px-1.5 py-px rounded"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  color: '#A855F7',
                  fontSize: φ.xs,
                  fontWeight: 600,
                }}
              >
                Thả nổi
              </span>
            )}
          </div>

          {/* Row 3: Limits + Available */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span style={{ color: c.text3, fontSize: 10 }}>Giới hạn</span>
              <span style={{ color: c.text2, fontFamily: 'monospace', fontSize: 10 }}>
                {fmtVnd(ad.minLimit)} - {fmtVnd(ad.maxLimit)}
              </span>
            </div>
            <span
              style={{ color: c.text2, fontFamily: 'monospace', fontSize: 10, fontWeight: 600 }}
            >
              {fmtAmount(ad.available)} {ad.asset}
            </span>
          </div>

          {/* Row 4: Payment methods + response time */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {ad.paymentMethods.slice(0, 3).map((pm) => (
                <span
                  key={pm}
                  className="px-1.5 py-0.5 rounded"
                  style={{ background: c.surface2, color: c.text2, fontSize: 9, fontWeight: 600 }}
                >
                  {pm}
                </span>
              ))}
              {ad.paymentMethods.length > 3 && (
                <span style={{ color: c.text3, fontSize: 9 }}>+{ad.paymentMethods.length - 3}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Clock size={9} color={c.text3} />
              <span style={{ color: c.text3, fontSize: 9 }}>{ad.avgResponseTime}</span>
            </div>
          </div>

          {/* Swipe hint (subtle, first-time) */}
          {index === 0 && (
            <div
              className="flex items-center justify-center gap-3 mt-3 pt-2.5"
              style={{ borderTop: `1px solid ${c.divider}` }}
            >
              <span style={{ color: c.text3, fontSize: 9, opacity: 0.6 }}>
                ← vuốt phải: mua nhanh
              </span>
            </div>
          )}

          {/* New merchant warning */}
          {ad.isNewMerchant && (
            <div
              className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: c.warnAlpha10, border: `1px solid ${c.warnAlpha15}` }}
            >
              <AlertTriangle size={10} color={c.warn} />
              <span style={{ color: c.warn, fontSize: φ.xs }}>
                Merchant mới — kiểm tra kỹ trước khi giao dịch
              </span>
            </div>
          )}
        </TrCard>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ContextMenuSheet — Bottom sheet for ad actions
   ═══════════════════════════════════════════════════════════ */
export function CompareBar({
  items,
  onClear,
  onView,
}: {
  items: P2PAd[];
  onClear: () => void;
  onView: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-20 left-5 right-5 z-40 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{
        background: 'rgba(139,92,246,0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
      }}
    >
      <GitCompare size={18} color="#fff" />
      <div className="flex-1">
        <p style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
          {items.length} offer đang so sánh
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
          {items.map((a) => a.merchant).join(' vs ')}
        </p>
      </div>
      <button
        onClick={onView}
        className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
        style={{ color: '#fff', background: 'rgba(255,255,255,0.18)' }}
      >
        So sánh
      </button>
      <button
        onClick={onClear}
        className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        <X size={12} color="#fff" />
      </button>
    </motion.div>
  );
}
