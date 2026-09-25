import { z } from 'zod';

export const adSchema = z.object({
  id: z.string(),
  type: z.enum(['buy', 'sell']),
  asset: z.string(),
  merchant: z.string(),
  merchantId: z.string(),
  merchantAvatar: z.string().optional(),
  merchantLevel: z.number(),
  merchantVerified: z.boolean(),
  merchantJoinDate: z.string(),
  completionRate: z.number(),
  completedOrders: z.number(),
  totalVolume30d: z.number(),
  price: z.number().positive(),
  currency: z.string(),
  priceType: z.enum(['fixed', 'floating']),
  priceMargin: z.number().optional(),
  minLimit: z.number().nonnegative(),
  maxLimit: z.number().positive(),
  available: z.number().positive(),
  paymentMethods: z.array(z.string()),
  avgResponseTime: z.string(),
  isOnline: z.boolean(),
  lastActive: z.string().optional(),
  remarks: z.string().optional(),
  autoReply: z.string().optional(),
  counterpartyRequirements: z
    .object({
      minKycLevel: z.number().optional(),
      minCompletedTrades: z.number().optional(),
      minRegisteredDays: z.number().optional(),
    })
    .optional(),
  tradingHours: z.string().optional(),
  createdAt: z.string(),
  status: z.enum(['active', 'paused', 'expired']),
  merchantRating: z.number().optional(),
  merchantBadge: z.enum(['elite', 'pro']).nullable().optional(),
  merchantFlag: z.string().optional(),
  viewerCount: z.number().optional(),
  isNewMerchant: z.boolean().optional(),
  timeAgo: z.string().optional(),
  paymentWindow: z.number().int().positive().optional(),
  referencePrice: z.number().positive().optional(),
});

export const responseSchema = z.object({
  items: z.array(adSchema),
  nextCursor: z.string().optional(),
});

export const overviewSchema = z.object({
  userLevel: z.object({
    currentLevel: z.number(),
    completedOrders: z.number(),
    accumulatedVolume: z.number(),
    dailyUsed: z.number(),
    dailyLimit: z.number(),
    fee: z.number(),
    nextLevelProgress: z.number(),
  }),
  tradingLevels: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      nameVi: z.string(),
      fee: z.number(),
      dailyLimit: z.number(),
      perOrderLimit: z.number(),
      requirements: z.array(z.string()),
      color: z.string(),
      gradient: z.string(),
    }),
  ),
  platformStats: z.object({
    volume24h: z.number(),
    volume24hChange: z.number(),
    totalTrades24h: z.number(),
    activeMerchants: z.number(),
    onlineTraders: z.number(),
    avgCompletionRate: z.number(),
    avgCompletionTime: z.string(),
    totalUsers: z.number(),
    supportedFiats: z.number(),
    escrowProtected: z.number(),
  }),
});

export const orderReceiptSchema = z.object({
  orderId: z.string(),
  status: z.enum(['created', 'pending']),
  expiresAt: z.string().datetime({ offset: true }),
});

export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  adId: z.string(),
  type: z.enum(['buy', 'sell']),
  asset: z.string(),
  amount: z.number().positive(),
  price: z.number().positive(),
  total: z.number().positive(),
  currency: z.string(),
  status: z.enum(['pending_payment', 'paid', 'released', 'disputed', 'cancelled', 'expired']),
  merchant: z.string(),
  merchantId: z.string(),
  counterparty: z.string(),
  paymentMethod: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  paidAt: z.string().datetime({ offset: true }).optional(),
  releasedAt: z.string().datetime({ offset: true }).optional(),
  cancelledAt: z.string().datetime({ offset: true }).optional(),
  cancelReason: z.string().optional(),
  escrowAmount: z.number().nonnegative(),
  fee: z.number().nonnegative(),
  paymentProof: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  review: z.string().optional(),
  disputeReason: z.string().optional(),
  disputeEvidence: z.array(z.string()).optional(),
  paymentInfo: z
    .object({
      bankName: z.string(),
      accountNumber: z.string(),
      accountName: z.string(),
      qrCodeUrl: z.string().optional(),
    })
    .optional(),
});

export const chatResponseSchema = z.object({
  orderId: z.string().min(1),
  counterparty: z.string().min(1),
  e2eEncrypted: z.boolean(),
  messages: z.array(
    z.object({
      id: z.string().min(1),
      sender: z.enum(['user', 'counterparty', 'system']),
      text: z.string(),
      sentAt: z.string(),
      type: z.enum(['text', 'image', 'system']),
      attachmentUrl: z.string().optional(),
      readAt: z.string().optional(),
    }),
  ),
});

