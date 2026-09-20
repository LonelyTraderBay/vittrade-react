/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET P2 DATA — Depth, Sentiment, Portfolio, News
 * ══════════════════════════════════════════════════════════════════
 *  Mock data for P2 Market module features.
 */

// ─── Market Depth Data ────────────────────────────────────────
export interface DepthLevel {
  price: number;
  quantity: number;
  cumulative: number;
}

export interface DepthData {
  bids: DepthLevel[];
  asks: DepthLevel[];
  midPrice: number;
  spread: number;
  spreadPct: number;
}

/**
 * Generate deterministic depth data for any price level.
 * Uses seeded patterns instead of Math.random for consistency.
 */
export function generateDepthData(midPrice: number, levels = 25): DepthData {
  const bids: DepthLevel[] = [];
  const asks: DepthLevel[] = [];
  const step = midPrice * 0.0003; // 0.03% per level

  // Bid quantities — deterministic pattern with "whale walls"
  const bidPattern = [
    2.1, 3.5, 1.8, 5.2, 2.7, 1.3, 4.8, 2.2, 6.1, 3.3,
    1.5, 2.9, 7.4, 2.1, 3.8, 1.6, 4.2, 2.8, 1.9, 12.5,
    3.1, 2.4, 1.7, 3.6, 2.3,
  ];
  // Ask quantities
  const askPattern = [
    1.9, 2.8, 4.1, 1.6, 3.2, 2.5, 1.4, 5.6, 2.9, 1.8,
    3.7, 2.1, 1.3, 4.5, 2.6, 8.9, 1.7, 3.4, 2.2, 1.5,
    2.8, 3.1, 1.9, 2.4, 4.7,
  ];

  let bidCum = 0;
  for (let i = 0; i < levels; i++) {
    const price = midPrice - (i + 1) * step;
    const qty = bidPattern[i % bidPattern.length] * (midPrice > 10000 ? 0.01 : midPrice > 100 ? 1 : 100);
    bidCum += qty;
    bids.push({ price, quantity: qty, cumulative: bidCum });
  }

  let askCum = 0;
  for (let i = 0; i < levels; i++) {
    const price = midPrice + (i + 1) * step;
    const qty = askPattern[i % askPattern.length] * (midPrice > 10000 ? 0.01 : midPrice > 100 ? 1 : 100);
    askCum += qty;
    asks.push({ price, quantity: qty, cumulative: askCum });
  }

  const spread = asks[0].price - bids[0].price;
  return {
    bids,
    asks,
    midPrice,
    spread,
    spreadPct: (spread / midPrice) * 100,
  };
}

export interface WhaleOrder {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  usdValue: number;
  timeAgo: string;
}

export function generateWhaleOrders(midPrice: number): WhaleOrder[] {
  const multiplier = midPrice > 10000 ? 0.01 : midPrice > 100 ? 1 : 100;
  return [
    { id: 'w1', side: 'buy', price: midPrice * 0.994, quantity: 12.5 * multiplier, usdValue: midPrice * 12.5 * multiplier, timeAgo: '2 phut truoc' },
    { id: 'w2', side: 'sell', price: midPrice * 1.005, quantity: 8.9 * multiplier, usdValue: midPrice * 8.9 * multiplier, timeAgo: '5 phut truoc' },
    { id: 'w3', side: 'buy', price: midPrice * 0.988, quantity: 15.2 * multiplier, usdValue: midPrice * 15.2 * multiplier, timeAgo: '8 phut truoc' },
    { id: 'w4', side: 'sell', price: midPrice * 1.012, quantity: 7.4 * multiplier, usdValue: midPrice * 7.4 * multiplier, timeAgo: '12 phut truoc' },
    { id: 'w5', side: 'buy', price: midPrice * 0.982, quantity: 20.1 * multiplier, usdValue: midPrice * 20.1 * multiplier, timeAgo: '18 phut truoc' },
  ];
}

// ─── Social Sentiment Data ────────────────────────────────────
export interface TokenSentiment {
  id: string;
  symbol: string;
  name: string;
  color: string;
  sentimentScore: number;  // -100 to +100
  sentimentLabel: string;
  mentions24h: number;
  mentionsChange: number;  // % change
  socialVolume: number;
  twitterFollowers: number;
  telegramMembers: number;
  redditSubscribers: number;
  bullishPct: number;
  bearishPct: number;
  neutralPct: number;
  trending: boolean;
  trendingRank?: number;
  topTopics: string[];
}

