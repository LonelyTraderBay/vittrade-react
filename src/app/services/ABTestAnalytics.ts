/**
 * A/B Test Analytics Service
 *
 * Tracks exposures, conversions, and results for A/B tests.
 * Integrates with DCA Analytics for event tracking.
 *
 * @module services/ABTestAnalytics
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import { dcaAnalytics } from './DCAAnalyticsService';
import { ABTest, ABTestResults, VariantResults } from '../config/abTests';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

/**
 * Exposure event
 */
interface ExposureEvent {
  testId: string;
  variantId: string;
  userId: string;
  timestamp: number;
}

/**
 * Conversion event
 */
interface ConversionEvent {
  testId: string;
  variantId: string;
  userId: string;
  metricName: string;
  value?: number;
  timestamp: number;
}

/* ═══════════════════════════════════════════
   SERVICE CLASS
   ═══════════════════════════════════════════ */

class ABTestAnalyticsService {
  private exposures: Map<string, ExposureEvent[]> = new Map();
  private conversions: Map<string, ConversionEvent[]> = new Map();
  private userVariants: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /* ─────────────────────────────────────────
     EXPOSURE TRACKING
     ───────────────────────────────────────── */

  /**
   * Track user exposure to a variant
   */
  trackExposure(testId: string, variantId: string, userId: string = 'anonymous'): void {
    // Check if already exposed
    const userKey = this.getUserKey(testId, userId);
    if (this.hasExposure(userKey)) {
      return; // Only track first exposure
    }

    const exposure: ExposureEvent = {
      testId,
      variantId,
      userId,
      timestamp: Date.now(),
    };

    // Store exposure
    if (!this.exposures.has(testId)) {
      this.exposures.set(testId, []);
    }
    this.exposures.get(testId)!.push(exposure);

    // Store user variant mapping
    if (!this.userVariants.has(testId)) {
      this.userVariants.set(testId, new Map());
    }
    this.userVariants.get(testId)!.set(userId, variantId);

    // Track in analytics
    dcaAnalytics.trackEvent('ab_test_exposure', {
      test_id: testId,
      variant_id: variantId,
      user_id: userId,
    });

    this.saveToStorage();
  }

  /**
   * Check if user has been exposed to test
   */
  hasExposure(userKey: string): boolean {
    const [testId, userId] = userKey.split(':');
    return this.userVariants.get(testId)?.has(userId) || false;
  }

  /**
   * Get user's assigned variant
   */
  getUserVariant(testId: string, userId: string): string | undefined {
    return this.userVariants.get(testId)?.get(userId);
  }

  /* ─────────────────────────────────────────
     CONVERSION TRACKING
     ───────────────────────────────────────── */

  /**
   * Track conversion for a test
   */
  trackConversion(
    testId: string,
    metricName: string,
    userId: string = 'anonymous',
    value?: number,
  ): void {
    // Get user's variant
    const variantId = this.getUserVariant(testId, userId);
    if (!variantId) {
      console.warn(`[ABTestAnalytics] No variant found for user ${userId} in test ${testId}`);
      return;
    }

    const conversion: ConversionEvent = {
      testId,
      variantId,
      userId,
      metricName,
      value,
      timestamp: Date.now(),
    };

    // Store conversion
    if (!this.conversions.has(testId)) {
      this.conversions.set(testId, []);
    }
    this.conversions.get(testId)!.push(conversion);

    // Track in analytics
    dcaAnalytics.trackEvent('ab_test_conversion', {
      test_id: testId,
      variant_id: variantId,
      metric_name: metricName,
      value,
      user_id: userId,
    });

    this.saveToStorage();
  }

  /* ─────────────────────────────────────────
     RESULTS CALCULATION
     ───────────────────────────────────────── */

  /**
   * Get results for a test
   */
  getTestResults(test: ABTest): ABTestResults {
    const variantResults: VariantResults[] = [];

    for (const variant of test.variants) {
      const results = this.calculateVariantResults(test.id, variant.id);
      variantResults.push(results);
    }

    // Calculate winner and significance
    const { winner, significance, confidence } = this.determineWinner(
      variantResults,
      test.targetSignificance,
    );

    return {
      testId: test.id,
      variants: variantResults,
      winner,
      significance,
      confidence,
      lastUpdated: new Date(),
    };
  }

  /**
   * Calculate results for a variant
   */
  private calculateVariantResults(testId: string, variantId: string): VariantResults {
    const exposures = this.getExposureCount(testId, variantId);
    const conversions = this.getConversionCount(testId, variantId);
    const conversionRate = exposures > 0 ? conversions / exposures : 0;

    // Calculate standard error
    const standardError = this.calculateStandardError(conversionRate, exposures);

    // Calculate 95% confidence interval
    const margin = 1.96 * standardError; // 1.96 for 95% confidence
    const confidenceInterval: [number, number] = [
      Math.max(0, conversionRate - margin),
      Math.min(1, conversionRate + margin),
    ];

    // Calculate revenue metrics if applicable
    const revenue = this.getRevenue(testId, variantId);
    const arpu = exposures > 0 ? revenue / exposures : 0;

    return {
      variantId,
      exposures,
      conversions,
      conversionRate,
      revenue: revenue > 0 ? revenue : undefined,
      arpu: arpu > 0 ? arpu : undefined,
      standardError,
      confidenceInterval,
    };
  }

