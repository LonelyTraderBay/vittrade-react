/**
 * ══════════════════════════════════════════════════════════
 *  APP CONFIGURATION CONSTANTS
 * ══════════════════════════════════════════════════════════
 *
 *  Centralized application configuration values.
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  TIMEOUT: 30000,              // 30 seconds
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,           // 1 second
  BASE_URL: '/api',            // Mock API base
} as const;

/**
 * Price Update Intervals (milliseconds)
 */
export const UPDATE_INTERVALS = {
  PRICE_FAST: 1000,            // 1 second (active trading)
  PRICE_NORMAL: 3000,          // 3 seconds (normal view)
  PRICE_SLOW: 10000,           // 10 seconds (background)
  ORDERBOOK: 2000,             // 2 seconds
  BALANCE: 5000,               // 5 seconds
  PORTFOLIO: 10000,            // 10 seconds
} as const;

/**
 * Toast / Notification Durations (milliseconds)
 */
export const TOAST_DURATION = {
  SHORT: 2000,
  DEFAULT: 3000,
  LONG: 5000,
  ERROR: 7000,
} as const;

/**
 * Animation Durations (milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  DEFAULT: 300,
  SLOW: 500,
  PAGE_TRANSITION: 350,
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE: 1,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Form Validation
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  MIN_AMOUNT: 0.00000001,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_COMMENT_LENGTH: 1000,
} as const;

/**
 * Trading Limits
 */
export const TRADING_LIMITS = {
  MIN_ORDER_SIZE: 0.00001,
  MAX_LEVERAGE: 125,
  MAX_OPEN_ORDERS: 200,
  MIN_NOTIONAL: 10,            // Min order value in USDT
} as const;

/**
 * P2P Configuration
 */
export const P2P_CONFIG = {
  MIN_ORDER_TIME: 15,          // minutes
  MAX_ORDER_TIME: 120,         // minutes
  DEFAULT_ORDER_TIME: 30,      // minutes
  ESCROW_RELEASE_DELAY: 0,     // seconds (instant)
  MIN_TRADE_AMOUNT: 100000,    // VND
  MAX_TRADE_AMOUNT: 100000000, // VND
} as const;

/**
 * Arena Configuration
 */
export const ARENA_CONFIG = {
  MIN_ENTRY_FEE: 10,           // Arena Points
  MAX_ENTRY_FEE: 10000,        // Arena Points
  MIN_PARTICIPANTS: 2,
  MAX_PARTICIPANTS: 1000,
  RULE_CLARITY_THRESHOLD: 70,  // Score out of 100
  MIN_TITLE_LENGTH: 10,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

/**
 * Prediction Markets Configuration
 */
export const PREDICTION_CONFIG = {
  MIN_SHARES: 1,
  MAX_SHARES: 100000,
  MIN_PROBABILITY: 1,          // 1%
  MAX_PROBABILITY: 99,         // 99%
  FEE_PERCENTAGE: 2,           // 2%
  LIQUIDITY_THRESHOLD: 1000,   // Min liquidity in USDT
} as const;

/**
 * Cache Expiration (milliseconds)
 */
export const CACHE_EXPIRATION = {
  PRICE: 3000,                 // 3 seconds
  MARKET_DATA: 10000,          // 10 seconds
  USER_PROFILE: 300000,        // 5 minutes
  STATIC_DATA: 3600000,        // 1 hour
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  CHART_SETTINGS: 'chart_settings',
  WATCHLIST: 'watchlist',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_VISITED_PAGE: 'last_visited_page',
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
  ENABLE_P2P: true,
  ENABLE_ARENA: true,
  ENABLE_PREDICTION: true,
  ENABLE_DCA: true,
  ENABLE_FUTURES: false,       // Not yet implemented
  ENABLE_STAKING: false,       // Not yet implemented
  DEMO_MODE: true,             // Allow demo/mock trading
} as const;

/**
 * App Metadata
 */
export const APP_META = {
  NAME: 'Trading App',
  VERSION: '2.0.0',
  BUILD_DATE: '2026-03-04',
  SUPPORT_EMAIL: 'support@example.com',
  SUPPORT_URL: 'https://support.example.com',
} as const;

/**
 * Error Messages (Centralized)
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  TIMEOUT_ERROR: 'Yêu cầu hết thời gian. Vui lòng thử lại.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  UNAUTHORIZED: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền truy cập.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  INSUFFICIENT_BALANCE: 'Số dư không đủ.',
} as const;

/**
 * Success Messages (Centralized)
 */
export const SUCCESS_MESSAGES = {
  ORDER_PLACED: 'Đặt lệnh thành công',
  ORDER_CANCELLED: 'Hủy lệnh thành công',
  TRANSFER_SUCCESS: 'Chuyển tiền thành công',
  PROFILE_UPDATED: 'Cập nhật thông tin thành công',
  PASSWORD_CHANGED: 'Đổi mật khẩu thành công',
  SETTINGS_SAVED: 'Lưu cài đặt thành công',
} as const;

/**
 * Debounce Delays (milliseconds)
 */
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  RESIZE: 200,
  SCROLL: 100,
} as const;

/**
 * Chart Configuration
 */
export const CHART_CONFIG = {
  DEFAULT_INTERVAL: '1h' as const,
  DEFAULT_INDICATORS: ['MA', 'VOLUME'],
  MAX_CANDLES: 1000,
  COLORS: {
    UP: '#10B981',
    DOWN: '#EF4444',
    VOLUME: 'rgba(59, 130, 246, 0.3)',
  },
} as const;