export const achievementsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string(),
      description: z.string(),
      progress: z.number().min(0).max(100),
      currentValue: z.number().nonnegative(),
      targetValue: z.number().positive(),
      unit: z.string(),
      unlocked: z.boolean(),
      unlockedAt: z.string().optional(),
      reward: z.string().optional(),
      category: z.enum(['volume', 'trades', 'trust', 'special']),
    }),
  ),
  totalUnlocked: z.number().int().nonnegative(),
  totalPoints: z.number().int().nonnegative(),
  badgeCount: z.number().int().nonnegative(),
  currentLevel: z.number().int().nonnegative(),
});

export const ordersResponseSchema = z.object({
  items: z.array(orderSchema),
  total: z.number().int().nonnegative(),
  nextCursor: z.string().optional(),
});

export const releaseChallengeSchema = z.object({
  id: z.string().min(1),
  method: z.enum(['totp', 'sms']),
  maskedDestination: z.string().optional(),
  expiresAt: z.string().datetime({ offset: true }),
});

export const releaseVerificationSchema = z.object({
  verificationToken: z.string().min(1),
  expiresAt: z.string().datetime({ offset: true }),
});

export const twoFactorSettingsSchema = z.object({
  methods: z.array(
    z.object({
      id: z.enum(['2fa_sms', '2fa_authenticator', '2fa_email']),
      label: z.string(),
      description: z.string(),
      enabled: z.boolean(),
      isPrimary: z.boolean(),
      setupRequired: z.boolean(),
      color: z.string(),
    }),
  ),
  thresholds: z.array(
    z.object({
      id: z.enum(['release', 'create_order', 'cancel_order']),
      label: z.string(),
      description: z.string(),
      value: z.number().nonnegative(),
      unit: z.enum(['VND', 'USDT']),
      enabled: z.boolean(),
    }),
  ),
});

export const authenticatorSetupChallengeSchema = z.object({
  secret: z.string().min(1),
  qrCodeUrl: z.string().url(),
  expiresAt: z.string(),
});

export const paymentMethodSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['bank', 'ewallet']),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
  qrCodeUrl: z.string().optional(),
  isDefault: z.boolean(),
  isVerified: z.boolean(),
  createdAt: z.string(),
});

export const paymentMethodsResponseSchema = z.object({ items: z.array(paymentMethodSchema) });

export const disputeSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  orderNumber: z.string().min(1),
  reason: z.string().min(1),
  description: z.string(),
  evidence: z.array(z.string()),
  status: z.enum(['submitted', 'under_review', 'resolved', 'rejected']),
  resolution: z.string().optional(),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
  timeline: z.array(
    z.object({ time: z.string(), event: z.string(), detail: z.string().optional() }),
  ),
  supportMessages: z.array(
    z.object({ sender: z.enum(['user', 'support']), text: z.string(), time: z.string() }),
  ),
  escalationLevel: z.number().int().min(1).max(4),
});

export const disputesResponseSchema = z.object({
  items: z.array(disputeSchema),
  total: z.number().int().nonnegative(),
});

export const dashboardResponseSchema = z.object({
  stats: z.object({
    totalOrders: z.number().int().nonnegative(),
    completedOrders: z.number().int().nonnegative(),
    cancelledOrders: z.number().int().nonnegative(),
    disputedOrders: z.number().int().nonnegative(),
    completionRate: z.number().min(0).max(100),
    avgCompletionTime: z.string(),
    totalVolume7d: z.number().nonnegative(),
    totalVolume30d: z.number().nonnegative(),
    totalVolumeAll: z.number().nonnegative(),
    buyVolume30d: z.number().nonnegative(),
    sellVolume30d: z.number().nonnegative(),
    spreadRevenue30d: z.number().nonnegative(),
    avgOrderSize: z.number().nonnegative(),
    uniqueCounterparties: z.number().int().nonnegative(),
    repeatCustomerRate: z.number().min(0).max(100),
    avgRatingGiven: z.number().min(0).max(5),
    avgRatingReceived: z.number().min(0).max(5),
    positiveReviewRate: z.number().min(0).max(100),
    responseTimeAvg: z.string(),
    platformAvgCompletionRate: z.number().min(0).max(100),
    platformAvgResponseTime: z.string(),
  }),
  ordersByMonth: z.array(z.object({ month: z.string(), buy: z.number(), sell: z.number() })),
  volumeByWeek: z.array(z.object({ week: z.string(), volume: z.number().nonnegative() })),
  assetDistribution: z.array(
    z.object({
      asset: z.string(),
      percentage: z.number().min(0).max(100),
      volume: z.number().nonnegative(),
    }),
  ),
  topMerchants: z.array(
    z.object({
      name: z.string(),
      id: z.string(),
      trades: z.number().int().nonnegative(),
      volume: z.number().nonnegative(),
      rating: z.number().min(0).max(5),
    }),
  ),
  recentActivity: z.array(
    z.object({
      date: z.string(),
      type: z.string(),
      asset: z.string(),
      amount: z.number(),
      total: z.number(),
      merchant: z.string(),
      status: z.string(),
    }),
  ),
});

