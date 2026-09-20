/**
 * useFunnelTracking Hook
 * 
 * React hook for conversion funnel tracking.
 * Automatically tracks events and progresses funnels.
 * 
 * @module hooks/useFunnelTracking
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { useEffect, useCallback, useMemo } from 'react';
import { funnelTracker, FunnelAnalytics } from '../services/ConversionFunnelTracker';
import {
  WALLET_TO_CREATION_FUNNEL,
  ASSET_TO_CREATION_FUNNEL,
  FIRST_TIME_USER_FUNNEL,
  PLAN_ACTIVATION_FUNNEL,
  PAIR_DETAIL_TO_CREATION_FUNNEL,
} from '../config/dcaFunnels';

/* ═══════════════════════════════════════════
   MAIN HOOK
   ═══════════════════════════════════════════ */

/**
 * Track event in funnels
 */
export function useFunnelTracking(userId?: string) {
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      funnelTracker.trackEvent(eventName, userId, properties);
    },
    [userId]
  );

  return { trackEvent };
}

/* ═══════════════════════════════════════════
   AUTO-TRACKING HOOKS
   ═══════════════════════════════════════════ */

/**
 * Auto-track page view in funnels
 */
export function useFunnelPageView(pageName: string, userId?: string) {
  const { trackEvent } = useFunnelTracking(userId);

  useEffect(() => {
    trackEvent('page_view', { page: pageName });
  }, [pageName, trackEvent]);
}

/**
 * Auto-track funnel event on mount
 */
export function useFunnelEvent(
  eventName: string,
  properties?: Record<string, any>,
  userId?: string
) {
  const { trackEvent } = useFunnelTracking(userId);

  useEffect(() => {
    trackEvent(eventName, properties);
  }, [eventName, properties, trackEvent]);
}

/* ═══════════════════════════════════════════
   FUNNEL-SPECIFIC HOOKS
   ═══════════════════════════════════════════ */

/**
 * Wallet to Creation Funnel
 */
export function useWalletToCreationFunnel(userId?: string) {
  const { trackEvent } = useFunnelTracking(userId);

  const trackShortcutImpression = useCallback(() => {
    trackEvent('dca_wallet_shortcut_impression');
  }, [trackEvent]);

  const trackShortcutClick = useCallback(() => {
    trackEvent('dca_wallet_shortcut_click');
  }, [trackEvent]);

  const trackDCAPageView = useCallback(() => {
    trackEvent('dca_page_viewed');
  }, [trackEvent]);

  const trackCreateSheetOpened = useCallback(() => {
    trackEvent('dca_create_sheet_opened');
  }, [trackEvent]);

  const trackPlanCreated = useCallback(() => {
    trackEvent('dca_plan_created');
  }, [trackEvent]);

  return {
    trackShortcutImpression,
    trackShortcutClick,
    trackDCAPageView,
    trackCreateSheetOpened,
    trackPlanCreated,
    funnelId: WALLET_TO_CREATION_FUNNEL.id,
  };
}

/**
 * Asset to Creation Funnel
 */
export function useAssetToCreationFunnel(userId?: string) {
  const { trackEvent } = useFunnelTracking(userId);

  const trackButtonImpression = useCallback(() => {
    trackEvent('dca_asset_detail_button_impression');
  }, [trackEvent]);

  const trackButtonClick = useCallback(() => {
    trackEvent('dca_asset_detail_button_click');
  }, [trackEvent]);

  const trackCreateSheetOpened = useCallback(() => {
    trackEvent('dca_create_sheet_opened');
  }, [trackEvent]);

  const trackPreselectedCoinUsed = useCallback(() => {
    trackEvent('dca_preselected_coin_used');
  }, [trackEvent]);

  const trackPlanCreated = useCallback(() => {
    trackEvent('dca_plan_created');
  }, [trackEvent]);

  return {
    trackButtonImpression,
    trackButtonClick,
    trackCreateSheetOpened,
    trackPreselectedCoinUsed,
    trackPlanCreated,
    funnelId: ASSET_TO_CREATION_FUNNEL.id,
  };
}

/**
 * First-Time User Funnel
 */
export function useFirstTimeUserFunnel(userId?: string) {
  const { trackEvent } = useFunnelTracking(userId);

  const trackDCAPageView = useCallback(() => {
    trackEvent('dca_page_viewed');
  }, [trackEvent]);

  const trackEmptyStateImpression = useCallback(() => {
    trackEvent('dca_empty_state_impression');
  }, [trackEvent]);

  const trackEmptyStateClick = useCallback(() => {
    trackEvent('dca_empty_state_click');
  }, [trackEvent]);

  const trackCreateSheetOpened = useCallback(() => {
    trackEvent('dca_create_sheet_opened');
  }, [trackEvent]);

  const trackFirstPlanCreated = useCallback(() => {
    trackEvent('dca_plan_created');
  }, [trackEvent]);

  return {
    trackDCAPageView,
    trackEmptyStateImpression,
    trackEmptyStateClick,
    trackCreateSheetOpened,
    trackFirstPlanCreated,
    funnelId: FIRST_TIME_USER_FUNNEL.id,
  };
}

/**
 * Plan Activation Funnel
 */
