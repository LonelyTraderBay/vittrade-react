/**
 * Analytics Type Definitions
 * 
 * Defines all analytics-related types for the app.
 * Supports DCA-specific events, user properties, and conversions.
 * 
 * @module types/analytics
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { DCAFrequency } from './dca';

/* ═══════════════════════════════════════════
   CORE ANALYTICS TYPES
   ═══════════════════════════════════════════ */

/**
 * Base analytics event
 */
export interface AnalyticsEvent {
  /** Unique event ID */
  event_id: string;
  
  /** Event name (e.g., 'dca_plan_created') */
  event_name: string;
  
  /** Unix timestamp (milliseconds) */
  timestamp: number;
  
  /** Session ID */
  session_id: string;
  
  /** User ID (if authenticated) */
  user_id?: string;
  
  /** Custom properties */
  properties?: Record<string, any>;
}

/**
 * User property update
 */
export interface UserProperty {
  key: string;
  value: any;
  timestamp: number;
}

/**
 * Performance metric
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
}

/* ═══════════════════════════════════════════
   DCA-SPECIFIC TYPES
   ═══════════════════════════════════════════ */

/**
 * DCA Event Source
 */
export type DCAEventSource = 
  | 'wallet'           // From wallet shortcut
  | 'asset_detail'     // From asset detail page
  | 'dca_page'         // From DCA page
  | 'profile'          // From profile
  | 'home'             // From home screen
  | 'notification'     // From push notification
  | 'pair_detail'      // From pair detail (Markets)
  | 'trade'            // From trade page quick nav chip
  | 'home_quick_action' // From home quick actions grid
  | 'profile_menu';    // From profile menu item

/**
 * DCA Analytics Event
 */
export interface DCAAnalyticsEvent extends AnalyticsEvent {
  /** DCA plan ID (if applicable) */
  plan_id?: string;
  
  /** Coin symbol (e.g., 'BTC') */
  coin_symbol?: string;
  
  /** Plan frequency */
  frequency?: DCAFrequency;
  
  /** Investment amount (VND) */
  amount?: number;
  
  /** Event source */
  source?: DCAEventSource;
  
  /** A/B test variant */
  variant?: string;
}

/**
 * DCA Conversion Event
 */
export interface DCAConversion {
  /** Conversion type */
  type: 'plan_created' | 'plan_activated' | 'plan_completed' | 'referral';
  
  /** Conversion value (VND) */
  value?: number;
  
  /** Time to convert (ms) */
  time_to_convert?: number;
  
  /** Source that led to conversion */
  source?: DCAEventSource;
  
  /** Additional context */
  context?: Record<string, any>;
}

/* ═══════════════════════════════════════════
   DCA EVENT NAMES
   ═══════════════════════════════════════════ */

/**
 * All DCA event names
 */
export const DCA_EVENTS = {
  // Discovery Events
  WALLET_SHORTCUT_IMPRESSION: 'dca_wallet_shortcut_impression',
  WALLET_SHORTCUT_CLICK: 'dca_wallet_shortcut_click',
  EMPTY_STATE_IMPRESSION: 'dca_empty_state_impression',
  EMPTY_STATE_CLICK: 'dca_empty_state_click',
  ASSET_DETAIL_BUTTON_IMPRESSION: 'dca_asset_detail_button_impression',
  ASSET_DETAIL_BUTTON_CLICK: 'dca_asset_detail_button_click',
  
  // New Entry Point Events (Phase 2 - Sprint 3)
  HOME_QUICK_ACTION_CLICK: 'dca_home_quick_action_click',
  TRADE_CHIP_CLICK: 'dca_trade_chip_click',
  PAIR_DETAIL_BANNER_IMPRESSION: 'dca_pair_detail_banner_impression',
  PAIR_DETAIL_BANNER_CLICK: 'dca_pair_detail_click',
  PROFILE_MENU_CLICK: 'dca_profile_menu_click',
  
  // Page Views
  PAGE_VIEWED: 'dca_page_viewed',
  CREATE_SHEET_OPENED: 'dca_create_sheet_opened',
  PLAN_DETAILS_VIEWED: 'dca_plan_details_viewed',
  HISTORY_VIEWED: 'dca_history_viewed',
  CHART_OPENED: 'dca_chart_opened',
  
  // Plan Management
  PLAN_CREATED: 'dca_plan_created',
  PLAN_ACTIVATED: 'dca_plan_activated',
  PLAN_PAUSED: 'dca_plan_paused',
  PLAN_DELETED: 'dca_plan_deleted',
  PLAN_EDITED: 'dca_plan_edited',
  
  // Execution Events
  EXECUTION_SUCCESS: 'dca_execution_success',
  EXECUTION_FAILED: 'dca_execution_failed',
  EXECUTION_SKIPPED: 'dca_execution_skipped',
  
  // Engagement
  TAB_SWITCHED: 'dca_tab_switched',
  FILTER_APPLIED: 'dca_filter_applied',
  SORT_CHANGED: 'dca_sort_changed',
  
  // Errors
  ERROR_OCCURRED: 'dca_error_occurred',
  API_ERROR: 'dca_api_error',
  
  // Deep Linking
  DEEP_LINK_OPENED: 'dca_deep_link_opened',
  PRESELECTED_COIN_USED: 'dca_preselected_coin_used',
} as const;

