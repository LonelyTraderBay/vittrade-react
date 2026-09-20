/**
 * A/B Test Definitions
 * 
 * Defines all active A/B tests for the DCA module.
 * Each test specifies variants, success metrics, and targeting.
 * 
 * @module config/abTests
 * @version 2.0 (Phase 2 - Sprint 2)
 */

/* ═══════════════════════════════════════════
   A/B TEST TYPES
   ═══════════════════════════════════════════ */

/**
 * A/B Test Definition
 */
export interface ABTest {
  /** Test ID */
  id: string;
  
  /** Test name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Is test active */
  active: boolean;
  
  /** Start date */
  startDate: Date;
  
  /** End date (optional) */
  endDate?: Date;
  
  /** Test variants */
  variants: ABTestVariant[];
  
  /** Success metric */
  successMetric: ABTestMetric;
  
  /** Minimum sample size per variant */
  minSampleSize: number;
  
  /** Target significance level (e.g., 0.95 for 95%) */
  targetSignificance: number;
  
  /** User segment (optional) */
  targetSegment?: string;
  
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * A/B Test Variant
 */
export interface ABTestVariant {
  /** Variant ID */
  id: string;
  
  /** Variant name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Traffic allocation (0-100) */
  allocation: number;
  
  /** Is control group */
  isControl: boolean;
  
  /** Configuration for this variant */
  config: Record<string, any>;
}

/**
 * Success Metric
 */
export interface ABTestMetric {
  /** Metric name */
  name: string;
  
  /** Metric type */
  type: 'conversion' | 'revenue' | 'engagement' | 'retention';
  
  /** Event name to track */
  eventName: string;
  
  /** Goal value (optional) */
  goalValue?: number;
  
  /** Higher is better? */
  higherIsBetter: boolean;
}

/**
 * Test Results
 */
export interface ABTestResults {
  /** Test ID */
  testId: string;
  
  /** Variant results */
  variants: VariantResults[];
  
  /** Winner (if determined) */
  winner?: string;
  
  /** Statistical significance */
  significance: number;
  
  /** Confidence level */
  confidence: number;
  
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Variant Results
 */
export interface VariantResults {
  /** Variant ID */
  variantId: string;
  
  /** Exposures (users who saw this variant) */
  exposures: number;
  
  /** Conversions */
  conversions: number;
  
  /** Conversion rate */
  conversionRate: number;
  
  /** Revenue (if applicable) */
  revenue?: number;
  
  /** Average revenue per user */
  arpu?: number;
  
  /** Standard error */
  standardError: number;
  
