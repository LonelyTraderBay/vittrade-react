import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, Filter, Star, Clock, Shield, X, ChevronRight,
  CreditCard, AlertTriangle, Award, Plus, HelpCircle, LayoutDashboard,
  Zap, TrendingUp, Users, Activity, BarChart3,
  Settings, BookOpen,
  Heart, Share2, GitCompare, MoreHorizontal, Eye, Flag,
  RefreshCw, ShieldCheck, Scale, Trophy, GraduationCap, ListOrdered,
  ArrowRight, CircleDot, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { P2P_ADS, P2PAd, P2P_USER_LEVEL, P2P_TRADING_LEVELS, P2P_PLATFORM_STATS } from '../../data/mockData';
import { EmptyState } from '../../components/states/EmptyState';
import { ErrorState } from '../../components/states/ErrorState';
import { OfflineBanner } from '../../components/states/OfflineBanner';
import { useHaptic } from '../../hooks/useHaptic';
import { useActionToast } from '../../hooks/useActionToast';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { fmtVnd, fmtAmount, fmtPct, fmtCompact } from '../../data/formatNumber';
import { φ } from '../../utils/golden';
import { TrCard } from '../../components/ui/TrCard';
import { PullToRefresh } from '../../components/ui/PullToRefresh';
import { SearchBar } from '../../components/ui/SearchBar';
import { TrInput } from '../../components/ui/TrInput';
import { useRefresh } from '../../hooks/useRefresh';
import { TOAST } from '../../data/toastMessages';
import { BottomSheetV2 } from '../../components/ui/BottomSheetV2';
import { useSheetAnalytics } from '../../hooks/useSheetAnalytics';
import { Header } from '../../components/layout/Header';
import { PageContent } from '../../components/layout/PageContent';
import { TabBar } from '../../components/layout/TabBar';

/* ═══════════════════════════════════════════════════════════
   Market price lookup
   ═══════════════════════════════════════════════════════════ */
const MARKET_PRICES: Record<string, number> = {
  USDT: 25_300, BTC: 1_715_000_000, ETH: 89_000_000, BNB: 15_200_000, SOL: 4_800_000,
};

/* ═══════════════════════════════════════════════════════════
   SwipeableAdCard — Swipe-to-favourite + Long-press context
   ═══════════════════════════════════════════════════════════ */
