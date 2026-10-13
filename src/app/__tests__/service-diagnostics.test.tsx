import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { configureTelemetry } from '@/shared/telemetry/telemetry';
import { CoachmarkService } from '../services/CoachmarkService';
import { FeatureFlagService, featureFlags } from '../services/FeatureFlagService';
import { ABTestAnalyticsService } from '@/features/dca/model/dca-ab-test-analytics';
import {
  ConversionFunnelTrackerService,
  funnelTracker,
} from '@/features/dca/model/dca-funnel-service';
import { DCAAnalyticsService, dcaAnalytics } from '@/features/dca/model/dca-analytics-service';
import { useFunnelAnalytics } from '@/features/dca/model/use-dca-funnel-tracking';
import { useLocalStorage } from '../hooks/useLocalStorage';

vi.mock('@/shared/config/env', () => ({ env: { isDev: false, releaseVersion: 'test' } }));
featureFlags.destroy();
dcaAnalytics.destroy();

const services: Array<{ destroy(): void }> = [];
afterEach(() => {
  services.splice(0).forEach((service) => service.destroy());
  configureTelemetry({
    captureException: () => undefined,
    captureEvent: () => undefined,
    setUser: () => undefined,
  });
  vi.restoreAllMocks();
});

function diagnostics() {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const report = vi.fn();
  configureTelemetry({ captureException: report, captureEvent: vi.fn(), setUser: vi.fn() });
  return { error, warn, report };
}

