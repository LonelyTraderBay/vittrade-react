import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('browser mock unhandled request policy', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it('fails an unhandled request under the configured API origin and base path', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/gateway');
    const { onUnhandledRequest } = await import('./browser-policy');
    const print = { warning: vi.fn(), error: vi.fn() };

    onUnhandledRequest(new Request('https://api.example.test/gateway/market/missing'), print);

    expect(print.error).toHaveBeenCalledOnce();
    expect(print.warning).not.toHaveBeenCalled();
  });

  it('ignores unrelated public hosts and paths outside the configured API prefix', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/gateway');
    const { onUnhandledRequest } = await import('./browser-policy');
    const print = { warning: vi.fn(), error: vi.fn() };

    onUnhandledRequest(new Request('https://public.example.test/price-feed'), print);
    onUnhandledRequest(new Request('https://api.example.test/gateway-assets/logo'), print);

    expect(print.error).not.toHaveBeenCalled();
    expect(print.warning).not.toHaveBeenCalled();
  });

  it('allows Vite and common static assets when using same-origin API fallback', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    const { onUnhandledRequest } = await import('./browser-policy');
    const print = { warning: vi.fn(), error: vi.fn() };
    const origin = window.location.origin;

    onUnhandledRequest(new Request(`${origin}/@vite/client`), print);
    onUnhandledRequest(new Request(`${origin}/assets/logo.svg`), print);
    onUnhandledRequest(new Request(`${origin}/apiary/market/missing`), print);

    expect(print.error).not.toHaveBeenCalled();
    expect(print.warning).not.toHaveBeenCalled();
  });

  it('fails an unhandled request under the same-origin /api fallback', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    const { onUnhandledRequest } = await import('./browser-policy');
    const print = { warning: vi.fn(), error: vi.fn() };

    onUnhandledRequest(new Request(`${window.location.origin}/api/market/missing`), print);

    expect(print.error).toHaveBeenCalledOnce();
  });
});
