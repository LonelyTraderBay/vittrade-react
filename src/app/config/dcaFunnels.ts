/**
 * DCA Conversion Funnel Definitions
 * 
 * Defines conversion funnels for tracking user journeys.
 * Each funnel represents a key path to DCA plan creation.
 * 
 * @module config/dcaFunnels
 * @version 2.0 (Phase 2 - Sprint 2)
 */

/* ═══════════════════════════════════════════
   FUNNEL TYPES
   ═══════════════════════════════════════════ */

/**
 * Funnel Step Definition
 */
export interface FunnelStepDefinition {
  /** Step ID */
  id: string;
  
  /** Step name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Event name that triggers this step */
  eventName: string;
  
  /** Is this step required? */
  required: boolean;
  
  /** Expected time to next step (ms) */
  expectedDuration?: number;
}

/**
 * Funnel Definition
 */
export interface FunnelDefinition {
  /** Funnel ID */
  id: string;
  
  /** Funnel name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Steps in order */
  steps: FunnelStepDefinition[];
  
  /** Success event (final step) */
  successEvent: string;
  
  /** Expected completion time (ms) */
  expectedCompletionTime: number;
  
  /** Minimum time to be considered valid (ms) */
  minCompletionTime?: number;
  
  /** Metadata */
  metadata?: Record<string, any>;
}

/* ═══════════════════════════════════════════
   FUNNEL 1: WALLET DISCOVERY → PLAN CREATION
   ═══════════════════════════════════════════ */

/**
 * Wallet Discovery to Plan Creation Funnel
 * 
 * Tracks users who discover DCA through wallet shortcut
 * and complete plan creation.
 */
export const WALLET_TO_CREATION_FUNNEL: FunnelDefinition = {
  id: 'wallet_to_creation',
  name: 'Wallet Discovery → Plan Creation',
  description: 'User discovers DCA in wallet and creates first plan',
  steps: [
    {
      id: 'wallet_view',
      name: 'Wallet Page View',
      description: 'User views wallet page',
      eventName: 'page_view',
      required: true,
    },
    {
      id: 'shortcut_impression',
      name: 'Shortcut Impression',
      description: 'DCA shortcut is visible',
      eventName: 'dca_wallet_shortcut_impression',
      required: true,
      expectedDuration: 2000, // 2 seconds
    },
    {
      id: 'shortcut_click',
      name: 'Shortcut Click',
      description: 'User clicks DCA shortcut',
      eventName: 'dca_wallet_shortcut_click',
      required: true,
      expectedDuration: 5000, // 5 seconds
    },
    {
      id: 'dca_page_view',
      name: 'DCA Page View',
      description: 'User lands on DCA page',
      eventName: 'dca_page_viewed',
      required: true,
      expectedDuration: 1000, // 1 second
    },
    {
      id: 'create_button_click',
      name: 'Create Button Click',
      description: 'User clicks create plan button',
      eventName: 'dca_create_sheet_opened',
      required: true,
      expectedDuration: 10000, // 10 seconds
    },
    {
      id: 'plan_created',
      name: 'Plan Created',
      description: 'User successfully creates plan',
      eventName: 'dca_plan_created',
      required: true,
      expectedDuration: 30000, // 30 seconds
    },
  ],
  successEvent: 'dca_plan_created',
  expectedCompletionTime: 60000, // 1 minute
  minCompletionTime: 5000, // 5 seconds (to filter out bots)
};

/* ═══════════════════════════════════════════
   FUNNEL 2: ASSET DETAIL → PLAN CREATION
   ═══════════════════════════════════════════ */

/**
 * Asset Detail to Plan Creation Funnel
 * 
 * Tracks users who start DCA from asset detail page
 * with pre-selected coin.
 */