export type DCAEventName = typeof DCA_EVENTS[keyof typeof DCA_EVENTS];

/* ═══════════════════════════════════════════
   FUNNEL TRACKING
   ═══════════════════════════════════════════ */

/**
 * Conversion funnel step
 */
export interface FunnelStep {
  /** Step name */
  name: string;
  
  /** Step index (0-based) */
  index: number;
  
  /** Timestamp when step was reached */
  timestamp: number;
  
  /** Time since previous step (ms) */
  time_since_previous?: number;
}

/**
 * Funnel session
 */
export interface FunnelSession {
  /** Funnel ID */
  funnel_id: string;
  
  /** Session ID */
  session_id: string;
  
  /** Steps completed */
  steps: FunnelStep[];
  
  /** Whether funnel was completed */
  completed: boolean;
  
  /** Total time (ms) */
  total_time?: number;
  
  /** Dropout step (if not completed) */
  dropout_step?: string;
}

/**
 * DCA Funnels
 */
export const DCA_FUNNELS = {
  WALLET_TO_CREATION: 'dca_wallet_to_creation',
  ASSET_TO_CREATION: 'dca_asset_to_creation',
  FIRST_TIME_USER: 'dca_first_time_user',
  PAIR_DETAIL_TO_CREATION: 'dca_pair_detail_to_creation',
} as const;

export type DCAFunnelName = typeof DCA_FUNNELS[keyof typeof DCA_FUNNELS];

/* ═══════════════════════════════════════════
   ANALYTICS SERVICE INTERFACE
   ═══════════════════════════════════════════ */

/**
 * Analytics Service Interface
 */
export interface IAnalyticsService {
  /** Track an event */
  trackEvent(eventName: string, properties?: Record<string, any>): void;
  
  /** Set user property */
  setUserProperty(key: string, value: any): void;
  
  /** Track page view */
  trackPageView(pageName: string, properties?: Record<string, any>): void;
  
  /** Track conversion */
  trackConversion(conversion: DCAConversion): void;
  
  /** Track performance metric */
  trackPerformance(metric: PerformanceMetric): void;
  
  /** Flush queued events */
  flush(): Promise<void>;
  
  /** Enable debug mode */
  enableDebugMode(enabled: boolean): void;
  
  /** Get current session ID */
  getSessionId(): string;
}

/* ═══════════════════════════════════════════
   CONFIGURATION
   ═══════════════════════════════════════════ */

/**
 * Analytics Configuration
 */
export interface AnalyticsConfig {
  /** Enable analytics */
  enabled: boolean;
  
  /** Debug mode */
  debug: boolean;
  
  /** Batch size before auto-flush */
  batchSize: number;
  
  /** Auto-flush interval (ms) */
  flushInterval: number;
  
  /** Enable offline queue */
  offlineQueue: boolean;
  
  /** Max queue size */
  maxQueueSize: number;
  
  /** Sample rate (0-1) */
  sampleRate: number;
  
  /** User consent required */
  requireConsent: boolean;
}

/**
 * Default Analytics Configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  debug: false,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  offlineQueue: true,
  maxQueueSize: 100,
  sampleRate: 1.0, // 100% of events
  requireConsent: true,
};