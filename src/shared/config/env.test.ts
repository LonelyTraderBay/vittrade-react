import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('runtime environment boundary', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it('normalizes unknown modes, defaults and opt-in flags', async () => {
    vi.stubEnv('MODE', 'preview');
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_APP_NAME', '   ');
    vi.stubEnv('VITE_RELEASE_VERSION', '  v1.2.3  ');
    vi.stubEnv('VITE_ENABLE_ANALYTICS', '1');
    vi.stubEnv('VITE_ENABLE_DEVTOOLS', 'false');

    const { env, assertProductionEnv } = await import('./env');

    expect(env.mode).toBe('development');
    expect(env.isDev).toBe(false);
    expect(env.isTest).toBe(false);
    expect(env.isStaging).toBe(false);
    expect(env.isProd).toBe(false);
    expect(env.appName).toBe('VitTrade');
    expect(env.releaseVersion).toBe('v1.2.3');
    expect(env.enableAnalytics).toBe(true);
    expect(env.enableDevtools).toBe(false);
    expect(assertProductionEnv).not.toThrow();
  });

  it('fails closed when production endpoints use insecure protocols', async () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.example.test');
    vi.stubEnv('VITE_WS_URL', 'ws://api.example.test/socket');

    const { env, assertProductionEnv } = await import('./env');

    expect(env.isProd).toBe(true);
    expect(assertProductionEnv).toThrow(
      'Production environment is incomplete: VITE_API_BASE_URL, VITE_WS_URL',
    );
  });

  it('accepts secure production HTTP and WebSocket endpoints', async () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    vi.stubEnv('VITE_WS_URL', 'wss://api.example.test/socket');

    const { assertProductionEnv } = await import('./env');

    expect(assertProductionEnv).not.toThrow();
  });
});
