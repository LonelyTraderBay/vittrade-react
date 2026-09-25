import type { FeatureFlag } from '@/shared/types/feature-flags';

export enum DCAFeatureFlag {
  DCA_ENABLED = 'dca_enabled',
  DCA_WALLET_SHORTCUT = 'dca_wallet_shortcut',
  DCA_ASSET_DETAIL_BUTTON = 'dca_asset_detail_button',
  DCA_DEEP_LINKING = 'dca_deep_linking',
  DCA_ADVANCED_OPTIONS = 'dca_advanced_options',
  DCA_NOTIFICATIONS = 'dca_notifications',
  DCA_AUTO_REBALANCE = 'dca_auto_rebalance',
  DCA_PORTFOLIO_CHART = 'dca_portfolio_chart',
  DCA_LEADERBOARD = 'dca_leaderboard',
  DCA_SOCIAL_SHARING = 'dca_social_sharing',
  DCA_HOME_QUICK_ACTION = 'dca_home_quick_action',
  DCA_TRADE_CHIP = 'dca_trade_chip',
  DCA_PAIR_DETAIL_BANNER = 'dca_pair_detail_banner',
  DCA_PROFILE_MENU = 'dca_profile_menu',
}

export enum DCAABTestFlag {
  DCA_SHORTCUT_VARIANT = 'dca_shortcut_variant',
  DCA_ONBOARDING_FLOW = 'dca_onboarding_flow',
  DCA_FREQUENCY_PRESETS = 'dca_frequency_presets',
  DCA_CREATE_FORM_LAYOUT = 'dca_create_form_layout',
  DCA_PAIR_DETAIL_PLACEMENT = 'dca_pair_detail_placement',
}

function flag(
  key: DCAFeatureFlag,
  name: string,
  description: string,
  enabled: boolean,
): FeatureFlag {
  return { key, name, description, enabled, rolloutPercentage: enabled ? 100 : 0 };
}

export const DEFAULT_DCA_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  [DCAFeatureFlag.DCA_ENABLED]: flag(
    DCAFeatureFlag.DCA_ENABLED,
    'DCA Enabled',
    'Master kill switch for entire DCA module',
    true,
  ),
  [DCAFeatureFlag.DCA_WALLET_SHORTCUT]: flag(
    DCAFeatureFlag.DCA_WALLET_SHORTCUT,
    'DCA Wallet Shortcut',
    'Show DCA shortcut card in Wallet page',
    true,
  ),
  [DCAFeatureFlag.DCA_ASSET_DETAIL_BUTTON]: flag(
    DCAFeatureFlag.DCA_ASSET_DETAIL_BUTTON,
    'DCA Asset Detail Button',
    'Show DCA button in asset detail page',
    true,
  ),
  [DCAFeatureFlag.DCA_DEEP_LINKING]: flag(
    DCAFeatureFlag.DCA_DEEP_LINKING,
    'DCA Deep Linking',
    'Enable deep linking with URL params',
    true,
  ),
  [DCAFeatureFlag.DCA_ADVANCED_OPTIONS]: flag(
    DCAFeatureFlag.DCA_ADVANCED_OPTIONS,
    'DCA Advanced Options',
    'Show advanced options in create form',
    false,
  ),
  [DCAFeatureFlag.DCA_NOTIFICATIONS]: flag(
    DCAFeatureFlag.DCA_NOTIFICATIONS,
    'DCA Notifications',
    'Enable push notifications for DCA events',
    false,
  ),
  [DCAFeatureFlag.DCA_AUTO_REBALANCE]: flag(
    DCAFeatureFlag.DCA_AUTO_REBALANCE,
    'DCA Auto Rebalance',
    'Enable automatic portfolio rebalancing',
    false,
  ),
  [DCAFeatureFlag.DCA_PORTFOLIO_CHART]: flag(
    DCAFeatureFlag.DCA_PORTFOLIO_CHART,
    'DCA Portfolio Chart',
    'Show portfolio performance chart',
    true,
  ),
  [DCAFeatureFlag.DCA_LEADERBOARD]: flag(
    DCAFeatureFlag.DCA_LEADERBOARD,
    'DCA Leaderboard',
    'Show DCA performance leaderboard',
    false,
  ),
  [DCAFeatureFlag.DCA_SOCIAL_SHARING]: flag(
    DCAFeatureFlag.DCA_SOCIAL_SHARING,
    'DCA Social Sharing',
    'Allow users to share DCA results',
    false,
  ),
  [DCAFeatureFlag.DCA_HOME_QUICK_ACTION]: flag(
    DCAFeatureFlag.DCA_HOME_QUICK_ACTION,
    'DCA Home Quick Action',
    'Show DCA quick action in Home page',
    false,
  ),
  [DCAFeatureFlag.DCA_TRADE_CHIP]: flag(
    DCAFeatureFlag.DCA_TRADE_CHIP,
    'DCA Trade Chip',
    'Show DCA chip in Trade page',
    false,
  ),
  [DCAFeatureFlag.DCA_PAIR_DETAIL_BANNER]: flag(
    DCAFeatureFlag.DCA_PAIR_DETAIL_BANNER,
    'DCA Pair Detail Banner',
    'Show DCA banner in Pair Detail page',
    false,
  ),
  [DCAFeatureFlag.DCA_PROFILE_MENU]: flag(
    DCAFeatureFlag.DCA_PROFILE_MENU,
    'DCA Profile Menu',
    'Show DCA option in Profile menu',
    false,
  ),
};

export const DEFAULT_DCA_AB_TEST_FLAGS: Record<string, FeatureFlag> = {
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
