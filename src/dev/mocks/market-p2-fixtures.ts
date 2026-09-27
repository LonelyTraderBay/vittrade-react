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
    2.1, 3.5, 1.8, 5.2, 2.7, 1.3, 4.8, 2.2, 6.1, 3.3, 1.5, 2.9, 7.4, 2.1, 3.8, 1.6, 4.2, 2.8, 1.9,
    12.5, 3.1, 2.4, 1.7, 3.6, 2.3,
  ];
  // Ask quantities
  const askPattern = [
    1.9, 2.8, 4.1, 1.6, 3.2, 2.5, 1.4, 5.6, 2.9, 1.8, 3.7, 2.1, 1.3, 4.5, 2.6, 8.9, 1.7, 3.4, 2.2,
    1.5, 2.8, 3.1, 1.9, 2.4, 4.7,
  ];

  let bidCum = 0;
  for (let i = 0; i < levels; i++) {
    const price = midPrice - (i + 1) * step;
    const qty =
      bidPattern[i % bidPattern.length] * (midPrice > 10000 ? 0.01 : midPrice > 100 ? 1 : 100);
    bidCum += qty;
    bids.push({ price, quantity: qty, cumulative: bidCum });
  }

  let askCum = 0;
  for (let i = 0; i < levels; i++) {
    const price = midPrice + (i + 1) * step;
    const qty =
      askPattern[i % askPattern.length] * (midPrice > 10000 ? 0.01 : midPrice > 100 ? 1 : 100);
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
    {
      id: 'w1',
      side: 'buy',
      price: midPrice * 0.994,
      quantity: 12.5 * multiplier,
      usdValue: midPrice * 12.5 * multiplier,
      timeAgo: '2 phut truoc',
    },
    {
      id: 'w2',
      side: 'sell',
      price: midPrice * 1.005,
      quantity: 8.9 * multiplier,
      usdValue: midPrice * 8.9 * multiplier,
      timeAgo: '5 phut truoc',
    },
    {
      id: 'w3',
      side: 'buy',
      price: midPrice * 0.988,
      quantity: 15.2 * multiplier,
      usdValue: midPrice * 15.2 * multiplier,
      timeAgo: '8 phut truoc',
    },
    {
      id: 'w4',
      side: 'sell',
      price: midPrice * 1.012,
      quantity: 7.4 * multiplier,
      usdValue: midPrice * 7.4 * multiplier,
      timeAgo: '12 phut truoc',
    },
    {
      id: 'w5',
      side: 'buy',
      price: midPrice * 0.982,
      quantity: 20.1 * multiplier,
      usdValue: midPrice * 20.1 * multiplier,
      timeAgo: '18 phut truoc',
    },
  ];
}
// ─── Market News Data ─────────────────────────────────────────
export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  category:
    'breaking' | 'analysis' | 'defi' | 'regulation' | 'nft' | 'macro' | 'altcoin' | 'bitcoin';
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
    summary:
      'Cac quy ETF Bitcoin spot tai My da ghi nhan dong tien vao rong lon nhat tu khi ra mat, cho thay nhu cau to chuc tang manh.',
    source: 'CoinDesk',
    timeAgo: '15 phut truoc',
    category: 'bitcoin',
    sentiment: 'bullish',
    relatedTokens: ['BTC'],
    imageEmoji: '📈',
    isBreaking: true,
    readTime: '3 phut',
  },
  {
    id: 'n2',
    title: 'Ethereum Pectra upgrade xac nhan ngay 15/3 — nhung thay doi lon',
    summary:
      'Nang cap Pectra mang den EIP-7251 tang gioi han staking va EIP-7702 cho account abstraction, se anh huong lon den he sinh thai.',
    source: 'The Block',
    timeAgo: '45 phut truoc',
    category: 'altcoin',
    sentiment: 'bullish',
    relatedTokens: ['ETH', 'ARB', 'OP'],
    imageEmoji: '⬆️',
    readTime: '5 phut',
  },
  {
    id: 'n3',
    title: 'SEC My co the phe duyet ETF Solana trong quy 2 — phan tich',
    summary:
      'Cac chuyen gia phap ly nhan dinh SEC co the xem xet don xin ETF Solana som hon du kien sau thanh cong cua BTC ETF.',
    source: 'Bloomberg',
    timeAgo: '1 gio truoc',
    category: 'regulation',
    sentiment: 'bullish',
    relatedTokens: ['SOL'],
    imageEmoji: '⚖️',
    readTime: '4 phut',
  },
  {
    id: 'n4',
    title: 'TVL DeFi vuot $120B — muc cao nhat ke tu 2022',
    summary:
      'Tong gia tri khoa trong DeFi dat muc cao nhat trong 2 nam, dan dau boi Aave, Lido va cac giao thuc restaking moi.',
    source: 'DeFi Llama',
    timeAgo: '2 gio truoc',
    category: 'defi',
    sentiment: 'bullish',
    relatedTokens: ['ETH', 'LINK', 'AAVE'],
    imageEmoji: '🏦',
    readTime: '3 phut',
  },
  {
    id: 'n5',
    title: 'Lam phat My thang 2 cao hon du kien — crypto giam nhe',
    summary:
      'CPI thang 2 dat 3.2% YoY, cao hon du kien 3.1%, khien thi truong lo ngai Fed se giu lai suat lau hon.',
    source: 'Reuters',
    timeAgo: '3 gio truoc',
    category: 'macro',
    sentiment: 'bearish',
    relatedTokens: ['BTC', 'ETH'],
    imageEmoji: '📊',
    readTime: '4 phut',
  },
  {
    id: 'n6',
    title: 'Solana Firedancer dat 1 trieu TPS tren testnet',
    summary:
      'Client moi Firedancer cua Jump Crypto dat ky luc xu ly 1 trieu giao dich/giay tren moi truong thu nghiem.',
    source: 'Solana Blog',
    timeAgo: '4 gio truoc',
    category: 'altcoin',
    sentiment: 'bullish',
    relatedTokens: ['SOL'],
    imageEmoji: '🔥',
    readTime: '3 phut',
  },
  {
    id: 'n7',
    title: 'Binance dot 1.5 trieu BNB — gia tri gan $620M',
    summary:
      'Dot token BNB hang quy lan thu 27 da hoan thanh, loai bo vinh vien 1.5 trieu BNB khoi luu thong.',
    source: 'Binance',
    timeAgo: '5 gio truoc',
    category: 'altcoin',
    sentiment: 'bullish',
    relatedTokens: ['BNB'],
    imageEmoji: '🔥',
    readTime: '2 phut',
  },
  {
    id: 'n8',
    title: 'Chainlink CCIP V2 ho tro 20+ blockchains — chi tiet',
    summary:
      'Phien ban moi cua Cross-Chain Interoperability Protocol mang den ho tro nhieu chuoi hon va giam 40% phi bridge.',
    source: 'Chainlink Blog',
    timeAgo: '6 gio truoc',
    category: 'defi',
    sentiment: 'bullish',
    relatedTokens: ['LINK'],
    imageEmoji: '🔗',
    readTime: '5 phut',
  },
  {
    id: 'n9',
    title: 'Ca voi BTC chuyen $450M ve san — tin hieu ban?',
    summary:
      'Du lieu on-chain cho thay mot vi ca voi da chuyen 6,700 BTC ve Coinbase, tao lo ngai ap luc ban.',
    source: 'Whale Alert',
    timeAgo: '7 gio truoc',
    category: 'bitcoin',
    sentiment: 'bearish',
    relatedTokens: ['BTC'],
    imageEmoji: '🐋',
    readTime: '3 phut',
  },
  {
    id: 'n10',
    title: 'NFT marketplace OpenSea ra mat phien ban moi hoan toan',
    summary:
      'OpenSea 2.0 gioi thieu giao dien moi, ho tro da chuoi tot hon va giam phi giao dich xuong 1%.',
    source: 'OpenSea Blog',
    timeAgo: '8 gio truoc',
    category: 'nft',
    sentiment: 'neutral',
    relatedTokens: ['ETH', 'SOL'],
    imageEmoji: '🎨',
    readTime: '4 phut',
  },
  {
    id: 'n11',
    title: 'EU ap dung MiCA day du tu thang 4 — anh huong gi?',
    summary:
      'Khung phap ly Markets in Crypto-Assets se co hieu luc toan phan, yeu cau cac san giao dich phai dang ky giay phep.',
    source: 'CoinTelegraph',
    timeAgo: '10 gio truoc',
    category: 'regulation',
    sentiment: 'neutral',
    relatedTokens: ['BTC', 'ETH', 'USDT'],
    imageEmoji: '🏛️',
    readTime: '6 phut',
  },
  {
    id: 'n12',
    title: 'Phan tich: Altcoin season sap bat dau?',
    summary:
      'Chi so Altcoin Season Index dat 68/100, nhieu altcoin lon outperform BTC trong 7 ngay qua. Chuyen gia nhan dinh xu huong se tiep tuc.',
    source: 'Messari',
    timeAgo: '12 gio truoc',
    category: 'analysis',
    sentiment: 'bullish',
    relatedTokens: ['SOL', 'AVAX', 'MATIC'],
    imageEmoji: '📊',
    readTime: '5 phut',
  },
];

export const NEWS_CATEGORIES: {
  id: MarketNewsItem['category'] | 'all';
  label: string;
  color: string;
}[] = [
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

export const SENTIMENT_BADGE: Record<
  MarketNewsItem['sentiment'],
  { label: string; color: string }
> = {
  bullish: { label: 'Tich cuc', color: '#10B981' },
  bearish: { label: 'Tieu cuc', color: '#EF4444' },
  neutral: { label: 'Trung lap', color: '#6B7280' },
};
