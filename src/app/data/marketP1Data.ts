/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET P1 DATA — Screener, Comparison, Calendar, Derivatives
 * ══════════════════════════════════════════════════════════════════
 *  Mock data for P1 Market module features.
 */

// ─── Market Calendar Events ───────────────────────────────────
export interface MarketEvent {
  id: string;
  title: string;
  titleVi: string;
  type: 'unlock' | 'upgrade' | 'halving' | 'airdrop' | 'listing' | 'fork' | 'burn' | 'conference' | 'report';
  date: string;          // ISO
  symbol?: string;
  symbolColor?: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  source?: string;
  confirmed: boolean;
}

export const MARKET_EVENTS: MarketEvent[] = [
  {
    id: 'ev1', title: 'ARB Token Unlock', titleVi: 'Mở khóa ARB',
    type: 'unlock', date: '2026-03-12T08:00:00Z', symbol: 'ARB', symbolColor: '#28A0F0',
    impact: 'high', description: '92.65M ARB ($113.9M) mo khoa tu investor va team. Khoang 3.49% tong cung.',
    source: 'TokenUnlocks.app', confirmed: true,
  },
  {
    id: 'ev2', title: 'Ethereum Pectra Upgrade', titleVi: 'Nang cap Ethereum Pectra',
    type: 'upgrade', date: '2026-03-15T14:00:00Z', symbol: 'ETH', symbolColor: '#627EEA',
    impact: 'high', description: 'Nang cap Pectra bao gom EIP-7251 (tang staking limit), EIP-7702 (account abstraction).',
    source: 'ethereum.org', confirmed: true,
  },
  {
    id: 'ev3', title: 'PYTH Airdrop Season 2', titleVi: 'Airdrop PYTH Mua 2',
    type: 'airdrop', date: '2026-03-14T00:00:00Z', symbol: 'PYTH', symbolColor: '#6B21A8',
    impact: 'medium', description: 'Dot phat hanh airdrop thu 2 cho nguoi dung DeFi va staker.',
    source: 'pyth.network', confirmed: true,
  },
  {
    id: 'ev4', title: 'BNB Quarterly Burn', titleVi: 'Dot BNB Hang Quy',
    type: 'burn', date: '2026-03-18T12:00:00Z', symbol: 'BNB', symbolColor: '#F3BA2F',
    impact: 'medium', description: 'Dot BNB dinh ky hang quy, uoc tinh 1.5M BNB (~$618M) se bi dot.',
    source: 'bnbchain.org', confirmed: false,
  },
  {
    id: 'ev5', title: 'Solana Firedancer Mainnet', titleVi: 'Solana Firedancer Mainnet',
    type: 'upgrade', date: '2026-03-20T16:00:00Z', symbol: 'SOL', symbolColor: '#9945FF',
    impact: 'high', description: 'Client moi Firedancer ra mat chinh thuc, tang hieu suat mang len gap 10 lan.',
    source: 'solana.com', confirmed: false,
  },
  {
    id: 'ev6', title: 'MATIC Token Unlock', titleVi: 'Mo khoa MATIC',
    type: 'unlock', date: '2026-03-13T08:00:00Z', symbol: 'MATIC', symbolColor: '#8247E5',
    impact: 'medium', description: '200M MATIC (~$179M) mo khoa tu quy phat trien ecosystem.',
    source: 'TokenUnlocks.app', confirmed: true,
  },
  {
    id: 'ev7', title: 'WLD Token Listing — Coinbase', titleVi: 'WLD niem yet tren Coinbase',
    type: 'listing', date: '2026-03-11T18:00:00Z', symbol: 'WLD', symbolColor: '#1D1D1B',
    impact: 'medium', description: 'Worldcoin (WLD) se duoc list tren Coinbase voi cap WLD/USD.',
    source: 'Coinbase Blog', confirmed: true,
  },
  {
    id: 'ev8', title: 'Token2049 Dubai', titleVi: 'Hoi nghi Token2049 Dubai',
    type: 'conference', date: '2026-03-22T09:00:00Z',
    impact: 'low', description: 'Hoi nghi blockchain lon nhat khu vuc MENA, du kien 10,000+ tham du.',
    source: 'token2049.com', confirmed: true,
  },
  {
    id: 'ev9', title: 'OP Token Unlock', titleVi: 'Mo khoa OP',
    type: 'unlock', date: '2026-03-25T08:00:00Z', symbol: 'OP', symbolColor: '#FF0420',
    impact: 'high', description: '31.3M OP ($108M) mo khoa tu core contributors va investors.',
    source: 'TokenUnlocks.app', confirmed: true,
  },
  {
    id: 'ev10', title: 'Chainlink CCIP V2', titleVi: 'Chainlink CCIP V2 Launch',
    type: 'upgrade', date: '2026-03-28T14:00:00Z', symbol: 'LINK', symbolColor: '#2A5ADA',
    impact: 'medium', description: 'Cross-Chain Interoperability Protocol v2 ho tro 20+ chains.',
    source: 'chain.link', confirmed: false,
  },
  {
    id: 'ev11', title: 'CPI Report US', titleVi: 'Bao cao CPI My',
    type: 'report', date: '2026-03-12T12:30:00Z',
    impact: 'high', description: 'Bao cao chi so gia tieu dung thang 2 cua My. Du kien 3.1% YoY.',
    source: 'Bureau of Labor Statistics', confirmed: true,
  },
  {
    id: 'ev12', title: 'FOMC Meeting', titleVi: 'Hop FOMC',
    type: 'report', date: '2026-03-19T18:00:00Z',
    impact: 'high', description: 'Cuoc hop Fed quyet dinh lai suat. Thi truong du doan giu nguyen 5.25-5.50%.',
    source: 'Federal Reserve', confirmed: true,
  },
];