describe('release service diagnostics', () => {
  it('contains failed feature persistence and refresh without losing in-memory defaults', async () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw new Error('private-token');
    });
    vi.spyOn(browserStorage.session, 'setItem').mockImplementation(() => {
      throw new Error('private-token');
    });
    vi.spyOn(browserStorage.session, 'removeItem').mockImplementation(() => {
      throw new Error('private-token');
    });
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        remote_flag: { key: 'remote_flag', name: 'remote_flag', description: '', enabled: true },
      }),
    } as Response);
    const { error, report } = diagnostics();
    const service = new FeatureFlagService({
      cache: true,
      remoteConfigUrl: '/flags',
      refreshInterval: 0,
    });
    services.push(service);
    await vi.waitFor(() => expect(service.getAllFlags()).toHaveProperty('remote_flag'));
    service.override('qa_flag', true);
    expect(service.isEnabled('qa_flag')).toBe(true);
    service.clearOverrides();
    expect(service.isEnabled('qa_flag')).toBe(false);
    service.getVariant('dca_shortcut_variant', { userId: 'opaque-user' });
    fetch.mockRejectedValue(new Error('private-token'));
    await service.refresh();
    expect(service.getAllFlags()).toHaveProperty('dca_enabled');
    expect(error).not.toHaveBeenCalled();
    expect(report.mock.calls.map(([, context]) => context.operation)).toEqual(
      expect.arrayContaining([
        'save-cache',
        'save-overrides',
        'clear-overrides',
        'save-assignments',
        'refresh',
      ]),
    );
    expect(JSON.stringify(report.mock.calls)).not.toContain('private-token');
  });

  it('keeps coachmark, exposure and funnel updates when the persistence adapter fails', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw new Error('private-token');
    });
    const { error, warn, report } = diagnostics();
    const coachmarks = new CoachmarkService();
    coachmarks.markSeen('home-modules-overview');
    expect(coachmarks.getState().seen).toContain('home-modules-overview');
    const experiments = new ABTestAnalyticsService();
    experiments.trackExposure('test', 'variant', 'opaque-user');
    expect(experiments.getUserVariant('test', 'opaque-user')).toBe('variant');
    const funnels = new ConversionFunnelTrackerService();
    funnels.startSession('wallet_to_creation', 'opaque-user');
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(report.mock.calls.map(([, context]) => context.area)).toEqual(
      expect.arrayContaining(['coachmarks', 'dca-ab-test', 'dca-funnel']),
    );
    expect(JSON.stringify(report.mock.calls)).not.toContain('private-token');
  });

  it('keeps analytics outcomes and queue ownership when consent, persistence or delivery fails', async () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw new Error('private-token');
    });
    vi.spyOn(browserStorage.local, 'removeItem').mockImplementation(() => {
      throw new Error('private-token');
    });
    const send = vi.fn().mockResolvedValue(undefined);
    const service = new DCAAnalyticsService(
      {
        enabled: true,
        requireConsent: false,
        sampleRate: 1,
        batchSize: 100,
        offlineQueue: true,
        flushInterval: 0,
      },
      { send },
    );
    services.push(service);
    const { error, report } = diagnostics();
    service.setUserConsent(true);
    service.trackEvent('first');
    await service.flush();
    expect(service.getQueue()).toEqual([]);
    service.trackEvent('second');
    send.mockRejectedValue(new Error('private-token'));
    await service.flush();
    expect(service.getQueue().map((event) => event.eventName)).toEqual(['second']);
    expect(error).not.toHaveBeenCalled();
    expect(report.mock.calls.map(([, context]) => context.operation)).toEqual(
      expect.arrayContaining([
        'save-consent',
        'save-offline-queue',
        'clear-offline-queue',
        'flush',
      ]),
    );
    expect(JSON.stringify(report.mock.calls)).not.toContain('private-token');
    send.mockResolvedValue(undefined);
  });

  it('contains preference update/removal failures without logging the original exception', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('5');
    vi.spyOn(browserStorage.local, 'removeItem').mockImplementation(() => {
      throw new Error('private-token');
    });
    const { warn, report } = diagnostics();
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    act(() =>
      result.current[1](() => {
        throw new Error('private-token');
      }),
    );
    expect(result.current[0]).toBe(5);
    act(() => result.current[2]());
    expect(result.current[0]).toBe(0);
    expect(warn).not.toHaveBeenCalled();
    expect(report.mock.calls.map(([, context]) => context.operation)).toEqual([
      'write-preference',
      'remove-preference',
    ]);
    expect(JSON.stringify(report.mock.calls)).not.toContain('private-token');
  });

  it('omits a user identifier when a conversion has no assigned variant', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const { warn } = diagnostics();
    const service = new ABTestAnalyticsService();
    service.trackConversion('test', 'click', 'private-token');
    expect(warn).toHaveBeenCalledWith('[ABTestAnalytics] No variant found; conversion skipped.');
    expect(JSON.stringify(warn.mock.calls)).not.toContain('private-token');
    expect(service.exportData().conversions).toEqual([]);
  });

  it.each([
    {
      key: 'feature_flags_cache',
      create: () => {
        const service = new FeatureFlagService({ cache: true, refreshInterval: 0 });
        services.push(service);
      },
    },
    {
      key: 'feature_flag_assignments',
      create: () => {
        const service = new FeatureFlagService({ cache: true, refreshInterval: 0 });
        services.push(service);
      },
    },
    { key: 'app_coachmark_state', create: () => new CoachmarkService() },
    { key: 'ab_test_analytics', create: () => new ABTestAnalyticsService() },
    { key: 'funnel_tracker', create: () => new ConversionFunnelTrackerService() },
    {
      key: 'dca_analytics_queue',
      create: () => {
        const service = new DCAAnalyticsService({
          enabled: false,
          offlineQueue: true,
          flushInterval: 0,
        });
        services.push(service);
      },
    },
  ])('contains malformed $key data without logging the original exception', ({ key, create }) => {
    vi.spyOn(browserStorage.local, 'getItem').mockImplementation((name) =>
      name === key ? 'private-token {invalid' : null,
    );
    const { error, warn, report } = diagnostics();
    expect(create).not.toThrow();
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Client operation failed' }),
      expect.objectContaining({ area: expect.any(String), operation: expect.any(String) }),
    );
    expect(report.mock.calls[0][0].stack).toBeUndefined();
    expect(JSON.stringify(report.mock.calls)).not.toContain('private-token');
  });

  it('contains a failed funnel lookup without logging its original error', () => {
    vi.spyOn(funnelTracker, 'getFunnelAnalytics').mockImplementation(() => {
      throw new Error('password=private-token');
    });
    const { error, report } = diagnostics();
    const { result } = renderHook(() => useFunnelAnalytics('wallet_to_creation'));
    expect(result.current).toBeNull();
    expect(error).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalled();
    expect(JSON.stringify(report.mock.calls)).not.toContain('private-token');
  });

  it('contains a malformed preference without logging its value or original exception', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('private-token {invalid');
    const { warn, report } = diagnostics();
    const { result } = renderHook(() => useLocalStorage('layout', 'compact'));
    expect(result.current[0]).toBe('compact');
    expect(warn).not.toHaveBeenCalled();
    expect(report).toHaveBeenCalled();
    expect(JSON.stringify(report.mock.calls)).not.toContain('private-token');
  });

  it('keeps feature diagnostics private even if release configuration enables debugging', () => {
    vi.spyOn(browserStorage.session, 'setItem').mockReturnValue(true);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new FeatureFlagService({ debug: true, cache: false, refreshInterval: 0 });
    services.push(service);
    service.override('qa_flag', 'private-token');
    service.enableDebugMode(true);
    expect(log).not.toHaveBeenCalled();
  });

  it('keeps event and user property diagnostics private even when debugging is requested', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new DCAAnalyticsService({
      debug: true,
      enabled: true,
      requireConsent: false,
      sampleRate: 1,
      batchSize: 100,
      flushInterval: 0,
      offlineQueue: false,
    });
    services.push(service);
    service.trackEvent('local-event', { password: 'private-token' });
    service.setUserProperty('email', 'private-token');
    service.enableDebugMode(true);
    expect(log).not.toHaveBeenCalled();
  });
});
