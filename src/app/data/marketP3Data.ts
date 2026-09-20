/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET P3 DATA — Advanced Charts, Token Unlocks, Social Signals,
 *                   Market Correlations
 * ══════════════════════════════════════════════════════════════════
 */

// ─── Advanced Charts — Technical Indicator Data ───────────────
export interface IndicatorConfig {
  id: string;
  name: string;
  shortName: string;
  category: 'trend' | 'momentum' | 'volatility' | 'volume';
  color: string;
  description: string;
  params: { label: string; default: number }[];
}

export const INDICATOR_LIST: IndicatorConfig[] = [
  {
    id: 'sma', name: 'Simple Moving Average', shortName: 'SMA',
    category: 'trend', color: '#3B82F6',
    description: 'Trung bình giá đóng cửa trong N kỳ',
    params: [{ label: 'Chu kỳ', default: 20 }],
  },
  {
    id: 'ema', name: 'Exponential Moving Average', shortName: 'EMA',
    category: 'trend', color: '#8B5CF6',
    description: 'Trung bình trọng số hàm mũ, phản ứng nhanh hơn SMA',
    params: [{ label: 'Chu kỳ', default: 12 }],
  },
  {
    id: 'boll', name: 'Bollinger Bands', shortName: 'BOLL',
    category: 'volatility', color: '#EC4899',
    description: 'Dải biến động quanh SMA ± 2 độ lệch chuẩn',
    params: [{ label: 'Chu kỳ', default: 20 }, { label: 'Sigma', default: 2 }],
  },
  {
    id: 'rsi', name: 'Relative Strength Index', shortName: 'RSI',
    category: 'momentum', color: '#F59E0B',
    description: 'Chỉ số sức mạnh tương đối (0–100), quá mua >70, quá bán <30',
    params: [{ label: 'Chu kỳ', default: 14 }],
  },
  {
    id: 'macd', name: 'MACD', shortName: 'MACD',
    category: 'momentum', color: '#10B981',
    description: 'Chênh lệch EMA nhanh và EMA chậm, phát hiện đảo chiều',
    params: [{ label: 'Nhanh', default: 12 }, { label: 'Chậm', default: 26 }, { label: 'Signal', default: 9 }],
  },
  {
    id: 'stoch', name: 'Stochastic Oscillator', shortName: 'STOCH',
    category: 'momentum', color: '#06B6D4',
    description: 'So sánh giá đóng cửa với phạm vi giá trong kỳ (0–100)',
    params: [{ label: 'K', default: 14 }, { label: 'D', default: 3 }],
  },
  {
    id: 'atr', name: 'Average True Range', shortName: 'ATR',
    category: 'volatility', color: '#EF4444',
    description: 'Đo lường biến động trung bình, dùng đặt stop-loss',
    params: [{ label: 'Chu kỳ', default: 14 }],
  },
  {
    id: 'vwap', name: 'Volume Weighted Average Price', shortName: 'VWAP',
    category: 'volume', color: '#14B8A6',
    description: 'Giá trung bình trọng số khối lượng trong phiên',
    params: [],
  },
  {
    id: 'obv', name: 'On-Balance Volume', shortName: 'OBV',
    category: 'volume', color: '#A855F7',
    description: 'Tích lũy khối lượng theo chiều giá, phát hiện phân kỳ',
    params: [],
  },
  {
    id: 'ichimoku', name: 'Ichimoku Cloud', shortName: 'ICHI',
    category: 'trend', color: '#059669',
    description: 'Hệ thống đa chỉ số: xu hướng, hỗ trợ/kháng cự, động lượng',
    params: [{ label: 'Tenkan', default: 9 }, { label: 'Kijun', default: 26 }, { label: 'Senkou', default: 52 }],
  },
];

export interface DrawingTool {
  id: string;
  name: string;
  icon: string;
  category: 'line' | 'shape' | 'fib' | 'measure';
}

