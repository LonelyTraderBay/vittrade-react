/**
 * DCA Smart Scheduling Service
 * 
 * Optimizes DCA execution timing based on:
 * - Market volatility
 * - Gas fees (for crypto)
 * - Historical patterns
 * - Trading volume
 * - Price action
 * 
 * @module services/DCASmartSchedulingService
 * @version 1.0 (Phase 2 - Sprint 3)
 */

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

/**
 * Scheduling Strategy
 */
export type SchedulingStrategy =
  | 'fixed'           // Fixed time, no optimization
  | 'volatility'      // Execute during low volatility
  | 'gas-optimized'   // Execute when gas fees are low
  | 'volume'          // Execute during high volume
  | 'hybrid';         // Combine multiple factors

/**
 * Time of Day Preference
 */
export type TimePreference =
  | 'morning'         // 6am-12pm
  | 'afternoon'       // 12pm-6pm
  | 'evening'         // 6pm-12am
  | 'night'           // 12am-6am
  | 'any';            // No preference

/**
 * Market Condition
 */
export interface MarketCondition {
  /** Timestamp */
  timestamp: number;
  
  /** Current volatility (%) */
  volatility: number;
  
  /** Gas price (gwei) */
  gasPrice: number;
  
  /** Trading volume (24h) */
  volume24h: number;
  
  /** Price change (24h %) */
  priceChange24h: number;
  
  /** Trend direction */
  trend: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Execution Window
 */
export interface ExecutionWindow {
  /** Start time (timestamp) */
  start: number;
  
  /** End time (timestamp) */
  end: number;
  
  /** Optimal time within window */
  optimalTime: number;
  
  /** Expected volatility */
  expectedVolatility: number;
  
  /** Expected gas price */
  expectedGasPrice: number;
  
  /** Score (0-100, higher is better) */
  score: number;
  
  /** Reasoning */
  reason: string;
}

/**
 * Historical Pattern
 */
export interface HistoricalPattern {
  /** Hour of day (0-23) */
  hour: number;
  
  /** Day of week (0-6, 0=Sunday) */
  dayOfWeek: number;
  
  /** Average volatility */
  avgVolatility: number;
  
  /** Average gas price */
  avgGasPrice: number;
  
  /** Average volume */
  avgVolume: number;
  
  /** Sample count */
  sampleCount: number;
}

/**
 * Smart Schedule Configuration
 */
export interface SmartScheduleConfig {
  /** Config ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** DCA plan ID */
  planId: string;
  
  /** Strategy */
  strategy: SchedulingStrategy;
  
  /** Time preference */
  timePreference: TimePreference;
  
  /** Max delay allowed (hours) */
  maxDelayHours: number;
  
  /** Max advance allowed (hours) */
  maxAdvanceHours: number;
  
  /** Volatility threshold (%) */
  volatilityThreshold?: number;
  
  /** Gas price threshold (gwei) */
  gasPriceThreshold?: number;
  
  /** Enabled? */
  enabled: boolean;
  
  /** Created at */
  createdAt: number;
  
  /** Updated at */
  updatedAt: number;
}

/**
 * Scheduling Decision
 */
export interface SchedulingDecision {
  /** Decision ID */
  id: string;
  
  /** Scheduled time (original) */
  scheduledTime: number;
  
  /** Recommended time (optimized) */
  recommendedTime: number;
  
  /** Delay/advance (ms) */
  adjustment: number;
  
  /** Adjustment (hours) */
  adjustmentHours: number;
  
  /** Market condition at scheduled time */
  scheduledCondition: MarketCondition;
  
  /** Market condition at recommended time */
  recommendedCondition: MarketCondition;
  
  /** Score improvement */
  scoreImprovement: number;
  
  /** Reasoning */
  reasoning: string[];
  
  /** Should delay/advance? */
  shouldAdjust: boolean;
}

/**
 * Scheduling Stats
 */
export interface SchedulingStats {
  /** Total decisions */
  totalDecisions: number;
  
  /** Adjustments made */
  adjustmentsMade: number;
  
  /** Average adjustment (hours) */
  avgAdjustment: number;
  
  /** Average score improvement */
  avgScoreImprovement: number;
  
  /** Volatility savings (%) */
  volatilitySavings: number;
  
