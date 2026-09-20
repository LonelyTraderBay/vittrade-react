/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET OVERVIEW DATA — P0 Enterprise Market Foundation
 * ══════════════════════════════════════════════════════════════════
 *  Mock data for: Market Overview Dashboard, Market Movers,
 *  Market Sectors, Token Fundamentals
 */

import { HEATMAP_COINS, CRYPTO_PAIRS } from './mockData';

// ─── Global Market Stats ──────────────────────────────────────
export interface GlobalMarketStats {
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

export const GLOBAL_MARKET_STATS: GlobalMarketStats = {
  totalMarketCap: 2_456_789_012_345,
  totalMarketCapChange24h: 2.14,
  total24hVolume: 98_765_432_100,
  total24hVolumeChange: -3.21,
  btcDominance: 53.8,
  ethDominance: 17.2,
  totalCoins: 12_847,
  totalExchanges: 742,
  fearGreedIndex: 62,
  fearGreedLabel: 'Tham lam',
  activeCryptocurrencies: 9_432,
  defiTVL: 89_234_567_000,
  defiTVLChange24h: 1.87,
  stablecoinVolume24h: 45_678_901_000,
};

// ─── Market Breadth ───────────────────────────────────────────
export interface MarketBreadth {
  advancing: number;
  declining: number;
  unchanged: number;
  newATH: number;
  dropping10Pct: number;
}

export const MARKET_BREADTH: MarketBreadth = {
  advancing: 5_843,
  declining: 3_412,
  unchanged: 1_177,
  newATH: 47,
  dropping10Pct: 123,
};

// ─── Fear & Greed History ─────────────────────────────────────
export interface FearGreedPoint {
  date: string;
  value: number;
  label: string;
}

export const FEAR_GREED_HISTORY: FearGreedPoint[] = [
  { date: '7 ngày trước', value: 45, label: 'Trung lập' },
  { date: '6 ngày trước', value: 48, label: 'Trung lập' },
  { date: '5 ngày trước', value: 52, label: 'Trung lập' },
  { date: '4 ngày trước', value: 55, label: 'Tham lam' },
  { date: '3 ngày trước', value: 58, label: 'Tham lam' },
  { date: '2 ngày trước', value: 60, label: 'Tham lam' },
  { date: 'Hôm qua', value: 59, label: 'Tham lam' },
  { date: 'Hôm nay', value: 62, label: 'Tham lam' },
];

// ─── Market Sectors ───────────────────────────────────────────
export interface MarketSector {
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

export const MARKET_SECTORS: MarketSector[] = [
  {
    id: 'layer1', name: 'Layer 1', nameVi: 'Layer 1',
    color: '#3B82F6', icon: '🔷',
    totalMarketCap: 1_856_234_567_000, change24h: 2.87, change7d: 5.43, change30d: 12.1,
    volume24h: 45_678_901_000, topCoins: ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX'],
    coinCount: 48, dominance: 75.5,
  },
  {
    id: 'defi', name: 'DeFi', nameVi: 'DeFi',
    color: '#8B5CF6', icon: '🏦',
    totalMarketCap: 89_234_567_000, change24h: -1.23, change7d: 3.21, change30d: 8.7,
    volume24h: 12_345_678_000, topCoins: ['UNI', 'LINK', 'AAVE', 'MKR', 'SNX'],
    coinCount: 156, dominance: 3.6,
  },
  {
    id: 'layer2', name: 'Layer 2', nameVi: 'Layer 2',
    color: '#06B6D4', icon: '🔗',
    totalMarketCap: 34_567_890_000, change24h: 4.56, change7d: 9.87, change30d: 18.3,
    volume24h: 5_678_901_000, topCoins: ['MATIC', 'ARB', 'OP', 'STX', 'IMX'],
    coinCount: 32, dominance: 1.4,
  },
  {
    id: 'ai', name: 'AI', nameVi: 'Trí tuệ nhân tạo',
    color: '#F59E0B', icon: '🤖',
    totalMarketCap: 23_456_789_000, change24h: 6.78, change7d: 15.43, change30d: 34.2,
    volume24h: 4_567_890_000, topCoins: ['FET', 'RNDR', 'AGIX', 'WLD', 'OCEAN'],
    coinCount: 67, dominance: 0.95,
  },
  {
    id: 'meme', name: 'Meme', nameVi: 'Meme',
    color: '#EF4444', icon: '🐕',
    totalMarketCap: 56_789_012_000, change24h: -3.45, change7d: -2.10, change30d: 5.6,
    volume24h: 8_901_234_000, topCoins: ['DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK'],
    coinCount: 234, dominance: 2.3,
  },
  {
    id: 'payment', name: 'Payment', nameVi: 'Thanh toán',
    color: '#10B981', icon: '💳',
    totalMarketCap: 45_678_901_000, change24h: -0.87, change7d: 1.23, change30d: 3.4,
    volume24h: 6_789_012_000, topCoins: ['XRP', 'XLM', 'ALGO', 'NANO', 'DASH'],
    coinCount: 28, dominance: 1.86,
  },
  {
    id: 'gaming', name: 'Gaming', nameVi: 'Trò chơi',
    color: '#EC4899', icon: '🎮',
    totalMarketCap: 12_345_678_000, change24h: 3.21, change7d: 7.89, change30d: 15.2,
    volume24h: 2_345_678_000, topCoins: ['AXS', 'SAND', 'MANA', 'GALA', 'IMX'],
    coinCount: 89, dominance: 0.5,
  },
  {
    id: 'privacy', name: 'Privacy', nameVi: 'Bảo mật',
    color: '#6366F1', icon: '🔒',
    totalMarketCap: 5_678_901_000, change24h: 1.45, change7d: 4.56, change30d: 9.8,
    volume24h: 890_123_000, topCoins: ['XMR', 'ZEC', 'DASH', 'SCRT', 'ROSE'],
    coinCount: 18, dominance: 0.23,
  },
];

// ─── Market Movers (extended data) ────────────────────────────
export interface MarketMover {
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

export const MARKET_MOVERS: MarketMover[] = [
  // Big gainers
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 178.32, change1h: 1.23, change24h: 8.07, change7d: 12.34, volume24h: 3_456_789_000, volumeChange24h: 45.2, marketCap: 78_456_789_000, category: 'Layer 1', color: '#9945FF', sparkline: [165, 168, 170, 172, 175, 178] },
  { id: 'inj', symbol: 'INJ', name: 'Injective', price: 28.45, change1h: 0.87, change24h: 7.23, change7d: 15.67, volume24h: 345_678_000, volumeChange24h: 67.8, marketCap: 2_876_543_000, category: 'DeFi', color: '#00F2FE', sparkline: [24, 25, 26, 27, 28, 28.45] },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', price: 5.67, change1h: 0.45, change24h: 6.89, change7d: 14.56, volume24h: 456_789_000, volumeChange24h: 52.3, marketCap: 5_890_123_000, category: 'Layer 1', color: '#00C1DE', sparkline: [4.8, 5.0, 5.2, 5.4, 5.5, 5.67] },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', price: 0.8976, change1h: 0.34, change24h: 5.60, change7d: 11.20, volume24h: 789_012_000, volumeChange24h: 38.9, marketCap: 8_912_345_000, category: 'Layer 2', color: '#8247E5', sparkline: [0.82, 0.84, 0.86, 0.87, 0.89, 0.8976] },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', price: 38.54, change1h: 0.56, change24h: 4.73, change7d: 9.15, volume24h: 567_890_000, volumeChange24h: 28.4, marketCap: 15_678_901_000, category: 'Layer 1', color: '#E84142', sparkline: [36.5, 37.0, 37.5, 38.0, 38.3, 38.54] },
  { id: 'arb', symbol: 'ARB', name: 'Arbitrum', price: 1.23, change1h: 0.23, change24h: 4.32, change7d: 8.90, volume24h: 567_890_000, volumeChange24h: 34.1, marketCap: 4_321_098_000, category: 'Layer 2', color: '#28A0F0', sparkline: [1.12, 1.15, 1.18, 1.20, 1.22, 1.23] },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', price: 412.87, change1h: 0.41, change24h: 3.61, change7d: 7.82, volume24h: 1_234_567_000, volumeChange24h: 15.6, marketCap: 63_456_789_000, category: 'Layer 1', color: '#F3BA2F', sparkline: [395, 400, 405, 408, 410, 412.87] },
  { id: 'apt', symbol: 'APT', name: 'Aptos', price: 8.90, change1h: 0.18, change24h: 3.45, change7d: 7.89, volume24h: 234_567_000, volumeChange24h: 22.3, marketCap: 3_210_987_000, category: 'Layer 1', color: '#2A2A2A', sparkline: [8.2, 8.4, 8.5, 8.6, 8.8, 8.9] },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', price: 0.4521, change1h: 0.12, change24h: 3.22, change7d: 6.78, volume24h: 654_321_000, volumeChange24h: 18.7, marketCap: 16_234_567_000, category: 'Layer 1', color: '#0033AD', sparkline: [0.43, 0.44, 0.44, 0.45, 0.45, 0.4521] },
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 67_543.21, change1h: 0.34, change24h: 2.34, change7d: 5.12, volume24h: 23_456_789_000, volumeChange24h: 12.3, marketCap: 1_324_567_890_000, category: 'Layer 1', color: '#F7931A', sparkline: [65100, 65800, 66500, 67000, 67200, 67543] },

