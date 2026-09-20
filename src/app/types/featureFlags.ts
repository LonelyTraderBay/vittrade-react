/**
 * Feature Flag Type Definitions
 * 
 * Defines all feature flag types and configurations.
 * Supports remote config, A/B testing, and gradual rollouts.
 * 
 * @module types/featureFlags
 * @version 2.0 (Phase 2 - Sprint 2)
 */

/* ═══════════════════════════════════════════
   FEATURE FLAG TYPES
   ═══════════════════════════════════════════ */

/**
 * Feature Flag Definition
 */
export interface FeatureFlag {
  /** Flag key */
  key: string;
  
  /** Display name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Is enabled globally */
  enabled: boolean;
  
  /** Rollout percentage (0-100) */
  rolloutPercentage?: number;
  
  /** Target user segments */
  userSegments?: string[];
  
  /** A/B test variants (if applicable) */
  variants?: FeatureFlagVariant[];
  
  /** Default variant */
  defaultVariant?: string;
  
  /** Expiration date (for cleanup) */
  expiresAt?: Date;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Feature Flag Variant (for A/B testing)
 */
export interface FeatureFlagVariant {
  /** Variant key */
  key: string;
  
  /** Display name */
  name: string;
  
  /** Allocation weight (0-100) */
  weight: number;
  
  /** Variant value */
  value: any;
}

/**
 * User Context for flag evaluation
 */
export interface UserContext {
  /** User ID */
  userId?: string;
  
  /** User segment */
  segment?: string;
  
  /** Custom attributes */
  attributes?: Record<string, any>;
}

/* ═══════════════════════════════════════════
   DCA FEATURE FLAGS
   ═══════════════════════════════════════════ */

/**
 * All DCA feature flags
 */
export enum DCAFeatureFlag {
  /** Master kill switch */
  DCA_ENABLED = 'dca_enabled',
  
  /** Wallet shortcut visibility */
  DCA_WALLET_SHORTCUT = 'dca_wallet_shortcut',
  
  /** Asset detail button */
  DCA_ASSET_DETAIL_BUTTON = 'dca_asset_detail_button',
  
  /** Deep linking support */
  DCA_DEEP_LINKING = 'dca_deep_linking',
  
  /** Advanced options in create form */
  DCA_ADVANCED_OPTIONS = 'dca_advanced_options',
  
  /** Push notifications */
  DCA_NOTIFICATIONS = 'dca_notifications',
  
  /** Auto-rebalance feature */
  DCA_AUTO_REBALANCE = 'dca_auto_rebalance',
  
  /** Portfolio chart */
  DCA_PORTFOLIO_CHART = 'dca_portfolio_chart',
  
  /** Leaderboard */
  DCA_LEADERBOARD = 'dca_leaderboard',
  
  /** Social sharing */
  DCA_SOCIAL_SHARING = 'dca_social_sharing',

  /** Home quick action entry point */
  DCA_HOME_QUICK_ACTION = 'dca_home_quick_action',

  /** Trade page chip entry point */
  DCA_TRADE_CHIP = 'dca_trade_chip',

  /** Pair detail banner entry point */
  DCA_PAIR_DETAIL_BANNER = 'dca_pair_detail_banner',

  /** Profile menu entry point */
  DCA_PROFILE_MENU = 'dca_profile_menu',
}

/**
 * DCA A/B Test Flags
 */
export enum DCAABTestFlag {
  /** Wallet shortcut variant */
  DCA_SHORTCUT_VARIANT = 'dca_shortcut_variant',
  
  /** Onboarding flow */
  DCA_ONBOARDING_FLOW = 'dca_onboarding_flow',
  
  /** Frequency presets */
  DCA_FREQUENCY_PRESETS = 'dca_frequency_presets',
  
  /** Create form layout */
  DCA_CREATE_FORM_LAYOUT = 'dca_create_form_layout',

  /** Pair detail banner placement */
  DCA_PAIR_DETAIL_PLACEMENT = 'dca_pair_detail_placement',
}

/* ═══════════════════════════════════════════
   DEFAULT CONFIGURATIONS
   ═══════════════════════════════════════════ */

/**
 * Default Feature Flags
 */
export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Master kill switch
  [DCAFeatureFlag.DCA_ENABLED]: {
    key: DCAFeatureFlag.DCA_ENABLED,
    name: 'DCA Enabled',
    description: 'Master kill switch for entire DCA module',
    enabled: true,
    rolloutPercentage: 100,
  },

