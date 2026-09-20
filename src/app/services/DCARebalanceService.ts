/**
 * DCA Auto-Rebalance Service
 * 
 * Handles portfolio rebalancing logic:
 * - Drift detection
 * - Rebalance calculation
 * - Execution planning
 * - History tracking
 * 
 * @module services/DCARebalanceService
 * @version 1.0 (Phase 2 - Sprint 3)
 */

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

/**
 * Rebalance Strategy
 */
export type RebalanceStrategy = 
  | 'threshold'    // Rebalance when drift exceeds threshold
  | 'periodic'     // Rebalance on fixed schedule
  | 'hybrid';      // Combine threshold + periodic

/**
 * Rebalance Frequency
 */
export type RebalanceFrequency = 
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly';

/**
 * Asset Allocation Target
 */
export interface AllocationTarget {
  /** Asset symbol */
  symbol: string;
  
  /** Target percentage (0-100) */
  targetPercent: number;
  
  /** Tolerance band (%) */
  tolerance?: number;
}

/**
 * Portfolio Holdings
 */
export interface PortfolioHolding {
  /** Asset symbol */
  symbol: string;
  
  /** Current quantity */
  quantity: number;
  
  /** Current price */
  price: number;
  
  /** Current value (quantity * price) */
  value: number;
  
  /** Current percentage of portfolio */
  currentPercent: number;
}

/**
 * Drift Analysis
 */
export interface DriftAnalysis {
  /** Asset symbol */
  symbol: string;
  
  /** Target percentage */
  targetPercent: number;
  
  /** Current percentage */
  currentPercent: number;
  
  /** Drift amount (current - target) */
  drift: number;
  
  /** Absolute drift */
  absDrift: number;
  
  /** Is drifting? */
  isDrifting: boolean;
  
  /** Drift severity (0-1) */
  severity: number;
}

/**
 * Rebalance Action
 */
export interface RebalanceAction {
  /** Asset symbol */
  symbol: string;
  
  /** Action type */
  action: 'buy' | 'sell' | 'hold';
  
  /** Current value */
  currentValue: number;
  
  /** Target value */
  targetValue: number;
  
  /** Amount to trade (in USD) */
  tradeAmount: number;
  
  /** Quantity to trade */
  tradeQuantity: number;
  
  /** Current allocation */
  currentPercent: number;
  
  /** Target allocation */
  targetPercent: number;
}

/**
 * Rebalance Plan
 */
export interface RebalancePlan {
  /** Plan ID */
  id: string;
  
  /** Created timestamp */
  createdAt: number;
  
  /** Portfolio value before */
  portfolioValueBefore: number;
  
  /** Portfolio value after (estimated) */
  portfolioValueAfter: number;
  
  /** Actions to execute */
  actions: RebalanceAction[];
  
  /** Total drift (%) */
  totalDrift: number;
  
  /** Max drift (%) */
  maxDrift: number;
  
  /** Estimated fees */
  estimatedFees: number;
  
  /** Is executable? */
  canExecute: boolean;
  
  /** Execution warnings */
  warnings: string[];
}

/**
 * Rebalance Configuration
 */
export interface RebalanceConfig {
  /** Config ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Strategy */
  strategy: RebalanceStrategy;
  
  /** Allocation targets */
  targets: AllocationTarget[];
  
  /** Drift threshold (%) for threshold strategy */
  driftThreshold: number;
  
  /** Frequency for periodic strategy */
  frequency?: RebalanceFrequency;
  
  /** Next rebalance date (for periodic) */
  nextRebalanceDate?: number;
  
  /** Minimum trade amount (USD) */
  minTradeAmount: number;
  
  /** Auto-execute? */
  autoExecute: boolean;
  
  /** Enabled? */
  enabled: boolean;
  
  /** Created at */
  createdAt: number;
  
  /** Updated at */
  updatedAt: number;
}

/**
 * Rebalance History Entry
 */
export interface RebalanceHistoryEntry {
  /** Entry ID */
  id: string;
  