export const EVENT_TYPE_CONFIG: Record<MarketEvent['type'], { label: string; color: string; icon: string }> = {
  unlock: { label: 'Token Unlock', color: '#F59E0B', icon: '🔓' },
  upgrade: { label: 'Nang cap', color: '#3B82F6', icon: '⬆️' },
  halving: { label: 'Halving', color: '#8B5CF6', icon: '⚡' },
  airdrop: { label: 'Airdrop', color: '#10B981', icon: '🎁' },
  listing: { label: 'Niem yet', color: '#06B6D4', icon: '📋' },
  fork: { label: 'Fork', color: '#EF4444', icon: '🔀' },
  burn: { label: 'Dot token', color: '#F97316', icon: '🔥' },
  conference: { label: 'Hoi nghi', color: '#6366F1', icon: '🎤' },
  report: { label: 'Bao cao', color: '#64748B', icon: '📊' },
};

export const IMPACT_CONFIG: Record<MarketEvent['impact'], { label: string; color: string }> = {
  high: { label: 'Cao', color: '#EF4444' },
  medium: { label: 'Trung binh', color: '#F59E0B' },
  low: { label: 'Thap', color: '#10B981' },
};

// ─── Derivatives Overview Data ────────────────────────────────
export interface DerivativePair {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  indexPrice: number;
  markPrice: number;
  fundingRate: number;
  fundingInterval: string;
  openInterest: number;
  openInterestChange24h: number;
  volume24h: number;
  longRatio: number;
  shortRatio: number;
  liquidations24h: { long: number; short: number };
  color: string;
  maxLeverage: number;
}

