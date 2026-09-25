import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { PullToRefresh } from './PullToRefresh';

afterEach(() => {
  vi.useRealTimers();
});

describe('PullToRefresh', () => {
  it('shows an externally managed refresh and blocks another gesture', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { container } = renderWithProviders(
      <PullToRefresh onRefresh={onRefresh} isRefreshing>
        <div>Content</div>
      </PullToRefresh>,
    );
    const surface = container.querySelector('.relative.flex-1')!;

    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    expect(container.querySelector('.absolute.top-0')).toBeInTheDocument();
    fireEvent.touchStart(surface, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(surface, { touches: [{ clientY: 120 }] });
    fireEvent.touchEnd(surface);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('runs refresh after the threshold and returns to idle when it resolves', async () => {
    vi.useFakeTimers();
    let finishRefresh!: () => void;
    const onRefresh = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRefresh = resolve;
        }),
    );
    const { container } = renderWithProviders(
      <PullToRefresh onRefresh={onRefresh} threshold={30}>
        <div>Content</div>
      </PullToRefresh>,
    );
    const surface = container.querySelector('.relative.flex-1')!;

    fireEvent.touchStart(surface, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(surface, { touches: [{ clientY: 100 }] });
    expect(screen.getByText('Thả để làm mới')).toBeInTheDocument();
    fireEvent.touchEnd(surface);

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    expect(container.querySelector('.absolute.top-0')).toBeInTheDocument();

    await act(async () => {
      finishRefresh();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByText('Kéo xuống để làm mới')).toBeInTheDocument();
    expect(container.querySelector('.absolute.top-0')).not.toBeInTheDocument();
  });

  it('clears an active pull if the scroll container moves away from its top', () => {
    const { container } = renderWithProviders(
      <div data-pull-scroll>
        <PullToRefresh onRefresh={vi.fn().mockResolvedValue(undefined)} threshold={30}>
          <div>Content</div>
        </PullToRefresh>
      </div>,
    );
    const scrollContainer = container.querySelector('[data-pull-scroll]') as HTMLDivElement;
    const surface = container.querySelector('.relative.flex-1')!;

    fireEvent.touchStart(surface, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(surface, { touches: [{ clientY: 100 }] });
    expect(screen.getByText('Thả để làm mới')).toBeInTheDocument();

    scrollContainer.scrollTop = 10;
    fireEvent.touchMove(surface, { touches: [{ clientY: 110 }] });
    expect(screen.getByText('Kéo xuống để làm mới')).toBeInTheDocument();
    expect(surface.firstElementChild).toHaveStyle({ height: '0px' });
  });
});
