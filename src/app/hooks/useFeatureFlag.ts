/**
 * useFeatureFlag Hook
 *
 * React hook for accessing feature flags.
 * Provides convenient methods for checking flags and getting variants.
 *
 * @module hooks/useFeatureFlag
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { useCallback, useSyncExternalStore } from 'react';
import { featureFlags } from '../services/FeatureFlagService';
import type { UserContext } from '@/shared/types/feature-flags';
import { DCAFeatureFlag, DCAABTestFlag } from '@/features/dca/model/dca-feature-flags';

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */

/**
 * Check if a feature flag is enabled
 */
export function useFeatureFlag(
  flagKey: DCAFeatureFlag | DCAABTestFlag | string,
  userContext?: UserContext,
): boolean {
  useSyncExternalStore(featureFlags.subscribe, featureFlags.getVersion, featureFlags.getVersion);
  return featureFlags.isEnabled(flagKey, userContext);
}

/**
 * Get feature flag value
 */
export function useFeatureFlagValue<T>(
  flagKey: string,
  defaultValue: T,
  userContext?: UserContext,
): T {
  useSyncExternalStore(featureFlags.subscribe, featureFlags.getVersion, featureFlags.getVersion);
  return featureFlags.getValue(flagKey, defaultValue, userContext);
}

/**
 * Get A/B test variant
 */
export function useABTestVariant(
  flagKey: DCAABTestFlag | string,
  userContext?: UserContext,
): string {
  useSyncExternalStore(featureFlags.subscribe, featureFlags.getVersion, featureFlags.getVersion);
  return featureFlags.getVariant(flagKey, userContext);
}

/**
 * Get multiple feature flags at once
 */
export function useFeatureFlags(
  flagKeys: (DCAFeatureFlag | DCAABTestFlag | string)[],
  userContext?: UserContext,
): Record<string, boolean> {
  useSyncExternalStore(featureFlags.subscribe, featureFlags.getVersion, featureFlags.getVersion);

  const flags: Record<string, boolean> = {};
  for (const key of flagKeys) {
    flags[key] = featureFlags.isEnabled(key, userContext);
  }
  return flags;
}

/**
 * Feature flag utilities
 */
export function useFeatureFlagUtils() {
  const override = useCallback((flagKey: string, value: unknown) => {
    featureFlags.override(flagKey, value);
  }, []);

  const clearOverrides = useCallback(() => {
    featureFlags.clearOverrides();
  }, []);

  const refresh = useCallback(async () => {
    await featureFlags.refresh();
  }, []);

  const getDebugInfo = useCallback(() => {
    return featureFlags.getDebugInfo();
  }, []);

  return {
    override,
    clearOverrides,
    refresh,
    getDebugInfo,
  };
}

/* ═══════════════════════════════════════════
   SPECIALIZED DCA HOOKS
   ═══════════════════════════════════════════ */

/**
 * Check if DCA module is enabled (master kill switch)
 */
export function useDCAEnabled(): boolean {
  return useFeatureFlag(DCAFeatureFlag.DCA_ENABLED);
}

/**
 * Check if wallet shortcut should be shown
 */
export function useDCAWalletShortcut(): boolean {
  const dcaEnabled = useFeatureFlag(DCAFeatureFlag.DCA_ENABLED);
  const shortcutEnabled = useFeatureFlag(DCAFeatureFlag.DCA_WALLET_SHORTCUT);
  return dcaEnabled && shortcutEnabled;
}

/**
 * Check if asset detail button should be shown
 */
export function useDCAAssetDetailButton(): boolean {
  const dcaEnabled = useFeatureFlag(DCAFeatureFlag.DCA_ENABLED);
  const buttonEnabled = useFeatureFlag(DCAFeatureFlag.DCA_ASSET_DETAIL_BUTTON);
  return dcaEnabled && buttonEnabled;
}

/**
 * Check if deep linking is enabled
 */