  // Big losers
  { id: 'wld', symbol: 'WLD', name: 'Worldcoin', price: 3.12, change1h: -0.89, change24h: -6.78, change7d: -8.90, volume24h: 345_678_000, volumeChange24h: 78.9, marketCap: 1_890_123_000, category: 'AI', color: '#1D1D1B', sparkline: [3.8, 3.6, 3.5, 3.3, 3.2, 3.12] },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', price: 14.23, change1h: -0.67, change24h: -5.76, change7d: -3.45, volume24h: 345_678_000, volumeChange24h: 56.4, marketCap: 8_123_456_000, category: 'DeFi', color: '#2A5ADA', sparkline: [15.5, 15.2, 14.9, 14.6, 14.4, 14.23] },
  { id: 'sei', symbol: 'SEI', name: 'Sei', price: 0.45, change1h: -0.45, change24h: -4.56, change7d: -2.34, volume24h: 189_012_000, volumeChange24h: 42.1, marketCap: 1_234_567_000, category: 'Layer 1', color: '#9B1C1C', sparkline: [0.49, 0.48, 0.47, 0.46, 0.46, 0.45] },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', price: 7.832, change1h: -0.34, change24h: -3.55, change7d: -1.23, volume24h: 432_109_000, volumeChange24h: 25.3, marketCap: 10_345_678_000, category: 'DeFi', color: '#E6007A', sparkline: [8.3, 8.2, 8.1, 8.0, 7.9, 7.832] },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', price: 0.6234, change1h: -0.23, change24h: -2.59, change7d: -4.21, volume24h: 1_876_543_000, volumeChange24h: 32.6, marketCap: 34_567_890_000, category: 'Payment', color: '#00AAE4', sparkline: [0.66, 0.65, 0.64, 0.63, 0.63, 0.6234] },
  { id: 'atom', symbol: 'ATOM', name: 'Cosmos', price: 9.12, change1h: -0.18, change24h: -1.87, change7d: 2.34, volume24h: 189_012_000, volumeChange24h: 14.5, marketCap: 3_456_789_000, category: 'Layer 1', color: '#2E3148', sparkline: [9.5, 9.4, 9.3, 9.2, 9.15, 9.12] },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3_521.45, change1h: -0.12, change24h: -1.23, change7d: 3.45, volume24h: 8_765_432_000, volumeChange24h: 8.9, marketCap: 423_456_789_000, category: 'Layer 1', color: '#627EEA', sparkline: [3565, 3555, 3540, 3530, 3525, 3521] },
  { id: 'op', symbol: 'OP', name: 'Optimism', price: 3.45, change1h: -0.09, change24h: -0.89, change7d: 5.67, volume24h: 321_098_000, volumeChange24h: 11.2, marketCap: 3_789_012_000, category: 'Layer 2', color: '#FF0420', sparkline: [3.52, 3.50, 3.48, 3.47, 3.46, 3.45] },