export const DERIVATIVE_PAIRS: DerivativePair[] = [
  {
    id: 'btc-perp', symbol: 'BTC/USDT', name: 'Bitcoin', price: 67_589.45, change24h: 2.41,
    indexPrice: 67_543.21, markPrice: 67_567.89, fundingRate: 0.0087, fundingInterval: '8h',
    openInterest: 12_345_678_000, openInterestChange24h: 5.67, volume24h: 45_678_901_000,
    longRatio: 54.2, shortRatio: 45.8, liquidations24h: { long: 23_456_000, short: 18_901_000 },
    color: '#F7931A', maxLeverage: 125,
  },
  {
    id: 'eth-perp', symbol: 'ETH/USDT', name: 'Ethereum', price: 3_524.67, change24h: -1.12,
    indexPrice: 3_521.45, markPrice: 3_523.01, fundingRate: -0.0034, fundingInterval: '8h',
    openInterest: 6_789_012_000, openInterestChange24h: -2.34, volume24h: 18_901_234_000,
    longRatio: 47.8, shortRatio: 52.2, liquidations24h: { long: 12_345_000, short: 8_901_000 },
    color: '#627EEA', maxLeverage: 100,
  },
  {
    id: 'sol-perp', symbol: 'SOL/USDT', name: 'Solana', price: 178.89, change24h: 8.23,
    indexPrice: 178.32, markPrice: 178.56, fundingRate: 0.0156, fundingInterval: '8h',
    openInterest: 2_345_678_000, openInterestChange24h: 12.45, volume24h: 6_789_012_000,
    longRatio: 62.3, shortRatio: 37.7, liquidations24h: { long: 5_678_000, short: 15_432_000 },
    color: '#9945FF', maxLeverage: 75,
  },
  {
    id: 'bnb-perp', symbol: 'BNB/USDT', name: 'BNB', price: 413.21, change24h: 3.72,
    indexPrice: 412.87, markPrice: 413.05, fundingRate: 0.0045, fundingInterval: '8h',
    openInterest: 1_234_567_000, openInterestChange24h: 3.21, volume24h: 3_456_789_000,
    longRatio: 55.1, shortRatio: 44.9, liquidations24h: { long: 2_345_000, short: 3_456_000 },
    color: '#F3BA2F', maxLeverage: 75,
  },
  {
    id: 'xrp-perp', symbol: 'XRP/USDT', name: 'Ripple', price: 0.6245, change24h: -2.48,
    indexPrice: 0.6234, markPrice: 0.6238, fundingRate: -0.0078, fundingInterval: '8h',
    openInterest: 890_123_000, openInterestChange24h: -4.56, volume24h: 2_345_678_000,
    longRatio: 43.5, shortRatio: 56.5, liquidations24h: { long: 4_567_000, short: 1_234_000 },
    color: '#00AAE4', maxLeverage: 75,
  },
  {
    id: 'doge-perp', symbol: 'DOGE/USDT', name: 'Dogecoin', price: 0.1234, change24h: 5.67,
    indexPrice: 0.1230, markPrice: 0.1232, fundingRate: 0.0234, fundingInterval: '8h',
    openInterest: 567_890_000, openInterestChange24h: 8.90, volume24h: 1_890_123_000,
    longRatio: 67.8, shortRatio: 32.2, liquidations24h: { long: 1_234_000, short: 5_678_000 },
    color: '#C3A634', maxLeverage: 50,
  },
  {
    id: 'avax-perp', symbol: 'AVAX/USDT', name: 'Avalanche', price: 38.67, change24h: 4.89,
    indexPrice: 38.54, markPrice: 38.60, fundingRate: 0.0067, fundingInterval: '8h',
    openInterest: 456_789_000, openInterestChange24h: 6.78, volume24h: 1_234_567_000,
    longRatio: 58.4, shortRatio: 41.6, liquidations24h: { long: 890_000, short: 2_345_000 },
    color: '#E84142', maxLeverage: 50,
  },
  {
    id: 'link-perp', symbol: 'LINK/USDT', name: 'Chainlink', price: 14.28, change24h: -5.65,
    indexPrice: 14.23, markPrice: 14.25, fundingRate: -0.0123, fundingInterval: '8h',
    openInterest: 345_678_000, openInterestChange24h: -7.89, volume24h: 890_123_000,
    longRatio: 41.2, shortRatio: 58.8, liquidations24h: { long: 3_456_000, short: 678_000 },
    color: '#2A5ADA', maxLeverage: 50,
  },
];

// ─── Derivatives Global Stats ─────────────────────────────────
export interface DerivativesGlobalStats {
  totalOpenInterest: number;
  oiChange24h: number;
  totalVolume24h: number;
  volumeChange24h: number;
  totalLiquidations24h: number;
  longLiquidations24h: number;
  shortLiquidations24h: number;
  avgFundingRate: number;
  btcLongShortRatio: number;
  fearGreedDerivatives: number;
}

