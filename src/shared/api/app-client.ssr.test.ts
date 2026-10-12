import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.doUnmock('../config/env');
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('app API client server fallback', () => {
  it('uses the localhost API base when no browser window exists', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('fetch', fetchMock);
    vi.doMock('../config/env', () => ({ env: { apiBaseUrl: '' } }));
    vi.resetModules();

    const { apiClient } = await import('./app-client');
    await expect(apiClient.request({ method: 'GET', path: '/health' })).resolves.toEqual({
      ok: true,
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('http://localhost/api/health');
  });
});