export function usePlanActivationFunnel(userId?: string) {
  const { trackEvent } = useFunnelTracking(userId);

  const trackPlanCreated = useCallback(() => {
    trackEvent('dca_plan_created');
  }, [trackEvent]);

  const trackPlanDetailsViewed = useCallback(() => {
    trackEvent('dca_plan_details_viewed');
  }, [trackEvent]);

  const trackFirstExecution = useCallback(() => {
    trackEvent('dca_execution_success');
  }, [trackEvent]);

  return {
    trackPlanCreated,
    trackPlanDetailsViewed,
    trackFirstExecution,
    funnelId: PLAN_ACTIVATION_FUNNEL.id,
  };
}

/**
 * Pair Detail to Creation Funnel
 */
export function usePairDetailToCreationFunnel(userId?: string) {
  const { trackEvent } = useFunnelTracking(userId);

  const trackButtonImpression = useCallback(() => {
    trackEvent('dca_pair_detail_button_impression');
  }, [trackEvent]);

  const trackButtonClick = useCallback(() => {
    trackEvent('dca_pair_detail_button_click');
  }, [trackEvent]);

  const trackCreateSheetOpened = useCallback(() => {
    trackEvent('dca_create_sheet_opened');
  }, [trackEvent]);

  const trackPreselectedCoinUsed = useCallback(() => {
    trackEvent('dca_preselected_coin_used');
  }, [trackEvent]);

  const trackPlanCreated = useCallback(() => {
    trackEvent('dca_plan_created');
  }, [trackEvent]);

  return {
    trackButtonImpression,
    trackButtonClick,
    trackCreateSheetOpened,
    trackPreselectedCoinUsed,
    trackPlanCreated,
    funnelId: PAIR_DETAIL_TO_CREATION_FUNNEL.id,
  };
}

/* ═══════════════════════════════════════════
   ANALYTICS HOOKS
   ═══════════════════════════════════════════ */

/**
 * Get funnel analytics
 */
export function useFunnelAnalytics(funnelId: string): FunnelAnalytics | null {
  const analytics = useMemo(() => {
    try {
      return funnelTracker.getFunnelAnalytics(funnelId);
    } catch (error) {
      console.error('[useFunnelAnalytics] Error:', error);
      return null;
    }
  }, [funnelId]);

  return analytics;
}

/**
 * Get all funnel analytics
 */
export function useAllFunnelAnalytics() {
  const walletToCreation = useFunnelAnalytics(WALLET_TO_CREATION_FUNNEL.id);
  const assetToCreation = useFunnelAnalytics(ASSET_TO_CREATION_FUNNEL.id);
  const firstTimeUser = useFunnelAnalytics(FIRST_TIME_USER_FUNNEL.id);
  const planActivation = useFunnelAnalytics(PLAN_ACTIVATION_FUNNEL.id);
  const pairDetailToCreation = useFunnelAnalytics(PAIR_DETAIL_TO_CREATION_FUNNEL.id);

  return {
    walletToCreation,
    assetToCreation,
    firstTimeUser,
    planActivation,
    pairDetailToCreation,
  };
}

/* ═══════════════════════════════════════════
   COMBINED TRACKING HOOK
   ═══════════════════════════════════════════ */

/**
 * Combined DCA tracking (Analytics + Funnels)
 * 
 * This hook combines both analytics and funnel tracking
 * for convenience.
 */
export function useDCATracking(userId?: string) {
  const { trackEvent: trackFunnelEvent } = useFunnelTracking(userId);

  // Import analytics hook
  const { useDCAAnalytics } = require('./useDCAAnalytics');
  const analyticsHook = useDCAAnalytics();

  // Combined tracking function
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      // Track in both analytics and funnels
      analyticsHook.trackEvent(eventName, properties);
      trackFunnelEvent(eventName, properties);
    },
    [analyticsHook, trackFunnelEvent]
  );

  return {
    ...analyticsHook,
    trackEvent, // Override with combined version
  };
}

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */

/**
 * Clean old funnel sessions
 */
export function useCleanOldSessions(maxAge: number = 86400000) {
  useEffect(() => {
    funnelTracker.cleanOldSessions(maxAge);
    
    // Clean every hour
    const interval = setInterval(() => {
      funnelTracker.cleanOldSessions(maxAge);
    }, 3600000);

    return () => clearInterval(interval);
  }, [maxAge]);
}

/**
 * Debug funnel state
 */
export function useFunnelDebug(funnelId: string) {
  const analytics = useFunnelAnalytics(funnelId);

  const debugInfo = useMemo(() => {
    if (!analytics) return null;

    return {
      funnelId,
      totalSessions: analytics.totalSessions,
      completedSessions: analytics.completedSessions,
      completionRate: `${(analytics.completionRate * 100).toFixed(2)}%`,
      avgCompletionTime: `${(analytics.avgCompletionTime / 1000).toFixed(2)}s`,
      steps: analytics.stepAnalytics.map(step => ({
        step: step.stepName,
        reached: step.reached,
        completed: step.completed,
        rate: `${(step.completionRate * 100).toFixed(2)}%`,
        avgTime: `${(step.avgTimeToComplete / 1000).toFixed(2)}s`,
        dropout: `${(step.dropoutRate * 100).toFixed(2)}%`,
      })),
      dropouts: analytics.dropoutAnalysis.map(d => ({
        step: d.step,
        count: d.count,
        rate: `${(d.rate * 100).toFixed(2)}%`,
      })),
    };
  }, [analytics, funnelId]);

  return debugInfo;
}