export const DRAWING_TOOLS: DrawingTool[] = [
  { id: 'trendline', name: 'Đường xu hướng', icon: '📏', category: 'line' },
  { id: 'hline', name: 'Đường ngang', icon: '➖', category: 'line' },
  { id: 'channel', name: 'Kênh giá', icon: '📐', category: 'line' },
  { id: 'ray', name: 'Tia', icon: '↗️', category: 'line' },
  { id: 'rect', name: 'Hình chữ nhật', icon: '▪️', category: 'shape' },
  { id: 'circle', name: 'Hình tròn', icon: '⭕', category: 'shape' },
  { id: 'text', name: 'Ghi chú', icon: '📝', category: 'shape' },
  { id: 'fib_ret', name: 'Fibonacci Retracement', icon: '🔢', category: 'fib' },
  { id: 'fib_ext', name: 'Fibonacci Extension', icon: '📊', category: 'fib' },
  { id: 'fib_fan', name: 'Fibonacci Fan', icon: '🌀', category: 'fib' },
  { id: 'measure', name: 'Đo khoảng cách', icon: '📐', category: 'measure' },
  { id: 'daterange', name: 'Đo thời gian', icon: '📅', category: 'measure' },
];

export interface TechSignalSummary {
  pair: string;
  timeframe: string;
  overallSignal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  maSummary: 'buy' | 'sell' | 'neutral';
  oscSummary: 'buy' | 'sell' | 'neutral';
  buyCount: number;
  sellCount: number;
  neutralCount: number;
  pivotPoints: { label: string; value: number }[];
}

export const TECH_SIGNAL_SUMMARIES: TechSignalSummary[] = [
  {
    pair: 'BTC/USDT', timeframe: '1D',
    overallSignal: 'strong_buy', maSummary: 'buy', oscSummary: 'buy',
    buyCount: 9, sellCount: 2, neutralCount: 1,
    pivotPoints: [
      { label: 'S3', value: 62_100 }, { label: 'S2', value: 64_200 },
      { label: 'S1', value: 65_800 }, { label: 'Pivot', value: 67_000 },
      { label: 'R1', value: 68_500 }, { label: 'R2', value: 70_100 },
      { label: 'R3', value: 72_300 },
    ],
  },
  {
    pair: 'ETH/USDT', timeframe: '1D',
    overallSignal: 'buy', maSummary: 'buy', oscSummary: 'neutral',
    buyCount: 7, sellCount: 3, neutralCount: 2,
    pivotPoints: [
      { label: 'S3', value: 3_220 }, { label: 'S2', value: 3_340 },
      { label: 'S1', value: 3_420 }, { label: 'Pivot', value: 3_500 },
      { label: 'R1', value: 3_580 }, { label: 'R2', value: 3_680 },
      { label: 'R3', value: 3_800 },
    ],
  },
  {
    pair: 'SOL/USDT', timeframe: '1D',
    overallSignal: 'strong_buy', maSummary: 'buy', oscSummary: 'buy',
    buyCount: 10, sellCount: 1, neutralCount: 1,
    pivotPoints: [
      { label: 'S3', value: 155 }, { label: 'S2', value: 162 },
      { label: 'S1', value: 168 }, { label: 'Pivot', value: 175 },
      { label: 'R1', value: 182 }, { label: 'R2', value: 190 },
      { label: 'R3', value: 198 },
    ],
  },
];

// ─── Token Unlock Tracker ─────────────────────────────────────
export interface TokenUnlock {
  id: string;
  symbol: string;
  name: string;
  color: string;
  unlockDate: string;
  unlockDateLabel: string;
  daysUntil: number;
  unlockAmount: number;
  unlockValueUsd: number;
  unlockPctCirculating: number;
  totalLocked: number;
  totalLockedValueUsd: number;
  vestingType: 'cliff' | 'linear' | 'milestone';
  category: 'team' | 'investor' | 'ecosystem' | 'community' | 'foundation';
  impactLevel: 'high' | 'medium' | 'low';
  currentPrice: number;
  priceChange7d: number;
  circulatingSupply: number;
  totalSupply: number;
  vestingSchedule: { date: string; pct: number; label: string }[];
}