export const ASSET_TO_CREATION_FUNNEL: FunnelDefinition = {
  id: 'asset_to_creation',
  name: 'Asset Detail → Plan Creation',
  description: 'User creates DCA plan from asset detail page',
  steps: [
    {
      id: 'asset_view',
      name: 'Asset Detail View',
      description: 'User views asset detail page',
      eventName: 'page_view',
      required: true,
    },
    {
      id: 'dca_button_impression',
      name: 'DCA Button Impression',
      description: 'DCA button is visible',
      eventName: 'dca_asset_detail_button_impression',
      required: true,
      expectedDuration: 2000, // 2 seconds
    },
    {
      id: 'dca_button_click',
      name: 'DCA Button Click',
      description: 'User clicks DCA button',
      eventName: 'dca_asset_detail_button_click',
      required: true,
      expectedDuration: 5000, // 5 seconds
    },
    {
      id: 'create_sheet_opened',
      name: 'Create Sheet Opened',
      description: 'Create sheet opens with preselected coin',
      eventName: 'dca_create_sheet_opened',
      required: true,
      expectedDuration: 1000, // 1 second
    },
    {
      id: 'preselected_coin_used',
      name: 'Preselected Coin Used',
      description: 'User keeps preselected coin',
      eventName: 'dca_preselected_coin_used',
      required: false, // Optional, user might change coin
      expectedDuration: 2000, // 2 seconds
    },
    {
      id: 'plan_created',
      name: 'Plan Created',
      description: 'User successfully creates plan',
      eventName: 'dca_plan_created',
      required: true,
      expectedDuration: 25000, // 25 seconds
    },
  ],
  successEvent: 'dca_plan_created',
  expectedCompletionTime: 45000, // 45 seconds
  minCompletionTime: 3000, // 3 seconds
};

/* ═══════════════════════════════════════════
   FUNNEL 3: FIRST-TIME USER
   ═══════════════════════════════════════════ */

/**
 * First-Time User Funnel
 * 
 * Tracks new users from empty state to first plan creation.
 */
export const FIRST_TIME_USER_FUNNEL: FunnelDefinition = {
  id: 'first_time_user',
  name: 'First-Time User Journey',
  description: 'New user creates their first DCA plan',
  steps: [
    {
      id: 'dca_page_view',
      name: 'DCA Page View',
      description: 'User visits DCA page for first time',
      eventName: 'dca_page_viewed',
      required: true,
    },
    {
      id: 'empty_state_impression',
      name: 'Empty State Impression',
      description: 'Empty state is shown',
      eventName: 'dca_empty_state_impression',
      required: true,
      expectedDuration: 1000, // 1 second
    },
    {
      id: 'empty_state_click',
      name: 'Empty State CTA Click',
      description: 'User clicks CTA in empty state',
      eventName: 'dca_empty_state_click',
      required: true,
      expectedDuration: 5000, // 5 seconds
    },
    {
      id: 'create_sheet_opened',
      name: 'Create Sheet Opened',
      description: 'Create plan sheet opens',
      eventName: 'dca_create_sheet_opened',
      required: true,
      expectedDuration: 1000, // 1 second
    },
    {
      id: 'first_plan_created',
      name: 'First Plan Created',
      description: 'User creates their first plan',
      eventName: 'dca_plan_created',
      required: true,
      expectedDuration: 40000, // 40 seconds
    },
  ],
  successEvent: 'dca_plan_created',
  expectedCompletionTime: 60000, // 1 minute
  minCompletionTime: 5000, // 5 seconds
};

/* ═══════════════════════════════════════════
   FUNNEL 4: ACTIVATION (BONUS)
   ═══════════════════════════════════════════ */

/**
 * Plan Activation Funnel
 * 
 * Tracks users from plan creation to first execution.
 */
export const PLAN_ACTIVATION_FUNNEL: FunnelDefinition = {
  id: 'plan_activation',
  name: 'Plan Activation',
  description: 'User creates plan and waits for first execution',
  steps: [
    {
      id: 'plan_created',
      name: 'Plan Created',
      description: 'Plan is created',
      eventName: 'dca_plan_created',
      required: true,
    },
    {
      id: 'plan_details_viewed',
      name: 'Plan Details Viewed',
      description: 'User views plan details',
      eventName: 'dca_plan_details_viewed',
      required: false,
      expectedDuration: 10000, // 10 seconds
    },
    {
      id: 'first_execution',
      name: 'First Execution',
      description: 'First DCA execution completes',
      eventName: 'dca_execution_success',
      required: true,
      expectedDuration: 86400000, // 24 hours (depends on frequency)
    },
  ],
  successEvent: 'dca_execution_success',
  expectedCompletionTime: 86400000, // 24 hours
  minCompletionTime: 60000, // 1 minute
};

/* ═══════════════════════════════════════════
   FUNNEL 5: PAIR DETAIL → PLAN CREATION
   ═══════════════════════════════════════════ */

