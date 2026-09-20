// ============================================================
// MOCK DATA — VitTrade App
// ============================================================

export interface CryptoPair {
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
  isFavorite: boolean;
  category: string;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
  depth: number; // 0–1 percent of max
}

export interface RecentTrade {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  time: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'oco' | 'bracket';
  price: number;
  amount: number;
  filled: number;
  status: 'open' | 'filled' | 'partial' | 'cancelled';
  createdAt: string;
  fee: number;
  // Bracket / OCO fields
  tpPrice?: number;
  slPrice?: number;
  bracketMode?: boolean;
  ocoLinked?: boolean;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  available: number;
  frozen: number;
  inOrder: number;
  usdValue: number;
  change24h: number;
  logoColor: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade_buy' | 'trade_sell' | 'p2p_buy' | 'p2p_sell';
  asset: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  txHash?: string;
  address?: string;
  network?: string;
  createdAt: string;
  fee?: number;
}

export interface P2PAd {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  merchant: string;
  merchantId: string;
  merchantAvatar?: string;
  merchantLevel: number;
  merchantVerified: boolean;
  merchantJoinDate: string;
  completionRate: number;
  completedOrders: number;
  totalVolume30d: number;
  price: number;
  currency: string;
  priceType: 'fixed' | 'floating';
  priceMargin?: number;
  minLimit: number;
  maxLimit: number;
  available: number;
  paymentMethods: string[];
  avgResponseTime: string;
  isOnline: boolean;
  lastActive?: string;
  remarks?: string;
  autoReply?: string;
  counterpartyRequirements?: {
    minKycLevel?: number;
    minCompletedTrades?: number;
    minRegisteredDays?: number;
  };
  tradingHours?: string;
  createdAt: string;
  status: 'active' | 'paused' | 'expired';
  // ─── Enhanced fields (enterprise P2P) ───
  merchantRating?: number;
  merchantBadge?: 'elite' | 'pro' | null;
  merchantFlag?: string;
  viewerCount?: number;
  isNewMerchant?: boolean;
  timeAgo?: string;
}

export interface P2POrder {
  id: string;
  orderNumber: string;
  adId: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  total: number;
  currency: string;
  status: 'pending_payment' | 'paid' | 'released' | 'disputed' | 'cancelled' | 'expired';
  merchant: string;
  merchantId: string;
  counterparty: string;
  paymentMethod: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  releasedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  escrowAmount: number;
  fee: number;
  paymentProof?: string[];
  rating?: number;
  review?: string;
  disputeReason?: string;
  disputeEvidence?: string[];
  paymentInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    qrCodeUrl?: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other' | 'system';
  text: string;
  time: string;
  type: 'text' | 'image' | 'system';
  imageUrl?: string;
  isRead?: boolean;
  readAt?: string;
  replyToId?: string;
}