  // New listings
  { id: 'zro', symbol: 'ZRO', name: 'LayerZero', price: 4.23, change1h: 2.34, change24h: 15.67, change7d: 0, volume24h: 892_345_000, volumeChange24h: 0, marketCap: 1_234_567_000, category: 'Layer 2', color: '#7B3FE4', sparkline: [3.2, 3.5, 3.8, 4.0, 4.1, 4.23], isNew: true, listingDate: '2026-03-09' },
  { id: 'strk', symbol: 'STRK', name: 'Starknet', price: 1.87, change1h: 1.56, change24h: 12.34, change7d: 0, volume24h: 567_890_000, volumeChange24h: 0, marketCap: 987_654_000, category: 'Layer 2', color: '#29296E', sparkline: [1.5, 1.6, 1.65, 1.7, 1.8, 1.87], isNew: true, listingDate: '2026-03-10' },
  { id: 'pyth', symbol: 'PYTH', name: 'Pyth Network', price: 0.56, change1h: 0.89, change24h: 8.90, change7d: 0, volume24h: 234_567_000, volumeChange24h: 0, marketCap: 654_321_000, category: 'DeFi', color: '#6B21A8', sparkline: [0.48, 0.50, 0.52, 0.53, 0.55, 0.56], isNew: true, listingDate: '2026-03-11' },
];

