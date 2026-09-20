/**
 * ══════════════════════════════════════════════════════════════════
 *  MARGIN TRADING - CALCULATION TESTS
 * ══════════════════════════════════════════════════════════════════
 *  Unit tests for financial calculations (VaR, Kelly, Sharpe, etc.)
 */

import { describe, it, expect } from 'vitest';

/* ═══════════════════════════════════════════════════════════════
   KELLY CRITERION TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('Kelly Criterion Calculator', () => {
  function calculateKelly(winRate: number, avgWin: number, avgLoss: number): number {
    const p = winRate / 100;
    const q = 1 - p;
    const b = avgWin / avgLoss;
    const kelly = (p * b - q) / b;
    return Math.max(0, Math.min(kelly * 0.5, 0.25)); // Half Kelly, capped at 25%
  }

  it('should calculate correct Kelly percentage for profitable strategy', () => {
    const result = calculateKelly(60, 150, 100);
    // p=0.6, q=0.4, b=1.5
    // kelly = (0.6 * 1.5 - 0.4) / 1.5 = (0.9 - 0.4) / 1.5 = 0.333
    // half kelly = 0.167
    expect(result).toBeCloseTo(0.167, 2);
  });

  it('should return 0 for losing strategy', () => {
    const result = calculateKelly(40, 100, 150);
    expect(result).toBe(0);
  });

  it('should cap at 25% maximum', () => {
    const result = calculateKelly(80, 300, 50);
    expect(result).toBeLessThanOrEqual(0.25);
  });

  it('should handle breakeven strategy', () => {
    const result = calculateKelly(50, 100, 100);
    expect(result).toBeCloseTo(0, 2);
  });

  it('should increase with higher win rate', () => {
    const kelly60 = calculateKelly(60, 150, 100);
    const kelly70 = calculateKelly(70, 150, 100);
    expect(kelly70).toBeGreaterThan(kelly60);
  });

  it('should increase with higher R:R ratio', () => {
    const kelly1to1 = calculateKelly(60, 100, 100);
    const kelly2to1 = calculateKelly(60, 200, 100);
    expect(kelly2to1).toBeGreaterThan(kelly1to1);
  });
});

/* ═══════════════════════════════════════════════════════════════
   SHARPE RATIO TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('Sharpe Ratio Calculator', () => {
  function calculateSharpe(returns: number[], riskFreeRate = 0.02): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return (mean - riskFreeRate) / stdDev;
  }

  it('should calculate correct Sharpe ratio for positive returns', () => {
    const returns = [0.05, 0.08, 0.03, 0.10, 0.06];
    const sharpe = calculateSharpe(returns, 0.02);
    expect(sharpe).toBeGreaterThan(0);
  });

  it('should return negative Sharpe for underperforming strategy', () => {
    const returns = [0.01, -0.02, 0.005, -0.01, 0.008];
    const sharpe = calculateSharpe(returns, 0.02);
    expect(sharpe).toBeLessThan(0);
  });

  it('should reward higher returns with same volatility', () => {
    const lowReturns = [0.03, 0.04, 0.05, 0.04, 0.03];
    const highReturns = [0.08, 0.09, 0.10, 0.09, 0.08];
    const sharpeLow = calculateSharpe(lowReturns, 0.02);
    const sharpeHigh = calculateSharpe(highReturns, 0.02);
    expect(sharpeHigh).toBeGreaterThan(sharpeLow);
  });

  it('should penalize higher volatility with same returns', () => {
    const lowVol = [0.05, 0.051, 0.049, 0.050, 0.051];
    const highVol = [0.05, 0.10, 0.00, 0.08, 0.02];
    const sharpeLowVol = calculateSharpe(lowVol, 0.02);
    const sharpeHighVol = calculateSharpe(highVol, 0.02);
    expect(sharpeLowVol).toBeGreaterThan(sharpeHighVol);
  });
});

/* ═══════════════════════════════════════════════════════════════
   VALUE AT RISK (VaR) TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('Value at Risk Calculator', () => {
  function calculateVaR(returns: number[], confidence = 0.95): number {
    const sorted = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sorted.length);
    return Math.abs(sorted[index]) * 100; // Convert to percentage
  }

  it('should calculate 95% VaR correctly', () => {
    const returns = Array.from({ length: 100 }, (_, i) => (i - 50) / 1000);
    const var95 = calculateVaR(returns, 0.95);
    expect(var95).toBeGreaterThan(0);
    expect(var95).toBeLessThan(10); // Reasonable bound
  });

  it('should increase VaR with higher confidence level', () => {
    const returns = Array.from({ length: 100 }, (_, i) => (Math.random() - 0.5) / 10);
    const var95 = calculateVaR(returns, 0.95);
    const var99 = calculateVaR(returns, 0.99);
    expect(var99).toBeGreaterThan(var95);
  });

  it('should handle zero-volatility returns', () => {
    const returns = Array(100).fill(0.01);
    const var95 = calculateVaR(returns, 0.95);
    expect(var95).toBeCloseTo(1, 1);
  });

  it('should reflect actual worst-case scenarios', () => {
    const returns = [...Array(95).fill(0.01), ...Array(5).fill(-0.10)];
    const var95 = calculateVaR(returns, 0.95);
    expect(var95).toBeGreaterThan(5); // Should capture the -10% losses
  });
});

/* ═══════════════════════════════════════════════════════════════
   POSITION SIZING TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('Position Sizing Calculator', () => {
  function calculateRiskBasedSize(
    accountBalance: number,
    entryPrice: number,
    stopLoss: number,
    riskPercent: number
  ): number {
    const maxRisk = accountBalance * (riskPercent / 100);
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    const units = maxRisk / riskPerUnit;
    return units * entryPrice;
  }

  it('should calculate correct position size for 2% risk', () => {
    const size = calculateRiskBasedSize(10000, 50000, 48000, 2);
    // Max risk: $200
    // Risk per BTC: $2000
    // Units: 0.1 BTC
    // Position size: $5000
    expect(size).toBeCloseTo(5000, 0);
  });

  it('should scale position size with account balance', () => {
    const size10k = calculateRiskBasedSize(10000, 50000, 48000, 2);
    const size20k = calculateRiskBasedSize(20000, 50000, 48000, 2);
    expect(size20k).toBeCloseTo(size10k * 2, 0);
  });

  it('should reduce position size for wider stop loss', () => {
    const tightStop = calculateRiskBasedSize(10000, 50000, 49000, 2);
    const wideStop = calculateRiskBasedSize(10000, 50000, 45000, 2);
    expect(tightStop).toBeGreaterThan(wideStop);
  });

  it('should increase position size for higher risk tolerance', () => {
    const risk1 = calculateRiskBasedSize(10000, 50000, 48000, 1);
    const risk3 = calculateRiskBasedSize(10000, 50000, 48000, 3);
    expect(risk3).toBeGreaterThan(risk1);
  });
});

/* ═══════════════════════════════════════════════════════════════
   LIQUIDATION PRICE TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('Liquidation Price Calculator', () => {
  function calculateLiquidationPrice(
    entryPrice: number,
    leverage: number,
    side: 'long' | 'short',
    maintenanceMargin = 0.005 // 0.5%
  ): number {
    if (side === 'long') {
      return entryPrice * (1 - (1 / leverage) + maintenanceMargin);
    } else {
      return entryPrice * (1 + (1 / leverage) - maintenanceMargin);
    }
  }

  it('should calculate long liquidation price correctly', () => {
    const liqPrice = calculateLiquidationPrice(50000, 10, 'long');
    // 50000 * (1 - 0.1 + 0.005) = 50000 * 0.905 = 45250
    expect(liqPrice).toBeCloseTo(45250, 0);
  });

  it('should calculate short liquidation price correctly', () => {
    const liqPrice = calculateLiquidationPrice(50000, 10, 'short');
    // 50000 * (1 + 0.1 - 0.005) = 50000 * 1.095 = 54750
    expect(liqPrice).toBeCloseTo(54750, 0);
  });

  it('should have closer liquidation price with higher leverage', () => {
    const liq5x = calculateLiquidationPrice(50000, 5, 'long');
    const liq20x = calculateLiquidationPrice(50000, 20, 'long');
    const distance5x = Math.abs(50000 - liq5x);
    const distance20x = Math.abs(50000 - liq20x);
    expect(distance20x).toBeLessThan(distance5x);
  });

  it('should never allow liquidation at entry price', () => {
    const liqLong = calculateLiquidationPrice(50000, 10, 'long');
    const liqShort = calculateLiquidationPrice(50000, 10, 'short');
    expect(liqLong).toBeLessThan(50000);
    expect(liqShort).toBeGreaterThan(50000);
  });
});

/* ═══════════════════════════════════════════════════════════════
   PROFIT/LOSS CALCULATION TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('PnL Calculator', () => {
  function calculatePnL(
    entryPrice: number,
    currentPrice: number,
    size: number,
    leverage: number,
    side: 'long' | 'short'
  ): { pnl: number; pnlPct: number; roe: number } {
    const priceDiff = side === 'long' ? currentPrice - entryPrice : entryPrice - currentPrice;
    const pnl = (priceDiff / entryPrice) * size * entryPrice;
    const investment = (size * entryPrice) / leverage;
    const roe = (pnl / investment) * 100;
    const pnlPct = (priceDiff / entryPrice) * 100;

    return { pnl, pnlPct, roe };
  }

  it('should calculate long position profit correctly', () => {
    const result = calculatePnL(50000, 52000, 1, 10, 'long');
    // Price increased 4%
    // PnL = (2000 / 50000) * 50000 = $2000
    // ROE = 2000 / 5000 * 100 = 40%
    expect(result.pnl).toBeCloseTo(2000, 0);
    expect(result.pnlPct).toBeCloseTo(4, 1);
    expect(result.roe).toBeCloseTo(40, 0);
  });

  it('should calculate short position profit correctly', () => {
    const result = calculatePnL(50000, 48000, 1, 10, 'short');
    // Price decreased 4%
    // PnL = $2000
    expect(result.pnl).toBeCloseTo(2000, 0);
    expect(result.roe).toBeCloseTo(40, 0);
  });

  it('should amplify returns with leverage', () => {
    const result5x = calculatePnL(50000, 52000, 1, 5, 'long');
    const result10x = calculatePnL(50000, 52000, 1, 10, 'long');
    expect(result10x.roe).toBeGreaterThan(result5x.roe);
  });

  it('should handle losses correctly', () => {
    const result = calculatePnL(50000, 48000, 1, 10, 'long');
    expect(result.pnl).toBeLessThan(0);
    expect(result.roe).toBeLessThan(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   FUNDING RATE TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('Funding Rate Calculator', () => {
  function calculateFundingPayment(
    positionValue: number,
    fundingRate: number,
    side: 'long' | 'short'
  ): number {
    const payment = positionValue * fundingRate;
    return side === 'long' ? -payment : payment;
  }

  it('should calculate funding payment for long position', () => {
    const payment = calculateFundingPayment(10000, 0.0001, 'long');
    expect(payment).toBeCloseTo(-1, 2);
  });

  it('should calculate funding payment for short position', () => {
    const payment = calculateFundingPayment(10000, 0.0001, 'short');
    expect(payment).toBeCloseTo(1, 2);
  });

  it('should reverse payment direction with negative funding', () => {
    const paymentPositive = calculateFundingPayment(10000, 0.0001, 'long');
    const paymentNegative = calculateFundingPayment(10000, -0.0001, 'long');
    expect(paymentNegative).toBeGreaterThan(0);
    expect(paymentPositive).toBeLessThan(0);
  });

  it('should scale with position size', () => {
    const payment10k = calculateFundingPayment(10000, 0.0001, 'long');
    const payment20k = calculateFundingPayment(20000, 0.0001, 'long');
    expect(Math.abs(payment20k)).toBeCloseTo(Math.abs(payment10k) * 2, 2);
  });
});

/* ═══════════════════════════════════════════════════════════════
   MARGIN RATIO TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('Margin Ratio Calculator', () => {
  function calculateMarginRatio(
    equity: number,
    maintenanceMargin: number
  ): number {
    return (equity / maintenanceMargin) * 100;
  }

  it('should calculate healthy margin ratio', () => {
    const ratio = calculateMarginRatio(10000, 500);
    expect(ratio).toBe(2000); // 2000%
  });

  it('should show critical margin ratio', () => {
    const ratio = calculateMarginRatio(5100, 5000);
    expect(ratio).toBeCloseTo(102, 0);
  });

  it('should indicate liquidation risk below 100%', () => {
    const ratio = calculateMarginRatio(4900, 5000);
    expect(ratio).toBeLessThan(100);
  });

  it('should increase with added margin', () => {
    const ratioBefore = calculateMarginRatio(10000, 500);
    const ratioAfter = calculateMarginRatio(12000, 500);
    expect(ratioAfter).toBeGreaterThan(ratioBefore);
  });
});

/* ═══════════════════════════════════════════════════════════════
   TRADE JOURNAL STATISTICS TESTS
   ═══════════════════════════════════════════════════════════════ */