export interface P2PPaymentMethod {
  id: string;
  type: 'bank' | 'ewallet';
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrCodeUrl?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface P2PMerchant {
  id: string;
  name: string;
  avatar?: string;
  level: number;
  kycVerified: boolean;
  joinDate: string;
  totalTrades: number;
  totalTrades30d: number;
  completionRate: number;
  avgReleaseTime: string;
  avgPayTime: string;
  totalVolume30d: number;
  isOnline: boolean;
  lastActive: string;
  positiveRate: number;
  negativeCount: number;
  activeAds: number;
  isBlocked?: boolean;
  isFollowed?: boolean;
}

export interface P2PReview {
  id: string;
  orderId: string;
  fromUser: string;
  fromUserId: string;
  toUser: string;
  toUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
  replyAt?: string;
  type: 'positive' | 'negative';
}

export interface P2PDispute {
  id: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  description: string;
  evidence: string[];
  status: 'submitted' | 'under_review' | 'resolved' | 'rejected';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
  timeline: { time: string; event: string; detail?: string }[];
  supportMessages: { sender: 'user' | 'support'; text: string; time: string }[];
}

// ─── Crypto Pairs ────────────────────────────────────────────
export const CRYPTO_PAIRS: CryptoPair[] = [
  {
    id: 'btcusdt', symbol: 'BTC/USDT', baseAsset: 'BTC', quoteAsset: 'USDT',
    price: 67543.21, prevPrice: 66012.50, change24h: 2.34,
    high24h: 68100.00, low24h: 65800.00, volume24h: 23456789000, marketCap: 1324567890000,
    sparklineData: [65100, 65400, 65200, 65800, 66200, 65900, 66500, 67000, 66800, 67200, 67100, 67543],
    logoColor: '#F7931A', isFavorite: true, category: 'Layer 1',
  },
  {
    id: 'ethusdt', symbol: 'ETH/USDT', baseAsset: 'ETH', quoteAsset: 'USDT',
    price: 3521.45, prevPrice: 3565.00, change24h: -1.23,
    high24h: 3600.00, low24h: 3480.00, volume24h: 8765432000, marketCap: 423456789000,
    sparklineData: [3565, 3555, 3570, 3540, 3530, 3545, 3520, 3510, 3525, 3515, 3530, 3521],
    logoColor: '#627EEA', isFavorite: true, category: 'Layer 1',
  },
  {
    id: 'bnbusdt', symbol: 'BNB/USDT', baseAsset: 'BNB', quoteAsset: 'USDT',
    price: 412.87, prevPrice: 398.50, change24h: 3.61,
    high24h: 415.00, low24h: 395.00, volume24h: 1234567000, marketCap: 63456789000,
    sparklineData: [398, 400, 402, 405, 403, 407, 410, 408, 411, 413, 412.87],
    logoColor: '#F3BA2F', isFavorite: false, category: 'Layer 1',
  },
  {
    id: 'solusdt', symbol: 'SOL/USDT', baseAsset: 'SOL', quoteAsset: 'USDT',
    price: 178.32, prevPrice: 165.00, change24h: 8.07,
    high24h: 182.00, low24h: 163.00, volume24h: 3456789000, marketCap: 78456789000,
    sparklineData: [165, 168, 170, 172, 171, 175, 176, 179, 178, 180, 178.32],
    logoColor: '#9945FF', isFavorite: true, category: 'Layer 1',
  },
  {
    id: 'xrpusdt', symbol: 'XRP/USDT', baseAsset: 'XRP', quoteAsset: 'USDT',
    price: 0.6234, prevPrice: 0.6400, change24h: -2.59,
    high24h: 0.6500, low24h: 0.6100, volume24h: 1876543000, marketCap: 34567890000,
    sparklineData: [0.64, 0.638, 0.635, 0.632, 0.628, 0.625, 0.621, 0.6234],
    logoColor: '#00AAE4', isFavorite: false, category: 'Layer 1',
  },
  {
    id: 'adausdt', symbol: 'ADA/USDT', baseAsset: 'ADA', quoteAsset: 'USDT',
    price: 0.4521, prevPrice: 0.4380, change24h: 3.22,
    high24h: 0.4600, low24h: 0.4350, volume24h: 654321000, marketCap: 16234567000,
    sparklineData: [0.438, 0.440, 0.442, 0.445, 0.448, 0.450, 0.452, 0.4521],
    logoColor: '#0033AD', isFavorite: false, category: 'Layer 1',
  },
  {
    id: 'dotusdt', symbol: 'DOT/USDT', baseAsset: 'DOT', quoteAsset: 'USDT',
    price: 7.832, prevPrice: 8.120, change24h: -3.55,
    high24h: 8.200, low24h: 7.700, volume24h: 432109000, marketCap: 10345678000,
    sparklineData: [8.12, 8.05, 7.98, 7.92, 7.88, 7.85, 7.83, 7.832],
    logoColor: '#E6007A', isFavorite: false, category: 'DeFi',
  },
  {
    id: 'maticusdt', symbol: 'MATIC/USDT', baseAsset: 'MATIC', quoteAsset: 'USDT',
    price: 0.8976, prevPrice: 0.8500, change24h: 5.60,
    high24h: 0.9100, low24h: 0.8400, volume24h: 789012000, marketCap: 8912345000,
    sparklineData: [0.850, 0.855, 0.862, 0.870, 0.875, 0.882, 0.890, 0.8976],
    logoColor: '#8247E5', isFavorite: false, category: 'Layer 2',
  },
  {
    id: 'avaxusdt', symbol: 'AVAX/USDT', baseAsset: 'AVAX', quoteAsset: 'USDT',
    price: 38.54, prevPrice: 36.80, change24h: 4.73,
    high24h: 39.00, low24h: 36.50, volume24h: 567890000, marketCap: 15678901000,
    sparklineData: [36.8, 37.0, 37.3, 37.6, 37.9, 38.1, 38.4, 38.54],
    logoColor: '#E84142', isFavorite: false, category: 'Layer 1',
  },
  {
    id: 'linkusdt', symbol: 'LINK/USDT', baseAsset: 'LINK', quoteAsset: 'USDT',
    price: 14.23, prevPrice: 15.10, change24h: -5.76,
    high24h: 15.20, low24h: 14.00, volume24h: 345678000, marketCap: 8123456000,
    sparklineData: [15.10, 15.00, 14.85, 14.70, 14.55, 14.40, 14.30, 14.23],
    logoColor: '#2A5ADA', isFavorite: false, category: 'DeFi',
  },
];

// ─── Orderbook ────────────────────────────────────────────────
export function generateOrderBook(midPrice: number): { asks: OrderBookEntry[]; bids: OrderBookEntry[] } {
  const asks: OrderBookEntry[] = [];
  const bids: OrderBookEntry[] = [];
  let runningAsk = 0;
  let runningBid = 0;
  const maxAsk = 15;
  const maxBid = 12;

  for (let i = 0; i < 14; i++) {
    const price = midPrice + (i + 1) * (midPrice * 0.0002);
    const amount = parseFloat((Math.random() * 2 + 0.01).toFixed(4));
    runningAsk += amount;
    asks.push({ price, amount, total: price * amount, depth: 0 });
  }
  for (let i = 0; i < 14; i++) {
    const price = midPrice - (i + 1) * (midPrice * 0.0002);
    const amount = parseFloat((Math.random() * 2.5 + 0.01).toFixed(4));
    runningBid += amount;
    bids.push({ price, amount, total: price * amount, depth: 0 });
  }

  const maxA = Math.max(...asks.map(a => a.amount));
  const maxB = Math.max(...bids.map(b => b.amount));
  asks.forEach(a => a.depth = a.amount / maxA);
  bids.forEach(b => b.depth = b.amount / maxB);

  return { asks: asks.reverse(), bids };
}

// ─── Recent Trades ────────────────────────────────────────────
export function generateRecentTrades(price: number): RecentTrade[] {
  const trades: RecentTrade[] = [];
  const now = new Date();
  for (let i = 0; i < 25; i++) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const tradePrice = price * (1 + (Math.random() - 0.5) * 0.002);
    const d = new Date(now.getTime() - i * 3000);
    trades.push({
      id: `t${i}`,
      price: parseFloat(tradePrice.toFixed(2)),
      amount: parseFloat((Math.random() * 1.5 + 0.001).toFixed(4)),
      side,
      time: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`,
    });
  }
  return trades;
}

// ─── Chart Data (Area / Candlestick mock) ────────────────────
export function generateChartData(basePrice: number, points: number): { time: string; price: number; open: number; high: number; low: number; close: number; volume: number }[] {
  const data = [];
  let price = basePrice * 0.92;
  const now = Date.now();
  for (let i = points; i >= 0; i--) {
    const change = (Math.random() - 0.48) * price * 0.008;
    price = Math.max(basePrice * 0.85, Math.min(basePrice * 1.1, price + change));
    const open = price;
    const close = price + (Math.random() - 0.5) * price * 0.004;
    const high = Math.max(open, close) + Math.random() * price * 0.003;
    const low = Math.min(open, close) - Math.random() * price * 0.003;
    const ts = new Date(now - i * 3600000);
    data.push({
      time: `${ts.getHours().toString().padStart(2,'0')}:00`,
      price: parseFloat(close.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat((Math.random() * 100 + 10).toFixed(2)),
    });
  }
  return data;
}

// ─── User Assets ─────────────────────────────────────────────
export const USER_ASSETS: Asset[] = [
  { id: 'usdt', symbol: 'USDT', name: 'Tether USD', balance: 12450.80, available: 10200.00, frozen: 1250.80, inOrder: 1000.00, usdValue: 12450.80, change24h: 0.01, logoColor: '#26A17B' },
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', balance: 0.23451, available: 0.21451, frozen: 0, inOrder: 0.02, usdValue: 15842.10, change24h: 2.34, logoColor: '#F7931A' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', balance: 3.5210, available: 2.3000, frozen: 0.5210, inOrder: 0.70, usdValue: 12395.45, change24h: -1.23, logoColor: '#627EEA' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', balance: 45.8, available: 45.8, frozen: 0, inOrder: 0, usdValue: 8167.06, change24h: 8.07, logoColor: '#9945FF' },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', balance: 12.5, available: 12.5, frozen: 0, inOrder: 0, usdValue: 5160.88, change24h: 3.61, logoColor: '#F3BA2F' },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', balance: 5000, available: 5000, frozen: 0, inOrder: 0, usdValue: 2260.50, change24h: 3.22, logoColor: '#0033AD' },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', balance: 2500, available: 2500, frozen: 0, inOrder: 0, usdValue: 1375.00, change24h: 1.85, logoColor: '#23292F' },
  // Dust assets (small residual balances)
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', balance: 0.42, available: 0.42, frozen: 0, inOrder: 0, usdValue: 3.15, change24h: -0.85, logoColor: '#E6007A' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', balance: 0.08, available: 0.08, frozen: 0, inOrder: 0, usdValue: 2.88, change24h: 1.42, logoColor: '#E84142' },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', balance: 0.15, available: 0.15, frozen: 0, inOrder: 0, usdValue: 2.25, change24h: -2.10, logoColor: '#2A5ADA' },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', balance: 3.2, available: 3.2, frozen: 0, inOrder: 0, usdValue: 1.92, change24h: 0.55, logoColor: '#8247E5' },
  { id: 'atom', symbol: 'ATOM', name: 'Cosmos', balance: 0.05, available: 0.05, frozen: 0, inOrder: 0, usdValue: 0.45, change24h: -1.30, logoColor: '#2E3148' },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', balance: 12, available: 12, frozen: 0, inOrder: 0, usdValue: 1.56, change24h: 3.80, logoColor: '#C2A633' },
];

// ─── Open Orders ─────────────────────────────────────────────
export const OPEN_ORDERS: Order[] = [
  { id: 'ord001', symbol: 'BTC/USDT', side: 'buy', type: 'limit', price: 65000.00, amount: 0.05, filled: 0, status: 'open', createdAt: '2024-02-21 09:32:11', fee: 0, tpPrice: 72000, slPrice: 61000, bracketMode: true },
  { id: 'ord002', symbol: 'ETH/USDT', side: 'sell', type: 'limit', price: 3650.00, amount: 1.5, filled: 0.8, status: 'partial', createdAt: '2024-02-21 10:15:44', fee: 0.24 },
  { id: 'ord003', symbol: 'SOL/USDT', side: 'buy', type: 'stop', price: 170.00, amount: 10, filled: 0, status: 'open', createdAt: '2024-02-21 11:02:33', fee: 0, tpPrice: 195, slPrice: 155, bracketMode: true },
  { id: 'ord004', symbol: 'BTC/USDT', side: 'sell', type: 'oco', price: 67500.00, amount: 0.02, filled: 0, status: 'open', createdAt: '2024-02-21 12:18:07', fee: 0, tpPrice: 70000, slPrice: 63000, ocoLinked: true },
];

export const ORDER_HISTORY: Order[] = [
  { id: 'ord010', symbol: 'BTC/USDT', side: 'buy', type: 'market', price: 66500.00, amount: 0.1, filled: 0.1, status: 'filled', createdAt: '2024-02-20 14:22:01', fee: 3.33 },
  { id: 'ord011', symbol: 'ETH/USDT', side: 'sell', type: 'limit', price: 3580.00, amount: 2.0, filled: 2.0, status: 'filled', createdAt: '2024-02-20 11:10:09', fee: 0.72 },
  { id: 'ord012', symbol: 'BNB/USDT', side: 'buy', type: 'limit', price: 400.00, amount: 5, filled: 0, status: 'cancelled', createdAt: '2024-02-19 16:45:22', fee: 0 },
  { id: 'ord013', symbol: 'SOL/USDT', side: 'buy', type: 'market', price: 172.50, amount: 20, filled: 20, status: 'filled', createdAt: '2024-02-19 09:31:55', fee: 1.73 },
  { id: 'ord014', symbol: 'BTC/USDT', side: 'sell', type: 'limit', price: 68000.00, amount: 0.05, filled: 0, status: 'cancelled', createdAt: '2024-02-18 20:00:00', fee: 0 },
];

// ─── Transaction History ──────────────────────────────────────
export const TRANSACTIONS: Transaction[] = [
  { id: 'tx001', type: 'deposit', asset: 'USDT', amount: 5000, status: 'completed', txHash: '0x1a2b3c...', network: 'TRC20', createdAt: '2024-02-21 08:00:00' },
  { id: 'tx002', type: 'trade_buy', asset: 'BTC', amount: 0.1, status: 'completed', createdAt: '2024-02-20 14:22:01', fee: 3.33 },
  { id: 'tx003', type: 'trade_sell', asset: 'ETH', amount: 2.0, status: 'completed', createdAt: '2024-02-20 11:10:09', fee: 0.72 },
  { id: 'tx004', type: 'withdraw', asset: 'USDT', amount: 1000, status: 'pending', address: 'TQn...Xyz', network: 'TRC20', createdAt: '2024-02-19 20:15:00', fee: 1.0 },
  { id: 'tx005', type: 'deposit', asset: 'ETH', amount: 5, status: 'completed', txHash: '0x4d5e6f...', network: 'ERC20', createdAt: '2024-02-18 12:30:00' },
  { id: 'tx006', type: 'p2p_buy', asset: 'USDT', amount: 2000, status: 'completed', createdAt: '2024-02-17 09:45:00' },
];

// ─── P2P ─────────────────────────────────────────────────────
export const P2P_ADS: P2PAd[] = [
  { id: 'ad001', type: 'sell', asset: 'USDT', merchant: 'CryptoKing_VN', merchantId: 'mc001', merchantLevel: 3, merchantVerified: true, merchantJoinDate: '2022-06-15', completionRate: 98.5, completedOrders: 1243, totalVolume30d: 850000, price: 25350, currency: 'VND', priceType: 'fixed', minLimit: 500000, maxLimit: 50000000, available: 10000, paymentMethods: ['Vietcombank', 'Momo', 'ZaloPay'], avgResponseTime: '2 phút', isOnline: true, lastActive: '1 phút trước', remarks: 'Chuyển khoản nhanh trong 10 phút. Chỉ giao dịch với tài khoản đã KYC.', autoReply: 'Cảm ơn bạn đã tạo đơn! Vui lòng chuyển khoản theo thông tin bên dưới.', counterpartyRequirements: { minKycLevel: 1, minCompletedTrades: 0 }, tradingHours: '08:00 - 23:00', createdAt: '2024-02-10 08:00:00', status: 'active', merchantRating: 4.8, merchantBadge: 'elite', viewerCount: 7, timeAgo: '2h trước' },
  { id: 'ad002', type: 'sell', asset: 'USDT', merchant: 'TradeMaster99', merchantId: 'mc002', merchantLevel: 2, merchantVerified: true, merchantJoinDate: '2023-01-20', completionRate: 96.2, completedOrders: 567, totalVolume30d: 320000, price: 25380, currency: 'VND', priceType: 'floating', priceMargin: 0.12, minLimit: 1000000, maxLimit: 100000000, available: 5000, paymentMethods: ['Techcombank', 'VietinBank'], avgResponseTime: '5 phút', isOnline: true, lastActive: '3 phút trước', remarks: 'Xác nhận trong 15 phút. Không nhận chuyển từ bên thứ 3.', counterpartyRequirements: { minCompletedTrades: 5, minRegisteredDays: 30 }, createdAt: '2024-02-12 10:00:00', status: 'active', merchantRating: 4.2, merchantBadge: 'pro', viewerCount: 3, timeAgo: '5h trước' },
  { id: 'ad003', type: 'sell', asset: 'USDT', merchant: 'CoinHunter_HCM', merchantId: 'mc003', merchantLevel: 1, merchantVerified: false, merchantJoinDate: '2023-08-10', completionRate: 94.1, completedOrders: 234, totalVolume30d: 95000, price: 25400, currency: 'VND', priceType: 'fixed', minLimit: 200000, maxLimit: 20000000, available: 2500, paymentMethods: ['Momo', 'ZaloPay'], avgResponseTime: '8 phút', isOnline: false, lastActive: '2 giờ trước', createdAt: '2024-02-15 14:00:00', status: 'active', merchantRating: 3.8, isNewMerchant: true, viewerCount: 1, timeAgo: '1d trước' },
  { id: 'ad004', type: 'buy', asset: 'USDT', merchant: 'VIPTrader_HN', merchantId: 'mc004', merchantLevel: 3, merchantVerified: true, merchantJoinDate: '2021-11-05', completionRate: 99.1, completedOrders: 3421, totalVolume30d: 2100000, price: 25280, currency: 'VND', priceType: 'fixed', minLimit: 2000000, maxLimit: 200000000, available: 50000, paymentMethods: ['Vietcombank', 'BIDV', 'Momo'], avgResponseTime: '1 phút', isOnline: true, lastActive: 'Vừa xong', remarks: 'Top merchant VitTrade. Xác nhận siêu nhanh 24/7.', autoReply: 'Chào bạn! Tôi sẽ xác nhận ngay khi nhận tiền. Trung bình ~1 phút.', counterpartyRequirements: { minKycLevel: 2, minCompletedTrades: 10 }, tradingHours: '24/7', createdAt: '2024-02-08 06:00:00', status: 'active', merchantRating: 4.9, merchantBadge: 'elite', viewerCount: 12, timeAgo: '30m trước' },
  { id: 'ad005', type: 'buy', asset: 'USDT', merchant: 'FastTrade_SG', merchantId: 'mc005', merchantLevel: 2, merchantVerified: true, merchantJoinDate: '2023-03-15', completionRate: 97.3, completedOrders: 892, totalVolume30d: 450000, price: 25260, currency: 'VND', priceType: 'floating', priceMargin: -0.24, minLimit: 500000, maxLimit: 50000000, available: 20000, paymentMethods: ['VietinBank', 'ZaloPay'], avgResponseTime: '3 phút', isOnline: true, lastActive: '5 phút trước', counterpartyRequirements: { minCompletedTrades: 3 }, createdAt: '2024-02-11 09:00:00', status: 'active', merchantRating: 4.6, merchantBadge: 'pro', viewerCount: 5, timeAgo: '1h trước' },
  { id: 'ad006', type: 'sell', asset: 'BTC', merchant: 'BTCWhale_VN', merchantId: 'mc006', merchantLevel: 3, merchantVerified: true, merchantJoinDate: '2022-01-10', completionRate: 99.5, completedOrders: 2156, totalVolume30d: 5200000, price: 1720000000, currency: 'VND', priceType: 'floating', priceMargin: 0.5, minLimit: 5000000, maxLimit: 500000000, available: 2.5, paymentMethods: ['Vietcombank', 'BIDV', 'Techcombank'], avgResponseTime: '2 phút', isOnline: true, lastActive: 'Vừa xong', remarks: 'Giao dịch BTC lớn. Escrow 100%. Xác nhận nhanh.', counterpartyRequirements: { minKycLevel: 2, minCompletedTrades: 20, minRegisteredDays: 60 }, tradingHours: '24/7', createdAt: '2024-02-09 12:00:00', status: 'active', merchantRating: 4.9, merchantBadge: 'elite', viewerCount: 9, timeAgo: '15m trước' },
  { id: 'ad007', type: 'sell', asset: 'ETH', merchant: 'CryptoKing_VN', merchantId: 'mc001', merchantLevel: 3, merchantVerified: true, merchantJoinDate: '2022-06-15', completionRate: 98.5, completedOrders: 1243, totalVolume30d: 850000, price: 89500000, currency: 'VND', priceType: 'fixed', minLimit: 2000000, maxLimit: 100000000, available: 15, paymentMethods: ['Vietcombank', 'Momo'], avgResponseTime: '2 phút', isOnline: true, lastActive: '1 phút trước', createdAt: '2024-02-14 08:00:00', status: 'active', merchantRating: 4.9, merchantBadge: 'elite', viewerCount: 5 },
  // ─── BNB Ads ───
  { id: 'ad008', type: 'sell', asset: 'BNB', merchant: 'BNBKing_VN', merchantId: 'mc008', merchantLevel: 2, merchantVerified: true, merchantJoinDate: '2023-02-10', completionRate: 97.8, completedOrders: 678, totalVolume30d: 420000, price: 15250000, currency: 'VND', priceType: 'fixed', minLimit: 1000000, maxLimit: 80000000, available: 45, paymentMethods: ['Vietcombank', 'Momo'], avgResponseTime: '3 phút', isOnline: true, lastActive: '2 phút trước', createdAt: '2024-02-20 08:00:00', status: 'active', merchantRating: 4.5, merchantBadge: 'pro', viewerCount: 3 },
  { id: 'ad009', type: 'buy', asset: 'BNB', merchant: 'VIPTrader_HN', merchantId: 'mc004', merchantLevel: 3, merchantVerified: true, merchantJoinDate: '2021-11-05', completionRate: 99.1, completedOrders: 3421, totalVolume30d: 2100000, price: 15180000, currency: 'VND', priceType: 'floating', priceMargin: -0.35, minLimit: 2000000, maxLimit: 150000000, available: 100, paymentMethods: ['Vietcombank', 'BIDV', 'Techcombank'], avgResponseTime: '1 phút', isOnline: true, lastActive: 'Vừa xong', createdAt: '2024-02-19 10:00:00', status: 'active', merchantRating: 4.9, merchantBadge: 'elite', viewerCount: 8 },
  { id: 'ad010', type: 'sell', asset: 'BNB', merchant: 'CoinHunter_HCM', merchantId: 'mc003', merchantLevel: 1, merchantVerified: false, merchantJoinDate: '2023-08-10', completionRate: 94.1, completedOrders: 234, totalVolume30d: 95000, price: 15320000, currency: 'VND', priceType: 'fixed', minLimit: 500000, maxLimit: 30000000, available: 20, paymentMethods: ['ZaloPay', 'Momo'], avgResponseTime: '10 phút', isOnline: false, lastActive: '1 giờ trước', createdAt: '2024-02-18 15:00:00', status: 'active', isNewMerchant: true, timeAgo: '1h trước' },
  // ─── SOL Ads ───
  { id: 'ad011', type: 'sell', asset: 'SOL', merchant: 'SolanaTrader_VN', merchantId: 'mc009', merchantLevel: 2, merchantVerified: true, merchantJoinDate: '2023-05-20', completionRate: 96.7, completedOrders: 445, totalVolume30d: 280000, price: 4850000, currency: 'VND', priceType: 'fixed', minLimit: 500000, maxLimit: 50000000, available: 120, paymentMethods: ['Techcombank', 'Momo', 'ZaloPay'], avgResponseTime: '4 phút', isOnline: true, lastActive: '4 phút trước', createdAt: '2024-02-21 09:00:00', status: 'active', merchantRating: 4.3, merchantBadge: 'pro', viewerCount: 4 },
  { id: 'ad012', type: 'buy', asset: 'SOL', merchant: 'FastTrade_SG', merchantId: 'mc005', merchantLevel: 2, merchantVerified: true, merchantJoinDate: '2023-03-15', completionRate: 97.3, completedOrders: 892, totalVolume30d: 450000, price: 4790000, currency: 'VND', priceType: 'floating', priceMargin: -0.5, minLimit: 1000000, maxLimit: 80000000, available: 200, paymentMethods: ['VietinBank', 'Vietcombank'], avgResponseTime: '3 phút', isOnline: true, lastActive: '5 phút trước', createdAt: '2024-02-20 14:00:00', status: 'active', merchantRating: 4.6, merchantBadge: null, viewerCount: 2 },
  { id: 'ad013', type: 'sell', asset: 'SOL', merchant: 'CryptoKing_VN', merchantId: 'mc001', merchantLevel: 3, merchantVerified: true, merchantJoinDate: '2022-06-15', completionRate: 98.5, completedOrders: 1243, totalVolume30d: 850000, price: 4870000, currency: 'VND', priceType: 'fixed', minLimit: 2000000, maxLimit: 100000000, available: 80, paymentMethods: ['Vietcombank', 'BIDV'], avgResponseTime: '2 phút', isOnline: true, lastActive: '1 phút trước', createdAt: '2024-02-22 08:00:00', status: 'active', merchantRating: 4.9, merchantBadge: 'elite', viewerCount: 6 },
];

export const P2P_ORDER: P2POrder = {
  id: 'p2p001', orderNumber: 'VT-P2P-20240221-001', adId: 'ad001', type: 'buy', asset: 'USDT', amount: 200, price: 25350, total: 5070000, currency: 'VND',
  status: 'pending_payment', merchant: 'CryptoKing_VN', merchantId: 'mc001', counterparty: 'Nguyễn Văn A',
  paymentMethod: 'Vietcombank', createdAt: '2024-02-21 11:00:00', expiresAt: '2024-02-21 11:15:00',
  escrowAmount: 200, fee: 0,
  paymentInfo: { bankName: 'Vietcombank', accountNumber: '1234567890', accountName: 'NGUYEN VAN B' },
};

export const P2P_ORDERS: P2POrder[] = [
  { id: 'p2p001', orderNumber: 'VT-P2P-20240223-001', adId: 'ad001', type: 'buy', asset: 'USDT', amount: 200, price: 25350, total: 5070000, currency: 'VND', status: 'pending_payment', merchant: 'CryptoKing_VN', merchantId: 'mc001', counterparty: 'Nguyễn Văn A', paymentMethod: 'Vietcombank', createdAt: '2024-02-23 11:00:00', expiresAt: '2024-02-23 11:15:00', escrowAmount: 200, fee: 0, paymentInfo: { bankName: 'Vietcombank', accountNumber: '1234567890', accountName: 'NGUYEN VAN B' } },
  { id: 'p2p002', orderNumber: 'VT-P2P-20240223-002', adId: 'ad004', type: 'sell', asset: 'USDT', amount: 500, price: 25280, total: 12640000, currency: 'VND', status: 'paid', merchant: 'VIPTrader_HN', merchantId: 'mc004', counterparty: 'Trần Thị B', paymentMethod: 'BIDV', createdAt: '2024-02-23 09:15:00', expiresAt: '2024-02-23 09:30:00', escrowAmount: 500, fee: 0, paidAt: '2024-02-23 09:20:00', paymentInfo: { bankName: 'BIDV', accountNumber: '9876543210', accountName: 'TRAN THI B' } },
  { id: 'p2p003', orderNumber: 'VT-P2P-20240222-003', adId: 'ad001', type: 'buy', asset: 'USDT', amount: 1000, price: 25300, total: 25300000, currency: 'VND', status: 'released', merchant: 'TradeMaster99', merchantId: 'mc002', counterparty: 'Nguyễn Văn A', paymentMethod: 'Techcombank', createdAt: '2024-02-22 14:30:00', expiresAt: '2024-02-22 14:45:00', escrowAmount: 1000, fee: 0, paidAt: '2024-02-22 14:35:00', releasedAt: '2024-02-22 14:40:00', rating: 5, review: 'Giao dịch nhanh', paymentInfo: { bankName: 'Techcombank', accountNumber: '5566778899', accountName: 'NGUYEN VAN C' } },
  { id: 'p2p004', orderNumber: 'VT-P2P-20240221-004', adId: 'ad003', type: 'buy', asset: 'USDT', amount: 150, price: 25400, total: 3810000, currency: 'VND', status: 'released', merchant: 'CoinHunter_HCM', merchantId: 'mc003', counterparty: 'Nguyễn Văn A', paymentMethod: 'Momo', createdAt: '2024-02-21 16:45:00', expiresAt: '2024-02-21 17:00:00', escrowAmount: 150, fee: 0, paidAt: '2024-02-21 16:50:00', releasedAt: '2024-02-21 16:58:00', rating: 5, paymentInfo: { bankName: 'Momo', accountNumber: '0901234567', accountName: 'NGUYEN VAN A' } },
  { id: 'p2p005', orderNumber: 'VT-P2P-20240220-005', adId: 'ad005', type: 'sell', asset: 'USDT', amount: 300, price: 25260, total: 7578000, currency: 'VND', status: 'cancelled', merchant: 'FastTrade_SG', merchantId: 'mc005', counterparty: 'Lê Văn C', paymentMethod: 'VietinBank', createdAt: '2024-02-20 10:20:00', expiresAt: '2024-02-20 10:35:00', escrowAmount: 300, fee: 0, cancelledAt: '2024-02-20 10:30:00', cancelReason: 'Đã tìm được giá tốt hơn' },
  { id: 'p2p006', orderNumber: 'VT-P2P-20240219-006', adId: 'ad002', type: 'buy', asset: 'USDT', amount: 800, price: 25350, total: 20280000, currency: 'VND', status: 'disputed', merchant: 'NewTrader01', merchantId: 'mc007', counterparty: 'Nguyễn Văn A', paymentMethod: 'Vietcombank', createdAt: '2024-02-19 08:10:00', expiresAt: '2024-02-19 08:25:00', escrowAmount: 800, fee: 0, paidAt: '2024-02-19 08:15:00', disputeReason: 'Đã thanh toán nhưng người bán không xác nhận', paymentInfo: { bankName: 'Vietcombank', accountNumber: '1234567890', accountName: 'NGUYEN VAN B' } },
  { id: 'p2p007', orderNumber: 'VT-P2P-20240218-007', adId: 'ad006', type: 'buy', asset: 'BTC', amount: 0.05, price: 1715000000, total: 85750000, currency: 'VND', status: 'released', merchant: 'BTCWhale_VN', merchantId: 'mc006', counterparty: 'Nguyễn Văn A', paymentMethod: 'Vietcombank', createdAt: '2024-02-18 12:00:00', expiresAt: '2024-02-18 12:15:00', escrowAmount: 0.05, fee: 0, paidAt: '2024-02-18 12:05:00', releasedAt: '2024-02-18 12:08:00', rating: 5, paymentInfo: { bankName: 'Vietcombank', accountNumber: '1234567890', accountName: 'NGUYEN VAN D' } },
];

export const P2P_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'cm1', sender: 'system', text: 'Đơn hàng #VT-P2P-20240221-001 đã được tạo. Vui lòng thanh toán trong 15 phút.', time: '11:00', type: 'system', isRead: true },
  { id: 'cm2', sender: 'other', text: 'Xin chào! Vui lòng chuyển khoản theo thông tin tôi cung cấp nhé 😊', time: '11:01', type: 'text', isRead: true },
  { id: 'cm3', sender: 'me', text: 'Vâng, tôi sẽ chuyển ngay. Số tài khoản là 1234567890 đúng không?', time: '11:02', type: 'text', isRead: true, readAt: '11:02' },
  { id: 'cm4', sender: 'other', text: 'Đúng rồi. Chủ tài khoản NGUYEN VAN B - Vietcombank.', time: '11:02', type: 'text', isRead: true },
  { id: 'cm5', sender: 'me', text: 'Đã chuyển khoản xong, vui lòng xác nhận nhé!', time: '11:07', type: 'text', isRead: true, readAt: '11:07' },
];

// ─── P2P Merchants ────────────────────────────────────────────
export const P2P_MERCHANTS: P2PMerchant[] = [
  { id: 'mc001', name: 'CryptoKing_VN', level: 3, kycVerified: true, joinDate: '2022-06-15', totalTrades: 1243, totalTrades30d: 89, completionRate: 98.5, avgReleaseTime: '2 phút', avgPayTime: '5 phút', totalVolume30d: 850000, isOnline: true, lastActive: '1 phút trước', positiveRate: 97.8, negativeCount: 3, activeAds: 4 },
  { id: 'mc002', name: 'TradeMaster99', level: 2, kycVerified: true, joinDate: '2023-01-20', totalTrades: 567, totalTrades30d: 45, completionRate: 96.2, avgReleaseTime: '5 phút', avgPayTime: '8 phút', totalVolume30d: 320000, isOnline: true, lastActive: '3 phút trước', positiveRate: 95.1, negativeCount: 5, activeAds: 2 },
  { id: 'mc003', name: 'CoinHunter_HCM', level: 1, kycVerified: false, joinDate: '2023-08-10', totalTrades: 234, totalTrades30d: 18, completionRate: 94.1, avgReleaseTime: '8 phút', avgPayTime: '12 phút', totalVolume30d: 95000, isOnline: false, lastActive: '2 giờ trước', positiveRate: 91.2, negativeCount: 8, activeAds: 1 },
  { id: 'mc004', name: 'VIPTrader_HN', level: 3, kycVerified: true, joinDate: '2021-11-05', totalTrades: 3421, totalTrades30d: 210, completionRate: 99.1, avgReleaseTime: '1 phút', avgPayTime: '3 phút', totalVolume30d: 2100000, isOnline: true, lastActive: 'Vừa xong', positiveRate: 99.3, negativeCount: 1, activeAds: 5 },
  { id: 'mc005', name: 'FastTrade_SG', level: 2, kycVerified: true, joinDate: '2023-03-15', totalTrades: 892, totalTrades30d: 67, completionRate: 97.3, avgReleaseTime: '3 phút', avgPayTime: '6 phút', totalVolume30d: 450000, isOnline: true, lastActive: '5 phút trước', positiveRate: 96.5, negativeCount: 4, activeAds: 3 },
  { id: 'mc006', name: 'BTCWhale_VN', level: 3, kycVerified: true, joinDate: '2022-01-10', totalTrades: 2156, totalTrades30d: 134, completionRate: 99.5, avgReleaseTime: '2 phút', avgPayTime: '4 phút', totalVolume30d: 5200000, isOnline: true, lastActive: 'Vừa xong', positiveRate: 99.1, negativeCount: 2, activeAds: 3 },
];

// ─── P2P Payment Methods (User's saved) ───────────────────────
export const P2P_PAYMENT_METHODS: P2PPaymentMethod[] = [
  { id: 'pm001', type: 'bank', bankName: 'Vietcombank', accountNumber: '0071000123456', accountName: 'NGUYEN VAN A', isDefault: true, isVerified: true, createdAt: '2024-01-10' },
  { id: 'pm002', type: 'bank', bankName: 'Techcombank', accountNumber: '19033456789012', accountName: 'NGUYEN VAN A', isDefault: false, isVerified: true, createdAt: '2024-01-15' },
  { id: 'pm003', type: 'ewallet', bankName: 'Momo', accountNumber: '0901234567', accountName: 'NGUYEN VAN A', isDefault: false, isVerified: true, createdAt: '2024-01-20' },
  { id: 'pm004', type: 'ewallet', bankName: 'ZaloPay', accountNumber: '0901234567', accountName: 'NGUYEN VAN A', isDefault: false, isVerified: false, createdAt: '2024-02-01' },
];

// ─── P2P Reviews ──────────���───────────────────────────────────
export const P2P_REVIEWS: P2PReview[] = [
  { id: 'rv001', orderId: 'p2p003', fromUser: 'Tôi', fromUserId: 'user001', toUser: 'CryptoKing_VN', toUserId: 'mc001', rating: 5, comment: 'Giao dịch nhanh, xác nhận trong 2 phút. Merchant rất uy tín!', createdAt: '2024-02-22 15:00', type: 'positive', reply: 'Cảm ơn bạn! Rất vui được hợp tác 🙏', replyAt: '2024-02-22 15:30' },
  { id: 'rv002', orderId: 'p2p004', fromUser: 'Tôi', fromUserId: 'user001', toUser: 'VIPTrader_HN', toUserId: 'mc004', rating: 5, comment: 'Top merchant. Xác nhận siêu nhanh ~1 phút. Highly recommended!', createdAt: '2024-02-21 17:00', type: 'positive' },
  { id: 'rv003', orderId: 'p2p005', fromUser: 'TraderNewbie', fromUserId: 'user010', toUser: 'CryptoKing_VN', toUserId: 'mc001', rating: 4, comment: 'Giao dịch ổn, hơi chậm xác nhận lúc đêm khuya.', createdAt: '2024-02-20 23:45', type: 'positive' },
  { id: 'rv004', orderId: 'p2p010', fromUser: 'CoinLover99', fromUserId: 'user015', toUser: 'CryptoKing_VN', toUserId: 'mc001', rating: 5, comment: 'Lần thứ 10 giao dịch. Luôn nhanh và tin cậy.', createdAt: '2024-02-19 10:20', type: 'positive' },
  { id: 'rv005', orderId: 'p2p012', fromUser: 'SafeTrader', fromUserId: 'user020', toUser: 'CoinHunter_HCM', toUserId: 'mc003', rating: 2, comment: 'Phản hồi quá chậm, phải đợi 30 phút mới xác nhận.', createdAt: '2024-02-18 14:00', type: 'negative' },
  { id: 'rv006', orderId: 'p2p002', fromUser: 'VIPTrader_HN', fromUserId: 'mc004', toUser: 'Tôi', toUserId: 'user001', rating: 5, comment: 'Người mua thanh toán rất nhanh, hợp tác vui vẻ!', createdAt: '2024-02-23 10:00', type: 'positive' },
  { id: 'rv007', orderId: 'p2p003', fromUser: 'TradeMaster99', fromUserId: 'mc002', toUser: 'Tôi', toUserId: 'user001', rating: 4, comment: 'Giao dịch ổn, thanh toán đúng hạn.', createdAt: '2024-02-22 15:30', type: 'positive', reply: 'Cảm ơn bạn!', replyAt: '2024-02-22 16:00' },
  { id: 'rv008', orderId: 'p2p007', fromUser: 'BTCWhale_VN', fromUserId: 'mc006', toUser: 'Tôi', toUserId: 'user001', rating: 5, comment: 'Người mua uy tín, chuyển khoản nhanh. Sẵn sàng giao dịch tiếp.', createdAt: '2024-02-18 13:00', type: 'positive' },
];

// ─── P2P Disputes ─────────────────────────────────────────────
export const P2P_DISPUTES: P2PDispute[] = [
  {
    id: 'disp001', orderId: 'p2p006', orderNumber: 'VT-P2P-20240219-006',
    reason: 'Đã thanh toán nhưng người bán không xác nhận',
    description: 'Tôi đã chuyển khoản 20,280,000 VND qua Vietcombank lúc 08:15 nhưng người bán NewTrader01 không xác nhận sau 30 phút.',
    evidence: ['proof_transfer_001.jpg', 'screenshot_chat_001.jpg'],
    status: 'under_review',
    createdAt: '2024-02-19 08:50',
    timeline: [
      { time: '2024-02-19 08:10', event: 'Đơn hàng được tạo' },
      { time: '2024-02-19 08:15', event: 'Đã thanh toán', detail: 'Chuyển khoản Vietcombank' },
      { time: '2024-02-19 08:45', event: 'Hết thời gian xác nhận' },
      { time: '2024-02-19 08:50', event: 'Khiếu nại được gửi', detail: 'Bằng chứng: 2 ảnh' },
      { time: '2024-02-19 09:00', event: 'Đang xem xét', detail: 'Bộ phận hỗ trợ đã tiếp nhận' },
    ],
    supportMessages: [
      { sender: 'user', text: 'Tôi đã chuyển khoản xong nhưng seller không xác nhận. Đính kèm ảnh chụp giao dịch ngân hàng.', time: '08:50' },
      { sender: 'support', text: 'Chào bạn, chúng tôi đã nhận được khiếu nại. Đang liên hệ người bán để xác minh. Vui lòng chờ trong 24h.', time: '09:05' },
      { sender: 'support', text: 'Cập nhật: Người bán đã xác nhận nhận được tiền. Crypto sẽ được giải phóng trong 5 phút.', time: '10:30' },
    ],
  },
];

// ─── P2P Trading Levels ───────────────────────────────────────
export interface P2PTradingLevel {
  id: number;
  name: string;
  nameVi: string;
  fee: number;
  dailyLimit: number;
  perOrderLimit: number;
  requirements: string[];
  color: string;
  gradient: string;
}

export const P2P_TRADING_LEVELS: P2PTradingLevel[] = [
  { id: 1, name: 'Basic', nameVi: 'Cơ bản', fee: 0.3, dailyLimit: 10000000, perOrderLimit: 5000000, requirements: ['Email xác minh'], color: '#6B7280', gradient: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)' },
  { id: 2, name: 'Standard', nameVi: 'Tiêu chuẩn', fee: 0.2, dailyLimit: 100000000, perOrderLimit: 50000000, requirements: ['KYC Lv.1 (CMND/CCCD)', 'Xác minh SĐT'], color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' },
  { id: 3, name: 'Advanced', nameVi: 'Nâng cao', fee: 0.15, dailyLimit: 500000000, perOrderLimit: 200000000, requirements: ['KYC Lv.2 (Selfie + Video)', '2FA đã bật', '50+ giao dịch hoàn tất'], color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' },
  { id: 4, name: 'VIP', nameVi: 'VIP', fee: 0.1, dailyLimit: 0, perOrderLimit: 0, requirements: ['KYC Lv.2', '2FA đã bật', 'Volume > 5 tỷ VND', '200+ giao dịch hoàn tất'], color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
];

export interface P2PUserLevel {
  currentLevel: number;
  completedOrders: number;
  accumulatedVolume: number;
  dailyUsed: number;
  dailyLimit: number;
  fee: number;
  nextLevelProgress: number;
}

export const P2P_USER_LEVEL: P2PUserLevel = {
  currentLevel: 3,
  completedOrders: 64,
  accumulatedVolume: 1250000000,
  dailyUsed: 45000000,
  dailyLimit: 500000000,
  fee: 0.15,
  nextLevelProgress: 0.42,
};

// ─── P2P Platform Stats (Public) ──────────────────────────────
export interface P2PPlatformStats {
  volume24h: number;
  volume24hChange: number;
  totalTrades24h: number;
  activeMerchants: number;
  onlineTraders: number;
  avgCompletionRate: number;
  avgCompletionTime: string;
  totalUsers: number;
  supportedFiats: number;
  escrowProtected: number;
}

export const P2P_PLATFORM_STATS: P2PPlatformStats = {
  volume24h: 12_850_000_000,
  volume24hChange: 8.7,
  totalTrades24h: 3_247,
  activeMerchants: 428,
  onlineTraders: 1_892,
  avgCompletionRate: 94.5,
  avgCompletionTime: '6 phút',
  totalUsers: 85_420,
  supportedFiats: 15,
  escrowProtected: 45_200_000_000,
};

// ─── P2P Statistics (User Dashboard) ──────────────────────────
export interface P2PStatistics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  disputedOrders: number;
  completionRate: number;
  avgCompletionTime: string;
  totalVolume7d: number;
  totalVolume30d: number;
  totalVolumeAll: number;
  buyVolume30d: number;
  sellVolume30d: number;
  spreadRevenue30d: number;
  avgOrderSize: number;
  uniqueCounterparties: number;
  repeatCustomerRate: number;
  avgRatingGiven: number;
  avgRatingReceived: number;
  positiveReviewRate: number;
  responseTimeAvg: string;
  platformAvgCompletionRate: number;
  platformAvgResponseTime: string;
  ordersByMonth: { month: string; buy: number; sell: number }[];
  volumeByWeek: { week: string; volume: number }[];
  assetDistribution: { asset: string; percentage: number; volume: number }[];
  topMerchants: { name: string; id: string; trades: number; volume: number; rating: number }[];
  recentActivity: { date: string; type: string; asset: string; amount: number; total: number; merchant: string; status: string }[];
}

export const P2P_STATISTICS: P2PStatistics = {
  totalOrders: 78,
  completedOrders: 64,
  cancelledOrders: 8,
  disputedOrders: 2,
  completionRate: 82.1,
  avgCompletionTime: '8 phút',
  totalVolume7d: 89_500_000,
  totalVolume30d: 385_000_000,
  totalVolumeAll: 1_250_000_000,
  buyVolume30d: 245_000_000,
  sellVolume30d: 140_000_000,
  spreadRevenue30d: 1_850_000,
  avgOrderSize: 16_200_000,
  uniqueCounterparties: 23,
  repeatCustomerRate: 34.8,
  avgRatingGiven: 4.6,
  avgRatingReceived: 4.8,
  positiveReviewRate: 95.3,
  responseTimeAvg: '4 phút',
  platformAvgCompletionRate: 94.5,
  platformAvgResponseTime: '6 phút',
  ordersByMonth: [
    { month: 'T9', buy: 4, sell: 2 },
    { month: 'T10', buy: 6, sell: 5 },
    { month: 'T11', buy: 8, sell: 4 },
    { month: 'T12', buy: 10, sell: 7 },
    { month: 'T1', buy: 12, sell: 6 },
    { month: 'T2', buy: 9, sell: 5 },
  ],
  volumeByWeek: [
    { week: 'T1', volume: 45_000_000 },
    { week: 'T2', volume: 72_000_000 },
    { week: 'T3', volume: 98_000_000 },
    { week: 'T4', volume: 120_000_000 },
    { week: 'T5', volume: 85_000_000 },
    { week: 'T6', volume: 135_000_000 },
    { week: 'T7', volume: 68_000_000 },
    { week: 'T8', volume: 89_500_000 },
  ],
  assetDistribution: [
    { asset: 'USDT', percentage: 72, volume: 277_200_000 },
    { asset: 'BTC', percentage: 18, volume: 69_300_000 },
    { asset: 'ETH', percentage: 6, volume: 23_100_000 },
    { asset: 'BNB', percentage: 3, volume: 11_550_000 },
    { asset: 'SOL', percentage: 1, volume: 3_850_000 },
  ],
  topMerchants: [
    { name: 'CryptoKing_VN', id: 'mc001', trades: 15, volume: 127_000_000, rating: 4.8 },
    { name: 'VIPTrader_HN', id: 'mc004', trades: 12, volume: 98_000_000, rating: 4.9 },
    { name: 'TradeMaster99', id: 'mc002', trades: 8, volume: 62_000_000, rating: 4.2 },
    { name: 'BTCWhale_VN', id: 'mc006', trades: 5, volume: 85_750_000, rating: 4.9 },
    { name: 'FastTrade_SG', id: 'mc005', trades: 4, volume: 32_000_000, rating: 4.6 },
  ],
  recentActivity: [
    { date: '23/02 11:00', type: 'buy', asset: 'USDT', amount: 200, total: 5_070_000, merchant: 'CryptoKing_VN', status: 'pending_payment' },
    { date: '23/02 09:15', type: 'sell', asset: 'USDT', amount: 500, total: 12_640_000, merchant: 'VIPTrader_HN', status: 'paid' },
    { date: '22/02 14:30', type: 'buy', asset: 'USDT', amount: 1000, total: 25_300_000, merchant: 'TradeMaster99', status: 'released' },
    { date: '21/02 16:45', type: 'buy', asset: 'USDT', amount: 150, total: 3_810_000, merchant: 'CoinHunter_HCM', status: 'released' },
    { date: '18/02 12:00', type: 'buy', asset: 'BTC', amount: 0.05, total: 85_750_000, merchant: 'BTCWhale_VN', status: 'released' },
  ],
};

// ─── P2P Ad Performance Analytics ─────────────────────────────
export interface P2PAdAnalytics {
  adId: string;
  impressions: number;
  clicks: number;
  ordersCreated: number;
  ordersCompleted: number;
  ordersDisputed: number;
  ordersCancelled: number;
  totalVolume: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgResponseTime: number;
  avgCompletionTime: number;
  conversionRate: number;
  completionRate: number;
  rating: number;
  reviewsCount: number;
  ranking: number;
  totalActiveAds: number;
  dailyPerformance: { date: string; impressions: number; orders: number; volume: number }[];
  hourlyHeatmap: { hour: number; orders: number }[];
  paymentBreakdown: { method: string; count: number; volume: number }[];
  competitorComparison: { metric: string; yours: number; avg: number; top: number }[];
}

export const P2P_AD_ANALYTICS: Record<string, P2PAdAnalytics> = {
  myad001: {
    adId: 'myad001',
    impressions: 12_847, clicks: 1_926,
    ordersCreated: 289, ordersCompleted: 274, ordersDisputed: 3, ordersCancelled: 12,
    totalVolume: 2_180_000_000, totalRevenue: 6_540_000,
    avgOrderValue: 7_956_204, avgResponseTime: 45, avgCompletionTime: 8.3,
    conversionRate: 15.0, completionRate: 94.8,
    rating: 4.8, reviewsCount: 186, ranking: 3, totalActiveAds: 428,
    dailyPerformance: [
      { date: '20/02', impressions: 412, orders: 8, volume: 68_000_000 },
      { date: '21/02', impressions: 389, orders: 12, volume: 95_000_000 },
      { date: '22/02', impressions: 478, orders: 15, volume: 112_000_000 },
      { date: '23/02', impressions: 356, orders: 6, volume: 48_000_000 },
      { date: '24/02', impressions: 501, orders: 18, volume: 142_000_000 },
      { date: '25/02', impressions: 445, orders: 14, volume: 108_000_000 },
      { date: '26/02', impressions: 520, orders: 20, volume: 158_000_000 },
    ],
    hourlyHeatmap: [
      { hour: 0, orders: 2 }, { hour: 1, orders: 1 }, { hour: 2, orders: 0 }, { hour: 3, orders: 0 },
      { hour: 4, orders: 1 }, { hour: 5, orders: 2 }, { hour: 6, orders: 4 }, { hour: 7, orders: 8 },
      { hour: 8, orders: 15 }, { hour: 9, orders: 22 }, { hour: 10, orders: 28 }, { hour: 11, orders: 24 },
      { hour: 12, orders: 18 }, { hour: 13, orders: 20 }, { hour: 14, orders: 26 }, { hour: 15, orders: 24 },
      { hour: 16, orders: 22 }, { hour: 17, orders: 18 }, { hour: 18, orders: 15 }, { hour: 19, orders: 20 },
      { hour: 20, orders: 25 }, { hour: 21, orders: 22 }, { hour: 22, orders: 12 }, { hour: 23, orders: 5 },
    ],
    paymentBreakdown: [
      { method: 'Vietcombank', count: 156, volume: 1_240_000_000 },
      { method: 'Momo', count: 118, volume: 940_000_000 },
    ],
    competitorComparison: [
      { metric: 'Giá', yours: 25360, avg: 25320, top: 25280 },
      { metric: 'Tỷ lệ HT (%)', yours: 94.8, avg: 89.2, top: 98.5 },
      { metric: 'Phản hồi (s)', yours: 45, avg: 120, top: 25 },
      { metric: 'Rating', yours: 4.8, avg: 4.2, top: 4.9 },
    ],
  },
  myad002: {
    adId: 'myad002',
    impressions: 8_432, clicks: 1_265,
    ordersCreated: 178, ordersCompleted: 165, ordersDisputed: 2, ordersCancelled: 11,
    totalVolume: 3_450_000_000, totalRevenue: 3_450_000,
    avgOrderValue: 20_909_091, avgResponseTime: 52, avgCompletionTime: 9.1,
    conversionRate: 14.1, completionRate: 92.7,
    rating: 4.6, reviewsCount: 112, ranking: 8, totalActiveAds: 428,
    dailyPerformance: [
      { date: '20/02', impressions: 285, orders: 5, volume: 105_000_000 },
      { date: '21/02', impressions: 312, orders: 8, volume: 168_000_000 },
      { date: '22/02', impressions: 298, orders: 7, volume: 147_000_000 },
      { date: '23/02', impressions: 276, orders: 4, volume: 84_000_000 },
      { date: '24/02', impressions: 345, orders: 10, volume: 210_000_000 },
      { date: '25/02', impressions: 330, orders: 9, volume: 189_000_000 },
      { date: '26/02', impressions: 368, orders: 12, volume: 252_000_000 },
    ],
    hourlyHeatmap: [
      { hour: 0, orders: 1 }, { hour: 1, orders: 0 }, { hour: 2, orders: 0 }, { hour: 3, orders: 0 },
      { hour: 4, orders: 0 }, { hour: 5, orders: 1 }, { hour: 6, orders: 3 }, { hour: 7, orders: 6 },
      { hour: 8, orders: 12 }, { hour: 9, orders: 18 }, { hour: 10, orders: 22 }, { hour: 11, orders: 20 },
      { hour: 12, orders: 14 }, { hour: 13, orders: 16 }, { hour: 14, orders: 20 }, { hour: 15, orders: 18 },
      { hour: 16, orders: 16 }, { hour: 17, orders: 14 }, { hour: 18, orders: 12 }, { hour: 19, orders: 16 },
      { hour: 20, orders: 20 }, { hour: 21, orders: 18 }, { hour: 22, orders: 8 }, { hour: 23, orders: 3 },
    ],
    paymentBreakdown: [
      { method: 'Vietcombank', count: 72, volume: 1_512_000_000 },
      { method: 'Techcombank', count: 58, volume: 1_218_000_000 },
      { method: 'Momo', count: 35, volume: 720_000_000 },
    ],
    competitorComparison: [
      { metric: 'Giá', yours: 25250, avg: 25320, top: 25280 },
      { metric: 'Tỷ lệ HT (%)', yours: 92.7, avg: 89.2, top: 98.5 },
      { metric: 'Phản hồi (s)', yours: 52, avg: 120, top: 25 },
      { metric: 'Rating', yours: 4.6, avg: 4.2, top: 4.9 },
    ],
  },
};

// ─── P2P My Ads ───────────────────────────────────────────────
export const P2P_MY_ADS: P2PAd[] = [
  { id: 'myad001', type: 'sell', asset: 'USDT', merchant: 'Tôi', merchantId: 'user001', merchantLevel: 1, merchantVerified: true, merchantJoinDate: '2024-01-01', completionRate: 95.0, completedOrders: 42, totalVolume30d: 28000, price: 25360, currency: 'VND', priceType: 'fixed', minLimit: 500000, maxLimit: 30000000, available: 3000, paymentMethods: ['Vietcombank', 'Momo'], avgResponseTime: '5 phút', isOnline: true, remarks: 'Xác nhận nhanh trong giờ hành chính.', tradingHours: '08:00 - 22:00', createdAt: '2024-02-15 10:00:00', status: 'active' },
  { id: 'myad002', type: 'buy', asset: 'USDT', merchant: 'Tôi', merchantId: 'user001', merchantLevel: 1, merchantVerified: true, merchantJoinDate: '2024-01-01', completionRate: 95.0, completedOrders: 42, totalVolume30d: 28000, price: 25250, currency: 'VND', priceType: 'floating', priceMargin: -0.4, minLimit: 1000000, maxLimit: 50000000, available: 5000, paymentMethods: ['Vietcombank', 'Techcombank', 'Momo'], avgResponseTime: '5 phút', isOnline: true, counterpartyRequirements: { minKycLevel: 1, minCompletedTrades: 5 }, createdAt: '2024-02-16 14:00:00', status: 'active' },
  { id: 'myad003', type: 'sell', asset: 'BTC', merchant: 'Tôi', merchantId: 'user001', merchantLevel: 1, merchantVerified: true, merchantJoinDate: '2024-01-01', completionRate: 95.0, completedOrders: 42, totalVolume30d: 28000, price: 1718000000, currency: 'VND', priceType: 'fixed', minLimit: 5000000, maxLimit: 100000000, available: 0.1, paymentMethods: ['Vietcombank'], avgResponseTime: '5 phút', isOnline: true, createdAt: '2024-02-18 09:00:00', status: 'paused' },
];

// ─── P2P Blacklist ────────────────────────────────────────────
export interface P2PBlacklistEntry {
  id: string;
  userId: string;
  username: string;
  reason: 'scam' | 'unresponsive' | 'fake_payment' | 'harassment' | 'other';
  reasonText?: string;
  blockedAt: string;
  orderId?: string;
  tradesBefore: number;
  completionRate: number;
  isVerified: boolean;
  badge?: 'elite' | 'pro';
}

export const P2P_BLACKLIST: P2PBlacklistEntry[] = [
  { id: 'bl001', userId: 'u_bad001', username: 'FakeTrader88', reason: 'fake_payment', reasonText: 'Gửi biên lai chuyển khoản giả, tiền không vào tài khoản.', blockedAt: '2024-02-18 14:30:00', orderId: 'p2p-fake001', tradesBefore: 3, completionRate: 45.0, isVerified: false },
  { id: 'bl002', userId: 'u_bad002', username: 'SlowPay_VN', reason: 'unresponsive', reasonText: 'Không phản hồi tin nhắn sau khi tạo đơn, để đơn hết hạn 3 lần liên tiếp.', blockedAt: '2024-02-15 09:12:00', orderId: 'p2p-slow001', tradesBefore: 7, completionRate: 28.6, isVerified: true },
  { id: 'bl003', userId: 'u_bad003', username: 'Scammer_X', reason: 'scam', reasonText: 'Cố gắng lừa đảo bằng cách yêu cầu giao dịch ngoài nền tảng.', blockedAt: '2024-02-10 21:45:00', tradesBefore: 1, completionRate: 0.0, isVerified: false },
  { id: 'bl004', userId: 'u_bad004', username: 'RudeTrader99', reason: 'harassment', reasonText: 'Ngôn ngữ xúc phạm và đe dọa trong chat.', blockedAt: '2024-01-28 16:20:00', orderId: 'p2p-rude001', tradesBefore: 12, completionRate: 75.0, isVerified: true, badge: 'pro' },
  { id: 'bl005', userId: 'u_bad005', username: 'GhostBuyer', reason: 'other', reasonText: 'Tạo đơn liên tục rồi hủy, gây phiền hà và khóa crypto trong escrow.', blockedAt: '2024-01-20 10:05:00', tradesBefore: 15, completionRate: 33.3, isVerified: false },
];

export const P2P_BLACKLIST_REASON_LABELS: Record<P2PBlacklistEntry['reason'], string> = {
  scam: 'Lừa đảo',
  unresponsive: 'Không phản hồi',
  fake_payment: 'Thanh toán giả',
  harassment: 'Quấy rối',
  other: 'Lý do khác',
};

export const P2P_BLACKLIST_REASON_COLORS: Record<P2PBlacklistEntry['reason'], string> = {
  scam: '#EF4444',
  unresponsive: '#F59E0B',
  fake_payment: '#EF4444',
  harassment: '#8B5CF6',
  other: '#6B7280',
};

// ─── Deposit Network Type ─────────────────────────────────────
export interface DepositNetwork {
  id: string;
  name: string;
  fee: string;
  minDeposit: number;
  address: string;
  arrivalTime: string;
  confirmations: number;
  /** If present, this network requires a memo/tag for deposits */
  memo?: string;
  /** Display label for memo field: "Memo", "Tag", "Destination Tag" */
  memoLabel?: string;
}

// ─── Deposit Networks ─────────────────────────────────────────
export const DEPOSIT_NETWORKS: Record<string, DepositNetwork[]> = {
  USDT: [
    { id: 'trc20', name: 'TRC20 (TRON)', fee: 'Miễn phí', minDeposit: 1, address: 'TQnKxxx4d8eRh9Kf2Lz5mNp7Yz123', arrivalTime: '~3 phút', confirmations: 1 },
    { id: 'erc20', name: 'ERC20 (Ethereum)', fee: 'Miễn phí', minDeposit: 10, address: '0x1a2b3c4d5e6f7890abcdef1234567890Abc456', arrivalTime: '~10 phút', confirmations: 12 },
    { id: 'bep20', name: 'BEP20 (BSC)', fee: 'Miễn phí', minDeposit: 1, address: '0x9z8y7x6w5v4u3t2s1r0qponmlkjihgDef789', arrivalTime: '~5 phút', confirmations: 15 },
  ],
  BTC: [
    { id: 'btc', name: 'Bitcoin (BTC)', fee: 'Miễn phí', minDeposit: 0.0001, address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0sW8', arrivalTime: '~30 phút', confirmations: 2 },
  ],
  ETH: [
    { id: 'erc20', name: 'ERC20 (Ethereum)', fee: 'Miễn phí', minDeposit: 0.01, address: '0x2b3c4d5e6f7890abcdef1234567890abGhi012', arrivalTime: '~10 phút', confirmations: 12 },
  ],
  BNB: [
    { id: 'bep20', name: 'BEP20 (BSC)', fee: 'Miễn phí', minDeposit: 0.01, address: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f56', arrivalTime: '~5 phút', confirmations: 15 },
    { id: 'bep2', name: 'BEP2 (Beacon Chain)', fee: 'Miễn phí', minDeposit: 0.01, address: 'bnb1grpf0955h0efa8603ukn5g8vlzx6awd3mfe7q2', arrivalTime: '~1 phút', confirmations: 1, memo: '104857923', memoLabel: 'Memo' },
  ],
  XRP: [
    { id: 'xrp', name: 'Ripple (XRP)', fee: 'Miễn phí', minDeposit: 1, address: 'rN7UqJdShKzAJx62h3bnKFWRcuSMmTGx9V', arrivalTime: '~5 giây', confirmations: 1, memo: '2847561', memoLabel: 'Destination Tag' },
  ],
};

// ─── Withdraw Network Type ────────────────────────────────────
export interface WithdrawNetwork {
  id: string;
  name: string;
  fee: number;
  minWithdraw: number;
  maxWithdraw: number;
  /** If true, this network requires memo/tag for withdrawals */
  requiresMemo?: boolean;
  /** Display label for memo field: "Memo", "Tag", "Destination Tag" */
  memoLabel?: string;
  /** Placeholder text for memo input */
  memoPlaceholder?: string;
}

// ─── Withdraw Networks ────────────────────────────────────────
export const WITHDRAW_NETWORKS: Record<string, WithdrawNetwork[]> = {
  USDT: [
    { id: 'trc20', name: 'TRC20 (TRON)', fee: 1, minWithdraw: 5, maxWithdraw: 500000 },
    { id: 'erc20', name: 'ERC20 (Ethereum)', fee: 15, minWithdraw: 20, maxWithdraw: 500000 },
    { id: 'bep20', name: 'BEP20 (BSC)', fee: 0.5, minWithdraw: 5, maxWithdraw: 500000 },
  ],
  BTC: [
    { id: 'btc', name: 'Bitcoin (BTC)', fee: 0.0005, minWithdraw: 0.001, maxWithdraw: 10 },
  ],
  ETH: [
    { id: 'erc20', name: 'ERC20 (Ethereum)', fee: 0.003, minWithdraw: 0.01, maxWithdraw: 100 },
  ],
  BNB: [
    { id: 'bep20', name: 'BEP20 (BSC)', fee: 0.005, minWithdraw: 0.02, maxWithdraw: 1000 },
    { id: 'bep2', name: 'BEP2 (Beacon Chain)', fee: 0.01, minWithdraw: 0.1, maxWithdraw: 1000, requiresMemo: true, memoLabel: 'Memo', memoPlaceholder: 'Nhập Memo (bắt buộc)' },
  ],
  XRP: [
    { id: 'xrp', name: 'Ripple (XRP)', fee: 0.25, minWithdraw: 1, maxWithdraw: 100000, requiresMemo: true, memoLabel: 'Destination Tag', memoPlaceholder: 'Nhập Destination Tag (bắt buộc)' },
  ],
};

// ─── User Profile ─────────────────────────────────────────────
export const USER_PROFILE = {
  id: 'usr001',
  email: 'nguyenvana@email.com',
  phone: '+84 912 345 678',
  fullName: 'Nguyễn Văn A',
  username: 'nguyenvana',
  avatar: null,
  kycLevel: 2,
  kycStatus: 'verified' as const,
  referralCode: 'VITTA-A2B3C',
  vipLevel: 1,
  joinDate: '2023-08-15',
  has2FA: true,
  totalBalance: 54276.79,
};

// ─── Notifications (banner) ───────────────────────────────────
export const ANNOUNCEMENTS = [
  { id: 'ann1', text: '🎉 Phí giao dịch 0% cho BTC/USDT trong 7 ngày!', link: '#' },
  { id: 'ann2', text: '⚡ Ra mắt tính năng P2P — Mua bán USDT bằng VND ngay!', link: '#' },
  { id: 'ann3', text: '🔒 Tăng cường bảo mật — Bật 2FA để bảo vệ tài khoản', link: '#' },
];

// ─── Notifications ────────────────────────────────────────────
export interface Notification {
  id: string;
  type: 'trade' | 'deposit' | 'withdraw' | 'security' | 'system' | 'p2p' | 'price_alert' | 'referral' | 'arena';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  icon?: string;
  iconColor?: string;
  actionUrl?: string;
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: 'notif001',
    type: 'trade',
    title: 'Lệnh đã khớp',
    message: 'Lệnh mua 0.1 BTC @ $67,543.21 đã được thực hiện thành công',
    time: '2 phút trước',
    isRead: false,
    icon: '✅',
    iconColor: '#10B981',
    actionUrl: '/trade/orders',
  },
  {
    id: 'notif002',
    type: 'price_alert',
    title: 'Cảnh báo giá',
    message: 'ETH đã vượt mức $3,600 USDT',
    time: '15 phút trước',
    isRead: false,
    icon: '🔔',
    iconColor: '#F59E0B',
    actionUrl: '/pair/ethusdt',
  },
  {
    id: 'notif003',
    type: 'deposit',
    title: 'Nạp tiền thành công',
    message: '5,000 USDT đã được nạp vào tài khoản của bạn',
    time: '1 giờ trước',
    isRead: false,
    icon: '↓',
    iconColor: '#3B82F6',
    actionUrl: '/wallet',
  },
  {
    id: 'notif004',
    type: 'security',
    title: 'Đăng nhập mới',
    message: 'Thiết bị mới đăng nhập từ Hồ Chí Minh, Việt Nam',
    time: '2 giờ trước',
    isRead: true,
    icon: '🔐',
    iconColor: '#EF4444',
    actionUrl: '/profile/activity',
  },
  {
    id: 'notif005',
    type: 'p2p',
    title: 'P2P: Đơn hàng mới',
    message: 'CryptoKing_VN đã chấp nhận đơn P2P của bạn',
    time: '3 giờ trước',
    isRead: true,
    icon: '🤝',
    iconColor: '#10B981',
    actionUrl: '/p2p/order/p2p001',
  },
  {
    id: 'notif006',
    type: 'system',
    title: 'Bảo trì hệ thống',
    message: 'Hệ thống sẽ bảo trì vào 3h sáng ngày 24/02 (dự kiến 30 phút)',
    time: '1 ngày trước',
    isRead: true,
    icon: '⚙️',
    iconColor: '#8B95B3',
    actionUrl: '/news',
  },
  {
    id: 'notif007',
    type: 'withdraw',
    title: 'Rút tiền đang xử lý',
    message: '1,000 USDT đang được xử lý, thời gian dự kiến 10 phút',
    time: '1 ngày trước',
    isRead: true,
    icon: '↑',
    iconColor: '#8B5CF6',
    actionUrl: '/wallet/history',
  },
  {
    id: 'notif008',
    type: 'referral',
    title: 'Bạn bè hoàn tất KYC',
    message: 'Võ Thị L. đã xác minh danh tính thành công. Bạn nhận được 5.00 USDT thưởng KYC!',
    time: '2 ngày trước',
    isRead: false,
    icon: '🎁',
    iconColor: '#F59E0B',
    actionUrl: '/referral/rewards',
  },
  {
    id: 'notif009',
    type: 'referral',
    title: 'Hoa hồng giới thiệu',
    message: 'Bạn nhận được +$22.30 USDT hoa hồng từ giao dịch của Hoàng Đạt V.',
    time: '2 ngày trước',
    isRead: false,
    icon: '💰',
    iconColor: '#10B981',
    actionUrl: '/referral/rewards',
  },
  {
    id: 'notif010',
    type: 'referral',
    title: 'Bạn bè mới đăng ký',
    message: 'Bùi Anh K. đã đăng ký qua link giới thiệu của bạn. Nhắc họ hoàn tất KYC để nhận thưởng!',
    time: '3 ngày trước',
    isRead: true,
    icon: '👥',
    iconColor: '#3B82F6',
    actionUrl: '/referral/history',
  },
  {
    id: 'notif011',
    type: 'arena',
    title: 'Challenge hoàn tất!',
    message: 'BTC $70K? — Tuần 8 đã kết thúc. Bạn đạt hạng #3 và nhận được 300 pts! Xem chi tiết.',
    time: '30 phút trước',
    isRead: false,
    icon: '🏆',
    iconColor: '#F59E0B',
    actionUrl: '/arena/challenge/ch001',
  },
  {
    id: 'notif012',
    type: 'arena',
    title: 'Có người tham gia phòng',
    message: 'TraderX vừa tham gia "Fed Rate Predict — March 2026". Phòng còn 33 slots trống.',
    time: '1 giờ trước',
    isRead: false,
    icon: '👥',
    iconColor: '#3B82F6',
    actionUrl: '/arena/challenge/room003',
  },
  {
    id: 'notif013',
    type: 'arena',
    title: 'Arena Points nhận được',
    message: 'Bạn nhận 50 pts từ check-in hàng ngày và 120 pts từ khối lượng giao dịch. Tổng: +170 pts.',
    time: '5 giờ trước',
    isRead: true,
    icon: '⚡',
    iconColor: '#8B5CF6',
    actionUrl: '/arena/points',
  },
  {
    id: 'notif014',
    type: 'arena',
    title: 'Challenge sắp hết hạn',
    message: 'Altcoin Battle Royale kết thúc trong 2 giờ. Team SOL đang dẫn đầu!',
    time: '6 giờ trước',
    isRead: true,
    icon: '⏰',
    iconColor: '#EF4444',
    actionUrl: '/arena/challenge/room002',
  },
  {
    id: 'notif015',
    type: 'arena',
    title: 'Mode mới được tạo',
    message: 'CryptoMaster_VN vừa tạo mode "ETH Merge Anniversary Predict". Hãy thử ngay!',
    time: '1 ngày trước',
    isRead: true,
    icon: '🎯',
    iconColor: '#10B981',
    actionUrl: '/arena/mode/mode001',
  },
];

// ─── Price Alerts ─────────────────────────────────────────────
export interface PriceAlert {
  id: string;
  pairId: string;
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

export const PRICE_ALERTS: PriceAlert[] = [
  { id: 'alert001', pairId: 'ethusdt', symbol: 'ETH/USDT', condition: 'above', targetPrice: 3600, currentPrice: 3521.45, isActive: true, createdAt: '2024-02-20 10:00:00' },
  { id: 'alert002', pairId: 'btcusdt', symbol: 'BTC/USDT', condition: 'below', targetPrice: 65000, currentPrice: 67543.21, isActive: true, createdAt: '2024-02-19 14:30:00' },
  { id: 'alert003', pairId: 'solusdt', symbol: 'SOL/USDT', condition: 'above', targetPrice: 180, currentPrice: 178.32, isActive: true, createdAt: '2024-02-18 09:15:00' },
  { id: 'alert004', pairId: 'bnbusdt', symbol: 'BNB/USDT', condition: 'above', targetPrice: 420, currentPrice: 412.87, isActive: false, createdAt: '2024-02-15 16:20:00', triggeredAt: '2024-02-17 11:30:00' },
];

// ─── Watchlist ────────────────────────────────────────────────
export interface WatchlistItem {
  id: string;
  pairId: string;
  addedAt: string;
  note?: string;
}

export const WATCHLIST: WatchlistItem[] = [
  { id: 'watch001', pairId: 'btcusdt', addedAt: '2024-02-01 10:00:00' },
  { id: 'watch002', pairId: 'ethusdt', addedAt: '2024-02-05 14:30:00', note: 'Chờ mốc $3800' },
  { id: 'watch003', pairId: 'solusdt', addedAt: '2024-02-10 09:15:00' },
];

// ─── Activity Log ─────────────────────────────────────────────
export interface ActivityLog {
  id: string;
  type: 'login' | 'logout' | 'password_change' | '2fa_enable' | '2fa_disable' | 'kyc_submit' | 'api_create' | 'api_delete';
  description: string;
  ipAddress: string;
  device: string;
  location: string;
  status: 'success' | 'failed' | 'suspicious';
  timestamp: string;
}

export const ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'act001', type: 'login', description: 'Đăng nhập thành công', ipAddress: '113.161.88.123', device: 'Chrome 121 • Windows 10', location: 'Hồ Chí Minh, Việt Nam', status: 'success', timestamp: '2024-02-23 09:30:15' },
  { id: 'act002', type: 'login', description: 'Đăng nhập thành công', ipAddress: '113.161.88.123', device: 'Chrome Mobile • Android 14', location: 'Hồ Chí Minh, Việt Nam', status: 'success', timestamp: '2024-02-22 14:20:42' },
  { id: 'act003', type: 'password_change', description: 'Đổi mật khẩu', ipAddress: '113.161.88.123', device: 'Chrome 121 • Windows 10', location: 'Hồ Chí Minh, Việt Nam', status: 'success', timestamp: '2024-02-21 10:15:33' },
  { id: 'act004', type: 'login', description: 'Đăng nhập thất bại (sai mật khẩu)', ipAddress: '42.118.23.67', device: 'Safari • iOS 17', location: 'Hà Nội, Việt Nam', status: 'failed', timestamp: '2024-02-20 23:45:12' },
  { id: 'act005', type: '2fa_enable', description: 'Bật xác thực 2 lớp', ipAddress: '113.161.88.123', device: 'Chrome 121 • Windows 10', location: 'Hồ Chí Minh, Việt Nam', status: 'success', timestamp: '2024-02-20 08:00:00' },
  { id: 'act006', type: 'login', description: 'Đăng nhập từ thiết bị mới', ipAddress: '171.224.180.55', device: 'Unknown • Unknown', location: 'Singapore', status: 'suspicious', timestamp: '2024-02-18 03:22:11' },
  { id: 'act007', type: 'kyc_submit', description: 'Nộp hồ sơ KYC cấp 2', ipAddress: '113.161.88.123', device: 'Chrome 121 • Windows 10', location: 'Hồ Chí Minh, Việt Nam', status: 'success', timestamp: '2024-02-15 16:30:00' },
];

// ─── Support Tickets ──────────────────────────────────────────
export interface SupportTicket {
  id: string;
  subject: string;
  category: 'technical' | 'trading' | 'deposit' | 'withdraw' | 'kyc' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'support';
    text: string;
    time: string;
    attachments?: string[];
  }>;
}

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'ticket001',
    subject: 'Rút USDT bị pending quá lâu',
    category: 'withdraw',
    status: 'in_progress',
    priority: 'high',
    description: 'Tôi đã rút 1000 USDT từ 2 giờ trước nhưng vẫn chưa nhận được',
    createdAt: '2024-02-23 07:30:00',
    updatedAt: '2024-02-23 08:15:00',
    messages: [
      { id: 'msg001', sender: 'user', text: 'Tôi đã rút 1000 USDT từ 2 giờ trước nhưng vẫn chưa nhận được', time: '07:30' },
      { id: 'msg002', sender: 'support', text: 'Xin chào! Chúng tôi đang kiểm tra giao dịch của bạn. Vui lòng cung cấp mã giao dịch (TxID).', time: '08:15' },
    ],
  },
  {
    id: 'ticket002',
    subject: 'Không thể đăng nhập vào tài khoản',
    category: 'technical',
    status: 'resolved',
    priority: 'urgent',
    description: 'Tôi nhập đúng email/password nhưng vẫn không đăng nhập được',
    createdAt: '2024-02-22 16:00:00',
    updatedAt: '2024-02-22 18:30:00',
    messages: [
      { id: 'msg003', sender: 'user', text: 'Tôi nhập đúng email/password nhưng vẫn không đăng nhập được', time: '16:00' },
      { id: 'msg004', sender: 'support', text: 'Vui lòng thử reset mật khẩu qua email hoặc tắt 2FA nếu bạn mất thiết bị.', time: '16:30' },
      { id: 'msg005', sender: 'user', text: 'Đã reset mật khẩu và đăng nhập được rồi. Cảm ơn!', time: '18:30' },
    ],
  },
];

// ─── News & Announcements ─────────────────────────────────────
export interface NewsArticle {
  id: string;
  type: 'maintenance' | 'new_feature' | 'promotion' | 'security' | 'listing' | 'general';
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  publishedAt: string;
  isPinned: boolean;
  tags: string[];
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news001',
    type: 'promotion',
    title: 'Phí giao dịch 0% cho BTC/USDT',
    summary: 'Miễn phí giao dịch hoàn toàn cho cặp BTC/USDT trong 7 ngày!',
    content: 'Chào mừng sự kiện đặc biệt! Từ ngày 23/02 đến 29/02, VitTrade miễn phí 100% phí giao dịch (maker + taker) cho cặp BTC/USDT. Đây là cơ hội tuyệt vời để các trader tối ưu lợi nhuận.\n\nĐiều kiện:\n- Áp dụng cho tất cả người dùng\n- Không giới hạn khối lượng giao dịch\n- Có hiệu lực từ 23/02 00:00 UTC+7\n\nHãy tận dụng cơ hội này!',
    publishedAt: '2024-02-23 00:00:00',
    isPinned: true,
    tags: ['Khuyến mãi', 'BTC', 'Phí'],
  },
  {
    id: 'news002',
    type: 'new_feature',
    title: 'Ra mắt tính năng P2P Trading',
    summary: 'Mua bán USDT trực tiếp bằng VND với người dùng khác — An toàn, nhanh chóng!',
    content: 'VitTrade chính thức ra mắt tính năng P2P Trading, cho phép bạn:\n\n✅ Mua/bán USDT trực tiếp với người dùng khác\n✅ Thanh toán bằng VND qua Vietcombank, Momo, ZaloPay\n✅ Tỷ giá cạnh tranh, không phí giao dịch\n✅ Bảo vệ bởi hệ thống Escrow an toàn\n\nCách sử dụng:\n1. Vào mục P2P\n2. Chọn quảng cáo phù hợp\n3. Thực hiện giao dịch và chuyển khoản\n4. Nhận USDT ngay sau khi người bán xác nhận\n\nTrải nghiệm ngay hôm nay!',
    publishedAt: '2024-02-22 10:00:00',
    isPinned: true,
    tags: ['Tính năng mới', 'P2P'],
  },
  {
    id: 'news003',
    type: 'listing',
    title: 'Listing mới: MATIC/USDT',
    summary: 'Polygon (MATIC) chính thức được niêm yết trên VitTrade',
    content: 'VitTrade vui mừng thông báo niêm yết MATIC/USDT!\n\n📊 Thông tin giao dịch:\n- Cặp: MATIC/USDT\n- Thời gian mở giao dịch: 20/02/2024 10:00 UTC+7\n- Phí: Maker 0.1% / Taker 0.1%\n\nPolygon là giải pháp Layer 2 hàng đầu cho Ethereum, mang đến tốc độ nhanh và phí thấp.\n\nBắt đầu giao dịch ngay!',
    publishedAt: '2024-02-20 10:00:00',
    isPinned: false,
    tags: ['Niêm yết', 'MATIC', 'Polygon'],
  },
  {
    id: 'news004',
    type: 'maintenance',
    title: 'Bảo trì hệ thống định kỳ',
    summary: 'Hệ thống sẽ bảo trì vào 3h sáng ngày 24/02 (dự kiến 30 phút)',
    content: '⚠️ Thông báo bảo trì hệ thống\n\nThời gian: 24/02/2024 03:00 - 03:30 UTC+7\n\nTrong thời gian bảo trì:\n- Không thể đăng nhập hoặc giao dịch\n- Nạp/rút tiền tạm ngưng\n- API trading không khả dụng\n\nLưu ý:\n- Đóng tất cả vị thế trước khi bảo trì\n- Rút tiền trước 02:00 để tránh delay\n\nCảm ơn sự thông cảm của bạn!',
    publishedAt: '2024-02-21 15:00:00',
    isPinned: false,
    tags: ['Bảo trì', 'Hệ thống'],
  },
  {
    id: 'news005',
    type: 'security',
    title: 'Tăng cường bảo mật tài khoản',
    summary: 'Khuyến nghị kích hoạt 2FA để bảo vệ tài khoản của bạn',
    content: '🔐 Bảo m��t tài khoản quan trọng hơn bao giờ hết!\n\nVitTrade khuyến nghị tất cả người dùng:\n\n1. ✅ Kích hoạt xác thực 2 lớp (2FA)\n2. ✅ Sử dụng mật khẩu mạnh (8+ ký tự, chữ hoa, số, ký tự đặc biệt)\n3. ✅ Không chia sẻ mật khẩu với bất kỳ ai\n4. ✅ Kiểm tra lịch sử đăng nhập thường xuyên\n5. ✅ Cẩn thận với email/link lừa đảo\n\nNếu phát hiện hoạt động đáng ngờ, liên hệ support ngay!\n\nBảo vệ tài sản của bạn bắt đầu từ bảo mật!',
    publishedAt: '2024-02-18 09:00:00',
    isPinned: false,
    tags: ['Bảo mật', '2FA'],
  },
];

// ─── Trusted Devices ──────────────────────────────────────────
export interface TrustedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
  isTrusted: boolean;
  loginAt: string;
}

export const TRUSTED_DEVICES: TrustedDevice[] = [
  { id: 'dev001', name: 'Chrome Desktop', type: 'desktop', browser: 'Chrome 121', os: 'Windows 11', ip: '113.161.88.123', location: 'Hồ Chí Minh, VN', lastActive: 'Đang hoạt động', isCurrent: true, isTrusted: true, loginAt: '2024-02-23 09:30' },
  { id: 'dev002', name: 'iPhone 15 Pro', type: 'mobile', browser: 'Safari 17', os: 'iOS 17.3', ip: '113.161.88.123', location: 'Hồ Chí Minh, VN', lastActive: '2 giờ trước', isCurrent: false, isTrusted: true, loginAt: '2024-02-22 14:20' },
  { id: 'dev003', name: 'MacBook Air', type: 'desktop', browser: 'Safari 17', os: 'macOS Sonoma', ip: '42.118.23.67', location: 'Hà Nội, VN', lastActive: '3 ngày trước', isCurrent: false, isTrusted: true, loginAt: '2024-02-20 08:15' },
  { id: 'dev004', name: 'Unknown Device', type: 'mobile', browser: 'Chrome Mobile', os: 'Android 14', ip: '171.224.180.55', location: 'Singapore', lastActive: '5 ngày trước', isCurrent: false, isTrusted: false, loginAt: '2024-02-18 03:22' },
];

// ─── Help Center ──────────────────────────────────────────────
export interface HelpArticle {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  summary: string;
  views: number;
}

export const HELP_CATEGORIES = [
  { id: 'getting-started', name: 'Bắt đầu', icon: '🚀', count: 12 },
  { id: 'trading', name: 'Giao dịch', icon: '📊', count: 18 },
  { id: 'deposit-withdraw', name: 'Nạp/Rút', icon: '💰', count: 15 },
  { id: 'security', name: 'Bảo mật', icon: '🔐', count: 10 },
  { id: 'p2p', name: 'P2P Trading', icon: '🤝', count: 8 },
  { id: 'kyc', name: 'Xác minh KYC', icon: '📋', count: 6 },
  { id: 'fees', name: 'Phí & Hạn mức', icon: '💎', count: 7 },
  { id: 'api', name: 'API Trading', icon: '⚡', count: 5 },
];

export const HELP_ARTICLES: HelpArticle[] = [
  { id: 'h001', category: 'getting-started', categoryIcon: '🚀', title: 'Cách tạo tài khoản VitTrade', summary: 'Hướng dẫn đăng ký tài khoản từ A-Z, bao gồm xác minh email và thiết lập bảo mật.', views: 15420 },
  { id: 'h002', category: 'getting-started', categoryIcon: '🚀', title: 'Hướng dẫn nạp tiền lần đầu', summary: 'Các bước nạp USDT, BTC, ETH vào tài khoản VitTrade một cách an toàn.', views: 12300 },
  { id: 'h003', category: 'trading', categoryIcon: '📊', title: 'Lệnh Limit vs Market là gì?', summary: 'So sánh chi tiết giữa lệnh giới hạn và lệnh thị trường, khi nào nên dùng loại nào.', views: 23100 },
  { id: 'h004', category: 'trading', categoryIcon: '📊', title: 'Cách đặt Stop-Loss và Take-Profit', summary: 'Hướng dẫn thiết lập cắt lỗ và chốt lời tự động để quản lý rủi ro.', views: 18900 },
  { id: 'h005', category: 'deposit-withdraw', categoryIcon: '💰', title: 'Vì sao giao dịch rút tiền bị pending?', summary: 'Các nguyên nhân phổ biến khiến lệnh rút tiền chưa được xử lý và cách khắc phục.', views: 31200 },
  { id: 'h006', category: 'security', categoryIcon: '🔐', title: 'Cách bật xác thực 2 lớp (2FA)', summary: 'Hướng dẫn cài đặt Google Authenticator để bảo vệ tài khoản.', views: 27800 },
  { id: 'h007', category: 'p2p', categoryIcon: '🤝', title: 'Quy trình giao dịch P2P', summary: 'Hướng dẫn mua/bán USDT qua P2P từ đặt lệnh đến nhận coin.', views: 14500 },
  { id: 'h008', category: 'fees', categoryIcon: '💎', title: 'Bảng phí giao dịch VitTrade', summary: 'Chi tiết phí maker/taker theo cấp VIP và cách giảm phí giao dịch.', views: 19400 },
];

// ─── Copy Trading ─────────────────────────────────────────────
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
  riskLevel: 'low' | 'medium' | 'high';
}

export const COPY_TRADERS: CopyTrader[] = [
  { id: 'ct001', name: 'AlphaHunter_VN', avatar: 'A', winRate: 78.5, totalPnl: 125430, totalPnlPct: 342.5, aum: 2450000, copiers: 1243, maxCopiers: 2000, sharpeRatio: 2.31, maxDrawdown: -12.4, totalTrades: 4521, avgHoldingTime: '4.2h', weeklyPnl: [2.1, -0.8, 3.4, 1.2, -0.3, 2.8, 1.5], tags: ['Top ROI', 'Scalper'], isFollowing: false, riskLevel: 'medium' },
  { id: 'ct002', name: 'SteadyGains_Pro', avatar: 'S', winRate: 82.3, totalPnl: 89200, totalPnlPct: 187.2, aum: 5120000, copiers: 3421, maxCopiers: 5000, sharpeRatio: 3.12, maxDrawdown: -8.1, totalTrades: 2890, avgHoldingTime: '12h', weeklyPnl: [0.8, 1.1, 0.5, 1.3, 0.7, 0.9, 1.0], tags: ['Stable', 'Swing'], isFollowing: true, riskLevel: 'low' },
  { id: 'ct003', name: 'RiskMaster_88', avatar: 'R', winRate: 65.2, totalPnl: 234100, totalPnlPct: 567.8, aum: 890000, copiers: 567, maxCopiers: 1000, sharpeRatio: 1.85, maxDrawdown: -28.3, totalTrades: 8934, avgHoldingTime: '1.5h', weeklyPnl: [5.2, -3.1, 8.4, -2.1, 6.3, -1.8, 4.7], tags: ['High ROI', 'Aggressive'], isFollowing: false, riskLevel: 'high' },
  { id: 'ct004', name: 'CryptoSensei', avatar: 'C', winRate: 71.8, totalPnl: 67890, totalPnlPct: 156.3, aum: 1890000, copiers: 892, maxCopiers: 1500, sharpeRatio: 2.67, maxDrawdown: -15.2, totalTrades: 3456, avgHoldingTime: '8h', weeklyPnl: [1.5, 2.0, -0.5, 1.8, 1.2, 2.3, 0.9], tags: ['Balanced', 'BTC Focus'], isFollowing: false, riskLevel: 'medium' },
  { id: 'ct005', name: 'WhaleWatcher', avatar: 'W', winRate: 74.1, totalPnl: 312500, totalPnlPct: 423.1, aum: 8900000, copiers: 4890, maxCopiers: 5000, sharpeRatio: 2.89, maxDrawdown: -10.5, totalTrades: 1234, avgHoldingTime: '3d', weeklyPnl: [0.3, 0.5, -0.1, 0.8, 0.2, 0.6, 0.4], tags: ['Top AUM', 'Long-term'], isFollowing: false, riskLevel: 'low' },
];

// ─── Rewards / Tasks ─────────────────────────────────────────
export interface RewardTask {
  id: string;
  title: string;
  description: string;
  reward: string;
  rewardType: 'voucher' | 'token' | 'fee_rebate' | 'badge';
  progress: number;
  maxProgress: number;
  status: 'active' | 'completed' | 'claimed' | 'expired';
  category: 'daily' | 'weekly' | 'achievement' | 'special';
  expiresAt?: string;
  icon: string;
}

export const REWARD_TASKS: RewardTask[] = [
  { id: 'task001', title: 'Đăng nhập hàng ngày', description: 'Đăng nhập mỗi ngày để nhận thưởng', reward: '0.5 USDT', rewardType: 'token', progress: 1, maxProgress: 1, status: 'completed', category: 'daily', icon: '📅' },
  { id: 'task002', title: 'Giao dịch lần đầu', description: 'Thực hiện giao dịch đầu tiên trên VitTrade', reward: '5 USDT', rewardType: 'voucher', progress: 1, maxProgress: 1, status: 'claimed', category: 'achievement', icon: '🎯' },
  { id: 'task003', title: 'Giao dịch 5 lệnh', description: 'Hoàn thành 5 lệnh giao dịch trong ngày', reward: '2 USDT', rewardType: 'token', progress: 3, maxProgress: 5, status: 'active', category: 'daily', expiresAt: '2026-03-02', icon: '📊' },
  { id: 'task004', title: 'Nạp tiền lần đầu', description: 'Nạp tối thiểu $100 vào tài khoản', reward: '10 USDT', rewardType: 'voucher', progress: 1, maxProgress: 1, status: 'claimed', category: 'achievement', icon: '💰' },
  { id: 'task005', title: 'Mời bạn bè', description: 'Mời 3 bạn bè đăng ký VitTrade tuần này', reward: '15 USDT', rewardType: 'token', progress: 1, maxProgress: 3, status: 'active', category: 'weekly', expiresAt: '2026-03-04', icon: '👥' },
  { id: 'task006', title: 'Bật 2FA', description: 'Kích hoạt xác thực 2 lớp cho tài khoản', reward: 'Badge Bảo mật', rewardType: 'badge', progress: 1, maxProgress: 1, status: 'claimed', category: 'achievement', icon: '🔐' },
  { id: 'task007', title: 'KYC Level 2', description: 'Hoàn tất xác minh danh tính cấp 2', reward: '20 USDT', rewardType: 'voucher', progress: 1, maxProgress: 1, status: 'claimed', category: 'achievement', icon: '✅' },
  { id: 'task008', title: 'Volume tuần $10K', description: 'Đạt khối lượng giao dịch $10,000 trong tuần', reward: 'Giảm 50% phí 7 ngày', rewardType: 'fee_rebate', progress: 6420, maxProgress: 10000, status: 'active', category: 'weekly', expiresAt: '2026-03-05', icon: '🔥' },
  { id: 'task009', title: 'Streak 7 ngày', description: 'Đăng nhập 7 ngày liên tiếp', reward: '5 USDT', rewardType: 'token', progress: 5, maxProgress: 7, status: 'active', category: 'special', expiresAt: '2026-03-03', icon: '⚡' },
  { id: 'task010', title: 'Giao dịch P2P đầu tiên', description: 'Hoàn thành 1 giao dịch P2P', reward: '3 USDT', rewardType: 'voucher', progress: 1, maxProgress: 1, status: 'completed', category: 'achievement', icon: '🤝' },
];

// ─── Savings Products ─────────────────────────────────────────
export interface SavingsProduct {
  id: string;
  asset: string;
  name: string;
  type: 'flexible' | 'locked';
  apy: number;
  apyBonus?: number;
  minAmount: number;
  lockDays: number | null;
  totalSubscribed: string;
  remainingQuota: string;
  color: string;
  isHot?: boolean;
  isNew?: boolean;
  autoSubscribe?: boolean;
}

export const SAVINGS_PRODUCTS: SavingsProduct[] = [
  { id: 'sav001', asset: 'USDT', name: 'USDT Linh hoạt', type: 'flexible', apy: 4.5, minAmount: 1, lockDays: null, totalSubscribed: '$125M', remainingQuota: 'Không giới hạn', color: '#26A17B', isHot: true, autoSubscribe: true },
  { id: 'sav002', asset: 'USDT', name: 'USDT Cố định 30D', type: 'locked', apy: 7.2, apyBonus: 8.5, minAmount: 100, lockDays: 30, totalSubscribed: '$45M', remainingQuota: '$5M', color: '#26A17B', isNew: true },
  { id: 'sav003', asset: 'USDT', name: 'USDT Cố định 90D', type: 'locked', apy: 9.8, minAmount: 500, lockDays: 90, totalSubscribed: '$28M', remainingQuota: '$2M', color: '#26A17B' },
  { id: 'sav004', asset: 'BTC', name: 'BTC Linh hoạt', type: 'flexible', apy: 1.8, minAmount: 0.0001, lockDays: null, totalSubscribed: '1,240 BTC', remainingQuota: 'Không giới hạn', color: '#F7931A' },
  { id: 'sav005', asset: 'BTC', name: 'BTC Cố định 60D', type: 'locked', apy: 3.5, apyBonus: 4.2, minAmount: 0.001, lockDays: 60, totalSubscribed: '450 BTC', remainingQuota: '50 BTC', color: '#F7931A', isHot: true },
  { id: 'sav006', asset: 'ETH', name: 'ETH Linh hoạt', type: 'flexible', apy: 2.1, minAmount: 0.01, lockDays: null, totalSubscribed: '18,500 ETH', remainingQuota: 'Không giới hạn', color: '#627EEA' },
  { id: 'sav007', asset: 'SOL', name: 'SOL Cố định 30D', type: 'locked', apy: 6.5, minAmount: 1, lockDays: 30, totalSubscribed: '120K SOL', remainingQuota: '10K SOL', color: '#9945FF', isNew: true },
];

// ─── Margin Positions ─────────────────────────────────────────
export interface MarginPosition {
  id: string;
  pair: string;
  side: 'long' | 'short';
  mode: 'cross' | 'isolated';
  leverage: number;
  entryPrice: number;
  markPrice: number;
  size: number;
  margin: number;
  pnl: number;
  pnlPct: number;
  liquidationPrice: number;
  marginRatio: number;
  createdAt: string;
}

export const MARGIN_POSITIONS: MarginPosition[] = [
  { id: 'mg001', pair: 'BTC/USDT', side: 'long', mode: 'cross', leverage: 5, entryPrice: 65200, markPrice: 67543.21, size: 0.15, margin: 1956, pnl: 351.48, pnlPct: 17.97, liquidationPrice: 52160, marginRatio: 12.5, createdAt: '2024-02-20 09:30' },
  { id: 'mg002', pair: 'ETH/USDT', side: 'short', mode: 'isolated', leverage: 10, entryPrice: 3620, markPrice: 3521.45, size: 2.0, margin: 724, pnl: 197.10, pnlPct: 27.22, liquidationPrice: 3982, marginRatio: 8.3, createdAt: '2024-02-21 14:15' },
  { id: 'mg003', pair: 'SOL/USDT', side: 'long', mode: 'cross', leverage: 3, entryPrice: 172.50, markPrice: 178.32, size: 50, margin: 2875, pnl: 291.00, pnlPct: 10.12, liquidationPrice: 115, marginRatio: 18.7, createdAt: '2024-02-22 10:00' },
  { id: 'mg004', pair: 'BNB/USDT', side: 'long', mode: 'isolated', leverage: 8, entryPrice: 420, markPrice: 412.87, size: 10, margin: 525, pnl: -71.30, pnlPct: -13.58, liquidationPrice: 370, marginRatio: 5.2, createdAt: '2024-02-23 08:45' },
];

export const MARGIN_ACCOUNT = {
  totalEquity: 12450.80,
  totalMargin: 6080.00,
  availableMargin: 6370.80,
  unrealizedPnl: 768.28,
  marginLevel: 204.8,
  crossWalletBalance: 10200,
  isolatedMarginTotal: 1249,
};

// ─── Sub Accounts ─────────────────────────────────────────────
export interface SubAccount {
  id: string;
  name: string;
  email: string;
  type: 'spot' | 'margin' | 'futures' | 'all';
  status: 'active' | 'frozen' | 'pending';
  balance: number;
  pnl30d: number;
  permissions: string[];
  createdAt: string;
  lastActive: string;
  apiKeyCount: number;
  tradingVolume30d: number;
}

export const SUB_ACCOUNTS: SubAccount[] = [
  { id: 'sub001', name: 'Bot Trading #1', email: 'bot1@vittrade.vn', type: 'spot', status: 'active', balance: 8450.20, pnl30d: 1234.50, permissions: ['spot_trade', 'read'], createdAt: '2024-01-15', lastActive: '2 phút trước', apiKeyCount: 2, tradingVolume30d: 125000 },
  { id: 'sub002', name: 'Margin Account', email: 'margin@vittrade.vn', type: 'margin', status: 'active', balance: 15200.00, pnl30d: 3421.80, permissions: ['margin_trade', 'transfer', 'read'], createdAt: '2024-01-20', lastActive: '1 giờ trước', apiKeyCount: 1, tradingVolume30d: 450000 },
  { id: 'sub003', name: 'Futures #1', email: 'futures1@vittrade.vn', type: 'futures', status: 'active', balance: 5600.00, pnl30d: -890.30, permissions: ['futures_trade', 'read'], createdAt: '2024-02-01', lastActive: '5 phút trước', apiKeyCount: 1, tradingVolume30d: 890000 },
  { id: 'sub004', name: 'DCA Strategy', email: 'dca@vittrade.vn', type: 'spot', status: 'frozen', balance: 2100.50, pnl30d: 567.20, permissions: ['spot_trade', 'read'], createdAt: '2024-02-10', lastActive: '3 ngày trước', apiKeyCount: 0, tradingVolume30d: 15000 },
  { id: 'sub005', name: 'Team Member - Linh', email: 'linh@company.vn', type: 'all', status: 'active', balance: 32500.00, pnl30d: 8920.00, permissions: ['spot_trade', 'margin_trade', 'futures_trade', 'transfer', 'withdraw', 'read'], createdAt: '2023-12-01', lastActive: 'Vừa xong', apiKeyCount: 3, tradingVolume30d: 1250000 },
];

// ─── Market Heatmap Data ──────────────────────────────────────
export interface HeatmapCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  category: string;
  color: string;
}

export const HEATMAP_COINS: HeatmapCoin[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 67543.21, change24h: 2.34, change7d: 5.12, marketCap: 1324567890000, volume24h: 23456789000, category: 'Layer 1', color: '#F7931A' },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3521.45, change24h: -1.23, change7d: 3.45, marketCap: 423456789000, volume24h: 8765432000, category: 'Layer 1', color: '#627EEA' },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', price: 412.87, change24h: 3.61, change7d: 7.82, marketCap: 63456789000, volume24h: 1234567000, category: 'Layer 1', color: '#F3BA2F' },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 178.32, change24h: 8.07, change7d: 12.34, marketCap: 78456789000, volume24h: 3456789000, category: 'Layer 1', color: '#9945FF' },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', price: 0.6234, change24h: -2.59, change7d: -4.21, marketCap: 34567890000, volume24h: 1876543000, category: 'Payment', color: '#00AAE4' },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', price: 0.4521, change24h: 3.22, change7d: 6.78, marketCap: 16234567000, volume24h: 654321000, category: 'Layer 1', color: '#0033AD' },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', price: 38.54, change24h: 4.73, change7d: 9.15, marketCap: 15678901000, volume24h: 567890000, category: 'Layer 1', color: '#E84142' },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', price: 7.832, change24h: -3.55, change7d: -1.23, marketCap: 10345678000, volume24h: 432109000, category: 'DeFi', color: '#E6007A' },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', price: 0.8976, change24h: 5.60, change7d: 11.20, marketCap: 8912345000, volume24h: 789012000, category: 'Layer 2', color: '#8247E5' },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', price: 14.23, change24h: -5.76, change7d: -3.45, marketCap: 8123456000, volume24h: 345678000, category: 'DeFi', color: '#2A5ADA' },
  { id: 'uni', symbol: 'UNI', name: 'Uniswap', price: 7.45, change24h: 2.15, change7d: 4.56, marketCap: 5612345000, volume24h: 234567000, category: 'DeFi', color: '#FF007A' },
  { id: 'atom', symbol: 'ATOM', name: 'Cosmos', price: 9.12, change24h: -1.87, change7d: 2.34, marketCap: 3456789000, volume24h: 189012000, category: 'Layer 1', color: '#2E3148' },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', price: 5.67, change24h: 6.89, change7d: 14.56, marketCap: 5890123000, volume24h: 456789000, category: 'Layer 1', color: '#00C1DE' },
  { id: 'arb', symbol: 'ARB', name: 'Arbitrum', price: 1.23, change24h: 4.32, change7d: 8.90, marketCap: 4321098000, volume24h: 567890000, category: 'Layer 2', color: '#28A0F0' },
  { id: 'op', symbol: 'OP', name: 'Optimism', price: 3.45, change24h: -0.89, change7d: 5.67, marketCap: 3789012000, volume24h: 321098000, category: 'Layer 2', color: '#FF0420' },
  { id: 'apt', symbol: 'APT', name: 'Aptos', price: 8.90, change24h: 3.45, change7d: 7.89, marketCap: 3210987000, volume24h: 234567000, category: 'Layer 1', color: '#2A2A2A' },
  { id: 'inj', symbol: 'INJ', name: 'Injective', price: 28.45, change24h: 7.23, change7d: 15.67, marketCap: 2876543000, volume24h: 345678000, category: 'DeFi', color: '#00F2FE' },
  { id: 'sei', symbol: 'SEI', name: 'Sei', price: 0.45, change24h: -4.56, change7d: -2.34, marketCap: 1234567000, volume24h: 189012000, category: 'Layer 1', color: '#9B1C1C' },
  { id: 'stx', symbol: 'STX', name: 'Stacks', price: 2.34, change24h: 1.23, change7d: 3.45, marketCap: 2345678000, volume24h: 123456000, category: 'Layer 2', color: '#5546FF' },
  { id: 'wld', symbol: 'WLD', name: 'Worldcoin', price: 3.12, change24h: -6.78, change7d: -8.90, marketCap: 1890123000, volume24h: 345678000, category: 'AI', color: '#1D1D1B' },
];