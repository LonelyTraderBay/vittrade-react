export interface MarketPair {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  prevPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  sparklineData: number[];
  logoColor: string;
  category: string;
}

export interface MarketPairsQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  search?: string;
  category?: string;
  cursor?: string;
  limit?: number;
}

export interface MarketPairsResponse {
  items: MarketPair[];
  nextCursor?: string;
}

export interface MarketWatchlistItem {
  id: string;
  pairId: string;
  addedAt: string;
  note?: string;
}

export interface MarketWatchlistResponse {
  items: MarketWatchlistItem[];
}

export interface MarketWatchlistUpdateRequest {
  note?: string;
}

export interface MarketWatchlistCreateRequest {
  pairId: string;
  note?: string;
}

export interface MarketOrderBookEntry {
  price: number;
  amount: number;
  total: number;
  depth: number;
}

export interface MarketOrderBookResponse {
  bids: MarketOrderBookEntry[];
  asks: MarketOrderBookEntry[];
  updatedAt: string;
}

export interface MarketRecentTrade {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  time: string;
}

export interface MarketRecentTradesResponse {
  items: MarketRecentTrade[];
}

export type MarketCandleInterval = '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface MarketCandlesQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  interval: MarketCandleInterval;
  limit?: number;
}

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketCandlesResponse {
  items: MarketCandle[];
  updatedAt: string;
}

export interface MarketOverviewStats {
  totalMarketCap: number;
  totalMarketCapChange24h: number;
  total24hVolume: number;
  total24hVolumeChange: number;
  btcDominance: number;
  ethDominance: number;
  totalCoins: number;
  totalExchanges: number;
  fearGreedIndex: number;
  fearGreedLabel: string;
  activeCryptocurrencies: number;
  defiTVL: number;
  defiTVLChange24h: number;
  stablecoinVolume24h: number;
}

export interface MarketOverviewBreadth {
  advancing: number;
  declining: number;
  unchanged: number;
  newATH: number;
  dropping10Pct: number;
}

export interface MarketFearGreedPoint {
  date: string;
  value: number;
  label: string;
}

export interface MarketSectorSummary {
  id: string;
  name: string;
  nameVi: string;
  color: string;
  icon: string;
  totalMarketCap: number;
  change24h: number;
  change7d: number;
  change30d: number;
  volume24h: number;
  topCoins: string[];
  coinCount: number;
  dominance: number;
}

export interface MarketMoverSummary {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  category: string;
  color: string;
  sparkline: number[];
  isNew?: boolean;
  listingDate?: string;
}

export interface MarketOverviewResponse {
  stats: MarketOverviewStats;
  breadth: MarketOverviewBreadth;
  fearGreedHistory: MarketFearGreedPoint[];
  sectors: MarketSectorSummary[];
  topGainers: MarketMoverSummary[];
  topLosers: MarketMoverSummary[];
  updatedAt: string;
}

export type MarketMoverTimeframe = '1h' | '24h' | '7d';
export type MarketMoverView =
  'gainers' | 'losers' | 'most-active' | 'unusual-volume' | 'new-listings';

export interface MarketMoversQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  timeframe: MarketMoverTimeframe;
  view: MarketMoverView;
  category?: string;
}

export interface MarketMoversResponse {
  items: MarketMoverSummary[];
  updatedAt: string;
}

export type MarketPriceAlertCondition = 'above' | 'below';
export type MarketPriceAlertFilter = 'all' | 'active' | 'triggered';

export interface MarketPriceAlert {
  id: string;
  pairId: string;
  symbol: string;
  condition: MarketPriceAlertCondition;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export interface MarketPriceAlertsQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  status?: Exclude<MarketPriceAlertFilter, 'all'>;
}

export interface MarketPriceAlertCreateRequest {
  pairId: string;
  condition: MarketPriceAlertCondition;
  targetPrice: number;
}

export interface MarketPriceAlertUpdateRequest {
  isActive: boolean;
}

export interface MarketPriceAlertsResponse {
  items: MarketPriceAlert[];
}