  // Wallet shortcut
  [DCAFeatureFlag.DCA_WALLET_SHORTCUT]: {
    key: DCAFeatureFlag.DCA_WALLET_SHORTCUT,
    name: 'DCA Wallet Shortcut',
    description: 'Show DCA shortcut card in Wallet page',
    enabled: true,
    rolloutPercentage: 100,
  },

  // Asset detail button
  [DCAFeatureFlag.DCA_ASSET_DETAIL_BUTTON]: {
    key: DCAFeatureFlag.DCA_ASSET_DETAIL_BUTTON,
    name: 'DCA Asset Detail Button',
    description: 'Show DCA button in asset detail page',
    enabled: true,
    rolloutPercentage: 100,
  },

  // Deep linking
  [DCAFeatureFlag.DCA_DEEP_LINKING]: {
    key: DCAFeatureFlag.DCA_DEEP_LINKING,
    name: 'DCA Deep Linking',
    description: 'Enable deep linking with URL params',
    enabled: true,
    rolloutPercentage: 100,
  },

  // Advanced options
  [DCAFeatureFlag.DCA_ADVANCED_OPTIONS]: {
    key: DCAFeatureFlag.DCA_ADVANCED_OPTIONS,
    name: 'DCA Advanced Options',
    description: 'Show advanced options in create form',
    enabled: false,
    rolloutPercentage: 0,
  },

  // Notifications
  [DCAFeatureFlag.DCA_NOTIFICATIONS]: {
    key: DCAFeatureFlag.DCA_NOTIFICATIONS,
    name: 'DCA Notifications',
    description: 'Enable push notifications for DCA events',
    enabled: false,
    rolloutPercentage: 0,
  },

  // Auto-rebalance
  [DCAFeatureFlag.DCA_AUTO_REBALANCE]: {
    key: DCAFeatureFlag.DCA_AUTO_REBALANCE,
    name: 'DCA Auto Rebalance',
    description: 'Enable automatic portfolio rebalancing',
    enabled: false,
    rolloutPercentage: 0,
  },

  // Portfolio chart
  [DCAFeatureFlag.DCA_PORTFOLIO_CHART]: {
    key: DCAFeatureFlag.DCA_PORTFOLIO_CHART,
    name: 'DCA Portfolio Chart',
    description: 'Show portfolio performance chart',
    enabled: true,
    rolloutPercentage: 100,
  },

  // Leaderboard
  [DCAFeatureFlag.DCA_LEADERBOARD]: {
    key: DCAFeatureFlag.DCA_LEADERBOARD,
    name: 'DCA Leaderboard',
    description: 'Show DCA performance leaderboard',
    enabled: false,
    rolloutPercentage: 0,
  },

  // Social sharing
  [DCAFeatureFlag.DCA_SOCIAL_SHARING]: {
    key: DCAFeatureFlag.DCA_SOCIAL_SHARING,
    name: 'DCA Social Sharing',
    description: 'Allow users to share DCA results',
    enabled: false,
    rolloutPercentage: 0,
  },

  // Home quick action entry point
  [DCAFeatureFlag.DCA_HOME_QUICK_ACTION]: {
    key: DCAFeatureFlag.DCA_HOME_QUICK_ACTION,
    name: 'DCA Home Quick Action',
    description: 'Show DCA quick action in Home page',
    enabled: false,
    rolloutPercentage: 0,
  },

  // Trade page chip entry point
  [DCAFeatureFlag.DCA_TRADE_CHIP]: {
    key: DCAFeatureFlag.DCA_TRADE_CHIP,
    name: 'DCA Trade Chip',
    description: 'Show DCA chip in Trade page',
    enabled: false,
    rolloutPercentage: 0,
  },

  // Pair detail banner entry point
  [DCAFeatureFlag.DCA_PAIR_DETAIL_BANNER]: {
    key: DCAFeatureFlag.DCA_PAIR_DETAIL_BANNER,
    name: 'DCA Pair Detail Banner',
    description: 'Show DCA banner in Pair Detail page',
    enabled: false,
    rolloutPercentage: 0,
  },

  // Profile menu entry point
  [DCAFeatureFlag.DCA_PROFILE_MENU]: {
    key: DCAFeatureFlag.DCA_PROFILE_MENU,
    name: 'DCA Profile Menu',
    description: 'Show DCA option in Profile menu',
    enabled: false,
    rolloutPercentage: 0,
  },
};

/**
 * Default A/B Test Flags
 */