  /** Gas savings (%) */
  gasSavings: number;
}

/* ═══════════════════════════════════════════
   MOCK DATA GENERATORS
   ═══════════════════════════════════════════ */

/**
 * Generate mock market condition
 */
function generateMockMarketCondition(timestamp: number): MarketCondition {
  const hour = new Date(timestamp).getHours();
  
  // Volatility varies by time of day
  // Higher during market open (9am-4pm EST)
  const baseVolatility = hour >= 9 && hour <= 16 ? 2.5 : 1.5;
  const volatility = baseVolatility + Math.random() * 1.5;
  
  // Gas prices higher during peak hours
  const baseGasPrice = hour >= 14 && hour <= 20 ? 30 : 15;
  const gasPrice = baseGasPrice + Math.random() * 20;
  
  // Volume higher during day
  const volume24h = hour >= 8 && hour <= 20 ? 50000000 : 30000000;
  
  const priceChange24h = (Math.random() - 0.5) * 10;
  
  const trend: 'bullish' | 'bearish' | 'neutral' =
    priceChange24h > 2 ? 'bullish' :
    priceChange24h < -2 ? 'bearish' : 'neutral';
  
  return {
    timestamp,
    volatility,
    gasPrice,
    volume24h,
    priceChange24h,
    trend,
  };
}

/* ═══════════════════════════════════════════
   SERVICE CLASS
   ═══════════════════════════════════════════ */

class DCASmartSchedulingService {
  private configs: Map<string, SmartScheduleConfig> = new Map();
  private decisions: SchedulingDecision[] = [];
  private patterns: HistoricalPattern[] = [];
  
  constructor() {
    this.initializePatterns();
  }
  
  /* ═══════════════════════════════════════════
     INITIALIZATION
     ═══════════════════════════════════════════ */
  
