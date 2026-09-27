import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { SwipeBack } from './SwipeBack';

function renderSwipeBack(options: { disabled?: boolean; threshold?: number } = {}) {
  const view = render(
    <MemoryRouter initialEntries={['/previous', '/current']} initialIndex={1}>
      <Routes>
        <Route path="/previous" element={<p>Previous page</p>} />
        <Route
          path="/current"
          element={
            <SwipeBack {...options}>
              <p>Current page</p>
            </SwipeBack>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  return { ...view, swipeArea: view.container.firstElementChild as HTMLDivElement };
}

function swipe(
  area: HTMLDivElement,
  start: { x: number; y: number },
  end: { x: number; y: number },
) {
  fireEvent.touchStart(area, { touches: [{ clientX: start.x, clientY: start.y }] });
  fireEvent.touchMove(area, { touches: [{ clientX: end.x, clientY: end.y }] });
  fireEvent.touchEnd(area, { touches: [] });
}

describe('SwipeBack', () => {
  it('navigates back after a horizontal swipe from the left edge reaches the threshold', () => {
    const { swipeArea } = renderSwipeBack({ threshold: 80 });

    swipe(swipeArea, { x: 8, y: 40 }, { x: 88, y: 42 });

    expect(screen.getByText('Previous page')).toBeInTheDocument();
  });

  it('does not navigate when the gesture starts outside the edge area', () => {
    const { swipeArea } = renderSwipeBack();

    swipe(swipeArea, { x: 13, y: 40 }, { x: 120, y: 40 });

    expect(screen.getByText('Current page')).toBeInTheDocument();
  });

  it('does not navigate for vertical or below-threshold gestures', () => {
    const vertical = renderSwipeBack();
    swipe(vertical.swipeArea, { x: 4, y: 10 }, { x: 7, y: 40 });
    expect(screen.getByText('Current page')).toBeInTheDocument();
    vertical.unmount();

    const short = renderSwipeBack({ threshold: 80 });
    swipe(short.swipeArea, { x: 4, y: 10 }, { x: 83, y: 10 });
    expect(screen.getByText('Current page')).toBeInTheDocument();
  });

  it('does not track gestures when disabled', () => {
    const { swipeArea } = renderSwipeBack({ disabled: true });

    swipe(swipeArea, { x: 0, y: 10 }, { x: 160, y: 10 });

    expect(screen.getByText('Current page')).toBeInTheDocument();
  });
});
