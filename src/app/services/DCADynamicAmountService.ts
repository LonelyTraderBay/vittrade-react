/**
 * DCA Dynamic Amount Adjustment Service
 * 
 * Provides smart amount adjustment strategies:
 * - Volatility-Based: increase during high vol, decrease during low
 * - Performance-Based: adjust based on plan P/L
 * - Balance-Based: auto-reduce/pause on low balance
 * - Target-Based: adjust to hit target by deadline
 * 
 * @module services/DCADynamicAmountService
 * @version 1.0 (Phase 2 - Sprint 3, Task 3.2.4)
 */

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

export type AdjustmentStrategy =
  | 'fixed'          // No adjustment
  | 'volatility'     // Based on recent volatility
  | 'performance'    // Based on plan P/L
  | 'balance'        // Based on available balance
  | 'target';        // Path-to-target calculation

export interface VolatilityConfig {
  /** Base amount (VND) */
  baseAmount: number;
  /** Increase multiplier when vol > high threshold (e.g. 1.5) */
  highVolMultiplier: number;
  /** Decrease multiplier when vol < low threshold (e.g. 0.7) */
  lowVolMultiplier: number;
  /** High volatility threshold (%) */
  highVolThreshold: number;
  /** Low volatility threshold (%) */
  lowVolThreshold: number;
  /** Skip purchase if vol > this (%) */
  skipVolThreshold: number;
}

export interface PerformanceConfig {
  /** Base amount (VND) */
  baseAmount: number;
  /** Increase multiplier when profitable */
  profitMultiplier: number;
  /** Decrease multiplier when losing */
  lossMultiplier: number;
  /** Auto-pause if loss exceeds this % */
  pauseThresholdPercent: number;
}

export interface BalanceConfig {
  /** Base amount (VND) */
  baseAmount: number;
  /** Min balance to maintain (VND) */
  minBalance: number;
  /** Auto-reduce when balance < this (VND) */
  reduceThreshold: number;
  /** Auto-pause when balance < this (VND) */
  pauseThreshold: number;
}

export interface TargetConfig {
  /** Target total value (VND) */
  targetValue: number;
  /** Deadline */
  targetDate: Date;
  /** Min amount per purchase (VND) */
  minAmount: number;
  /** Max amount per purchase (VND) */
  maxAmount: number;
}

export interface DynamicAmountConfig {
  strategy: AdjustmentStrategy;
  volatility?: VolatilityConfig;
  performance?: PerformanceConfig;
  balance?: BalanceConfig;
  target?: TargetConfig;
}

export interface AdjustmentResult {
  originalAmount: number;
  adjustedAmount: number;
  multiplier: number;
  reason: string;
  action: 'normal' | 'increased' | 'decreased' | 'skipped' | 'paused';
}

export interface VolatilitySnapshot {
  date: string;
  volatility: number;
  suggestedMultiplier: number;
  amount: number;
}

export interface AmountHistoryEntry {
  date: string;
  baseAmount: number;
  adjustedAmount: number;
  strategy: AdjustmentStrategy;
  reason: string;
}

/* ═══════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════ */

const VOLATILITY_HISTORY: VolatilitySnapshot[] = [
  { date: '01/01', volatility: 12.5, suggestedMultiplier: 0.7, amount: 350_000 },
  { date: '08/01', volatility: 18.2, suggestedMultiplier: 1.0, amount: 500_000 },
  { date: '15/01', volatility: 35.8, suggestedMultiplier: 1.5, amount: 750_000 },
  { date: '22/01', volatility: 28.4, suggestedMultiplier: 1.3, amount: 650_000 },
  { date: '29/01', volatility: 15.3, suggestedMultiplier: 0.8, amount: 400_000 },
  { date: '05/02', volatility: 42.1, suggestedMultiplier: 1.5, amount: 750_000 },
  { date: '12/02', volatility: 22.0, suggestedMultiplier: 1.0, amount: 500_000 },
  { date: '19/02', volatility: 8.5,  suggestedMultiplier: 0.7, amount: 350_000 },
  { date: '26/02', volatility: 31.2, suggestedMultiplier: 1.4, amount: 700_000 },
  { date: '05/03', volatility: 19.8, suggestedMultiplier: 1.0, amount: 500_000 },
];

