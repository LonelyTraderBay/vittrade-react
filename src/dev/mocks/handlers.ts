import { http, HttpResponse } from 'msw';
import {
  DEPOSIT_NETWORKS,
  COPY_TRADERS,
  USER_PROFILE,
  TRUSTED_DEVICES,
  ACTIVITY_LOGS,
  SUB_ACCOUNTS,
  NEWS_ARTICLES,
  NOTIFICATIONS,
  SUPPORT_TICKETS,
  HELP_CATEGORIES,
  HELP_ARTICLES,
  P2P_ADS,
  P2P_AD_ANALYTICS,
  P2P_MERCHANTS,
  P2P_MY_ADS,
  P2P_ORDER,
  P2P_ORDERS,
  P2P_DISPUTES,
  P2P_PAYMENT_METHODS,
  P2P_BLACKLIST,
  P2P_REVIEWS,
  P2P_CHAT_MESSAGES,
  P2P_PLATFORM_STATS,
  P2P_STATISTICS,
  P2P_TRADING_LEVELS,
  P2P_USER_LEVEL,
  PRICE_ALERTS,
  TRANSACTIONS,
  WATCHLIST,
  WITHDRAW_NETWORKS,
  CRYPTO_PAIRS,
} from '@/dev/mocks/trading-fixtures';
import {
  FEAR_GREED_HISTORY,
  GLOBAL_MARKET_STATS,
  MARKET_BREADTH,
  MARKET_SECTORS,
  getMostActive,
  getNewListings,
  getTopGainers,
  getTopLosers,
  getUnusualVolume,
} from '@/dev/mocks/market-overview-fixtures';
import {
  LEADERBOARD_DATA,
  PREDICTION_EVENTS,
  PREDICTION_ORDER_RECEIPTS,
  PREDICTION_POSITIONS,
  PREDICTION_REWARDS,
  generateGlobalActivity,
} from '@/dev/mocks/prediction-fixtures';
import {
  ARENA_CHALLENGES,
  ARENA_CREATORS,
  ARENA_MODES,
  ARENA_ROOMS,
  ARENA_TEMPLATES,
} from '@/dev/mocks/arena-fixtures';
import {
  SHARED_TOPICS,
  mapArenaTagToTopic,
  mapCategoryToTopic,
} from '@/dev/mocks/arena-prediction-topics';
import {
  ACTIVE_CAMPAIGN,
  REFERRAL_FRIENDS,
  getCurrentTier,
  getReferralStats,
} from '@/dev/mocks/referral-fixtures';
import {
  PROJECTS as LAUNCHPAD_PROJECTS,
  getProject as getLaunchpadProject,
} from './launchpad-fixtures';
import { getTestDcaSnapshot } from './dca-fixtures';
import { getTestEarnSnapshot, getTestEarnTransactionsPage } from './earn-fixtures';
import { getTradingAnalytics } from './trading-analytics-fixtures';

const user = {
  id: 'dev-user-1',
  email: 'developer@vittrade.local',
  fullName: 'VitTrade Developer',
  roles: ['user'],
  permissions: ['market:read', 'trading:write', 'wallet:read'],
  kycStatus: 'verified' as const,
  accountStatus: 'active' as const,
};

let authenticated = false;
const devPriceAlerts = PRICE_ALERTS.map((alert) => ({ ...alert }));
const devP2pAds = P2P_ADS.map((ad) => ({ ...ad }));
const devP2pMineAds = P2P_MY_ADS.map((ad) => ({ ...ad }));
const devP2pPaymentMethods = P2P_PAYMENT_METHODS.map((method) => ({ ...method }));
const devP2pBlacklist = P2P_BLACKLIST.map((entry) => ({ ...entry }));
const devP2pReviews = P2P_REVIEWS.map((review) => ({ ...review }));
const devP2pChatMessages = P2P_CHAT_MESSAGES.map((message) => ({ ...message }));
const devCopyTraders = COPY_TRADERS.map((trader, index) => ({
  ...trader,
  verified: index !== 2,
}));
const devProfile = { ...USER_PROFILE };
const devProfileDevices = TRUSTED_DEVICES.map((device) => ({ ...device }));
const devProfileActivity = ACTIVITY_LOGS.map((log) => ({ ...log }));
const devProfileSubAccounts = SUB_ACCOUNTS.map((account) => ({
  ...account,
  permissions: [...account.permissions],
}));
const devAdminOverview = {
  activeUsers: 1284,
  verifiedUsers: 947,
  grossVolume: '4821900.42 USDT',
  generatedAt: '2026-09-22T08:00:00.000Z',
};
const devAdminFunnel = {
  steps: [
    { key: 'landing', count: 10_000, conversionRate: 1 },
    { key: 'login', count: 6_800, conversionRate: 0.68 },
    { key: 'first-trade', count: 2_420, conversionRate: 0.242 },
  ],
};
const devAdminAbTests = [
  {
    id: 'dev-ab-trade-terminal',
    key: 'trade-terminal-v2',
    status: 'running' as const,
    owner: 'growth',
    expiresAt: '2026-10-01T00:00:00.000Z',
    variants: [
      { key: 'control', rolloutPercentage: 50 },
      { key: 'compact', rolloutPercentage: 50 },
    ],
  },
];
const devAdminFeatureFlags = new Map([
  [
    'trade-terminal-v2',
    {
      key: 'trade-terminal-v2',
      enabled: true,
      rolloutPercentage: 50,
      owner: 'growth',
      expiresAt: '2026-10-01T00:00:00.000Z',
      rollbackBehavior: 'previous-version',
    },
  ],
]);
const devAdminFlagIdempotency = new Map<string, string>();
const devNewsArticles = NEWS_ARTICLES.map((article) => ({ ...article, tags: [...article.tags] }));
const devNotifications = NOTIFICATIONS.map((notification) => ({ ...notification }));
const devSupportTickets = SUPPORT_TICKETS.map((ticket) => ({
  ...ticket,
  messages: ticket.messages.map((message) => ({ ...message })),
}));
const devHelpCategories = HELP_CATEGORIES.map((category) => ({ ...category }));
const devHelpArticles = HELP_ARTICLES.map((article) => ({ ...article }));
const devPredictionEvents = PREDICTION_EVENTS.map((event) => ({
  ...event,
  tags: [...event.tags],
  outcomes: event.outcomes.map((outcome) => ({ ...outcome })),
}));
const devPredictionPositions = PREDICTION_POSITIONS.map((position) => ({ ...position }));
const devPredictionRewards = PREDICTION_REWARDS.map((reward) => ({ ...reward }));
const devPredictionReceipts = PREDICTION_ORDER_RECEIPTS.map((receipt) => ({
  ...receipt,
  timeline: receipt.timeline.map((item) => ({ ...item })),
}));
const devPredictionInitialReceipts = devPredictionReceipts.map((receipt) => ({
  ...receipt,
  timeline: receipt.timeline.map((item) => ({ ...item })),
}));
const devPredictionIdempotency = new Map<string, string>();

export function resetDevPredictionState(): void {
  devPredictionReceipts.splice(
    0,
    devPredictionReceipts.length,
    ...devPredictionInitialReceipts.map((receipt) => ({
      ...receipt,
      timeline: receipt.timeline.map((item) => ({ ...item })),
    })),
  );
  devPredictionIdempotency.clear();
}

const devArenaJoinResponses = new Map<string, unknown>();

export function resetDevArenaState(): void {
  devArenaJoinResponses.clear();
}

const devPredictionActivity = generateGlobalActivity();
const devCopyProviderPnlHistory = [
  { day: '1', pnl: 120, cumPnl: 120 },
  { day: '2', pnl: -40, cumPnl: 80 },
  { day: '3', pnl: 210, cumPnl: 290 },
  { day: '4', pnl: 95, cumPnl: 385 },
  { day: '5', pnl: -20, cumPnl: 365 },
  { day: '6', pnl: 180, cumPnl: 545 },
  { day: '7', pnl: 140, cumPnl: 685 },
];
const devCopyProviderTrades = [
  {
    id: 'copy-trade-1',
    pair: 'BTC/USDT',
    side: 'long' as const,
    entry: 65_200,
    exit: 67_543,
    pnl: 2343,
    pnlPct: 3.59,
    time: '2h trước',
    status: 'closed' as const,
  },
  {
    id: 'copy-trade-2',
    pair: 'ETH/USDT',
    side: 'short' as const,
    entry: 3620,
    exit: 3521,
    pnl: 990,
    pnlPct: 2.73,
    time: '5h trước',
    status: 'closed' as const,
  },
  {
    id: 'copy-trade-3',
    pair: 'SOL/USDT',
    side: 'long' as const,
    entry: 172,
    pnl: 316,
    pnlPct: 3.37,
    time: '1d trước',
    status: 'open' as const,
  },
];
type DevCopyRelationship = {
  id: string;
  provider: (typeof devCopyTraders)[number];
  status: 'active' | 'paused' | 'cooling-off' | 'stopped';
  copyMode: 'mirror' | 'fixed' | 'smart';
  positionSizing: 'percentage' | 'fixed';
  copyRatio?: number;
  capital: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  trades: number;
  winRate: number;
  coolingOffUntil?: string;
  hasCustomStopLoss: boolean;
  stopLossLevel?: number;
  performanceHistory: Array<{ date: string; value: number }>;
};
const devCopyRelationships: DevCopyRelationship[] = [
  {
    id: 'copy-relationship-1',
    provider: devCopyTraders[0],
    status: 'active' as const,
    copyMode: 'mirror' as const,
    positionSizing: 'percentage' as const,
    copyRatio: 50,
    capital: 5_000,
    currentValue: 5_420,
    pnl: 420,
    pnlPct: 8.4,
    trades: 34,
    winRate: 76,
    hasCustomStopLoss: true,
    stopLossLevel: 12,
    performanceHistory: [
      { date: '2026-09-16', value: 5_120 },
      { date: '2026-09-18', value: 5_270 },
      { date: '2026-09-20', value: 5_420 },
    ],
  },
];
const devP2pReports: Array<{
  reportId: string;
  merchantId: string;
  reason: string;
  detail?: string;
  createdAt: string;
}> = [];
const devP2pAchievements = [
  {
    id: 'ach-first-trade',
    title: 'Giao dịch đầu tiên',
    description: 'Hoàn thành giao dịch P2P đầu tiên',
    progress: 100,
    currentValue: 1,
    targetValue: 1,
    unit: 'giao dịch',
    unlocked: true,
    unlockedAt: '2026-01-15',
    reward: '+5 điểm uy tín',
    category: 'trades' as const,
  },
  {
    id: 'ach-volume-100m',
    title: 'Volume 100M',
    description: 'Tổng khối lượng giao dịch đạt 100M VND',
    progress: 100,
    currentValue: 100,
    targetValue: 100,
    unit: 'triệu VND',
    unlocked: true,
    unlockedAt: '2026-02-15',
    reward: 'Giảm phí 0.05%',
    category: 'volume' as const,
  },
  {
    id: 'ach-trades-100',
    title: 'Bách chiến bách thắng',
    description: 'Hoàn thành 100 giao dịch thành công',
    progress: 78,
    currentValue: 78,
    targetValue: 100,
    unit: 'giao dịch',
    unlocked: false,
    reward: '+30 điểm uy tín',
    category: 'trades' as const,
  },
  {
    id: 'ach-trust',
    title: 'Tỷ lệ hoàn tất 98%+',
    description: 'Duy trì tỷ lệ hoàn tất cao với tối thiểu 20 giao dịch',
    progress: 100,
    currentValue: 98.5,
    targetValue: 98,
    unit: '%',
    unlocked: true,
    unlockedAt: '2026-02-20',
    reward: 'Huy hiệu Tin cậy',
    category: 'trust' as const,
  },
];
const devP2pDisputes = P2P_DISPUTES.map((dispute) => ({
  ...dispute,
  evidence: [...dispute.evidence],
  timeline: dispute.timeline.map((event) => ({ ...event })),
  supportMessages: dispute.supportMessages.map((message) => ({ ...message })),
  escalationLevel: dispute.status === 'submitted' ? 1 : 2,
}));
const devP2pDashboard = {
  stats: {
    totalOrders: P2P_STATISTICS.totalOrders,
    completedOrders: P2P_STATISTICS.completedOrders,
    cancelledOrders: P2P_STATISTICS.cancelledOrders,
    disputedOrders: P2P_STATISTICS.disputedOrders,
    completionRate: P2P_STATISTICS.completionRate,
    avgCompletionTime: P2P_STATISTICS.avgCompletionTime,
    totalVolume7d: P2P_STATISTICS.totalVolume7d,
    totalVolume30d: P2P_STATISTICS.totalVolume30d,
    totalVolumeAll: P2P_STATISTICS.totalVolumeAll,
    buyVolume30d: P2P_STATISTICS.buyVolume30d,
    sellVolume30d: P2P_STATISTICS.sellVolume30d,
    spreadRevenue30d: P2P_STATISTICS.spreadRevenue30d,
    avgOrderSize: P2P_STATISTICS.avgOrderSize,
    uniqueCounterparties: P2P_STATISTICS.uniqueCounterparties,
    repeatCustomerRate: P2P_STATISTICS.repeatCustomerRate,
    avgRatingGiven: P2P_STATISTICS.avgRatingGiven,
    avgRatingReceived: P2P_STATISTICS.avgRatingReceived,
    positiveReviewRate: P2P_STATISTICS.positiveReviewRate,
    responseTimeAvg: P2P_STATISTICS.responseTimeAvg,
    platformAvgCompletionRate: P2P_STATISTICS.platformAvgCompletionRate,
    platformAvgResponseTime: P2P_STATISTICS.platformAvgResponseTime,
  },
  ordersByMonth: P2P_STATISTICS.ordersByMonth.map((item) => ({ ...item })),
  volumeByWeek: P2P_STATISTICS.volumeByWeek.map((item) => ({ ...item })),
  assetDistribution: P2P_STATISTICS.assetDistribution.map((item) => ({ ...item })),
  topMerchants: P2P_STATISTICS.topMerchants.map((item) => ({ ...item })),
  recentActivity: P2P_STATISTICS.recentActivity.map((item) => ({ ...item })),
};
const devP2pOrders = new Map<string, typeof P2P_ORDER>();
const p2pReleaseChallenges = new Map<
  string,
  { orderId: string; code: string; verificationToken: string }
