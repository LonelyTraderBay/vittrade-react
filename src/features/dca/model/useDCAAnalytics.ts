/**
 * useDCAAnalytics Hook
 *
 * React hook for DCA analytics tracking.
 * Provides convenient methods for tracking DCA events.
 *
 * @module features/dca/model/useDCAAnalytics
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { useCallback, useEffect, useRef } from 'react';
import { dcaAnalytics } from './dca-analytics-service';
import type { DCAEventName, DCAEventSource } from './dca-analytics-types';
import type { DCAFrequency } from './dca-types';

/* ═══════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════ */

export interface UseDCAAnalyticsReturn {
  /** Track generic DCA event */
  trackEvent: (eventName: DCAEventName | string, properties?: Record<string, unknown>) => void;

  /** Track page view */
  trackPageView: (pageName: string) => void;

  /** Track plan creation */
  trackPlanCreation: (
    planId: string,
    coinSymbol: string,
    frequency: DCAFrequency,
    amount: number,
    source?: DCAEventSource,
  ) => void;

  /** Track plan status change */
  trackPlanStatusChange: (planId: string, newStatus: 'active' | 'paused') => void;

  /** Track plan deletion */
  trackPlanDeletion: (planId: string, reason?: string) => void;

  /** Track wallet shortcut interaction */
  trackWalletShortcut: (action: 'impression' | 'click', variant?: 'full' | 'compact') => void;

  /** Track asset detail button */
  trackAssetDetailButton: (action: 'impression' | 'click', coinSymbol: string) => void;

  /** Track deep link usage */
  trackDeepLink: (coinSymbol: string, converted: boolean) => void;

  /** Track empty state interaction */
  trackEmptyState: (action: 'impression' | 'click') => void;

  /** Track execution result */
  trackExecution: (planId: string, success: boolean, error?: string) => void;

  /** Track home quick action click */
  trackHomeQuickAction: (variant: 'mobile' | 'responsive') => void;

  /** Track trade page chip click */
  trackTradeChip: (coinSymbol: string, variant: 'mobile' | 'responsive') => void;

  /** Track pair detail banner */
  trackPairDetailBanner: (action: 'impression' | 'click', coinSymbol: string) => void;

  /** Track profile menu click */
  trackProfileMenu: (variant: 'mobile' | 'responsive') => void;
}

/**
 * useDCAAnalytics Hook
 */
export function useDCAAnalytics(): UseDCAAnalyticsReturn {
  // Memoized tracking functions
  const trackEvent = useCallback(
    (eventName: DCAEventName | string, properties?: Record<string, unknown>) => {
      dcaAnalytics.trackEvent(eventName, properties);
    },
    [],
  );

  const trackPageView = useCallback((pageName: string) => {
    dcaAnalytics.trackPageView(pageName);
  }, []);

  const trackPlanCreation = useCallback(
    (
      planId: string,
      coinSymbol: string,
      frequency: DCAFrequency,
      amount: number,
      source?: DCAEventSource,
    ) => {
      dcaAnalytics.trackPlanCreation(planId, coinSymbol, frequency, amount, source);
    },
    [],
  );

  const trackPlanStatusChange = useCallback((planId: string, newStatus: 'active' | 'paused') => {
    dcaAnalytics.trackPlanStatusChange(planId, newStatus);
  }, []);

  const trackPlanDeletion = useCallback((planId: string, reason?: string) => {
    dcaAnalytics.trackPlanDeletion(planId, reason);
  }, []);

  const trackWalletShortcut = useCallback(
    (action: 'impression' | 'click', variant?: 'full' | 'compact') => {
      dcaAnalytics.trackWalletShortcut(action, variant);
    },
    [],
  );

  const trackAssetDetailButton = useCallback(
    (action: 'impression' | 'click', coinSymbol: string) => {
      dcaAnalytics.trackAssetDetailButton(action, coinSymbol);
    },
    [],
  );

  const trackDeepLink = useCallback((coinSymbol: string, converted: boolean) => {
    dcaAnalytics.trackDeepLink(coinSymbol, converted);
  }, []);

  const trackEmptyState = useCallback((action: 'impression' | 'click') => {
    dcaAnalytics.trackEmptyState(action);
  }, []);

  const trackExecution = useCallback((planId: string, success: boolean, error?: string) => {
    dcaAnalytics.trackExecution(planId, success, error);
  }, []);

  const trackHomeQuickAction = useCallback((variant: 'mobile' | 'responsive') => {
    dcaAnalytics.trackHomeQuickAction(variant);
  }, []);

  const trackTradeChip = useCallback((coinSymbol: string, variant: 'mobile' | 'responsive') => {
    dcaAnalytics.trackTradeChip(coinSymbol, variant);
  }, []);

  const trackPairDetailBanner = useCallback(
    (action: 'impression' | 'click', coinSymbol: string) => {
      dcaAnalytics.trackPairDetailBanner(action, coinSymbol);
    },
    [],
  );

  const trackProfileMenu = useCallback((variant: 'mobile' | 'responsive') => {
    dcaAnalytics.trackProfileMenu(variant);
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackPlanCreation,
    trackPlanStatusChange,
    trackPlanDeletion,
    trackWalletShortcut,
    trackAssetDetailButton,
    trackDeepLink,
    trackEmptyState,
    trackExecution,
    trackHomeQuickAction,
    trackTradeChip,
    trackPairDetailBanner,
    trackProfileMenu,
  };
}

/* ═══════════════════════════════════════════
   SPECIALIZED HOOKS
   ═══════════════════════════════════════════ */

/**
 * Auto-track page view on mount
 */
export function usePageViewTracking(pageName: string) {
  const { trackPageView } = useDCAAnalytics();

  useEffect(() => {
    trackPageView(pageName);
  }, [pageName, trackPageView]);
}

/**
 * Auto-track impression on mount
 */
export function useImpressionTracking(
  eventName: DCAEventName,
  properties?: Record<string, unknown>,
  options?: { delay?: number },
) {
  const { trackEvent } = useDCAAnalytics();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;

    const track = () => {
      trackEvent(eventName, properties);
      tracked.current = true;
    };

    if (options?.delay) {
      const timer = setTimeout(track, options.delay);
      return () => clearTimeout(timer);
    } else {
      track();
    }
  }, [eventName, properties, options?.delay, trackEvent]);
}

/**
 * Track time spent on component
 */
export function useTimeTracking(componentName: string) {
  const { trackEvent } = useDCAAnalytics();

  useEffect(() => {
    const mountTime = Date.now();

    return () => {
      const timeSpent = Date.now() - mountTime;
      trackEvent('component_time_spent', {
        component: componentName,
        time_ms: timeSpent,
      });
    };
  }, [componentName, trackEvent]);
}
