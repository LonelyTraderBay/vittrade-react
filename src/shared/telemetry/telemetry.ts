import { isApiError } from '../api/api-error';
import { env } from '../config/env';

export interface TelemetryContext {
  release?: string;
  requestId?: string;
  feature?: string;
  area?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetrySink {
  captureException(error: unknown, context?: TelemetryContext): void | Promise<void>;
  captureEvent(name: string, properties?: Record<string, unknown>): void | Promise<void>;
  setUser(user: { id: string } | null): void | Promise<void>;
}

const noopSink: TelemetrySink = {
  captureException: () => undefined,
  captureEvent: () => undefined,
  setUser: () => undefined,
};

let sink: TelemetrySink = noopSink;

export function configureTelemetry(nextSink: TelemetrySink): void {
  sink = nextSink;
}

// Only bounded structural fields cross this boundary. Free-form messages, stacks,
// URLs, request bodies and nested metadata await the provider/privacy decision.
function label(value: unknown, maxLength = 80): string | undefined {
  return typeof value === 'string' &&
    value.length <= maxLength &&
    /^[a-zA-Z0-9_.:-]+$/.test(value) &&
    !value.startsWith('eyJ')
    ? value
    : undefined;
}

function safeContext(error: unknown, context?: TelemetryContext): TelemetryContext {
  const result: TelemetryContext = { release: label(context?.release ?? env.releaseVersion, 128) };
  for (const key of ['feature', 'area', 'operation'] as const) {
    const value = label(context?.[key]);
    if (value) result[key] = value;
  }
  const requestId = label(
    context?.requestId ?? (isApiError(error) ? error.requestId : undefined),
    128,
  );
  if (requestId) result.requestId = requestId;
  const metadata: Record<string, unknown> = {};
  const status = isApiError(error) ? error.status : context?.metadata?.status;
  if (typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599) {
    metadata.status = status;
  }
  const section = label(context?.metadata?.section);
  if (section) metadata.section = section;
  if (Object.keys(metadata).length) result.metadata = metadata;
  return result;
}

function safeException(error: unknown): Error {
  const code = isApiError(error) ? label(error.code) : undefined;
  const sanitized = new Error(code ? `API failure: ${code}` : 'Client operation failed');
  sanitized.name = isApiError(error) ? 'ApiError' : 'Error';
  delete sanitized.stack;
  return sanitized;
}

function deliver(action: () => void | Promise<void>): void {
  try {
    // Reporting is best effort; an unavailable sink must not interrupt auth or money flows.
    void Promise.resolve(action()).catch(() => undefined);
  } catch {
    // Do not report a reporter failure recursively or log its potentially sensitive payload.
  }
}

export const telemetry: TelemetrySink = {
  captureException: (error, context) =>
    deliver(() => sink.captureException(safeException(error), safeContext(error, context))),
  captureEvent: (name, properties) => {
    if (name !== 'sheet_opened') return;
    const sheetName = label(properties?.sheetName);
    const timestamp = properties?.timestamp;
    const isoDate = properties?.isoDate;
    if (!sheetName || typeof timestamp !== 'number' || !Number.isSafeInteger(timestamp)) return;
    if (typeof isoDate !== 'string' || isoDate.length !== 24 || Date.parse(isoDate) !== timestamp)
      return;
    deliver(() => sink.captureEvent(name, { sheetName, timestamp, isoDate }));
  },
  setUser: (user) => {
    const id = user && label(user.id, 128);
    deliver(() => sink.setUser(id ? { id } : null));
  },
};

export const captureException = (error: unknown, context?: TelemetryContext): void =>
  void telemetry.captureException(error, context);

export const captureEvent = (name: string, properties?: Record<string, unknown>): void =>
  void telemetry.captureEvent(name, properties);

export const setTelemetryUser = (user: { id: string } | null): void => void telemetry.setUser(user);