export const DEFAULT_AB_TEST_FLAGS: Record<string, FeatureFlag> = {
  // Shortcut variant
  [DCAABTestFlag.DCA_SHORTCUT_VARIANT]: {
    key: DCAABTestFlag.DCA_SHORTCUT_VARIANT,
    name: 'DCA Shortcut Variant',
    description: 'Test different wallet shortcut designs',
    enabled: true,
    variants: [
      { key: 'full', name: 'Full Card', weight: 50, value: 'full' },
      { key: 'compact', name: 'Compact Card', weight: 50, value: 'compact' },
    ],
    defaultVariant: 'full',
  },

  // Onboarding flow
  [DCAABTestFlag.DCA_ONBOARDING_FLOW]: {
    key: DCAABTestFlag.DCA_ONBOARDING_FLOW,
    name: 'DCA Onboarding Flow',
    description: 'Test different onboarding experiences',
    enabled: false,
    variants: [
      { key: 'v1', name: 'Current Flow', weight: 34, value: 'v1' },
      { key: 'v2', name: 'Simplified', weight: 33, value: 'v2' },
      { key: 'v3', name: 'Wizard', weight: 33, value: 'v3' },
    ],
    defaultVariant: 'v1',
  },

  // Frequency presets
  [DCAABTestFlag.DCA_FREQUENCY_PRESETS]: {
    key: DCAABTestFlag.DCA_FREQUENCY_PRESETS,
    name: 'DCA Frequency Presets',
    description: 'Test different frequency options',
    enabled: false,
    variants: [
      { key: 'simple', name: 'Simple (Daily/Weekly/Monthly)', weight: 50, value: 'simple' },
      { key: 'advanced', name: 'Advanced (with custom)', weight: 50, value: 'advanced' },
    ],
    defaultVariant: 'simple',
  },

  // Create form layout
  [DCAABTestFlag.DCA_CREATE_FORM_LAYOUT]: {
    key: DCAABTestFlag.DCA_CREATE_FORM_LAYOUT,
    name: 'DCA Create Form Layout',
    description: 'Test different form layouts',
    enabled: false,
    variants: [
      { key: 'single_page', name: 'Single Page', weight: 50, value: 'single_page' },
      { key: 'multi_step', name: 'Multi-Step', weight: 50, value: 'multi_step' },
    ],
    defaultVariant: 'single_page',
  },

  // Pair detail banner placement
  [DCAABTestFlag.DCA_PAIR_DETAIL_PLACEMENT]: {
    key: DCAABTestFlag.DCA_PAIR_DETAIL_PLACEMENT,
    name: 'DCA Pair Detail Banner Placement',
    description: 'Test different placements for the DCA banner in Pair Detail page',
    enabled: false,
    variants: [
      { key: 'top', name: 'Top', weight: 50, value: 'top' },
      { key: 'bottom', name: 'Bottom', weight: 50, value: 'bottom' },
    ],
    defaultVariant: 'top',
  },
};

/* ═══════════════════════════════════════════
   FEATURE FLAG SERVICE INTERFACE
   ═══════════════════════════════════════════ */

/**
 * Feature Flag Service Interface
 */
export interface IFeatureFlagService {
  /** Check if flag is enabled */
  isEnabled(flagKey: string, userContext?: UserContext): boolean;
  
  /** Get flag value */
  getValue<T>(flagKey: string, defaultValue: T, userContext?: UserContext): T;
  
  /** Get variant for A/B test */
  getVariant(flagKey: string, userContext?: UserContext): string;
  
  /** Get all flags */
  getAllFlags(): Record<string, FeatureFlag>;
  
  /** Override flag (for testing) */
  override(flagKey: string, value: any): void;
  
  /** Clear overrides */
  clearOverrides(): void;
  
  /** Refresh flags from remote */
  refresh(): Promise<void>;
}

/* ═══════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════ */

/**
 * Feature Flag Configuration
 */
export interface FeatureFlagConfig {
  /** Enable feature flags */
  enabled: boolean;
  
  /** Debug mode */
  debug: boolean;
  
  /** Remote config URL */
  remoteConfigUrl?: string;
  
  /** Refresh interval (ms) */
  refreshInterval: number;
  
  /** Enable localStorage cache */
  cache: boolean;
  
  /** Cache TTL (ms) */
  cacheTTL: number;
}

/**
 * Default Feature Flag Configuration
 */
export const DEFAULT_FEATURE_FLAG_CONFIG: FeatureFlagConfig = {
  enabled: true,
  debug: false,
  refreshInterval: 300000, // 5 minutes
  cache: true,
  cacheTTL: 3600000, // 1 hour
};