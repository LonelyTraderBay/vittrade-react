import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { usePlatform } from '@/app/hooks/usePlatform';
import { renderWithProviders } from '@/test/test-utils';
import { TabletShell } from './TabletShell';
import { WebShell } from './WebShell';

function RouteContent() {
  const { platform } = usePlatform();
  return <div data-testid="route-content">{platform}</div>;
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderShell(pathname: string) {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/w" element={<WebShell />}>
          <Route path="auth/login" element={<RouteContent />} />
          <Route path="home" element={<RouteContent />} />
          <Route path="trade/orders" element={<RouteContent />} />
          <Route path="trade/:pairId" element={<RouteContent />} />
        </Route>
        <Route path="/t" element={<TabletShell />}>
          <Route path="home" element={<RouteContent />} />
        </Route>
      </Routes>
      <LocationProbe />
    </>,
    { routerProps: { initialEntries: [pathname] } },
  );
}

describe('platform shell composition', () => {
  it('keeps web authentication full-screen and gives the route web platform context', () => {
    const { container } = renderShell('/w/auth/login');

    expect(screen.getByTestId('route-content')).toHaveTextContent('web');
    expect(container.querySelector('[data-platform="web"]')).toBeInTheDocument();
    expect(screen.queryByText('TỔNG QUAN')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Tìm kiếm thị trường, tài sản, tính năng...')).toBeNull();
  });

  it('applies the centered content width to standard web pages and removes it for trade pairs', () => {
    const standard = renderShell('/w/home');
    const standardContent = screen.getByTestId('route-content');

    expect(standardContent.parentElement?.style.maxWidth).toBe('1600px');
    expect(
      screen.getByPlaceholderText('Tìm kiếm thị trường, tài sản, tính năng...'),
    ).toBeInTheDocument();
    standard.unmount();

    renderShell('/w/trade/btc-usdt');
    const tradeContent = screen.getByTestId('route-content');

    expect(tradeContent.parentElement?.style.maxWidth).toBe('');
    expect(tradeContent.parentElement?.style.minHeight).toBe('100%');
  });

  it('keeps tablet context and routes the touch-sized search action through the tablet prefix', async () => {
    const user = userEvent.setup();
    renderShell('/t/home');

    expect(screen.getByTestId('route-content')).toHaveTextContent('tablet');
    await user.click(screen.getByRole('button', { name: 'Tìm kiếm...' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/t/search');
  });
});
