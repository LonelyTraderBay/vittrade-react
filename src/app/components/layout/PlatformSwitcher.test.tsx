import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformSwitcher } from './PlatformSwitcher';

function RouteProbe({ showInput = false }: { showInput?: boolean }) {
  const location = useLocation();

  return (
    <>
      <output aria-label="Current path">{location.pathname}</output>
      {showInput && <input aria-label="Order amount" defaultValue="100" />}
    </>
  );
}

function renderAt(path: string, showInput = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PlatformSwitcher />
      <Routes>
        <Route path="*" element={<RouteProbe showInput={showInput} />} />
      </Routes>
    </MemoryRouter>,
  );
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('PlatformSwitcher', () => {
  it('shows the selected desktop shell for a web route', () => {
    setViewportWidth(1440);
    renderAt('/w/markets');

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/w/markets');
    expect(screen.getByText('Web')).toBeInTheDocument();
  });

  it.each(['/auth/login', '/onboarding/start'])(
    'keeps standalone route %s outside viewport switching',
    (path) => {
      setViewportWidth(1440);
      renderAt(path);

      expect(screen.getByLabelText('Current path')).toHaveTextContent(path);
      expect(screen.queryByText('Web')).not.toBeInTheDocument();
    },
  );

  it('switches route shells after resize while preserving the route', () => {
    vi.useFakeTimers();
    setViewportWidth(390);
    renderAt('/markets');

    setViewportWidth(900);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/t/markets');
  });

  it('defers shell switching while a form value is unsaved', () => {
    vi.useFakeTimers();
    setViewportWidth(390);
    renderAt('/markets', true);
    fireEvent.change(screen.getByLabelText('Order amount'), { target: { value: '125' } });

    setViewportWidth(1440);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/markets');
  });
});
