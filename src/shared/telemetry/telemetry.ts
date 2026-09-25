export interface TelemetryContext {
  release?: string;
  requestId?: string;
  feature?: string;
  area?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetrySink {
  captureException(error: unknown, context?: TelemetryContext): void;
  captureEvent(name: string, properties?: Record<string, unknown>): void;
  setUser(user: { id: string } | null): void;
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

export const telemetry: TelemetrySink = {
  captureException: (error, context) => sink.captureException(error, context),
  captureEvent: (name, properties) => sink.captureEvent(name, properties),
  setUser: (user) => sink.setUser(user),
};

export const captureException = (error: unknown, context?: TelemetryContext): void =>
  telemetry.captureException(error, context);

export const captureEvent = (name: string, properties?: Record<string, unknown>): void =>
  telemetry.captureEvent(name, properties);

export const setTelemetryUser = (user: { id: string } | null): void => telemetry.setUser(user);
