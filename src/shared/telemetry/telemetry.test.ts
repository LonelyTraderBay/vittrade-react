import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/api-error';
import { captureEvent, captureException, configureTelemetry, setTelemetryUser } from './telemetry';

const sink = () => ({ captureException: vi.fn(), captureEvent: vi.fn(), setUser: vi.fn() });
afterEach(() => configureTelemetry(sink()));

describe('telemetry delivery boundary', () => {
  it('keeps an unconfigured provider inert for the supported event and user operations', async () => {
    vi.resetModules();
    const fresh = await import('./telemetry');
    expect(() =>
      fresh.captureEvent('sheet_opened', {
        sheetName: 'trade',
        timestamp: 1,
        isoDate: '1970-01-01T00:00:00.001Z',
      }),
    ).not.toThrow();
    expect(() => fresh.captureException(new Error('operation failed'))).not.toThrow();
    expect(() => fresh.setTelemetryUser({ id: 'opaque-user' })).not.toThrow();
    await Promise.resolve();
  });

  it('keeps release/request correlation and drops free-form and nested sensitive data', () => {
    const target = sink();
    configureTelemetry(target);
    const original = new ApiError('password=secret; token=abc; kyc document', {
      status: 401,
      code: 'SESSION_EXPIRED',
      requestId: 'request-123',
      details: { password: 'secret', nested: { token: 'abc', kyc: 'passport' } },
      cause: new Error('authorization: Bearer private-token'),
    });
    captureException(original, {
      release: 'release-123',
      area: 'auth',
      operation: 'getSession',
      metadata: {
        section: 'login',
        password: 'secret',
        nested: { token: 'abc', kyc: 'passport' },
        componentStack: 'private',
        path: '/reset/private-token',
      },
    });
    const [error, context] = target.captureException.mock.calls[0];
    expect(error).toMatchObject({ name: 'ApiError', message: 'API failure: SESSION_EXPIRED' });
    expect(error.stack).toBeUndefined();
    expect(error.cause).toBeUndefined();
    expect(context).toEqual({
      release: 'release-123',
      requestId: 'request-123',
      area: 'auth',
      operation: 'getSession',
      metadata: { status: 401, section: 'login' },
    });
    expect(original.message).toContain('secret');
    expect(original.details).toBeDefined();
  });

  it('does not forward arbitrary thrown objects, strings, email IDs or unbounded context', () => {
    const target = sink();
    configureTelemetry(target);
    captureException(
      { message: 'secret', token: 'abc' },
      { feature: 'x'.repeat(81), requestId: 'user@example.com', metadata: { status: NaN } },
    );
    captureException('password and KYC', { area: 'eyJ-private-token' });
    for (const [error, context] of target.captureException.mock.calls) {
      expect(error.message).toBe('Client operation failed');
      expect(error.stack).toBeUndefined();
      expect(context).not.toHaveProperty('requestId');
      expect(context).not.toHaveProperty('feature');
      expect(context).not.toHaveProperty('metadata');
    }
    setTelemetryUser({ id: 'user@example.com' });
    expect(target.setUser).toHaveBeenLastCalledWith(null);
    setTelemetryUser({ id: 'opaque-user-123' });
    expect(target.setUser).toHaveBeenLastCalledWith({ id: 'opaque-user-123' });
    setTelemetryUser(null);
    expect(target.setUser).toHaveBeenLastCalledWith(null);
  });

  it('only sends the existing bounded sheet event schema', () => {
    const target = sink();
    configureTelemetry(target);
    const event = {
      sheetName: 'p2p-order-pin-confirm',
      timestamp: 1_800_000_000_000,
      isoDate: '2027-01-15T08:00:00.000Z',
    };
    captureEvent('sheet_opened', { ...event, password: 'secret', nested: { kyc: 'passport' } });
    expect(target.captureEvent).toHaveBeenCalledExactlyOnceWith('sheet_opened', event);
    captureEvent('unknown_event', event);
    captureEvent('sheet_opened', { ...event, sheetName: 'x'.repeat(81) });
    captureEvent('sheet_opened', { ...event, timestamp: Infinity });
    captureEvent('sheet_opened', { ...event, isoDate: 'private' });
    expect(target.captureEvent).toHaveBeenCalledTimes(1);
  });

  it('contains synchronous sink failures for every method', () => {
    const fail = () => {
      throw new Error('sink unavailable');
    };
    configureTelemetry({ captureException: fail, captureEvent: fail, setUser: fail });
    expect(() => captureException(new Error('business failure'))).not.toThrow();
    expect(() =>
      captureEvent('sheet_opened', {
        sheetName: 'trade',
        timestamp: 1,
        isoDate: '1970-01-01T00:00:00.001Z',
      }),
    ).not.toThrow();
    expect(() => setTelemetryUser(null)).not.toThrow();
  });

  it('consumes asynchronous sink rejection without retrying or raising a new unhandled rejection', async () => {
    const fail = vi.fn(async () => {
      throw new Error('sink unavailable');
    });
    configureTelemetry({ captureException: fail, captureEvent: fail, setUser: fail });
    captureException(new Error('business failure'));
    captureEvent('sheet_opened', {
      sheetName: 'trade',
      timestamp: 1,
      isoDate: '1970-01-01T00:00:00.001Z',
    });
    setTelemetryUser(null);
    await Promise.resolve();
    await Promise.resolve();
    expect(fail).toHaveBeenCalledTimes(3);
  });
});