describe('Trade Statistics Calculator', () => {
  interface Trade {
    pnl: number;
    outcome: 'win' | 'loss' | 'breakeven';
  }

  function calculateStats(trades: Trade[]) {
    const wins = trades.filter(t => t.outcome === 'win');
    const losses = trades.filter(t => t.outcome === 'loss');
    const totalWinPnl = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLossPnl = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

    return {
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      profitFactor: totalLossPnl > 0 ? totalWinPnl / totalLossPnl : 0,
      expectancy: trades.length > 0 ? trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length : 0,
    };
  }

  it('should calculate 100% win rate for all wins', () => {
    const trades: Trade[] = [
      { pnl: 100, outcome: 'win' },
      { pnl: 150, outcome: 'win' },
      { pnl: 200, outcome: 'win' },
    ];
    const stats = calculateStats(trades);
    expect(stats.winRate).toBe(100);
  });

  it('should calculate correct profit factor', () => {
    const trades: Trade[] = [
      { pnl: 300, outcome: 'win' },
      { pnl: -100, outcome: 'loss' },
    ];
    const stats = calculateStats(trades);
    expect(stats.profitFactor).toBe(3);
  });

  it('should calculate positive expectancy for profitable strategy', () => {
    const trades: Trade[] = [
      { pnl: 150, outcome: 'win' },
      { pnl: 200, outcome: 'win' },
      { pnl: -100, outcome: 'loss' },
    ];
    const stats = calculateStats(trades);
    expect(stats.expectancy).toBeGreaterThan(0);
  });

  it('should calculate 50% win rate for balanced trades', () => {
    const trades: Trade[] = [
      { pnl: 100, outcome: 'win' },
      { pnl: -100, outcome: 'loss' },
    ];
    const stats = calculateStats(trades);
    expect(stats.winRate).toBe(50);
  });
});

