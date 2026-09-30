import { ApiError } from './api-error';

export type HttpMethod = 'GET' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  idempotencyKey?: string;
  skipUnauthorizedHandler?: boolean;
}

export interface RequestOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface HttpClientConfig {
  baseUrl: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void | Promise<void>;
  fetchImpl?: typeof fetch;
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 502, 503, 504]);
const IDEMPOTENT_METHODS = new Set<HttpMethod>(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);
const MAX_RETRIES = 2;

function waitForAbortableDelay(delayMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}

function requestAbortedError(requestId: string, cause?: unknown): ApiError {
  return new ApiError('Request aborted', {
    status: 0,
    code: 'REQUEST_ABORTED',
    requestId,
    cause,
  });
}

function requestTimeoutError(requestId: string, cause?: unknown): ApiError {
  return new ApiError('Request timed out', {
    status: 0,
    code: 'REQUEST_TIMEOUT',
    requestId,
    cause,
  });
}

function buildUrl(baseUrl: string, path: string, query?: ApiRequest['query']): string {
  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(normalizedPath, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function createCorrelationId(): string {
  return crypto.randomUUID();
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

function getErrorFields(body: unknown): { message: string; code?: string; details?: unknown } {
  if (!body || typeof body !== 'object') return { message: 'Request failed' };
  const record = body as Record<string, unknown>;
  return {
    message: typeof record.message === 'string' ? record.message : 'Request failed',
    code: typeof record.code === 'string' ? record.code : undefined,
    details: record.details,
  };
}

export function createHttpClient(config: HttpClientConfig) {
  // Resolve the global fetch at request time so test adapters (MSW) and
  // deployment instrumentation can install their interceptor after module
  // initialization without being bypassed by a captured native reference.
  const fetchImpl =
    config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));

  async function request<TResponse>(
    requestConfig: ApiRequest,
    options: RequestOptions = {},
  ): Promise<TResponse> {
    const configuredTimeoutMs = options.timeoutMs ?? 15_000;
    const timeoutMs = Number.isFinite(configuredTimeoutMs)
      ? Math.max(0, configuredTimeoutMs)
      : 15_000;
    const deadline = Date.now() + timeoutMs;
    const retries = options.retries ?? (IDEMPOTENT_METHODS.has(requestConfig.method) ? 2 : 0);
    if (!Number.isInteger(retries) || retries < 0 || retries > MAX_RETRIES) {
      throw new RangeError(`retries must be an integer between 0 and ${MAX_RETRIES}`);
    }
    const retryDelayMs = options.retryDelayMs ?? 250;
    const correlationId = createCorrelationId();

    for (let attempt = 0; ; attempt += 1) {
      if (requestConfig.signal?.aborted) {
        throw requestAbortedError(correlationId, requestConfig.signal.reason);
      }
      const remainingTimeoutMs = deadline - Date.now();
      if (remainingTimeoutMs <= 0) throw requestTimeoutError(correlationId);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), remainingTimeoutMs);
      const abortFromCaller = () => controller.abort(requestConfig.signal?.reason);
      requestConfig.signal?.addEventListener('abort', abortFromCaller, { once: true });

      try {
        const token = config.getAccessToken?.();
        const url = buildUrl(config.baseUrl, requestConfig.path, requestConfig.query);
        const init: RequestInit = {
          method: requestConfig.method,
          headers: {
            Accept: 'application/json',
            ...(requestConfig.body === undefined || requestConfig.body instanceof FormData
              ? {}
              : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(requestConfig.idempotencyKey
              ? { 'Idempotency-Key': requestConfig.idempotencyKey }
              : {}),
            'X-Correlation-ID': correlationId,
            ...requestConfig.headers,
          },
          body:
            requestConfig.body === undefined
              ? undefined
              : requestConfig.body instanceof FormData
                ? requestConfig.body
                : JSON.stringify(requestConfig.body),
          credentials: 'include',
          signal: controller.signal,
        };
        if (requestConfig.signal?.aborted) {
          throw requestAbortedError(correlationId, requestConfig.signal.reason);
        }
        if (Date.now() >= deadline) throw requestTimeoutError(correlationId);

        const response = await fetchImpl(url, init);

        const body = await parseResponseBody(response);
        if (Date.now() >= deadline) throw requestTimeoutError(correlationId);
        if (response.ok) return body as TResponse;

        if (response.status === 401 && !requestConfig.skipUnauthorizedHandler) {
          await config.onUnauthorized?.();
          if (Date.now() >= deadline) throw requestTimeoutError(correlationId);
        }

        if (attempt < retries && RETRYABLE_STATUSES.has(response.status)) {
          await waitForAbortableDelay(retryDelayMs * 2 ** attempt, controller.signal);
          continue;
        }

        const errorFields = getErrorFields(body);
        throw new ApiError(errorFields.message, {
          status: response.status,
          code: errorFields.code,
          requestId: response.headers.get('X-Request-ID') ?? correlationId,
          details: errorFields.details,
        });
      } catch (error) {
        if (requestConfig.signal?.aborted) {
          throw requestAbortedError(correlationId, error);
        }
        if (controller.signal.aborted) {
          throw requestTimeoutError(correlationId, error);
        }
        if (error instanceof ApiError) throw error;
        if (attempt >= retries) {
          throw new ApiError(error instanceof Error ? error.message : 'Network request failed', {
            status: 0,
            code: controller.signal.aborted ? 'REQUEST_ABORTED' : 'NETWORK_ERROR',
            requestId: correlationId,
            cause: error,
          });
        }
        try {
          await waitForAbortableDelay(retryDelayMs * 2 ** attempt, controller.signal);
        } catch (retryDelayError) {
          if (requestConfig.signal?.aborted) {
            throw requestAbortedError(correlationId, retryDelayError);
          }
          if (controller.signal.aborted) {
            throw requestTimeoutError(correlationId, retryDelayError);
          }
          throw retryDelayError;
        }
      } finally {
        clearTimeout(timeout);
        requestConfig.signal?.removeEventListener('abort', abortFromCaller);
      }
    }
  }

  return { request };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
