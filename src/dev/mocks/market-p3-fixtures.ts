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
    id: 'sma',
    name: 'Simple Moving Average',
    shortName: 'SMA',
    category: 'trend',
    color: '#3B82F6',
    description: 'Trung bình giá đóng cửa trong N kỳ',
    params: [{ label: 'Chu kỳ', default: 20 }],
  },
  {
    id: 'ema',
    name: 'Exponential Moving Average',
    shortName: 'EMA',
    category: 'trend',
    color: '#8B5CF6',
    description: 'Trung bình trọng số hàm mũ, phản ứng nhanh hơn SMA',
    params: [{ label: 'Chu kỳ', default: 12 }],
  },
  {
    id: 'boll',
    name: 'Bollinger Bands',
    shortName: 'BOLL',
    category: 'volatility',
    color: '#EC4899',
    description: 'Dải biến động quanh SMA ± 2 độ lệch chuẩn',
    params: [
      { label: 'Chu kỳ', default: 20 },
      { label: 'Sigma', default: 2 },
    ],
  },
  {
    id: 'rsi',
    name: 'Relative Strength Index',
    shortName: 'RSI',
    category: 'momentum',
    color: '#F59E0B',
    description: 'Chỉ số sức mạnh tương đối (0–100), quá mua >70, quá bán <30',
    params: [{ label: 'Chu kỳ', default: 14 }],
  },
  {
    id: 'macd',
    name: 'MACD',
    shortName: 'MACD',
    category: 'momentum',
    color: '#10B981',
    description: 'Chênh lệch EMA nhanh và EMA chậm, phát hiện đảo chiều',
    params: [
      { label: 'Nhanh', default: 12 },
      { label: 'Chậm', default: 26 },
      { label: 'Signal', default: 9 },
    ],
  },
  {
    id: 'stoch',
    name: 'Stochastic Oscillator',
    shortName: 'STOCH',
    category: 'momentum',
    color: '#06B6D4',
    description: 'So sánh giá đóng cửa với phạm vi giá trong kỳ (0–100)',
    params: [
      { label: 'K', default: 14 },
      { label: 'D', default: 3 },
    ],
  },
  {
    id: 'atr',
    name: 'Average True Range',
    shortName: 'ATR',
    category: 'volatility',
    color: '#EF4444',
    description: 'Đo lường biến động trung bình, dùng đặt stop-loss',
    params: [{ label: 'Chu kỳ', default: 14 }],
  },
  {
    id: 'vwap',
    name: 'Volume Weighted Average Price',
    shortName: 'VWAP',
    category: 'volume',
    color: '#14B8A6',
    description: 'Giá trung bình trọng số khối lượng trong phiên',
    params: [],
  },
  {
    id: 'obv',
    name: 'On-Balance Volume',
    shortName: 'OBV',
    category: 'volume',
    color: '#A855F7',
    description: 'Tích lũy khối lượng theo chiều giá, phát hiện phân kỳ',
    params: [],
  },
  {
    id: 'ichimoku',
    name: 'Ichimoku Cloud',
    shortName: 'ICHI',
    category: 'trend',
    color: '#059669',
    description: 'Hệ thống đa chỉ số: xu hướng, hỗ trợ/kháng cự, động lượng',
    params: [
      { label: 'Tenkan', default: 9 },
      { label: 'Kijun', default: 26 },
      { label: 'Senkou', default: 52 },
    ],
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
    pair: 'BTC/USDT',
    timeframe: '1D',
    overallSignal: 'strong_buy',
    maSummary: 'buy',
    oscSummary: 'buy',
    buyCount: 9,
    sellCount: 2,
    neutralCount: 1,
    pivotPoints: [
      { label: 'S3', value: 62_100 },
      { label: 'S2', value: 64_200 },
      { label: 'S1', value: 65_800 },
      { label: 'Pivot', value: 67_000 },
      { label: 'R1', value: 68_500 },
      { label: 'R2', value: 70_100 },
      { label: 'R3', value: 72_300 },
    ],
  },
  {
    pair: 'ETH/USDT',
    timeframe: '1D',
    overallSignal: 'buy',
    maSummary: 'buy',
    oscSummary: 'neutral',
    buyCount: 7,
    sellCount: 3,
    neutralCount: 2,
    pivotPoints: [
      { label: 'S3', value: 3_220 },
      { label: 'S2', value: 3_340 },
      { label: 'S1', value: 3_420 },
      { label: 'Pivot', value: 3_500 },
      { label: 'R1', value: 3_580 },
      { label: 'R2', value: 3_680 },
      { label: 'R3', value: 3_800 },
    ],
  },
  {
    pair: 'SOL/USDT',
    timeframe: '1D',
    overallSignal: 'strong_buy',
    maSummary: 'buy',
    oscSummary: 'buy',
    buyCount: 10,
    sellCount: 1,
    neutralCount: 1,
    pivotPoints: [
      { label: 'S3', value: 155 },
      { label: 'S2', value: 162 },
      { label: 'S1', value: 168 },
      { label: 'Pivot', value: 175 },
      { label: 'R1', value: 182 },
      { label: 'R2', value: 190 },
      { label: 'R3', value: 198 },
    ],
  },
];