export const TOKEN_UNLOCKS: TokenUnlock[] = [
  {
    id: 'u1', symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0',
    unlockDate: '2026-03-16', unlockDateLabel: '16 Th3 2026',
    daysUntil: 5,
    unlockAmount: 92_650_000, unlockValueUsd: 120_445_000,
    unlockPctCirculating: 2.8,
    totalLocked: 3_240_000_000, totalLockedValueUsd: 4_212_000_000,
    vestingType: 'cliff', category: 'investor',
    impactLevel: 'high', currentPrice: 1.30, priceChange7d: -4.2,
    circulatingSupply: 3_340_000_000, totalSupply: 10_000_000_000,
    vestingSchedule: [
      { date: '03/2026', pct: 2.8, label: 'Investor cliff' },
      { date: '06/2026', pct: 3.5, label: 'Team vesting' },
      { date: '09/2026', pct: 2.1, label: 'Advisor vesting' },
      { date: '12/2026', pct: 4.2, label: 'Ecosystem fund' },
    ],
  },
  {
    id: 'u2', symbol: 'OP', name: 'Optimism', color: '#FF0420',
    unlockDate: '2026-03-20', unlockDateLabel: '20 Th3 2026',
    daysUntil: 9,
    unlockAmount: 31_340_000, unlockValueUsd: 62_680_000,
    unlockPctCirculating: 1.9,
    totalLocked: 2_890_000_000, totalLockedValueUsd: 5_780_000_000,
    vestingType: 'linear', category: 'team',
    impactLevel: 'medium', currentPrice: 2.00, priceChange7d: -1.8,
    circulatingSupply: 1_640_000_000, totalSupply: 4_294_967_296,
    vestingSchedule: [
      { date: '03/2026', pct: 1.9, label: 'Core contributor' },
      { date: '04/2026', pct: 1.9, label: 'Core contributor' },
      { date: '05/2026', pct: 1.9, label: 'Core contributor' },
      { date: '06/2026', pct: 2.4, label: 'Investor unlock' },
    ],
  },
  {
    id: 'u3', symbol: 'APT', name: 'Aptos', color: '#00BFA5',
    unlockDate: '2026-03-12', unlockDateLabel: '12 Th3 2026',
    daysUntil: 1,
    unlockAmount: 11_310_000, unlockValueUsd: 96_135_000,
    unlockPctCirculating: 2.4,
    totalLocked: 567_000_000, totalLockedValueUsd: 4_819_500_000,
    vestingType: 'linear', category: 'foundation',
    impactLevel: 'high', currentPrice: 8.50, priceChange7d: -6.1,
    circulatingSupply: 472_000_000, totalSupply: 1_084_577_833,
    vestingSchedule: [
      { date: '03/2026', pct: 2.4, label: 'Foundation' },
      { date: '04/2026', pct: 2.4, label: 'Foundation' },
      { date: '05/2026', pct: 1.8, label: 'Community' },
      { date: '06/2026', pct: 3.1, label: 'Investor cliff' },
    ],
  },
  {
    id: 'u4', symbol: 'SUI', name: 'Sui', color: '#4DA2FF',
    unlockDate: '2026-04-01', unlockDateLabel: '01 Th4 2026',
    daysUntil: 21,
    unlockAmount: 64_190_000, unlockValueUsd: 96_285_000,
    unlockPctCirculating: 2.6,
    totalLocked: 5_420_000_000, totalLockedValueUsd: 8_130_000_000,
    vestingType: 'cliff', category: 'investor',
    impactLevel: 'medium', currentPrice: 1.50, priceChange7d: 3.2,
    circulatingSupply: 2_480_000_000, totalSupply: 10_000_000_000,
    vestingSchedule: [
      { date: '04/2026', pct: 2.6, label: 'Investor unlock' },
      { date: '07/2026', pct: 3.8, label: 'Team vesting' },
      { date: '10/2026', pct: 2.2, label: 'Community rewards' },
      { date: '01/2027', pct: 4.5, label: 'Foundation' },
    ],
  },
  {
    id: 'u5', symbol: 'TIA', name: 'Celestia', color: '#7B2BF9',
    unlockDate: '2026-03-25', unlockDateLabel: '25 Th3 2026',
    daysUntil: 14,
    unlockAmount: 18_500_000, unlockValueUsd: 148_000_000,
    unlockPctCirculating: 8.2,
    totalLocked: 818_000_000, totalLockedValueUsd: 6_544_000_000,
    vestingType: 'cliff', category: 'investor',
    impactLevel: 'high', currentPrice: 8.00, priceChange7d: -8.5,
    circulatingSupply: 226_000_000, totalSupply: 1_044_000_000,
    vestingSchedule: [
      { date: '03/2026', pct: 8.2, label: 'Major investor cliff' },
      { date: '06/2026', pct: 5.1, label: 'Team cliff' },
      { date: '09/2026', pct: 3.4, label: 'Ecosystem' },
      { date: '10/2026', pct: 12.0, label: 'Investor cliff 2' },
    ],
  },
  {
    id: 'u6', symbol: 'STRK', name: 'Starknet', color: '#FF4F00',
    unlockDate: '2026-04-15', unlockDateLabel: '15 Th4 2026',
    daysUntil: 35,
    unlockAmount: 127_000_000, unlockValueUsd: 88_900_000,
    unlockPctCirculating: 5.4,
    totalLocked: 7_280_000_000, totalLockedValueUsd: 5_096_000_000,
    vestingType: 'linear', category: 'team',
    impactLevel: 'medium', currentPrice: 0.70, priceChange7d: 1.2,
    circulatingSupply: 2_350_000_000, totalSupply: 10_000_000_000,
    vestingSchedule: [
      { date: '04/2026', pct: 5.4, label: 'Team linear' },
      { date: '05/2026', pct: 5.4, label: 'Team linear' },
      { date: '06/2026', pct: 5.4, label: 'Team linear' },
      { date: '07/2026', pct: 3.2, label: 'Ecosystem' },
    ],
  },
];

