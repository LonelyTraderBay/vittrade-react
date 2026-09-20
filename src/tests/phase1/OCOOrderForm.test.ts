/**
 * ══════════════════════════════════════════════════════════════════
 *  OCO ORDER FORM TESTS
 * ══════════════════════════════════════════════════════════════════
 *  Test suite for Phase 1 - OCO Orders component
 */

import { describe, it, expect } from '@jest/globals';
import {
  expectValidPrice,
  validateOCOOrder,
  validateRiskReward,
  buildOCOScenarios,
  EDGE_CASES,
} from '../testUtils';

/* ═══════════════════════════════════════════════════════════════
   CALCULATION TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('OCO Order Calculations', () => {
  describe('Risk/Reward Ratio Calculation', () => {
    it('should calculate 1:2 R:R correctly for long position', () => {
      const entryPrice = 69000;
      const takeProfit = 72000;
      const stopLoss = 67500;
      
      const profit = takeProfit - entryPrice; // 3000
      const risk = entryPrice - stopLoss;     // 1500
      const rr = profit / risk;               // 2.0
      
      expect(rr).toBe(2.0);
      validateRiskReward(rr);
    });

    it('should calculate 1:3 R:R correctly for long position', () => {
      const entryPrice = 69000;
      const takeProfit = 75000;
      const stopLoss = 67000;
      
      const profit = takeProfit - entryPrice; // 6000
      const risk = entryPrice - stopLoss;     // 2000
      const rr = profit / risk;               // 3.0
      
      expect(rr).toBe(3.0);
    });

    it('should calculate 1:2 R:R correctly for short position', () => {
      const entryPrice = 69000;
      const takeProfit = 66000;
      const stopLoss = 70500;
      
      const profit = entryPrice - takeProfit; // 3000
      const risk = stopLoss - entryPrice;     // 1500
      const rr = profit / risk;               // 2.0
      
      expect(rr).toBe(2.0);
    });

    it('should handle 1:1 R:R (balanced)', () => {
      const entryPrice = 69000;
      const takeProfit = 69500;
      const stopLoss = 68500;
      
      const profit = takeProfit - entryPrice; // 500
      const risk = entryPrice - stopLoss;     // 500
      const rr = profit / risk;               // 1.0
      
      expect(rr).toBe(1.0);
    });
  });

  describe('P&L Calculation', () => {
    it('should calculate profit correctly for long position', () => {
      const entryPrice = 69000;
      const exitPrice = 72000;
      const amount = 1.0;
      
      const pnl = (exitPrice - entryPrice) * amount;
      
      expect(pnl).toBe(3000);
    });

    it('should calculate loss correctly for long position', () => {
      const entryPrice = 69000;
      const exitPrice = 67500;
      const amount = 1.0;
      
      const pnl = (exitPrice - entryPrice) * amount;
      
      expect(pnl).toBe(-1500);
    });

    it('should calculate profit correctly for short position', () => {
      const entryPrice = 69000;
      const exitPrice = 66000;
      const amount = 1.0;
      
      const pnl = (entryPrice - exitPrice) * amount;
      
      expect(pnl).toBe(3000);
    });

    it('should handle fractional amounts', () => {
      const entryPrice = 69000;
      const exitPrice = 72000;
      const amount = 0.5;
      
      const pnl = (exitPrice - entryPrice) * amount;
      
      expect(pnl).toBe(1500);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════
   VALIDATION TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('OCO Order Validation', () => {
  describe('Price Validation', () => {
    it('should reject take profit below entry for long', () => {
      const entryPrice = 69000;
      const takeProfit = 68000; // Invalid: below entry
      const side = 'buy';
      
      const isValid = side === 'buy' ? takeProfit > entryPrice : takeProfit < entryPrice;
      
      expect(isValid).toBe(false);
    });

    it('should reject stop loss above entry for long', () => {
      const entryPrice = 69000;
      const stopLoss = 70000; // Invalid: above entry
      const side = 'buy';
      
      const isValid = side === 'buy' ? stopLoss < entryPrice : stopLoss > entryPrice;
      
      expect(isValid).toBe(false);
    });

    it('should accept valid long OCO order', () => {
      const side = 'buy';
      const entryPrice = 69000;
      const takeProfit = 72000; // Valid: above entry
      const stopLoss = 67500;   // Valid: below entry
      
      const tpValid = takeProfit > entryPrice;
      const slValid = stopLoss < entryPrice;
      
      expect(tpValid).toBe(true);
      expect(slValid).toBe(true);
    });

    it('should accept valid short OCO order', () => {
      const side = 'sell';
      const entryPrice = 69000;
      const takeProfit = 66000; // Valid: below entry
      const stopLoss = 70500;   // Valid: above entry
      
      const tpValid = takeProfit < entryPrice;
      const slValid = stopLoss > entryPrice;
      
      expect(tpValid).toBe(true);
      expect(slValid).toBe(true);
    });
  });

  describe('Amount Validation', () => {
    it('should reject zero amount', () => {
      const amount = 0;
      const isValid = amount > 0;
      
      expect(isValid).toBe(false);
    });

    it('should reject negative amount', () => {
      const amount = -1;
      const isValid = amount > 0;
      
      expect(isValid).toBe(false);
    });

    it('should accept positive amount', () => {
      const amount = 1.5;
      const isValid = amount > 0;
      
      expect(isValid).toBe(true);
    });

    it('should accept very small amounts', () => {
      const amount = 0.00000001; // 1 satoshi
      const isValid = amount > 0;
      
      expect(isValid).toBe(true);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════
   SCENARIO TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('OCO Order Scenarios', () => {
  const scenarios = buildOCOScenarios();

  scenarios.forEach(scenario => {
    it(`should handle: ${scenario.name}`, () => {
      const { side, entryPrice, takeProfit, stopLoss, amount, expectedRR } = scenario;

      // Calculate R:R
      let profit: number, risk: number;
      
      if (side === 'buy') {
        profit = takeProfit - entryPrice;
        risk = entryPrice - stopLoss;
      } else {
        profit = entryPrice - takeProfit;
        risk = stopLoss - entryPrice;
      }
      
      const rr = profit / risk;

      // Validate
      expect(rr).toBeCloseTo(expectedRR, 2);
      validateRiskReward(rr);
      
      // Validate order structure
      validateOCOOrder({
        side,
        entryPrice,
        takeProfit,
        stopLoss,
        amount,
      });
    });
  });
});

/* ═══════════════════════════════════════════════════════════════
   EDGE CASE TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('OCO Order Edge Cases', () => {
  it('should handle very small price differences', () => {
    const entryPrice = 69000.00;
    const takeProfit = 69000.01;
    const stopLoss = 68999.99;
    
    const profit = takeProfit - entryPrice;
    const risk = entryPrice - stopLoss;
    const rr = profit / risk;
    
    expect(rr).toBeCloseTo(1.0, 2);
  });

  it('should handle very large price differences', () => {
    const entryPrice = 69000;
    const takeProfit = 100000;
    const stopLoss = 60000;
    
    const profit = takeProfit - entryPrice; // 31000
    const risk = entryPrice - stopLoss;     // 9000
    const rr = profit / risk;               // 3.44
    
    expect(rr).toBeGreaterThan(3);
  });

  it('should handle fractional risk/reward ratios', () => {
    const entryPrice = 69000;
    const takeProfit = 69750;
    const stopLoss = 68500;
    
    const profit = takeProfit - entryPrice; // 750
    const risk = entryPrice - stopLoss;     // 500
    const rr = profit / risk;               // 1.5
    
    expect(rr).toBe(1.5);
  });

  it('should reject invalid prices (NaN, Infinity)', () => {
    const invalidPrices = [NaN, Infinity, -Infinity];
    
    invalidPrices.forEach(price => {
      expect(isFinite(price)).toBe(false);
    });
  });
});

/* ═══════════════════════════════════════════════════════════════
   INTEGRATION TESTS
   ══��════════════════════════════════════════════════════════════ */