  /**
   * Determine winner using statistical significance
   */
  private determineWinner(
    variants: VariantResults[],
    targetSignificance: number,
  ): { winner?: string; significance: number; confidence: number } {
    if (variants.length < 2) {
      return { significance: 0, confidence: 0 };
    }

    // Find control and best variant
    const sortedVariants = [...variants].sort((a, b) => b.conversionRate - a.conversionRate);
    const best = sortedVariants[0];
    const control = variants[0]; // Assuming first is control

    // Calculate z-score for statistical significance
    const zScore = this.calculateZScore(best, control);
    const significance = this.zScoreToSignificance(zScore);
    const confidence = significance;

    // Check if we have enough sample size
    const hasEnoughSamples = variants.every((v) => v.exposures >= 100);

    // Determine winner if statistically significant
    const winner =
      significance >= targetSignificance && hasEnoughSamples ? best.variantId : undefined;

    return { winner, significance, confidence };
  }

  /**
   * Calculate z-score between two variants
   */
  private calculateZScore(variant1: VariantResults, variant2: VariantResults): number {
    const p1 = variant1.conversionRate;
    const n1 = variant1.exposures;
    const p2 = variant2.conversionRate;
    const n2 = variant2.exposures;

    if (n1 === 0 || n2 === 0) return 0;

    // Pooled proportion
    const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);

    // Standard error of difference
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

    if (se === 0) return 0;

    // Z-score
    return Math.abs(p1 - p2) / se;
  }

  /**
   * Convert z-score to significance level
   */
  private zScoreToSignificance(zScore: number): number {
    // Approximate p-value using z-score
    // For z > 1.96, p < 0.05 (95% confidence)
    // For z > 2.58, p < 0.01 (99% confidence)

    if (zScore >= 2.58) return 0.99;
    if (zScore >= 1.96) return 0.95;
    if (zScore >= 1.645) return 0.9;
    if (zScore >= 1.28) return 0.8;

    // Simple approximation for lower z-scores
    return Math.max(0, Math.min(1, zScore / 2.58));
  }

  /**
   * Calculate standard error
   */
  private calculateStandardError(p: number, n: number): number {
    if (n === 0) return 0;
    return Math.sqrt((p * (1 - p)) / n);
  }

  /* ─────────────────────────────────────────
     DATA RETRIEVAL
     ───────────────────────────────────────── */

  /**
   * Get exposure count for variant
   */
  private getExposureCount(testId: string, variantId: string): number {
    const exposures = this.exposures.get(testId) || [];
    return exposures.filter((e) => e.variantId === variantId).length;
  }

  /**
   * Get conversion count for variant
   */
  private getConversionCount(testId: string, variantId: string): number {
    const conversions = this.conversions.get(testId) || [];
    return conversions.filter((c) => c.variantId === variantId).length;
  }

  /**
   * Get total revenue for variant
   */
  private getRevenue(testId: string, variantId: string): number {
    const conversions = this.conversions.get(testId) || [];
    return conversions
      .filter((c) => c.variantId === variantId && c.value !== undefined)
      .reduce((sum, c) => sum + (c.value || 0), 0);
  }

  /* ─────────────────────────────────────────
     UTILITIES
     ───────────────────────────────────────── */

  /**
   * Get user key for exposure tracking
   */
  private getUserKey(testId: string, userId: string): string {
    return `${testId}:${userId}`;
  }

  /**
   * Clear all data for a test
   */
  clearTestData(testId: string): void {
    this.exposures.delete(testId);
    this.conversions.delete(testId);
    this.userVariants.delete(testId);
    this.saveToStorage();
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.exposures.clear();
    this.conversions.clear();
    this.userVariants.clear();
    this.saveToStorage();
  }

  /* ─────────────────────────────────────────
     PERSISTENCE
     ───────────────────────────────────────── */

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        exposures: Array.from(this.exposures.entries()),
        conversions: Array.from(this.conversions.entries()),
        userVariants: Array.from(this.userVariants.entries()).map(([testId, map]) => [
          testId,
          Array.from(map.entries()),
        ]),
      };
      localStorage.setItem('ab_test_analytics', JSON.stringify(data));
    } catch (error) {
      console.error('[ABTestAnalytics] Failed to save:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('ab_test_analytics');
      if (!stored) return;

      const data = JSON.parse(stored);

      this.exposures = new Map(data.exposures);
      this.conversions = new Map(data.conversions);
      this.userVariants = new Map(
        data.userVariants.map(([testId, entries]: [string, [string, string][]]) => [
          testId,
          new Map(entries),
        ]),
      );
    } catch (error) {
      console.error('[ABTestAnalytics] Failed to load:', error);
    }
  }

  /**
   * Export data for analysis
   */
  exportData(): {
    exposures: ExposureEvent[];
    conversions: ConversionEvent[];
  } {
    const allExposures: ExposureEvent[] = [];
    const allConversions: ConversionEvent[] = [];

    for (const exposures of this.exposures.values()) {
      allExposures.push(...exposures);
    }

    for (const conversions of this.conversions.values()) {
      allConversions.push(...conversions);
    }

    return { exposures: allExposures, conversions: allConversions };
  }
}

/* ═══════════════════════════════════════════
   SINGLETON INSTANCE
   ═══════════════════════════════════════════ */

export const abTestAnalytics = new ABTestAnalyticsService();

export { ABTestAnalyticsService };