export const VESTING_CATEGORY_CONFIG: Record<TokenUnlock['category'], { label: string; color: string }> = {
  team: { label: 'Team', color: '#3B82F6' },
  investor: { label: 'Nhà đầu tư', color: '#EF4444' },
  ecosystem: { label: 'Hệ sinh thái', color: '#10B981' },
  community: { label: 'Cộng đồng', color: '#F59E0B' },
  foundation: { label: 'Quỹ', color: '#8B5CF6' },
};

export const IMPACT_CONFIG: Record<TokenUnlock['impactLevel'], { label: string; color: string }> = {
  high: { label: 'Cao', color: '#EF4444' },
  medium: { label: 'Trung bình', color: '#F59E0B' },
  low: { label: 'Thấp', color: '#10B981' },
};

// ─── Social Trading Signals ──────────────────────────────────
export interface TradingSignal {
  id: string;
  providerName: string;
  providerAvatar: string;
  providerTier: 'gold' | 'silver' | 'bronze';
  providerWinRate: number;
  providerFollowers: number;
  pair: string;
  baseAsset: string;
  direction: 'long' | 'short';
  entry: number;
  targets: number[];
  stopLoss: number;
  currentPrice: number;
  status: 'active' | 'target_hit' | 'stopped' | 'expired';
  pnlPct: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  timeAgo: string;
  expiresIn: string;
  likes: number;
  copies: number;
  category: 'scalp' | 'swing' | 'position';
}

