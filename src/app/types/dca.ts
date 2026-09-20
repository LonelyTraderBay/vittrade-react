/**
 * DCA (Dollar Cost Averaging) Type Definitions
 * 
 * @module types/dca
 */

/**
 * DCA Frequency Options
 */
export type DCAFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * DCA Plan Status
 */
export type DCAPlanStatus = 'active' | 'paused' | 'error';

/**
 * Individual DCA Plan
 */
export interface DCAPlan {
  /** Unique plan ID */
  id: string;
  /** Coin symbol (e.g., "BTC", "ETH") */
  coinSymbol: string;
  /** Coin name (e.g., "Bitcoin") */
  coinName: string;
  /** Coin icon URL */
  coinIcon: string;
  /** Purchase frequency */
  frequency: DCAFrequency;
  /** Amount per purchase (VND) */
  amountPerPurchase: number;
  /** Next execution timestamp */
  nextExecution: Date;
  /** Plan status */
  status: DCAPlanStatus;
  /** Total invested so far (VND) */
  totalInvested: number;
  /** Current holdings (coin amount) */
  currentHoldings: number;
  /** Average cost per coin (VND) */
  averageCost: number;
  /** Created date */
  createdAt: Date;
  /** Last purchase date (if any) */
  lastPurchaseAt?: Date;
}

/**
 * DCA Purchase History Entry
 */
export interface DCAPurchaseHistory {
  /** Purchase ID */
  id: string;
  /** Plan ID */
  planId: string;
  /** Coin symbol */
  coinSymbol: string;
  /** Purchase date */
  date: Date;
  /** Amount spent (VND) */
  amountVND: number;
  /** Coin amount purchased */
  coinAmount: number;
  /** Price at purchase (VND per coin) */
  pricePerCoin: number;
  /** Transaction status */
  status: 'completed' | 'failed';
}

/**
 * DCA Overview Summary (for DCAOverviewCard)
 */
export interface DCAOverview {
  /** Current total portfolio value (VND) */
  currentValue: number;
  /** Total amount invested (VND) */
  totalInvested: number;
  /** Profit/Loss (VND) */
  profitLoss: number;
  /** Profit/Loss percentage */
  profitLossPercent: number;
  /** Number of active plans */
  activePlans: number;
  /** Number of paused plans */
  pausedPlans: number;
  /** Number of error plans */
  errorPlans: number;
  /** Next scheduled execution */
  nextExecution: {
    relativeTime: string;
    amount: number;
  } | null;
}

/**
 * DCA Portfolio History (for chart)
 */
export interface DCAPortfolioHistoryPoint {
  /** Date */
  date: Date;
  /** Portfolio value at this date (VND) */
  portfolioValue: number;
  /** Total invested at this date (VND) */
  totalInvested: number;
  /** Was there a purchase on this date? */
  hasPurchase: boolean;
}

/**
 * Create DCA Plan Request
 */
export interface CreateDCAPlanRequest {
  coinSymbol: string;
  frequency: DCAFrequency;
  amountPerPurchase: number;
  startDate?: Date; // Default: today
}

/**
 * Update DCA Plan Request
 */
export interface UpdateDCAPlanRequest {
  amountPerPurchase?: number;
  frequency?: DCAFrequency;
  status?: DCAPlanStatus;
}