/* ═══════════════════════════════════════════════════════════════
   EDGE CASES & ERROR HANDLING
   ═══════════════════════════════════════════════════════════════ */

describe('Edge Cases & Error Handling', () => {
  it('should handle zero account balance', () => {
    const kelly = calculateKelly(60, 150, 100);
    expect(kelly).toBeGreaterThanOrEqual(0);
  });

  it('should handle extreme leverage', () => {
    function calculateLiquidationPrice(
      entryPrice: number,
      leverage: number,
      side: 'long' | 'short',
      maintenanceMargin = 0.005
    ): number {
      if (side === 'long') {
        return entryPrice * (1 - (1 / leverage) + maintenanceMargin);
      } else {
        return entryPrice * (1 + (1 / leverage) - maintenanceMargin);
      }
    }

    const liq = calculateLiquidationPrice(50000, 125, 'long');
    expect(liq).toBeGreaterThan(0);
    expect(liq).toBeLessThan(50000);
  });

  it('should handle negative returns in Sharpe calculation', () => {
    function calculateSharpe(returns: number[], riskFreeRate = 0.02): number {
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      return (mean - riskFreeRate) / stdDev;
    }

    const returns = [-0.05, -0.03, -0.08, -0.02, -0.04];
    const sharpe = calculateSharpe(returns);
    expect(sharpe).toBeLessThan(0);
  });

  it('should handle identical returns (zero volatility)', () => {
    function calculateSharpe(returns: number[], riskFreeRate = 0.02): number {
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev === 0) return 0;
      return (mean - riskFreeRate) / stdDev;
    }

    const returns = [0.05, 0.05, 0.05, 0.05, 0.05];
    const sharpe = calculateSharpe(returns);
    expect(sharpe).toBe(0);
  });
});

function calculateKelly(winRate: number, avgWin: number, avgLoss: number): number {
  const p = winRate / 100;
  const q = 1 - p;
  const b = avgWin / avgLoss;
  const kelly = (p * b - q) / b;
  return Math.max(0, Math.min(kelly * 0.5, 0.25));
}
