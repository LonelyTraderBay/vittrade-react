import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './carousel';

const carouselState = vi.hoisted(() => {
  const listeners = new Map<string, (api: unknown) => void>();
  const api = {
    canScrollPrev: vi.fn(() => true),
    canScrollNext: vi.fn(() => true),
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    on: vi.fn((event: string, callback: (api: unknown) => void) => {
      listeners.set(event, callback);
    }),
    off: vi.fn(),
  };
  return { api, listeners };
});

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), carouselState.api],
}));

beforeEach(() => {
  vi.clearAllMocks();
  carouselState.listeners.clear();
});

describe('shared carousel primitives', () => {
  it('syncs scroll controls, supports keyboard navigation, and removes API listeners on unmount', async () => {
    const setApi = vi.fn();
    const { unmount } = render(
      <Carousel orientation="vertical" setApi={setApi}>
        <CarouselContent>
          <CarouselItem>Slide one</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );

    const carousel = screen.getByRole('region');
    const previous = screen.getByRole('button', { name: 'Previous slide' });
    const next = screen.getByRole('button', { name: 'Next slide' });
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    expect(screen.getByRole('group')).toHaveTextContent('Slide one');
    expect(previous).toBeEnabled();
    expect(next).toBeEnabled();
    await waitFor(() => expect(setApi).toHaveBeenCalledWith(carouselState.api));

    fireEvent.click(previous);
    fireEvent.click(next);
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(carouselState.api.scrollPrev).toHaveBeenCalledTimes(2);
    expect(carouselState.api.scrollNext).toHaveBeenCalledTimes(2);

    carouselState.api.canScrollPrev.mockReturnValue(false);
    carouselState.api.canScrollNext.mockReturnValue(false);
    act(() => carouselState.listeners.get('select')?.(carouselState.api));
    expect(previous).toBeDisabled();
    expect(next).toBeDisabled();

    const listener = carouselState.listeners.get('select');
    unmount();
    expect(carouselState.api.off).toHaveBeenCalledWith('reInit', expect.any(Function));
    expect(carouselState.api.off).toHaveBeenCalledWith('select', expect.any(Function));
    expect(carouselState.api.off).toHaveBeenCalledWith('select', listener);
  });
});