// ─── Token Fundamentals ───────────────────────────────────────
export interface TokenFundamentals {
  id: string;
  symbol: string;
  name: string;
  description: string;
  website: string;
  whitepaper: string;
  github: string;
  twitter: string;
  telegram: string;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  fullyDilutedValuation: number;
  inflationRate: number;
  launchDate: string;
  consensus: string;
  network: string;
  contractAddresses: { network: string; address: string }[];
  allTimeHigh: number;
  allTimeHighDate: string;
  allTimeLow: number;
  allTimeLowDate: string;
  roi1y: number;
  activeAddresses24h: number;
  txCount24h: number;
  tvl?: number;
  holders: number;
  supplyDistribution: { label: string; percentage: number; color: string }[];
}

export const TOKEN_FUNDAMENTALS: Record<string, TokenFundamentals> = {
  btcusdt: {
    id: 'btcusdt', symbol: 'BTC', name: 'Bitcoin',
    description: 'Bitcoin la tien te ky thuat so phi tap trung dau tien, hoat dong tren mang luoi ngang hang khong can trung gian, su dung co che dong thuan Proof of Work.',
    website: 'https://bitcoin.org', whitepaper: 'https://bitcoin.org/bitcoin.pdf',
    github: 'https://github.com/bitcoin', twitter: 'https://twitter.com/bitcoin',
    telegram: '',
    circulatingSupply: 19_625_000, totalSupply: 19_625_000, maxSupply: 21_000_000,
    fullyDilutedValuation: 1_418_407_410_000,
    inflationRate: 1.74,
    launchDate: '2009-01-03', consensus: 'Proof of Work (SHA-256)',
    network: 'Bitcoin',
    contractAddresses: [],
    allTimeHigh: 73_750.07, allTimeHighDate: '2024-03-14',
    allTimeLow: 67.81, allTimeLowDate: '2013-07-06',
    roi1y: 125.4,
    activeAddresses24h: 987_654, txCount24h: 543_210,
    holders: 48_234_567,
    supplyDistribution: [
      { label: 'Luu hanh', percentage: 93.5, color: '#F7931A' },
      { label: 'Chua dao', percentage: 6.5, color: '#F7931A40' },
    ],
  },
  ethusdt: {
    id: 'ethusdt', symbol: 'ETH', name: 'Ethereum',
    description: 'Ethereum la nen tang hop dong thong minh lon nhat, cho phep xay dung ung dung phi tap trung (dApps) va token ERC-20.',
    website: 'https://ethereum.org', whitepaper: 'https://ethereum.org/whitepaper',
    github: 'https://github.com/ethereum', twitter: 'https://twitter.com/ethereum',
    telegram: '',
    circulatingSupply: 120_234_567, totalSupply: 120_234_567, maxSupply: null,
    fullyDilutedValuation: 423_456_789_000,
    inflationRate: -0.23,
    launchDate: '2015-07-30', consensus: 'Proof of Stake',
    network: 'Ethereum',
    contractAddresses: [],
    allTimeHigh: 4_878.26, allTimeHighDate: '2021-11-10',
    allTimeLow: 0.43, allTimeLowDate: '2015-10-20',
    roi1y: 67.8,
    activeAddresses24h: 567_890, txCount24h: 1_234_567,
    tvl: 45_678_901_000,
    holders: 234_567_890,
    supplyDistribution: [
      { label: 'Staking', percentage: 26.8, color: '#627EEA' },
      { label: 'DeFi', percentage: 18.4, color: '#8B5CF6' },
      { label: 'Exchange', percentage: 12.3, color: '#3B82F6' },
      { label: 'Khac', percentage: 42.5, color: '#627EEA40' },
    ],
  },
  solusdt: {
    id: 'solusdt', symbol: 'SOL', name: 'Solana',
    description: 'Solana la blockchain hieu suat cao voi toc do giao dich nhanh va phi thap, su dung co che Proof of History ket hop Proof of Stake.',
    website: 'https://solana.com', whitepaper: 'https://solana.com/solana-whitepaper.pdf',
    github: 'https://github.com/solana-labs', twitter: 'https://twitter.com/solana',
    telegram: 'https://t.me/solana',
    circulatingSupply: 440_123_456, totalSupply: 568_901_234, maxSupply: null,
    fullyDilutedValuation: 101_456_789_000,
    inflationRate: 5.8,
    launchDate: '2020-03-16', consensus: 'Proof of History + Proof of Stake',
    network: 'Solana',
    contractAddresses: [],
    allTimeHigh: 260.06, allTimeHighDate: '2021-11-06',
    allTimeLow: 0.50, allTimeLowDate: '2020-05-11',
    roi1y: 567.3,
    activeAddresses24h: 345_678, txCount24h: 2_345_678,
    tvl: 4_567_890_000,
    holders: 12_345_678,
    supplyDistribution: [
      { label: 'Luu hanh', percentage: 77.4, color: '#9945FF' },
      { label: 'Staking', percentage: 65.2, color: '#14F195' },
      { label: 'Quy & Team', percentage: 12.8, color: '#9945FF60' },
      { label: 'Chua mo khoa', percentage: 9.8, color: '#9945FF30' },
    ],
  },
  bnbusdt: {
    id: 'bnbusdt', symbol: 'BNB', name: 'BNB',
    description: 'BNB la token tien ich cua he sinh thai Binance, duoc su dung de thanh toan phi giao dich, tham gia Launchpad va nhieu dich vu khac.',
    website: 'https://www.bnbchain.org', whitepaper: '',
    github: 'https://github.com/bnb-chain', twitter: 'https://twitter.com/bnbchain',
    telegram: 'https://t.me/BNBcoin',
    circulatingSupply: 153_856_150, totalSupply: 153_856_150, maxSupply: 200_000_000,
    fullyDilutedValuation: 82_574_000_000,
    inflationRate: 0,
    launchDate: '2017-07-25', consensus: 'Proof of Staked Authority',
    network: 'BNB Smart Chain',
    contractAddresses: [
      { network: 'Ethereum (ERC-20)', address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52' },
    ],
    allTimeHigh: 690.93, allTimeHighDate: '2021-05-10',
    allTimeLow: 0.0396, allTimeLowDate: '2017-08-01',
    roi1y: 89.2,
    activeAddresses24h: 234_567, txCount24h: 4_567_890,
    holders: 56_789_012,
    supplyDistribution: [
      { label: 'Luu hanh', percentage: 76.9, color: '#F3BA2F' },
      { label: 'Da dot', percentage: 23.1, color: '#F3BA2F40' },
    ],
  },
};

// Helper: get fundamentals with fallback
export function getTokenFundamentals(pairId: string): TokenFundamentals | null {
  return TOKEN_FUNDAMENTALS[pairId] ?? null;
}

// Helper: get sorted movers
export function getTopGainers(timeframe: '1h' | '24h' | '7d', limit = 10): MarketMover[] {
  const key = timeframe === '1h' ? 'change1h' : timeframe === '24h' ? 'change24h' : 'change7d';
  return [...MARKET_MOVERS].filter(m => m[key] > 0).sort((a, b) => b[key] - a[key]).slice(0, limit);
}

export function getTopLosers(timeframe: '1h' | '24h' | '7d', limit = 10): MarketMover[] {
  const key = timeframe === '1h' ? 'change1h' : timeframe === '24h' ? 'change24h' : 'change7d';
  return [...MARKET_MOVERS].filter(m => m[key] < 0).sort((a, b) => a[key] - b[key]).slice(0, limit);
}

export function getMostActive(limit = 10): MarketMover[] {
  return [...MARKET_MOVERS].sort((a, b) => b.volume24h - a.volume24h).slice(0, limit);
}

export function getUnusualVolume(limit = 10): MarketMover[] {
  return [...MARKET_MOVERS].filter(m => m.volumeChange24h > 30).sort((a, b) => b.volumeChange24h - a.volumeChange24h).slice(0, limit);
}

export function getNewListings(): MarketMover[] {
  return MARKET_MOVERS.filter(m => m.isNew).sort((a, b) => (b.listingDate ?? '').localeCompare(a.listingDate ?? ''));
}

// Helper: sector coins
export function getSectorCoins(sectorId: string) {
  const sectorNameMap: Record<string, string> = {
    layer1: 'Layer 1', defi: 'DeFi', layer2: 'Layer 2',
    ai: 'AI', meme: 'Meme', payment: 'Payment',
    gaming: 'Gaming', privacy: 'Privacy',
  };
  const sectorName = sectorNameMap[sectorId];
  return HEATMAP_COINS.filter(c => c.category === sectorName);
}
