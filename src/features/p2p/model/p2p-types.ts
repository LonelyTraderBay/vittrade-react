export type P2PAdType = 'buy' | 'sell';
export type P2PAdStatus = 'active' | 'paused' | 'expired';

/** Marketplace offer returned by the P2P ads contract. */
export interface P2PAd {
  id: string;
  type: P2PAdType;
  asset: string;
  merchant: string;
  merchantId: string;
  merchantAvatar?: string;
  merchantLevel: number;
  merchantVerified: boolean;
  merchantJoinDate: string;
  completionRate: number;
  completedOrders: number;
  totalVolume30d: number;
  price: number;
  currency: string;
  priceType: 'fixed' | 'floating';
  priceMargin?: number;
  minLimit: number;
  maxLimit: number;
  available: number;
  paymentMethods: string[];
  avgResponseTime: string;
  isOnline: boolean;
  lastActive?: string;
  remarks?: string;
  autoReply?: string;
  counterpartyRequirements?: {
    minKycLevel?: number;
    minCompletedTrades?: number;
    minRegisteredDays?: number;
  };
  tradingHours?: string;
  createdAt: string;
  status: P2PAdStatus;
  merchantRating?: number;
  merchantBadge?: 'elite' | 'pro' | null;
  merchantFlag?: string;
  viewerCount?: number;
  isNewMerchant?: boolean;
  timeAgo?: string;
  paymentWindow?: number;
  referencePrice?: number;
}

export interface P2PAdsQuery extends Record<string, string | number | boolean | null | undefined> {
  asset?: string;
  currency?: string;
  type?: P2PAdType;
  mine?: boolean;
}

export interface P2PAdsResponse {
  items: P2PAd[];
  nextCursor?: string;
}

export interface P2PAdCreateRequest {
  type: P2PAdType;
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
  counterpartyRequirements?: {
    minKycLevel?: number;
    minCompletedTrades?: number;
    minRegisteredDays?: number;
  };
  tradingHours?: string;
  paymentWindow?: number;
}

export interface P2PAdStatusUpdateRequest {
  status: Extract<P2PAdStatus, 'active' | 'paused'>;
}

export interface P2PTradingLevel {
  id: number;
  name: string;
  nameVi: string;
  fee: number;
  dailyLimit: number;
  perOrderLimit: number;
  requirements: string[];
  color: string;
  gradient: string;
}

export interface P2PUserLevel {
  currentLevel: number;
  completedOrders: number;
  accumulatedVolume: number;
  dailyUsed: number;
  dailyLimit: number;
  fee: number;
  nextLevelProgress: number;
}

export interface P2PPlatformStats {
  volume24h: number;
  volume24hChange: number;
  totalTrades24h: number;
  activeMerchants: number;
  onlineTraders: number;
  avgCompletionRate: number;
  avgCompletionTime: string;
  totalUsers: number;
  supportedFiats: number;
  escrowProtected: number;
}

export type P2PPaymentMethodType = 'bank' | 'ewallet';

export interface P2PPaymentMethod {
  id: string;
  type: P2PPaymentMethodType;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrCodeUrl?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface P2PPaymentMethodCreateRequest {
  type: P2PPaymentMethodType;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrCodeUrl?: string;
}

export interface P2PPaymentMethodUpdateRequest {
  isDefault?: boolean;
}

export type P2PDisputeStatus = 'submitted' | 'under_review' | 'resolved' | 'rejected';

export interface P2PDisputeTimelineEvent {
  time: string;
  event: string;
  detail?: string;
}

export interface P2PSupportMessage {
  sender: 'user' | 'support';
  text: string;
  time: string;
}

export interface P2PDispute {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  description: string;
  evidence: string[];
  status: P2PDisputeStatus;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
  timeline: P2PDisputeTimelineEvent[];
  supportMessages: P2PSupportMessage[];
  escalationLevel: number;
}

export interface P2PDisputesQuery extends Record<string, string | undefined> {
  status?: P2PDisputeStatus;
}

export interface P2PDisputesResponse {
  items: P2PDispute[];
  total: number;
}

export interface P2PDisputeMessageRequest {
  text: string;
}

export interface P2PDisputeEscalationRequest {
  level: number;
}

export interface P2POverviewResponse {
  userLevel: P2PUserLevel;
  tradingLevels: P2PTradingLevel[];
  platformStats: P2PPlatformStats;
}

export interface P2PDashboardStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  disputedOrders: number;
  completionRate: number;
  avgCompletionTime: string;
  totalVolume7d: number;
  totalVolume30d: number;
  totalVolumeAll: number;
  buyVolume30d: number;
  sellVolume30d: number;
  spreadRevenue30d: number;
  avgOrderSize: number;
  uniqueCounterparties: number;
  repeatCustomerRate: number;
  avgRatingGiven: number;
  avgRatingReceived: number;
  positiveReviewRate: number;
  responseTimeAvg: string;
  platformAvgCompletionRate: number;
  platformAvgResponseTime: string;
}

