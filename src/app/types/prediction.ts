/**
 * ══════════════════════════════════════════════════════════
 *  PREDICTION MARKETS TYPES
 * ══════════════════════════════════════════════════════════
 *
 *  Types for market-based prediction module.
 *  Following Guidelines.md: This is VALUE-based, not points.
 */

/* ─── Prediction Event ─── */

export type PredictionEventStatus = 'upcoming' | 'trading' | 'closed' | 'settling' | 'settled' | 'void';
export type PredictionCategory = 
  | 'crypto' 
  | 'macro' 
  | 'politics' 
  | 'sports' 
  | 'tech' 
  | 'ai' 
  | 'culture';

export interface PredictionEvent {
  id: string;
  title: string;
  description: string;
  category: PredictionCategory;
  status: PredictionEventStatus;
  
  // Outcomes
  outcomes: PredictionOutcome[];
  
  // Market Info
  totalVolume: number;
  totalShares: number;
  liquidity: number;
  
  // Timeline
  createdAt: Date;
  tradingStartsAt: Date;
  tradingEndsAt: Date;
  resolutionDate: Date;
  settledAt?: Date;
  
  // Resolution
  resolutionSource: string;
  winningOutcomeId?: string;
  
  // Engagement
  totalTrades: number;
  uniqueTraders: number;
  commentCount: number;
}

/* ─── Prediction Outcome ─── */

export interface PredictionOutcome {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  probability: number;         // 0-100
  totalShares: number;
  lastPrice: number;
  change24h: number;
  isWinner?: boolean;
}

/* ─── Prediction Order ─── */

export type PredictionOrderSide = 'buy' | 'sell';
export type PredictionOrderType = 'market' | 'limit';
export type PredictionOrderStatus = 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'expired';

export interface PredictionOrder {
  id: string;
  eventId: string;
  outcomeId: string;
  userId: string;
  side: PredictionOrderSide;
  type: PredictionOrderType;
  status: PredictionOrderStatus;
  
  // Order Details
  shares: number;
  filledShares: number;
  price?: number;              // for limit orders
  averagePrice?: number;
  totalCost?: number;
  
  // Fees
  fee: number;
  feePercentage: number;
  
  // Timeline
  createdAt: Date;
  updatedAt: Date;
  filledAt?: Date;
  expiresAt?: Date;
}

export interface CreatePredictionOrderParams {
  eventId: string;
  outcomeId: string;
  side: PredictionOrderSide;
  type: PredictionOrderType;
  shares: number;
  price?: number;              // required for limit orders
}

/* ─── Prediction Position ─── */

export interface PredictionPosition {
  id: string;
  eventId: string;
  outcomeId: string;
  userId: string;
  
  // Holdings
  shares: number;
  averagePrice: number;
  totalCost: number;
  currentValue: number;
  
  // Performance
  pnl: number;
  pnlPercentage: number;
  
  // Status
  isSettled: boolean;
  payout?: number;
  
  // Timeline
  openedAt: Date;
  closedAt?: Date;
  settledAt?: Date;
}

/* ─── Prediction Portfolio ─── */

export interface PredictionPortfolio {
  userId: string;
  totalValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  activePositions: number;
  settledPositions: number;
  positions: PredictionPosition[];
  updatedAt: Date;
}

/* ─── Prediction Trade History ─── */

export interface PredictionTrade {
  id: string;
  orderId: string;
  eventId: string;
  outcomeId: string;
  userId: string;
  side: PredictionOrderSide;
  shares: number;
  price: number;
  total: number;
  fee: number;
  timestamp: Date;
}

/* ─── Prediction Market Data ─── */

export interface PredictionMarketData {
  eventId: string;
  outcomeId: string;
  currentPrice: number;
  probability: number;
  volume24h: number;
  change24h: number;
  high24h: number;
  low24h: number;
  liquidity: number;
  spread: number;
  timestamp: number;
}

export interface PredictionOrderbook {
  eventId: string;
  outcomeId: string;
  bids: PredictionOrderbookEntry[];
  asks: PredictionOrderbookEntry[];
  timestamp: number;
}

export interface PredictionOrderbookEntry {
  price: number;
  shares: number;
  total: number;
}

/* ─── Prediction Resolution ─── */

export type ResolutionSource = 'api' | 'oracle' | 'manual' | 'consensus';

export interface PredictionResolution {
  eventId: string;
  winningOutcomeId: string;
  source: ResolutionSource;
  evidence?: string;
  resolvedBy?: string;
  resolvedAt: Date;
  disputeCount: number;
  isFinal: boolean;
}

/* ─── Prediction Rewards ─── */

export type RewardType = 'trading_fee_rebate' | 'liquidity_mining' | 'leaderboard' | 'referral' | 'bonus';

export interface PredictionReward {
  id: string;
  userId: string;
  type: RewardType;
  amount: number;
  currency: string;           // e.g., "USDT"
  eventId?: string;
  reason: string;
  claimedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

/* ─── Prediction Leaderboard ─── */

export type PredictionLeaderboardMetric = 'pnl' | 'volume' | 'accuracy' | 'roi';

export interface PredictionLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  metric: PredictionLeaderboardMetric;
  value: number;
  totalTrades: number;
  winRate?: number;
  avgReturn?: number;
}

/* ─── Prediction Activity ─── */

export type ActivityType = 
  | 'order_placed' 
  | 'order_filled' 
  | 'position_opened' 
  | 'position_closed' 
  | 'event_created' 
  | 'event_settled';

export interface PredictionActivity {
  id: string;
  type: ActivityType;
  userId: string;
  username: string;
  eventId: string;
  eventTitle: string;
  outcomeId?: string;
  outcomeName?: string;
  details: string;
  amount?: number;
  timestamp: Date;
}

/* ─── Prediction Comments ─── */

export interface PredictionComment {
  id: string;
  eventId: string;
  userId: string;
  username: string;
  avatar?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  createdAt: Date;
  editedAt?: Date;
}
