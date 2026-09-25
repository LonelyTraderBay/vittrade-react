import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { FeatureFlagService } from './FeatureFlagService';

describe('FeatureFlagService storage', () => {
  const services: FeatureFlagService[] = [];

  afterEach(() => {
    services.splice(0).forEach((service) => service.destroy());
    vi.restoreAllMocks();
  });

  it('persists QA overrides in session storage and removes them when cleared', () => {
    const setItem = vi.spyOn(browserStorage.session, 'setItem').mockReturnValue(true);
    const removeItem = vi.spyOn(browserStorage.session, 'removeItem').mockReturnValue(true);
    const service = new FeatureFlagService({ cache: false, refreshInterval: 0 });
    services.push(service);

    service.override('qa_flag', false);
    expect(service.isEnabled('qa_flag')).toBe(false);
    expect(setItem).toHaveBeenCalledWith(
      'feature_flag_overrides',
      JSON.stringify({ qa_flag: false }),
    );

    service.clearOverrides();
    expect(removeItem).toHaveBeenCalledWith('feature_flag_overrides');
  });

  it('notifies subscribers when overrides change and stops after unsubscribe', () => {
    const service = new FeatureFlagService({ cache: false, refreshInterval: 0 });
    services.push(service);
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    service.override('qa_flag', false);
    service.clearOverrides();

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    service.override('qa_flag', true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('loads cached flags and user variant assignments through browser storage', () => {
    const cachedFlag = {
      key: 'cached_flag',
      name: 'Cached flag',
      description: 'Loaded from storage',
      enabled: true,
      rolloutPercentage: 100,
    };
    const getItem = vi.spyOn(browserStorage.local, 'getItem').mockImplementation((key) => {
      if (key === 'feature_flags_cache') {
        return JSON.stringify({ flags: { cached_flag: cachedFlag }, timestamp: Date.now() });
      }
      if (key === 'feature_flag_assignments') {
        return JSON.stringify({ 'dca_shortcut_variant:user-1': 'compact' });
      }
      return null;
    });
    const service = new FeatureFlagService({ cache: true, cacheTTL: 60_000, refreshInterval: 0 });
    services.push(service);

    expect(service.getAllFlags().cached_flag).toMatchObject({ enabled: true, name: 'Cached flag' });
    expect(service.getVariant('dca_shortcut_variant', { userId: 'user-1' })).toBe('compact');
    expect(getItem).toHaveBeenCalledWith('feature_flags_cache');
    expect(getItem).toHaveBeenCalledWith('feature_flag_assignments');
  });

  it('checks default flag states, uses fallbacks and applies overrides first', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const service = new FeatureFlagService({ cache: false, refreshInterval: 0 });
    services.push(service);

    expect(service.isEnabled('dca_enabled')).toBe(true);
    expect(service.isEnabled('dca_advanced_options')).toBe(false);
    expect(service.isEnabled('missing_flag')).toBe(false);
    expect(service.getValue('missing_flag', 'fallback')).toBe('fallback');

    service.override('dca_enabled', false);
    expect(service.isEnabled('dca_enabled')).toBe(false);
    expect(service.getValue('dca_enabled', true)).toBe(false);
  });

  it('enforces cached user segments and rollout percentage', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockImplementation((key) => {
      if (key === 'feature_flags_cache') {
        return JSON.stringify({
          timestamp: Date.now(),
          flags: {
            segmented: {
              key: 'segmented',
              name: 'Segmented',
              description: '',
              enabled: true,
              userSegments: ['beta'],
            },
            disabled_rollout: {
              key: 'disabled_rollout',
              name: 'Disabled rollout',
              description: '',
              enabled: true,
              rolloutPercentage: 0,
            },
          },
        });
      }
      return null;
    });
    const service = new FeatureFlagService({ cacheTTL: 60_000, refreshInterval: 0 });
    services.push(service);

    expect(service.isEnabled('segmented', { segment: 'beta' })).toBe(true);
    expect(service.isEnabled('segmented', { segment: 'control' })).toBe(false);
    expect(service.isEnabled('segmented')).toBe(true);
    expect(service.isEnabled('disabled_rollout', { userId: 'user-1' })).toBe(false);
  });

  it('assigns and persists a stable variant for the same user', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const setItem = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const service = new FeatureFlagService({ refreshInterval: 0 });
    services.push(service);

    const first = service.getVariant('dca_shortcut_variant', { userId: 'user-42' });
    const second = service.getVariant('dca_shortcut_variant', { userId: 'user-42' });

    expect(['full', 'compact']).toContain(first);
    expect(second).toBe(first);
    expect(setItem).toHaveBeenCalledWith(
      'feature_flag_assignments',
      JSON.stringify({ 'dca_shortcut_variant:user-42': first }),
    );
  });

  it('ignores an expired cache and removes it from browser storage', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(
      JSON.stringify({ timestamp: Date.now() - 10_000, flags: { stale: { enabled: true } } }),
    );
    const removeItem = vi.spyOn(browserStorage.local, 'removeItem').mockReturnValue(true);
    const service = new FeatureFlagService({ cacheTTL: 100, refreshInterval: 0 });
    services.push(service);

    expect(service.getAllFlags()).not.toHaveProperty('stale');
    expect(removeItem).toHaveBeenCalledWith('feature_flags_cache');
  });

  it('refreshes flags from remote config and caches the merged result', async () => {
    const remoteFlag = {
      key: 'remote_flag',
      name: 'Remote flag',
      description: 'Fetched remotely',
      enabled: true,
      rolloutPercentage: 100,
    };
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const setItem = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ remote_flag: remoteFlag }),
    } as Response);
    const service = new FeatureFlagService({
      remoteConfigUrl: '/flags',
      refreshInterval: 0,
    });
    services.push(service);
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    await service.refresh();

    expect(fetchMock).toHaveBeenCalledWith('/flags');
    expect(service.getAllFlags().remote_flag).toEqual(remoteFlag);
    expect(setItem).toHaveBeenCalledWith(
      'feature_flags_cache',
      expect.stringContaining('remote_flag'),
    );
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('logs remote refresh failures without discarding existing flags', async () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network unavailable'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = new FeatureFlagService({
      remoteConfigUrl: '/flags',
      refreshInterval: 0,
    });
    services.push(service);

    await service.refresh();

    expect(service.getAllFlags()).toHaveProperty('dca_enabled');
    expect(error).toHaveBeenCalledWith('[FeatureFlags] Failed to refresh:', expect.any(Error));
  });

  it('enables debug logging and exposes a diagnostic snapshot', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = new FeatureFlagService({ cache: false, refreshInterval: 0 });
    services.push(service);

    service.enableDebugMode(true);
    expect(service.isEnabled('unknown_flag')).toBe(false);
    service.override('debug_flag', true);
    service.clearOverrides();

    const debugInfo = service.getDebugInfo();
    expect(debugInfo).toMatchObject({
      overrides: {},
      config: { debug: true },
    });
    expect(debugInfo.flags).toHaveProperty('dca_enabled');
    expect(warn).toHaveBeenCalledWith('[FeatureFlags] Flag not found: unknown_flag');
    expect(log).toHaveBeenCalledWith('[FeatureFlags] Debug mode enabled');
    expect(log).toHaveBeenCalledWith('[FeatureFlags] Cleared all overrides');
  });

  it('stops the auto-refresh timer when destroyed', () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
      const service = new FeatureFlagService({
        cache: false,
        refreshInterval: 10,
      });
      services.push(service);
      const refresh = vi.spyOn(service, 'refresh');

      vi.advanceTimersByTime(25);
      expect(refresh).toHaveBeenCalledTimes(2);

      service.destroy();
      vi.advanceTimersByTime(20);
      expect(refresh).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('logs and ignores malformed cache and variant-assignment data', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('{invalid');
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = new FeatureFlagService({ refreshInterval: 0 });
    services.push(service);

    expect(service.getAllFlags()).toHaveProperty('dca_enabled');
    expect(error).toHaveBeenCalledWith(
      '[FeatureFlags] Failed to load cache:',
      expect.any(SyntaxError),
    );
    expect(error).toHaveBeenCalledWith(
      '[FeatureFlags] Failed to load assignments:',
      expect.any(SyntaxError),
    );
  });
});