  /** Confidence interval */
  confidenceInterval: [number, number];
}

/* ═══════════════════════════════════════════
   ACTIVE A/B TESTS
   ═══════════════════════════════════════════ */

/**
 * Test 1: Wallet Shortcut Variant
 * 
 * Hypothesis: A compact shortcut will have higher CTR due to less cognitive load
 * 
 * Variants:
 * - Control (A): Full card with detailed stats
 * - Variant (B): Compact card with minimal info
 */
export const WALLET_SHORTCUT_TEST: ABTest = {
  id: 'dca_wallet_shortcut_v1',
  name: 'Wallet Shortcut Design',
  description: 'Test which shortcut design drives more engagement',
  active: true,
  startDate: new Date('2026-03-05'),
  endDate: new Date('2026-03-19'), // 2 weeks
  variants: [
    {
      id: 'full',
      name: 'Full Card',
      description: 'Full card with stats and CTA',
      allocation: 50,
      isControl: true,
      config: {
        variant: 'full',
        showStats: true,
        showChart: true,
        ctaText: 'Tạo kế hoạch DCA',
      },
    },
    {
      id: 'compact',
      name: 'Compact Card',
      description: 'Compact card with minimal info',
      allocation: 50,
      isControl: false,
      config: {
        variant: 'compact',
        showStats: false,
        showChart: false,
        ctaText: 'DCA ngay',
      },
    },
  ],
  successMetric: {
    name: 'Click-Through Rate',
    type: 'conversion',
    eventName: 'dca_wallet_shortcut_click',
    higherIsBetter: true,
  },
  minSampleSize: 1000,
  targetSignificance: 0.95,
};

/**
 * Test 2: Onboarding Flow
 * 
 * Hypothesis: A simplified 2-step flow will increase completion rate
 * 
 * Variants:
 * - Control (A): Current 3-step form
 * - Variant (B): Simplified 2-step
 * - Variant (C): Wizard with tooltips
 */
export const ONBOARDING_FLOW_TEST: ABTest = {
  id: 'dca_onboarding_v1',
  name: 'Onboarding Flow',
  description: 'Test which onboarding flow has highest completion rate',
  active: false, // Not active yet
  startDate: new Date('2026-03-12'),
  variants: [
    {
      id: 'v1',
      name: 'Current Flow',
      description: '3-step form (Coin → Amount → Frequency)',
      allocation: 34,
      isControl: true,
      config: {
        steps: 3,
        showTooltips: false,
        progressBar: true,
      },
    },
    {
      id: 'v2',
      name: 'Simplified',
      description: '2-step form (Basics → Review)',
      allocation: 33,
      isControl: false,
      config: {
        steps: 2,
        showTooltips: false,
        progressBar: true,
      },
    },
    {
      id: 'v3',
      name: 'Wizard',
      description: 'Guided wizard with tooltips',
      allocation: 33,
      isControl: false,
      config: {
        steps: 3,
        showTooltips: true,
        progressBar: true,
        showHelp: true,
      },
    },
  ],
  successMetric: {
    name: 'Completion Rate',
    type: 'conversion',
    eventName: 'dca_plan_created',
    higherIsBetter: true,
  },
  minSampleSize: 500,
  targetSignificance: 0.95,
};

/**
 * Test 3: Frequency Presets
 * 
 * Hypothesis: Adding "Every 2 weeks" option will increase plan creation
 * 
 * Variants:
 * - Control (A): Daily/Weekly/Monthly
 * - Variant (B): Add "Every 2 weeks"
 */
export const FREQUENCY_PRESETS_TEST: ABTest = {
  id: 'dca_frequency_v1',
  name: 'Frequency Presets',
  description: 'Test impact of additional frequency option',
  active: false,
  startDate: new Date('2026-03-19'),
  variants: [
    {
      id: 'simple',
      name: 'Simple Presets',
      description: 'Daily, Weekly, Monthly',
      allocation: 50,
      isControl: true,
      config: {
        presets: ['daily', 'weekly', 'monthly'],
      },
    },
    {
      id: 'advanced',
      name: 'Advanced Presets',
      description: 'Add "Every 2 weeks" option',
      allocation: 50,
      isControl: false,
      config: {
        presets: ['daily', 'weekly', 'biweekly', 'monthly'],
      },
    },
  ],
  successMetric: {
    name: 'Plan Creation Rate',
    type: 'conversion',
    eventName: 'dca_plan_created',
    higherIsBetter: true,
  },
  minSampleSize: 800,
  targetSignificance: 0.95,
};

/**
 * Test 4: Create Form Layout
 * 
 * Hypothesis: Multi-step form reduces cognitive load and increases completion
 * 
 * Variants:
 * - Control (A): Single page form
 * - Variant (B): Multi-step wizard
 */
export const CREATE_FORM_LAYOUT_TEST: ABTest = {
  id: 'dca_form_layout_v1',
  name: 'Create Form Layout',
  description: 'Test single-page vs multi-step form',
  active: false,
  startDate: new Date('2026-03-26'),
  variants: [
    {
      id: 'single_page',
      name: 'Single Page',
      description: 'All fields on one page',
      allocation: 50,
      isControl: true,
      config: {
        layout: 'single_page',
        showAllFields: true,
      },
    },
    {
      id: 'multi_step',
      name: 'Multi-Step',
      description: 'Wizard with 3 steps',
      allocation: 50,
      isControl: false,
      config: {
        layout: 'multi_step',
        steps: 3,
      },
    },
  ],
  successMetric: {
    name: 'Form Completion Rate',
    type: 'conversion',
    eventName: 'dca_plan_created',
    higherIsBetter: true,
  },
  minSampleSize: 600,
  targetSignificance: 0.95,
};

/**
 * Test 5: Pair Detail Banner Placement
 * 
 * Hypothesis: Placing the DCA banner BEFORE the risk warning
 * (closer to chart/content) will have higher CTR than placing it
 * AFTER the risk warning (closer to CTA buttons).
 * 
 * Context: Users may stop scrolling after seeing the risk warning.
 * Banner above risk warning catches attention while user is still
 * engaged with market data.
 * 
 * Variants:
 * - Control (A): "after_risk" — Banner between Risk Warning and CTA (current)
 * - Variant (B): "before_risk" — Banner between Content and Risk Warning
 */
export const PAIR_DETAIL_PLACEMENT_TEST: ABTest = {
  id: 'dca_pair_detail_placement_v1',
  name: 'Pair Detail DCA Banner Placement',
  description: 'Test whether placing DCA banner before or after risk warning gets more clicks',
  active: true,
  startDate: new Date('2026-03-05'),
  endDate: new Date('2026-03-19'), // 2 weeks
  variants: [
    {
      id: 'after_risk',
      name: 'After Risk Warning',
      description: 'DCA banner between risk warning and Buy/Sell CTA (current placement)',
      allocation: 50,
      isControl: true,
      config: {
        placement: 'after_risk',
        label: 'After Risk Warning (Control)',
      },
    },
    {
      id: 'before_risk',
      name: 'Before Risk Warning',
      description: 'DCA banner between content area and risk warning (higher visibility)',
      allocation: 50,
      isControl: false,
      config: {
        placement: 'before_risk',
        label: 'Before Risk Warning (Variant)',
      },
    },
  ],
  successMetric: {
    name: 'Banner Click-Through Rate',
    type: 'conversion',
    eventName: 'dca_pair_detail_click',
    higherIsBetter: true,
  },
  minSampleSize: 1000,
  targetSignificance: 0.95,
  metadata: {
    funnelId: 'pair_detail_to_creation',
    surfaces: ['PairDetailPage', 'ResponsivePairDetailPage'],
  },
};

/* ═══════════════════════════════════════════
   TEST REGISTRY
   ═══════════════════════════════════════════ */

/**
 * All A/B Tests
 */
export const ALL_AB_TESTS: Record<string, ABTest> = {
  [WALLET_SHORTCUT_TEST.id]: WALLET_SHORTCUT_TEST,
  [ONBOARDING_FLOW_TEST.id]: ONBOARDING_FLOW_TEST,
  [FREQUENCY_PRESETS_TEST.id]: FREQUENCY_PRESETS_TEST,
  [CREATE_FORM_LAYOUT_TEST.id]: CREATE_FORM_LAYOUT_TEST,
  [PAIR_DETAIL_PLACEMENT_TEST.id]: PAIR_DETAIL_PLACEMENT_TEST,
};

/**
 * Array of all A/B tests for easy iteration
 */
export const AB_TESTS: ABTest[] = [
  WALLET_SHORTCUT_TEST,
  ONBOARDING_FLOW_TEST,
  FREQUENCY_PRESETS_TEST,
  CREATE_FORM_LAYOUT_TEST,
  PAIR_DETAIL_PLACEMENT_TEST,
];

/**
 * Active tests only
 */
export function getActiveTests(): ABTest[] {
  return Object.values(ALL_AB_TESTS).filter(test => test.active);
}

/**
 * Get test by ID
 */
export function getTestById(testId: string): ABTest | undefined {
  return ALL_AB_TESTS[testId];
}

/**
 * Get test by feature flag key
 */
export function getTestByFlagKey(flagKey: string): ABTest | undefined {
  // Map feature flag keys to test IDs
  const flagToTestMap: Record<string, string> = {
    'dca_shortcut_variant': WALLET_SHORTCUT_TEST.id,
    'dca_onboarding_flow': ONBOARDING_FLOW_TEST.id,
    'dca_frequency_presets': FREQUENCY_PRESETS_TEST.id,
    'dca_create_form_layout': CREATE_FORM_LAYOUT_TEST.id,
    'dca_pair_detail_placement': PAIR_DETAIL_PLACEMENT_TEST.id,
  };
  
  const testId = flagToTestMap[flagKey];
  return testId ? ALL_AB_TESTS[testId] : undefined;
}