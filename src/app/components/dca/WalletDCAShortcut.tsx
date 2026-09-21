/**
 * WalletDCAShortcut - Quick Access to DCA from Wallet
 *
 * Displays DCA summary and provides quick navigation to DCA page.
 * Shows active plans count, total invested, and next execution.
 *
 * Integrated with:
 * - Analytics tracking (impressions, clicks)
 * - Feature flags (show/hide based on rollout)
 * - A/B testing (full vs compact variant)
 * - Funnel tracking (wallet to creation journey)
 *
 * @module components/dca/WalletDCAShortcut
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptic } from '../../hooks/useHaptic';
import { useDCA } from '../../contexts/DCAContext';
import { TrCard } from '../ui/TrCard';
import { φ, φIcon, φAvatar } from '../../utils/golden';
import { fmtVnd } from '../../data/formatNumber';
import { Repeat, ChevronRight, Clock, TrendingUp, Sparkles } from 'lucide-react';

// Analytics & Feature Flags
import { useDCAAnalytics } from '../../hooks/useDCAAnalytics';
import { useDCAWalletShortcut } from '../../hooks/useFeatureFlag';
import { useWalletShortcutTest } from '../../hooks/useABTest';
import { useWalletToCreationFunnel, useFirstTimeUserFunnel } from '../../hooks/useFunnelTracking';

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export interface WalletDCAShortcutProps {
  /**
   * Display variant
   * - 'full': Full info card (default)
   * - 'compact': Minimal single-line
   */
  variant?: 'full' | 'compact';
}

/**
 * WalletDCAShortcut Component
 */
