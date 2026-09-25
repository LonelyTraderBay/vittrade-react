import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { WALLET_TO_CREATION_FUNNEL } from './dca-funnels';
import { ConversionFunnelTrackerService } from './dca-funnel-service';
import { dcaAnalytics } from './dca-analytics-service';

describe('ConversionFunnelTrackerService', () => {
  const services: ConversionFunnelTrackerService[] = [];

  afterEach(() => {
    services.splice(0).forEach((service) => service.clearAllData());
    vi.restoreAllMocks();
  });

  function createService() {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const service = new ConversionFunnelTrackerService();
    services.push(service);
    return service;
  }

  it('tracks a complete wallet-to-plan journey and calculates step analytics', () => {
    const service = createService();
    const analyticsEvent = vi.spyOn(dcaAnalytics, 'trackEvent').mockImplementation(() => undefined);
    const userId = 'user-1';

    service.trackEvent('page_view', userId, { page: 'wallet' });
    service.trackEvent('dca_wallet_shortcut_impression', userId);
    service.trackEvent('dca_wallet_shortcut_click', userId);
    service.trackEvent('dca_page_viewed', userId);
    service.trackEvent('dca_create_sheet_opened', userId);
    service.trackEvent('dca_plan_created', userId, { planId: 'plan-1' });

    const analytics = service.getFunnelAnalytics(WALLET_TO_CREATION_FUNNEL.id);
    expect(analytics).toMatchObject({
      totalSessions: 1,
      completedSessions: 1,
      completionRate: 1,
    });
    expect(analytics.avgCompletionTime).toBeGreaterThanOrEqual(0);
    expect(analytics.medianCompletionTime).toBe(analytics.avgCompletionTime);
    expect(analytics.stepAnalytics).toHaveLength(WALLET_TO_CREATION_FUNNEL.steps.length);
    expect(analytics.stepAnalytics.every((step) => step.completionRate === 1)).toBe(true);
    expect(analytics.dropoutAnalysis).toEqual([]);
    expect(analyticsEvent).toHaveBeenCalledWith('funnel_step_completed', expect.any(Object));
    expect(analyticsEvent).toHaveBeenCalledWith('funnel_completed', expect.any(Object));
  });

  it('ignores unrelated and out-of-order events and reports an active-session dropout', () => {
    const service = createService();
    const now = 1_800_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);

    service.trackEvent('unrelated_event', 'user-2');
    service.trackEvent('dca_wallet_shortcut_click', 'user-2');
    service.trackEvent('page_view', 'user-2');
    service.trackEvent('dca_wallet_shortcut_click', 'another-user');

    const analytics = service.getFunnelAnalytics(WALLET_TO_CREATION_FUNNEL.id);
    expect(analytics.totalSessions).toBe(1);
    expect(analytics.completedSessions).toBe(0);
    expect(analytics.completionRate).toBe(0);
    expect(analytics.stepAnalytics[0]).toMatchObject({ reached: 1, completed: 1 });
    expect(analytics.stepAnalytics[1]).toMatchObject({ reached: 0, completionRate: 0 });
    expect(analytics.dropoutAnalysis).toEqual([
      expect.objectContaining({ step: 'wallet_view', count: 1, rate: 1, avgTimeBeforeDropout: 0 }),
    ]);
  });

  it('supports manually started sessions, age cleanup and clearing all data', () => {
    const service = createService();
    const now = vi.spyOn(Date, 'now').mockReturnValue(0);
    const oldSession = service.startSession(WALLET_TO_CREATION_FUNNEL.id, 'old-user');
    now.mockReturnValue(10_000);
    service.startSession(WALLET_TO_CREATION_FUNNEL.id, 'fresh-user');

    expect(oldSession).toMatch(/^funnel_/);
    service.cleanOldSessions(5000);
    expect(service.getFunnelAnalytics(WALLET_TO_CREATION_FUNNEL.id).totalSessions).toBe(1);

    service.startSession(WALLET_TO_CREATION_FUNNEL.id, 'fresh-user');
    service.clearAllData();
    expect(service.getFunnelAnalytics(WALLET_TO_CREATION_FUNNEL.id).totalSessions).toBe(0);
  });

  it('rejects unknown funnels and safely loads persisted funnel data', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('{bad-json');
    const service = new ConversionFunnelTrackerService();
    services.push(service);

    expect(() => service.getFunnelAnalytics('missing')).toThrow('Funnel not found: missing');
    expect(error).toHaveBeenCalledWith('[FunnelTracker] Failed to load:', expect.any(SyntaxError));
  });

  it('restores active and completed sessions from the persistence adapter', () => {
    const session = {
      sessionId: 'session-1',
      funnelId: WALLET_TO_CREATION_FUNNEL.id,
      userId: 'persisted-user',
      steps: [],
      completed: false,
      startTime: Date.now(),
    };
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(
      JSON.stringify({ active: [[WALLET_TO_CREATION_FUNNEL.id, [session]]], completed: [] }),
    );
    const service = new ConversionFunnelTrackerService();
    services.push(service);

    expect(service.getFunnelAnalytics(WALLET_TO_CREATION_FUNNEL.id).totalSessions).toBe(1);
    expect(browserStorage.local.getItem).toHaveBeenCalledWith('funnel_tracker');
  });
});