const AMOUNT_HISTORY: AmountHistoryEntry[] = [
  { date: '05/03/26', baseAmount: 500_000, adjustedAmount: 500_000, strategy: 'volatility', reason: 'Volatility bình thường (19.8%)' },
  { date: '26/02/26', baseAmount: 500_000, adjustedAmount: 700_000, strategy: 'volatility', reason: 'Volatility cao (31.2%) — cơ hội mua giá tốt' },
  { date: '19/02/26', baseAmount: 500_000, adjustedAmount: 350_000, strategy: 'volatility', reason: 'Volatility thấp (8.5%) — giảm lượng mua' },
  { date: '12/02/26', baseAmount: 500_000, adjustedAmount: 500_000, strategy: 'volatility', reason: 'Volatility bình thường (22.0%)' },
  { date: '05/02/26', baseAmount: 500_000, adjustedAmount: 750_000, strategy: 'volatility', reason: 'Volatility rất cao (42.1%) — tối đa lượng mua' },
  { date: '29/01/26', baseAmount: 500_000, adjustedAmount: 400_000, strategy: 'performance', reason: 'Portfolio lỗ -3.2% — giảm nhẹ' },
  { date: '22/01/26', baseAmount: 500_000, adjustedAmount: 650_000, strategy: 'volatility', reason: 'Volatility cao (28.4%) — tăng lượng mua' },
  { date: '15/01/26', baseAmount: 500_000, adjustedAmount: 750_000, strategy: 'volatility', reason: 'Volatility cao (35.8%) — cơ hội mua rẻ' },
];

/* ═══════════════════════════════════════════
   DEFAULT CONFIGS
   ═══════════════════════════════════════════ */

export const DEFAULT_VOLATILITY_CONFIG: VolatilityConfig = {
  baseAmount: 500_000,
  highVolMultiplier: 1.5,
  lowVolMultiplier: 0.7,
  highVolThreshold: 25,
  lowVolThreshold: 12,
  skipVolThreshold: 60,
};

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  baseAmount: 500_000,
  profitMultiplier: 1.2,
  lossMultiplier: 0.8,
  pauseThresholdPercent: -20,
};

export const DEFAULT_BALANCE_CONFIG: BalanceConfig = {
  baseAmount: 500_000,
  minBalance: 1_000_000,
  reduceThreshold: 3_000_000,
  pauseThreshold: 500_000,
};

export const DEFAULT_TARGET_CONFIG: TargetConfig = {
  targetValue: 50_000_000,
  targetDate: new Date('2026-12-31'),
  minAmount: 200_000,
  maxAmount: 2_000_000,
};

/* ═══════════════════════════════════════════
   SERVICE
   ═══════════════════════════════════════════ */

class DynamicAmountService {
  /** Calculate adjusted amount based on strategy */
  calculateAdjustment(config: DynamicAmountConfig): AdjustmentResult {
    switch (config.strategy) {
      case 'volatility':
        return this._calcVolatility(config.volatility ?? DEFAULT_VOLATILITY_CONFIG);
      case 'performance':
        return this._calcPerformance(config.performance ?? DEFAULT_PERFORMANCE_CONFIG);
      case 'balance':
        return this._calcBalance(config.balance ?? DEFAULT_BALANCE_CONFIG);
      case 'target':
        return this._calcTarget(config.target ?? DEFAULT_TARGET_CONFIG);
      default:
        return {
          originalAmount: 500_000,
          adjustedAmount: 500_000,
          multiplier: 1.0,
          reason: 'Mua số tiền cố định mỗi kỳ',
          action: 'normal',
        };
    }
  }

  private _calcVolatility(cfg: VolatilityConfig): AdjustmentResult {
    // Use current mock volatility (last snapshot)
    const currentVol = VOLATILITY_HISTORY[VOLATILITY_HISTORY.length - 1].volatility;

    if (currentVol >= cfg.skipVolThreshold) {
      return {
        originalAmount: cfg.baseAmount,
        adjustedAmount: 0,
        multiplier: 0,
        reason: `Volatility quá cao (${currentVol.toFixed(1)}%) — tạm bỏ qua`,
        action: 'skipped',
      };
    }
    if (currentVol >= cfg.highVolThreshold) {
      const adj = Math.round(cfg.baseAmount * cfg.highVolMultiplier);
      return {
        originalAmount: cfg.baseAmount,
        adjustedAmount: adj,
        multiplier: cfg.highVolMultiplier,
        reason: `Volatility cao (${currentVol.toFixed(1)}%) — tăng lượng mua`,
        action: 'increased',
      };
    }
    if (currentVol <= cfg.lowVolThreshold) {
      const adj = Math.round(cfg.baseAmount * cfg.lowVolMultiplier);
      return {
        originalAmount: cfg.baseAmount,
        adjustedAmount: adj,
        multiplier: cfg.lowVolMultiplier,
        reason: `Volatility thấp (${currentVol.toFixed(1)}%) — giảm lượng mua`,
        action: 'decreased',
      };
    }
    return {
      originalAmount: cfg.baseAmount,
      adjustedAmount: cfg.baseAmount,
      multiplier: 1.0,
      reason: `Volatility bình thường (${currentVol.toFixed(1)}%)`,
      action: 'normal',
    };
  }