function SwipeableAdCard({
  ad, tradeType, prefix, index,
  isFav, onToggleFav, onContextMenu, onQuickAction,
}: {
  ad: P2PAd; tradeType: 'buy' | 'sell'; prefix: string; index: number;
  isFav: boolean;
  onToggleFav: (ad: P2PAd) => void;
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
  const didSwipeAction = useRef(false);

  const marketPrice = MARKET_PRICES[ad.asset] ?? 25_300;
  const margin = ((ad.price - marketPrice) / marketPrice) * 100;

  const badgeConfig = ad.merchantBadge === 'elite'
    ? { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Elite' }
    : ad.merchantBadge === 'pro'
      ? { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Pro' }
      : null;

  const avatarGradient = ad.merchantBadge === 'elite'
    ? 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)'
    : ad.merchantBadge === 'pro'
      ? 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)'
      : 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)';

  /* ─── Swipe handlers ─── */
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    didSwipeAction.current = false;
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
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    }

    // Only allow horizontal swipe (ignore vertical scroll)
    if (Math.abs(dy) > Math.abs(dx) * 0.8) return;

    const clamped = Math.max(-100, Math.min(100, dx));
    setSwipeX(clamped);
    setSwiping(true);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }

    // Swipe left threshold → favourite toggle
    if (swipeX < -60) {
      hapticSelection();
      onToggleFav(ad);
      didSwipeAction.current = true;
    }
    // Swipe right threshold → quick buy/sell
    if (swipeX > 60) {
      hapticSelection();
      onQuickAction(ad, tradeType);
      didSwipeAction.current = true;
    }

    setSwipeX(0);
    setSwiping(false);
    touchStart.current = null;
  };

  // Swipe reveal layer colors
  const leftRevealColor = tradeType === 'buy' ? c.buy : c.sell;
  const rightRevealColor = isFav ? c.text3 : c.warn;

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

      {/* Swipe reveal layer — RIGHT (favourite) */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-2xl"
        style={{ background: rightRevealColor, opacity: swipeX < -20 ? 0.95 : 0 }}
      >
        <div className="flex flex-col items-center gap-1">
          <Heart size={20} color="#fff" fill={isFav ? '#fff' : 'none'} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>
            {isFav ? 'Bỏ thích' : 'Yêu thích'}
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
        <TrCard hover className="p-4" accentBorder={isFav ? 'rgba(245,158,11,0.25)' : undefined}>
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
                  <span className="truncate" style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                    {ad.merchant}
                  </span>
                  {ad.merchantVerified && <Shield size={11} color={c.primary} fill={c.primaryAlpha20} />}
                  {badgeConfig && (
                    <span
                      className="px-1.5 py-px rounded flex-shrink-0"
                      style={{ background: badgeConfig.bg, color: badgeConfig.color, fontWeight: 700, fontSize: 9 }}
                    >
                      {badgeConfig.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span style={{ color: c.text3, fontSize: 10 }}>{ad.completedOrders} đơn</span>
                  <span style={{ color: c.text3, fontSize: 10 }}>·</span>
                  <span style={{ color: c.buy, fontSize: 10, fontWeight: 600 }}>{ad.completionRate}%</span>
                  {ad.merchantRating && (
                    <div className="flex items-center gap-0.5">
                      <Star size={9} fill="#F59E0B" color="#F59E0B" />
                      <span style={{ color: c.text3, fontSize: 10 }}>{ad.merchantRating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Favourite indicator + Context menu trigger + CTA */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isFav && (
                <Heart size={14} color="#F59E0B" fill="#F59E0B" className="shrink-0" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); hapticSelection(); onContextMenu(ad); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: c.surface2, minWidth: 28, minHeight: 28 }}
              >
                <MoreHorizontal size={14} color={c.text3} />
              </button>
              <button
                onClick={() => navigate(`${prefix}/p2p/ad/${ad.id}`)}
                className="flex-shrink-0 px-4 py-2 rounded-xl"
                style={{
                  background: tradeType === 'buy'
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
            <span style={{ color: c.text1, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>
              {fmtVnd(ad.price)}
            </span>
            <span style={{ color: c.text3, fontSize: 11 }}>{ad.currency}</span>
            <span style={{ color: margin >= 0 ? c.buy : c.primary, fontSize: 10, fontWeight: 600 }}>
              {margin >= 0 ? '+' : ''}{fmtPct(margin)}
            </span>
            {ad.priceType === 'floating' && (
              <span
                className="px-1.5 py-px rounded"
                style={{ background: 'rgba(168,85,247,0.1)', color: '#A855F7', fontSize: φ.xs, fontWeight: 600 }}
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
            <span style={{ color: c.text2, fontFamily: 'monospace', fontSize: 10, fontWeight: 600 }}>
              {fmtAmount(ad.available)} {ad.asset}
            </span>
          </div>

          {/* Row 4: Payment methods + response time */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {ad.paymentMethods.slice(0, 3).map(pm => (
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
            <div className="flex items-center justify-center gap-3 mt-3 pt-2.5" style={{ borderTop: `1px solid ${c.divider}` }}>
              <span style={{ color: c.text3, fontSize: 9, opacity: 0.6 }}>← vuốt phải: mua nhanh</span>
              <span style={{ color: c.text3, fontSize: 9, opacity: 0.3 }}>|</span>
              <span style={{ color: c.text3, fontSize: 9, opacity: 0.6 }}>vuốt trái: yêu thích →</span>
            </div>
          )}

          {/* New merchant warning */}
          {ad.isNewMerchant && (
            <div
              className="flex items-center gap-1.5 mt-2.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: c.warnAlpha10, border: `1px solid ${c.warnAlpha15}` }}
            >
              <AlertTriangle size={10} color={c.warn} />
              <span style={{ color: c.warn, fontSize: φ.xs }}>Merchant mới — kiểm tra kỹ trước khi giao dịch</span>
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
function ContextMenuSheet({
  ad, isOpen, onClose, tradeType, isFav,
  onToggleFav, onShare, onCompare, onQuickAction, onViewMerchant,
  prefix, onAfterOpen,
}: {
  ad: P2PAd | null; isOpen: boolean; onClose: () => void;
  tradeType: 'buy' | 'sell'; isFav: boolean;
  onToggleFav: () => void; onShare: () => void;
  onCompare: () => void; onQuickAction: () => void;
  onViewMerchant: () => void;
  prefix: string;
  onAfterOpen?: () => void;
}) {
  const c = useThemeColors();
  const navigate = useNavigate();

  if (!ad) return null;

  const menuItems = [
    {
      icon: isFav ? Heart : Heart,
      label: isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích',
      color: isFav ? c.sell : c.warn,
      fill: isFav,
      action: onToggleFav,
    },
    {
      icon: Zap,
      label: tradeType === 'buy' ? `Mua nhanh ${ad.asset}` : `Bán nhanh ${ad.asset}`,
      color: tradeType === 'buy' ? c.buy : c.sell,
      action: onQuickAction,
    },
    {
      icon: Share2,
      label: 'Chia sẻ offer',
      color: c.primary,
      action: onShare,
    },
    {
      icon: GitCompare,
      label: 'So sánh giá',
      color: '#8B5CF6',
      action: onCompare,
    },
    {
      icon: Eye,
      label: 'Xem hồ sơ merchant',
      color: c.text2,
      action: onViewMerchant,
    },
    {
      icon: Flag,
      label: 'Báo cáo offer',
      color: c.sell,
      action: () => { onClose(); navigate(`${prefix}/p2p/report/${ad.merchantId}`); },
    },
  ];

  const customHeader = (
    <div className="flex items-center gap-3 mb-5 px-1">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: ad.merchantBadge === 'elite'
            ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
            : ad.merchantBadge === 'pro'
              ? 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
              : 'linear-gradient(135deg, #3B82F6, #60A5FA)',
        }}
      >
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{ad.merchant.charAt(0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate" style={{ color: c.text1, fontSize: 14, fontWeight: 700 }}>{ad.merchant}</p>
        <p style={{ color: c.text3, fontSize: 11 }}>
          {fmtVnd(ad.price)} {ad.currency} · {fmtAmount(ad.available)} {ad.asset}
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: c.surface2 }}
        aria-label="Đóng"
      >
        <X size={14} color={c.text3} />
      </button>
    </div>
  );

  return (
    <BottomSheetV2
      open={isOpen}
      onClose={onClose}
      variant="center"
      customHeader={customHeader}
      showCloseButton={false}
      ariaLabel={`Tuỳ chọn ${ad.merchant}`}
      onAfterOpen={onAfterOpen}
    >
      {/* Menu items */}
      <div className="flex flex-col gap-1">
        {menuItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => { item.action(); onClose(); }}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl active:opacity-70"
            style={{
              background: c.surface2,
              minHeight: 48,
              borderBottom: i === menuItems.length - 2 ? `1px solid ${c.divider}` : 'none',
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${item.color}15` }}
            >
              <item.icon
                size={16}
                color={item.color}
                fill={item.label.includes('Bỏ yêu thích') ? item.color : 'none'}
              />
            </div>
            <span style={{ color: item.label.includes('Báo cáo') ? c.sell : c.text1, fontSize: 13, fontWeight: 600 }}>
              {item.label}
            </span>
            <ChevronRight size={14} color={c.text3} className="ml-auto" />
          </button>
        ))}
      </div>
    </BottomSheetV2>
  );
}

/* ═══════════════════════════════════════════════════════════
   CompareBar — Floating comparison bar
   ═══════════════════════════════════════════════════════════ */
function CompareBar({
  items, onClear, onView,
}: {
  items: P2PAd[]; onClear: () => void; onView: () => void;
}) {
  const c = useThemeColors();

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
          {items.map(a => a.merchant).join(' vs ')}
        </p>
      </div>
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

/* ═══════════════════════════════════════════════════════════
   Config
   ═══════════════════════════════════════════════════════════ */
const ASSETS = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'] as const;
const FIAT_CURRENCIES = ['VND', 'USD'] as const;
const SORT_OPTIONS = [
  { id: 'price' as const, label: 'Giá tốt nhất' },
  { id: 'completion' as const, label: 'Tỷ lệ hoàn thành' },
  { id: 'orders' as const, label: 'Số đơn nhiều nhất' },
];

/* ═══════════════════════════════════════════════════════════
   P2P Home Page
   ═══════════════════════════════════════════════════════════ */
export function P2PHomePage() {
  const navigate = useNavigate();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const actionToast = useActionToast();
  const prefix = useRoutePrefix();

  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState('USDT');
  const [fiatCurrency, setFiatCurrency] = useState('VND');
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'completion' | 'orders'>('price');
  const [filterPayment, setFilterPayment] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [merchantType, setMerchantType] = useState<'all' | 'elite' | 'pro' | 'verified'>('all');
  const [showQuickActions, setShowQuickActions] = useState(false);

  /* ─── NEW: Favourite, Context Menu, Compare states ─── */
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [contextMenuAd, setContextMenuAd] = useState<P2PAd | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [compareList, setCompareList] = useState<P2PAd[]>([]);

  /* ─── Scroll lock now handled by BottomSheetV2 internally ─── */

  /* ─── Sheet Analytics ─── */
  const { onAfterOpen: onQuickActionsOpen } = useSheetAnalytics('p2p-home-quick-actions');
  const { onAfterOpen: onContextMenuOpen } = useSheetAnalytics('p2p-home-context-menu');

  /* ─── Favourite toggle with undo toast ─── */
  const handleToggleFav = useCallback((ad: P2PAd) => {
    const wasFav = favourites.has(ad.id);

    setFavourites(prev => {
      const next = new Set(prev);
      if (wasFav) next.delete(ad.id);
      else next.add(ad.id);
      return next;
    });

    if (wasFav) {
      // Unfavourite → toast with UNDO
      toast(TOAST.P2P.FAVORITE_REMOVED(ad.merchant), {
        duration: 4000,
        action: {
          label: 'Hoàn tác',
          onClick: () => {
            setFavourites(prev => {
              const next = new Set(prev);
              next.add(ad.id);
              return next;
            });
            toast.success(TOAST.P2P.FAVORITE_ADDED(ad.merchant), { duration: 1500 });
          },
        },
      });
    } else {
      // Add favourite → simple success toast
      actionToast.success(TOAST.P2P.FAVORITE_ADDED(ad.merchant));
    }
  }, [favourites, actionToast]);

  /* ─── Quick buy/sell action ─── */
  const handleQuickAction = useCallback((ad: P2PAd, type: 'buy' | 'sell') => {
    if (type === 'buy') {
      toast.success(TOAST.P2P.QUICK_BUY_STARTED(ad.asset, ad.merchant), {
        duration: 2000,
        action: {
          label: 'Xem đơn',
          onClick: () => navigate(`${prefix}/p2p/ad/${ad.id}`),
        },
      });
    } else {
      toast.success(TOAST.P2P.QUICK_SELL_STARTED(ad.asset, ad.merchant), {
        duration: 2000,
        action: {
          label: 'Xem đơn',
          onClick: () => navigate(`${prefix}/p2p/ad/${ad.id}`),
        },
      });
    }
  }, [navigate, prefix]);

  /* ─── Context menu actions ─── */
  const handleContextMenu = useCallback((ad: P2PAd) => {
    setContextMenuAd(ad);
    setShowContextMenu(true);
  }, []);

  const handleShareOffer = useCallback(() => {
    if (!contextMenuAd) return;
    actionToast.success(TOAST.P2P.SHARE_COPIED);
  }, [contextMenuAd, actionToast]);

  const handleCompare = useCallback(() => {
    if (!contextMenuAd) return;
    setCompareList(prev => {
      if (prev.find(a => a.id === contextMenuAd.id)) return prev;
      if (prev.length >= 3) {
        toast.warning('Tối đa 3 offer so sánh cùng lúc', { duration: 1500 });
        return prev;
      }
      return [...prev, contextMenuAd];
    });
    actionToast.info(TOAST.P2P.COMPARE_ADDED(contextMenuAd.merchant));
  }, [contextMenuAd, actionToast]);

  const handleClearCompare = useCallback(() => {
    setCompareList([]);
    actionToast.info(TOAST.P2P.COMPARE_CLEARED);
  }, [actionToast]);

  const handleViewMerchant = useCallback(() => {
    if (!contextMenuAd) return;
    navigate(`${prefix}/p2p/merchant/${contextMenuAd.merchantId}`);
  }, [contextMenuAd, navigate, prefix]);

  const userLevel = P2P_USER_LEVEL;
  const currentLevelData = P2P_TRADING_LEVELS.find(l => l.id === userLevel.currentLevel);

  const allPaymentMethods = useMemo(() => {
    const set = new Set<string>();
    P2P_ADS.forEach(ad => ad.paymentMethods.forEach(pm => set.add(pm)));
    return Array.from(set);
  }, []);

  const ads = useMemo(() => {
    let filtered = P2P_ADS
      .filter(ad => ad.type === (tab === 'buy' ? 'sell' : 'buy'))
      .filter(ad => ad.asset === asset)
      .filter(ad => ad.status === 'active');

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(ad => ad.merchant.toLowerCase().includes(q));
    }
    if (filterPayment) {
      filtered = filtered.filter(ad => ad.paymentMethods.includes(filterPayment));
    }
    if (merchantType !== 'all') {
      if (merchantType === 'elite') filtered = filtered.filter(ad => ad.merchantBadge === 'elite');
      else if (merchantType === 'pro') filtered = filtered.filter(ad => ad.merchantBadge === 'pro');
      else if (merchantType === 'verified') filtered = filtered.filter(ad => ad.merchantVerified);
    }
    if (amountInput) {
      const amt = parseFloat(amountInput);
      if (amt > 0) filtered = filtered.filter(ad => amt >= ad.minLimit && amt <= ad.maxLimit);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'price') return tab === 'buy' ? a.price - b.price : b.price - a.price;
      if (sortBy === 'completion') return b.completionRate - a.completionRate;
      return b.completedOrders - a.completedOrders;
    });

    return filtered;
  }, [tab, asset, searchText, filterPayment, sortBy, amountInput, merchantType]);

  const activeFilterCount = [
    filterPayment, merchantType !== 'all', amountInput, sortBy !== 'price',
  ].filter(Boolean).length;

  const handleTabSwitch = useCallback((newTab: 'buy' | 'sell') => {
    setTab(newTab);
    hapticSelection();
  }, [hapticSelection]);

  const { refresh, lastRefreshedLabel, refreshCount } = useRefresh();
  const [hasError, setHasError] = useState(false);

  return (
    <PullToRefresh onRefresh={refresh} lastRefreshedLabel={lastRefreshedLabel} refreshCount={refreshCount} className="min-h-full pb-4">
      {/* Offline / Error states (§18.1) */}
      <OfflineBanner showStaleHint />
      {hasError && (
        <div className="px-5 py-8">
          <ErrorState
            title="Không thể tải P2P"
            subtitle="Kiểm tra kết nối mạng rồi thử lại"
            onRetry={() => { setHasError(false); refresh(); }}
          />
        </div>
      )}
      {/* Header — variant="page" module index (§21.4) */}
      <Header
        variant="page"
        title="P2P"
        subtitle={`Lv.${userLevel.currentLevel} · P2P Trading`}
        back
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center justify-center hover-ghost"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: c.searchBg, border: `1px solid ${c.border}`,
              }}
              aria-label="Tuỳ chọn P2P"
            >
              <Plus size={18} color={c.text1} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => navigate(`${prefix}/p2p/my-orders`)}
              className="flex items-center justify-center hover-ghost"
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: c.searchBg, border: `1px solid ${c.border}`,
              }}
              aria-label="Lịch sử lệnh"
            >
              <Clock size={18} color={c.text1} strokeWidth={1.8} />
            </button>
          </div>
        }
      />

      {/* Quick Actions — BottomSheetV2 center "Tuỳ chọn P2P" */}
      <BottomSheetV2
        open={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        variant="center"
        title="Tuỳ chọn P2P"
        maxHeight="calc(100vh - 24px)"
        ariaLabel="Tuỳ chọn P2P"
        onAfterOpen={onQuickActionsOpen}
      >
        {/* User Level Summary */}
        <button
          onClick={() => { navigate(`${prefix}/p2p/trading-level`); setShowQuickActions(false); }}
          className="flex items-center gap-3 w-full mb-5 p-3 rounded-2xl"
          style={{ background: c.surface2, border: `1px solid ${c.borderSolid}` }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: currentLevelData?.gradient || 'linear-gradient(135deg, #3B82F6, #60A5FA)' }}
          >
            <Award size={18} color="#fff" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>
                Lv.{userLevel.currentLevel} Nâng cao
              </span>
              <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 10, fontWeight: 600 }}>
                Phí 0.15%
              </span>
            </div>
            <p style={{ color: '#10B981', fontSize: 11, marginTop: 2 }}>
              Hạn mức: 45,000,000 VND / 500,000,000 VND
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600 }}>Lên Lv.4</span>
            <ChevronRight size={12} color="#3B82F6" />
          </div>
        </button>

        {/* ─── Giao dịch ─── */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1 h-3.5 rounded-full" style={{ background: 'linear-gradient(180deg, #3B82F6, #60A5FA)' }} />
          <span style={{ color: c.text2, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>Giao dịch</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: CreditCard, label: 'Thanh toán', color: '#8B5CF6', path: `${prefix}/p2p/payment-methods` },
            { icon: ListOrdered, label: 'Sổ lệnh', color: '#3B82F6', path: `${prefix}/p2p/order-book` },
            { icon: Clock, label: 'Lịch sử', color: '#6B7280', path: `${prefix}/p2p/my-orders` },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setShowQuickActions(false); hapticSelection(); }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-[0.97]"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                minHeight: 80,
                transition: 'transform 0.15s ease',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}12` }}>
                <item.icon size={20} color={item.color} />
              </div>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Phân tích ─── */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1 h-3.5 rounded-full" style={{ background: 'linear-gradient(180deg, #F59E0B, #FBBF24)' }} />
          <span style={{ color: c.text2, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>Phân tích</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', color: '#F59E0B', path: `${prefix}/p2p/dashboard` },
            { icon: Star, label: 'Xếp hạng', color: '#F59E0B', path: `${prefix}/p2p/reviews` },
            { icon: Trophy, label: 'Thành tích', color: '#F59E0B', path: `${prefix}/p2p/achievements` },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setShowQuickActions(false); hapticSelection(); }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-[0.97]"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                minHeight: 80,
                transition: 'transform 0.15s ease',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}12` }}>
                <item.icon size={20} color={item.color} />
              </div>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* ─── An toàn & Hỗ trợ ─── */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1 h-3.5 rounded-full" style={{ background: 'linear-gradient(180deg, #10B981, #34D399)' }} />
          <span style={{ color: c.text2, fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}>An toàn & Hỗ trợ</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ShieldCheck, label: 'Bảo hiểm', color: '#10B981', path: `${prefix}/p2p/insurance-fund` },
            { icon: Scale, label: 'Tranh chấp', color: '#EF4444', path: `${prefix}/p2p/disputes` },
            { icon: GraduationCap, label: 'Cấp bậc', color: '#6B7280', path: `${prefix}/p2p/trading-level` },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setShowQuickActions(false); hapticSelection(); }}
              className="flex flex-col items-center gap-2 py-4 rounded-2xl active:scale-[0.97]"
              style={{
                background: c.surface2,
                border: `1px solid ${c.borderSolid}`,
                minHeight: 80,
                transition: 'transform 0.15s ease',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}12` }}>
                <item.icon size={20} color={item.color} />
              </div>
              <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* ─── FAQ Banner ─── */}
        <button
          onClick={() => { navigate(`${prefix}/p2p/guide`); setShowQuickActions(false); hapticSelection(); }}
          className="flex items-center gap-3 w-full mt-4 px-4 py-3 rounded-xl active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.04) 100%)',
            border: `1px solid rgba(139,92,246,0.12)`,
            transition: 'transform 0.15s ease',
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <HelpCircle size={16} color="#8B5CF6" />
          </div>
          <div className="flex-1 text-left">
            <span style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>Câu hỏi thường gặp</span>
            <p style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>Hướng dẫn giao dịch P2P an toàn</p>
          </div>
          <ChevronRight size={14} color={c.text3} />
        </button>
      </BottomSheetV2>

      <PageContent padding="compact">
      {/* ═══ P2P Hub Card — Enterprise Fintech ═══ */}
      <div className="rounded-2xl overflow-hidden" style={{
        background: c.surface,
        border: `1px solid ${c.borderSolid}`,
        boxShadow: `0 4px 20px ${c.shadow}, 0 1px 3px rgba(0,0,0,0.04)`,
      }}>
        {/* ─── Hero Section: Gradient Header ─── */}
        <div className="relative px-4 pt-4 pb-3" style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.06) 50%, rgba(139,92,246,0.04) 100%)',
        }}>
          {/* Decorative dots */}
          <div className="absolute top-2 right-3 flex items-center gap-1 opacity-30">
            <CircleDot size={8} color={c.text3} />
            <CircleDot size={6} color={c.text3} />
            <CircleDot size={4} color={c.text3} />
          </div>

          {/* Title row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #10B981, #3B82F6)',
            }}>
              <Sparkles size={12} color="#fff" />
            </div>
            <span style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Thao tác nhanh</span>
            <div className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full" style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.15)',
            }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
              <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>Live</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate(`${prefix}/p2p/express`)}
              className="relative flex items-center gap-3 px-3.5 py-3 rounded-xl active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(59,130,246,0.08) 100%)',
                border: '1px solid rgba(16,185,129,0.2)',
                transition: 'transform 0.15s ease',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              }}>
                <Zap size={18} color="#fff" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Express Trade</p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 1, lineHeight: 1.3 }}>Auto match · 1 chạm</p>
              </div>
              <ArrowRight size={14} color="#10B981" className="shrink-0" />
            </button>

            <button
              onClick={() => { navigate(`${prefix}/p2p/create`); hapticSelection(); }}
              className="relative flex items-center gap-3 px-3.5 py-3 rounded-xl active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)',
                border: '1px solid rgba(59,130,246,0.18)',
                transition: 'transform 0.15s ease',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
              }}>
                <Plus size={18} color="#fff" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>Đăng offer</p>
                <p style={{ color: c.text3, fontSize: 10, marginTop: 1, lineHeight: 1.3 }}>Tạo quảng cáo P2P</p>
              </div>
              <ArrowRight size={14} color="#3B82F6" className="shrink-0" />
            </button>
          </div>
        </div>

        {/* ─── Stats Section ─── */}
        <div className="px-4 py-3" style={{
          borderTop: `1px solid ${c.divider}`,
          background: c.surface2,
        }}>
          {/* Stats Grid — 3 columns */}
          <div className="grid grid-cols-3 gap-0">
            <div className="flex flex-col items-center py-1.5" style={{ borderRight: `1px solid ${c.divider}` }}>
              <div className="flex items-center gap-1 mb-1">
                <Activity size={10} color="#3B82F6" />
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 500 }}>Volume 24h</span>
              </div>
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', letterSpacing: -0.5 }}>
                {fmtCompact(P2P_PLATFORM_STATS.volume24h, { prefix: '₫' })}
              </span>
              <span style={{ color: '#10B981', fontSize: 10, fontWeight: 700, marginTop: 1 }}>
                +{fmtPct(P2P_PLATFORM_STATS.volume24hChange)}
              </span>
            </div>

            <div className="flex flex-col items-center py-1.5" style={{ borderRight: `1px solid ${c.divider}` }}>
              <div className="flex items-center gap-1 mb-1">
                <Users size={10} color="#10B981" />
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 500 }}>Online</span>
              </div>
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', letterSpacing: -0.5 }}>
                {P2P_PLATFORM_STATS.onlineTraders.toLocaleString()}
              </span>
              <span style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>traders</span>
            </div>

            <div className="flex flex-col items-center py-1.5">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp size={10} color="#F59E0B" />
                <span style={{ color: c.text3, fontSize: 9, fontWeight: 500 }}>Completion</span>
              </div>
              <span style={{ color: c.text1, fontSize: 14, fontWeight: 700, fontFamily: 'monospace', letterSpacing: -0.5 }}>
                {P2P_PLATFORM_STATS.avgCompletionRate}%
              </span>
              <span style={{ color: c.text3, fontSize: 10, marginTop: 1 }}>avg {P2P_PLATFORM_STATS.avgCompletionTime}</span>
            </div>
          </div>

          {/* Bottom row: secondary stats */}
          <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${c.divider}` }}>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)' }}>
                <BarChart3 size={10} color="#8B5CF6" />
              </div>
              <span style={{ color: c.text2, fontSize: 11 }}>
                <span style={{ fontWeight: 700, fontFamily: 'monospace', color: c.text1 }}>{P2P_PLATFORM_STATS.totalTrades24h.toLocaleString()}</span>
                {' '}trades · {P2P_PLATFORM_STATS.activeMerchants} merchants
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.1)',
            }}>
              <Shield size={10} color="#10B981" />
              <span style={{ color: '#10B981', fontSize: 10, fontWeight: 600 }}>
                {fmtCompact(P2P_PLATFORM_STATS.escrowProtected, { prefix: '₫' })} Escrow
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Buy/Sell Toggle */}
      <TabBar
        variant="segment"
        tabs={[
          { id: 'buy', label: 'MUA' },
          { id: 'sell', label: 'BÁN' },
        ]}
        active={tab}
        onChange={(t) => handleTabSwitch(t as 'buy' | 'sell')}
        colors={{ buy: '#10B981', sell: '#EF4444' }}
      />

      {/* Asset + Fiat Row */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {ASSETS.map(a => (
            <button
              key={a}
              onClick={() => { setAsset(a); hapticSelection(); }}
              className="px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{
                background: asset === a ? c.chipActiveBg : 'transparent',
                color: asset === a ? c.chipActiveText : c.text3,
                border: `1px solid ${asset === a ? c.chipActiveBorder : 'transparent'}`,
                fontWeight: 600, fontSize: 12,
              }}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="w-px h-4" style={{ background: c.border }} />
        {FIAT_CURRENCIES.map(cur => (
          <button
            key={cur}
            onClick={() => { setFiatCurrency(cur); hapticSelection(); }}
            className="px-2 py-1.5 rounded-lg flex-shrink-0"
            style={{
              background: fiatCurrency === cur ? c.primaryAlpha12 : 'transparent',
              color: fiatCurrency === cur ? c.primary : c.text3,
              fontWeight: 600, fontSize: 11,
            }}
          >
            {cur}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <SearchBar
        value={searchText}
        onChange={setSearchText}
        placeholder="Tìm merchant..."
        variant="compact"
        filterActive={showFilters}
        onFilterToggle={() => { setShowFilters(!showFilters); hapticSelection(); }}
        filterIcon={Filter}
      />

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden mb-3"
          >
            <TrCard className="p-4">
              <div className="mb-4">
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Sắp xếp</p>
                <div className="flex gap-1.5">
                  {SORT_OPTIONS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSortBy(s.id); hapticSelection(); }}
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: sortBy === s.id ? c.chipActiveBg : c.chipBg,
                        color: sortBy === s.id ? c.chipActiveText : c.chipText,
                        border: `1px solid ${sortBy === s.id ? c.chipActiveBorder : c.chipBorder}`,
                        fontWeight: 600, fontSize: 10,
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Loại merchant</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { id: 'all' as const, label: 'Tất cả' },
                    { id: 'elite' as const, label: 'Elite', color: '#F59E0B' },
                    { id: 'pro' as const, label: 'Pro', color: '#8B5CF6' },
                    { id: 'verified' as const, label: 'Xác minh', color: '#3B82F6' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setMerchantType(t.id); hapticSelection(); }}
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: merchantType === t.id ? (t.color ? `${t.color}15` : c.chipActiveBg) : c.chipBg,
                        color: merchantType === t.id ? (t.color || c.chipActiveText) : c.chipText,
                        border: `1px solid ${merchantType === t.id ? (t.color ? `${t.color}40` : c.chipActiveBorder) : c.chipBorder}`,
                        fontWeight: 600, fontSize: 10,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p style={{ color: c.text2, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Thanh toán</p>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => { setFilterPayment(''); hapticSelection(); }}
                    className="px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: !filterPayment ? c.chipActiveBg : c.chipBg,
                      color: !filterPayment ? c.chipActiveText : c.chipText,
                      border: `1px solid ${!filterPayment ? c.chipActiveBorder : c.chipBorder}`,
                      fontWeight: 600, fontSize: 10,
                    }}
                  >
                    Tất cả
                  </button>
                  {allPaymentMethods.map(pm => (
                    <button
                      key={pm}
                      onClick={() => { setFilterPayment(filterPayment === pm ? '' : pm); hapticSelection(); }}
                      className="px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: filterPayment === pm ? c.primaryAlpha12 : c.chipBg,
                        color: filterPayment === pm ? c.primary : c.chipText,
                        border: `1px solid ${filterPayment === pm ? c.primaryAlpha30 : c.chipBorder}`,
                        fontWeight: 600, fontSize: 10,
                      }}
                    >
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              <TrInput
                label="Số tiền"
                placeholder={`Nhập số tiền ${fiatCurrency}...`}
                value={amountInput}
                onChange={setAmountInput}
                suffix={fiatCurrency}
                numeric
                size="compact"
                inputMode="decimal"
              />

              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSortBy('price'); setMerchantType('all');
                    setFilterPayment(''); setAmountInput('');
                    hapticSelection();
                  }}
                  className="w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-1"
                  style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}
                >
                  <X size={11} /> Xóa bộ lọc
                </button>
              )}
            </TrCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: c.text2, fontSize: 11 }}>
          {`${ads.length} offer`}
          {sortBy !== 'price' && (
            <span style={{ color: c.text3 }}>
              {' · '}
              {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: c.surface2 }}>
          <Shield size={9} color="#10B981" />
          <span style={{ color: '#10B981', fontSize: 9, fontWeight: 600 }}>Escrow</span>
        </div>
      </div>

      {/* Ads List */}
      <div className="flex flex-col gap-2.5">
        {ads.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Không tìm thấy offer"
            subtitle="Thử thay đổi bộ lọc hoặc tài sản"
          />
        ) : (
          ads.map((ad, i) => (
            <SwipeableAdCard
              key={ad.id}
              ad={ad}
              tradeType={tab}
              prefix={prefix}
              index={i}
              isFav={favourites.has(ad.id)}
              onToggleFav={handleToggleFav}
              onContextMenu={handleContextMenu}
              onQuickAction={handleQuickAction}
            />
          ))
        )}
      </div>
      </PageContent>

      {/* Context Menu Sheet */}
      <ContextMenuSheet
        ad={contextMenuAd}
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        tradeType={tab}
        isFav={contextMenuAd ? favourites.has(contextMenuAd.id) : false}
        onToggleFav={() => { if (contextMenuAd) handleToggleFav(contextMenuAd); }}
        onShare={handleShareOffer}
        onCompare={handleCompare}
        onQuickAction={() => { if (contextMenuAd) handleQuickAction(contextMenuAd, tab); }}
        onViewMerchant={handleViewMerchant}
        prefix={prefix}
        onAfterOpen={onContextMenuOpen}
      />

      {/* Compare Bar */}
      <CompareBar
        items={compareList}
        onClear={handleClearCompare}
        onView={() => toast.info('So sánh chi tiết — Sắp ra mắt!')}
      />
    </PullToRefresh>
  );
}