export function WalletDCAShortcut({ variant = 'full' }: WalletDCAShortcutProps) {
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();
  const { overview, plans } = useDCA();

  // Feature Flag: Check if wallet shortcut should be shown
  const isShortcutEnabled = useDCAWalletShortcut();

  // A/B Test: Get variant configuration
  const {
    variant: abTestVariant,
    showStats,
    showChart,
    ctaText,
    onShortcutClick: trackABTestClick,
  } = useWalletShortcutTest();

  // Analytics: Track events
  const { trackWalletShortcut } = useDCAAnalytics();

  // Funnel: Track wallet to creation journey
  const { trackShortcutImpression, trackShortcutClick } = useWalletToCreationFunnel();

  // Track impression on mount
  useEffect(() => {
    if (plans.length > 0 && isShortcutEnabled) {
      trackShortcutImpression();
      trackWalletShortcut('impression', abTestVariant);
    }
  }, [
    plans.length,
    isShortcutEnabled,
    trackShortcutImpression,
    trackWalletShortcut,
    abTestVariant,
  ]);

  const handleClick = () => {
    hapticSelection();

    // Track click in all systems
    trackShortcutClick();
    trackABTestClick();
    trackWalletShortcut('click', abTestVariant);

    navigate(`${routePrefix}/dca`);
  };

  // Feature flag gate
  if (!isShortcutEnabled) {
    return null;
  }

  // Don't show if no plans
  if (plans.length === 0) {
    return null;
  }

  // Use A/B test variant if not explicitly overridden
  const displayVariant = variant || abTestVariant;

  /* ─────────────────────────────────────────
     COMPACT VARIANT
     ───────────────────────────────────────── */
  if (displayVariant === 'compact') {
    return (
      <TrCard
        hover
        as="button"
        onClick={handleClick}
        className="w-full px-4 py-3"
        accentBorder="rgba(139,92,246,0.2)"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="rounded-xl flex items-center justify-center shrink-0"
            style={{
              width: φAvatar.sm,
              height: φAvatar.sm,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(167,139,250,0.1))',
            }}
          >
            <Repeat size={φIcon.md} color={c.accent} />
          </div>

          {/* Content */}
          <div className="flex-1 text-left">
            <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>Mua định kỳ (DCA)</p>
            <p style={{ color: c.text3, fontSize: φ.xs }}>
              {overview.activePlans} kế hoạch • {fmtVnd(overview.totalInvested)} đã đầu tư
            </p>
          </div>

          {/* Chevron */}
          <ChevronRight size={φIcon.md} color={c.text3} />
        </div>
      </TrCard>
    );
  }

  /* ─────────────────────────────────────────
     FULL VARIANT
     ───────────────────────────────────────── */
  return (
    <TrCard
      hover
      as="button"
      onClick={handleClick}
      className="w-full p-4"
      accentBorder="rgba(139,92,246,0.2)"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="rounded-xl flex items-center justify-center shrink-0"
          style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(167,139,250,0.1))',
          }}
        >
          <Repeat size={20} color={c.accent} />
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>Mua định kỳ (DCA)</p>
            {overview.profitLoss > 0 && (
              <div className="px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <span style={{ color: '#10B981', fontSize: 11, fontWeight: 600 }}>
                  +{((overview.profitLoss / overview.totalInvested) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <p style={{ color: c.text3, fontSize: φ.xs }}>Tự động mua crypto theo lịch trình</p>
        </div>

        <ChevronRight size={φIcon.md} color={c.text3} />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: c.divider, marginBottom: 12 }} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Plans */}
        <div className="flex items-start gap-2">
          <div
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{
              width: 32,
              height: 32,
              background: 'rgba(139,92,246,0.12)',
            }}
          >
            <Repeat size={16} color="#8B5CF6" />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Kế hoạch đang chạy</p>
            <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 700 }}>
              {overview.activePlans}
            </p>
          </div>
        </div>

        {/* Total Invested */}
        <div className="flex items-start gap-2">
          <div
            className="rounded-lg flex items-center justify-center shrink-0"
            style={{
              width: 32,
              height: 32,
              background: 'rgba(59,130,246,0.12)',
            }}
          >
            <TrendingUp size={16} color="#3B82F6" />
          </div>
          <div className="flex-1">
            <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Đã đầu tư</p>
            <p
              style={{ color: c.text1, fontSize: φ.base, fontWeight: 700, fontFamily: 'monospace' }}
            >
              {fmtVnd(overview.totalInvested)}
            </p>
          </div>
        </div>

        {/* Next Execution */}
        {overview.nextExecution && (
          <div className="flex items-start gap-2 col-span-2">
            <div
              className="rounded-lg flex items-center justify-center shrink-0"
              style={{
                width: 32,
                height: 32,
                background: 'rgba(245,158,11,0.12)',
              }}
            >
              <Clock size={16} color="#F59E0B" />
            </div>
            <div className="flex-1">
              <p style={{ color: c.text3, fontSize: 11, marginBottom: 2 }}>Giao dịch tiếp theo</p>
              <div className="flex items-center gap-2">
                <p style={{ color: c.text1, fontSize: φ.sm, fontWeight: 600 }}>
                  {overview.nextExecution.relativeTime}
                </p>
                <span style={{ color: c.text3, fontSize: 11 }}>•</span>
                <p style={{ color: c.text2, fontSize: φ.xs, fontFamily: 'monospace' }}>
                  {fmtVnd(overview.nextExecution.amount)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New User Hint (if no active plans) */}
      {overview.activePlans === 0 && plans.length > 0 && (
        <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={14} color="#F59E0B" />
            <p style={{ color: '#F59E0B', fontSize: 11 }}>
              Bạn có kế hoạch đã tạm dừng. Nhấn để kích hoạt lại.
            </p>
          </div>
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════
   EMPTY STATE VARIANT (for new users)
   ═══════════════════════════════════════════ */

export function WalletDCAEmptyState() {
  const navigate = useNavigate();
  const routePrefix = useRoutePrefix();
  const c = useThemeColors();
  const { hapticSelection } = useHaptic();

  // Analytics: Track empty state
  const { trackEmptyState } = useDCAAnalytics();

  // Funnel: Track first-time user journey
  const { trackEmptyStateImpression, trackEmptyStateClick } = useFirstTimeUserFunnel();

  // Track impression on mount
  useEffect(() => {
    trackEmptyStateImpression();
    trackEmptyState('impression');
  }, [trackEmptyStateImpression, trackEmptyState]);

  const handleClick = () => {
    hapticSelection();

    // Track click
    trackEmptyStateClick();
    trackEmptyState('click');

    navigate(`${routePrefix}/dca`);
  };

  return (
    <TrCard
      hover
      as="button"
      onClick={handleClick}
      className="w-full p-4"
      accentBorder="rgba(139,92,246,0.2)"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="rounded-xl flex items-center justify-center shrink-0"
          style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(167,139,250,0.1))',
          }}
        >
          <Repeat size={20} color={c.accent} />
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <p style={{ color: c.text1, fontSize: φ.base, fontWeight: 600 }}>
            Thử tính năng Tự động đầu tư (DCA)
          </p>
          <p style={{ color: c.text3, fontSize: φ.xs }}>
            Mua crypto định kỳ, giảm rủi ro biến động giá
          </p>
        </div>

        {/* Badge */}
        <div className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.12)' }}>
          <span style={{ color: '#8B5CF6', fontSize: 11, fontWeight: 600 }}>Mới</span>
        </div>

        {/* Chevron */}
        <ChevronRight size={φIcon.md} color={c.text3} />
      </div>
    </TrCard>
  );
}