>();
const verifiedP2pReleaseTokens = new Set<string>();
const p2p2faSettings = {
  methods: [
    {
      id: '2fa_sms' as const,
      label: 'SMS OTP',
      description: '+84 *** *** **89',
      enabled: true,
      isPrimary: true,
      setupRequired: false,
      color: '#10B981',
    },
    {
      id: '2fa_authenticator' as const,
      label: 'Authenticator App',
      description: 'Google Authenticator, Authy',
      enabled: false,
      isPrimary: false,
      setupRequired: true,
      color: '#3B82F6',
    },
    {
      id: '2fa_email' as const,
      label: 'Email OTP',
      description: 'ngu***@gmail.com',
      enabled: true,
      isPrimary: false,
      setupRequired: false,
      color: '#F59E0B',
    },
  ],
  thresholds: [
    {
      id: 'release' as const,
      label: 'Release Escrow',
      description: 'Yêu cầu 2FA khi release >= threshold',
      value: 10_000_000,
      unit: 'VND' as const,
      enabled: true,
    },
    {
      id: 'create_order' as const,
      label: 'Create Order',
      description: 'Yêu cầu 2FA khi tạo order >= threshold',
      value: 50_000_000,
      unit: 'VND' as const,
      enabled: false,
    },
    {
      id: 'cancel_order' as const,
      label: 'Cancel Order',
      description: 'Luôn yêu cầu 2FA khi hủy đơn',
      value: 0,
      unit: 'VND' as const,
      enabled: true,
    },
  ],
};
let p2pAuthenticatorSetupCode = '000000';

function getP2P2FASettings() {
  return {
    methods: p2p2faSettings.methods.map((method) => ({ ...method })),
    thresholds: p2p2faSettings.thresholds.map((threshold) => ({ ...threshold })),
  };
}

function createSession() {
  return {
    user,
    accessToken: 'dev-only-in-memory-token',
    accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

const pairs = [
  {
    id: 'btcusdt',
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 67_543.21,
    prevPrice: 66_012.5,
    change24h: 2.34,
    high24h: 68_100,
    low24h: 65_800,
    volume24h: 23_456_789_000,
    marketCap: 1_324_567_890_000,
    sparklineData: [65_100, 65_400, 65_200, 65_800, 66_200, 66_500, 67_000, 67_543.21],
    logoColor: '#F7931A',
    isFavorite: true,
    category: 'Layer 1',
  },
  {
    id: 'ethusdt',
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3_521.45,
    prevPrice: 3_565,
    change24h: -1.23,
    high24h: 3_600,
    low24h: 3_480,
    volume24h: 8_765_432_000,
    marketCap: 423_456_789_000,
    sparklineData: [3_565, 3_555, 3_570, 3_540, 3_530, 3_545, 3_520, 3_521.45],
    logoColor: '#627EEA',
    isFavorite: false,
    category: 'Layer 1',
  },
];

const marketWatchlist = WATCHLIST.map((item) => ({ ...item }));

const p2pReferencePrices: Record<string, number> = {
  USDT: 25_300,
  BTC: 1_715_000_000,
  ETH: 89_000_000,
  BNB: 15_200_000,
  SOL: 4_800_000,
};

const assets = [
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether USD',
    balance: 10_000,
    available: 10_000,
    frozen: 0,
    inOrder: 0,
    usdValue: 10_000,
    change24h: 0,
    logoColor: '#26A17B',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: 0.1,
    available: 0.1,
    frozen: 0,
    inOrder: 0,
    usdValue: 6_754.32,
    change24h: 2.34,
    logoColor: '#F7931A',
  },
];

type DevTradingOrder = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  price: number;
  amount: number;
  filled: number;
  status: 'open' | 'filled' | 'partial' | 'cancelled' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  fee: number;
  [key: string]: unknown;
};

const devTradingOrders = new Map<string, DevTradingOrder>();
const devTradingIdempotency = new Map<string, string>();

export function resetDevTradingState(): void {
  devTradingOrders.clear();
  devTradingIdempotency.clear();
}

function getTradingIdempotencyScope(request: Request): string | null {
  const key = request.headers.get('Idempotency-Key');
  if (!key) return null;
  return `${request.method}:${new URL(request.url).pathname}:${key}`;
}

function filterDevTradingOrders(request: Request, includeOpen: boolean): DevTradingOrder[] {
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol');
  const status = url.searchParams.get('status');

  return [...devTradingOrders.values()].filter((order) => {
    if (symbol && order.symbol !== symbol) return false;
    if (includeOpen && order.status !== 'open') return false;
    if (!includeOpen && order.status === 'open') return false;
    if (status && order.status !== status) return false;
    return true;
  });
}
const dcaSnapshot = getTestDcaSnapshot();
const earnSnapshot = getTestEarnSnapshot();
const withdrawalChallenges = new Map<string, { code: string; verificationToken: string }>();
const verifiedWithdrawalTokens = new Set<string>();
let walletAddressBookWhitelistEnabled = true;
const walletAddressBook = [
  {
    id: 'addr1',
    label: 'Ví lạnh cá nhân',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'BTC',
    asset: 'BTC',
    isFavorite: true,
    createdAt: '2026-01-15T00:00:00.000Z',
    lastUsed: '2026-02-20T00:00:00.000Z',
    isWhitelisted: true,
  },
  {
    id: 'addr2',
    label: 'Binance Exchange',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6C29f',
    network: 'ETH (ERC20)',
    asset: 'ETH',
    isFavorite: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    lastUsed: '2026-02-18T00:00:00.000Z',
    isWhitelisted: true,
  },
  {
    id: 'addr3',
    label: 'Ví USDT BSC',
    address: '0x8Ba1f109551bD432803012645Ac136ddd64DBa72',
    network: 'BSC (BEP20)',
    asset: 'USDT',
    isFavorite: false,
    createdAt: '2026-01-20T00:00:00.000Z',
    lastUsed: '2026-02-15T00:00:00.000Z',
    isWhitelisted: false,
  },
  {
    id: 'addr4',
    label: 'Phantom Wallet',
    address: 'BkJMJfHtjL8o69n2vxqHE6MbEv4ZR3zqRPnLVe2bFpYo',
    network: 'SOL',
    asset: 'SOL',
    isFavorite: false,
    createdAt: '2026-02-05T00:00:00.000Z',
    isWhitelisted: false,
  },
];

function getWalletAddressBook() {
  return {
    items: walletAddressBook.map((item) => ({ ...item })),
    total: walletAddressBook.length,
    whitelistEnabled: walletAddressBookWhitelistEnabled,
  };
}

const portfolioAnalytics = {
  history: [
    { timestamp: '2026-09-14T00:00:00.000Z', value: 14_200, pnl: 0 },
    { timestamp: '2026-09-15T00:00:00.000Z', value: 14_480, pnl: 280 },
    { timestamp: '2026-09-16T00:00:00.000Z', value: 14_310, pnl: 110 },
    { timestamp: '2026-09-17T00:00:00.000Z', value: 14_920, pnl: 720 },
    { timestamp: '2026-09-18T00:00:00.000Z', value: 15_180, pnl: 980 },
    { timestamp: '2026-09-19T00:00:00.000Z', value: 15_420, pnl: 1_220 },
    { timestamp: '2026-09-20T00:00:00.000Z', value: 15_880, pnl: 1_680 },
    { timestamp: '2026-09-21T00:00:00.000Z', value: 16_754.32, pnl: 2_554.32 },
  ],
  monthlyPnl: [
    { month: 'T4', pnl: 780 },
    { month: 'T5', pnl: -220 },
    { month: 'T6', pnl: 1_240 },
    { month: 'T7', pnl: 640 },
    { month: 'T8', pnl: -310 },
    { month: 'T9', pnl: 1_680 },
  ],
  topPerformers: [
    { symbol: 'BTC', name: 'Bitcoin', change: 18.7, usd: 2_310, color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', change: 12.4, usd: 680, color: '#627EEA' },
  ],
  worstPerformers: [
    { symbol: 'USDT', name: 'Tether USD', change: 0.01, usd: 1.25, color: '#26A17B' },
  ],
  totalTrades: 47,
  totalFeesUsd: 38.42,
};

function serializeDcaSnapshot() {
  return {
    ...dcaSnapshot,
    plans: dcaSnapshot.plans.map((plan) => ({
      ...plan,
      nextExecution: plan.nextExecution.toISOString(),
      createdAt: plan.createdAt.toISOString(),
      lastPurchaseAt: plan.lastPurchaseAt?.toISOString(),
    })),
    purchaseHistory: dcaSnapshot.purchaseHistory.map((item) => ({
      ...item,
      date: item.date.toISOString(),
    })),
    portfolioHistory: dcaSnapshot.portfolioHistory.map((item) => ({
      ...item,
      date: item.date.toISOString(),
    })),
  };
}

const discoveryTopics = SHARED_TOPICS.map((topic) => ({
  ...topic,
  description:
    {
      crypto: 'Bitcoin, Ethereum, altcoins và DeFi',
      macro: 'Kinh tế vĩ mô, lãi suất, GDP và CPI',
      politics: 'Chính trị, bầu cử và chính sách',
      sports: 'Thể thao, giải đấu và kết quả',
      tech: 'Công nghệ, sản phẩm và startup',
      ai: 'AI, machine learning và AGI',
      culture: 'Văn hoá, giải trí và meme',
      community: 'Cộng đồng, social và creator',
    }[topic.id] ?? '',
}));

function toDiscoveryPrediction(event: (typeof devPredictionEvents)[number]) {
  return {
    id: event.id,
    title: event.title,
    category: event.category,
    tags: event.tags,
    topOutcome: event.outcomes[0],
    volume24h: event.volume24h,
    participants: event.participants,
    status: event.status,
    isTrending: event.isTrending,
  };
}

function toDiscoveryMode(mode: (typeof ARENA_MODES)[number]) {
  return {
    id: mode.id,
    title: mode.title,
    description: mode.description,
    tags: mode.tags,
    cloneCount: mode.cloneCount,
    activeChallenges: mode.activeChallenges,
    fairPlay: mode.fairPlay,
    creator: { id: mode.creator.id, name: mode.creator.name, avatar: mode.creator.avatar },
  };
}

function toDiscoveryRoom(room: (typeof ARENA_ROOMS)[number]) {
  return {
    id: room.id,
    title: room.title,
    modeId: room.modeId,
    format: room.format,
    slotsTotal: room.slotsTotal,
    slotsFilled: room.slotsFilled,
    entryPoints: room.entryPoints,
    status: room.status,
    creator: room.creator,
  };
}

function toDiscoveryCreator(creator: (typeof ARENA_CREATORS)[number]) {
  return {
    id: creator.id,
    name: creator.name,
    avatar: creator.avatar,
    bio: creator.bio,
    trustScore: creator.trustScore,
    fairPlayBadge: creator.fairPlayBadge,
  };
}

function discoveryTopicData(topicId: string) {
  const topic = discoveryTopics.find((item) => item.id === topicId);
  if (!topic) return undefined;
  const predictions = devPredictionEvents.filter(
    (event) => mapCategoryToTopic(event.category) === topic.id,
  );
  const modes = ARENA_MODES.filter((mode) =>
    mode.tags.some((tag) => mapArenaTagToTopic(tag) === topic.id),
  );
  const modeIds = new Set(modes.map((mode) => mode.id));
  const rooms = ARENA_ROOMS.filter((room) => modeIds.has(room.modeId));
  const creatorIds = new Set(modes.map((mode) => mode.creator.id));
  const creators = ARENA_CREATORS.filter((creator) => creatorIds.has(creator.id));
  return {
    topic,
    stats: {
      events: predictions.length,
      rooms: rooms.length,
      modes: modes.length,
      creators: creators.length,
    },
    predictions: predictions.map(toDiscoveryPrediction),
    arenaRooms: rooms.map(toDiscoveryRoom),
    arenaModes: modes.map(toDiscoveryMode),
    creators: creators.map(toDiscoveryCreator),
  };
}

function arenaCreatorSummary(creator: (typeof ARENA_CREATORS)[number]) {
  return {
    id: creator.id,
    name: creator.name,
    avatar: creator.avatar,
    trustScore: creator.trustScore,
    fairPlayBadge: creator.fairPlayBadge,
  };
}

function arenaModeDetail(modeId: string) {
  const mode = ARENA_MODES.find((item) => item.id === modeId);
  if (!mode) return undefined;
  const template = ARENA_TEMPLATES.find((item) => item.id === mode.templateId);
  if (!template) return undefined;
  return {
    id: mode.id,
    title: mode.title,
    description: mode.description,
    cloneCount: mode.cloneCount,
    activeChallenges: mode.activeChallenges,
    fairPlay: mode.fairPlay,
    template: {
      id: template.id,
      title: template.title,
      icon: template.icon,
      color: template.color,
      complexity: template.complexity,
    },
    creator: arenaCreatorSummary(mode.creator),
    tags: mode.tags,
    completionRate: mode.completionRate,
    allowedFormats: mode.allowedFormats ?? [],
    winCondition: mode.winCondition,
    resolutionType: mode.resolutionType,
    avgDuration: mode.avgDuration,
    disputeRiskLevel: mode.disputeRiskLevel,
    relatedRooms: ARENA_ROOMS.filter((room) => room.modeId === mode.id).map((room) => ({
      id: room.id,
      title: room.title,
      format: room.format,
      slotsTotal: room.slotsTotal,
      slotsFilled: room.slotsFilled,
      entryPoints: room.entryPoints,
      status: room.status,
    })),
    relatedModes: ARENA_MODES.filter(
      (candidate) => candidate.templateId === mode.templateId && candidate.id !== mode.id,
    )
      .slice(0, 4)
      .map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        description: candidate.description,
        cloneCount: candidate.cloneCount,
        activeChallenges: candidate.activeChallenges,
        fairPlay: candidate.fairPlay,
      })),
  };
}