export interface P2PDashboardResponse {
  stats: P2PDashboardStats;
  ordersByMonth: { month: string; buy: number; sell: number }[];
  volumeByWeek: { week: string; volume: number }[];
  assetDistribution: { asset: string; percentage: number; volume: number }[];
  topMerchants: { name: string; id: string; trades: number; volume: number; rating: number }[];
  recentActivity: {
    date: string;
    type: string;
    asset: string;
    amount: number;
    total: number;
    merchant: string;
    status: string;
  }[];
}

export interface P2PAdAnalytics {
  adId: string;
  impressions: number;
  clicks: number;
  ordersCreated: number;
  ordersCompleted: number;
  ordersDisputed: number;
  ordersCancelled: number;
  totalVolume: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgResponseTime: number;
  avgCompletionTime: number;
  conversionRate: number;
  completionRate: number;
  rating: number;
  reviewsCount: number;
  ranking: number;
  totalActiveAds: number;
  dailyPerformance: { date: string; impressions: number; orders: number; volume: number }[];
  hourlyHeatmap: { hour: number; orders: number }[];
  paymentBreakdown: { method: string; count: number; volume: number }[];
  competitorComparison: { metric: string; yours: number; avg: number; top: number }[];
}

export interface P2PMerchantProfile {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  kycVerified: boolean;
  joinDate: string;
  totalTrades: number;
  totalTrades30d: number;
  completionRate: number;
  avgReleaseTime: string;
  avgPayTime: string;
  totalVolume30d: number;
  isOnline: boolean;
  lastActive: string;
  positiveRate: number;
  negativeCount: number;
  activeAds: number;
}

export interface P2PMerchantProfileResponse {
  merchant: P2PMerchantProfile;
  ads: P2PAd[];
  reviews: P2PReview[];
}

export type P2PReportReason =
  'scam' | 'fake_payment' | 'harassment' | 'price_manipulation' | 'identity' | 'other';

export interface P2PReportCreateRequest {
  merchantId: string;
  reason: P2PReportReason;
  detail?: string;
}

export interface P2PReportReceipt {
  reportId: string;
  status: 'submitted';
  createdAt: string;
}

export type P2PBlacklistReason = 'scam' | 'unresponsive' | 'fake_payment' | 'harassment' | 'other';

export interface P2PBlacklistEntry {
  id: string;
  userId: string;
  username: string;
  reason: P2PBlacklistReason;
  reasonText?: string;
  blockedAt: string;
  orderId?: string;
  tradesBefore: number;
  completionRate: number;
  isVerified: boolean;
  badge?: 'elite' | 'pro';
}

export interface P2PBlacklistQuery extends Record<string, string | undefined> {
  search?: string;
  reason?: P2PBlacklistReason;
}

export interface P2PBlacklistResponse {
  items: P2PBlacklistEntry[];
  total: number;
}

export interface P2PBlacklistCreateRequest {
  username: string;
  reason: P2PBlacklistReason;
  note?: string;
}

export type P2PReviewScope = 'received' | 'given';

