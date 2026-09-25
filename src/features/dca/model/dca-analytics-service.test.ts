import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { DCAAnalyticsService } from './dca-analytics-service';

describe('DCAAnalyticsService', () => {
  const services: DCAAnalyticsService[] = [];

  afterEach(() => {
    services.splice(0).forEach((service) => service.destroy());
    window.localStorage.removeItem('analytics_consent');
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createService() {
    const service = new DCAAnalyticsService({
      enabled: true,
      requireConsent: true,
      sampleRate: 1,
      batchSize: 100,
      flushInterval: 0,
      offlineQueue: false,
    });
    services.push(service);
    return service;
  }

  it('does not queue events until the user has consented', () => {
    const service = createService();

    service.setUserConsent(false);
    service.trackEvent('dca_plan_created');

    expect(service.getQueue()).toEqual([]);
  });

  it('queues consented events in the public dashboard shape', () => {
    const service = createService();

    service.setUserConsent(true);
    service.trackEvent('dca_plan_created', { planId: 'plan-1' });

    expect(service.getQueue()).toMatchObject([
      {
        eventName: 'dca_plan_created',
        properties: { planId: 'plan-1' },
      },
    ]);
    expect(service.getQueue()[0].eventId).toMatch(/^evt_/);
    expect(service.getQueue()[0].timestamp).toEqual(expect.any(Number));
  });

  it('creates and persists a session id through the safe storage adapter', () => {
    const service = createService();
    const sessionId = service.getSessionId();

    expect(sessionId).toMatch(/^sess_/);
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith('dca_session_id', sessionId);
  });

  it('records the feature-specific tracking events with their context', () => {
    const service = createService();
    service.setUserConsent(true);

    service.trackDCAEvent('dca_plan_created', {
      planId: 'plan-1',
      coinSymbol: 'BTC',
      frequency: 'daily',
      amount: 25,
      source: 'dca_page',
      properties: { campaign: 'spring' },
    });
    service.trackPageView('dca-overview', { shell: 'web' });
    service.trackConversion({ type: 'plan_created', value: 25, source: 'dca_page' });
    service.trackPerformance({ name: 'render', value: 12, unit: 'ms', timestamp: 1 });
    service.setUserProperty('tier', 'gold');
    service.trackPlanCreation('plan-2', 'ETH', 'weekly', 50, 'wallet');
    service.trackPlanStatusChange('plan-2', 'active', 'dca_page');
    service.trackPlanStatusChange('plan-2', 'paused', 'dca_page');
    service.trackPlanDeletion('plan-3', 'user-request');
    service.trackWalletShortcut('impression', 'full');
    service.trackWalletShortcut('click', 'compact');
    service.trackAssetDetailButton('impression', 'BTC');
    service.trackAssetDetailButton('click', 'ETH');
    service.trackDeepLink('SOL', true);
    service.trackDeepLink('BTC', false);
    service.trackEmptyState('impression');
    service.trackEmptyState('click');
    service.trackExecution('plan-4', true);
    service.trackExecution('plan-5', false, 'network');
    service.trackHomeQuickAction('mobile');
    service.trackTradeChip('BTC', 'responsive');
    service.trackPairDetailBanner('impression', 'ETH');
    service.trackPairDetailBanner('click', 'SOL');
    service.trackProfileMenu('responsive');

    const events = service.getQueue();
    expect(events).toHaveLength(25);
    expect(events.map((event) => event.eventName)).toContain('dca_plan_activated');
    expect(events.map((event) => event.eventName)).toContain('dca_plan_paused');
    expect(events.map((event) => event.eventName)).toContain('dca_preselected_coin_used');
    expect(events.find((event) => event.eventName === 'page_view')?.properties).toMatchObject({
      page_name: 'dca-overview',
      shell: 'web',
    });
    expect(
      events.find((event) => event.eventName === 'dca_plan_created')?.properties,
    ).toMatchObject({
      planId: 'plan-1',
      campaign: 'spring',
    });
  });

  it('honors disabled tracking, optional consent and sample-rate settings', () => {
    const disabled = new DCAAnalyticsService({ enabled: false, flushInterval: 0 });
    services.push(disabled);
    disabled.setUserConsent(true);
    disabled.trackEvent('disabled');
    expect(disabled.getQueue()).toEqual([]);

    const consentOptional = new DCAAnalyticsService({
      enabled: true,
      requireConsent: false,
      sampleRate: 1,
      flushInterval: 0,
      offlineQueue: false,
    });
    services.push(consentOptional);
    consentOptional.trackEvent('consent_optional');
    expect(consentOptional.getQueue()).toHaveLength(1);

    const sampled = new DCAAnalyticsService({
      enabled: true,
      requireConsent: false,
      sampleRate: 0,
      flushInterval: 0,
      offlineQueue: false,
    });
    services.push(sampled);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    sampled.trackEvent('sampled_out');
    expect(sampled.getQueue()).toEqual([]);
  });

  it('retains queued events and does not claim delivery without a transport', async () => {
    const service = createService();
    service.setUserConsent(true);
    service.trackEvent('pending_backend_event');

    await service.flush();

    expect(service.getQueue().map((event) => event.eventName)).toEqual(['pending_backend_event']);
  });

  it('loads and trims a persisted offline queue and clears it after a successful flush', async () => {
    const events = [
      {
        event_id: 'old',
        event_name: 'old_event',
        timestamp: 1,
        session_id: 'session',
        properties: {},
      },
      {
        event_id: 'new',
        event_name: 'new_event',
        timestamp: 2,
        session_id: 'session',
        properties: {},
      },
    ];
    vi.spyOn(browserStorage.session, 'getItem').mockReturnValue('existing-session');
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(JSON.stringify(events));
    const removeItem = vi.spyOn(browserStorage.local, 'removeItem');
    const service = new DCAAnalyticsService(
      {
        enabled: true,
        requireConsent: false,
        offlineQueue: true,
        maxQueueSize: 1,
        flushInterval: 0,
      },
      { send: vi.fn().mockResolvedValue(undefined) },
    );
    services.push(service);

    expect(service.getSessionId()).toBe('existing-session');
    expect(service.getQueue().map((event) => event.eventId)).toEqual(['new']);
    await service.flush();
    expect(removeItem).toHaveBeenCalledWith('dca_analytics_queue');
  });

  it('keeps only the newest events when backend flushing fails', async () => {
    const service = new DCAAnalyticsService(
      {
        enabled: true,
        requireConsent: false,
        offlineQueue: false,
        maxQueueSize: 1,
        flushInterval: 0,
      },
      { send: vi.fn().mockRejectedValue(new Error('offline')) },
    );
    services.push(service);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service.trackEvent('first');
    service.trackEvent('second');

    await service.flush();

    expect(service.getQueue().map((event) => event.eventName)).toEqual(['second']);
  });

  it('writes offline queue snapshots as events are added', () => {
    const setItem = vi.spyOn(browserStorage.local, 'setItem');
    const service = new DCAAnalyticsService({
      enabled: true,
      requireConsent: false,
      offlineQueue: true,
      flushInterval: 0,
    });
    services.push(service);

    service.trackEvent('offline_event');

    expect(setItem).toHaveBeenCalledWith(
      'dca_analytics_queue',
      expect.stringContaining('offline_event'),
    );
  });

  it('logs debug tracking and flush details when debug mode is enabled', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const table = vi.spyOn(console, 'table').mockImplementation(() => undefined);
    const service = new DCAAnalyticsService(
      {
        enabled: true,
        requireConsent: true,
        sampleRate: 1,
        batchSize: 100,
        flushInterval: 0,
        offlineQueue: false,
      },
      { send: vi.fn().mockResolvedValue(undefined) },
    );
    services.push(service);
    service.setUserConsent(true);
    service.enableDebugMode(true);
    service.trackEvent('debug_event');

    expect(log).toHaveBeenCalledWith(expect.stringContaining('enabled'));
    expect(log).toHaveBeenCalledWith(
      '[DCA Analytics] Event:',
      expect.objectContaining({ event_name: 'debug_event' }),
    );
    await service.flush();
    expect(table).toHaveBeenCalled();
    service.enableDebugMode(false);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('disabled'));
  });

  it('ignores malformed offline queue data and records consent changes safely', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('{invalid');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = new DCAAnalyticsService({ flushInterval: 0, offlineQueue: true });
    services.push(service);

    expect(service.getQueue()).toEqual([]);
    expect(error).toHaveBeenCalledWith(
      '[DCA Analytics] Failed to load offline queue:',
      expect.any(SyntaxError),
    );

    vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    service.setUserConsent(true);
    expect(service.getQueue()).toEqual([]);
    expect(error).toHaveBeenCalledWith(
      '[DCA Analytics] Failed to save consent:',
      expect.any(Error),
    );
  });

  it('flushes on the configured timer and clears that timer on destroy', async () => {
    vi.useFakeTimers();
    const timedService = new DCAAnalyticsService({
      enabled: true,
      requireConsent: false,
      offlineQueue: false,
      flushInterval: 1000,
    });
    services.push(timedService);
    const timedFlush = vi.spyOn(timedService, 'flush').mockResolvedValue();

    await vi.advanceTimersByTimeAsync(1000);
    expect(timedFlush).toHaveBeenCalledTimes(1);
    timedService.destroy();
    const callsAfterDestroy = timedFlush.mock.calls.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(timedFlush).toHaveBeenCalledTimes(callsAfterDestroy);
  });
});
