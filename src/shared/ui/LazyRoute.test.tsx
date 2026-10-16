import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyRoute } from './lazy-route';
import { captureException } from '@/shared/telemetry/telemetry';

vi.mock('@/shared/telemetry/telemetry', () => ({
  captureException: vi.fn(),
}));

const { runtimeEnv } = vi.hoisted(() => ({ runtimeEnv: { isDev: true, releaseVersion: 'test' } }));
vi.mock('@/shared/config/env', () => ({ env: runtimeEnv }));

describe('LazyRoute', () => {
  afterEach(() => {
    runtimeEnv.isDev = true;
    vi.mocked(captureException).mockClear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not log a raw lazy render failure outside development', async () => {
    runtimeEnv.isDev = false;
    const BrokenPage = () => {
      throw new Error('password=private-token');
    };
    const Route = lazyRoute(async () => ({ default: BrokenPage }));
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<Route />);
    expect(await screen.findByText('Không tải được trang')).toBeInTheDocument();
    expect(screen.queryByText(/private-token/)).not.toBeInTheDocument();
    expect(captureException).toHaveBeenCalled();
    expect(
      log.mock.calls.filter(
        ([first]) => typeof first === 'string' && first.startsWith('[LazyRoute]'),
      ),
    ).toHaveLength(0);
  });

  it('shows loading and failure states, then retries the failed module on user request', async () => {
    vi.useFakeTimers();
    const Page = () => <div>Loaded destination</div>;
    let attempts = 0;
    const importer = vi.fn(() => {
      attempts += 1;
      if (attempts <= 4) throw new Error('temporary module failure');
      return Promise.resolve({ default: Page });
    });
    const Route = lazyRoute(importer);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<Route />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_800);
    });

    expect(screen.getByText('Không tải được trang')).toBeInTheDocument();
    expect(importer).toHaveBeenCalledTimes(4);

    const retry = screen.getByRole('button', { name: 'Thử lại' });
    expect(retry).toHaveAttribute('type', 'button');
    fireEvent.click(retry);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Loaded destination')).toBeInTheDocument();
    expect(importer).toHaveBeenCalledTimes(5);
  });

  it('reports render failures through telemetry and displays the error fallback', async () => {
    const BrokenPage = () => {
      throw new Error('render failure');
    };
    const Route = lazyRoute(async () => ({ default: BrokenPage }));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<Route />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText('Không tải được trang')).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'render failure' }),
      expect.objectContaining({ area: 'router', operation: 'lazy-route-render' }),
    );
  });
});
