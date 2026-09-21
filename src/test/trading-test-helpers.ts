/**
 * ══════════════════════════════════════════════════════════════════
 *  TEST UTILITIES
 * ══════════════════════════════════════════════════════════════════
 *  Shared testing helpers for Phase 1-3 components
 */

import { expect } from 'vitest';

/* ═══════════════════════════════════════════════════════════════
   NUMBER COMPARISON HELPERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Compare floating point numbers with tolerance
 */
export function expectClose(actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/**
 * Validate percentage is within 0-100 range
 */
export function expectValidPercentage(value: number) {
  expect(value).toBeGreaterThanOrEqual(0);
  expect(value).toBeLessThanOrEqual(100);
}

/**
 * Validate price is positive
 */
export function expectValidPrice(price: number) {
  expect(price).toBeGreaterThan(0);
  expect(isFinite(price)).toBe(true);
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA GENERATORS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Generate mock order for testing
 */
export function createMockOrder(overrides = {}) {
  return {
    id: 'test-order-123',
    symbol: 'BTC/USDT',
    side: 'buy' as const,
    type: 'limit' as const,
    price: 69000,
    amount: 1.0,
    filled: 0,
    remaining: 1.0,
    totalValue: 69000,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock position for testing
 */
export function createMockPosition(overrides = {}) {
  return {
    symbol: 'BTC/USDT',
    side: 'long' as const,
    entryPrice: 69000,
    currentPrice: 69500,
    amount: 1.0,
    leverage: 1,
    ...overrides,
  };
}

/**
 * Generate mock order book level
 */
export function createMockOrderBookLevel(price: number, overrides = {}) {
  return {
    price,
    buyVolume: Math.random() * 5,
    sellVolume: Math.random() * 5,
    totalBuyVolume: Math.random() * 20,
    totalSellVolume: Math.random() * 20,
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════════════
   VALIDATION HELPERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Validate OCO order structure
 */
export function validateOCOOrder(order: any) {
  expect(order).toHaveProperty('entryPrice');
  expect(order).toHaveProperty('takeProfit');
  expect(order).toHaveProperty('stopLoss');
  expect(order).toHaveProperty('amount');

  expectValidPrice(order.entryPrice);
  expectValidPrice(order.takeProfit);
  expectValidPrice(order.stopLoss);

  expect(order.amount).toBeGreaterThan(0);

  // Validate TP/SL relationship
  if (order.side === 'buy') {
    expect(order.takeProfit).toBeGreaterThan(order.entryPrice);
    expect(order.stopLoss).toBeLessThan(order.entryPrice);
  } else {
    expect(order.takeProfit).toBeLessThan(order.entryPrice);
    expect(order.stopLoss).toBeGreaterThan(order.entryPrice);
  }
}

/**
 * Validate risk/reward ratio
 */
export function validateRiskReward(rr: number) {
  expect(rr).toBeGreaterThan(0);
  expect(isFinite(rr)).toBe(true);
}

/**
 * Validate slippage percentage
 */
export function validateSlippage(slippage: number) {
  expect(Math.abs(slippage)).toBeLessThanOrEqual(100); // Max 100%
  expect(isFinite(slippage)).toBe(true);
}

/* ═══════════════════════════════════════════════════════════════
   CALCULATION VALIDATORS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Test P&L calculation accuracy
 */
export function testPnLCalculation(
  entryPrice: number,
  currentPrice: number,
  amount: number,
  side: 'long' | 'short',
  expectedPnL: number,
) {
  let calculatedPnL: number;

  if (side === 'long') {
    calculatedPnL = (currentPrice - entryPrice) * amount;
  } else {
    calculatedPnL = (entryPrice - currentPrice) * amount;
  }

  expectClose(calculatedPnL, expectedPnL, 0.01);
}

/**
 * Test position size calculation
 */
export function testPositionSizeCalculation(
  accountBalance: number,
  riskPercentage: number,
  entryPrice: number,
  stopLoss: number,
  expectedSize: number,
) {
  const riskAmount = accountBalance * (riskPercentage / 100);
  const priceRisk = Math.abs(entryPrice - stopLoss);
  const calculatedSize = riskAmount / priceRisk;

  expectClose(calculatedSize, expectedSize, 0.0001);
}

/**
 * Test slippage calculation
 */
export function testSlippageCalculation(
  expectedPrice: number,
  actualPrice: number,
  expectedSlippagePct: number,
) {
  const calculatedSlippage = ((actualPrice - expectedPrice) / expectedPrice) * 100;
  expectClose(calculatedSlippage, expectedSlippagePct, 0.001);
}

/* ═══════════════════════════════════════════════════════════════
   EDGE CASE GENERATORS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Generate edge case test values
 */
export const EDGE_CASES = {
  prices: [
    0.0001, // Very small
    1, // Unit
    1000, // Normal
    100000, // Large
    0.00000001, // Crypto minimum
  ],
  amounts: [
    0.00000001, // Minimum
    0.1, // Small
    1, // Normal
    100, // Large
    1000, // Very large
  ],
  percentages: [
    0, // Zero
    0.01, // Very small
    1, // Small
    50, // Medium
    99.99, // Near max
    100, // Max
  ],
  invalid: {
    negative: -100,
    zero: 0,
    nan: NaN,
    infinity: Infinity,
    negativeInfinity: -Infinity,
  },
};

/* ═══════════════════════════════════════════════════════════════
   TEST SCENARIO BUILDERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Build test scenarios for OCO orders
 */
export function buildOCOScenarios() {
  return [
    {
      name: 'Conservative long (1:2 R:R)',
      side: 'buy' as const,
      entryPrice: 69000,
      takeProfit: 72000,
      stopLoss: 67500,
      amount: 1.0,
      expectedRR: 2.0,
    },
    {
      name: 'Aggressive long (1:3 R:R)',
      side: 'buy' as const,
      entryPrice: 69000,
      takeProfit: 75000,
      stopLoss: 67000,
      amount: 0.5,
      expectedRR: 3.0,
    },
    {
      name: 'Conservative short (1:2 R:R)',
      side: 'sell' as const,
      entryPrice: 69000,
      takeProfit: 66000,
      stopLoss: 70500,
      amount: 1.0,
      expectedRR: 2.0,
    },
    {
      name: 'Tight stop (1:1 R:R)',
      side: 'buy' as const,
      entryPrice: 69000,
      takeProfit: 69500,
      stopLoss: 68500,
      amount: 2.0,
      expectedRR: 1.0,
    },
  ];
}

/**
 * Build test scenarios for position sizing
 */
export function buildPositionSizingScenarios() {
  return [
    {
      name: '1% risk on BTC',
      accountBalance: 10000,
      riskPercentage: 1,
      entryPrice: 69000,
      stopLoss: 67000,
      expectedSize: 0.05, // $100 risk / $2000 price risk
    },
    {
      name: '2% risk on BTC',
      accountBalance: 10000,
      riskPercentage: 2,
      entryPrice: 69000,
      stopLoss: 68000,
      expectedSize: 0.2, // $200 risk / $1000 price risk
    },
    {
      name: '0.5% risk on ETH',
      accountBalance: 5000,
      riskPercentage: 0.5,
      entryPrice: 3200,
      stopLoss: 3100,
      expectedSize: 0.25, // $25 risk / $100 price risk
    },
  ];
}

/**
 * Build test scenarios for slippage
 */
export function buildSlippageScenarios() {
  return [
    {
      name: 'Good execution (0.1% slippage)',
      expectedPrice: 69000,
      actualPrice: 69069,
      expectedSlippage: 0.1,
    },
    {
      name: 'Average execution (0.5% slippage)',
      expectedPrice: 69000,
      actualPrice: 69345,
      expectedSlippage: 0.5,
    },
    {
      name: 'Poor execution (2% slippage)',
      expectedPrice: 69000,
      actualPrice: 70380,
      expectedSlippage: 2.0,
    },
    {
      name: 'Negative slippage (price improvement)',
      expectedPrice: 69000,
      actualPrice: 68900,
      expectedSlippage: -0.145,
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════
   PERFORMANCE HELPERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Measure function execution time
 */
export async function measurePerformance<T>(
  fn: () => T | Promise<T>,
  label: string,
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * Assert function completes within time limit
 */
export async function expectPerformance<T>(
  fn: () => T | Promise<T>,
  maxDuration: number,
  label: string = 'Operation',
) {
  const { duration } = await measurePerformance(fn, label);
  expect(duration).toBeLessThanOrEqual(maxDuration);
}
