/**
 * useABTest Hook
 * 
 * React hook for A/B testing with automatic exposure tracking.
 * Integrates with Feature Flags for variant assignment.
 * 
 * @module hooks/useABTest
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { useEffect, useMemo, useCallback } from 'react';
import { useABTestVariant } from './useFeatureFlag';
import { abTestAnalytics } from '../services/ABTestAnalytics';
import { getTestById, getTestByFlagKey, ABTest } from '../config/abTests';

/* ═══════════════════════════════════════════
   MAIN HOOK
   ═══════════════════════════════════════════ */

/**
 * Use A/B test with automatic exposure tracking
 */
export function useABTest(
  testIdOrFlagKey: string,
  options?: {
    userId?: string;
    autoTrackExposure?: boolean;
    exposureDelay?: number;
  }
) {
  const {
    userId = 'anonymous',
    autoTrackExposure = true,
    exposureDelay = 0,
  } = options || {};

  // Get test definition
  const test = useMemo(() => {
    return getTestById(testIdOrFlagKey) || getTestByFlagKey(testIdOrFlagKey);
  }, [testIdOrFlagKey]);

  // Get variant from feature flags
  const variant = useABTestVariant(testIdOrFlagKey);

  // Track exposure on mount
  useEffect(() => {
    if (!test || !autoTrackExposure) return;

    const trackExposure = () => {
      abTestAnalytics.trackExposure(test.id, variant, userId);
    };

    if (exposureDelay > 0) {
      const timer = setTimeout(trackExposure, exposureDelay);
      return () => clearTimeout(timer);
    } else {
      trackExposure();
    }
  }, [test, variant, userId, autoTrackExposure, exposureDelay]);

  // Track conversion
  const trackConversion = useCallback(
    (metricName?: string, value?: number) => {
      if (!test) return;

      const metric = metricName || test.successMetric.name;
      abTestAnalytics.trackConversion(test.id, metric, userId, value);
    },
    [test, userId]
  );

  // Get variant config
  const config = useMemo(() => {
    if (!test) return {};
    const variantObj = test.variants.find(v => v.id === variant);
    return variantObj?.config || {};
  }, [test, variant]);

  // Check if variant is control
  const isControl = useMemo(() => {
    if (!test) return false;
    const variantObj = test.variants.find(v => v.id === variant);
    return variantObj?.isControl || false;
  }, [test, variant]);

  return {
    /** Current variant ID */
    variant,
    
    /** Variant configuration */
    config,
    
    /** Is this the control variant? */
    isControl,
    
    /** Track conversion */
    trackConversion,
    
    /** Test definition */
    test,
  };
}

/* ═══════════════════════════════════════════
   SPECIALIZED HOOKS
   ═══════════════════════════════════════════ */

/**
 * Wallet Shortcut A/B Test
 */
export function useWalletShortcutTest(userId?: string) {
  const { variant, config, trackConversion } = useABTest('dca_wallet_shortcut_v1', {
    userId,
  });

  const handleClick = useCallback(() => {
    trackConversion('Click-Through Rate');
  }, [trackConversion]);

  return {
    variant: variant as 'full' | 'compact',
    showStats: config.showStats as boolean,
    showChart: config.showChart as boolean,
    ctaText: config.ctaText as string,
    onShortcutClick: handleClick,
  };
}

/**
 * Onboarding Flow A/B Test
 */
export function useOnboardingFlowTest(userId?: string) {
  const { variant, config, trackConversion } = useABTest('dca_onboarding_v1', {
    userId,
  });

  const handleComplete = useCallback(() => {
    trackConversion('Completion Rate');
  }, [trackConversion]);

  return {
    variant: variant as 'v1' | 'v2' | 'v3',
    steps: config.steps as number,
    showTooltips: config.showTooltips as boolean,
    progressBar: config.progressBar as boolean,
    showHelp: config.showHelp as boolean,
    onComplete: handleComplete,
  };
}

/**
 * Frequency Presets A/B Test
 */
