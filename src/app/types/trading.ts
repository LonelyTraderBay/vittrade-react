/**
 * ══════════════════════════════════════════════════════════
 *  TRADING TYPES — Spot Trading Module
 * ══════════════════════════════════════════════════════════
 *
 *  Types for core trading functionality: orders, positions,
 *  market data, charts, portfolios.
 */

import type { Asset } from './common';

/* ─── Market Data ─── */

export interface TradingPair {
  symbol: string;              // e.g., "BTCUSDT"
  baseAsset: string;           // e.g., "BTC"
  quoteAsset: string;          // e.g., "USDT"
  status: 'active' | 'suspended' | 'delisted';
  minOrderSize: number;
  maxOrderSize: number;
  pricePrecision: number;
  quantityPrecision: number;
}

export interface MarketTicker {
  symbol: string;
  lastPrice: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  timestamp: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

/* ─── Orders ─── */

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_limit' | 'stop_market';
export type OrderStatus = 'pending' | 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'expired' | 'rejected';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price?: number;              // undefined for market orders
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice?: number;
  totalCost?: number;
  fee?: number;
  feeAsset?: string;
  timeInForce?: TimeInForce;
  stopPrice?: number;          // for stop orders
  createdAt: Date;
  updatedAt: Date;
  filledAt?: Date;
}

export interface CreateOrderParams {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
}

/* ─── Positions & Portfolio ─── */

export interface Position {
  asset: string;
  quantity: number;
  availableQuantity: number;
  lockedQuantity: number;
  averagePrice: number;
  currentPrice: number;
  value: number;                // quantity * currentPrice
  pnl: number;
  pnlPercentage: number;
  allocation: number;           // % of total portfolio
}

export interface Portfolio {
  totalValue: number;           // in quote currency (USDT)
  totalPnl: number;
  totalPnlPercentage: number;
  positions: Position[];
  updatedAt: Date;
}

/* ─── Trade History ─── */

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  total: number;
  fee: number;
  feeAsset: string;
  timestamp: Date;
  isMaker: boolean;
}

/* ─── Balance ─── */

export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdValue?: number;
}

/* ─── Chart Types ─── */

export type ChartInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

export interface Candlestick {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartIndicator {
  type: 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB';
  period: number;
  color?: string;
}

/* ─── Watchlist ─── */

export interface WatchlistItem {
  symbol: string;
  addedAt: Date;
  alertPrice?: number;
  notes?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Transfer Types ─── */

export type TransferType = 'deposit' | 'withdraw' | 'internal';
export type TransferStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Transfer {
  id: string;
  type: TransferType;
  asset: string;
  amount: number;
  fee: number;
  network?: string;
  address?: string;
  txHash?: string;
  status: TransferStatus;
  createdAt: Date;
  completedAt?: Date;
}

/* ─── Convert (Simple Trade) ─── */

export interface ConvertQuote {
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  expiresAt: Date;
  quoteId: string;
}

export interface ConvertTransaction {
  id: string;
  quoteId: string;
  from: string;
  to: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}