function arenaChallengeDetail(challengeId: string) {
  const challenge = ARENA_CHALLENGES.find((item) => item.id === challengeId);
  if (!challenge) return undefined;
  return {
    ...challenge,
    creator: arenaCreatorSummary(challenge.creator),
    participants: challenge.participants ?? [],
  };
}

function referralOverview() {
  const stats = getReferralStats();
  const tierState = getCurrentTier(stats.totalFriends);
  const currentTier = tierState.current;
  const nextTier = tierState.next ?? undefined;
  return {
    referralCode: USER_PROFILE.referralCode,
    stats,
    currentTier,
    nextTier,
    friends: REFERRAL_FRIENDS.map((friend) => ({
      id: friend.id,
      name: friend.name,
      avatar: friend.avatar,
      joinedDate: friend.joinedDate,
      status: friend.status,
      totalVolume: friend.totalVolume,
      totalCommission: friend.totalCommission,
      isActive: friend.isActive,
    })),
    campaign: {
      id: ACTIVE_CAMPAIGN.id,
      title: ACTIVE_CAMPAIGN.title,
      description: ACTIVE_CAMPAIGN.description,
      bonusLabel: ACTIVE_CAMPAIGN.bonusLabel,
      daysLeft: ACTIVE_CAMPAIGN.daysLeft,
      totalParticipants: ACTIVE_CAMPAIGN.totalParticipants,
    },
  };
}

function launchpadProjects(request: Request) {
  const params = new URL(request.url).searchParams;
  const status = params.get('status');
  const type = params.get('type');
  const search = params.get('search')?.trim().toLowerCase();
  const projects = LAUNCHPAD_PROJECTS.filter((project) => {
    if (status && project.status !== status) return false;
    if (type && project.type !== type) return false;
    if (
      search &&
      ![project.name, project.symbol, project.description, ...project.tags]
        .join(' ')
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }
    return true;
  });
  return {
    projects,
    total: projects.length,
    activeCount: projects.filter((project) => project.status === 'active').length,
  };
}