export function useFrequencyPresetsTest(userId?: string) {
  const { variant, config, trackConversion } = useABTest('dca_frequency_v1', {
    userId,
  });

  const handleSelect = useCallback(() => {
    trackConversion('Plan Creation Rate');
  }, [trackConversion]);

  return {
    variant: variant as 'simple' | 'advanced',
    presets: config.presets as string[],
    onFrequencySelect: handleSelect,
  };
}

/**
 * Create Form Layout A/B Test
 */
export function useCreateFormLayoutTest(userId?: string) {
  const { variant, config, trackConversion } = useABTest('dca_form_layout_v1', {
    userId,
  });

  const handleSubmit = useCallback(() => {
    trackConversion('Form Completion Rate');
  }, [trackConversion]);

  return {
    variant: variant as 'single_page' | 'multi_step',
    layout: config.layout as string,
    steps: config.steps as number,
    showAllFields: config.showAllFields as boolean,
    onFormSubmit: handleSubmit,
  };
}

/**
 * Pair Detail Banner Placement A/B Test
 * 
 * Controls whether the DCA banner shows before or after the risk warning.
 * - 'after_risk' (Control): Banner between risk warning and Buy/Sell CTA
 * - 'before_risk' (Variant): Banner between content and risk warning
 */
export function usePairDetailBannerTest(userId?: string) {
  const { variant, config, trackConversion, isControl } = useABTest('dca_pair_detail_placement_v1', {
    userId,
  });

  const handleBannerClick = useCallback(() => {
    trackConversion('Banner Click-Through Rate');
  }, [trackConversion]);

  return {
    /** Current placement variant */
    placement: (config.placement || 'after_risk') as 'after_risk' | 'before_risk',
    /** Whether banner should show BEFORE risk warning */
    showBeforeRisk: variant === 'before_risk',
    /** Whether this is the control variant */
    isControl,
    /** Call when user clicks the DCA banner */
    onBannerClick: handleBannerClick,
    /** Raw variant ID for analytics */
    variant: variant as 'after_risk' | 'before_risk',
  };
}

/* ═══════════════════════════════════════════
   RESULTS HOOKS
   ═══════════════════════════════════════════ */

/**
 * Get A/B test results
 */
export function useABTestResults(testId: string) {
  const test = useMemo(() => getTestById(testId), [testId]);

  const results = useMemo(() => {
    if (!test) return null;
    return abTestAnalytics.getTestResults(test);
  }, [test]);

  const refresh = useCallback(() => {
    // Force re-calculation by triggering component update
    // In real app, this would trigger a re-fetch
  }, []);

  return {
    results,
    refresh,
    test,
  };
}

/* ═══════════════════════════════════════════
   COMPONENT HELPERS
   ═══════════════════════════════════════════ */

/**
 * Render based on variant
 */
export function useVariantRenderer(testId: string, userId?: string) {
  const { variant } = useABTest(testId, { userId });

  const renderVariant = useCallback(
    (renderers: Record<string, React.ReactNode>) => {
      return renderers[variant] || renderers['default'] || null;
    },
    [variant]
  );

  return { variant, renderVariant };
}

/**
 * Conditional props based on variant
 */
export function useVariantProps<T extends Record<string, any>>(
  testId: string,
  propsMap: Record<string, T>,
  userId?: string
): T {
  const { variant } = useABTest(testId, { userId });

  return useMemo(() => {
    return propsMap[variant] || propsMap['default'] || ({} as T);
  }, [variant, propsMap]);
}

/* ═══════════════════════════════════════════
   DEBUG HELPERS
   ═══════════════════════════════════════════ */

/**
 * Debug A/B test state
 */
export function useABTestDebug(testId: string) {
  const { variant, config, test, isControl } = useABTest(testId, {
    autoTrackExposure: false,
  });

  const debugInfo = useMemo(() => {
    return {
      testId,
      testName: test?.name,
      variant,
      isControl,
      config,
      active: test?.active,
      variants: test?.variants.map(v => ({
        id: v.id,
        name: v.name,
        allocation: v.allocation,
      })),
    };
  }, [testId, test, variant, isControl, config]);

  return debugInfo;
}