  private _calcPerformance(cfg: PerformanceConfig): AdjustmentResult {
    // Mock: current plan P/L = +8.5%
    const planPnL = 8.5;
    if (planPnL <= cfg.pauseThresholdPercent) {
      return {
        originalAmount: cfg.baseAmount,
        adjustedAmount: 0,
        multiplier: 0,
        reason: `Thua lỗ ${planPnL}% vượt ngưỡng — tạm dừng`,
        action: 'paused',
      };
    }
    if (planPnL > 0) {
      const adj = Math.round(cfg.baseAmount * cfg.profitMultiplier);
      return {
        originalAmount: cfg.baseAmount,
        adjustedAmount: adj,
        multiplier: cfg.profitMultiplier,
        reason: `Portfolio lời +${planPnL}% — tăng nhẹ lượng mua`,
        action: 'increased',
      };
    }
    const adj = Math.round(cfg.baseAmount * cfg.lossMultiplier);
    return {
      originalAmount: cfg.baseAmount,
      adjustedAmount: adj,
      multiplier: cfg.lossMultiplier,
      reason: `Portfolio lỗ ${planPnL}% — giảm nhẹ lượng mua`,
      action: 'decreased',
    };
  }

  private _calcBalance(cfg: BalanceConfig): AdjustmentResult {
    // Mock: current balance = 5,200,000 VND
    const currentBalance = 5_200_000;
    if (currentBalance <= cfg.pauseThreshold) {
      return {
        originalAmount: cfg.baseAmount,
        adjustedAmount: 0,
        multiplier: 0,
        reason: `Số dư quá thấp (${(currentBalance / 1_000_000).toFixed(1)}M) — tạm dừng`,
        action: 'paused',
      };
    }
    if (currentBalance <= cfg.reduceThreshold) {
      const ratio = Math.max(0.3, (currentBalance - cfg.pauseThreshold) / (cfg.reduceThreshold - cfg.pauseThreshold));
      const adj = Math.round(cfg.baseAmount * ratio);
      return {
        originalAmount: cfg.baseAmount,
        adjustedAmount: adj,
        multiplier: ratio,
        reason: `Số dư thấp — giảm lượng mua để duy trì đệm`,
        action: 'decreased',
      };
    }
    return {
      originalAmount: cfg.baseAmount,
      adjustedAmount: cfg.baseAmount,
      multiplier: 1.0,
      reason: `Số dư đủ (${(currentBalance / 1_000_000).toFixed(1)}M)`,
      action: 'normal',
    };
  }

  private _calcTarget(cfg: TargetConfig): AdjustmentResult {
    // Mock: current value = 12,850,000, target = 50,000,000 by end 2026
    const currentValue = 12_850_000;
    const remaining = cfg.targetValue - currentValue;
    const now = new Date();
    const msRemaining = cfg.targetDate.getTime() - now.getTime();
    const weeksRemaining = Math.max(1, Math.floor(msRemaining / (7 * 24 * 60 * 60 * 1000)));

    const neededPerWeek = Math.round(remaining / weeksRemaining);
    const adjusted = Math.min(cfg.maxAmount, Math.max(cfg.minAmount, neededPerWeek));

    return {
      originalAmount: cfg.minAmount,
      adjustedAmount: adjusted,
      multiplier: adjusted / cfg.minAmount,
      reason: `Cần ~${(neededPerWeek / 1_000_000).toFixed(1)}M/tuần để đạt mục tiêu ${(cfg.targetValue / 1_000_000).toFixed(0)}M`,
      action: adjusted > cfg.minAmount ? 'increased' : 'normal',
    };
  }

  /** Get volatility history */
  getVolatilityHistory(): VolatilitySnapshot[] {
    return VOLATILITY_HISTORY;
  }

  /** Get amount adjustment history */
  getAmountHistory(): AmountHistoryEntry[] {
    return AMOUNT_HISTORY;
  }

  /** Get all strategy options */
  getStrategies(): Array<{
    id: AdjustmentStrategy;
    name: string;
    description: string;
    icon: string;
  }> {
    return [
      { id: 'fixed', name: 'Cố định', description: 'Mua cùng số tiền mỗi kỳ', icon: 'lock' },
      { id: 'volatility', name: 'Theo Volatility', description: 'Mua nhiều khi thị trường biến động, mua ít khi ổn định', icon: 'activity' },
      { id: 'performance', name: 'Theo Hiệu suất', description: 'Điều chỉnh dựa trên lời/lỗ của portfolio', icon: 'trending-up' },
      { id: 'balance', name: 'Theo Số dư', description: 'Tự động giảm/dừng khi số dư ví thấp', icon: 'wallet' },
      { id: 'target', name: 'Theo Mục tiêu', description: 'Tính toán lượng mua để đạt mục tiêu đúng hạn', icon: 'target' },
    ];
  }
}

export const dynamicAmountService = new DynamicAmountService();
