/**
 * DCA Portfolio Optimizer Service
 * 
 * Provides mock portfolio optimization analysis:
 * - Efficient Frontier (risk vs return)
 * - Correlation Matrix
 * - Backtesting against HODL baseline
 * - Risk Assessment (VaR, drawdown, volatility)
 * 
 * @module services/DCAPortfolioOptimizerService
 * @version 1.0 (Phase 2 - Sprint 3, Task 3.2.3)
 */

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

export interface AssetAllocation {
  symbol: string;
  name: string;
  color: string;
  weight: number; // 0-100
}

export interface FrontierPoint {
  risk: number;       // annualized volatility %
  return_: number;    // annualized return %
  sharpe: number;
  allocations: AssetAllocation[];
  label?: string;
}

export interface CorrelationEntry {
  assetA: string;
  assetB: string;
  correlation: number; // -1 to 1
}

export interface BacktestResult {
  month: string;
  dcaValue: number;
  hodlValue: number;
  invested: number;
}

export interface RiskMetrics {
  annualizedVolatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  valueAtRisk95: number;   // 95% confidence VaR as %
  valueAtRisk99: number;   // 99% confidence VaR as %
  beta: number;
  calmarRatio: number;
}

export interface OptimizationSuggestion {
  type: 'increase' | 'decrease' | 'add' | 'remove';
  symbol: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
}

/* ═══════════════════════════════════════════
   ASSET DATABASE
   ═══════════════════════════════════════════ */

const ASSET_DB: Record<string, { name: string; color: string }> = {
  BTC:  { name: 'Bitcoin',  color: '#F7931A' },
  ETH:  { name: 'Ethereum', color: '#627EEA' },
  BNB:  { name: 'BNB',      color: '#F3BA2F' },
  SOL:  { name: 'Solana',   color: '#9945FF' },
  ADA:  { name: 'Cardano',  color: '#0033AD' },
  USDT: { name: 'Tether',   color: '#26A17B' },
};

/* ═══════════════════════════════════════════
   MOCK EFFICIENT FRONTIER
   ═══════════════════════════════════════════ */