export const TOKEN_SENTIMENTS: TokenSentiment[] = [
  {
    id: 'btc', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A',
    sentimentScore: 72, sentimentLabel: 'Rat tich cuc',
    mentions24h: 345_678, mentionsChange: 23.4,
    socialVolume: 1_234_567, twitterFollowers: 6_200_000,
    telegramMembers: 890_000, redditSubscribers: 5_400_000,
    bullishPct: 68, bearishPct: 18, neutralPct: 14,
    trending: true, trendingRank: 1,
    topTopics: ['ETF Flows', 'Halving', 'Institutional'],
  },
  {
    id: 'eth', symbol: 'ETH', name: 'Ethereum', color: '#627EEA',
    sentimentScore: 45, sentimentLabel: 'Tich cuc',
    mentions24h: 198_456, mentionsChange: -5.6,
    socialVolume: 876_543, twitterFollowers: 3_100_000,
    telegramMembers: 456_000, redditSubscribers: 2_800_000,
    bullishPct: 52, bearishPct: 28, neutralPct: 20,
    trending: true, trendingRank: 3,
    topTopics: ['Pectra Upgrade', 'L2 Growth', 'Staking Yield'],
  },
  {
    id: 'sol', symbol: 'SOL', name: 'Solana', color: '#9945FF',
    sentimentScore: 85, sentimentLabel: 'Cuc ky tich cuc',
    mentions24h: 267_890, mentionsChange: 67.8,
    socialVolume: 987_654, twitterFollowers: 2_800_000,
    telegramMembers: 567_000, redditSubscribers: 890_000,
    bullishPct: 78, bearishPct: 12, neutralPct: 10,
    trending: true, trendingRank: 2,
    topTopics: ['Firedancer', 'Meme Season', 'DePIN'],
  },
  {
    id: 'xrp', symbol: 'XRP', name: 'Ripple', color: '#00AAE4',
    sentimentScore: -15, sentimentLabel: 'Hoi tieu cuc',
    mentions24h: 89_012, mentionsChange: -12.3,
    socialVolume: 345_678, twitterFollowers: 1_500_000,
    telegramMembers: 234_000, redditSubscribers: 890_000,
    bullishPct: 35, bearishPct: 42, neutralPct: 23,
    trending: false,
    topTopics: ['SEC Case', 'Price Drop', 'RLUSD'],
  },
  {
    id: 'doge', symbol: 'DOGE', name: 'Dogecoin', color: '#C3A634',
    sentimentScore: 58, sentimentLabel: 'Tich cuc',
    mentions24h: 156_789, mentionsChange: 34.5,
    socialVolume: 567_890, twitterFollowers: 3_400_000,
    telegramMembers: 123_000, redditSubscribers: 2_300_000,
    bullishPct: 62, bearishPct: 22, neutralPct: 16,
    trending: true, trendingRank: 4,
    topTopics: ['Elon Tweet', 'Meme Rally', 'Payment Adoption'],
  },
  {
    id: 'link', symbol: 'LINK', name: 'Chainlink', color: '#2A5ADA',
    sentimentScore: -32, sentimentLabel: 'Tieu cuc',
    mentions24h: 45_678, mentionsChange: -8.9,
    socialVolume: 198_765, twitterFollowers: 890_000,
    telegramMembers: 167_000, redditSubscribers: 234_000,
    bullishPct: 28, bearishPct: 52, neutralPct: 20,
    trending: false,
    topTopics: ['CCIP V2', 'Price Drop', 'Staking'],
  },
  {
    id: 'avax', symbol: 'AVAX', name: 'Avalanche', color: '#E84142',
    sentimentScore: 41, sentimentLabel: 'Tich cuc',
    mentions24h: 67_890, mentionsChange: 15.6,
    socialVolume: 234_567, twitterFollowers: 780_000,
    telegramMembers: 189_000, redditSubscribers: 156_000,
    bullishPct: 55, bearishPct: 25, neutralPct: 20,
    trending: false,
    topTopics: ['Subnet Growth', 'Gaming', 'Institutional'],
  },
  {
    id: 'bnb', symbol: 'BNB', name: 'BNB', color: '#F3BA2F',
    sentimentScore: 35, sentimentLabel: 'Tich cuc',
    mentions24h: 123_456, mentionsChange: 8.9,
    socialVolume: 456_789, twitterFollowers: 1_200_000,
    telegramMembers: 345_000, redditSubscribers: 567_000,
    bullishPct: 50, bearishPct: 30, neutralPct: 20,
    trending: false,
    topTopics: ['BNB Burn', 'BSC TVL', 'Launchpool'],
  },
];