export const TRADING_SIGNALS: TradingSignal[] = [
  {
    id: 's1', providerName: 'CryptoWhale_VN',
    providerAvatar: '🐋', providerTier: 'gold',
    providerWinRate: 72.5, providerFollowers: 12_400,
    pair: 'BTC/USDT', baseAsset: 'BTC',
    direction: 'long', entry: 66_800, targets: [68_500, 70_000, 72_000],
    stopLoss: 64_500, currentPrice: 67_543,
    status: 'active', pnlPct: 1.11, confidence: 'high',
    reasoning: 'BTC phá kháng cự $66.5K với volume mạnh. RSI 58 còn dư để tăng. ETF inflow tích cực.',
    timeAgo: '2 giờ trước', expiresIn: '5 ngày',
    likes: 342, copies: 89, category: 'swing',
  },
  {
    id: 's2', providerName: 'SOL_Hunter',
    providerAvatar: '🎯', providerTier: 'gold',
    providerWinRate: 68.3, providerFollowers: 8_900,
    pair: 'SOL/USDT', baseAsset: 'SOL',
    direction: 'long', entry: 175, targets: [185, 195, 210],
    stopLoss: 165, currentPrice: 178.32,
    status: 'active', pnlPct: 1.90, confidence: 'high',
    reasoning: 'SOL breakout trên đường trend dài hạn. Firedancer testnet thành công. Volume tăng 67%.',
    timeAgo: '4 giờ trước', expiresIn: '7 ngày',
    likes: 567, copies: 145, category: 'swing',
  },
  {
    id: 's3', providerName: 'DeFi_Alpha',
    providerAvatar: '🔬', providerTier: 'silver',
    providerWinRate: 64.1, providerFollowers: 5_600,
    pair: 'ETH/USDT', baseAsset: 'ETH',
    direction: 'long', entry: 3_480, targets: [3_600, 3_750],
    stopLoss: 3_350, currentPrice: 3_521,
    status: 'active', pnlPct: 1.18, confidence: 'medium',
    reasoning: 'ETH accumulation zone. Pectra upgrade sắp tới. Gas fees ổn định thấp.',
    timeAgo: '6 giờ trước', expiresIn: '10 ngày',
    likes: 234, copies: 67, category: 'position',
  },
  {
    id: 's4', providerName: 'ScalpKing',
    providerAvatar: '⚡', providerTier: 'silver',
    providerWinRate: 71.2, providerFollowers: 3_200,
    pair: 'BTC/USDT', baseAsset: 'BTC',
    direction: 'short', entry: 68_200, targets: [67_000, 66_200],
    stopLoss: 69_500, currentPrice: 67_543,
    status: 'active', pnlPct: 0.96, confidence: 'medium',
    reasoning: 'BTC test kháng cự $68K, RSI overbought trên H4. Funding rate cao — khả năng pullback.',
    timeAgo: '1 giờ trước', expiresIn: '2 ngày',
    likes: 189, copies: 34, category: 'scalp',
  },
  {
    id: 's5', providerName: 'AltSeason_Pro',
    providerAvatar: '🚀', providerTier: 'bronze',
    providerWinRate: 59.8, providerFollowers: 2_100,
    pair: 'AVAX/USDT', baseAsset: 'AVAX',
    direction: 'long', entry: 38.50, targets: [42, 46],
    stopLoss: 35, currentPrice: 39.80,
    status: 'active', pnlPct: 3.38, confidence: 'medium',
    reasoning: 'AVAX subnet growth mạnh. Gaming ecosystem phát triển. Giá phá MA50.',
    timeAgo: '8 giờ trước', expiresIn: '14 ngày',
    likes: 156, copies: 28, category: 'swing',
  },
  {
    id: 's6', providerName: 'CryptoWhale_VN',
    providerAvatar: '🐋', providerTier: 'gold',
    providerWinRate: 72.5, providerFollowers: 12_400,
    pair: 'LINK/USDT', baseAsset: 'LINK',
    direction: 'long', entry: 14.20, targets: [15.50, 17.00],
    stopLoss: 13.00, currentPrice: 14.85,
    status: 'target_hit', pnlPct: 4.58, confidence: 'high',
    reasoning: 'CCIP V2 launch catalyst. Cross-chain demand tăng. Accumulation whale lớn.',
    timeAgo: '1 ngày trước', expiresIn: 'Hoàn thành',
    likes: 412, copies: 112, category: 'swing',
  },
  {
    id: 's7', providerName: 'DeFi_Alpha',
    providerAvatar: '🔬', providerTier: 'silver',
    providerWinRate: 64.1, providerFollowers: 5_600,
    pair: 'DOGE/USDT', baseAsset: 'DOGE',
    direction: 'long', entry: 0.125, targets: [0.145, 0.160],
    stopLoss: 0.110, currentPrice: 0.108,
    status: 'stopped', pnlPct: -13.60, confidence: 'low',
    reasoning: 'DOGE breakout attempt thất bại. Meme momentum giảm.',
    timeAgo: '2 ngày trước', expiresIn: 'Dừng lỗ',
    likes: 89, copies: 15, category: 'swing',
  },
];

