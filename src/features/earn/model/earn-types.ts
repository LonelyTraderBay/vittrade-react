export type EarnDomain = 'savings' | 'staking';
export type EarnProductType = 'flexible' | 'fixed' | 'defi';
export type EarnRiskLevel = 'low' | 'medium' | 'high';
export type EarnTransactionOperation = 'subscribe' | 'redeem';
export type EarnTransactionStatus = 'pending' | 'completed' | 'failed';

export interface EarnProduct {
  id: string;
  domain: EarnDomain;
  type: EarnProductType;
  name: string;
  asset: string;
  apy: number;
  apyBoost?: number;
  minAmount: number;
  remainingQuota: string;
  participants: number;
  totalStaked: string;
  lockDays?: number;
  color: string;
  riskLevel: EarnRiskLevel;
  isHot?: boolean;
  isNew?: boolean;
}

export interface EarnPosition {
  id: string;
  productId: string;
  product: string;
  asset: string;
  amount: number;
  earned: number;
  apy: number;
  startDate: string;
  endDate?: string;
  type: EarnProductType;
  color: string;
  riskLevel: EarnRiskLevel;
  lockDays?: number;
}

export interface EarnSummary {
  totalDepositedUsd: number;
  totalEarnedUsd: number;
  averageApy: number;
  activePositions: number;
}

export interface EarnSnapshot {
  products: EarnProduct[];
  positions: EarnPosition[];
  balances: Record<string, number>;
  summary: EarnSummary;
}

export interface CreateEarnPositionRequest {
  productId: string;
  amount: number;
}

export interface RedeemEarnPositionRequest {
  positionId: string;
  amount: number;
}

export interface EarnReceipt {
  id: string;
  operation: 'subscribe' | 'redeem';
  productId: string;
  positionId?: string;
  asset: string;
  amount: number;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface EarnTransaction {
  id: string;
  domain: EarnDomain;
  operation: EarnTransactionOperation;
  productId: string;
  product: string;
  asset: string;
  amount: number;
  status: EarnTransactionStatus;
  createdAt: string;
}

export interface EarnTransactionPage {
  items: EarnTransaction[];
  nextCursor?: string;
}
