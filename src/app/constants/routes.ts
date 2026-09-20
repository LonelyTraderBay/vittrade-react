/**
 * ══════════════════════════════════════════════════════════
 *  ROUTE CONSTANTS
 * ══════════════════════════════════════════════════════════
 *
 *  Centralized route paths for consistent navigation.
 *  Use these instead of hardcoded strings.
 */

/**
 * Main Tab Routes
 */
export const MAIN_ROUTES = {
  HOME: '/home',
  MARKETS: '/markets',
  TRADE: '/trade',
  WALLET: '/wallet',
  PROFILE: '/profile',
} as const;

/**
 * Trading Routes
 */
export const TRADING_ROUTES = {
  SPOT: '/trade/:pair',
  CONVERT: '/trade/convert',
  ORDERS: '/trade/orders',
  HISTORY: '/trade/history',
} as const;

/**
 * Wallet Routes
 */
export const WALLET_ROUTES = {
  OVERVIEW: '/wallet',
  DEPOSIT: '/wallet/deposit',
  WITHDRAW: '/wallet/withdraw',
  TRANSFER: '/wallet/transfer',
  HISTORY: '/wallet/history',
  ADDRESS_BOOK: '/wallet/address-book',
} as const;

/**
 * Markets Routes
 */
export const MARKETS_ROUTES = {
  OVERVIEW: '/markets',
  SPOT: '/markets/spot',
  FAVORITES: '/markets/favorites',
  GAINERS: '/markets/gainers',
  LOSERS: '/markets/losers',
  NEW_LISTINGS: '/markets/new-listings',
  DETAIL: '/markets/:symbol',
} as const;

/**
 * Prediction Markets Routes
 */
export const PREDICTION_ROUTES = {
  HOME: '/markets/predictions',
  EVENT: '/markets/predictions/:eventId',
  PORTFOLIO: '/profile/predictions',
  ORDERS: '/markets/predictions/orders',
  ACTIVITY: '/markets/predictions/activity',
  LEADERBOARD: '/markets/predictions/leaderboard',
  REWARDS: '/markets/predictions/rewards',
} as const;

/**
 * Arena Routes
 */
export const ARENA_ROUTES = {
  HOME: '/arena',
  STUDIO: '/arena/studio',
  MODE: '/arena/modes/:modeId',
  CHALLENGE: '/arena/challenges/:challengeId',
  CREATOR: '/arena/creators/:creatorId',
  MY_ARENA: '/profile/arena',
  LEADERBOARD: '/arena/leaderboard',
  SAFETY: '/arena/safety',
  RESOLUTION: '/arena/resolution',
  LEDGER: '/profile/arena/ledger',
} as const;

/**
 * P2P Routes
 */
export const P2P_ROUTES = {
  MARKETPLACE: '/p2p',
  OFFER: '/p2p/offers/:offerId',
  CREATE_ORDER: '/p2p/orders/create',
  ORDER_ROOM: '/p2p/orders/:orderId',
  MY_ORDERS: '/p2p/orders',
  PAYMENT_METHODS: '/p2p/payment-methods',
  ADD_METHOD: '/p2p/payment-methods/add',
  DISPUTE: '/p2p/disputes/:disputeId',
  INSURANCE: '/p2p/insurance-fund',
} as const;

/**
 * Profile Routes
 */
export const PROFILE_ROUTES = {
  OVERVIEW: '/profile',
  SETTINGS: '/profile/settings',
  SECURITY: '/profile/security',
  KYC: '/profile/kyc',
  ACTIVITY: '/profile/activity',
  API_KEYS: '/profile/api',
  REFERRAL: '/profile/referral',
  EARN: '/profile/earn',
} as const;

/**
 * Auth Routes
 */
export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  TWO_FA: '/2fa',
} as const;

/**
 * Utility Routes
 */
export const UTILITY_ROUTES = {
  NOTIFICATIONS: '/notifications',
  SUPPORT: '/support',
  NEWS: '/news',
  ANNOUNCEMENTS: '/announcements',
  SEARCH: '/search',
  NOT_FOUND: '/404',
} as const;

/**
 * Topic Hub Routes (Discovery)
 */
export const TOPIC_ROUTES = {
  HUB: '/topics/:topic',
  CRYPTO: '/topics/crypto',
  SPORTS: '/topics/sports',
  POLITICS: '/topics/politics',
  TECH: '/topics/tech',
  SEARCH: '/topics/search',
} as const;

/**
 * DCA Routes
 */
export const DCA_ROUTES = {
  OVERVIEW: '/dca',
  CREATE: '/dca/create',
  PLAN: '/dca/plans/:planId',
  HISTORY: '/dca/history',
} as const;

/**
 * All Routes Combined
 */
export const ROUTES = {
  ...MAIN_ROUTES,
  ...TRADING_ROUTES,
  ...WALLET_ROUTES,
  ...MARKETS_ROUTES,
  ...PREDICTION_ROUTES,
  ...ARENA_ROUTES,
  ...P2P_ROUTES,
  ...PROFILE_ROUTES,
  ...AUTH_ROUTES,
  ...UTILITY_ROUTES,
  ...TOPIC_ROUTES,
  ...DCA_ROUTES,
} as const;

/**
 * Route Path Helper Functions
 */

/**
 * Build path with params
 * @example buildPath('/trade/:pair', { pair: 'BTCUSDT' }) // "/trade/BTCUSDT"
 */
export function buildPath(template: string, params: Record<string, string>): string {
  let path = template;
  Object.entries(params).forEach(([key, value]) => {
    path = path.replace(`:${key}`, value);
  });
  return path;
}

/**
 * Check if route matches pattern
 */
export function matchesRoute(path: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * Extract params from path
 * @example extractParams('/trade/BTCUSDT', '/trade/:pair') // { pair: 'BTCUSDT' }
 */
export function extractParams(path: string, pattern: string): Record<string, string> {
  const pathSegments = path.split('/').filter(Boolean);
  const patternSegments = pattern.split('/').filter(Boolean);
  const params: Record<string, string> = {};

  patternSegments.forEach((segment, index) => {
    if (segment.startsWith(':')) {
      const paramName = segment.slice(1);
      params[paramName] = pathSegments[index];
    }
  });

  return params;
}

/**
 * Build query string
 * @example buildQuery({ page: 1, limit: 20 }) // "?page=1&limit=20"
 */
export function buildQuery(params: Record<string, string | number | boolean>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    query.append(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}