export const SIGNAL_PROVIDER_TIERS: Record<TradingSignal['providerTier'], { label: string; color: string; bg: string }> = {
  gold: { label: 'Vàng', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  silver: { label: 'Bạc', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  bronze: { label: 'Đồng', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
};

export const SIGNAL_STATUS_CONFIG: Record<TradingSignal['status'], { label: string; color: string }> = {
  active: { label: 'Đang hoạt động', color: '#3B82F6' },
  target_hit: { label: 'Đạt mục tiêu', color: '#10B981' },
  stopped: { label: 'Dừng lỗ', color: '#EF4444' },
  expired: { label: 'Hết hạn', color: '#6B7280' },
};

// ─── Market Correlations ─────────────────────────────────────
export interface CorrelationPair {
  assetA: string;
  assetB: string;
  colorA: string;
  colorB: string;
  correlation7d: number;
  correlation30d: number;
  correlation90d: number;
}

const CORR_ASSETS = [
  { symbol: 'BTC', color: '#F7931A' },
  { symbol: 'ETH', color: '#627EEA' },
  { symbol: 'SOL', color: '#9945FF' },
  { symbol: 'BNB', color: '#F3BA2F' },
  { symbol: 'XRP', color: '#00AAE4' },
  { symbol: 'ADA', color: '#0033AD' },
  { symbol: 'AVAX', color: '#E84142' },
  { symbol: 'LINK', color: '#2A5ADA' },
];

export { CORR_ASSETS };

// Deterministic correlation matrix
const CORR_MATRIX_7D: number[][] = [
  [1.00, 0.92, 0.85, 0.88, 0.72, 0.68, 0.78, 0.74],
  [0.92, 1.00, 0.88, 0.82, 0.65, 0.71, 0.82, 0.79],
  [0.85, 0.88, 1.00, 0.76, 0.58, 0.62, 0.74, 0.69],
  [0.88, 0.82, 0.76, 1.00, 0.70, 0.65, 0.72, 0.67],
  [0.72, 0.65, 0.58, 0.70, 1.00, 0.78, 0.60, 0.55],
  [0.68, 0.71, 0.62, 0.65, 0.78, 1.00, 0.68, 0.72],
  [0.78, 0.82, 0.74, 0.72, 0.60, 0.68, 1.00, 0.80],
  [0.74, 0.79, 0.69, 0.67, 0.55, 0.72, 0.80, 1.00],
];

const CORR_MATRIX_30D: number[][] = [
  [1.00, 0.89, 0.82, 0.85, 0.68, 0.64, 0.75, 0.71],
  [0.89, 1.00, 0.84, 0.79, 0.62, 0.67, 0.79, 0.76],
  [0.82, 0.84, 1.00, 0.73, 0.55, 0.59, 0.71, 0.66],
  [0.85, 0.79, 0.73, 1.00, 0.67, 0.62, 0.69, 0.64],
  [0.68, 0.62, 0.55, 0.67, 1.00, 0.75, 0.57, 0.52],
  [0.64, 0.67, 0.59, 0.62, 0.75, 1.00, 0.65, 0.69],
  [0.75, 0.79, 0.71, 0.69, 0.57, 0.65, 1.00, 0.77],
  [0.71, 0.76, 0.66, 0.64, 0.52, 0.69, 0.77, 1.00],
];

const CORR_MATRIX_90D: number[][] = [
  [1.00, 0.86, 0.78, 0.82, 0.64, 0.60, 0.72, 0.68],
  [0.86, 1.00, 0.81, 0.76, 0.58, 0.63, 0.76, 0.73],
  [0.78, 0.81, 1.00, 0.70, 0.51, 0.55, 0.68, 0.63],
  [0.82, 0.76, 0.70, 1.00, 0.63, 0.58, 0.66, 0.61],
  [0.64, 0.58, 0.51, 0.63, 1.00, 0.72, 0.54, 0.49],
  [0.60, 0.63, 0.55, 0.58, 0.72, 1.00, 0.62, 0.66],
  [0.72, 0.76, 0.68, 0.66, 0.54, 0.62, 1.00, 0.74],
  [0.68, 0.73, 0.63, 0.61, 0.49, 0.66, 0.74, 1.00],
];

export function getCorrelationMatrix(timeframe: '7d' | '30d' | '90d'): number[][] {
  switch (timeframe) {
    case '7d': return CORR_MATRIX_7D;
    case '30d': return CORR_MATRIX_30D;
    case '90d': return CORR_MATRIX_90D;
  }
}

export function getCorrelationPairs(timeframe: '7d' | '30d' | '90d'): CorrelationPair[] {
  const matrix = getCorrelationMatrix(timeframe);
  const pairs: CorrelationPair[] = [];
  for (let i = 0; i < CORR_ASSETS.length; i++) {
    for (let j = i + 1; j < CORR_ASSETS.length; j++) {
      pairs.push({
        assetA: CORR_ASSETS[i].symbol,
        assetB: CORR_ASSETS[j].symbol,
        colorA: CORR_ASSETS[i].color,
        colorB: CORR_ASSETS[j].color,
        correlation7d: CORR_MATRIX_7D[i][j],
        correlation30d: CORR_MATRIX_30D[i][j],
        correlation90d: CORR_MATRIX_90D[i][j],
      });
    }
  }
  return pairs;
}

export interface DiversificationScore {
  score: number;      // 0–100
  label: string;
  avgCorrelation: number;
  lowestCorr: { pair: string; value: number };
  highestCorr: { pair: string; value: number };
  recommendation: string;
}

export function calcDiversificationScore(timeframe: '7d' | '30d' | '90d'): DiversificationScore {
  const pairs = getCorrelationPairs(timeframe);
  const avg = pairs.reduce((s, p) => {
    const val = timeframe === '7d' ? p.correlation7d : timeframe === '30d' ? p.correlation30d : p.correlation90d;
    return s + val;
  }, 0) / pairs.length;

  const getVal = (p: CorrelationPair) =>
    timeframe === '7d' ? p.correlation7d : timeframe === '30d' ? p.correlation30d : p.correlation90d;

  const sorted = [...pairs].sort((a, b) => getVal(a) - getVal(b));
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];

  const score = Math.round((1 - avg) * 100);
  let label = 'Tốt';
  if (score < 20) label = 'Rất thấp';
  else if (score < 35) label = 'Thấp';
  else if (score < 50) label = 'Trung bình';
  else if (score < 65) label = 'Tốt';
  else label = 'Rất tốt';

  const recommendation = avg > 0.8
    ? 'Danh mục có tương quan cao. Xem xét thêm tài sản ít tương quan để giảm rủi ro.'
    : avg > 0.6
    ? 'Tương quan trung bình. Cân nhắc thêm stablecoin hoặc tài sản ngoài crypto.'
    : 'Đa dạng hóa tốt. Tương quan thấp giúp giảm rủi ro tổng thể.';

  return {
    score,
    label,
    avgCorrelation: avg,
    lowestCorr: { pair: `${lowest.assetA}/${lowest.assetB}`, value: getVal(lowest) },
    highestCorr: { pair: `${highest.assetA}/${highest.assetB}`, value: getVal(highest) },
    recommendation,
  };
}
