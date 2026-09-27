import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { configureTelemetry } from '../../shared/telemetry/telemetry';
import App from '../App';

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
  configureTelemetry({
    captureException: () => undefined,
    captureEvent: () => undefined,
    setUser: () => undefined,
  });
  vi.restoreAllMocks();
});

describe('App bootstrap', () => {
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
      runtimeError,
      expect.objectContaining({ area: 'app', operation: 'unhandled-error' }),
    );
    expect(captureException).toHaveBeenNthCalledWith(
      2,
      'unhandled rejection',
      expect.objectContaining({ area: 'app', operation: 'unhandled-rejection' }),
    );
    expect(captureException).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ message: 'missing error object' }),
      expect.objectContaining({ area: 'app', operation: 'unhandled-error' }),
    );

    view.unmount();
    window.dispatchEvent(new ErrorEvent('error', { message: 'after unmount' }));
    expect(captureException).toHaveBeenCalledTimes(3);
  });
});