// Sentiment overview stats
export interface SentimentGlobal {
  overallScore: number;
  overallLabel: string;
  totalMentions24h: number;
  mentionsChange: number;
  trendingTokens: number;
  socialDominanceBTC: number;
  socialDominanceETH: number;
  socialDominanceOther: number;
}

export const SENTIMENT_GLOBAL: SentimentGlobal = {
  overallScore: 62,
  overallLabel: 'Tich cuc',
  totalMentions24h: 2_345_678,
  mentionsChange: 18.9,
  trendingTokens: 47,
  socialDominanceBTC: 38.2,
  socialDominanceETH: 18.5,
  socialDominanceOther: 43.3,
};

// Sentiment timeline
export interface SentimentPoint {
  time: string;
  score: number;
  mentions: number;
}

export const SENTIMENT_TIMELINE: SentimentPoint[] = [
  { time: '7d truoc', score: 48, mentions: 1_890_000 },
  { time: '6d truoc', score: 52, mentions: 1_950_000 },
  { time: '5d truoc', score: 55, mentions: 2_100_000 },
  { time: '4d truoc', score: 50, mentions: 1_980_000 },
  { time: '3d truoc', score: 58, mentions: 2_200_000 },
  { time: '2d truoc', score: 60, mentions: 2_300_000 },
  { time: 'Hom qua', score: 57, mentions: 2_250_000 },
  { time: 'Hom nay', score: 62, mentions: 2_345_678 },
];

// ─── Portfolio Tracker Data ───────────────────────────────────
export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  color: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPct: number;
  allocation: number; // %
  change24h: number;
  sparkline: number[];
}

export const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  {
    id: 'btc', symbol: 'BTC', name: 'Bitcoin', color: '#F7931A',
    quantity: 0.23451, avgBuyPrice: 58_200, currentPrice: 67_543.21,
    value: 15_839.84, pnl: 2_190.84, pnlPct: 16.04,
    allocation: 28.2, change24h: 2.34,
    sparkline: [65100, 65800, 66500, 67000, 67200, 67543],
  },
  {
    id: 'eth', symbol: 'ETH', name: 'Ethereum', color: '#627EEA',
    quantity: 3.521, avgBuyPrice: 3_200, currentPrice: 3_521.45,
    value: 12_400.02, pnl: 1_132.02, pnlPct: 10.05,
    allocation: 22.1, change24h: -1.23,
    sparkline: [3565, 3555, 3540, 3530, 3525, 3521],
  },
  {
    id: 'usdt', symbol: 'USDT', name: 'Tether', color: '#26A17B',
    quantity: 12_450.80, avgBuyPrice: 1.0, currentPrice: 1.0,
    value: 12_450.80, pnl: 0, pnlPct: 0,
    allocation: 22.2, change24h: 0.01,
    sparkline: [1, 1, 1, 1, 1, 1],
  },
  {
    id: 'sol', symbol: 'SOL', name: 'Solana', color: '#9945FF',
    quantity: 45.8, avgBuyPrice: 120, currentPrice: 178.32,
    value: 8_167.06, pnl: 2_671.06, pnlPct: 48.60,
    allocation: 14.5, change24h: 8.07,
    sparkline: [165, 168, 172, 175, 178, 178.32],
  },
  {
    id: 'bnb', symbol: 'BNB', name: 'BNB', color: '#F3BA2F',
    quantity: 12.5, avgBuyPrice: 350, currentPrice: 412.87,
    value: 5_160.88, pnl: 785.88, pnlPct: 17.97,
    allocation: 9.2, change24h: 3.61,
    sparkline: [398, 402, 407, 410, 412, 412.87],
  },
  {
    id: 'ada', symbol: 'ADA', name: 'Cardano', color: '#0033AD',
    quantity: 5000, avgBuyPrice: 0.38, currentPrice: 0.4521,
    value: 2_260.50, pnl: 360.50, pnlPct: 18.97,
    allocation: 4.0, change24h: 3.22,
    sparkline: [0.44, 0.445, 0.448, 0.450, 0.451, 0.4521],
  },
];

export interface PortfolioStats {
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  totalCost: number;
  best24h: { symbol: string; change: number };
  worst24h: { symbol: string; change: number };
  stableAllocation: number;
}

