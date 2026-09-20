/**
 * ══════════════════════════════════════════════════════════════════
 *  CHART TYPES
 * ══════════════════════════════════════════════════════════════════
 *  TypeScript types for TradingView Lightweight Charts
 */

import type {
  IChartApi,
  ISeriesApi,
  CandlestickSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  LineSeriesPartialOptions,
  DeepPartial,
  ChartOptions,
  Time,
} from 'lightweight-charts';

/* ═══════════════════════════════════════════════════════════════
   CHART DATA TYPES
   ═══════════════════════════════════════════════════════════════ */

export interface CandlestickDataPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeDataPoint {
  time: Time;
  value: number;
  color?: string;
}

export interface LineDataPoint {
  time: Time;
  value: number;
}

/* ═══════════════════════════════════════════════════════════════
   CHART COMPONENT PROPS
   ═══════════════════════════════════════════════════════════════ */

export interface MiniChartProps {
  pairId: string;
  height?: number;
  showVolume?: boolean;
  showCurrentPrice?: boolean;
  showTimeframeSelector?: boolean;
  interactive?: boolean;
  onTap?: () => void;
}

export interface FullChartProps {
  pairId: string;
  timeframe?: '5m' | '15m' | '1h' | '4h' | '1d';
  indicators?: Indicator[];
  showOrderBook?: boolean;
  showTrades?: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   CHART CONFIGURATION
   ═══════════════════════════════════════════════════════════════ */

export interface ChartTheme {
  background: string;
  textColor: string;
  lineColor: string;
  gridColor: string;
  candleUpColor: string;
  candleDownColor: string;
  wickUpColor: string;
  wickDownColor: string;
  volumeUpColor: string;
  volumeDownColor: string;
}

export interface MiniChartConfig {
  width: number;
  height: number;
  theme: ChartTheme;
  candlestickOptions: CandlestickSeriesPartialOptions;
  volumeOptions: HistogramSeriesPartialOptions;
  priceLineOptions: LineSeriesPartialOptions;
  chartOptions: DeepPartial<ChartOptions>;
}

/* ═══════════════════════════════════════════════════════════════
   INDICATOR TYPES
   ═══════════════════════════════════════════════════════════════ */

export type Indicator =
  | 'MA7'
  | 'MA25'
  | 'MA99'
  | 'EMA12'
  | 'EMA26'
  | 'BOLL'
  | 'RSI'
  | 'MACD'
  | 'VOL';

export interface IndicatorConfig {
  type: Indicator;
  enabled: boolean;
  color?: string;
  params?: Record<string, number>;
}

/* ═══════════════════════════════════════════════════════════════
   CHART API TYPES
   ══════════════════════════════════��════════════════════════════ */

export interface ChartInstance {
  chart: IChartApi | null;
  candlestickSeries: ISeriesApi<'Candlestick'> | null;
  volumeSeries: ISeriesApi<'Histogram'> | null;
  priceLineSeries: ISeriesApi<'Line'> | null;
}

/* ═══════════════════════════════════════════════════════════════
   CHART ACTIONS
   ═══════════════════════════════════════════════════════════════ */

export type ChartAction =
  | { type: 'UPDATE_DATA'; data: CandlestickDataPoint[] }
  | { type: 'UPDATE_VOLUME'; data: VolumeDataPoint[] }
  | { type: 'UPDATE_PRICE'; price: number }
  | { type: 'SET_TIMEFRAME'; timeframe: string }
  | { type: 'TOGGLE_INDICATOR'; indicator: Indicator }
  | { type: 'RESIZE'; width: number; height: number };

/* ═══════════════════════════════════════════════════════════════
   EXPORT LIGHTWEIGHT-CHARTS TYPES
   ═══════════════════════════════════════════════════════════════ */

export type {
  IChartApi,
  ISeriesApi,
  CandlestickSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  LineSeriesPartialOptions,
  DeepPartial,
  ChartOptions,
  Time,
};