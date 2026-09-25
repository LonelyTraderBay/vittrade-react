import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { createHttpClient } from './http-client';

function response(body: unknown, init: ResponseInit = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('createHttpClient', () => {
  it('builds a typed request with query, auth and correlation headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
    const client = createHttpClient({
      baseUrl: 'https://api.example.test/v1',
      getAccessToken: () => 'access-token',
      fetchImpl,
    });

    await expect(
      client.request<{ ok: boolean }>({
        method: 'GET',
        path: '/orders',
        query: { status: 'open', page: 1 },
      }),
    ).resolves.toEqual({ ok: true });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.example.test/v1/orders?status=open&page=1');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer access-token');
    expect(new Headers(init?.headers).get('x-correlation-id')).toBeTruthy();
  });

  it('does not retry a non-idempotent request by default', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response({ code: 'ORDER_REJECTED', message: 'Rejected' }, { status: 422 }),
      );
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(
      client.request({ method: 'POST', path: '/orders', body: { symbol: 'BTC/USDT' } }),
    ).rejects.toMatchObject({ status: 422, code: 'ORDER_REJECTED' } satisfies Partial<ApiError>);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries transient idempotent failures and then succeeds', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ message: 'Busy' }, { status: 503 }))
      .mockResolvedValueOnce(response({ value: 42 }));
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(
      client.request<{ value: number }>({ method: 'GET', path: '/health' }, { retryDelayMs: 0 }),
    ).resolves.toEqual({ value: 42 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('does not retry when the caller aborts an idempotent request', async () => {
    const fetchImpl = vi.fn<typeof fetch>((_input, init) => {
      return new Promise((_, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      });
    });
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });
    const controller = new AbortController();
    const request = client.request(
      { method: 'GET', path: '/health', signal: controller.signal },
      { retryDelayMs: 0 },
    );

    controller.abort();

    await expect(request).rejects.toMatchObject({
      status: 0,
      code: 'REQUEST_ABORTED',
    } satisfies Partial<ApiError>);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
