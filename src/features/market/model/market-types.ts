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

export type MarketNewsCategory = 'market' | 'macro' | 'regulation' | 'project';
export type MarketNewsSentiment = 'bullish' | 'neutral' | 'bearish';

export interface MarketNewsQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  category?: MarketNewsCategory;
  sentiment?: MarketNewsSentiment;
  limit?: number;
}

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  category: MarketNewsCategory;
  sentiment: MarketNewsSentiment;
  source: string;
  articleUrl: string;
  publishedAt: string;
  relatedPairs: Array<{ pairId: string; symbol: string }>;
  isBreaking: boolean;
}

export interface MarketNewsResponse {
  items: MarketNewsItem[];
  updatedAt: string;
}

export type MarketCalendarEventType =
  | 'unlock'
  | 'upgrade'
  | 'halving'
  | 'airdrop'
  | 'listing'
  | 'fork'
  | 'burn'
  | 'conference'
  | 'report';
export type MarketEventImpact = 'high' | 'medium' | 'low';

export interface MarketCalendarQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  type?: MarketCalendarEventType;
  impact?: MarketEventImpact;
}

export interface MarketCalendarEvent {
  id: string;
  title: string;
  type: MarketCalendarEventType;
  eventAt: string;
  symbol?: string;
  impact: MarketEventImpact;
  description: string;
  sourceUrl?: string;
  confirmed: boolean;
}

export interface MarketCalendarResponse {
  items: MarketCalendarEvent[];
  updatedAt: string;
}

export type MarketCorrelationWindow = '7d' | '30d' | '90d';

export interface MarketCorrelationsQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  window: MarketCorrelationWindow;
}

export interface MarketCorrelationPair {
  assetA: string;
  assetB: string;
  coefficient: number;
  observations: number;
}

export interface MarketCorrelationsResponse {
  window: MarketCorrelationWindow;
  method: 'pearson' | 'spearman';
  provider: string;
  items: MarketCorrelationPair[];
  updatedAt: string;
}

export type MarketUnlockWindow = MarketCorrelationWindow;
export type MarketUnlockCategory = 'team' | 'investor' | 'ecosystem' | 'community' | 'foundation';
export type MarketUnlockScheduleType = 'cliff' | 'linear' | 'milestone';
export type MarketUnlockStatus = 'confirmed' | 'estimated';

export interface MarketUnlocksQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  window: MarketUnlockWindow;
  category?: MarketUnlockCategory;
}

export interface MarketTokenUnlock {
  id: string;
  symbol: string;
  name: string;
  eventAt: string;
  amount: number;
  circulatingSupplyPercent: number;
  category: MarketUnlockCategory;
  scheduleType: MarketUnlockScheduleType;
  status: MarketUnlockStatus;
  sourceUrl: string;
}

export interface MarketTokenUnlocksResponse {
  window: MarketUnlockWindow;
  provider: string;
  items: MarketTokenUnlock[];
  updatedAt: string;
}

export interface MarketDerivativesStats {
  totalOpenInterest: number;
  openInterestChange24h: number;
  totalVolume24h: number;
  volumeChange24h: number;
  totalLiquidations24h: number;
  longLiquidations24h: number;
  shortLiquidations24h: number;
  averageFundingRate8h: number;
  btcLongShortRatio: number;
}

export interface MarketDerivativePair {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  fundingRate: number;
  openInterest: number;
  openInterestChange24h: number;
  volume24h: number;
  longSharePercent: number;
  liquidations24h: { long: number; short: number };
}

export interface MarketLiquidationBucket {
  bucketAt: string;
  long: number;
  short: number;
}

export interface MarketDerivativesResponse {
  provider: string;
  updatedAt: string;
  stats: MarketDerivativesStats;
  pairs: MarketDerivativePair[];
  liquidationHistory: MarketLiquidationBucket[];
}

export type MarketSentimentWindow = '24h' | '7d' | '30d';
export type MarketSentimentLabel = 'bullish' | 'neutral' | 'bearish';

export interface MarketSentimentQuery extends Record<
  string,
  string | number | boolean | null | undefined
> {
  window: MarketSentimentWindow;
}

export interface MarketSentimentShare {
  bullish: number;
  neutral: number;
  bearish: number;
}

export interface MarketSentimentToken {
  id: string;
  symbol: string;
  name: string;
  score: number;
  sentiment: MarketSentimentLabel;
  mentions24h: number;
  mentionsChange24h: number;
  sentimentSharePercent: MarketSentimentShare;
  trendingRank?: number;
  topTopics: string[];
}

export interface MarketSentimentResponse {
  window: MarketSentimentWindow;
  provider: string;
  updatedAt: string;
  overall: {
    score: number;
    sentiment: MarketSentimentLabel;
    totalMentions24h: number;
    mentionsChange24h: number;
    trendingTokenCount: number;
    socialDominance: { btcPercent: number; ethPercent: number; otherPercent: number };
  };
  timeline: Array<{ at: string; score: number; mentions: number }>;
  tokens: MarketSentimentToken[];
  trendingTopics: Array<{ topic: string; mentions24h: number; change24h: number }>;
}

export type MarketSignalDirection = 'long' | 'short';
export type MarketSignalCategory = 'scalp' | 'swing' | 'position';
export type MarketSignalStatus = 'active' | 'closed' | 'expired';

export interface MarketSignal {
  id: string;
  providerName: string;
  symbol: string;
  direction: MarketSignalDirection;
  category: MarketSignalCategory;
  status: MarketSignalStatus;
  publishedAt: string;
  expiresAt?: string;
  rationale: string;
  sourceUrl: string;
}

export interface MarketSignalsResponse {
  provider: string;
  updatedAt: string;
  items: MarketSignal[];
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
