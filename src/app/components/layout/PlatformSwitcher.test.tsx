import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlatformSwitcher } from './PlatformSwitcher';

function RouteProbe({ children }: { children?: ReactNode }) {
  const location = useLocation();

  return (
    <>
      <output aria-label="Current path">{location.pathname}</output>
      {children}
    </>
  );
}

function renderAt(path: string, controls?: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PlatformSwitcher />
      <Routes>
        <Route path="*" element={<RouteProbe>{controls}</RouteProbe>} />
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

  it('moves the informational badge above the mock preview controls when they are present', () => {
    setViewportWidth(1440);
    render(
      <MemoryRouter initialEntries={['/w/auth/login']}>
        <PlatformSwitcher previewControlsVisible />
        <Routes>
          <Route path="*" element={<RouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Web').parentElement).toHaveStyle({
      bottom: '112px',
      zIndex: '1200',
    });
  });

  it('keeps the production shell badge position when development preview controls are absent', () => {
    setViewportWidth(1440);
    renderAt('/w/markets');

    expect(screen.getByText('Web').parentElement).toHaveStyle({
      bottom: '24px',
      zIndex: '9999',
    });
  });

  it.each(['/auth/login', '/onboarding/start'])(
    'keeps standalone route %s outside viewport switching',
    (path) => {
      vi.useFakeTimers();
      setViewportWidth(1440);
      renderAt(path);

      expect(screen.getByLabelText('Current path')).toHaveTextContent(path);
      expect(screen.queryByText('Web')).not.toBeInTheDocument();

      setViewportWidth(390);
      fireEvent(window, new Event('resize'));
      act(() => vi.advanceTimersByTime(250));

      expect(screen.getByLabelText('Current path')).toHaveTextContent(path);
    },
  );

  it.each([
    ['/w/auth/login', 'Web'],
    ['/t/auth/login', 'Tablet'],
    ['/r/auth/login', 'Phone'],
  ])('preserves prefixed auth route %s', (path, label) => {
    setViewportWidth(1440);
    renderAt(path);

    expect(screen.getByLabelText('Current path')).toHaveTextContent(path);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each([
    { width: 767, path: '/home', label: 'Phone' },
    { width: 768, path: '/t/home', label: 'Tablet' },
    { width: 1023, path: '/t/home', label: 'Tablet' },
    { width: 1024, path: '/w', label: 'Web' },
  ])('selects the shell at viewport width $width', ({ width, path, label }) => {
    vi.useFakeTimers();
    setViewportWidth(1440);
    renderAt('/w');

    setViewportWidth(width);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent(path);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('aligns the initial route with the viewport shell', async () => {
    setViewportWidth(390);
    renderAt('/w/markets');

    await waitFor(() => {
      expect(screen.getByLabelText('Current path')).toHaveTextContent('/markets');
    });
  });

  it.each(['/r', '/r/markets'])('keeps reserved route %s on its shell during resize', (path) => {
    vi.useFakeTimers();
    setViewportWidth(1440);
    renderAt(path);

    setViewportWidth(390);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent(path);
    expect(screen.getByText('Phone')).toBeInTheDocument();
  });

  it('switches route shells after resize while preserving the route', () => {
    vi.useFakeTimers();
    setViewportWidth(390);
    renderAt('/markets');

    setViewportWidth(900);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/t/markets');
  });

  it('debounces repeated resize events and uses the latest viewport', () => {
    vi.useFakeTimers();
    setViewportWidth(390);
    renderAt('/markets');

    setViewportWidth(900);
    fireEvent(window, new Event('resize'));
    expect(vi.getTimerCount()).toBe(1);

    setViewportWidth(1440);
    fireEvent(window, new Event('resize'));
    expect(vi.getTimerCount()).toBe(1);

    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/w/markets');
  });

  it('clears a pending resize when unmounted', () => {
    vi.useFakeTimers();
    setViewportWidth(390);
    const { unmount } = renderAt('/markets');

    setViewportWidth(1440);
    fireEvent(window, new Event('resize'));
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not navigate when resize keeps the current shell', () => {
    vi.useFakeTimers();
    setViewportWidth(900);
    renderAt('/t/markets');

    setViewportWidth(1000);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/t/markets');
  });

  it('defers shell switching while a form value is unsaved', () => {
    vi.useFakeTimers();
    setViewportWidth(390);
    renderAt('/markets', <input aria-label="Order amount" defaultValue="100" />);
    fireEvent.change(screen.getByLabelText('Order amount'), { target: { value: '125' } });

    setViewportWidth(1440);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/markets');
  });

  it.each([
    {
      name: 'checkbox',
      control: <input type="checkbox" aria-label="Unsaved checkbox" />,
      change: (element: HTMLElement) => fireEvent.click(element),
    },
    {
      name: 'radio',
      control: <input type="radio" aria-label="Unsaved radio" />,
      change: (element: HTMLElement) => fireEvent.click(element),
    },
    {
      name: 'textarea',
      control: <textarea aria-label="Unsaved note" defaultValue="saved" />,
      change: (element: HTMLElement) => fireEvent.change(element, { target: { value: 'edited' } }),
    },
    {
      name: 'select',
      control: (
        <select aria-label="Unsaved market" defaultValue="spot">
          <option value="spot">Spot</option>
          <option value="futures">Futures</option>
        </select>
      ),
      change: (element: HTMLElement) => fireEvent.change(element, { target: { value: 'futures' } }),
    },
  ])('defers switching while a $name control has unsaved changes', ({ control, change }) => {
    vi.useFakeTimers();
    setViewportWidth(390);
    renderAt('/markets', control);
    change(screen.getByLabelText(/Unsaved/));

    setViewportWidth(1440);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/markets');
  });

  it.each(['button', 'hidden', 'reset', 'submit'] as const)(
    'ignores %s inputs when checking for unsaved changes',
    (type) => {
      vi.useFakeTimers();
      setViewportWidth(390);
      renderAt('/markets', <input type={type} aria-label="Ignored input" defaultValue="saved" />);

      setViewportWidth(1440);
      fireEvent(window, new Event('resize'));
      act(() => vi.advanceTimersByTime(250));

      expect(screen.getByLabelText('Current path')).toHaveTextContent('/w/markets');
    },
  );

  it('allows switching when all supported form controls retain their default values', () => {
    vi.useFakeTimers();
    setViewportWidth(390);
    renderAt(
      '/markets',
      <>
        <input type="checkbox" aria-label="Clean checkbox" defaultChecked />
        <input type="radio" aria-label="Clean radio" defaultChecked />
        <textarea aria-label="Clean note" defaultValue="saved" />
        <select aria-label="Clean market" defaultValue="spot">
          <option value="spot">Spot</option>
          <option value="futures">Futures</option>
        </select>
      </>,
    );

    setViewportWidth(1440);
    fireEvent(window, new Event('resize'));
    act(() => vi.advanceTimersByTime(250));

    expect(screen.getByLabelText('Current path')).toHaveTextContent('/w/markets');
  });
});
