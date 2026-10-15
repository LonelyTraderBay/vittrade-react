import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { configureTelemetry } from '../../shared/telemetry/telemetry';
import App from '../App';

const { runtimeEnv } = vi.hoisted(() => ({ runtimeEnv: { isDev: true, releaseVersion: 'test' } }));
vi.mock('@/shared/config/env', () => ({ env: runtimeEnv }));

vi.mock('../router', async () => {
  const [{ createMemoryRouter }, React] = await Promise.all([
    import('react-router'),
    import('react'),
  ]);
  return {
    router: createMemoryRouter([
      {
        path: '/',
        element: React.createElement('div', { 'data-testid': 'router-ready' }, 'Router ready'),
      },
    ]),
  };
});

afterEach(() => {
  runtimeEnv.isDev = true;
  configureTelemetry({
    captureException: () => undefined,
    captureEvent: () => undefined,
    setUser: () => undefined,
  });
  vi.restoreAllMocks();
});

describe('App bootstrap', () => {
  it.each(['error', 'unhandledrejection'])(
    'does not log a raw global %s outside development',
    async (kind) => {
      runtimeEnv.isDev = false;
      const report = vi.fn();
      configureTelemetry({ captureException: report, captureEvent: vi.fn(), setUser: vi.fn() });
      const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      render(<App />);
      await screen.findByTestId('router-ready');
      const event =
        kind === 'error'
          ? new ErrorEvent('error', { error: new Error('password=private-token') })
          : new Event('unhandledrejection');
      if (kind === 'unhandledrejection')
        Object.defineProperty(event, 'reason', { value: { password: 'private-token' } });
      window.dispatchEvent(event);
      expect(report).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Client operation failed' }),
        expect.anything(),
      );
      expect(
        log.mock.calls.filter(([first]) => typeof first === 'string' && first.startsWith('[App]')),
      ).toHaveLength(0);
    },
  );

  it('installs and removes global error reporters around the router lifetime', async () => {
    const captureException = vi.fn();
    configureTelemetry({ captureException, captureEvent: vi.fn(), setUser: vi.fn() });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const view = render(<App />);
    expect(await screen.findByTestId('router-ready')).toBeVisible();

    const runtimeError = new Error('window error');
    window.dispatchEvent(new ErrorEvent('error', { message: 'window error', error: runtimeError }));
    const rejection = new Event('unhandledrejection') as PromiseRejectionEvent;
    Object.defineProperty(rejection, 'reason', { value: 'unhandled rejection' });
    window.dispatchEvent(rejection);
    window.dispatchEvent(new ErrorEvent('error', { message: 'missing error object' }));

    expect(captureException).toHaveBeenCalledTimes(3);
    expect(captureException).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: 'Client operation failed' }),
      expect.objectContaining({ area: 'app', operation: 'unhandled-error' }),
    );
    expect(captureException).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: 'Client operation failed' }),
      expect.objectContaining({ area: 'app', operation: 'unhandled-rejection' }),
    );
    expect(captureException).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ message: 'Client operation failed' }),
      expect.objectContaining({ area: 'app', operation: 'unhandled-error' }),
    );

    view.unmount();
    window.dispatchEvent(new ErrorEvent('error', { message: 'after unmount' }));
    expect(captureException).toHaveBeenCalledTimes(3);
  });
});
