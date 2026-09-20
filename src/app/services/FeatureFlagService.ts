/**
 * Feature Flag Service
 * 
 * Manages feature flags for controlled rollouts and A/B testing.
 * Features:
 * - Remote config support
 * - User segmentation
 * - Gradual rollout
 * - A/B test variant assignment
 * - localStorage caching
 * - Override for testing/QA
 * 
 * @module services/FeatureFlagService
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import {
  FeatureFlag,
  FeatureFlagVariant,
  UserContext,
  IFeatureFlagService,
  FeatureFlagConfig,
  DEFAULT_FEATURE_FLAG_CONFIG,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_AB_TEST_FLAGS,
} from '../types/featureFlags';

/* ═══════════════════════════════════════════
   SERVICE CLASS
   ═══════════════════════════════════════════ */

class FeatureFlagService implements IFeatureFlagService {
  private config: FeatureFlagConfig;
  private flags: Record<string, FeatureFlag> = {};
  private overrides: Record<string, any> = {};
  private variantAssignments: Record<string, string> = {};
  private refreshTimer?: NodeJS.Timeout;

  constructor(config?: Partial<FeatureFlagConfig>) {
    this.config = { ...DEFAULT_FEATURE_FLAG_CONFIG, ...config };
    
    // Initialize with default flags
    this.flags = {
      ...DEFAULT_FEATURE_FLAGS,
      ...DEFAULT_AB_TEST_FLAGS,
    };

    // Load from cache
    if (this.config.cache) {
      this.loadFromCache();
      this.loadVariantAssignments();
    }

    // Start auto-refresh
    if (this.config.refreshInterval > 0) {
      this.startAutoRefresh();
    }

    // Initial fetch from remote
    if (this.config.remoteConfigUrl) {
      this.refresh();
    }
  }

  /* ─────────────────────────────────────────
     CORE METHODS
     ───────────────────────────────────────── */