export const PORTFOLIO_STATS: PortfolioStats = {
  totalValue: 56_279.10,
  totalPnl: 7_140.30,
  totalPnlPct: 14.53,
  totalCost: 49_138.80,
  best24h: { symbol: 'SOL', change: 8.07 },
  worst24h: { symbol: 'ETH', change: -1.23 },
  stableAllocation: 22.2,
};

export interface PerformancePoint {
  date: string;
  value: number;
}

export const PORTFOLIO_PERFORMANCE: PerformancePoint[] = [
  { date: '30d truoc', value: 48_500 },
  { date: '25d truoc', value: 49_200 },
  { date: '20d truoc', value: 50_100 },
  { date: '15d truoc', value: 49_800 },
  { date: '10d truoc', value: 51_400 },
  { date: '7d truoc', value: 52_800 },
  { date: '5d truoc', value: 53_600 },
  { date: '3d truoc', value: 54_900 },
  { date: 'Hom qua', value: 55_100 },
  { date: 'Hom nay', value: 56_279 },
];

// ─── Market News Data ─────────────────────────────────────────
export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  category: 'breaking' | 'analysis' | 'defi' | 'regulation' | 'nft' | 'macro' | 'altcoin' | 'bitcoin';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relatedTokens: string[];
  imageEmoji: string;
  isBreaking?: boolean;
  readTime: string;
}