export function useDCADeepLinking(): boolean {
  const dcaEnabled = useFeatureFlag(DCAFeatureFlag.DCA_ENABLED);
  const deepLinkingEnabled = useFeatureFlag(DCAFeatureFlag.DCA_DEEP_LINKING);
  return dcaEnabled && deepLinkingEnabled;
}

/**
 * Get wallet shortcut variant (for A/B testing)
 */
export function useDCAShortcutVariant(): 'full' | 'compact' | 'hidden' {
  const variant = useABTestVariant(DCAABTestFlag.DCA_SHORTCUT_VARIANT);

  if (variant === 'full' || variant === 'compact' || variant === 'hidden') {
    return variant;
  }

  return 'full'; // Default fallback
}

/**
 * Get all DCA feature flags at once
 */
export function useAllDCAFlags() {
  const flags = useFeatureFlags([
    DCAFeatureFlag.DCA_ENABLED,
    DCAFeatureFlag.DCA_WALLET_SHORTCUT,
    DCAFeatureFlag.DCA_ASSET_DETAIL_BUTTON,
    DCAFeatureFlag.DCA_DEEP_LINKING,
    DCAFeatureFlag.DCA_ADVANCED_OPTIONS,
    DCAFeatureFlag.DCA_NOTIFICATIONS,
    DCAFeatureFlag.DCA_AUTO_REBALANCE,
    DCAFeatureFlag.DCA_PORTFOLIO_CHART,
    DCAFeatureFlag.DCA_LEADERBOARD,
    DCAFeatureFlag.DCA_SOCIAL_SHARING,
    DCAFeatureFlag.DCA_HOME_QUICK_ACTION,
    DCAFeatureFlag.DCA_TRADE_CHIP,
    DCAFeatureFlag.DCA_PAIR_DETAIL_BANNER,
    DCAFeatureFlag.DCA_PROFILE_MENU,
  ]);

  return {
    isEnabled: flags[DCAFeatureFlag.DCA_ENABLED],
    walletShortcut: flags[DCAFeatureFlag.DCA_WALLET_SHORTCUT],
    assetDetailButton: flags[DCAFeatureFlag.DCA_ASSET_DETAIL_BUTTON],
    deepLinking: flags[DCAFeatureFlag.DCA_DEEP_LINKING],
    advancedOptions: flags[DCAFeatureFlag.DCA_ADVANCED_OPTIONS],
    notifications: flags[DCAFeatureFlag.DCA_NOTIFICATIONS],
    autoRebalance: flags[DCAFeatureFlag.DCA_AUTO_REBALANCE],
    portfolioChart: flags[DCAFeatureFlag.DCA_PORTFOLIO_CHART],
    leaderboard: flags[DCAFeatureFlag.DCA_LEADERBOARD],
    socialSharing: flags[DCAFeatureFlag.DCA_SOCIAL_SHARING],
    homeQuickAction: flags[DCAFeatureFlag.DCA_HOME_QUICK_ACTION],
    tradeChip: flags[DCAFeatureFlag.DCA_TRADE_CHIP],
    pairDetailBanner: flags[DCAFeatureFlag.DCA_PAIR_DETAIL_BANNER],
    profileMenu: flags[DCAFeatureFlag.DCA_PROFILE_MENU],
  };
}

/* ═══════════════════════════════════════════
   COMPONENT HELPERS
   ═══════════════════════════════════════════ */

/**
 * Conditional render based on feature flag
 */
export function useConditionalRender(
  flagKey: string,
): (children: React.ReactNode) => React.ReactNode | null {
  const isEnabled = useFeatureFlag(flagKey);

  return useCallback(
    (children: React.ReactNode) => {
      return isEnabled ? children : null;
    },
    [isEnabled],
  );
}

/**
 * Variant-based render for A/B tests
 */
export function useVariantRender(flagKey: string): {
  variant: string;
  renderVariant: (variants: Record<string, React.ReactNode>) => React.ReactNode;
} {
  const variant = useABTestVariant(flagKey);

  const renderVariant = useCallback(
    (variants: Record<string, React.ReactNode>) => {
      return variants[variant] || variants['default'] || null;
    },
    [variant],
  );

  return { variant, renderVariant };
}
