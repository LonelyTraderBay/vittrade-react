import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import type { FeatureFlag } from '@/shared/types/feature-flags';
import { FeatureFlagService } from './FeatureFlagService';

function makeFlag(key: string, overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  return { key, name: key, description: '', enabled: true, ...overrides };
}

describe('FeatureFlagService storage', () => {
  const services: FeatureFlagService[] = [];

  afterEach(() => {
    services.splice(0).forEach((service) => service.destroy());
    vi.restoreAllMocks();
  });

  it('preserves valid serialized dates, variants, metadata and forward-compatible flag fields', () => {
    const expiresAt = new Date('2099-01-01T00:00:00.000Z');
    const flag = {
      ...makeFlag('valid_flag', {
        expiresAt,
        variants: [{ key: 'one', name: 'One', weight: 1, value: 'variant-value' }],
        metadata: { owner: 'test-owner' },
      }),
      futureField: 'preserved',
    };
    vi.spyOn(browserStorage.local, 'getItem').mockImplementation((key) =>
      key === 'feature_flags_cache'
        ? JSON.stringify({ flags: { valid_flag: flag }, timestamp: Date.now() })
        : null,
    );
    const service = new FeatureFlagService({ cache: true, refreshInterval: 0 });
    services.push(service);
    expect(service.getAllFlags().valid_flag).toMatchObject({
      expiresAt,
      metadata: { owner: 'test-owner' },
      futureField: 'preserved',
    });
    expect(service.getValue('valid_flag', 'fallback')).toBe('variant-value');
  });

  it('treats an explicitly supplied prototype-named override as an own value', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const service = new FeatureFlagService({ cache: false, refreshInterval: 0 });
    services.push(service);
    service.override('__proto__', false);
    expect(service.isEnabled('__proto__')).toBe(false);
    expect(service.getValue('__proto__', 'fallback')).toBe(false);
    service.clearOverrides();
    expect(service.getValue('__proto__', 'fallback')).toBe('fallback');
  });

  it.each(['toString', 'constructor', 'valueOf'])(
    'does not treat an inherited %s property as a feature override',
    (key) => {
      vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
      const service = new FeatureFlagService({ cache: false, refreshInterval: 0 });
      services.push(service);
      expect(service.isEnabled(key)).toBe(false);
      expect(service.getValue(key, 'fallback')).toBe('fallback');
      expect(service.getVariant(key)).toBe('control');
    },
  );

  it.each([
    makeFlag('unsafe_flag', { enabled: 'yes' as unknown as boolean }),
    makeFlag('unsafe_flag', { userSegments: {} as string[] }),
    makeFlag('unsafe_flag', { variants: {} as FeatureFlag['variants'] }),
  ])('rejects a cached flag whose JSON shape violates its runtime contract: %j', (flag) => {
    vi.spyOn(browserStorage.local, 'getItem').mockImplementation((key) =>
      key === 'feature_flags_cache'
        ? JSON.stringify({ flags: { unsafe_flag: flag }, timestamp: Date.now() })
        : null,
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = new FeatureFlagService({ cache: true, refreshInterval: 0 });
    services.push(service);
    expect(service.getAllFlags()).not.toHaveProperty('unsafe_flag');
    expect(service.getAllFlags()).toHaveProperty('dca_enabled');
  });

  it.each([null, { 'dca_shortcut_variant:user-1': 17 }, { 'dca_shortcut_variant:user-1': {} }])(
    'rejects assignments with invalid persisted shape: %j',
    (assignments) => {
      vi.spyOn(browserStorage.local, 'getItem').mockImplementation((key) =>
        key === 'feature_flag_assignments' ? JSON.stringify(assignments) : null,
      );
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const service = new FeatureFlagService({ cache: true, refreshInterval: 0 });
      services.push(service);
      expect(typeof service.getVariant('dca_shortcut_variant', { userId: 'user-1' })).toBe(
        'string',
      );
    },
  );

  it.each([
    makeFlag('unsafe_flag', { enabled: 'yes' as unknown as boolean }),
    makeFlag('unsafe_flag', { userSegments: {} as string[] }),
    makeFlag('unsafe_flag', { variants: {} as FeatureFlag['variants'] }),
  ])('preserves default flags when remote configuration has an invalid shape: %j', async (flag) => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ unsafe_flag: flag }),
    } as Response);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = new FeatureFlagService({
      cache: false,
      refreshInterval: 0,
      remoteConfigUrl: '/test-flags',
    });
    services.push(service);
    await service.refresh();
    expect(service.getAllFlags()).not.toHaveProperty('unsafe_flag');
    expect(service.getAllFlags()).toHaveProperty('dca_enabled');
  });

  it.each([403, 503])(
    'rejects an unsuccessful HTTP %s config even when its body resembles flags',
    async (status) => {
      vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
      vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () =>
          new Response(JSON.stringify({ unsafe_flag: makeFlag('unsafe_flag') }), { status }),
      );
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const service = new FeatureFlagService({
        cache: false,
        refreshInterval: 0,
        remoteConfigUrl: '/test-flags',
      });
      services.push(service);
      await service.refresh();
      expect(service.getAllFlags()).not.toHaveProperty('unsafe_flag');
      expect(service.getAllFlags()).toHaveProperty('dca_enabled');
    },
  );

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

    expect(service.getVersion()).toBe(0);
    service.override('qa_flag', false);
    expect(service.getVersion()).toBe(1);
    service.clearOverrides();
    expect(service.getVersion()).toBe(2);

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    service.override('qa_flag', true);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(service.getVersion()).toBe(3);
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
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new FeatureFlagService({
      cache: true,
      cacheTTL: 60_000,
      debug: true,
      refreshInterval: 0,
    });
    services.push(service);

    expect(service.getAllFlags().cached_flag).toMatchObject({ enabled: true, name: 'Cached flag' });
    expect(service.getVariant('dca_shortcut_variant', { userId: 'user-1' })).toBe('compact');
    expect(getItem).toHaveBeenCalledWith('feature_flags_cache');
    expect(getItem).toHaveBeenCalledWith('feature_flag_assignments');
    expect(log).toHaveBeenCalledWith('[FeatureFlags] Loaded from cache');
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

  it('returns typed variant values including false and zero and falls back only when absent', () => {
    const flags = {
      zero_value: makeFlag('zero_value', {
        variants: [{ key: 'zero', name: 'Zero', weight: 100, value: 0 }],
      }),
      false_value: makeFlag('false_value', {
        variants: [{ key: 'false', name: 'False', weight: 100, value: false }],
      }),
      missing_value: makeFlag('missing_value', {
        variants: [{ key: 'present', name: 'Present', weight: 100, value: 'present' }],
      }),
      zero_weights: makeFlag('zero_weights', {
        variants: [
          { key: 'first', name: 'First', weight: 0, value: 'first' },
          { key: 'last', name: 'Last', weight: 0, value: 'last' },
        ],
      }),
    };
    vi.spyOn(browserStorage.local, 'getItem').mockImplementation((key) => {
      if (key === 'feature_flags_cache') {
        return JSON.stringify({ timestamp: Date.now(), flags });
      }
      if (key === 'feature_flag_assignments') {
        return JSON.stringify({ 'missing_value:anonymous': 'unknown-variant' });
      }
      return null;
    });
    const service = new FeatureFlagService({ cacheTTL: 60_000, refreshInterval: 0 });
    services.push(service);

    expect(service.getValue('zero_value', 7)).toBe(0);
    expect(service.getValue('false_value', true)).toBe(false);
    expect(service.getValue('missing_value', 'fallback')).toBe('fallback');
    expect(service.getVariant('zero_weights')).toBe('last');
    expect(service.getValue('dca_enabled', false)).toBe(true);
    expect(service.getVariant('dca_enabled')).toBe('control');
    expect(service.getVariant('missing_flag')).toBe('control');
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
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new FeatureFlagService({ debug: true, refreshInterval: 0 });
    services.push(service);

    const first = service.getVariant('dca_shortcut_variant', { userId: 'user-42' });
    const second = service.getVariant('dca_shortcut_variant', { userId: 'user-42' });

    expect(['full', 'compact']).toContain(first);
    expect(second).toBe(first);
    expect(setItem).toHaveBeenCalledWith(
      'feature_flag_assignments',
      JSON.stringify({ 'dca_shortcut_variant:user-42': first }),
    );
    expect(log).toHaveBeenCalledWith(
      `[FeatureFlags] Assigned variant "${first}" for flag "dca_shortcut_variant"`,
    );
  });

  it('assigns both configured variants across deterministic user buckets', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const service = new FeatureFlagService({ cache: false, refreshInterval: 0 });
    services.push(service);

    const variants = new Set(
      Array.from({ length: 200 }, (_, index) =>
        service.getVariant('dca_shortcut_variant', { userId: `user-${index}` }),
      ),
    );

    expect(variants).toEqual(new Set(['full', 'compact']));
  });

  it('keeps rollout enabled and disabled outcomes for user-specific buckets', () => {
    const rolloutFlag = makeFlag('half_rollout', { rolloutPercentage: 50 });
    vi.spyOn(browserStorage.local, 'getItem').mockImplementation((key) =>
      key === 'feature_flags_cache'
        ? JSON.stringify({ timestamp: Date.now(), flags: { half_rollout: rolloutFlag } })
        : null,
    );
    const service = new FeatureFlagService({ cacheTTL: 60_000, refreshInterval: 0 });
    services.push(service);

    const outcomes = Array.from({ length: 100 }, (_, index) =>
      service.isEnabled('half_rollout', { userId: `rollout-user-${index}` }),
    );

    expect(outcomes).toContain(true);
    expect(outcomes).toContain(false);
    expect(service.isEnabled('half_rollout', {})).toBe(service.isEnabled('half_rollout'));
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
      ok: true,
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

  it('supports uncached debug refresh and logs its successful update', async () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const setItem = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new FeatureFlagService({
      cache: false,
      debug: true,
      remoteConfigUrl: '/flags',
      refreshInterval: 0,
    });
    services.push(service);

    await service.refresh();

    expect(fetchMock).toHaveBeenCalledWith('/flags');
    expect(setItem).not.toHaveBeenCalledWith('feature_flags_cache', expect.any(String));
    expect(log).toHaveBeenCalledWith('[FeatureFlags] Refreshed from remote');
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
    service.enableDebugMode(false);
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
    expect(log).toHaveBeenCalledWith('[FeatureFlags] Debug mode disabled');
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

  it('logs and preserves in-memory override changes when session storage writes fail', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    vi.spyOn(browserStorage.session, 'setItem').mockImplementation(() => {
      throw new Error('session storage unavailable');
    });
    vi.spyOn(browserStorage.session, 'removeItem').mockImplementation(() => {
      throw new Error('session storage unavailable');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = new FeatureFlagService({ cache: false, refreshInterval: 0 });
    services.push(service);

    service.override('temporary', true);
    expect(service.isEnabled('temporary')).toBe(true);
    service.clearOverrides();
    expect(service.isEnabled('temporary')).toBe(false);

    expect(error).toHaveBeenCalledWith(
      '[FeatureFlags] Failed to save overrides:',
      expect.any(Error),
    );
    expect(error).toHaveBeenCalledWith(
      '[FeatureFlags] Failed to clear overrides:',
      expect.any(Error),
    );
  });

  it('logs cache-load, assignment-write, and remote-cache-write failures without losing defaults', async () => {
    vi.spyOn(browserStorage.local, 'getItem').mockImplementation((key) => {
      if (key === 'feature_flags_cache') return '{invalid';
      if (key === 'feature_flag_assignments') return null;
      return null;
    });
    vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw new Error('local storage unavailable');
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ remote_flag: makeFlag('remote_flag') }),
    } as Response);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = new FeatureFlagService({
      cache: true,
      cacheTTL: 60_000,
      remoteConfigUrl: '/flags',
      refreshInterval: 0,
    });
    services.push(service);

    await service.refresh();
    service.getVariant('dca_shortcut_variant', { userId: 'storage-failure-user' });

    expect(service.getAllFlags()).toHaveProperty('dca_enabled');
    expect(error).toHaveBeenCalledWith(
      '[FeatureFlags] Failed to load cache:',
      expect.any(SyntaxError),
    );
    expect(error).toHaveBeenCalledWith('[FeatureFlags] Failed to save cache:', expect.any(Error));
    expect(error).toHaveBeenCalledWith(
      '[FeatureFlags] Failed to save assignments:',
      expect.any(Error),
    );
  });
});
