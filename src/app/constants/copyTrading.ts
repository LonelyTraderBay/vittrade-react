/**
 * ══════════════════════════════════════════════════════════════
 *  Copy Trading Constants — Centralized Configuration
 * ══════════════════════════════════════════════════════════════
 * 
 * All magic numbers and configuration values extracted to constants
 * for maintainability and consistency across Copy Trading module
 */

/**
 * Fee structure for Copy Trading
 */
export const COPY_TRADING_FEES = {
  PLATFORM_PCT: 0.1,      // 0.1% platform fee on copy amount
  PERFORMANCE_PCT: 10,    // 10% of profit (high-water mark)
  TRADING_PCT: 0.25,      // 0.25% trading fee per transaction
} as const;

/**
 * Chart configuration for performance visualization
 */
export const CHART_CONFIG = {
  PERFORMANCE_DAYS: 90,          // 90 days performance history
  TICK_INTERVAL: 15,             // Show tick every 15 days
  TICKS: [0, 15, 30, 45, 60, 75, 90],  // X-axis tick positions
  COLORS: {
    POSITIVE: '#10B981',         // Green for positive performance
    NEGATIVE: '#EF4444',         // Red for negative performance
    PRIMARY: '#3B82F6',          // Primary accent
    WARNING: '#F59E0B',          // Warning/medium risk
    PIE_CHART: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
  },
} as const;

/**
 * Tier thresholds for provider verification levels
 */
export const TIER_THRESHOLDS = {
  PRO: 3000,              // > 3000 copiers = Pro Trader
  VERIFIED: 1000,         // > 1000 copiers = Verified
  BASIC: 0,               // Default tier
} as const;

/**
 * Risk level configuration
 */
export const RISK_LEVELS = {
  LOW: {
    key: 'low',
    color: '#10B981',
    label: 'Thấp',
    description: 'Conservative strategy, lower volatility',
  },
  MEDIUM: {
    key: 'medium',
    color: '#F59E0B',
    label: 'Trung bình',
    description: 'Balanced risk/reward profile',
  },
  HIGH: {
    key: 'high',
    color: '#EF4444',
    label: 'Cao',
    description: 'Aggressive strategy, higher volatility',
  },
} as const;

/**
 * Performance benchmarks for quality metrics
 */
export const PERFORMANCE_BENCHMARKS = {
  SHARPE_RATIO: {
    EXCELLENT: 3.0,
    GOOD: 2.0,
    ACCEPTABLE: 1.0,
  },
  SORTINO_RATIO: {
    EXCELLENT: 3.0,
    GOOD: 2.0,
    ACCEPTABLE: 1.0,
  },
  CALMAR_RATIO: {
    EXCELLENT: 4.0,
    GOOD: 3.0,
    ACCEPTABLE: 2.0,
  },
  PROFIT_FACTOR: {
    EXCELLENT: 2.0,
    GOOD: 1.5,
    ACCEPTABLE: 1.2,
  },
  WIN_RATE: {
    EXCELLENT: 75,    // 75%+
    GOOD: 65,         // 65%+
    ACCEPTABLE: 55,   // 55%+
  },
  MAX_DRAWDOWN: {
    EXCELLENT: -10,   // < -10%
    GOOD: -15,        // < -15%
    ACCEPTABLE: -20,  // < -20%
  },
} as const;

/**
 * Execution quality benchmarks (slippage, delay, fill rate)
 */
export const EXECUTION_BENCHMARKS = {
  AVG_SLIPPAGE: {
    EXCELLENT: 0.05,  // < 0.05%
    GOOD: 0.1,        // < 0.1%
    ACCEPTABLE: 0.2,  // < 0.2%
  },
  EXEC_DELAY_MS: {
    EXCELLENT: 500,   // < 500ms
    GOOD: 1000,       // < 1s
    ACCEPTABLE: 2000, // < 2s
  },
  FILL_RATE: {
    EXCELLENT: 98,    // > 98%
    GOOD: 95,         // > 95%
    ACCEPTABLE: 90,   // > 90%
  },
} as const;

/**
 * Sort options for provider listing
 */
export const SORT_OPTIONS = [
  'Top ROI',
  'Ổn định nhất',
  'Nhiều copier',
  'AUM cao',
] as const;

export type SortOption = typeof SORT_OPTIONS[number];

/**
 * Tab options for provider detail page
 */
export const PROVIDER_TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'performance', label: 'Hiệu suất' },
  { key: 'strategy', label: 'Chiến lược' },
  { key: 'disclosure', label: 'Công khai' },
] as const;

export type ProviderTabKey = typeof PROVIDER_TABS[number]['key'];

/**
 * Regulatory compliance messages
 */
export const COMPLIANCE_MESSAGES = {
  RISK_WARNING: 'Copy Trading có rủi ro cao. Hiệu suất quá khứ không đảm bảo lợi nhuận tương lai. Bạn có thể mất toàn bộ vốn đầu tư.',
  PAST_PERFORMANCE: 'Hiệu suất quá khứ không đảm bảo kết quả tương lai. Tất cả chỉ số mang tính tham khảo. Copy Trading có rủi ro cao, chỉ đầu tư với số tiền bạn có thể chấp nhận mất.',
  FIDUCIARY_DISCLAIMER: 'Provider không phải là investment advisor hoặc fiduciary. Chiến lược copy không phải là lời khuyên tài chính. Bạn hoàn toàn chịu trách nhiệm cho quyết định đầu tư của mình.',
  HIGH_WATER_MARK: 'Performance fee áp dụng high-water mark (chỉ tính trên profit mới)',
} as const;

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  MIN_COPY_AMOUNT: 100,       // Minimum $100 to copy
  MAX_COPY_AMOUNT: 100000,    // Maximum $100k to copy
  MAX_PROVIDERS_PER_USER: 10, // Max 10 providers simultaneously
  MIN_WIN_RATE: 0,            // 0%
  MAX_WIN_RATE: 100,          // 100%
  MIN_SHARPE: 0,              // Minimum acceptable Sharpe
  MAX_SHARPE: 5,              // Maximum realistic Sharpe
  WEEKLY_PNL_DAYS: 7,         // Weekly P/L array should have 7 days
} as const;
