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
  type:
    | 'unlock'
    | 'upgrade'
    | 'halving'
    | 'airdrop'
    | 'listing'
    | 'fork'
    | 'burn'
    | 'conference'
    | 'report';
  date: string; // ISO
  symbol?: string;
  symbolColor?: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  source?: string;
  confirmed: boolean;
}

export const MARKET_EVENTS: MarketEvent[] = [
  {
    id: 'ev1',
    title: 'ARB Token Unlock',
    titleVi: 'Mở khóa ARB',
    type: 'unlock',
    date: '2026-03-12T08:00:00Z',
    symbol: 'ARB',
    symbolColor: '#28A0F0',
    impact: 'high',
    description: '92.65M ARB ($113.9M) mo khoa tu investor va team. Khoang 3.49% tong cung.',
    source: 'TokenUnlocks.app',
    confirmed: true,
  },
  {
    id: 'ev2',
    title: 'Ethereum Pectra Upgrade',
    titleVi: 'Nang cap Ethereum Pectra',
    type: 'upgrade',
    date: '2026-03-15T14:00:00Z',
    symbol: 'ETH',
    symbolColor: '#627EEA',
    impact: 'high',
    description:
      'Nang cap Pectra bao gom EIP-7251 (tang staking limit), EIP-7702 (account abstraction).',
    source: 'ethereum.org',
    confirmed: true,
  },
  {
    id: 'ev3',
    title: 'PYTH Airdrop Season 2',
    titleVi: 'Airdrop PYTH Mua 2',
    type: 'airdrop',
    date: '2026-03-14T00:00:00Z',
    symbol: 'PYTH',
    symbolColor: '#6B21A8',
    impact: 'medium',
    description: 'Dot phat hanh airdrop thu 2 cho nguoi dung DeFi va staker.',
    source: 'pyth.network',
    confirmed: true,
  },
  {
    id: 'ev4',
    title: 'BNB Quarterly Burn',
    titleVi: 'Dot BNB Hang Quy',
    type: 'burn',
    date: '2026-03-18T12:00:00Z',
    symbol: 'BNB',
    symbolColor: '#F3BA2F',
    impact: 'medium',
    description: 'Dot BNB dinh ky hang quy, uoc tinh 1.5M BNB (~$618M) se bi dot.',
    source: 'bnbchain.org',
    confirmed: false,
  },
  {
    id: 'ev5',
    title: 'Solana Firedancer Mainnet',
    titleVi: 'Solana Firedancer Mainnet',
    type: 'upgrade',
    date: '2026-03-20T16:00:00Z',
    symbol: 'SOL',
    symbolColor: '#9945FF',
    impact: 'high',
    description: 'Client moi Firedancer ra mat chinh thuc, tang hieu suat mang len gap 10 lan.',
    source: 'solana.com',
    confirmed: false,
  },
  {
    id: 'ev6',
    title: 'MATIC Token Unlock',
    titleVi: 'Mo khoa MATIC',
    type: 'unlock',
    date: '2026-03-13T08:00:00Z',
    symbol: 'MATIC',
    symbolColor: '#8247E5',
    impact: 'medium',
    description: '200M MATIC (~$179M) mo khoa tu quy phat trien ecosystem.',
    source: 'TokenUnlocks.app',
    confirmed: true,
  },
  {
    id: 'ev7',
    title: 'WLD Token Listing — Coinbase',
    titleVi: 'WLD niem yet tren Coinbase',
    type: 'listing',
    date: '2026-03-11T18:00:00Z',
    symbol: 'WLD',
    symbolColor: '#1D1D1B',
    impact: 'medium',
    description: 'Worldcoin (WLD) se duoc list tren Coinbase voi cap WLD/USD.',
    source: 'Coinbase Blog',
    confirmed: true,
  },
  {
    id: 'ev8',
    title: 'Token2049 Dubai',
    titleVi: 'Hoi nghi Token2049 Dubai',
    type: 'conference',
    date: '2026-03-22T09:00:00Z',
    impact: 'low',
    description: 'Hoi nghi blockchain lon nhat khu vuc MENA, du kien 10,000+ tham du.',
    source: 'token2049.com',
    confirmed: true,
  },
  {
    id: 'ev9',
    title: 'OP Token Unlock',
    titleVi: 'Mo khoa OP',
    type: 'unlock',
    date: '2026-03-25T08:00:00Z',
    symbol: 'OP',
    symbolColor: '#FF0420',
    impact: 'high',
    description: '31.3M OP ($108M) mo khoa tu core contributors va investors.',
    source: 'TokenUnlocks.app',
    confirmed: true,
  },
  {
    id: 'ev10',
    title: 'Chainlink CCIP V2',
    titleVi: 'Chainlink CCIP V2 Launch',
    type: 'upgrade',
    date: '2026-03-28T14:00:00Z',
    symbol: 'LINK',
    symbolColor: '#2A5ADA',
    impact: 'medium',
    description: 'Cross-Chain Interoperability Protocol v2 ho tro 20+ chains.',
    source: 'chain.link',
    confirmed: false,
  },
  {
    id: 'ev11',
    title: 'CPI Report US',
    titleVi: 'Bao cao CPI My',
    type: 'report',
    date: '2026-03-12T12:30:00Z',
    impact: 'high',
    description: 'Bao cao chi so gia tieu dung thang 2 cua My. Du kien 3.1% YoY.',
    source: 'Bureau of Labor Statistics',
    confirmed: true,
  },
  {
    id: 'ev12',
    title: 'FOMC Meeting',
    titleVi: 'Hop FOMC',
    type: 'report',
    date: '2026-03-19T18:00:00Z',
    impact: 'high',
    description: 'Cuoc hop Fed quyet dinh lai suat. Thi truong du doan giu nguyen 5.25-5.50%.',
    source: 'Federal Reserve',
    confirmed: true,
  },
];

export const EVENT_TYPE_CONFIG: Record<
  MarketEvent['type'],
  { label: string; color: string; icon: string }
> = {
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
    id: 'large-cap',
    name: 'Large Cap',
    description: 'Dong tien von hoa lon, on dinh',
    icon: '🏛️',
    filters: { categories: [], minMarketCap: 10_000_000_000, sortBy: 'marketCap', sortDir: 'desc' },
  },
  {
    id: 'high-volume',
    name: 'Volume Cao',
    description: 'Khoi luong giao dich lon trong 24h',
    icon: '📊',
    filters: { categories: [], minVolume24h: 1_000_000_000, sortBy: 'volume', sortDir: 'desc' },
  },
  {
    id: 'gainers',
    name: 'Tang Manh',
    description: 'Dong tien tang gia manh nhat 24h',
    icon: '🚀',
    filters: { categories: [], minChange24h: 3, sortBy: 'change24h', sortDir: 'desc' },
  },
  {
    id: 'bargains',
    name: 'Gia Thap',
    description: 'Dong tien duoi $1 voi volume tot',
    icon: '💎',
    filters: {
      categories: [],
      maxPrice: 1,
      minVolume24h: 100_000_000,
      sortBy: 'volume',
      sortDir: 'desc',
    },
  },
  {
    id: 'defi-gems',
    name: 'DeFi Gems',
    description: 'Token DeFi dang tang',
    icon: '🏦',
    filters: { categories: ['DeFi'], minChange24h: 0, sortBy: 'change24h', sortDir: 'desc' },
  },
  {
    id: 'l2-watch',
    name: 'L2 Watch',
    description: 'Token Layer 2 tiem nang',
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