  /**
   * Check if flag is enabled
   */
  isEnabled(flagKey: string, userContext?: UserContext): boolean {
    // Check override first
    if (flagKey in this.overrides) {
      return Boolean(this.overrides[flagKey]);
    }

    const flag = this.flags[flagKey];
    if (!flag) {
      if (this.config.debug) {
        console.warn(`[FeatureFlags] Flag not found: ${flagKey}`);
      }
      return false;
    }

    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check user segment
    if (flag.userSegments && userContext?.segment) {
      if (!flag.userSegments.includes(userContext.segment)) {
        return false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(userContext?.userId || 'anonymous');
      const bucket = hash % 100;
      if (bucket >= flag.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get flag value
   */
  getValue<T>(flagKey: string, defaultValue: T, userContext?: UserContext): T {
    // Check override first
    if (flagKey in this.overrides) {
      return this.overrides[flagKey] as T;
    }

    const flag = this.flags[flagKey];
    if (!flag) {
      return defaultValue;
    }

    // If flag has variants, return variant value
    if (flag.variants && flag.variants.length > 0) {
      const variant = this.getVariant(flagKey, userContext);
      const variantObj = flag.variants.find(v => v.key === variant);
      return (variantObj?.value as T) || defaultValue;
    }

    // Otherwise return enabled status
    return (this.isEnabled(flagKey, userContext) as any) as T;
  }

  /**
   * Get variant for A/B test
   */
  getVariant(flagKey: string, userContext?: UserContext): string {
    const flag = this.flags[flagKey];
    if (!flag || !flag.variants || flag.variants.length === 0) {
      return flag?.defaultVariant || 'control';
    }

    // Check if already assigned
    const assignmentKey = this.getAssignmentKey(flagKey, userContext);
    if (assignmentKey in this.variantAssignments) {
      return this.variantAssignments[assignmentKey];
    }

    // Assign variant based on user hash
    const variant = this.assignVariant(flag, userContext);
    
    // Save assignment for consistency
    this.variantAssignments[assignmentKey] = variant;
    this.saveVariantAssignments();

    if (this.config.debug) {
      console.log(`[FeatureFlags] Assigned variant "${variant}" for flag "${flagKey}"`);
    }

    return variant;
  }

  /**
   * Get all flags
   */
  getAllFlags(): Record<string, FeatureFlag> {
    return { ...this.flags };
  }

  /**
   * Override flag value (for testing/QA)
   */
  override(flagKey: string, value: any): void {
    this.overrides[flagKey] = value;
    
    if (this.config.debug) {
      console.log(`[FeatureFlags] Override "${flagKey}" = ${value}`);
    }

    // Save to sessionStorage for persistence during session
    try {
      sessionStorage.setItem('feature_flag_overrides', JSON.stringify(this.overrides));
    } catch (error) {
      console.error('[FeatureFlags] Failed to save overrides:', error);
    }
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides = {};
    
    try {
      sessionStorage.removeItem('feature_flag_overrides');
    } catch (error) {
      console.error('[FeatureFlags] Failed to clear overrides:', error);
    }

    if (this.config.debug) {
      console.log('[FeatureFlags] Cleared all overrides');
    }
  }

  /**
   * Refresh flags from remote
   */
  async refresh(): Promise<void> {
    if (!this.config.remoteConfigUrl) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteConfigUrl);
      const remoteFlags = await response.json();
      
      // Merge with local flags
      this.flags = {
        ...this.flags,
        ...remoteFlags,
      };

      // Save to cache
      if (this.config.cache) {
        this.saveToCache();
      }

      if (this.config.debug) {
        console.log('[FeatureFlags] Refreshed from remote');
      }
    } catch (error) {
      console.error('[FeatureFlags] Failed to refresh:', error);
    }
  }

  /* ─────────────────────────────────────────
     VARIANT ASSIGNMENT
     ───────────────────────────────────────── */

  /**
   * Assign variant based on weighted distribution
   */
  private assignVariant(flag: FeatureFlag, userContext?: UserContext): string {
    if (!flag.variants || flag.variants.length === 0) {
      return flag.defaultVariant || 'control';
    }

    // Calculate total weight
    const totalWeight = flag.variants.reduce((sum, v) => sum + v.weight, 0);
    
    // Get deterministic random value based on user
    const hash = this.hashUserId(userContext?.userId || 'anonymous');
    const bucket = (hash % 10000) / 10000; // 0.0 to 1.0
    const target = bucket * totalWeight;

    // Find variant in range
    let cumulative = 0;
    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if (target < cumulative) {
        return variant.key;
      }
    }

    // Fallback to last variant
    return flag.variants[flag.variants.length - 1].key;
  }

  /**
   * Get assignment key for caching
   */
  private getAssignmentKey(flagKey: string, userContext?: UserContext): string {
    const userId = userContext?.userId || 'anonymous';
    return `${flagKey}:${userId}`;
  }

  /**
   * Hash user ID for consistent bucketing
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /* ─────────────────────────────────────────
     CACHING
     ───────────────────────────────────────── */

  /**
   * Save flags to localStorage
   */
  private saveToCache(): void {
    try {
      const cacheData = {
        flags: this.flags,
        timestamp: Date.now(),
      };
      localStorage.setItem('feature_flags_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('[FeatureFlags] Failed to save cache:', error);
    }
  }

  /**
   * Load flags from localStorage
   */
  private loadFromCache(): void {
    try {
      const cached = localStorage.getItem('feature_flags_cache');
      if (!cached) return;

      const cacheData = JSON.parse(cached);
      
      // Check if cache is still valid
      const age = Date.now() - cacheData.timestamp;
      if (age > this.config.cacheTTL) {
        localStorage.removeItem('feature_flags_cache');
        return;
      }

      this.flags = {
        ...this.flags,
        ...cacheData.flags,
      };

      if (this.config.debug) {
        console.log('[FeatureFlags] Loaded from cache');
      }
    } catch (error) {
      console.error('[FeatureFlags] Failed to load cache:', error);
    }
  }

  /**
   * Save variant assignments
   */
  private saveVariantAssignments(): void {
    try {
      localStorage.setItem('feature_flag_assignments', JSON.stringify(this.variantAssignments));
    } catch (error) {
      console.error('[FeatureFlags] Failed to save assignments:', error);
    }
  }

  /**
   * Load variant assignments
   */
  private loadVariantAssignments(): void {
    try {
      const stored = localStorage.getItem('feature_flag_assignments');
      if (stored) {
        this.variantAssignments = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[FeatureFlags] Failed to load assignments:', error);
    }
  }

  /* ─────────────────────────────────────────
     AUTO-REFRESH
     ───────────────────────────────────────── */

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.refresh();
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto-refresh timer
   */
  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /* ─────────────────────────────────────────
     UTILITIES
     ───────────────────────────────────────── */

  /**
   * Enable debug mode
   */
  enableDebugMode(enabled: boolean): void {
    this.config.debug = enabled;
    console.log(`[FeatureFlags] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get debug info
   */
  getDebugInfo(): Record<string, any> {
    return {
      flags: this.flags,
      overrides: this.overrides,
      assignments: this.variantAssignments,
      config: this.config,
    };
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.stopAutoRefresh();
  }
}

/* ═══════════════════════════════════════════
   SINGLETON INSTANCE
   ═══════════════════════════════════════════ */

/**
 * Global Feature Flag instance
 */
export const featureFlags = new FeatureFlagService({
  debug: import.meta.env.DEV,
  enabled: true,
});

// Export class for testing
export { FeatureFlagService };