export interface P2PReview {
  id: string;
  orderId: string;
  fromUser: string;
  fromUserId: string;
  toUser: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
  replyAt?: string;
  type: 'positive' | 'negative';
}

export interface P2PReviewsResponse {
  items: P2PReview[];
  total: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
}

export interface P2POrderRequest {
  adId: string;
  asset: string;
  currency: string;
  amount: number;
  fiatAmount: number;
  paymentMethod: string;
}

export interface P2POrderReceipt {
  orderId: string;
  status: 'created' | 'pending';
  expiresAt: string;
}

export interface P2PCancelOrderRequest {
  reason: string;
}

export interface P2PRateOrderRequest {
  rating: number;
  review?: string;
  tags?: string[];
}

export interface P2PPaymentProofRequest {
  files: File[];
}

export type P2PReleaseChallengeMethod = 'totp' | 'sms';

export interface P2PReleaseChallenge {
  id: string;
  method: P2PReleaseChallengeMethod;
  maskedDestination?: string;
  expiresAt: string;
}

export interface P2PReleaseVerification {
  verificationToken: string;
  expiresAt: string;
}

export type P2P2FAMethodId = '2fa_sms' | '2fa_authenticator' | '2fa_email';

export interface P2P2FAMethod {
  id: P2P2FAMethodId;
  label: string;
  description: string;
  enabled: boolean;
  isPrimary: boolean;
  setupRequired: boolean;
  color: string;
}

export type P2P2FAThresholdId = 'release' | 'create_order' | 'cancel_order';

export interface P2P2FAThreshold {
  id: P2P2FAThresholdId;
  label: string;
  description: string;
  value: number;
  unit: 'VND' | 'USDT';
  enabled: boolean;
}

export interface P2P2FASettingsResponse {
  methods: P2P2FAMethod[];
  thresholds: P2P2FAThreshold[];
}

export interface P2PAuthenticatorSetupChallenge {
  secret: string;
  qrCodeUrl: string;
  expiresAt: string;
}

export type P2POrderStatus =
  'pending_payment' | 'paid' | 'released' | 'disputed' | 'cancelled' | 'expired';

export interface P2PPaymentInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrCodeUrl?: string;
}

export interface P2POrder {
  id: string;
  orderNumber: string;
  adId: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  total: number;
  currency: string;
  status: P2POrderStatus;
  merchant: string;
  merchantId: string;
  counterparty: string;
  paymentMethod: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  releasedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  escrowAmount: number;
  fee: number;
  paymentProof?: string[];
  rating?: number;
  review?: string;
  disputeReason?: string;
  disputeEvidence?: string[];
  paymentInfo?: P2PPaymentInfo;
}

export type P2PChatMessageSender = 'user' | 'counterparty' | 'system';
export type P2PChatMessageType = 'text' | 'image' | 'system';

export interface P2PChatMessage {
  id: string;
  sender: P2PChatMessageSender;
  text: string;
  sentAt: string;
  type: P2PChatMessageType;
  attachmentUrl?: string;
  readAt?: string;
}

export interface P2PChatResponse {
  orderId: string;
  counterparty: string;
  e2eEncrypted: boolean;
  messages: P2PChatMessage[];
}

export interface P2PChatMessageRequest {
  text: string;
  type?: Extract<P2PChatMessageType, 'text' | 'image'>;
  attachmentUrl?: string;
}

export type P2PAchievementCategory = 'volume' | 'trades' | 'trust' | 'special';

export interface P2PAchievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  unlocked: boolean;
  unlockedAt?: string;
  reward?: string;
  category: P2PAchievementCategory;
}

export interface P2PAchievementsResponse {
  items: P2PAchievement[];
  totalUnlocked: number;
  totalPoints: number;
  badgeCount: number;
  currentLevel: number;
}

export interface P2POrdersQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  status?: P2POrderStatus;
  cursor?: string;
  limit?: number;
}

export interface P2POrdersResponse {
  items: P2POrder[];
  total: number;
  nextCursor?: string;
}
