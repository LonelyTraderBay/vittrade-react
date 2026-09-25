import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { lazyRoute } from './lazy-route';
import { captureException } from '@/shared/telemetry/telemetry';

vi.mock('@/shared/telemetry/telemetry', () => ({
  captureException: vi.fn(),
}));

describe('LazyRoute', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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

    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
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
