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

  it('omits nullish query values while retaining explicit false values', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await client.request({
      method: 'GET',
      path: '/health',
      query: { enabled: false, missing: undefined, empty: null },
    });

    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.example.test/health?enabled=false');
  });

  it('uses the current global fetch when no custom transport is configured', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
    vi.stubGlobal('fetch', fetchImpl);
    try {
      const client = createHttpClient({ baseUrl: 'https://api.example.test' });

      await expect(client.request({ method: 'GET', path: '/health' })).resolves.toEqual({
        ok: true,
      });
      expect(fetchImpl).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'uses the default timeout for non-finite timeout input (%s)',
    async (timeoutMs) => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
      const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

      await expect(
        client.request({ method: 'GET', path: '/health' }, { timeoutMs }),
      ).resolves.toEqual({ ok: true });
      expect(fetchImpl).toHaveBeenCalledOnce();
    },
  );

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

  it.each(['GET', 'POST'] as const)(
    'does not send a %s request when the caller signal is already aborted',
    async (method) => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
      const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });
      const controller = new AbortController();
      controller.abort();

      await expect(
        client.request({
          method,
          path: '/request',
          ...(method === 'POST' ? { body: { value: 'test' } } : {}),
          signal: controller.signal,
        }),
      ).rejects.toMatchObject({
        status: 0,
        code: 'REQUEST_ABORTED',
      } satisfies Partial<ApiError>);
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it('stops before fetch when cancellation occurs while serializing the request', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });
    const body = {
      toJSON: () => {
        controller.abort('cancelled while preparing');
        return { amount: '1' };
      },
    };

    await expect(
      client.request(
        { method: 'POST', path: '/transfers', body, signal: controller.signal },
        { retries: 0 },
      ),
    ).rejects.toMatchObject({ code: 'REQUEST_ABORTED' } satisfies Partial<ApiError>);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('stops before fetch when request preparation consumes the deadline', async () => {
    vi.useFakeTimers();
    try {
      const startedAt = Date.now();
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
      const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });
      const body = {
        toJSON: () => {
          vi.setSystemTime(startedAt + 100);
          return { amount: '1' };
        },
      };

      await expect(
        client.request({ method: 'POST', path: '/transfers', body }, { timeoutMs: 100 }),
      ).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' } satisfies Partial<ApiError>);
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports timeout when response parsing finishes after the request deadline', async () => {
    vi.useFakeTimers();
    try {
      const startedAt = Date.now();
      const parsedResponse = new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
      vi.spyOn(parsedResponse, 'json').mockImplementation(async () => {
        vi.setSystemTime(startedAt + 100);
        return { ok: true };
      });
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(parsedResponse);
      const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

      await expect(
        client.request({ method: 'GET', path: '/health' }, { timeoutMs: 100 }),
      ).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' } satisfies Partial<ApiError>);
      expect(fetchImpl).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses the abort reason fallback when an idempotent retry starts after cancellation', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn<typeof fetch>(() => {
      controller.abort(null);
      return Promise.resolve(response({ message: 'busy' }, { status: 503 }));
    });
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(
      client.request(
        { method: 'GET', path: '/health', signal: controller.signal },
        { retryDelayMs: 0 },
      ),
    ).rejects.toMatchObject({ code: 'REQUEST_ABORTED' } satisfies Partial<ApiError>);
    expect(fetchImpl).toHaveBeenCalledOnce();
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

  it('uses one timeout budget across network retries and backoff', async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Network down'));
      const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });
      const request = client.request(
        { method: 'GET', path: '/health' },
        { retries: 2, retryDelayMs: 100, timeoutMs: 150 },
      );
      const settledRequest = request.then(
        (value) => ({ status: 'resolved' as const, value }),
        (error: unknown) => ({ status: 'rejected' as const, error }),
      );
      let settledAtDeadline = false;
      void settledRequest.then(() => {
        settledAtDeadline = true;
      });

      await vi.advanceTimersByTimeAsync(100);
      expect(fetchImpl).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(50);
      await Promise.resolve();
      const completedWithinBudget = settledAtDeadline;
      await vi.runAllTimersAsync();

      expect(completedWithinBudget).toBe(true);
      await expect(settledRequest).resolves.toMatchObject({
        status: 'rejected',
        error: {
          status: 0,
          code: 'REQUEST_TIMEOUT',
        } satisfies Partial<ApiError>,
      });
      expect(fetchImpl).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('caps the default idempotent retry count at two retries', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(() => Promise.resolve(response({ message: 'Busy' }, { status: 503 })));
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(
      client.request({ method: 'GET', path: '/health' }, { retryDelayMs: 0 }),
    ).rejects.toMatchObject({ status: 503 } satisfies Partial<ApiError>);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it.each([-1, 1.5, 3, Number.POSITIVE_INFINITY, Number.NaN])(
    'rejects retry counts outside the 0–2 budget before fetch (%s)',
    async (retries) => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
      const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

      await expect(client.request({ method: 'GET', path: '/health' }, { retries })).rejects.toThrow(
        RangeError,
      );
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it('keeps correlation and idempotency headers stable across retries', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response({ message: 'Busy' }, { status: 503 }))
      .mockResolvedValueOnce(response({ ok: true }));
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(
      client.request(
        {
          method: 'PUT',
          path: '/addresses/address-1',
          body: { label: 'cold-storage' },
          idempotencyKey: 'address-update-1',
        },
        { retries: 1, retryDelayMs: 0 },
      ),
    ).resolves.toEqual({ ok: true });

    const firstHeaders = new Headers(fetchImpl.mock.calls[0][1]?.headers);
    const secondHeaders = new Headers(fetchImpl.mock.calls[1][1]?.headers);
    expect(secondHeaders.get('x-correlation-id')).toBe(firstHeaders.get('x-correlation-id'));
    expect(firstHeaders.get('x-correlation-id')).toBeTruthy();
    expect(firstHeaders.get('idempotency-key')).toBe('address-update-1');
    expect(secondHeaders.get('idempotency-key')).toBe('address-update-1');
  });

  it('does not retry a POST when the transport outcome is ambiguous', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError('Socket reset after send'));
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(
      client.request({ method: 'POST', path: '/transfers', body: { amount: '1' } }),
    ).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    } satisfies Partial<ApiError>);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('keeps a 204 response as an empty successful result', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(
      client.request<void>({ method: 'DELETE', path: '/addresses/address-1' }),
    ).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('normalizes a trailing-slash base URL and preserves multipart bodies', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ uploaded: true }));
    const client = createHttpClient({ baseUrl: 'https://api.example.test/v1/', fetchImpl });
    const body = new FormData();
    body.set('document', new Blob(['statement']), 'statement.txt');

    await expect(
      client.request({ method: 'POST', path: '/documents', body, headers: { 'X-Upload': 'yes' } }),
    ).resolves.toEqual({ uploaded: true });

    const [url, init] = fetchImpl.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(url).toBe('https://api.example.test/v1/documents');
    expect(init?.body).toBe(body);
    expect(headers.get('content-type')).toBeNull();
    expect(headers.get('x-upload')).toBe('yes');
  });

  it('times out before starting a request when the deadline is already exhausted', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response({ ok: true }));
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(
      client.request({ method: 'GET', path: '/health' }, { timeoutMs: 0 }),
    ).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' } satisfies Partial<ApiError>);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('uses the non-JSON response body as the error message fallback', async () => {
    const upstreamResponse = new Response('upstream unavailable', { status: 502 });
    upstreamResponse.headers.delete('content-type');
    upstreamResponse.headers.set('x-request-id', 'upstream-123');
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(upstreamResponse);
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(client.request({ method: 'POST', path: '/orders' })).rejects.toMatchObject({
      message: 'Request failed',
      status: 502,
      requestId: 'upstream-123',
    } satisfies Partial<ApiError>);
  });

  it('does not call the unauthorized handler when the request opts out', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ message: 'Unauthorized' }, { status: 401 }));
    const onUnauthorized = vi.fn();
    const client = createHttpClient({
      baseUrl: 'https://api.example.test',
      fetchImpl,
      onUnauthorized,
    });

    await expect(
      client.request({ method: 'GET', path: '/profile', skipUnauthorizedHandler: true }),
    ).rejects.toMatchObject({ status: 401 } satisfies Partial<ApiError>);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('reports timeout when an unauthorized handler completes after the request deadline', async () => {
    vi.useFakeTimers();
    try {
      let onUnauthorizedStarted!: () => void;
      let finishUnauthorized!: () => void;
      const unauthorizedStarted = new Promise<void>((resolve) => {
        onUnauthorizedStarted = resolve;
      });
      const unauthorizedResult = new Promise<void>((resolve) => {
        finishUnauthorized = resolve;
      });
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(response({ message: 'Unauthorized' }, { status: 401 }));
      const client = createHttpClient({
        baseUrl: 'https://api.example.test',
        fetchImpl,
        onUnauthorized: () => {
          onUnauthorizedStarted();
          return unauthorizedResult;
        },
      });
      const request = client.request({ method: 'GET', path: '/profile' }, { timeoutMs: 100 });

      await unauthorizedStarted;
      await vi.advanceTimersByTimeAsync(100);
      finishUnauthorized();

      await expect(request).rejects.toMatchObject({
        code: 'REQUEST_TIMEOUT',
      } satisfies Partial<ApiError>);
      expect(fetchImpl).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not retry a rejected request when the transport rejects with a non-Error value', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue('socket unavailable');
    const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });

    await expect(client.request({ method: 'POST', path: '/orders' })).rejects.toMatchObject({
      message: 'Network request failed',
      code: 'NETWORK_ERROR',
    } satisfies Partial<ApiError>);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('returns REQUEST_ABORTED when the caller cancels while the 401 handler is pending', async () => {
    let onUnauthorizedStarted!: () => void;
    let finishUnauthorized!: () => void;
    const unauthorizedStarted = new Promise<void>((resolve) => {
      onUnauthorizedStarted = resolve;
    });
    const unauthorizedResult = new Promise<void>((resolve) => {
      finishUnauthorized = resolve;
    });
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ code: 'UNAUTHORIZED' }, { status: 401 }));
    const onUnauthorized = vi.fn(() => {
      onUnauthorizedStarted();
      return unauthorizedResult;
    });
    const client = createHttpClient({
      baseUrl: 'https://api.example.test',
      fetchImpl,
      onUnauthorized,
    });
    const controller = new AbortController();
    const request = client.request({ method: 'GET', path: '/profile', signal: controller.signal });
    const settledRequest = request.then(
      (value) => ({ status: 'resolved' as const, value }),
      (error: unknown) => ({ status: 'rejected' as const, error }),
    );

    await unauthorizedStarted;
    controller.abort();
    finishUnauthorized();

    await expect(settledRequest).resolves.toMatchObject({
      status: 'rejected',
      error: {
        status: 0,
        code: 'REQUEST_ABORTED',
      } satisfies Partial<ApiError>,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
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

  it.each(['HTTP 503', 'network error'] as const)(
    'does not start another attempt when the caller aborts during %s retry backoff',
    async (failure) => {
      vi.useFakeTimers();
      const removeAbortListener = vi.spyOn(AbortSignal.prototype, 'removeEventListener');
      try {
        const fetchImpl = vi
          .fn<typeof fetch>()
          .mockImplementation(() =>
            failure === 'HTTP 503'
              ? Promise.resolve(response({ message: 'Busy' }, { status: 503 }))
              : Promise.reject(new TypeError('Network down')),
          );
        const client = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl });
        const controller = new AbortController();
        const request = client.request(
          { method: 'GET', path: '/health', signal: controller.signal },
          { retries: 2, retryDelayMs: 5_000, timeoutMs: 60_000 },
        );
        const settledRequest = request.then(
          (value) => ({ status: 'resolved' as const, value }),
          (error: unknown) => ({ status: 'rejected' as const, error }),
        );

        await vi.advanceTimersByTimeAsync(0);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
        controller.abort();
        await vi.runAllTimersAsync();

        await expect(settledRequest).resolves.toMatchObject({
          status: 'rejected',
          error: {
            status: 0,
            code: 'REQUEST_ABORTED',
          } satisfies Partial<ApiError>,
        });
        expect(fetchImpl).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
        expect(removeAbortListener).toHaveBeenCalledTimes(2);
      } finally {
        removeAbortListener.mockRestore();
        vi.useRealTimers();
      }
    },
  );
});
