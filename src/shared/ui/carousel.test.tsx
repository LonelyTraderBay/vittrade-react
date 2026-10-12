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
  let apiAvailable = true;
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
  return {
    api,
    listeners,
    getApi: () => (apiAvailable ? api : undefined),
    setApiAvailable: (available: boolean) => {
      apiAvailable = available;
    },
  };
});

vi.mock('embla-carousel-react', () => ({
  default: () => [vi.fn(), carouselState.getApi()],
}));

beforeEach(() => {
  vi.clearAllMocks();
  carouselState.listeners.clear();
  carouselState.setApiAvailable(true);
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

  it('renders horizontal controls and ignores keys outside carousel navigation', () => {
    render(
      <Carousel opts={{ axis: 'y' }}>
        <CarouselContent>
          <CarouselItem>Horizontal slide</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );

    const carousel = screen.getByRole('region');
    const content = document.querySelector('[data-slot="carousel-content"] > div');
    const slide = screen.getByRole('group');
    const previous = screen.getByRole('button', { name: 'Previous slide' });
    const next = screen.getByRole('button', { name: 'Next slide' });

    expect(content).toHaveClass('-ml-4');
    expect(slide).toHaveClass('pl-4');
    expect(previous).toHaveClass('top-1/2', '-left-12');
    expect(next).toHaveClass('top-1/2', '-right-12');

    fireEvent.keyDown(carousel, { key: 'Enter' });
    expect(carouselState.api.scrollPrev).not.toHaveBeenCalled();
    expect(carouselState.api.scrollNext).not.toHaveBeenCalled();
  });

  it('waits for Embla API initialization before publishing or scrolling', () => {
    carouselState.setApiAvailable(false);
    const setApi = vi.fn();
    render(
      <Carousel setApi={setApi}>
        <CarouselContent>
          <CarouselItem>Pending slide</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>,
    );

    const carousel = screen.getByRole('region');
    expect(setApi).not.toHaveBeenCalled();
    expect(carouselState.api.on).not.toHaveBeenCalled();

    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(carouselState.api.scrollPrev).not.toHaveBeenCalled();
    expect(carouselState.api.scrollNext).not.toHaveBeenCalled();
  });

  it('requires carousel context for content and slide primitives', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(() => render(<CarouselContent />)).toThrow(
        'useCarousel must be used within a <Carousel />',
      );
      expect(() => render(<CarouselItem />)).toThrow(
        'useCarousel must be used within a <Carousel />',
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