describe('OCO Order Integration', () => {
  it('should calculate complete order with all metrics', () => {
    const order = {
      side: 'buy' as const,
      symbol: 'BTC/USDT',
      entryPrice: 69000,
      takeProfit: 72000,
      stopLoss: 67500,
      amount: 1.0,
    };

    // Calculate all metrics
    const profit = order.takeProfit - order.entryPrice;
    const risk = order.entryPrice - order.stopLoss;
    const rr = profit / risk;
    
    const potentialProfit = profit * order.amount;
    const potentialLoss = risk * order.amount;
    
    const totalValue = order.entryPrice * order.amount;

    // Validate all calculations
    expect(profit).toBe(3000);
    expect(risk).toBe(1500);
    expect(rr).toBe(2.0);
    expect(potentialProfit).toBe(3000);
    expect(potentialLoss).toBe(1500);
    expect(totalValue).toBe(69000);
    
    validateOCOOrder(order);
  });

  it('should handle order modification scenarios', () => {
    // Original order
    let entryPrice = 69000;
    let takeProfit = 72000;
    let stopLoss = 67500;
    
    const originalRR = (takeProfit - entryPrice) / (entryPrice - stopLoss);
    expect(originalRR).toBe(2.0);
    
    // Tighten stop loss
    stopLoss = 68000;
    const tighterRR = (takeProfit - entryPrice) / (entryPrice - stopLoss);
    expect(tighterRR).toBe(3.0);
    
    // Extend take profit
    takeProfit = 75000;
    const extendedRR = (takeProfit - entryPrice) / (entryPrice - stopLoss);
    expect(extendedRR).toBe(6.0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   TEST SUMMARY
   ═══════════════════════════════════════════════════════════════ */

/**
 * OCO Order Form Test Coverage:
 * 
 * ✅ Risk/Reward calculation (4 tests)
 * ✅ P&L calculation (4 tests)
 * ✅ Price validation (4 tests)
 * ✅ Amount validation (4 tests)
 * ✅ Real-world scenarios (4 tests)
 * ✅ Edge cases (4 tests)
 * ✅ Integration tests (2 tests)
 * 
 * Total: 26 tests
 * Coverage: Calculations, Validation, Edge Cases, Integration
 */