export const MARKET_NEWS: MarketNewsItem[] = [
  {
    id: 'n1',
    title: 'Bitcoin ETF ghi nhan dong tien vao ky luc $1.2B trong 1 ngay',
    summary: 'Cac quy ETF Bitcoin spot tai My da ghi nhan dong tien vao rong lon nhat tu khi ra mat, cho thay nhu cau to chuc tang manh.',
    source: 'CoinDesk', timeAgo: '15 phut truoc',
    category: 'bitcoin', sentiment: 'bullish',
    relatedTokens: ['BTC'], imageEmoji: '📈',
    isBreaking: true, readTime: '3 phut',
  },
  {
    id: 'n2',
    title: 'Ethereum Pectra upgrade xac nhan ngay 15/3 — nhung thay doi lon',
    summary: 'Nang cap Pectra mang den EIP-7251 tang gioi han staking va EIP-7702 cho account abstraction, se anh huong lon den he sinh thai.',
    source: 'The Block', timeAgo: '45 phut truoc',
    category: 'altcoin', sentiment: 'bullish',
    relatedTokens: ['ETH', 'ARB', 'OP'], imageEmoji: '⬆️',
    readTime: '5 phut',
  },
  {
    id: 'n3',
    title: 'SEC My co the phe duyet ETF Solana trong quy 2 — phan tich',
    summary: 'Cac chuyen gia phap ly nhan dinh SEC co the xem xet don xin ETF Solana som hon du kien sau thanh cong cua BTC ETF.',
    source: 'Bloomberg', timeAgo: '1 gio truoc',
    category: 'regulation', sentiment: 'bullish',
    relatedTokens: ['SOL'], imageEmoji: '⚖️',
    readTime: '4 phut',
  },
  {
    id: 'n4',
    title: 'TVL DeFi vuot $120B — muc cao nhat ke tu 2022',
    summary: 'Tong gia tri khoa trong DeFi dat muc cao nhat trong 2 nam, dan dau boi Aave, Lido va cac giao thuc restaking moi.',
    source: 'DeFi Llama', timeAgo: '2 gio truoc',
    category: 'defi', sentiment: 'bullish',
    relatedTokens: ['ETH', 'LINK', 'AAVE'], imageEmoji: '🏦',
    readTime: '3 phut',
  },
  {
    id: 'n5',
    title: 'Lam phat My thang 2 cao hon du kien — crypto giam nhe',
    summary: 'CPI thang 2 dat 3.2% YoY, cao hon du kien 3.1%, khien thi truong lo ngai Fed se giu lai suat lau hon.',
    source: 'Reuters', timeAgo: '3 gio truoc',
    category: 'macro', sentiment: 'bearish',
    relatedTokens: ['BTC', 'ETH'], imageEmoji: '📊',
    readTime: '4 phut',
  },
  {
    id: 'n6',
    title: 'Solana Firedancer dat 1 trieu TPS tren testnet',
    summary: 'Client moi Firedancer cua Jump Crypto dat ky luc xu ly 1 trieu giao dich/giay tren moi truong thu nghiem.',
    source: 'Solana Blog', timeAgo: '4 gio truoc',
    category: 'altcoin', sentiment: 'bullish',
    relatedTokens: ['SOL'], imageEmoji: '🔥',
    readTime: '3 phut',
  },
  {
    id: 'n7',
    title: 'Binance dot 1.5 trieu BNB — gia tri gan $620M',
    summary: 'Dot token BNB hang quy lan thu 27 da hoan thanh, loai bo vinh vien 1.5 trieu BNB khoi luu thong.',
    source: 'Binance', timeAgo: '5 gio truoc',
    category: 'altcoin', sentiment: 'bullish',
    relatedTokens: ['BNB'], imageEmoji: '🔥',
    readTime: '2 phut',
  },
  {
    id: 'n8',
    title: 'Chainlink CCIP V2 ho tro 20+ blockchains — chi tiet',
    summary: 'Phien ban moi cua Cross-Chain Interoperability Protocol mang den ho tro nhieu chuoi hon va giam 40% phi bridge.',
    source: 'Chainlink Blog', timeAgo: '6 gio truoc',
    category: 'defi', sentiment: 'bullish',
    relatedTokens: ['LINK'], imageEmoji: '🔗',
    readTime: '5 phut',
  },
  {
    id: 'n9',
    title: 'Ca voi BTC chuyen $450M ve san — tin hieu ban?',
    summary: 'Du lieu on-chain cho thay mot vi ca voi da chuyen 6,700 BTC ve Coinbase, tao lo ngai ap luc ban.',
    source: 'Whale Alert', timeAgo: '7 gio truoc',
    category: 'bitcoin', sentiment: 'bearish',
    relatedTokens: ['BTC'], imageEmoji: '🐋',
    readTime: '3 phut',
  },
  {
    id: 'n10',
    title: 'NFT marketplace OpenSea ra mat phien ban moi hoan toan',
    summary: 'OpenSea 2.0 gioi thieu giao dien moi, ho tro da chuoi tot hon va giam phi giao dich xuong 1%.',
    source: 'OpenSea Blog', timeAgo: '8 gio truoc',
    category: 'nft', sentiment: 'neutral',
    relatedTokens: ['ETH', 'SOL'], imageEmoji: '🎨',
    readTime: '4 phut',
  },
  {
    id: 'n11',
    title: 'EU ap dung MiCA day du tu thang 4 — anh huong gi?',
    summary: 'Khung phap ly Markets in Crypto-Assets se co hieu luc toan phan, yeu cau cac san giao dich phai dang ky giay phep.',
    source: 'CoinTelegraph', timeAgo: '10 gio truoc',
    category: 'regulation', sentiment: 'neutral',
    relatedTokens: ['BTC', 'ETH', 'USDT'], imageEmoji: '🏛️',
    readTime: '6 phut',
  },
  {
    id: 'n12',
    title: 'Phan tich: Altcoin season sap bat dau?',
    summary: 'Chi so Altcoin Season Index dat 68/100, nhieu altcoin lon outperform BTC trong 7 ngay qua. Chuyen gia nhan dinh xu huong se tiep tuc.',
    source: 'Messari', timeAgo: '12 gio truoc',
    category: 'analysis', sentiment: 'bullish',
    relatedTokens: ['SOL', 'AVAX', 'MATIC'], imageEmoji: '📊',
    readTime: '5 phut',
  },
];

export const NEWS_CATEGORIES: { id: MarketNewsItem['category'] | 'all'; label: string; color: string }[] = [
  { id: 'all', label: 'Tat ca', color: '#6B7280' },
  { id: 'breaking', label: 'Nong', color: '#EF4444' },
  { id: 'bitcoin', label: 'Bitcoin', color: '#F7931A' },
  { id: 'altcoin', label: 'Altcoin', color: '#8B5CF6' },
  { id: 'defi', label: 'DeFi', color: '#3B82F6' },
  { id: 'macro', label: 'Vi mo', color: '#64748B' },
  { id: 'regulation', label: 'Phap ly', color: '#F59E0B' },
  { id: 'analysis', label: 'Phan tich', color: '#10B981' },
  { id: 'nft', label: 'NFT', color: '#EC4899' },
];

export const SENTIMENT_BADGE: Record<MarketNewsItem['sentiment'], { label: string; color: string }> = {
  bullish: { label: 'Tich cuc', color: '#10B981' },
  bearish: { label: 'Tieu cuc', color: '#EF4444' },
  neutral: { label: 'Trung lap', color: '#6B7280' },
};
