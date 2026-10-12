import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { ASSET_TO_CREATION_FUNNEL, WALLET_TO_CREATION_FUNNEL } from './dca-funnels';
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

  it('keeps funnel progression and step analytics correct when an optional step is skipped', () => {
    const service = createService();
    let now = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => (now += 100));

    const trackAssetJourney = (userId: string, includeOptionalStep: boolean) => {
      service.trackEvent('page_view', userId);
      service.trackEvent('dca_asset_detail_button_impression', userId);
      service.trackEvent('dca_asset_detail_button_click', userId);
      service.trackEvent('dca_create_sheet_opened', userId);
      if (includeOptionalStep) {
        service.trackEvent('dca_preselected_coin_used', userId);
      } else {
        // A repeat event is not a later funnel step and must not advance the optional step.
        service.trackEvent('dca_asset_detail_button_click', userId);
      }
      service.trackEvent('dca_plan_created', userId);
    };

    trackAssetJourney('skipped-optional', false);
    trackAssetJourney('completed-optional', true);

    const analytics = service.getFunnelAnalytics(ASSET_TO_CREATION_FUNNEL.id);
    const optionalStep = analytics.stepAnalytics.find(
      (step) => step.stepId === 'preselected_coin_used',
    );
    const finalStep = analytics.stepAnalytics.find((step) => step.stepId === 'plan_created');

    expect(analytics).toMatchObject({ totalSessions: 2, completedSessions: 2, completionRate: 1 });
    expect(optionalStep).toMatchObject({ reached: 2, completed: 1, completionRate: 0.5 });
    expect(optionalStep?.avgTimeToComplete).toBeGreaterThan(0);
    expect(finalStep).toMatchObject({ reached: 2, completed: 2, completionRate: 1 });
    expect(finalStep?.avgTimeToComplete).toBeGreaterThan(0);
    expect(analytics.medianCompletionTime).toBe(analytics.avgCompletionTime);
  });

  it('does not skip a required funnel step when a later event arrives first', () => {
    const service = createService();

    service.trackEvent('page_view', 'required-order');
    service.trackEvent('dca_asset_detail_button_click', 'required-order');

    const analytics = service.getFunnelAnalytics(ASSET_TO_CREATION_FUNNEL.id);
    expect(analytics.stepAnalytics[1]).toMatchObject({ reached: 0, completed: 0 });
    expect(analytics.totalSessions).toBe(1);
    expect(analytics.completedSessions).toBe(0);
  });

  it('reports entry dropouts and zero analytics for completed records without durations', () => {
    const service = createService();
    service.startSession(ASSET_TO_CREATION_FUNNEL.id, 'entry-dropout');
    service.startSession(ASSET_TO_CREATION_FUNNEL.id, 'another-entry-dropout');

    const activeAnalytics = service.getFunnelAnalytics(ASSET_TO_CREATION_FUNNEL.id);
    expect(activeAnalytics.dropoutAnalysis).toEqual([
      { step: 'entry', count: 2, rate: 1, avgTimeBeforeDropout: 0 },
    ]);
    expect(activeAnalytics.stepAnalytics[0]).toMatchObject({
      reached: 0,
      completed: 0,
      completionRate: 0,
      dropoutRate: 1,
    });

    const legacyCompletedSession = {
      sessionId: 'legacy-completed',
      funnelId: ASSET_TO_CREATION_FUNNEL.id,
      userId: 'legacy-user',
      steps: [],
      completed: true,
      startTime: 0,
    };
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(
      JSON.stringify({
        active: [],
        completed: [[ASSET_TO_CREATION_FUNNEL.id, [legacyCompletedSession]]],
      }),
    );
    const restoredService = new ConversionFunnelTrackerService();
    services.push(restoredService);

    const restoredAnalytics = restoredService.getFunnelAnalytics(ASSET_TO_CREATION_FUNNEL.id);
    expect(restoredAnalytics).toMatchObject({
      totalSessions: 1,
      completedSessions: 1,
      avgCompletionTime: 0,
      medianCompletionTime: 0,
    });
  });

  it('does not append a step to a restored session already at the end of its funnel', () => {
    const session = {
      sessionId: 'completed-steps-awaiting-finalization',
      funnelId: ASSET_TO_CREATION_FUNNEL.id,
      userId: 'recovered-user',
      steps: ASSET_TO_CREATION_FUNNEL.steps.map((step, index) => ({
        stepId: step.id,
        timestamp: index * 100,
        timeSincePrevious: index === 0 ? undefined : 100,
      })),
      completed: false,
      startTime: 0,
    };
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(
      JSON.stringify({ active: [[ASSET_TO_CREATION_FUNNEL.id, [session]]], completed: [] }),
    );
    const service = new ConversionFunnelTrackerService();
    services.push(service);
    const analyticsEvent = vi.spyOn(dcaAnalytics, 'trackEvent').mockImplementation(() => undefined);

    service.trackEvent(ASSET_TO_CREATION_FUNNEL.successEvent, 'recovered-user');

    expect(service.getFunnelAnalytics(ASSET_TO_CREATION_FUNNEL.id)).toMatchObject({
      totalSessions: 1,
      completedSessions: 0,
    });
    expect(analyticsEvent).not.toHaveBeenCalledWith('funnel_completed', expect.any(Object));
  });

  it('does not throw when the persistence adapter rejects a write', () => {
    const service = createService();
    const storageError = new Error('Storage quota exceeded');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw storageError;
    });

    expect(() => service.startSession(ASSET_TO_CREATION_FUNNEL.id, 'storage-error')).not.toThrow();
    expect(error).toHaveBeenCalledWith('[FunnelTracker] Failed to save:', storageError);
  });
});