/**
 * Pair Detail to Plan Creation Funnel
 * 
 * Tracks users who discover DCA from pair detail page (Markets)
 * and complete plan creation with pre-selected coin.
 * 
 * Key difference from Asset funnel: this starts from Markets context
 * (user browsing coins) vs Wallet context (user managing assets).
 * Higher intent signal — user is already researching a specific coin.
 */
export const PAIR_DETAIL_TO_CREATION_FUNNEL: FunnelDefinition = {
  id: 'pair_detail_to_creation',
  name: 'Pair Detail → Plan Creation',
  description: 'User discovers DCA from market pair detail and creates plan',
  steps: [
    {
      id: 'pair_detail_view',
      name: 'Pair Detail View',
      description: 'User views pair detail page from Markets',
      eventName: 'page_view',
      required: true,
    },
    {
      id: 'dca_banner_impression',
      name: 'DCA Banner Impression',
      description: 'DCA contextual banner is visible on pair detail',
      eventName: 'dca_pair_detail_banner_impression',
      required: true,
      expectedDuration: 3000, // 3 seconds (user needs to scroll)
    },
    {
      id: 'dca_banner_click',
      name: 'DCA Banner Click',
      description: 'User clicks DCA banner with coin context',
      eventName: 'dca_pair_detail_click',
      required: true,
      expectedDuration: 8000, // 8 seconds
    },
    {
      id: 'dca_page_view',
      name: 'DCA Page View',
      description: 'User lands on DCA page with preselected coin',
      eventName: 'dca_page_viewed',
      required: true,
      expectedDuration: 1000, // 1 second
    },
    {
      id: 'preselected_coin_used',
      name: 'Preselected Coin Kept',
      description: 'User keeps the preselected coin from pair detail',
      eventName: 'dca_preselected_coin_used',
      required: false, // User might change coin
      expectedDuration: 2000,
    },
    {
      id: 'create_sheet_opened',
      name: 'Create Sheet Opened',
      description: 'User opens create plan sheet',
      eventName: 'dca_create_sheet_opened',
      required: true,
      expectedDuration: 10000, // 10 seconds
    },
    {
      id: 'plan_created',
      name: 'Plan Created',
      description: 'User successfully creates DCA plan',
      eventName: 'dca_plan_created',
      required: true,
      expectedDuration: 30000, // 30 seconds
    },
  ],
  successEvent: 'dca_plan_created',
  expectedCompletionTime: 60000, // 1 minute
  minCompletionTime: 5000, // 5 seconds
  metadata: {
    source: 'pair_detail',
    hasPreselectedCoin: true,
    abTestId: 'dca_pair_detail_placement_v1',
  },
};

/* ═══════════════════════════════════════════
   FUNNEL REGISTRY
   ═══════════════════════════════════════════ */

/**
 * All DCA Funnels
 */
export const ALL_DCA_FUNNELS: Record<string, FunnelDefinition> = {
  [WALLET_TO_CREATION_FUNNEL.id]: WALLET_TO_CREATION_FUNNEL,
  [ASSET_TO_CREATION_FUNNEL.id]: ASSET_TO_CREATION_FUNNEL,
  [FIRST_TIME_USER_FUNNEL.id]: FIRST_TIME_USER_FUNNEL,
  [PLAN_ACTIVATION_FUNNEL.id]: PLAN_ACTIVATION_FUNNEL,
  [PAIR_DETAIL_TO_CREATION_FUNNEL.id]: PAIR_DETAIL_TO_CREATION_FUNNEL,
};

/**
 * Array of all conversion funnels for easy iteration
 */
export const CONVERSION_FUNNELS: FunnelDefinition[] = [
  WALLET_TO_CREATION_FUNNEL,
  ASSET_TO_CREATION_FUNNEL,
  FIRST_TIME_USER_FUNNEL,
  PLAN_ACTIVATION_FUNNEL,
  PAIR_DETAIL_TO_CREATION_FUNNEL,
];

/**
 * Get funnel by ID
 */
export function getFunnelById(funnelId: string): FunnelDefinition | undefined {
  return ALL_DCA_FUNNELS[funnelId];
}

/**
 * Get all funnels
 */
export function getAllFunnels(): FunnelDefinition[] {
  return Object.values(ALL_DCA_FUNNELS);
}

/**
 * Get funnels that track a specific event
 */
export function getFunnelsByEvent(eventName: string): FunnelDefinition[] {
  return getAllFunnels().filter(funnel =>
    funnel.steps.some(step => step.eventName === eventName)
  );
}