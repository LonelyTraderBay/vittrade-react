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

    const { env, assertRuntimeEnv } = await import('./env');

    expect(env.mode).toBe('development');
    expect(env.isDev).toBe(false);
    expect(env.isTest).toBe(false);
    expect(env.isStaging).toBe(false);
    expect(env.isProd).toBe(false);
    expect(env.appName).toBe('VitTrade');
    expect(env.releaseVersion).toBe('v1.2.3');
    expect(env.dataSource).toBe('api');
    expect(env.enableAnalytics).toBe(true);
    expect(env.enableDevtools).toBe(false);
    expect(assertRuntimeEnv).not.toThrow();
  });

  it('defaults development to mocks and allows opting into the real API', async () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('DEV', true);
    vi.stubEnv('PROD', false);

    const { env: developmentEnv, assertRuntimeEnv } = await import('./env');

    expect(developmentEnv.dataSource).toBe('mock');
    expect(assertRuntimeEnv).not.toThrow();

    vi.resetModules();
    vi.stubEnv('VITE_DATA_SOURCE', 'api');

    const { env: apiEnv, assertRuntimeEnv: assertApiEnv } = await import('./env');

    expect(apiEnv.dataSource).toBe('api');
    expect(assertApiEnv).not.toThrow();
  });

  it.each(['staging', 'production'] as const)('rejects mock data in %s', async (mode) => {
    vi.stubEnv('MODE', mode);
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', mode === 'production');
    vi.stubEnv('VITE_DATA_SOURCE', 'mock');

    const { env, assertRuntimeEnv } = await import('./env');

    expect(env.dataSource).toBe('mock');
    expect(assertRuntimeEnv).toThrow('Mock data source is not allowed in staging or production');
  });

  it('rejects unsupported data-source values', async () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_DATA_SOURCE', 'fixture');

    const { env, assertRuntimeEnv } = await import('./env');

    expect(env.dataSource).toBe('mock');
    expect(assertRuntimeEnv).toThrow('Runtime environment is invalid: VITE_DATA_SOURCE');
  });

  it('fails closed when production endpoints use insecure protocols', async () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.example.test');
    vi.stubEnv('VITE_WS_URL', 'ws://api.example.test/socket');

    const { env, assertRuntimeEnv } = await import('./env');

    expect(env.isProd).toBe(true);
    expect(assertRuntimeEnv).toThrow(
      'Production environment is incomplete: VITE_API_BASE_URL, VITE_WS_URL',
    );
  });

  it.each([
    { mode: 'staging', isProd: false, label: 'Staging' },
    { mode: 'production', isProd: true, label: 'Production' },
  ])('rejects reserved .invalid endpoints in $mode', async ({ mode, isProd, label }) => {
    vi.stubEnv('MODE', mode);
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', isProd);
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', `https://${mode}.api.example.invalid`);
    vi.stubEnv('VITE_WS_URL', `wss://${mode}.ws.example.invalid/socket`);

    const { env, assertRuntimeEnv } = await import('./env');

    expect(env.dataSource).toBe('api');
    expect(assertRuntimeEnv).toThrow(
      `${label} environment is incomplete: VITE_API_BASE_URL, VITE_WS_URL`,
    );
  });

  it('validates staging endpoints and accepts HTTPS/WSS values outside the placeholder domain', async () => {
    vi.stubEnv('MODE', 'staging');
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_DATA_SOURCE', 'api');
    vi.stubEnv('VITE_API_BASE_URL', 'https://staging.example.test');
    vi.stubEnv('VITE_WS_URL', 'wss://staging.example.test/stream');

    const { env, assertRuntimeEnv } = await import('./env');

    expect(env.isStaging).toBe(true);
    expect(assertRuntimeEnv).not.toThrow();
  });

  it('applies the release guard during a production build even with a custom Vite mode', async () => {
    const { assertReleaseEnvironment } = await import('./runtime-env-validation');

    expect(() =>
      assertReleaseEnvironment({
        mode: 'preview',
        isProduction: true,
        dataSource: 'api',
        apiBaseUrl: 'https://api.example.invalid',
        wsUrl: 'wss://ws.example.invalid',
      }),
    ).toThrow('Production environment is incomplete: VITE_API_BASE_URL, VITE_WS_URL');
  });

  it('accepts secure production HTTP and WebSocket endpoints', async () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');
    vi.stubEnv('VITE_WS_URL', 'wss://api.example.test/socket');

    const { assertRuntimeEnv } = await import('./env');

    expect(assertRuntimeEnv).not.toThrow();
  });
});