const FRONTIER_POINTS: FrontierPoint[] = [
  {
    risk: 8, return_: 6, sharpe: 0.75,
    allocations: [
      { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', weight: 20 },
      { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', weight: 15 },
      { symbol: 'USDT', name: 'Tether', color: '#26A17B', weight: 65 },
    ],
    label: 'Conservative',
  },
  {
    risk: 18, return_: 22, sharpe: 1.22,
    allocations: [
      { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', weight: 40 },
      { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', weight: 25 },
      { symbol: 'SOL', name: 'Solana', color: '#9945FF', weight: 10 },
      { symbol: 'USDT', name: 'Tether', color: '#26A17B', weight: 25 },
    ],
    label: 'Balanced',
  },
  {
    risk: 25, return_: 35, sharpe: 1.40,
    allocations: [
      { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', weight: 45 },
      { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', weight: 30 },
      { symbol: 'SOL', name: 'Solana', color: '#9945FF', weight: 15 },
      { symbol: 'BNB', name: 'BNB', color: '#F3BA2F', weight: 10 },
    ],
    label: 'Optimal (Max Sharpe)',
  },
  {
    risk: 35, return_: 42, sharpe: 1.20,
    allocations: [
      { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', weight: 50 },
      { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', weight: 25 },
      { symbol: 'SOL', name: 'Solana', color: '#9945FF', weight: 20 },
      { symbol: 'ADA', name: 'Cardano', color: '#0033AD', weight: 5 },
    ],
    label: 'Growth',
  },
  {
    risk: 48, return_: 55, sharpe: 1.15,
    allocations: [
      { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', weight: 35 },
      { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', weight: 25 },
      { symbol: 'SOL', name: 'Solana', color: '#9945FF', weight: 25 },
      { symbol: 'ADA', name: 'Cardano', color: '#0033AD', weight: 15 },
    ],
    label: 'Aggressive',
  },
];

/* ═══════════════════════════════════════════
   MOCK CORRELATION MATRIX
   ═══════════════════════════════════════════ */

const CORRELATIONS: CorrelationEntry[] = [
  { assetA: 'BTC', assetB: 'ETH',  correlation: 0.82 },
  { assetA: 'BTC', assetB: 'SOL',  correlation: 0.71 },
  { assetA: 'BTC', assetB: 'BNB',  correlation: 0.68 },
  { assetA: 'BTC', assetB: 'ADA',  correlation: 0.65 },
  { assetA: 'ETH', assetB: 'SOL',  correlation: 0.78 },
  { assetA: 'ETH', assetB: 'BNB',  correlation: 0.73 },
  { assetA: 'ETH', assetB: 'ADA',  correlation: 0.70 },
  { assetA: 'SOL', assetB: 'BNB',  correlation: 0.58 },
  { assetA: 'SOL', assetB: 'ADA',  correlation: 0.62 },
  { assetA: 'BNB', assetB: 'ADA',  correlation: 0.55 },
];

/* ═══════════════════════════════════════════
   MOCK BACKTEST DATA (12 months)
   ═══════════════════════════════════════════ */

const BACKTEST_DATA: BacktestResult[] = [
  { month: 'T4/25',  dcaValue: 1_000_000,  hodlValue: 1_000_000,  invested: 1_000_000 },
  { month: 'T5/25',  dcaValue: 2_080_000,  hodlValue: 1_950_000,  invested: 2_000_000 },
  { month: 'T6/25',  dcaValue: 2_850_000,  hodlValue: 2_600_000,  invested: 3_000_000 },
  { month: 'T7/25',  dcaValue: 4_200_000,  hodlValue: 3_800_000,  invested: 4_000_000 },
  { month: 'T8/25',  dcaValue: 4_950_000,  hodlValue: 4_200_000,  invested: 5_000_000 },
  { month: 'T9/25',  dcaValue: 5_600_000,  hodlValue: 5_100_000,  invested: 6_000_000 },
  { month: 'T10/25', dcaValue: 7_350_000,  hodlValue: 6_500_000,  invested: 7_000_000 },
  { month: 'T11/25', dcaValue: 8_200_000,  hodlValue: 7_400_000,  invested: 8_000_000 },
  { month: 'T12/25', dcaValue: 9_500_000,  hodlValue: 8_600_000,  invested: 9_000_000 },
  { month: 'T1/26',  dcaValue: 10_800_000, hodlValue: 9_500_000,  invested: 10_000_000 },
  { month: 'T2/26',  dcaValue: 11_400_000, hodlValue: 10_100_000, invested: 11_000_000 },
  { month: 'T3/26',  dcaValue: 12_850_000, hodlValue: 11_200_000, invested: 12_000_000 },
];

/* ═══════════════════════════════════════════
   SERVICE
   ═══════════════════════════════════════════ */

class PortfolioOptimizerService {
  /** Get efficient frontier points */
  getFrontierPoints(): FrontierPoint[] {
    return FRONTIER_POINTS;
  }

  /** Get optimal portfolio (max Sharpe) */
  getOptimalPortfolio(): FrontierPoint {
    return FRONTIER_POINTS.reduce((best, p) => p.sharpe > best.sharpe ? p : best, FRONTIER_POINTS[0]);
  }

  /** Get correlation matrix */
  getCorrelationMatrix(): CorrelationEntry[] {
    return CORRELATIONS;
  }

  /** Get correlation between two assets */
  getCorrelation(a: string, b: string): number {
    if (a === b) return 1;
    const entry = CORRELATIONS.find(
      c => (c.assetA === a && c.assetB === b) || (c.assetA === b && c.assetB === a)
    );
    return entry?.correlation ?? 0;
  }

  /** Get diversification score (0-100) */
  getDiversificationScore(allocations: AssetAllocation[]): number {
    if (allocations.length <= 1) return 0;
    const symbols = allocations.filter(a => a.weight > 0).map(a => a.symbol);
    if (symbols.length <= 1) return 0;

    let totalCorr = 0;
    let count = 0;
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        totalCorr += this.getCorrelation(symbols[i], symbols[j]);
        count++;
      }
    }
    const avgCorr = count > 0 ? totalCorr / count : 0;
    // Lower avg correlation = higher diversification
    return Math.round((1 - avgCorr) * 100);
  }

  /** Backtest DCA vs HODL */
  getBacktestResults(): BacktestResult[] {
    return BACKTEST_DATA;
  }

  /** Get risk metrics for a portfolio */
  getRiskMetrics(allocations: AssetAllocation[]): RiskMetrics {
    // Deterministic mock based on allocation weights
    const btcWeight = allocations.find(a => a.symbol === 'BTC')?.weight ?? 0;
    const stableWeight = allocations.find(a => a.symbol === 'USDT')?.weight ?? 0;
    const riskFactor = 1 - (stableWeight / 100);

    return {
      annualizedVolatility: 15 + (btcWeight * 0.5) * riskFactor,
      maxDrawdown: -(12 + (btcWeight * 0.35) * riskFactor),
      sharpeRatio: 1.2 + (btcWeight * 0.005),
      sortinoRatio: 1.6 + (btcWeight * 0.004),
      valueAtRisk95: -(3.5 + riskFactor * 4),
      valueAtRisk99: -(5.2 + riskFactor * 6),
      beta: 0.8 + riskFactor * 0.4,
      calmarRatio: 1.1 + riskFactor * 0.5,
    };
  }

  /** Get optimization suggestions for current portfolio */
  getSuggestions(current: AssetAllocation[]): OptimizationSuggestion[] {
    const optimal = this.getOptimalPortfolio();
    const suggestions: OptimizationSuggestion[] = [];

    for (const opt of optimal.allocations) {
      const cur = current.find(c => c.symbol === opt.symbol);
      if (!cur) {
        suggestions.push({
          type: 'add',
          symbol: opt.symbol,
          currentWeight: 0,
          suggestedWeight: opt.weight,
          reason: `Thêm ${ASSET_DB[opt.symbol]?.name ?? opt.symbol} để cải thiện diversification`,
        });
      } else if (Math.abs(cur.weight - opt.weight) > 5) {
        suggestions.push({
          type: cur.weight < opt.weight ? 'increase' : 'decrease',
          symbol: opt.symbol,
          currentWeight: cur.weight,
          suggestedWeight: opt.weight,
          reason: cur.weight < opt.weight
            ? `Tăng ${opt.symbol} từ ${cur.weight}% lên ${opt.weight}% để tiếp cận Sharpe tối ưu`
            : `Giảm ${opt.symbol} từ ${cur.weight}% xuống ${opt.weight}% để cân bằng rủi ro`,
        });
      }
    }

    for (const cur of current) {
      if (!optimal.allocations.find(o => o.symbol === cur.symbol) && cur.weight > 0) {
        suggestions.push({
          type: 'decrease',
          symbol: cur.symbol,
          currentWeight: cur.weight,
          suggestedWeight: 0,
          reason: `Giảm ${cur.symbol} — không nằm trong phân bổ tối ưu`,
        });
      }
    }

    return suggestions;
  }

  /** Get all supported assets */
  getAssets() {
    return ASSET_DB;
  }
}

export const portfolioOptimizerService = new PortfolioOptimizerService();
