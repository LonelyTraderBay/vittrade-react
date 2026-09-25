export type PredictionOutcome = {
  label: string;
  chance: number;
  color: string;
};

export type PredictionEvent = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  outcomes: PredictionOutcome[];
  volume24h: number;
  totalVolume: number;
  endDate: string;
  liquidity: number;
  participants: number;
  status: 'active' | 'resolved';
  resolvedOutcome?: string;
  isNew?: boolean;
  isTrending?: boolean;
  change24h: number;
  createdAt: string;
};

export type PredictionPosition = {
  id: string;
  eventId: string;
  outcome: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  status: 'open' | 'won' | 'lost';
  purchasedAt: string;
};

export type PredictionReward = {
  id: string;
  eventId: string;
  category: string;
  maxSpread: number;
  minShares: number;
  dailyReward: number;
  earningsPct: number;
  priceChange24h: number;
  isFavorite?: boolean;
};

export type LeaderboardTrader = {
  rank: number;
  user: string;
  avatar: string;
  pnl: number;
  pnlPct: number;
  volume: number;
  trades: number;
  winRate: number;
  biggestWin?: number;
  biggestWinMarket?: string;
};

export type PredictionActivity = {
  id: string;
  user: string;
  avatar: string;
  action: 'bought' | 'sold';
  outcome: string;
  eventId: string;
  price: number;
  amount: number;
  shares: number;
  timestamp: string;
};

export type PredictionOrderStatus =
  'submitted' | 'accepted' | 'partially_filled' | 'filled' | 'canceled' | 'rejected';

export type PredictionOrderReceipt = {
  id: string;
  eventId: string;
  eventTitle: string;
  outcome: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  shares: number;
  filledShares: number;
  price: number;
  avgPrice: number;
  total: number;
  fee: number;
  status: PredictionOrderStatus;
  createdAt: string;
  updatedAt: string;
  timeline: { label: string; date: string; done: boolean }[];
};

export type PredictionEventsQuery = {
  category?: string;
  search?: string;
  status?: 'active' | 'resolved';
};

export type PlacePredictionOrderRequest = {
  eventId: string;
  outcome: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  shares: number;
  price?: number;
};
