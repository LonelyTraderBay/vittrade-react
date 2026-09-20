/**
 * ══════════════════════════════════════════════════════════
 *  P2P TYPES — Peer-to-Peer Trading Module
 * ══════════════════════════════════════════════════════════
 *
 *  Types for P2P marketplace: ads, orders, escrow, disputes.
 *  Following Guidelines.md: High-risk flow with clear status.
 */

/* ─── P2P Ad (Offer) ─── */

export type P2PAdType = 'buy' | 'sell';
export type P2PAdStatus = 'active' | 'paused' | 'inactive' | 'deleted';

export interface P2PAd {
  id: string;
  merchantId: string;
  merchantName: string;
  merchantAvatar?: string;
  
  // Ad Details
  type: P2PAdType;
  asset: string;               // e.g., "BTC"
  fiatCurrency: string;        // e.g., "VND"
  price: number;
  availableAmount: number;
  minOrderAmount: number;
  maxOrderAmount: number;
  
  // Payment
  paymentMethods: P2PPaymentMethod[];
  paymentTimeLimit: number;    // minutes
  
  // Terms
  terms?: string;
  autoReply?: string;
  
  // Stats
  completedOrders: number;
  completionRate: number;
  avgReleaseTime: number;      // minutes
  
  // Status
  status: P2PAdStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── P2P Payment Method ─── */

export type PaymentMethodType = 
  | 'bank_transfer' 
  | 'momo' 
  | 'zalopay' 
  | 'viettel_pay' 
  | 'viettelpay'
  | 'paypal' 
  | 'cash';

export interface P2PPaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  qrCode?: string;
  verified: boolean;
}

/* ─── P2P Order ─── */

export type P2POrderStatus = 
  | 'created'
  | 'pending_payment' 
  | 'payment_sent' 
  | 'confirming' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed' 
  | 'refunded';

export interface P2POrder {
  id: string;
  adId: string;
  
  // Parties
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  merchantId: string;          // ad owner
  
  // Order Details
  asset: string;
  fiatCurrency: string;
  amount: number;              // crypto amount
  price: number;               // fiat price per unit
  totalPrice: number;          // total fiat amount
  fee: number;
  
  // Payment
  paymentMethod: P2PPaymentMethod;
  paymentTimeLimit: number;
  paymentDeadline: Date;
  paymentProof?: string[];
  
  // Status
  status: P2POrderStatus;
  
  // Timeline
  createdAt: Date;
  paymentSentAt?: Date;
  releasedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Escrow
  escrowStatus: 'pending' | 'locked' | 'released' | 'refunded';
  
  // Chat
  lastMessageAt?: Date;
  unreadCount?: number;
}

/* ─── P2P Order Room (Chat) ─── */

export interface P2PMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'system';
  timestamp: Date;
  read: boolean;
}

/* ─── P2P Dispute ─── */

export type DisputeReason = 
  | 'payment_not_received' 
  | 'wrong_amount' 
  | 'scam_attempt' 
  | 'unresponsive' 
  | 'other';

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'escalated';

export interface P2PDispute {
  id: string;
  orderId: string;
  reporterId: string;
  reporterName: string;
  reportedId: string;
  reportedName: string;
  
  // Dispute Details
  reason: DisputeReason;
  description: string;
  evidence: string[];          // image URLs
  
  // Status
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  
  // Timeline
  createdAt: Date;
  resolvedAt?: Date;
}

/* ─── P2P Merchant Profile ─── */

export interface MerchantProfile {
  userId: string;
  username: string;
  avatar?: string;
  
  // Verification
  kycLevel: 'none' | 'basic' | 'advanced';
  verificationBadges: string[];
  
  // Stats
  totalTrades: number;
  completedTrades: number;
  completionRate: number;
  avgReleaseTime: number;
  firstTradeDate: Date;
  
  // Ratings
  positiveRating: number;
  neutralRating: number;
  negativeRating: number;
  overallRating: number;
  
  // Activity
  lastSeenAt: Date;
  isOnline: boolean;
  avgResponseTime: number;     // minutes
  
  // Limits
  dailyTradeLimit: number;
  remainingDailyLimit: number;
}

/* ─── P2P Review ─── */

export type ReviewType = 'positive' | 'neutral' | 'negative';

export interface P2PReview {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewerName: string;
  reviewedId: string;
  reviewedName: string;
  type: ReviewType;
  comment?: string;
  createdAt: Date;
}

/* ─── P2P Filters ─── */

export interface P2PFilter {
  type?: P2PAdType;
  asset?: string;
  fiatCurrency?: string;
  paymentMethods?: PaymentMethodType[];
  minAmount?: number;
  maxAmount?: number;
  verifiedOnly?: boolean;
  sortBy?: 'price' | 'completion_rate' | 'trades';
  sortDirection?: 'asc' | 'desc';
}

/* ─── P2P Stats ─── */

export interface P2PMarketStats {
  asset: string;
  fiatCurrency: string;
  avgBuyPrice: number;
  avgSellPrice: number;
  spread: number;
  volume24h: number;
  activeAds: number;
  completedOrders24h: number;
  updatedAt: Date;
}

/* ─── P2P Insurance Fund ─── */

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface InsuranceClaim {
  id: string;
  orderId: string;
  claimantId: string;
  amount: number;
  reason: string;
  evidence: string[];
  status: ClaimStatus;
  reviewedBy?: string;
  reviewNote?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  paidAt?: Date;
}

export interface InsuranceFundStats {
  totalFund: number;
  activeClaims: number;
  totalClaimed: number;
  totalPaid: number;
  claimSuccessRate: number;
  avgClaimAmount: number;
  updatedAt: Date;
}