  /**
   * Initialize historical patterns (mock data)
   */
  private initializePatterns() {
    // Generate patterns for each hour of each day
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Night/early morning: lowest volatility & gas
        // Business hours (9am-5pm): higher volatility & gas
        // Evening: moderate
        
        let avgVolatility: number;
        let avgGasPrice: number;
        
        if (hour >= 2 && hour < 8) {
          // Night/early morning: best for execution
          avgVolatility = 1.2 + Math.random() * 0.5;
          avgGasPrice = 12 + Math.random() * 5;
        } else if (hour >= 9 && hour < 17) {
          // Business hours: worst for execution
          avgVolatility = 2.5 + Math.random() * 1.0;
          avgGasPrice = 35 + Math.random() * 15;
        } else {
          // Evening: moderate
          avgVolatility = 1.8 + Math.random() * 0.8;
          avgGasPrice = 20 + Math.random() * 10;
        }
        
        this.patterns.push({
          hour,
          dayOfWeek: day,
          avgVolatility,
          avgGasPrice,
          avgVolume: 40000000 + Math.random() * 20000000,
          sampleCount: 100,
        });
      }
    }
  }
  
  /* ═══════════════════════════════════════════
     CONFIGURATION MANAGEMENT
     ═══════════════════════════════════════════ */
  
  /**
   * Create smart schedule configuration
   */
  createConfig(
    config: Omit<SmartScheduleConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): SmartScheduleConfig {
    const newConfig: SmartScheduleConfig = {
      ...config,
      id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    this.configs.set(newConfig.id, newConfig);
    return newConfig;
  }
  
  /**
   * Get configuration
   */
  getConfig(id: string): SmartScheduleConfig | null {
    return this.configs.get(id) || null;
  }
  
  /**
   * Get configs by plan ID
   */
  getConfigsByPlan(planId: string): SmartScheduleConfig[] {
    return Array.from(this.configs.values())
      .filter(c => c.planId === planId);
  }
  
  /**
   * Update configuration
   */
  updateConfig(
    id: string,
    updates: Partial<SmartScheduleConfig>
  ): SmartScheduleConfig | null {
    const config = this.configs.get(id);
    if (!config) return null;
    
    const updated: SmartScheduleConfig = {
      ...config,
      ...updates,
      id: config.id,
      createdAt: config.createdAt,
      updatedAt: Date.now(),
    };
    
    this.configs.set(id, updated);
    return updated;
  }
  
  /* ═══════════════════════════════════════════
     PATTERN ANALYSIS
     ═══════════════════════════════════════════ */
  
  /**
   * Get historical pattern for a specific time
   */
  getPattern(timestamp: number): HistoricalPattern | null {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    return this.patterns.find(
      p => p.hour === hour && p.dayOfWeek === dayOfWeek
    ) || null;
  }
  
  /**
   * Find best execution windows within a range
   */
  findBestWindows(
    startTime: number,
    endTime: number,
    strategy: SchedulingStrategy
  ): ExecutionWindow[] {
    const windows: ExecutionWindow[] = [];
    const hourMs = 60 * 60 * 1000;
    
    // Analyze each hour in the range
    for (let time = startTime; time <= endTime; time += hourMs) {
      const pattern = this.getPattern(time);
      if (!pattern) continue;
      
      const condition = generateMockMarketCondition(time);
      const score = this.calculateExecutionScore(condition, strategy);
      
      windows.push({
        start: time,
        end: time + hourMs,
        optimalTime: time + hourMs / 2,
        expectedVolatility: pattern.avgVolatility,
        expectedGasPrice: pattern.avgGasPrice,
        score,
        reason: this.generateScoreReason(condition, strategy),
      });
    }
    
    // Sort by score (descending)
    return windows.sort((a, b) => b.score - a.score);
  }
  
  /* ═══════════════════════════════════════════
     SCORING
     ═══════════════════════════════════════════ */
  
  /**
   * Calculate execution score (0-100)
   */
  private calculateExecutionScore(
    condition: MarketCondition,
    strategy: SchedulingStrategy
  ): number {
    let score = 50; // Base score
    
    switch (strategy) {
      case 'volatility':
        // Lower volatility = higher score
        score = 100 - (condition.volatility * 10);
        break;
        
      case 'gas-optimized':
        // Lower gas = higher score
        score = 100 - (condition.gasPrice / 2);
        break;
        
      case 'volume':
        // Higher volume = higher score (but diminishing returns)
        const volumeScore = Math.min(100, condition.volume24h / 1000000);
        score = volumeScore;
        break;
        
      case 'hybrid':
        // Combine multiple factors
        const volScore = 100 - (condition.volatility * 10);
        const gasScore = 100 - (condition.gasPrice / 2);
        const volBonus = Math.min(20, condition.volume24h / 5000000);
        score = (volScore * 0.4) + (gasScore * 0.4) + volBonus;
        break;
        
      case 'fixed':
      default:
        score = 50;
        break;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Generate score reasoning
   */
  private generateScoreReason(
    condition: MarketCondition,
    strategy: SchedulingStrategy
  ): string {
    const reasons: string[] = [];
    
    if (strategy === 'volatility' || strategy === 'hybrid') {
      if (condition.volatility < 1.5) {
        reasons.push('Very low volatility');
      } else if (condition.volatility < 2.5) {
        reasons.push('Moderate volatility');
      } else {
        reasons.push('High volatility');
      }
    }
    
    if (strategy === 'gas-optimized' || strategy === 'hybrid') {
      if (condition.gasPrice < 15) {
        reasons.push('Low gas fees');
      } else if (condition.gasPrice < 30) {
        reasons.push('Moderate gas fees');
      } else {
        reasons.push('High gas fees');
      }
    }
    
    if (strategy === 'volume' || strategy === 'hybrid') {
      if (condition.volume24h > 60000000) {
        reasons.push('High volume');
      } else if (condition.volume24h > 40000000) {
        reasons.push('Moderate volume');
      } else {
        reasons.push('Low volume');
      }
    }
    
    return reasons.join(', ');
  }
  
  /* ═══════════════════════════════════════════
     SCHEDULING DECISIONS
     ═══════════════════════════════════════════ */
  
  /**
   * Make scheduling decision
   */
  makeDecision(
    config: SmartScheduleConfig,
    scheduledTime: number
  ): SchedulingDecision {
    // Define search window
    const maxDelayMs = config.maxDelayHours * 60 * 60 * 1000;
    const maxAdvanceMs = config.maxAdvanceHours * 60 * 60 * 1000;
    const startTime = scheduledTime - maxAdvanceMs;
    const endTime = scheduledTime + maxDelayMs;
    
    // Find best windows
    const windows = this.findBestWindows(startTime, endTime, config.strategy);
    
    // Get scheduled condition
    const scheduledCondition = generateMockMarketCondition(scheduledTime);
    const scheduledScore = this.calculateExecutionScore(scheduledCondition, config.strategy);
    
    // Find best window
    const bestWindow = windows[0];
    const recommendedTime = bestWindow?.optimalTime || scheduledTime;
    const recommendedCondition = generateMockMarketCondition(recommendedTime);
    const recommendedScore = bestWindow?.score || scheduledScore;
    
    const adjustment = recommendedTime - scheduledTime;
    const adjustmentHours = adjustment / (60 * 60 * 1000);
    const scoreImprovement = recommendedScore - scheduledScore;
    
    // Decide if should adjust
    const shouldAdjust = 
      config.enabled &&
      Math.abs(adjustmentHours) > 0.5 && // At least 30 min adjustment
      scoreImprovement > 5; // At least 5 point improvement
    
    const reasoning: string[] = [];
    
    if (shouldAdjust) {
      if (adjustmentHours > 0) {
        reasoning.push(`Delay ${Math.abs(adjustmentHours).toFixed(1)}h for better conditions`);
      } else {
        reasoning.push(`Advance ${Math.abs(adjustmentHours).toFixed(1)}h for better conditions`);
      }
      
      if (config.strategy === 'volatility' || config.strategy === 'hybrid') {
        const volDiff = scheduledCondition.volatility - recommendedCondition.volatility;
        if (volDiff > 0.5) {
          reasoning.push(`${volDiff.toFixed(1)}% lower volatility`);
        }
      }
      
      if (config.strategy === 'gas-optimized' || config.strategy === 'hybrid') {
        const gasDiff = scheduledCondition.gasPrice - recommendedCondition.gasPrice;
        if (gasDiff > 5) {
          reasoning.push(`${gasDiff.toFixed(0)} gwei lower gas`);
        }
      }
      
      reasoning.push(bestWindow.reason);
    } else {
      reasoning.push('Execute at scheduled time');
      if (!config.enabled) {
        reasoning.push('Smart scheduling disabled');
      } else if (scoreImprovement <= 5) {
        reasoning.push('Insufficient improvement');
      }
    }
    
    const decision: SchedulingDecision = {
      id: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scheduledTime,
      recommendedTime: shouldAdjust ? recommendedTime : scheduledTime,
      adjustment: shouldAdjust ? adjustment : 0,
      adjustmentHours: shouldAdjust ? adjustmentHours : 0,
      scheduledCondition,
      recommendedCondition,
      scoreImprovement,
      reasoning,
      shouldAdjust,
    };
    
    this.decisions.push(decision);
    return decision;
  }
  
  /* ═══════════════════════════════════════════
     STATISTICS
     ═══════════════════════════════════════════ */
  
  /**
   * Get scheduling stats
   */
  getStats(configId?: string): SchedulingStats {
    let decisions = this.decisions;
    
    if (configId) {
      const config = this.configs.get(configId);
      if (!config) {
        return {
          totalDecisions: 0,
          adjustmentsMade: 0,
          avgAdjustment: 0,
          avgScoreImprovement: 0,
          volatilitySavings: 0,
          gasSavings: 0,
        };
      }
      // Filter decisions for this config's plan
      // In real implementation, we'd track configId in decision
    }
    
    const totalDecisions = decisions.length;
    const adjustedDecisions = decisions.filter(d => d.shouldAdjust);
    const adjustmentsMade = adjustedDecisions.length;
    
    if (totalDecisions === 0) {
      return {
        totalDecisions: 0,
        adjustmentsMade: 0,
        avgAdjustment: 0,
        avgScoreImprovement: 0,
        volatilitySavings: 0,
        gasSavings: 0,
      };
    }
    
    const avgAdjustment = adjustedDecisions.reduce(
      (sum, d) => sum + Math.abs(d.adjustmentHours),
      0
    ) / (adjustmentsMade || 1);
    
    const avgScoreImprovement = decisions.reduce(
      (sum, d) => sum + d.scoreImprovement,
      0
    ) / totalDecisions;
    
    const volatilitySavings = adjustedDecisions.reduce(
      (sum, d) => sum + (d.scheduledCondition.volatility - d.recommendedCondition.volatility),
      0
    ) / (adjustmentsMade || 1);
    
    const gasSavings = adjustedDecisions.reduce(
      (sum, d) => sum + (d.scheduledCondition.gasPrice - d.recommendedCondition.gasPrice),
      0
    ) / (adjustmentsMade || 1);
    
    return {
      totalDecisions,
      adjustmentsMade,
      avgAdjustment,
      avgScoreImprovement,
      volatilitySavings,
      gasSavings,
    };
  }
  
  /**
   * Get recent decisions
   */
  getRecentDecisions(limit: number = 10): SchedulingDecision[] {
    return this.decisions
      .slice(-limit)
      .reverse();
  }
  
  /* ═══════════════════════════════════════════
     UTILITIES
     ═══════════════════════════════════════════ */
  
  /**
   * Get time preference window (hour range)
   */
  getTimePreferenceWindow(preference: TimePreference): { start: number; end: number } {
    switch (preference) {
      case 'morning':
        return { start: 6, end: 12 };
      case 'afternoon':
        return { start: 12, end: 18 };
      case 'evening':
        return { start: 18, end: 24 };
      case 'night':
        return { start: 0, end: 6 };
      case 'any':
      default:
        return { start: 0, end: 24 };
    }
  }
  
  /**
   * Clear all data (for testing)
   */
  clear() {
    this.configs.clear();
    this.decisions = [];
  }
}

/* ═══════════════════════════════════════════
   SINGLETON INSTANCE
   ═══════════════════════════════════════════ */

export const smartSchedulingService = new DCASmartSchedulingService();
export { DCASmartSchedulingService };
