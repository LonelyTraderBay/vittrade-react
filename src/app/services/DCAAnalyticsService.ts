/**
 * DCA Analytics Service
 * 
 * Handles all DCA-specific analytics tracking.
 * Features:
 * - Event batching for performance
 * - Offline queue with localStorage
 * - Debug mode for development
 * - GDPR-compliant (no PII)
 * - Type-safe event tracking
 * 
 * @module services/DCAAnalyticsService
 * @version 2.0 (Phase 2 - Sprint 2)
 */

import {
  AnalyticsEvent,
  DCAAnalyticsEvent,
  DCAConversion,
  PerformanceMetric,
  AnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,
  IAnalyticsService,
  DCAEventName,
  DCAEventSource,
} from '../types/analytics';
import { DCAFrequency } from '../types/dca';

/* ═══════════════════════════════════════════
   SERVICE CLASS
   ═══════════════════════════════════════════ */

class DCAAnalyticsService implements IAnalyticsService {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private flushTimer?: NodeJS.Timeout;
  private userConsent: boolean = false;

  constructor(config?: Partial<AnalyticsConfig>) {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.loadUserConsent();
    
    // Start auto-flush timer
    if (this.config.flushInterval > 0) {
      this.startAutoFlush();
    }
    
    // Load offline queue
    if (this.config.offlineQueue) {
      this.loadOfflineQueue();
    }
    
    // Listen for page unload to flush
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  /* ─────────────────────────────────────────
     CORE TRACKING METHODS
     ───────────────────────────────────────── */

  /**
   * Track a DCA event
   */
  trackEvent(eventName: DCAEventName | string, properties?: Record<string, any>): void {
    if (!this.shouldTrack()) return;

    const event: AnalyticsEvent = {
      event_id: this.generateEventId(),
      event_name: eventName,
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_id: this.userId,
      properties: properties || {},
    };

    this.enqueueEvent(event);

    if (this.config.debug) {
      console.log('[DCA Analytics] Event:', event);
    }
  }

  /**
   * Track a DCA-specific event with context
   */
  trackDCAEvent(
    eventName: DCAEventName,
    context: {
      planId?: string;
      coinSymbol?: string;
      frequency?: DCAFrequency;
      amount?: number;
      source?: DCAEventSource;
      variant?: string;
      properties?: Record<string, any>;
    }
  ): void {
    const { properties, ...contextWithoutProps } = context;
    
    this.trackEvent(eventName, {
      ...contextWithoutProps,
      ...properties,
    });
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, properties?: Record<string, any>): void {
    this.trackEvent('page_view', {
      page_name: pageName,
      ...properties,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(conversion: DCAConversion): void {
    this.trackEvent('dca_conversion', {
      conversion_type: conversion.type,
      conversion_value: conversion.value,
      time_to_convert: conversion.time_to_convert,
      source: conversion.source,
      ...conversion.context,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    if (!this.shouldTrack()) return;

    this.trackEvent('performance_metric', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_unit: metric.unit,
    });
  }

  /**
   * Set user property
   */
  setUserProperty(key: string, value: any): void {
    if (!this.shouldTrack()) return;

    // Store for future events
    if (!this.userId) {
      this.userId = `anon_${this.sessionId}`;
    }

    if (this.config.debug) {
      console.log('[DCA Analytics] User Property:', { key, value });
    }
  }

  /* ─────────────────────────────────────────
     SPECIALIZED TRACKING
     ───────────────────────────────────────── */

  /**
   * Track DCA plan creation
   */
  trackPlanCreation(planId: string, coinSymbol: string, frequency: DCAFrequency, amount: number, source?: DCAEventSource): void {
    this.trackDCAEvent('dca_plan_created', {
      planId,
      coinSymbol,
      frequency,
      amount,
      source,
    });

    // Also track as conversion
    this.trackConversion({
      type: 'plan_created',
      value: amount,
      source,
    });
  }

  /**
   * Track plan status change
   */
  trackPlanStatusChange(planId: string, newStatus: 'active' | 'paused', source?: DCAEventSource): void {
    const eventName = newStatus === 'active' ? 'dca_plan_activated' : 'dca_plan_paused';
    
    this.trackDCAEvent(eventName as DCAEventName, {
      planId,
      source,
    });
  }

  /**
   * Track plan deletion
   */
  trackPlanDeletion(planId: string, reason?: string): void {
    this.trackDCAEvent('dca_plan_deleted', {
      planId,
      properties: { reason },
    });
  }

  /**
   * Track wallet shortcut interaction
   */
  trackWalletShortcut(action: 'impression' | 'click', variant?: 'full' | 'compact'): void {
    const eventName = action === 'impression' 
      ? 'dca_wallet_shortcut_impression'
      : 'dca_wallet_shortcut_click';
    
    this.trackDCAEvent(eventName as DCAEventName, {
      variant,
      source: 'wallet',
    });
  }

  /**
   * Track asset detail button
   */
  trackAssetDetailButton(action: 'impression' | 'click', coinSymbol: string): void {
    const eventName = action === 'impression'
      ? 'dca_asset_detail_button_impression'
      : 'dca_asset_detail_button_click';
    
    this.trackDCAEvent(eventName as DCAEventName, {
      coinSymbol,
      source: 'asset_detail',
    });
  }

  /**
   * Track deep link usage
   */
  trackDeepLink(coinSymbol: string, converted: boolean): void {
    this.trackDCAEvent('dca_deep_link_opened', {
      coinSymbol,
      source: 'asset_detail',
    });

    if (converted) {
      this.trackDCAEvent('dca_preselected_coin_used', {
        coinSymbol,
        source: 'asset_detail',
      });
    }
  }

  /**
   * Track empty state interaction
   */
  trackEmptyState(action: 'impression' | 'click'): void {
    const eventName = action === 'impression'
      ? 'dca_empty_state_impression'
      : 'dca_empty_state_click';
    
    this.trackDCAEvent(eventName as DCAEventName, {
      source: 'wallet',
    });
  }

  /**
   * Track execution result
   */
  trackExecution(planId: string, success: boolean, error?: string): void {
    const eventName = success ? 'dca_execution_success' : 'dca_execution_failed';
    
    this.trackDCAEvent(eventName as DCAEventName, {
      planId,
      properties: { error },
    });
  }

  /**
   * Track home quick action click (new entry point)
   */
  trackHomeQuickAction(variant: 'mobile' | 'responsive'): void {
    this.trackDCAEvent('dca_home_quick_action_click' as DCAEventName, {
      properties: { variant, source: 'home_quick_action' },
    });
  }

  /**
   * Track trade page chip click (new entry point)
   */
  trackTradeChip(coinSymbol: string, variant: 'mobile' | 'responsive'): void {
    this.trackDCAEvent('dca_trade_chip_click' as DCAEventName, {
      coinSymbol,
      properties: { variant, source: 'trade' },
    });
  }

  /**
   * Track pair detail banner (new entry point)
   */
  trackPairDetailBanner(action: 'impression' | 'click', coinSymbol: string): void {
    const eventName = action === 'impression'
      ? 'dca_pair_detail_banner_impression'
      : 'dca_pair_detail_click';
    
    this.trackDCAEvent(eventName as DCAEventName, {
      coinSymbol,
      properties: { source: 'pair_detail' },
    });
  }

  /**
   * Track profile menu click (new entry point)
   */
  trackProfileMenu(variant: 'mobile' | 'responsive'): void {
    this.trackDCAEvent('dca_profile_menu_click' as DCAEventName, {
      properties: { variant, source: 'profile_menu' },
    });
  }

  /* ─────────────────────────────────────────
     QUEUE MANAGEMENT
     ───────────────────────────────────────── */

  /**
   * Enqueue event for batching
   */
  private enqueueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }

    // Save to offline queue
    if (this.config.offlineQueue) {
      this.saveOfflineQueue();
    }
  }

  /**
   * Flush queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // In production, send to analytics backend
      // For now, just log in debug mode
      if (this.config.debug) {
        console.log('[DCA Analytics] Flushing events:', events.length);
        console.table(events.map(e => ({
          event: e.event_name,
          time: new Date(e.timestamp).toLocaleTimeString(),
          ...e.properties,
        })));
      }

      // Simulate API call
      await this.sendToBackend(events);

      // Clear offline queue on success
      if (this.config.offlineQueue) {
        this.clearOfflineQueue();
      }
    } catch (error) {
      console.error('[DCA Analytics] Flush error:', error);
      
      // Re-queue events on failure
      this.eventQueue = [...events, ...this.eventQueue];
      
      // Trim if too large
      if (this.eventQueue.length > this.config.maxQueueSize) {
        this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize);
      }
    }
  }

  /**
   * Send events to backend
   */
  private async sendToBackend(events: AnalyticsEvent[]): Promise<void> {
    // TODO: Implement actual API call
    // For now, just simulate network delay
    return new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  /* ─────────────────────────────────────────
     OFFLINE QUEUE
     ───────────────────────────────────────── */

  /**
   * Save queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('dca_analytics_queue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('[DCA Analytics] Failed to save offline queue:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('dca_analytics_queue');
      if (stored) {
        const events = JSON.parse(stored) as AnalyticsEvent[];
        this.eventQueue = events.slice(-this.config.maxQueueSize);
      }
    } catch (error) {
      console.error('[DCA Analytics] Failed to load offline queue:', error);
    }
  }

  /**
   * Clear offline queue
   */
  private clearOfflineQueue(): void {
    try {
      localStorage.removeItem('dca_analytics_queue');
    } catch (error) {
      console.error('[DCA Analytics] Failed to clear offline queue:', error);
    }
  }

  /* ─────────────────────────────────────────
     AUTO-FLUSH
     ───────────────────────────────────────── */

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /* ─────────────────────────────────────────
     UTILITIES
     ───────────────────────────────────────── */

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    // Check for existing session
    const existing = sessionStorage.getItem('dca_session_id');
    if (existing) return existing;

    // Create new session
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('dca_session_id', sessionId);
    return sessionId;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Check if tracking should occur
   */
  private shouldTrack(): boolean {
    // Check if analytics enabled
    if (!this.config.enabled) return false;

    // Check user consent
    if (this.config.requireConsent && !this.userConsent) return false;

    // Check sample rate
    if (Math.random() > this.config.sampleRate) return false;

    return true;
  }

  /**
   * Load user consent from localStorage
   */
  private loadUserConsent(): void {
    try {
      const consent = localStorage.getItem('analytics_consent');
      this.userConsent = consent === 'true';
    } catch (error) {
      this.userConsent = false;
    }
  }

  /**
   * Set user consent
   */
  setUserConsent(consent: boolean): void {
    this.userConsent = consent;
    try {
      localStorage.setItem('analytics_consent', consent.toString());
    } catch (error) {
      console.error('[DCA Analytics] Failed to save consent:', error);
    }
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(enabled: boolean): void {
    this.config.debug = enabled;
    console.log(`[DCA Analytics] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.stopAutoFlush();
    this.flush();
  }
}

/* ═══════════════════════════════════════════
   SINGLETON INSTANCE
   ═══════════════════════════════════════════ */

/**
 * Global DCA Analytics instance
 */
export const dcaAnalytics = new DCAAnalyticsService({
  debug: import.meta.env.DEV,
  enabled: true,
});

// Export class for testing
export { DCAAnalyticsService };