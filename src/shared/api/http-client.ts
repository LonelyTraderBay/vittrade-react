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
    const timeoutMs = options.timeoutMs ?? 15_000;
    const retries = options.retries ?? (IDEMPOTENT_METHODS.has(requestConfig.method) ? 2 : 0);
    const retryDelayMs = options.retryDelayMs ?? 250;
    const correlationId = createCorrelationId();

    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const abortFromCaller = () => controller.abort(requestConfig.signal?.reason);
      requestConfig.signal?.addEventListener('abort', abortFromCaller, { once: true });

      try {
        const token = config.getAccessToken?.();
        const response = await fetchImpl(
          buildUrl(config.baseUrl, requestConfig.path, requestConfig.query),
          {
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
          },
        );

        const body = await parseResponseBody(response);
        if (response.ok) return body as TResponse;

        if (response.status === 401 && !requestConfig.skipUnauthorizedHandler) {
          await config.onUnauthorized?.();
        }

        if (attempt < retries && RETRYABLE_STATUSES.has(response.status)) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs * 2 ** attempt));
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
        if (error instanceof ApiError) throw error;
        if (controller.signal.aborted) {
          throw new ApiError(
            requestConfig.signal?.aborted ? 'Request aborted' : 'Request timed out',
            {
              status: 0,
              code: requestConfig.signal?.aborted ? 'REQUEST_ABORTED' : 'REQUEST_TIMEOUT',
              requestId: correlationId,
              cause: error,
            },
          );
        }
        if (attempt >= retries) {
          throw new ApiError(error instanceof Error ? error.message : 'Network request failed', {
            status: 0,
            code: controller.signal.aborted ? 'REQUEST_ABORTED' : 'NETWORK_ERROR',
            requestId: correlationId,
            cause: error,
          });
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * 2 ** attempt));
      } finally {
        clearTimeout(timeout);
        requestConfig.signal?.removeEventListener('abort', abortFromCaller);
      }
    }
  }

  return { request };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
