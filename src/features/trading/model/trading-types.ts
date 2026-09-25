export type OrderSide = 'buy' | 'sell';

export type OrderType = 'market' | 'limit' | 'stop' | 'stop-limit' | 'trailing' | 'oco' | 'bracket';

export type OrderStatus = 'open' | 'filled' | 'partial' | 'cancelled' | 'rejected';

export interface TradingOrder {
  id: string;
  clientOrderId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  amount: number;
  filled: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  fee: number;
  tpPrice?: number;
  slPrice?: number;
  bracketMode?: boolean;
  ocoLinked?: boolean;
}

export interface OrderListQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  symbol?: string;
  status?: OrderStatus;
  cursor?: string;
  limit?: number;
}

export interface OrderListResponse {
  items: TradingOrder[];
  nextCursor?: string;
}

export interface PlaceOrderRequest {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  price?: number;
  clientOrderId?: string;
  tpPrice?: number;
  slPrice?: number;
  tpAmount?: number;
  slAmount?: number;
  amountType?: 'same' | 'split';
  idempotencyKey: string;
}

export interface ModifyOrderRequest {
  price?: number;
  amount?: number;
  idempotencyKey: string;
}

export type CopyTraderRisk = 'low' | 'medium' | 'high';
export type CopyProviderSort = 'roi' | 'sharpe' | 'followers' | 'recent' | 'aum';

export interface CopyTrader {
  id: string;
  name: string;
  avatar: string;
  winRate: number;
  totalPnl: number;
  totalPnlPct: number;
  aum: number;
  copiers: number;
  maxCopiers: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  avgHoldingTime: string;
  weeklyPnl: number[];
  tags: string[];
  isFollowing: boolean;
  riskLevel: CopyTraderRisk;
  verified: boolean;
}

export interface CopyProvidersQuery extends Record<string, string | boolean | undefined> {
  risk?: CopyTraderRisk;
  verified?: boolean;
  sort?: CopyProviderSort;
}

export interface CopyProvidersResponse {
  items: CopyTrader[];
}

export interface CopyProviderTrade {
  id: string;
  pair: string;
  side: 'long' | 'short';
  entry: number;
  exit?: number;
  pnl: number;
  pnlPct: number;
  time: string;
  status: 'open' | 'closed';
}

export interface CopyProviderProfileResponse {
  provider: CopyTrader;
  pnlHistory: { day: string; pnl: number; cumPnl: number }[];
  recentTrades: CopyProviderTrade[];
}

export type CopyMode = 'mirror' | 'fixed' | 'smart';
export type CopyPositionSizing = 'percentage' | 'fixed';
export type CopyRelationshipStatus = 'active' | 'paused' | 'cooling-off' | 'stopped';

export interface CopyConfigurationRequest {
  providerId: string;
  capital: number;
  copyMode: CopyMode;
  positionSizing: CopyPositionSizing;
  copyRatio?: number;
  customStopLoss?: number;
  customTakeProfit?: number;
  trailingStopPercent?: number;
}

export interface CopyRelationship {
  id: string;
  provider: CopyTrader;
  status: CopyRelationshipStatus;
  copyMode: CopyMode;
  positionSizing: CopyPositionSizing;
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
  performanceHistory: { date: string; value: number }[];
}

export interface CopyRelationshipsResponse {
  items: CopyRelationship[];
}

export interface CopyActivationReceipt {
  copyId: string;
  status: Extract<CopyRelationshipStatus, 'active' | 'cooling-off'>;
  coolingOffUntil?: string;
}

export interface StopCopyRequest {
  reason: string;
  closeOpenPositions: boolean;
}