export const handlers = [
  http.get('*/auth/session', () =>
    authenticated
      ? HttpResponse.json(createSession())
      : HttpResponse.json(
          { code: 'UNAUTHENTICATED', message: 'No active session' },
          { status: 401 },
        ),
  ),
  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return HttpResponse.json(
        { code: 'INVALID_CREDENTIALS', message: 'Email and password are required' },
        { status: 400 },
      );
    }
    authenticated = true;
    return HttpResponse.json(createSession());
  }),
  http.post('*/auth/refresh', () =>
    authenticated
      ? HttpResponse.json(createSession())
      : HttpResponse.json({ code: 'SESSION_EXPIRED', message: 'Session expired' }, { status: 401 }),
  ),
  http.post('*/auth/logout', () => {
    authenticated = false;
    return new HttpResponse(null, { status: 204 });
  }),
  http.post('*/auth/mfa/verify', () => {
    authenticated = true;
    return HttpResponse.json(createSession());
  }),
  http.post('*/auth/mfa/setup', () =>
    HttpResponse.json({
      secret: 'DEVONLYSECRET',
      qrCodeUrl:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect width="160" height="160" fill="white"/%3E%3Cpath d="M10 10h40v40H10zM110 10h40v40h-40zM10 110h40v40H10zM70 70h20v20H70zM110 110h10v10h-10z" fill="black"/%3E%3C/svg%3E',
      backupCodes: ['DEV-0001', 'DEV-0002'],
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }),
  ),
  http.post('*/auth/mfa/setup/confirm', () => HttpResponse.json(createSession())),
  http.post('*/auth/password-reset/request', () => new HttpResponse(null, { status: 204 })),
  http.post('*/auth/password-reset/verify', () =>
    HttpResponse.json({ resetToken: 'dev-reset-token' }),
  ),
  http.post('*/auth/password-reset/confirm', () => new HttpResponse(null, { status: 204 })),
  http.post('*/auth/password/verify-current', () => new HttpResponse(null, { status: 204 })),
  http.post('*/auth/password/change', () => new HttpResponse(null, { status: 204 })),
  http.get('*/profile', () => HttpResponse.json({ ...devProfile })),
  http.patch('*/profile', async ({ request }) => {
    const body = (await request.json()) as { fullName?: string; phone?: string };
    if (!body.fullName?.trim()) {
      return HttpResponse.json(
        { code: 'PROFILE_NAME_REQUIRED', message: 'Full name is required' },
        { status: 400 },
      );
    }
    devProfile.fullName = body.fullName.trim();
    devProfile.phone = body.phone?.trim() ?? devProfile.phone;
    return HttpResponse.json({ ...devProfile });
  }),
  http.get('*/profile/devices', () =>
    HttpResponse.json({ items: devProfileDevices.map((device) => ({ ...device })) }),
  ),
  http.post('*/profile/devices/:deviceId/revoke', ({ params }) => {
    const index = devProfileDevices.findIndex((device) => device.id === params.deviceId);
    if (index < 0) {
      return HttpResponse.json(
        { code: 'DEVICE_NOT_FOUND', message: 'Device not found' },
        { status: 404 },
      );
    }
    devProfileDevices.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.patch('*/profile/devices/:deviceId/trust', async ({ params, request }) => {
    const body = (await request.json()) as { trusted?: boolean };
    const device = devProfileDevices.find((item) => item.id === params.deviceId);
    if (!device) {
      return HttpResponse.json(
        { code: 'DEVICE_NOT_FOUND', message: 'Device not found' },
        { status: 404 },
      );
    }
    device.isTrusted = Boolean(body.trusted);
    return HttpResponse.json({ item: { ...device } });
  }),
  http.get('*/profile/activity', () =>
    HttpResponse.json({ items: devProfileActivity.map((log) => ({ ...log })) }),
  ),
  http.get('*/profile/sub-accounts', () =>
    HttpResponse.json({
      items: devProfileSubAccounts.map((account) => ({
        ...account,
        permissions: [...account.permissions],
      })),
    }),
  ),
  http.get('*/admin/overview', () => HttpResponse.json({ ...devAdminOverview })),
  http.get('*/admin/analytics/funnel', () =>
    HttpResponse.json({ steps: devAdminFunnel.steps.map((step) => ({ ...step })) }),
  ),
  http.get('*/admin/analytics/ab-tests', () =>
    HttpResponse.json({
      tests: devAdminAbTests.map((test) => ({
        ...test,
        variants: test.variants.map((variant) => ({ ...variant })),
      })),
    }),
  ),
  http.get('*/admin/analytics/ab-tests/:testId', ({ params }) => {
    const test = devAdminAbTests.find((item) => item.id === params.testId);
    if (!test) {
      return HttpResponse.json(
        { code: 'ADMIN_AB_TEST_NOT_FOUND', message: 'A/B test not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      ...test,
      variants: test.variants.map((variant) => ({ ...variant })),
    });
  }),
  http.patch('*/admin/feature-flags/:flagKey', async ({ params, request }) => {
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey || idempotencyKey.length < 16) {
      return HttpResponse.json(
        { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required.' },
        { status: 400 },
      );
    }
    const flagKey = String(params.flagKey);
    const scope = `${flagKey}:${idempotencyKey}`;
    const existingKey = devAdminFlagIdempotency.get(scope);
    if (existingKey) {
      const existing = devAdminFeatureFlags.get(existingKey);
      if (existing) return HttpResponse.json({ ...existing });
    }
    const body = (await request.json()) as {
      enabled?: boolean;
      rolloutPercentage?: number;
      expiresAt?: string;
      rollbackBehavior?: string;
    };
    if (
      typeof body.enabled !== 'boolean' ||
      typeof body.rolloutPercentage !== 'number' ||
      body.rolloutPercentage < 0 ||
      body.rolloutPercentage > 100 ||
      typeof body.expiresAt !== 'string'
    ) {
      return HttpResponse.json(
        { code: 'ADMIN_FLAG_INVALID', message: 'Feature flag update is invalid.' },
        { status: 400 },
      );
    }
    const flag = {
      key: flagKey,
      enabled: body.enabled,
      rolloutPercentage: body.rolloutPercentage,
      owner: 'platform',
      expiresAt: body.expiresAt,
      rollbackBehavior: body.rollbackBehavior ?? 'manual',
    };
    devAdminFeatureFlags.set(flagKey, flag);
    devAdminFlagIdempotency.set(scope, flagKey);
    return HttpResponse.json({ ...flag });
  }),
  http.get('*/content/news', () =>
    HttpResponse.json({
      items: devNewsArticles.map((article) => ({ ...article, tags: [...article.tags] })),
    }),
  ),
  http.get('*/notifications', () =>
    HttpResponse.json({ items: devNotifications.map((notification) => ({ ...notification })) }),
  ),
  http.post('*/notifications/:notificationId/read', ({ params }) => {
    const notification = devNotifications.find((item) => item.id === params.notificationId);
    if (!notification) {
      return HttpResponse.json(
        { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' },
        { status: 404 },
      );
    }
    notification.isRead = true;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/support/help', () =>
    HttpResponse.json({
      categories: devHelpCategories.map((category) => ({ ...category })),
      articles: devHelpArticles.map((article) => ({ ...article })),
    }),
  ),
  http.get('*/support/tickets', () =>
    HttpResponse.json({
      items: devSupportTickets.map((ticket) => ({
        ...ticket,
        messages: ticket.messages.map((message) => ({ ...message })),
      })),
    }),
  ),
  http.post('*/support/tickets', async ({ request }) => {
    const body = (await request.json()) as {
      subject?: string;
      category?: string;
      description?: string;
    };
    if (!body.subject?.trim() || !body.description?.trim()) {
      return HttpResponse.json(
        { code: 'TICKET_FIELDS_REQUIRED', message: 'Subject and description are required' },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const category: 'technical' | 'trading' | 'deposit' | 'withdraw' | 'kyc' | 'other' =
      body.category === 'technical' ||
      body.category === 'trading' ||
      body.category === 'deposit' ||
      body.category === 'withdraw' ||
      body.category === 'kyc' ||
      body.category === 'other'
        ? body.category
        : 'other';
    const ticket = {
      id: `ticket-dev-${devSupportTickets.length + 1}`,
      subject: body.subject.trim(),
      category,
      status: 'open' as const,
      priority: 'medium' as const,
      description: body.description.trim(),
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    devSupportTickets.unshift(ticket);
    return HttpResponse.json(ticket, { status: 201 });
  }),
  http.get('*/predictions/events', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search')?.toLowerCase();
    const status = url.searchParams.get('status');
    const items = devPredictionEvents.filter((event) => {
      if (category && event.category !== category) return false;
      if (status && event.status !== status) return false;
      if (search && !`${event.title} ${event.tags.join(' ')}`.toLowerCase().includes(search))
        return false;
      return true;
    });
    return HttpResponse.json({ items });
  }),
  http.get('*/predictions/events/:eventId', ({ params }) => {
    const event = devPredictionEvents.find((item) => item.id === params.eventId);
    return event
      ? HttpResponse.json(event)
      : HttpResponse.json(
          { code: 'PREDICTION_EVENT_NOT_FOUND', message: 'Prediction event not found' },
          { status: 404 },
        );
  }),
  http.get('*/predictions/positions', () => HttpResponse.json({ items: devPredictionPositions })),
  http.get('*/predictions/rewards', () => HttpResponse.json({ items: devPredictionRewards })),
  http.get('*/predictions/leaderboard', ({ request }) => {
    const period = new URL(request.url).searchParams.get('period') ?? 'today';
    return HttpResponse.json({ items: LEADERBOARD_DATA[period] ?? LEADERBOARD_DATA.today });
  }),
  http.get('*/predictions/activity', () => HttpResponse.json({ items: devPredictionActivity })),
  http.get('*/predictions/orders/:orderId', ({ params }) => {
    const receipt = devPredictionReceipts.find((item) => item.id === params.orderId);
    return receipt
      ? HttpResponse.json(receipt)
      : HttpResponse.json(
          { code: 'PREDICTION_ORDER_NOT_FOUND', message: 'Prediction order not found' },
          { status: 404 },
        );
  }),
  http.post('*/predictions/orders', async ({ request }) => {
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey || idempotencyKey.length < 8) {
      return HttpResponse.json(
        { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required.' },
        { status: 400 },
      );
    }
    const existingReceiptId = devPredictionIdempotency.get(idempotencyKey);
    if (existingReceiptId) {
      const existingReceipt = devPredictionReceipts.find((item) => item.id === existingReceiptId);
      if (existingReceipt) return HttpResponse.json(existingReceipt);
    }

    const body = (await request.json()) as {
      eventId?: string;
      outcome?: string;
      side?: 'buy' | 'sell';
      orderType?: 'market' | 'limit';
      shares?: number;
      price?: number;
    };
    const event = devPredictionEvents.find((item) => item.id === body.eventId);
    const selectedOutcome = event?.outcomes.find((item) => item.label === body.outcome);
    if (
      !event ||
      !selectedOutcome ||
      !body.side ||
      !body.orderType ||
      !body.shares ||
      body.shares <= 0
    ) {
      return HttpResponse.json(
        { code: 'PREDICTION_ORDER_INVALID', message: 'Invalid prediction order' },
        { status: 400 },
      );
    }
    const outcome = body.outcome ?? selectedOutcome.label;
    const now = new Date().toISOString();
    const price = body.price ?? selectedOutcome.chance / 100;
    const receipt = {
      id: `prediction-order-${devPredictionReceipts.length + 1}`,
      eventId: event.id,
      eventTitle: event.title,
      outcome,
      side: body.side,
      orderType: body.orderType,
      shares: body.shares,
      filledShares: body.orderType === 'market' ? body.shares : 0,
      price,
      avgPrice: body.orderType === 'market' ? price : 0,
      total: body.shares * price,
      fee: body.shares * price * 0.02,
      status: body.orderType === 'market' ? ('filled' as const) : ('submitted' as const),
      createdAt: now,
      updatedAt: now,
      timeline: [
        { label: 'Submitted', date: now, done: true },
        {
          label: 'Accepted',
          date: body.orderType === 'market' ? now : '',
          done: body.orderType === 'market',
        },
        {
          label: 'Filled',
          date: body.orderType === 'market' ? now : '',
          done: body.orderType === 'market',
        },
      ],
    };
    devPredictionReceipts.unshift(receipt);
    devPredictionIdempotency.set(idempotencyKey, receipt.id);
    return HttpResponse.json(receipt, { status: 201 });
  }),
  http.get('*/arena/modes/:modeId', ({ params }) => {
    const mode = arenaModeDetail(String(params.modeId));
    return mode
      ? HttpResponse.json(mode)
      : HttpResponse.json(
          { code: 'ARENA_MODE_NOT_FOUND', message: 'Arena mode not found' },
          { status: 404 },
        );
  }),
  http.get('*/arena/challenges/:challengeId', ({ params }) => {
    const challenge = arenaChallengeDetail(String(params.challengeId));
    return challenge
      ? HttpResponse.json(challenge)
      : HttpResponse.json(
          { code: 'ARENA_CHALLENGE_NOT_FOUND', message: 'Arena challenge not found' },
          { status: 404 },
        );
  }),
  http.post('*/arena/challenges/:challengeId/join', ({ params, request }) => {
    const challengeId = String(params.challengeId);
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey || idempotencyKey.length < 8) {
      return HttpResponse.json(
        { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required.' },
        { status: 400 },
      );
    }
    const requestKey = `${challengeId}:${idempotencyKey}`;
    const existingResponse = devArenaJoinResponses.get(requestKey);
    if (existingResponse) return HttpResponse.json(existingResponse);
    const challenge = arenaChallengeDetail(String(params.challengeId));
    if (!challenge) {
      return HttpResponse.json(
        { code: 'ARENA_CHALLENGE_NOT_FOUND', message: 'Arena challenge not found' },
        { status: 404 },
      );
    }
    if (challenge.challengeState !== 'open' || challenge.slotsFilled >= challenge.slotsTotal) {
      return HttpResponse.json(
        { code: 'ARENA_CHALLENGE_UNAVAILABLE', message: 'Challenge is not accepting participants' },
        { status: 409 },
      );
    }
    const joined = {
      id: 'dev-arena-user',
      name: 'VitTrade Developer',
      avatar: '🧑‍💻',
      role: 'player' as const,
      status: 'joined' as const,
    };
    const response = {
      challenge: {
        ...challenge,
        slotsFilled: challenge.slotsFilled + 1,
        participants: [...challenge.participants, joined],
      },
      auditEventId: `dev-arena-audit-${Date.now()}`,
    };
    devArenaJoinResponses.set(requestKey, response);
    return HttpResponse.json(response, { status: 201 });
  }),
  http.get('*/launchpad/projects', ({ request }) => HttpResponse.json(launchpadProjects(request))),
  http.get('*/launchpad/projects/:projectId', ({ params }) => {
    const project = getLaunchpadProject(String(params.projectId));
    return project
      ? HttpResponse.json(project)
      : HttpResponse.json(
          { code: 'LAUNCHPAD_PROJECT_NOT_FOUND', message: 'Launchpad project not found' },
          { status: 404 },
        );
  }),
  http.get('*/referral/overview', () => HttpResponse.json(referralOverview())),
  http.get('*/discovery/search', ({ request }) => {
    const query = new URL(request.url).searchParams.get('query')?.trim().toLowerCase() ?? '';
    const predictions = devPredictionEvents.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.category.toLowerCase().includes(query) ||
        event.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
    const arenaModes = ARENA_MODES.filter(
      (mode) =>
        mode.title.toLowerCase().includes(query) ||
        mode.description.toLowerCase().includes(query) ||
        mode.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
    const arenaRooms = ARENA_ROOMS.filter(
      (room) =>
        room.title.toLowerCase().includes(query) || room.format.toLowerCase().includes(query),
    );
    const creators = ARENA_CREATORS.filter(
      (creator) =>
        creator.name.toLowerCase().includes(query) ||
        Boolean(creator.bio?.toLowerCase().includes(query)),
    );
    const tradingPairs = CRYPTO_PAIRS.filter(
      (pair) =>
        pair.symbol.toLowerCase().includes(query) ||
        pair.baseAsset.toLowerCase().includes(query) ||
        pair.quoteAsset.toLowerCase().includes(query),
    ).map((pair) => ({
      id: pair.id,
      symbol: pair.symbol,
      baseAsset: pair.baseAsset,
      quoteAsset: pair.quoteAsset,
      price: pair.price,
      change24h: pair.change24h,
      volume24h: pair.volume24h,
      logoColor: pair.logoColor,
    }));
    return HttpResponse.json({
      query,
      predictions: predictions.map(toDiscoveryPrediction),
      arenaModes: arenaModes.map(toDiscoveryMode),
      arenaRooms: arenaRooms.map(toDiscoveryRoom),
      creators: creators.map(toDiscoveryCreator),
      tradingPairs,
    });
  }),
  http.get('*/discovery/topics/:topicId', ({ params }) => {
    const data = discoveryTopicData(String(params.topicId));
    return data
      ? HttpResponse.json(data)
      : HttpResponse.json(
          { code: 'DISCOVERY_TOPIC_NOT_FOUND', message: 'Discovery topic not found' },
          { status: 404 },
        );
  }),
  http.get('*/market/overview', () =>
    HttpResponse.json({
      stats: GLOBAL_MARKET_STATS,
      breadth: MARKET_BREADTH,
      fearGreedHistory: FEAR_GREED_HISTORY,
      sectors: MARKET_SECTORS,
      topGainers: getTopGainers('24h', 5),
      topLosers: getTopLosers('24h', 5),
      updatedAt: new Date().toISOString(),
    }),
  ),
  http.get('*/market/movers', ({ request }) => {
    const url = new URL(request.url);
    const view = url.searchParams.get('view') ?? 'gainers';
    const timeframe = (url.searchParams.get('timeframe') ?? '24h') as '1h' | '24h' | '7d';
    const category = url.searchParams.get('category');
    const movers =
      view === 'losers'
        ? getTopLosers(timeframe)
        : view === 'most-active'
          ? getMostActive()
          : view === 'unusual-volume'
            ? getUnusualVolume()
            : view === 'new-listings'
              ? getNewListings()
              : getTopGainers(timeframe);
    return HttpResponse.json({
      items:
        category && category !== 'all'
          ? movers.filter((mover) => mover.category.toLowerCase() === category.toLowerCase())
          : movers,
      updatedAt: new Date().toISOString(),
    });
  }),
  http.get('*/market/price-alerts', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    return HttpResponse.json({
      items:
        status === 'active'
          ? devPriceAlerts.filter((alert) => alert.isActive)
          : status === 'triggered'
            ? devPriceAlerts.filter((alert) => !alert.isActive && Boolean(alert.triggeredAt))
            : devPriceAlerts,
    });
  }),
  http.post('*/market/price-alerts', async ({ request }) => {
    const body = (await request.json()) as {
      pairId?: unknown;
      condition?: unknown;
      targetPrice?: unknown;
    };
    const pair = pairs.find((item) => item.id === body.pairId);
    if (
      !pair ||
      (body.condition !== 'above' && body.condition !== 'below') ||
      typeof body.targetPrice !== 'number' ||
      body.targetPrice <= 0
    ) {
      return HttpResponse.json(
        { code: 'INVALID_PRICE_ALERT', message: 'Invalid price alert request' },
        { status: 400 },
      );
    }
    const alert = {
      id: `alert-${Date.now()}`,
      pairId: pair.id,
      symbol: pair.symbol,
      condition: body.condition,
      targetPrice: body.targetPrice,
      currentPrice: pair.price,
      isActive: true,
      createdAt: new Date().toISOString(),
    } as const;
    devPriceAlerts.push(alert);
    return HttpResponse.json(alert, { status: 201 });
  }),
  http.patch('*/market/price-alerts/:alertId', async ({ params, request }) => {
    const alert = devPriceAlerts.find((item) => item.id === params.alertId);
    if (!alert) return HttpResponse.json({ message: 'Price alert not found' }, { status: 404 });
    const body = (await request.json()) as { isActive?: unknown };
    if (typeof body.isActive !== 'boolean') {
      return HttpResponse.json(
        { code: 'INVALID_PRICE_ALERT', message: 'isActive is required' },
        { status: 400 },
      );
    }
    alert.isActive = body.isActive;
    return HttpResponse.json(alert);
  }),
  http.delete('*/market/price-alerts/:alertId', ({ params }) => {
    const index = devPriceAlerts.findIndex((item) => item.id === params.alertId);
    if (index < 0) return HttpResponse.json({ message: 'Price alert not found' }, { status: 404 });
    devPriceAlerts.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/market/pairs', () => HttpResponse.json({ items: pairs })),
  http.get('*/market/pairs/:pairId', ({ params }) => {
    const pair = pairs.find((item) => item.id === params.pairId);
    return pair
      ? HttpResponse.json(pair)
      : HttpResponse.json(
          { code: 'PAIR_NOT_FOUND', message: 'Market pair not found' },
          { status: 404 },
        );
  }),
  http.get('*/market/pairs/:pairId/candles', ({ params, request }) => {
    const pair = pairs.find((item) => item.id === params.pairId);
    if (!pair) {
      return HttpResponse.json(
        { code: 'PAIR_NOT_FOUND', message: 'Market pair not found' },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const interval = url.searchParams.get('interval') ?? '1h';
    const intervalSeconds: Record<string, number> = {
      '5m': 5 * 60,
      '15m': 15 * 60,
      '1h': 60 * 60,
      '4h': 4 * 60 * 60,
      '1d': 24 * 60 * 60,
      '1w': 7 * 24 * 60 * 60,
    };
    const step = intervalSeconds[interval] ?? intervalSeconds['1h'];
    const requestedLimit = Number(url.searchParams.get('limit') ?? 24);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 24, 2), 500);
    const now = Math.floor(Date.now() / 1000);
    let previousClose = pair.price * (1 - pair.change24h / 100 / 2);
    const items = Array.from({ length: limit }, (_, index) => {
      const progress = index / Math.max(limit - 1, 1);
      const wave = Math.sin(index * 1.7) * 0.003;
      const trend = (pair.change24h / 100) * (progress - 0.5) * 0.35;
      const close = pair.price * (1 + wave + trend);
      const open = previousClose;
      const high = Math.max(open, close) * 1.0015;
      const low = Math.min(open, close) * 0.9985;
      previousClose = close;
      return {
        time: now - (limit - index - 1) * step,
        open: Number(open.toFixed(8)),
        high: Number(high.toFixed(8)),
        low: Number(low.toFixed(8)),
        close: Number(close.toFixed(8)),
        volume: Number(((pair.volume24h / limit) * (0.75 + (index % 5) * 0.1)).toFixed(8)),
      };
    });
    return HttpResponse.json({ items, updatedAt: new Date().toISOString() });
  }),
  http.get('*/market/pairs/:pairId/orderbook', ({ params }) => {
    const pair = pairs.find((item) => item.id === params.pairId);
    if (!pair) {
      return HttpResponse.json(
        { code: 'PAIR_NOT_FOUND', message: 'Market pair not found' },
        { status: 404 },
      );
    }
    const bids = Array.from({ length: 8 }, (_, index) => {
      const price = Number((pair.price * (1 - (index + 1) * 0.0004)).toFixed(2));
      const amount = Number((0.02 + index * 0.006).toFixed(6));
      return { price, amount, total: Number((price * amount).toFixed(2)), depth: (index + 1) / 8 };
    });
    const asks = Array.from({ length: 8 }, (_, index) => {
      const price = Number((pair.price * (1 + (index + 1) * 0.0004)).toFixed(2));
      const amount = Number((0.018 + index * 0.005).toFixed(6));
      return { price, amount, total: Number((price * amount).toFixed(2)), depth: (index + 1) / 8 };
    });
    return HttpResponse.json({ bids, asks, updatedAt: new Date().toISOString() });
  }),
  http.get('*/market/pairs/:pairId/trades', ({ params }) => {
    const pair = pairs.find((item) => item.id === params.pairId);
    if (!pair) {
      return HttpResponse.json(
        { code: 'PAIR_NOT_FOUND', message: 'Market pair not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      items: Array.from({ length: 12 }, (_, index) => ({
        id: `dev-trade-${pair.id}-${index}`,
        price: Number((pair.price * (1 + (index % 2 === 0 ? 1 : -1) * index * 0.0002)).toFixed(2)),
        amount: Number((0.01 + index * 0.002).toFixed(6)),
        side: index % 2 === 0 ? 'buy' : 'sell',
        time: new Date(Date.now() - index * 30_000).toISOString(),
      })),
    });
  }),
  http.get('*/market/watchlist', () =>
    HttpResponse.json({ items: marketWatchlist.map((item) => ({ ...item })) }),
  ),
  http.post('*/market/watchlist', async ({ request }) => {
    const body = (await request.json()) as { pairId?: string; note?: string };
    const pair = pairs.find((item) => item.id === body.pairId);
    if (!pair) {
      return HttpResponse.json(
        { code: 'PAIR_NOT_FOUND', message: 'Market pair not found.' },
        { status: 404 },
      );
    }
    if (marketWatchlist.some((item) => item.pairId === pair.id)) {
      return HttpResponse.json(
        { code: 'WATCHLIST_ITEM_EXISTS', message: 'Pair is already in the watchlist.' },
        { status: 409 },
      );
    }
    const item = {
      id: `dev-watch-${pair.id}`,
      pairId: pair.id,
      addedAt: new Date().toISOString(),
      note: body.note?.trim() || undefined,
    };
    marketWatchlist.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.patch('*/market/watchlist/:watchlistId', async ({ params, request }) => {
    const item = marketWatchlist.find((entry) => entry.id === String(params.watchlistId));
    if (!item) {
      return HttpResponse.json(
        { code: 'WATCHLIST_NOT_FOUND', message: 'Watchlist item not found.' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { note?: string };
    item.note = body.note?.trim() || undefined;
    return HttpResponse.json(item);
  }),
  http.delete('*/market/watchlist/:watchlistId', ({ params }) => {
    const index = marketWatchlist.findIndex((entry) => entry.id === String(params.watchlistId));
    if (index < 0) {
      return HttpResponse.json(
        { code: 'WATCHLIST_NOT_FOUND', message: 'Watchlist item not found.' },
        { status: 404 },
      );
    }
    marketWatchlist.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(getP2P2FASettings())),
  http.patch('*/p2p/security/2fa/methods/:methodId', async ({ params, request }) => {
    const method = p2p2faSettings.methods.find((item) => item.id === params.methodId);
    const body = (await request.json()) as { enabled?: boolean };
    if (!method || typeof body.enabled !== 'boolean') {
      return HttpResponse.json(
        { code: 'P2P_2FA_METHOD_INVALID', message: '2FA method update is invalid.' },
        { status: 400 },
      );
    }
    method.enabled = body.enabled;
    if (!method.enabled) method.isPrimary = false;
    if (method.enabled && !p2p2faSettings.methods.some((item) => item.isPrimary)) {
      method.isPrimary = true;
    }
    return HttpResponse.json(getP2P2FASettings());
  }),
  http.post('*/p2p/security/2fa/primary', async ({ request }) => {
    const body = (await request.json()) as { methodId?: string };
    const method = p2p2faSettings.methods.find((item) => item.id === body.methodId);
    if (!method?.enabled) {
      return HttpResponse.json(
        { code: 'P2P_2FA_PRIMARY_INVALID', message: 'Primary method must be enabled.' },
        { status: 400 },
      );
    }
    p2p2faSettings.methods.forEach((item) => {
      item.isPrimary = item.id === method.id;
    });
    return HttpResponse.json(getP2P2FASettings());
  }),
  http.patch('*/p2p/security/2fa/thresholds/:thresholdId', async ({ params, request }) => {
    const threshold = p2p2faSettings.thresholds.find((item) => item.id === params.thresholdId);
    const body = (await request.json()) as { value?: number; enabled?: boolean };
    if (
      !threshold ||
      (body.value !== undefined && (body.value < 0 || !Number.isFinite(body.value)))
    ) {
      return HttpResponse.json(
        { code: 'P2P_2FA_THRESHOLD_INVALID', message: 'Threshold update is invalid.' },
        { status: 400 },
      );
    }
    if (body.value !== undefined) threshold.value = body.value;
    if (body.enabled !== undefined) threshold.enabled = body.enabled;
    return HttpResponse.json(getP2P2FASettings());
  }),
  http.post('*/p2p/security/2fa/authenticator/setup', () => {
    p2pAuthenticatorSetupCode = '000000';
    return HttpResponse.json({
      secret: 'DEVONLY-P2P-SECRET',
      qrCodeUrl:
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect width="160" height="160" fill="white"/%3E%3Cpath d="M10 10h40v40H10zM110 10h40v40h-40zM10 110h40v40H10zM70 70h20v20H70z" fill="black"/%3E%3C/svg%3E',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  }),
  http.post('*/p2p/security/2fa/authenticator/confirm', async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    if (body.code !== p2pAuthenticatorSetupCode) {
      return HttpResponse.json(
        { code: 'P2P_2FA_CODE_INVALID', message: 'Authenticator code is invalid.' },
        { status: 401 },
      );
    }
    const method = p2p2faSettings.methods.find((item) => item.id === '2fa_authenticator');
    if (method) {
      method.enabled = true;
      method.setupRequired = false;
    }
    return HttpResponse.json(getP2P2FASettings());
  }),
  http.get('*/p2p/ads', ({ request }) => {
    const url = new URL(request.url);
    const asset = url.searchParams.get('asset');
    const currency = url.searchParams.get('currency');
    const type = url.searchParams.get('type');
    const source = url.searchParams.get('mine') === 'true' ? devP2pMineAds : devP2pAds;
    const items = source.filter(
      (ad) =>
        (!asset || ad.asset === asset) &&
        (!currency || ad.currency === currency) &&
        (!type || ad.type === type),
    );
    return HttpResponse.json({
      items: items.map((ad) => ({
        ...ad,
        paymentWindow: 15,
        referencePrice: p2pReferencePrices[ad.asset] ?? ad.price,
      })),
    });
  }),
  http.get('*/trading/copy/providers', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const risk = params.get('risk');
    const verified = params.get('verified');
    const sort = params.get('sort') ?? 'roi';
    const providers = devCopyTraders
      .filter((provider) => !risk || provider.riskLevel === risk)
      .filter((provider) => verified !== 'true' || provider.verified)
      .sort((a, b) => {
        if (sort === 'sharpe') return b.sharpeRatio - a.sharpeRatio;
        if (sort === 'followers') return b.copiers - a.copiers;
        if (sort === 'aum') return b.aum - a.aum;
        return b.totalPnlPct - a.totalPnlPct;
      });
    return HttpResponse.json({ items: providers });
  }),
  http.get('*/trading/copy/providers/:providerId', ({ params }) => {
    const provider = devCopyTraders.find((item) => item.id === params.providerId);
    return provider
      ? HttpResponse.json({
          provider,
          pnlHistory: devCopyProviderPnlHistory.map((item) => ({ ...item })),
          recentTrades: devCopyProviderTrades.map((item) => ({ ...item })),
        })
      : HttpResponse.json(
          { code: 'COPY_PROVIDER_NOT_FOUND', message: 'Copy provider not found' },
          { status: 404 },
        );
  }),
  http.get('*/trading/copy/relationships', () =>
    HttpResponse.json({
      items: devCopyRelationships.map((relationship) => ({
        ...relationship,
        provider: { ...relationship.provider },
        performanceHistory: relationship.performanceHistory.map((point) => ({ ...point })),
      })),
    }),
  ),
  http.post('*/trading/copy/relationships', async ({ request }) => {
    const body = (await request.json()) as {
      providerId: string;
      capital: number;
      copyMode: 'mirror' | 'fixed' | 'smart';
      positionSizing: 'percentage' | 'fixed';
      copyRatio?: number;
    };
    const provider = devCopyTraders.find((item) => item.id === body.providerId);
    if (!provider) {
      return HttpResponse.json(
        { code: 'COPY_PROVIDER_NOT_FOUND', message: 'Copy provider not found' },
        { status: 404 },
      );
    }
    const relationshipId = `copy-relationship-${devCopyRelationships.length + 1}`;
    devCopyRelationships.push({
      id: relationshipId,
      provider,
      status: 'active',
      copyMode: body.copyMode,
      positionSizing: body.positionSizing,
      copyRatio: body.copyRatio,
      capital: body.capital,
      currentValue: body.capital,
      pnl: 0,
      pnlPct: 0,
      trades: 0,
      winRate: 0,
      hasCustomStopLoss: false,
      performanceHistory: [{ date: new Date().toISOString(), value: body.capital }],
    });
    return HttpResponse.json({ copyId: relationshipId, status: 'active' }, { status: 201 });
  }),
  http.post('*/trading/copy/relationships/:copyId/stop', async ({ params, request }) => {
    const body = (await request.json()) as { reason: string; closeOpenPositions: boolean };
    if (!body.reason?.trim()) {
      return HttpResponse.json(
        { code: 'STOP_REASON_REQUIRED', message: 'Stop reason is required' },
        { status: 400 },
      );
    }
    const relationship = devCopyRelationships.find((item) => item.id === params.copyId);
    if (!relationship) {
      return HttpResponse.json(
        { code: 'COPY_RELATIONSHIP_NOT_FOUND', message: 'Copy relationship not found' },
        { status: 404 },
      );
    }
    relationship.status = 'stopped';
    return HttpResponse.json({ ...relationship, provider: { ...relationship.provider } });
  }),
  http.post('*/p2p/ads', async ({ request }) => {
    const body = (await request.json()) as {
      type: 'buy' | 'sell';
      asset: string;
      currency: string;
      priceType: 'fixed' | 'floating';
      price: number;
      priceMargin?: number;
      available: number;
      minLimit: number;
      maxLimit: number;
      paymentMethods: string[];
      remarks?: string;
      autoReply?: string;
      counterpartyRequirements?: Record<string, number | undefined>;
      tradingHours?: string;
      paymentWindow?: number;
    };
    if (
      !body.asset ||
      !body.currency ||
      body.price <= 0 ||
      body.available <= 0 ||
      body.maxLimit <= 0 ||
      body.paymentMethods.length === 0
    ) {
      return HttpResponse.json(
        { code: 'INVALID_P2P_AD', message: 'P2P ad fields are invalid' },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const ad = {
      ...P2P_ADS[0],
      id: `dev-p2p-ad-${Date.now()}`,
      type: body.type,
      asset: body.asset,
      currency: body.currency,
      priceType: body.priceType,
      price: body.price,
      priceMargin: body.priceMargin,
      available: body.available,
      minLimit: body.minLimit,
      maxLimit: body.maxLimit,
      paymentMethods: body.paymentMethods,
      remarks: body.remarks,
      autoReply: body.autoReply,
      counterpartyRequirements: body.counterpartyRequirements,
      tradingHours: body.tradingHours,
      paymentWindow: body.paymentWindow ?? 15,
      createdAt: now,
      merchant: 'VitTrade Developer',
      merchantId: 'dev-user-1',
      merchantVerified: true,
      referencePrice: p2pReferencePrices[body.asset] ?? body.price,
    };
    devP2pAds.unshift(ad);
    devP2pMineAds.unshift(ad);
    return HttpResponse.json(ad, { status: 201 });
  }),
  http.get('*/p2p/ads/:adId', ({ params }) => {
    const ad =
      devP2pAds.find((item) => item.id === params.adId) ??
      devP2pMineAds.find((item) => item.id === params.adId);
    return ad
      ? HttpResponse.json({
          ...ad,
          paymentWindow: 15,
          referencePrice: p2pReferencePrices[ad.asset] ?? ad.price,
        })
      : HttpResponse.json(
          { code: 'P2P_AD_NOT_FOUND', message: 'P2P ad not found' },
          { status: 404 },
        );
  }),
  http.get('*/p2p/ads/:adId/analytics', ({ params }) => {
    const analytics = P2P_AD_ANALYTICS[String(params.adId)];
    return analytics
      ? HttpResponse.json({ ...analytics })
      : HttpResponse.json(
          { code: 'P2P_ANALYTICS_NOT_FOUND', message: 'Ad analytics not found' },
          { status: 404 },
        );
  }),
  http.get('*/p2p/merchants/:merchantId', ({ params }) => {
    const merchant = P2P_MERCHANTS.find((item) => item.id === params.merchantId);
    if (!merchant) {
      return HttpResponse.json(
        { code: 'P2P_MERCHANT_NOT_FOUND', message: 'Merchant not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      merchant: { ...merchant },
      ads: P2P_ADS.filter((ad) => ad.merchantId === merchant.id),
      reviews: P2P_REVIEWS.map((review) => ({ ...review })),
    });
  }),
  http.post('*/p2p/reports/merchants', async ({ request }) => {
    const body = (await request.json()) as {
      merchantId?: unknown;
      reason?: unknown;
      detail?: unknown;
    };
    const validReasons = [
      'scam',
      'fake_payment',
      'harassment',
      'price_manipulation',
      'identity',
      'other',
    ];
    if (
      typeof body.merchantId !== 'string' ||
      !body.merchantId.trim() ||
      typeof body.reason !== 'string' ||
      !validReasons.includes(body.reason) ||
      (body.detail !== undefined && typeof body.detail !== 'string')
    ) {
      return HttpResponse.json(
        { code: 'P2P_REPORT_INVALID', message: 'Merchant report fields are invalid.' },
        { status: 400 },
      );
    }
    const merchant = P2P_MERCHANTS.find((item) => item.id === body.merchantId);
    if (!merchant) {
      return HttpResponse.json(
        { code: 'P2P_MERCHANT_NOT_FOUND', message: 'Merchant not found' },
        { status: 404 },
      );
    }
    const createdAt = new Date().toISOString();
    const reportId = `dev-p2p-report-${Date.now()}`;
    devP2pReports.push({
      reportId,
      merchantId: merchant.id,
      reason: body.reason,
      detail: typeof body.detail === 'string' ? body.detail.trim() : undefined,
      createdAt,
    });
    return HttpResponse.json({ reportId, status: 'submitted', createdAt }, { status: 201 });
  }),
  http.patch('*/p2p/ads/:adId', async ({ params, request }) => {
    const body = (await request.json()) as { status?: 'active' | 'paused' };
    const id = String(params.adId);
    const update = (ad: (typeof devP2pAds)[number]) => {
      if (ad.id !== id || !body.status) return false;
      ad.status = body.status;
      return true;
    };
    const ad =
      devP2pAds.find((item) => item.id === id) ?? devP2pMineAds.find((item) => item.id === id);
    if (!ad || !body.status) {
      return HttpResponse.json(
        { code: 'P2P_AD_NOT_FOUND', message: 'P2P ad not found' },
        { status: 404 },
      );
    }
    update(ad);
    update(devP2pAds.find((item) => item.id === id) ?? ad);
    update(devP2pMineAds.find((item) => item.id === id) ?? ad);
    return HttpResponse.json(ad);
  }),
  http.delete('*/p2p/ads/:adId', ({ params }) => {
    const id = String(params.adId);
    const before = devP2pMineAds.length + devP2pAds.length;
    for (const collection of [devP2pAds, devP2pMineAds]) {
      const index = collection.findIndex((item) => item.id === id);
      if (index >= 0) collection.splice(index, 1);
    }
    return before === devP2pMineAds.length + devP2pAds.length
      ? HttpResponse.json(
          { code: 'P2P_AD_NOT_FOUND', message: 'P2P ad not found' },
          { status: 404 },
        )
      : new HttpResponse(null, { status: 204 });
  }),
  http.post('*/p2p/orders', async ({ request }) => {
    const body = (await request.json()) as {
      adId: string;
      asset: string;
      currency: string;
      amount: number;
      fiatAmount: number;
      paymentMethod: string;
    };
    const ad = P2P_ADS.find((item) => item.id === body.adId) ?? P2P_ADS[0];
    const orderId = `dev-p2p-order-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    devP2pOrders.set(orderId, {
      ...P2P_ORDER,
      id: orderId,
      orderNumber: `VT-P2P-${orderId.slice(-8)}`,
      adId: body.adId,
      type: ad.type === 'sell' ? 'buy' : 'sell',
      asset: body.asset,
      amount: body.amount,
      price: ad.price,
      total: body.fiatAmount,
      currency: body.currency,
      merchant: ad.merchant,
      merchantId: ad.merchantId,
      paymentMethod: body.paymentMethod,
      createdAt,
      expiresAt,
      escrowAmount: body.amount,
      paymentInfo: P2P_ORDER.paymentInfo,
    });
    return HttpResponse.json(
      {
        orderId,
        status: 'created',
        expiresAt,
      },
      { status: 201 },
    );
  }),
  http.get('*/p2p/orders', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    const devOrders = Array.from(devP2pOrders.values());
    const orders = [
      ...devOrders,
      ...P2P_ORDERS.filter((item) => !devP2pOrders.has(item.id)),
    ].filter((item) => !status || item.status === status);
    return HttpResponse.json({ items: orders, total: orders.length });
  }),
  http.get('*/p2p/orders/:orderId', ({ params }) => {
    const order =
      devP2pOrders.get(String(params.orderId)) ??
      P2P_ORDERS.find((item) => item.id === params.orderId);
    return order
      ? HttpResponse.json(order)
      : HttpResponse.json(
          { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
          { status: 404 },
        );
  }),
  http.post('*/p2p/orders/:orderId/mark-paid', ({ params }) => {
    const orderId = String(params.orderId);
    const order = devP2pOrders.get(orderId) ?? P2P_ORDERS.find((item) => item.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
        { status: 404 },
      );
    }
    const updated = { ...order, status: 'paid' as const, paidAt: new Date().toISOString() };
    devP2pOrders.set(orderId, updated);
    return HttpResponse.json(updated);
  }),
  http.post('*/p2p/orders/:orderId/release/challenge', ({ params }) => {
    const orderId = String(params.orderId);
    const order = devP2pOrders.get(orderId) ?? P2P_ORDERS.find((item) => item.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
        { status: 404 },
      );
    }
    const id = `dev-p2p-release-challenge-${Date.now()}`;
    const verificationToken = `dev-p2p-release-${crypto.randomUUID()}`;
    p2pReleaseChallenges.set(id, { orderId, code: '000000', verificationToken });
    return HttpResponse.json(
      {
        id,
        method: 'totp',
        maskedDestination: 'Authenticator',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
      { status: 201 },
    );
  }),
  http.post(
    '*/p2p/orders/:orderId/release/challenge/:challengeId/verify',
    async ({ params, request }) => {
      const challenge = p2pReleaseChallenges.get(String(params.challengeId));
      const body = (await request.json()) as { code?: string };
      if (
        !challenge ||
        challenge.orderId !== String(params.orderId) ||
        body.code !== challenge.code
      ) {
        return HttpResponse.json(
          { code: 'MFA_INVALID', message: 'The verification code is invalid or expired.' },
          { status: 401 },
        );
      }
      p2pReleaseChallenges.delete(String(params.challengeId));
      verifiedP2pReleaseTokens.add(challenge.verificationToken);
      return HttpResponse.json({
        verificationToken: challenge.verificationToken,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      });
    },
  ),
  http.post('*/p2p/orders/:orderId/release', async ({ params, request }) => {
    const orderId = String(params.orderId);
    const order = devP2pOrders.get(orderId) ?? P2P_ORDERS.find((item) => item.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { verificationToken?: string };
    if (!body.verificationToken || !verifiedP2pReleaseTokens.has(body.verificationToken)) {
      return HttpResponse.json(
        { code: 'MFA_REQUIRED', message: 'A verified release challenge is required.' },
        { status: 403 },
      );
    }
    verifiedP2pReleaseTokens.delete(body.verificationToken);
    const updated = { ...order, status: 'released' as const, releasedAt: new Date().toISOString() };
    devP2pOrders.set(orderId, updated);
    return HttpResponse.json(updated);
  }),
  http.post('*/p2p/orders/:orderId/cancel', async ({ params, request }) => {
    const orderId = String(params.orderId);
    const order = devP2pOrders.get(orderId) ?? P2P_ORDERS.find((item) => item.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { reason?: string };
    if (!body.reason?.trim()) {
      return HttpResponse.json(
        { code: 'P2P_CANCEL_REASON_REQUIRED', message: 'Cancel reason is required' },
        { status: 400 },
      );
    }
    const updated = {
      ...order,
      status: 'cancelled' as const,
      cancelledAt: new Date().toISOString(),
      cancelReason: body.reason.trim(),
    };
    devP2pOrders.set(orderId, updated);
    return HttpResponse.json(updated);
  }),
  http.post('*/p2p/orders/:orderId/rate', async ({ params, request }) => {
    const orderId = String(params.orderId);
    const order = devP2pOrders.get(orderId) ?? P2P_ORDERS.find((item) => item.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { rating?: number; review?: string; tags?: string[] };
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return HttpResponse.json(
        { code: 'P2P_RATING_INVALID', message: 'Rating must be between 1 and 5' },
        { status: 400 },
      );
    }
    const updated = {
      ...order,
      rating: body.rating,
      review: body.review?.trim() || undefined,
    };
    devP2pOrders.set(orderId, updated);
    return HttpResponse.json(updated);
  }),
  http.post('*/p2p/orders/:orderId/payment-proof', async ({ params, request }) => {
    const orderId = String(params.orderId);
    const order = devP2pOrders.get(orderId) ?? P2P_ORDERS.find((item) => item.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
        { status: 404 },
      );
    }
    const formData = await request.formData();
    const files = formData
      .getAll('files')
      .filter((entry): entry is File => typeof entry !== 'string' && 'name' in entry);
    if (files.length === 0 || files.length > 3) {
      return HttpResponse.json(
        { code: 'P2P_PAYMENT_PROOF_INVALID', message: 'Upload between 1 and 3 proof files' },
        { status: 400 },
      );
    }
    const updated = { ...order, paymentProof: files.map((file) => file.name) };
    devP2pOrders.set(orderId, updated);
    return HttpResponse.json(updated);
  }),
  http.get('*/p2p/orders/:orderId/chat', ({ params }) => {
    const orderId = String(params.orderId);
    const order = devP2pOrders.get(orderId) ?? P2P_ORDERS.find((item) => item.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      orderId,
      counterparty: order.merchant,
      e2eEncrypted: false,
      messages: devP2pChatMessages.map((message) => ({
        id: message.id,
        sender:
          message.sender === 'me' ? 'user' : message.sender === 'other' ? 'counterparty' : 'system',
        text: message.text,
        sentAt: message.time,
        type: message.type,
        attachmentUrl: message.imageUrl,
        readAt: message.readAt,
      })),
    });
  }),
  http.post('*/p2p/orders/:orderId/chat/messages', async ({ params, request }) => {
    const orderId = String(params.orderId);
    const order = devP2pOrders.get(orderId) ?? P2P_ORDERS.find((item) => item.id === orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'P2P_ORDER_NOT_FOUND', message: 'P2P order not found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      text?: unknown;
      type?: unknown;
      attachmentUrl?: unknown;
    };
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000) {
      return HttpResponse.json(
        { code: 'P2P_CHAT_MESSAGE_INVALID', message: 'Chat message is invalid' },
        { status: 400 },
      );
    }
    devP2pChatMessages.push({
      id: `dev-chat-${Date.now()}`,
      sender: 'me',
      text: body.text.trim(),
      time: new Date().toISOString(),
      type: body.type === 'image' ? 'image' : 'text',
      imageUrl: typeof body.attachmentUrl === 'string' ? body.attachmentUrl : undefined,
      isRead: false,
    });
    return HttpResponse.json({
      orderId,
      counterparty: order.merchant,
      e2eEncrypted: false,
      messages: devP2pChatMessages.map((message) => ({
        id: message.id,
        sender:
          message.sender === 'me' ? 'user' : message.sender === 'other' ? 'counterparty' : 'system',
        text: message.text,
        sentAt: message.time,
        type: message.type,
        attachmentUrl: message.imageUrl,
        readAt: message.readAt,
      })),
    });
  }),
  http.get('*/p2p/payment-methods', () =>
    HttpResponse.json({ items: devP2pPaymentMethods.map((method) => ({ ...method })) }),
  ),
  http.post('*/p2p/payment-methods', async ({ request }) => {
    const body = (await request.json()) as {
      type?: string;
      bankName?: string;
      accountNumber?: string;
      accountName?: string;
      qrCodeUrl?: string;
    };
    if (
      !['bank', 'ewallet'].includes(body.type ?? '') ||
      !body.bankName?.trim() ||
      !body.accountNumber?.trim() ||
      !body.accountName?.trim()
    ) {
      return HttpResponse.json(
        { code: 'P2P_PAYMENT_METHOD_INVALID', message: 'Payment method fields are invalid.' },
        { status: 400 },
      );
    }
    const method = {
      id: `dev-p2p-payment-method-${Date.now()}`,
      type: body.type as 'bank' | 'ewallet',
      bankName: body.bankName.trim(),
      accountNumber: body.accountNumber.trim(),
      accountName: body.accountName.trim(),
      qrCodeUrl: body.qrCodeUrl,
      isDefault: devP2pPaymentMethods.length === 0,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    devP2pPaymentMethods.push(method);
    return HttpResponse.json(method, { status: 201 });
  }),
  http.patch('*/p2p/payment-methods/:methodId', async ({ params, request }) => {
    const method = devP2pPaymentMethods.find((item) => item.id === params.methodId);
    if (!method) {
      return HttpResponse.json(
        { code: 'P2P_PAYMENT_METHOD_NOT_FOUND', message: 'Payment method not found.' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { isDefault?: unknown };
    if (typeof body.isDefault !== 'boolean') {
      return HttpResponse.json(
        { code: 'P2P_PAYMENT_METHOD_INVALID', message: 'Payment method update is invalid.' },
        { status: 400 },
      );
    }
    if (body.isDefault) {
      devP2pPaymentMethods.forEach((item) => {
        item.isDefault = false;
      });
    }
    method.isDefault = body.isDefault;
    return HttpResponse.json({ ...method });
  }),
  http.delete('*/p2p/payment-methods/:methodId', ({ params }) => {
    const index = devP2pPaymentMethods.findIndex((item) => item.id === params.methodId);
    if (index < 0) {
      return HttpResponse.json(
        { code: 'P2P_PAYMENT_METHOD_NOT_FOUND', message: 'Payment method not found.' },
        { status: 404 },
      );
    }
    devP2pPaymentMethods.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/p2p/blacklist', ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const search = searchParams.get('search')?.trim().toLowerCase();
    const reason = searchParams.get('reason');
    const items = devP2pBlacklist.filter(
      (entry) =>
        (!search || entry.username.toLowerCase().includes(search)) &&
        (!reason || entry.reason === reason),
    );
    return HttpResponse.json({
      items: items.map((entry) => ({ ...entry })),
      total: items.length,
    });
  }),
  http.post('*/p2p/blacklist', async ({ request }) => {
    const body = (await request.json()) as { username?: unknown; reason?: unknown; note?: unknown };
    if (
      typeof body.username !== 'string' ||
      !body.username.trim() ||
      !['scam', 'unresponsive', 'fake_payment', 'harassment', 'other'].includes(String(body.reason))
    ) {
      return HttpResponse.json(
        { code: 'P2P_BLACKLIST_INVALID', message: 'Blacklist entry is invalid.' },
        { status: 400 },
      );
    }
    const entry = {
      id: `dev-p2p-blacklist-${Date.now()}`,
      userId: `dev-user-${Date.now()}`,
      username: body.username.trim(),
      reason: body.reason as (typeof devP2pBlacklist)[number]['reason'],
      reasonText: typeof body.note === 'string' ? body.note.trim() || undefined : undefined,
      blockedAt: new Date().toISOString(),
      tradesBefore: 0,
      completionRate: 0,
      isVerified: false,
    };
    devP2pBlacklist.unshift(entry);
    return HttpResponse.json(entry, { status: 201 });
  }),
  http.delete('*/p2p/blacklist/:entryId', ({ params }) => {
    const index = devP2pBlacklist.findIndex((entry) => entry.id === params.entryId);
    if (index < 0) {
      return HttpResponse.json(
        { code: 'P2P_BLACKLIST_NOT_FOUND', message: 'Blacklist entry not found.' },
        { status: 404 },
      );
    }
    devP2pBlacklist.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/p2p/reviews', ({ request }) => {
    const scope = new URL(request.url).searchParams.get('scope') ?? 'received';
    const items = devP2pReviews.filter((review) =>
      scope === 'given' ? review.fromUserId === 'user001' : review.toUserId === 'user001',
    );
    const total = items.length;
    return HttpResponse.json({
      items: items.map((review) => ({ ...review })),
      total,
      averageRating: total ? items.reduce((sum, review) => sum + review.rating, 0) / total : 0,
      positiveCount: items.filter((review) => review.type === 'positive').length,
      negativeCount: items.filter((review) => review.type === 'negative').length,
    });
  }),
  http.get('*/p2p/disputes', ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    const items = status
      ? devP2pDisputes.filter((dispute) => dispute.status === status)
      : devP2pDisputes;
    return HttpResponse.json({
      items: items.map((dispute) => ({ ...dispute })),
      total: items.length,
    });
  }),
  http.get('*/p2p/disputes/:disputeId', ({ params }) => {
    const dispute = devP2pDisputes.find(
      (item) => item.id === params.disputeId || item.orderId === params.disputeId,
    );
    if (!dispute) {
      return HttpResponse.json(
        { code: 'P2P_DISPUTE_NOT_FOUND', message: 'Dispute not found.' },
        { status: 404 },
      );
    }
    return HttpResponse.json({ ...dispute });
  }),
  http.post('*/p2p/disputes/:disputeId/messages', async ({ params, request }) => {
    const dispute = devP2pDisputes.find(
      (item) => item.id === params.disputeId || item.orderId === params.disputeId,
    );
    if (!dispute) {
      return HttpResponse.json(
        { code: 'P2P_DISPUTE_NOT_FOUND', message: 'Dispute not found.' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { text?: unknown };
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000) {
      return HttpResponse.json(
        { code: 'P2P_DISPUTE_MESSAGE_INVALID', message: 'Message is invalid.' },
        { status: 400 },
      );
    }
    dispute.supportMessages.push({
      sender: 'user',
      text: body.text.trim(),
      time: new Date().toISOString(),
    });
    return HttpResponse.json({ ...dispute });
  }),
  http.post('*/p2p/disputes/:disputeId/escalate', async ({ params, request }) => {
    const dispute = devP2pDisputes.find(
      (item) => item.id === params.disputeId || item.orderId === params.disputeId,
    );
    if (!dispute) {
      return HttpResponse.json(
        { code: 'P2P_DISPUTE_NOT_FOUND', message: 'Dispute not found.' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { level?: unknown };
    if (
      typeof body.level !== 'number' ||
      !Number.isInteger(body.level) ||
      body.level < 1 ||
      body.level > 4 ||
      body.level <= dispute.escalationLevel
    ) {
      return HttpResponse.json(
        { code: 'P2P_DISPUTE_ESCALATION_INVALID', message: 'Escalation level is invalid.' },
        { status: 400 },
      );
    }
    dispute.escalationLevel = body.level;
    dispute.status = 'under_review';
    dispute.timeline.push({
      time: new Date().toISOString(),
      event: 'Dispute escalated',
      detail: `Escalated to level ${body.level}`,
    });
    return HttpResponse.json({ ...dispute });
  }),
  http.get('*/p2p/dashboard', () => HttpResponse.json(devP2pDashboard)),
  http.get('*/p2p/achievements', () =>
    HttpResponse.json({
      items: devP2pAchievements.map((achievement) => ({ ...achievement })),
      totalUnlocked: devP2pAchievements.filter((achievement) => achievement.unlocked).length,
      totalPoints: 20,
      badgeCount: 1,
      currentLevel: P2P_USER_LEVEL.currentLevel,
    }),
  ),
  http.get('*/p2p/overview', () =>
    HttpResponse.json({
      userLevel: P2P_USER_LEVEL,
      tradingLevels: P2P_TRADING_LEVELS,
      platformStats: P2P_PLATFORM_STATS,
    }),
  ),
  http.get('*/earn/snapshot', () => HttpResponse.json(earnSnapshot)),
  http.get('*/earn/transactions', ({ request }) => {
    const query = new URL(request.url).searchParams;
    const domain = query.get('domain');
    if (domain !== 'savings' && domain !== 'staking') {
      return HttpResponse.json(
        { code: 'EARN_DOMAIN_INVALID', message: 'Earn domain is required' },
        { status: 400 },
      );
    }
    const requestedLimit = Number(query.get('limit') ?? 25);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 25;
    return HttpResponse.json(
      getTestEarnTransactionsPage(domain, query.get('cursor') ?? undefined, limit),
    );
  }),
  http.post('*/earn/subscriptions', async ({ request }) => {
    const body = (await request.json()) as { productId?: string; amount?: number };
    const product = earnSnapshot.products.find((item) => item.id === body.productId);
    if (!product || !body.amount || body.amount <= 0) {
      return HttpResponse.json(
        { code: 'EARN_SUBSCRIPTION_INVALID', message: 'Sản phẩm hoặc số lượng không hợp lệ' },
        { status: 400 },
      );
    }
    const position = {
      id: `dev-earn-position-${Date.now()}`,
      productId: product.id,
      product: product.name,
      asset: product.asset,
      amount: body.amount,
      earned: 0,
      apy: product.apy,
      startDate: new Date().toISOString(),
      endDate: product.lockDays
        ? new Date(Date.now() + product.lockDays * 86_400_000).toISOString()
        : undefined,
      type: product.type,
      color: product.color,
      riskLevel: product.riskLevel,
      lockDays: product.lockDays,
    };
    earnSnapshot.positions.push(position);
    earnSnapshot.summary.activePositions = earnSnapshot.positions.length;
    return HttpResponse.json(
      {
        id: `dev-earn-subscription-${Date.now()}`,
        operation: 'subscribe',
        productId: product.id,
        positionId: position.id,
        asset: product.asset,
        amount: body.amount,
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
  http.post('*/earn/redemptions', async ({ request }) => {
    const body = (await request.json()) as { positionId?: string; amount?: number };
    const position = earnSnapshot.positions.find((item) => item.id === body.positionId);
    if (!position || !body.amount || body.amount <= 0 || body.amount > position.amount) {
      return HttpResponse.json(
        { code: 'EARN_REDEMPTION_INVALID', message: 'Vị thế hoặc số lượng không hợp lệ' },
        { status: 400 },
      );
    }
    position.amount -= body.amount;
    if (position.amount === 0) {
      earnSnapshot.positions.splice(earnSnapshot.positions.indexOf(position), 1);
    }
    earnSnapshot.summary.activePositions = earnSnapshot.positions.length;
    return HttpResponse.json(
      {
        id: `dev-earn-redemption-${Date.now()}`,
        operation: 'redeem',
        productId: position.productId,
        positionId: position.id,
        asset: position.asset,
        amount: body.amount,
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
  http.get('*/dca/snapshot', () => HttpResponse.json(serializeDcaSnapshot())),
  http.post('*/dca/plans', async ({ request }) => {
    const body = (await request.json()) as {
      coinSymbol: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      amountPerPurchase: number;
      startDate?: string;
    };
    const plan = {
      id: `dev-plan-${Date.now()}`,
      coinSymbol: body.coinSymbol,
      coinName: body.coinSymbol,
      coinIcon: `https://cryptologos.cc/logos/${body.coinSymbol.toLowerCase()}-logo.png`,
      frequency: body.frequency,
      amountPerPurchase: body.amountPerPurchase,
      nextExecution: body.startDate ?? new Date(Date.now() + 86_400_000).toISOString(),
      status: 'active' as const,
      totalInvested: 0,
      currentHoldings: 0,
      averageCost: 0,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(plan, { status: 201 });
  }),
  http.patch('*/dca/plans/:planId', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const plan = dcaSnapshot.plans.find((item) => item.id === params.planId);
    if (!plan)
      return HttpResponse.json(
        { code: 'DCA_PLAN_NOT_FOUND', message: 'Plan not found' },
        { status: 404 },
      );
    return HttpResponse.json({
      ...plan,
      ...body,
      nextExecution: plan.nextExecution.toISOString(),
      createdAt: plan.createdAt.toISOString(),
      lastPurchaseAt: plan.lastPurchaseAt?.toISOString(),
    });
  }),
  http.delete('*/dca/plans/:planId', () => new HttpResponse(null, { status: 204 })),
  http.get('*/wallet/assets', () =>
    HttpResponse.json({
      items: assets,
      summary: {
        totalUsd: 16_754.32,
        totalBtc: 0.248,
        availableUsd: 16_754.32,
        inOrderUsd: 0,
        frozenUsd: 0,
      },
    }),
  ),
  http.get('*/wallet/accounts', () =>
    HttpResponse.json({
      items: [
        { id: 'spot', name: 'Ví Spot', balanceUsd: 54_276.79 },
        { id: 'funding', name: 'Ví Funding', balanceUsd: 8_450.2 },
        { id: 'futures', name: 'Ví Futures', balanceUsd: 3_200 },
      ],
    }),
  ),
  http.get('*/wallet/address-book', () => HttpResponse.json(getWalletAddressBook())),
  http.post('*/wallet/address-book', async ({ request }) => {
    const body = (await request.json()) as {
      label?: string;
      address?: string;
      network?: string;
      asset?: string;
      memo?: string;
      isWhitelisted?: boolean;
    };
    if (!body.label || !body.address || !body.network || !body.asset) {
      return HttpResponse.json(
        { code: 'ADDRESS_BOOK_INVALID', message: 'Address book entry is incomplete.' },
        { status: 400 },
      );
    }
    const item = {
      id: `dev-address-${Date.now()}`,
      label: body.label,
      address: body.address,
      network: body.network,
      asset: body.asset,
      memo: body.memo,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      isWhitelisted: body.isWhitelisted === true,
    };
    walletAddressBook.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.patch('*/wallet/address-book/settings', async ({ request }) => {
    const body = (await request.json()) as { whitelistEnabled?: boolean };
    walletAddressBookWhitelistEnabled = body.whitelistEnabled === true;
    return HttpResponse.json(getWalletAddressBook());
  }),
  http.patch('*/wallet/address-book/:addressId', async ({ params, request }) => {
    const item = walletAddressBook.find((entry) => entry.id === String(params.addressId));
    if (!item) {
      return HttpResponse.json(
        { code: 'ADDRESS_BOOK_NOT_FOUND', message: 'Address book entry not found.' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      label?: string;
      memo?: string;
      isFavorite?: boolean;
      isWhitelisted?: boolean;
    };
    Object.assign(item, body);
    return HttpResponse.json(item);
  }),
  http.delete('*/wallet/address-book/:addressId', ({ params }) => {
    const index = walletAddressBook.findIndex((entry) => entry.id === String(params.addressId));
    if (index < 0) {
      return HttpResponse.json(
        { code: 'ADDRESS_BOOK_NOT_FOUND', message: 'Address book entry not found.' },
        { status: 404 },
      );
    }
    walletAddressBook.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/wallet/transactions', ({ request }) => {
    const url = new URL(request.url);
    const asset = url.searchParams.get('asset');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const items = TRANSACTIONS.filter(
      (transaction) =>
        (!asset || transaction.asset === asset) &&
        (!type || transaction.type === type) &&
        (!status || transaction.status === status),
    );
    return HttpResponse.json({ items, total: items.length });
  }),
  http.get('*/wallet/transactions/:transactionId', ({ params }) => {
    const transaction = TRANSACTIONS.find((item) => item.id === params.transactionId);
    return transaction
      ? HttpResponse.json(transaction)
      : HttpResponse.json(
          { code: 'WALLET_TRANSACTION_NOT_FOUND', message: 'Transaction not found' },
          { status: 404 },
        );
  }),
  http.get('*/wallet/deposit/networks', ({ request }) => {
    const asset = new URL(request.url).searchParams.get('asset') ?? 'USDT';
    return HttpResponse.json({ networks: DEPOSIT_NETWORKS[asset] ?? DEPOSIT_NETWORKS.USDT });
  }),
  http.get('*/wallet/withdrawal/networks', ({ request }) => {
    const asset = new URL(request.url).searchParams.get('asset') ?? 'USDT';
    return HttpResponse.json({ networks: WITHDRAW_NETWORKS[asset] ?? WITHDRAW_NETWORKS.USDT });
  }),
  http.get('*/wallet/analytics/portfolio', ({ request }) => {
    const period = new URL(request.url).searchParams.get('period') ?? '1M';
    return HttpResponse.json({ period, ...portfolioAnalytics });
  }),
  http.get('*/wallet/dust-conversions/quote', ({ request }) => {
    const url = new URL(request.url);
    const sourceAssetIds = (url.searchParams.get('assets') ?? '').split(',').filter(Boolean);
    const targetAsset = url.searchParams.get('targetAsset') ?? 'USDT';
    const selected = assets.filter((asset) => sourceAssetIds.includes(asset.id));
    const grossUsd = selected.reduce((total, asset) => total + asset.usdValue, 0);
    const feePct = 0.5;
    const feeUsd = grossUsd * (feePct / 100);
    const receivedUsd = Math.max(0, grossUsd - feeUsd);
    const targetData = assets.find((asset) => asset.symbol === targetAsset);
    const targetPrice = targetData ? targetData.usdValue / targetData.balance : 1;
    return HttpResponse.json({
      targetAsset,
      grossUsd,
      feePct,
      feeUsd,
      receivedUsd,
      targetAmount: receivedUsd / targetPrice,
    });
  }),
  http.post('*/wallet/dust-conversions', async ({ request }) => {
    const body = (await request.json()) as { sourceAssetIds: string[]; targetAsset: string };
    const selected = assets.filter((asset) => body.sourceAssetIds.includes(asset.id));
    const grossUsd = selected.reduce((total, asset) => total + asset.usdValue, 0);
    const feePct = 0.5;
    const feeUsd = grossUsd * (feePct / 100);
    const receivedUsd = Math.max(0, grossUsd - feeUsd);
    const targetData = assets.find((asset) => asset.symbol === body.targetAsset);
    const targetPrice = targetData ? targetData.usdValue / targetData.balance : 1;
    return HttpResponse.json(
      {
        id: `dev-dust-${Date.now()}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        targetAsset: body.targetAsset,
        grossUsd,
        feePct,
        feeUsd,
        receivedUsd,
        targetAmount: receivedUsd / targetPrice,
      },
      { status: 201 },
    );
  }),
  http.post('*/wallet/transfers', async ({ request }) => {
    const body = (await request.json()) as {
      fromWallet: 'spot' | 'funding' | 'futures';
      toWallet: 'spot' | 'funding' | 'futures';
      asset: string;
      amount: number;
    };
    return HttpResponse.json(
      {
        id: `dev-transfer-${Date.now()}`,
        ...body,
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
  http.post('*/wallet/withdrawals/challenge', async ({ request }) => {
    const body = (await request.json()) as { asset?: string; amount?: number };
    const id = `dev-withdrawal-challenge-${Date.now()}`;
    const verificationToken = `dev-withdrawal-verification-${crypto.randomUUID()}`;
    withdrawalChallenges.set(id, { code: '000000', verificationToken });
    return HttpResponse.json(
      {
        id,
        method: 'totp',
        maskedDestination: 'Authenticator',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        context: { asset: body.asset, amount: body.amount },
      },
      { status: 201 },
    );
  }),
  http.post('*/wallet/withdrawals/challenge/:challengeId/verify', async ({ params, request }) => {
    const challenge = withdrawalChallenges.get(String(params.challengeId));
    const body = (await request.json()) as { code?: string };
    if (!challenge || body.code !== challenge.code) {
      return HttpResponse.json(
        { code: 'MFA_INVALID', message: 'The verification code is invalid or expired.' },
        { status: 401 },
      );
    }
    withdrawalChallenges.delete(String(params.challengeId));
    verifiedWithdrawalTokens.add(challenge.verificationToken);
    return HttpResponse.json({
      verificationToken: challenge.verificationToken,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    });
  }),
  http.post('*/wallet/withdrawals', async ({ request }) => {
    const body = (await request.json()) as {
      asset: string;
      amount: number;
      verificationToken?: string;
    };
    if (!body.verificationToken || !verifiedWithdrawalTokens.has(body.verificationToken)) {
      return HttpResponse.json(
        { code: 'MFA_REQUIRED', message: 'A verified withdrawal challenge is required.' },
        { status: 403 },
      );
    }
    verifiedWithdrawalTokens.delete(body.verificationToken);
    const transactionId = `dev-tx-${Date.now()}`;
    return HttpResponse.json(
      {
        id: `dev-withdrawal-${Date.now()}`,
        transactionId,
        asset: body.asset,
        amount: body.amount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),
  http.get('*/trading/orders/history', ({ request }) =>
    HttpResponse.json({ items: filterDevTradingOrders(request, false) }),
  ),
  http.get('*/trading/analytics', ({ request }) => {
    const requestedPeriod = new URL(request.url).searchParams.get('period');
    const period = ['7D', '1M', '3M', '1Y'].includes(requestedPeriod ?? '')
      ? (requestedPeriod as '7D' | '1M' | '3M' | '1Y')
      : '1M';
    return HttpResponse.json(getTradingAnalytics(period));
  }),
  http.get('*/trading/orders', ({ request }) =>
    HttpResponse.json({ items: filterDevTradingOrders(request, true) }),
  ),
  http.post('*/trading/orders', async ({ request }) => {
    const idempotencyScope = getTradingIdempotencyScope(request);
    if (!idempotencyScope) {
      return HttpResponse.json(
        { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required.' },
        { status: 400 },
      );
    }

    const existingOrderId = devTradingIdempotency.get(idempotencyScope);
    if (existingOrderId) return HttpResponse.json(devTradingOrders.get(existingOrderId));

    const body = (await request.json()) as Record<string, unknown>;
    const order: DevTradingOrder = {
      id: `dev-order-${crypto.randomUUID()}`,
      symbol: typeof body.symbol === 'string' ? body.symbol : 'BTC/USDT',
      side: body.side === 'sell' ? 'sell' : 'buy',
      type: typeof body.type === 'string' ? body.type : 'limit',
      price: typeof body.price === 'number' ? body.price : 0,
      amount: typeof body.amount === 'number' ? body.amount : 0,
      filled: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
      fee: 0,
      ...(typeof body.clientOrderId === 'string' ? { clientOrderId: body.clientOrderId } : {}),
      ...(typeof body.tpPrice === 'number' ? { tpPrice: body.tpPrice } : {}),
      ...(typeof body.slPrice === 'number' ? { slPrice: body.slPrice } : {}),
      ...(body.type === 'oco' ? { ocoLinked: true } : {}),
    };
    devTradingOrders.set(order.id, order);
    devTradingIdempotency.set(idempotencyScope, order.id);
    return HttpResponse.json(order, { status: 201 });
  }),
  http.patch('*/trading/orders/:orderId', async ({ params, request }) => {
    const idempotencyScope = getTradingIdempotencyScope(request);
    if (!idempotencyScope) {
      return HttpResponse.json(
        { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required.' },
        { status: 400 },
      );
    }

    const orderId = String(params.orderId);
    const order = devTradingOrders.get(orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'ORDER_NOT_FOUND', message: 'Order not found.' },
        { status: 404 },
      );
    }

    const existingOrderId = devTradingIdempotency.get(idempotencyScope);
    if (existingOrderId) return HttpResponse.json(devTradingOrders.get(existingOrderId));

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.price === 'number') order.price = body.price;
    if (typeof body.amount === 'number') order.amount = body.amount;
    order.updatedAt = new Date().toISOString();
    devTradingIdempotency.set(idempotencyScope, order.id);
    return HttpResponse.json(order);
  }),
  http.post('*/trading/orders/:orderId/cancel', ({ params, request }) => {
    const idempotencyScope = getTradingIdempotencyScope(request);
    if (!idempotencyScope) {
      return HttpResponse.json(
        { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required.' },
        { status: 400 },
      );
    }

    const orderId = String(params.orderId);
    const order = devTradingOrders.get(orderId);
    if (!order) {
      return HttpResponse.json(
        { code: 'ORDER_NOT_FOUND', message: 'Order not found.' },
        { status: 404 },
      );
    }

    const existingOrderId = devTradingIdempotency.get(idempotencyScope);
    if (existingOrderId) return HttpResponse.json(devTradingOrders.get(existingOrderId));

    if (order.status !== 'open') {
      return HttpResponse.json(
        { code: 'ORDER_ALREADY_CLOSED', message: 'Order is already closed.' },
        { status: 409 },
      );
    }

    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    devTradingIdempotency.set(idempotencyScope, order.id);
    return HttpResponse.json(order);
  }),
];