  /** Config ID */
  configId: string;
  
  /** Executed timestamp */
  executedAt: number;
  
  /** Portfolio value before */
  portfolioValueBefore: number;
  
  /** Portfolio value after */
  portfolioValueAfter: number;
  
  /** Actions executed */
  actions: RebalanceAction[];
  
  /** Total drift corrected */
  totalDriftCorrected: number;
  
  /** Fees paid */
  feesPaid: number;
  
  /** Status */
  status: 'completed' | 'partial' | 'failed';
  
  /** Error message if failed */
  error?: string;
}

/* ═══════════════════════════════════════════
   SERVICE CLASS
   ═══════════════════════════════════════════ */

class DCARebalanceService {
  private configs: Map<string, RebalanceConfig> = new Map();
  private history: RebalanceHistoryEntry[] = [];
  
  /* ═══════════════════════════════════════════
     CONFIGURATION MANAGEMENT
     ═══════════════════════════════════════════ */
  
  /**
   * Create rebalance configuration
   */
  createConfig(config: Omit<RebalanceConfig, 'id' | 'createdAt' | 'updatedAt'>): RebalanceConfig {
    const newConfig: RebalanceConfig = {
      ...config,
      id: `rebal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.configs.set(newConfig.id, newConfig);
    return newConfig;
  }
  
  /**
   * Update configuration
   */
  updateConfig(id: string, updates: Partial<RebalanceConfig>): RebalanceConfig | null {
    const config = this.configs.get(id);
    if (!config) return null;
    
    const updatedConfig: RebalanceConfig = {
      ...config,
      ...updates,
      id: config.id, // Preserve ID
      createdAt: config.createdAt, // Preserve creation date
      updatedAt: Date.now(),
    };
    
    this.configs.set(id, updatedConfig);
    return updatedConfig;
  }
  
  /**
   * Get configuration
   */
  getConfig(id: string): RebalanceConfig | null {
    return this.configs.get(id) || null;
  }
  
  /**
   * Get all configurations for user
   */
  getUserConfigs(userId: string): RebalanceConfig[] {
    return Array.from(this.configs.values())
      .filter(c => c.userId === userId);
  }
  
  /**
   * Delete configuration
   */
  deleteConfig(id: string): boolean {
    return this.configs.delete(id);
  }
  
  /* ═══════════════════════════════════════════
     DRIFT DETECTION
     ═══════════════════════════════════════════ */
  
  /**
   * Analyze portfolio drift
   */
  analyzeDrift(
    targets: AllocationTarget[],
    holdings: PortfolioHolding[]
  ): DriftAnalysis[] {
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    
    return targets.map(target => {
      const holding = holdings.find(h => h.symbol === target.symbol);
      const currentPercent = holding ? (holding.value / totalValue) * 100 : 0;
      const drift = currentPercent - target.targetPercent;
      const absDrift = Math.abs(drift);
      const tolerance = target.tolerance || 5; // Default 5% tolerance
      
      return {
        symbol: target.symbol,
        targetPercent: target.targetPercent,
        currentPercent,
        drift,
        absDrift,
        isDrifting: absDrift > tolerance,
        severity: Math.min(1, absDrift / (tolerance * 2)), // 0-1 scale
      };
    });
  }
  
  /**
   * Check if rebalance is needed
   */
  needsRebalance(
    config: RebalanceConfig,
    holdings: PortfolioHolding[]
  ): { needed: boolean; reason: string; drift: DriftAnalysis[] } {
    const driftAnalysis = this.analyzeDrift(config.targets, holdings);
    const maxDrift = Math.max(...driftAnalysis.map(d => d.absDrift));
    
    // Threshold strategy
    if (config.strategy === 'threshold' || config.strategy === 'hybrid') {
      if (maxDrift > config.driftThreshold) {
        return {
          needed: true,
          reason: `Drift threshold exceeded (${maxDrift.toFixed(2)}% > ${config.driftThreshold}%)`,
          drift: driftAnalysis,
        };
      }
    }
    
    // Periodic strategy
    if (config.strategy === 'periodic' || config.strategy === 'hybrid') {
      if (config.nextRebalanceDate && Date.now() >= config.nextRebalanceDate) {
        return {
          needed: true,
          reason: 'Scheduled rebalance due',
          drift: driftAnalysis,
        };
      }
    }
    
    return {
      needed: false,
      reason: 'Portfolio within acceptable drift',
      drift: driftAnalysis,
    };
  }
  
  /* ═══════════════════════════════════════════
     REBALANCE PLANNING
     ═══════════════════════════════════════════ */
  
  /**
   * Calculate rebalance actions
   */
  calculateRebalanceActions(
    targets: AllocationTarget[],
    holdings: PortfolioHolding[],
    minTradeAmount: number = 10
  ): RebalanceAction[] {
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    
    const actions: RebalanceAction[] = targets.map(target => {
      const holding = holdings.find(h => h.symbol === target.symbol);
      const currentValue = holding?.value || 0;
      const currentPercent = (currentValue / totalValue) * 100;
      const targetValue = (target.targetPercent / 100) * totalValue;
      const tradeAmount = targetValue - currentValue;
      
      // Determine action
      let action: 'buy' | 'sell' | 'hold' = 'hold';
      if (Math.abs(tradeAmount) >= minTradeAmount) {
        action = tradeAmount > 0 ? 'buy' : 'sell';
      }
      
      return {
        symbol: target.symbol,
        action,
        currentValue,
        targetValue,
        tradeAmount: Math.abs(tradeAmount),
        tradeQuantity: holding ? Math.abs(tradeAmount) / holding.price : 0,
        currentPercent,
        targetPercent: target.targetPercent,
      };
    });
    
    return actions;
  }
  
  /**
   * Create rebalance plan
   */
  createRebalancePlan(
    config: RebalanceConfig,
    holdings: PortfolioHolding[]
  ): RebalancePlan {
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const driftAnalysis = this.analyzeDrift(config.targets, holdings);
    const actions = this.calculateRebalanceActions(config.targets, holdings, config.minTradeAmount);
    
    // Calculate metrics
    const totalDrift = driftAnalysis.reduce((sum, d) => sum + d.absDrift, 0);
    const maxDrift = Math.max(...driftAnalysis.map(d => d.absDrift));
    
    // Estimate fees (0.1% per trade)
    const activeTrades = actions.filter(a => a.action !== 'hold');
    const estimatedFees = activeTrades.reduce((sum, a) => sum + (a.tradeAmount * 0.001), 0);
    
    // Check if executable
    const warnings: string[] = [];
    let canExecute = true;
    
    // Validate sufficient balance for buys
    const totalBuyAmount = actions
      .filter(a => a.action === 'buy')
      .reduce((sum, a) => sum + a.tradeAmount, 0);
    
    const totalSellAmount = actions
      .filter(a => a.action === 'sell')
      .reduce((sum, a) => sum + a.tradeAmount, 0);
    
    if (totalBuyAmount > totalSellAmount + 1) {
      warnings.push('Insufficient sell proceeds to cover all buys');
      canExecute = false;
    }
    
    // Check for missing holdings
    const missingHoldings = config.targets
      .filter(t => !holdings.find(h => h.symbol === t.symbol))
      .map(t => t.symbol);
    
    if (missingHoldings.length > 0) {
      warnings.push(`Missing holdings: ${missingHoldings.join(', ')}`);
    }
    
    return {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      portfolioValueBefore: totalValue,
      portfolioValueAfter: totalValue - estimatedFees,
      actions,
      totalDrift,
      maxDrift,
      estimatedFees,
      canExecute,
      warnings,
    };
  }
  
  /* ═══════════════════════════════════════════
     EXECUTION
     ═══════════════════════════════════════════ */
  
  /**
   * Execute rebalance plan (mock)
   */
  async executeRebalancePlan(plan: RebalancePlan, configId: string): Promise<RebalanceHistoryEntry> {
    // In real implementation, this would:
    // 1. Validate plan is still valid
    // 2. Execute trades via exchange API
    // 3. Track execution status
    // 4. Handle partial fills
    
    // Mock execution
    const entry: RebalanceHistoryEntry = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      configId,
      executedAt: Date.now(),
      portfolioValueBefore: plan.portfolioValueBefore,
      portfolioValueAfter: plan.portfolioValueAfter,
      actions: plan.actions,
      totalDriftCorrected: plan.totalDrift,
      feesPaid: plan.estimatedFees,
      status: 'completed',
    };
    
    this.history.push(entry);
    return entry;
  }
  
  /* ═══════════════════════════════════════════
     HISTORY
     ═══════════════════════════════════════════ */
  
  /**
   * Get rebalance history
   */
  getHistory(configId?: string): RebalanceHistoryEntry[] {
    if (configId) {
      return this.history.filter(h => h.configId === configId);
    }
    return [...this.history];
  }
  
  /**
   * Get history stats
   */
  getHistoryStats(configId: string): {
    totalRebalances: number;
    totalDriftCorrected: number;
    totalFeesPaid: number;
    avgTimeBetweenRebalances: number;
    successRate: number;
  } {
    const entries = this.getHistory(configId);
    
    if (entries.length === 0) {
      return {
        totalRebalances: 0,
        totalDriftCorrected: 0,
        totalFeesPaid: 0,
        avgTimeBetweenRebalances: 0,
        successRate: 0,
      };
    }
    
    const totalDriftCorrected = entries.reduce((sum, e) => sum + e.totalDriftCorrected, 0);
    const totalFeesPaid = entries.reduce((sum, e) => sum + e.feesPaid, 0);
    const successCount = entries.filter(e => e.status === 'completed').length;
    
    // Calculate avg time between rebalances
    const sortedEntries = [...entries].sort((a, b) => a.executedAt - b.executedAt);
    let totalTimeDiff = 0;
    for (let i = 1; i < sortedEntries.length; i++) {
      totalTimeDiff += sortedEntries[i].executedAt - sortedEntries[i - 1].executedAt;
    }
    const avgTimeBetweenRebalances = sortedEntries.length > 1
      ? totalTimeDiff / (sortedEntries.length - 1)
      : 0;
    
    return {
      totalRebalances: entries.length,
      totalDriftCorrected,
      totalFeesPaid,
      avgTimeBetweenRebalances,
      successRate: entries.length > 0 ? (successCount / entries.length) * 100 : 0,
    };
  }
  
  /* ═══════════════════════════════════════════
     UTILITIES
     ═══════════════════════════════════════════ */
  
  /**
   * Calculate next rebalance date
   */
  calculateNextRebalanceDate(frequency: RebalanceFrequency, fromDate: number = Date.now()): number {
    const date = new Date(fromDate);
    
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'biweekly':
        date.setDate(date.getDate() + 14);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
    }
    
    return date.getTime();
  }
  
  /**
   * Validate allocation targets
   */
  validateTargets(targets: AllocationTarget[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check sum to 100%
    const totalPercent = targets.reduce((sum, t) => sum + t.targetPercent, 0);
    if (Math.abs(totalPercent - 100) > 0.01) {
      errors.push(`Target allocations must sum to 100% (current: ${totalPercent.toFixed(2)}%)`);
    }
    
    // Check individual targets
    targets.forEach(t => {
      if (t.targetPercent < 0 || t.targetPercent > 100) {
        errors.push(`Invalid target for ${t.symbol}: ${t.targetPercent}%`);
      }
    });
    
    // Check for duplicates
    const symbols = targets.map(t => t.symbol);
    const uniqueSymbols = new Set(symbols);
    if (symbols.length !== uniqueSymbols.size) {
      errors.push('Duplicate symbols in targets');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/* ═══════════════════════════════════════════
   SINGLETON INSTANCE
   ═══════════════════════════════════════════ */

export const rebalanceService = new DCARebalanceService();
export { DCARebalanceService };