export const DERIVATIVES_GLOBAL_STATS: DerivativesGlobalStats = {
  totalOpenInterest: 45_678_901_000,
  oiChange24h: 3.45,
  totalVolume24h: 98_765_432_000,
  volumeChange24h: 12.34,
  totalLiquidations24h: 234_567_000,
  longLiquidations24h: 156_789_000,
  shortLiquidations24h: 77_778_000,
  avgFundingRate: 0.0065,
  btcLongShortRatio: 1.18,
  fearGreedDerivatives: 68,
};

// ─── Liquidation History ──────────────────────────────────────
export interface LiquidationPoint {
  time: string;
  long: number;
  short: number;
}

export const LIQUIDATION_HISTORY: LiquidationPoint[] = [
  { time: '00:00', long: 12_345, short: 8_901 },
  { time: '04:00', long: 8_901, short: 15_678 },
  { time: '08:00', long: 23_456, short: 5_678 },
  { time: '12:00', long: 15_678, short: 12_345 },
  { time: '16:00', long: 9_012, short: 18_901 },
  { time: '20:00', long: 18_901, short: 9_012 },
  { time: 'Hien tai', long: 15_432, short: 11_234 },
];

// ─── Screener Filter Presets ──────────────────────────────────
export interface ScreenerPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  filters: ScreenerFilters;
}

export interface ScreenerFilters {
  categories: string[];
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minVolume24h?: number;
  maxVolume24h?: number;
  minChange24h?: number;
  maxChange24h?: number;
  sortBy: 'marketCap' | 'volume' | 'change24h' | 'price';
  sortDir: 'asc' | 'desc';
}

export const SCREENER_PRESETS: ScreenerPreset[] = [
  {
    id: 'large-cap', name: 'Large Cap', description: 'Dong tien von hoa lon, on dinh',
    icon: '🏛️',
    filters: { categories: [], minMarketCap: 10_000_000_000, sortBy: 'marketCap', sortDir: 'desc' },
  },
  {
    id: 'high-volume', name: 'Volume Cao', description: 'Khoi luong giao dich lon trong 24h',
    icon: '📊',
    filters: { categories: [], minVolume24h: 1_000_000_000, sortBy: 'volume', sortDir: 'desc' },
  },
  {
    id: 'gainers', name: 'Tang Manh', description: 'Dong tien tang gia manh nhat 24h',
    icon: '🚀',
    filters: { categories: [], minChange24h: 3, sortBy: 'change24h', sortDir: 'desc' },
  },
  {
    id: 'bargains', name: 'Gia Thap', description: 'Dong tien duoi $1 voi volume tot',
    icon: '💎',
    filters: { categories: [], maxPrice: 1, minVolume24h: 100_000_000, sortBy: 'volume', sortDir: 'desc' },
  },
  {
    id: 'defi-gems', name: 'DeFi Gems', description: 'Token DeFi dang tang',
    icon: '🏦',
    filters: { categories: ['DeFi'], minChange24h: 0, sortBy: 'change24h', sortDir: 'desc' },
  },
  {
    id: 'l2-watch', name: 'L2 Watch', description: 'Token Layer 2 tiem nang',
    icon: '🔗',
    filters: { categories: ['Layer 2'], sortBy: 'marketCap', sortDir: 'desc' },
  },
];

// ─── Comparison Metrics ───────────────────────────────────────
export interface ComparisonMetric {
  id: string;
  label: string;
  category: 'price' | 'volume' | 'supply' | 'performance';
  format: 'usd' | 'compact' | 'pct' | 'number';
}

export const COMPARISON_METRICS: ComparisonMetric[] = [
  { id: 'price', label: 'Gia hien tai', category: 'price', format: 'usd' },
  { id: 'marketCap', label: 'Von hoa', category: 'price', format: 'compact' },
  { id: 'volume24h', label: 'KL 24h', category: 'volume', format: 'compact' },
  { id: 'change24h', label: 'Thay doi 24h', category: 'performance', format: 'pct' },
  { id: 'high24h', label: 'Cao nhat 24h', category: 'price', format: 'usd' },
  { id: 'low24h', label: 'Thap nhat 24h', category: 'price', format: 'usd' },
];