export const blacklistEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  username: z.string().min(1),
  reason: z.enum(['scam', 'unresponsive', 'fake_payment', 'harassment', 'other']),
  reasonText: z.string().optional(),
  blockedAt: z.string(),
  orderId: z.string().optional(),
  tradesBefore: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(100),
  isVerified: z.boolean(),
  badge: z.enum(['elite', 'pro']).optional(),
});

export const blacklistResponseSchema = z.object({
  items: z.array(blacklistEntrySchema),
  total: z.number().int().nonnegative(),
});

export const reviewSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  fromUser: z.string(),
  fromUserId: z.string().min(1),
  toUser: z.string(),
  toUserId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: z.string(),
  reply: z.string().optional(),
  replyAt: z.string().optional(),
  type: z.enum(['positive', 'negative']),
});

export const reviewsResponseSchema = z.object({
  items: z.array(reviewSchema),
  total: z.number().int().nonnegative(),
  averageRating: z.number().min(0).max(5),
  positiveCount: z.number().int().nonnegative(),
  negativeCount: z.number().int().nonnegative(),
});

export const adAnalyticsSchema = z.object({
  adId: z.string().min(1),
  impressions: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  ordersCreated: z.number().int().nonnegative(),
  ordersCompleted: z.number().int().nonnegative(),
  ordersDisputed: z.number().int().nonnegative(),
  ordersCancelled: z.number().int().nonnegative(),
  totalVolume: z.number().nonnegative(),
  totalRevenue: z.number().nonnegative(),
  avgOrderValue: z.number().nonnegative(),
  avgResponseTime: z.number().nonnegative(),
  avgCompletionTime: z.number().nonnegative(),
  conversionRate: z.number().min(0).max(100),
  completionRate: z.number().min(0).max(100),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().int().nonnegative(),
  ranking: z.number().int().positive(),
  totalActiveAds: z.number().int().nonnegative(),
  dailyPerformance: z.array(
    z.object({
      date: z.string(),
      impressions: z.number().int().nonnegative(),
      orders: z.number().int().nonnegative(),
      volume: z.number().nonnegative(),
    }),
  ),
  hourlyHeatmap: z.array(
    z.object({ hour: z.number().int().min(0).max(23), orders: z.number().int().nonnegative() }),
  ),
  paymentBreakdown: z.array(
    z.object({
      method: z.string(),
      count: z.number().int().nonnegative(),
      volume: z.number().nonnegative(),
    }),
  ),
  competitorComparison: z.array(
    z.object({ metric: z.string(), yours: z.number(), avg: z.number(), top: z.number() }),
  ),
});

export const merchantProfileSchema = z.object({
  merchant: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    avatar: z.string().optional(),
    level: z.number().int().nonnegative(),
    kycVerified: z.boolean(),
    joinDate: z.string(),
    totalTrades: z.number().int().nonnegative(),
    totalTrades30d: z.number().int().nonnegative(),
    completionRate: z.number().min(0).max(100),
    avgReleaseTime: z.string(),
    avgPayTime: z.string(),
    totalVolume30d: z.number().nonnegative(),
    isOnline: z.boolean(),
    lastActive: z.string(),
    positiveRate: z.number().min(0).max(100),
    negativeCount: z.number().int().nonnegative(),
    activeAds: z.number().int().nonnegative(),
  }),
  ads: z.array(adSchema),
  reviews: z.array(reviewSchema),
});

export const reportReceiptSchema = z.object({
  reportId: z.string().min(1),
  status: z.literal('submitted'),
  createdAt: z.string(),
});
