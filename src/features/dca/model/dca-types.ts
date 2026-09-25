export type DCAFrequency = 'daily' | 'weekly' | 'monthly';
export type DCAPlanStatus = 'active' | 'paused' | 'error';

export interface DCAPlan {
  id: string;
  coinSymbol: string;
  coinName: string;
  coinIcon: string;
  frequency: DCAFrequency;
  amountPerPurchase: number;
  nextExecution: Date;
  status: DCAPlanStatus;
  totalInvested: number;
  currentHoldings: number;
  averageCost: number;
  createdAt: Date;
  lastPurchaseAt?: Date;
}

export interface DCAPurchaseHistory {
  id: string;
  planId: string;
  coinSymbol: string;
  date: Date;
  amountVND: number;
  coinAmount: number;
  pricePerCoin: number;
  status: 'completed' | 'failed';
}

export interface DCAOverview {
  currentValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercent: number;
  activePlans: number;
  pausedPlans: number;
  errorPlans: number;
  nextExecution: { relativeTime: string; amount: number } | null;
}

export interface DCAPortfolioHistoryPoint {
  date: Date;
  portfolioValue: number;
  totalInvested: number;
  hasPurchase: boolean;
}

export interface CreateDCAPlanRequest {
  coinSymbol: string;
  frequency: DCAFrequency;
  amountPerPurchase: number;
  startDate?: Date;
}

export interface UpdateDCAPlanRequest {
  amountPerPurchase?: number;
  frequency?: DCAFrequency;
  status?: DCAPlanStatus;
}

export interface DCASnapshot {
  overview: DCAOverview;
  plans: DCAPlan[];
  purchaseHistory: DCAPurchaseHistory[];
  portfolioHistory: DCAPortfolioHistoryPoint[];
}
