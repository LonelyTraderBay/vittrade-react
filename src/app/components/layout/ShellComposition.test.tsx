import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { usePlatform } from '@/app/hooks/usePlatform';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { Header as AppHeader } from './Header';
import { TabletSidebar } from './TabletSidebar';
import { TabletTopBar } from './TabletTopBar';
import { WebCommandBar } from './WebCommandBar';
import { WebSidebar } from './WebSidebar';
import { TabletShell } from './TabletShell';
import { WebShell } from './WebShell';
import { NotificationsPageAdapter } from '@/app/pages/platform/NotificationsPageAdapter';

const notificationServer = setupServer();

beforeAll(() => notificationServer.listen({ onUnhandledRequest: 'error' }));
afterEach(() => notificationServer.resetHandlers());
afterAll(() => notificationServer.close());

function supportWriteAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions: ['support:write', 'notifications:read', 'notifications:write'],
      },
    },
  };
}

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

describe('notification count composition', () => {
  it('keeps unread counts aligned across Web and Tablet surfaces after a 204 mark-read', async () => {
    let firstNotificationRead = false;
    let listCalls = 0;
    const notifications = Array.from({ length: 6 }, (_, index) => ({
      id: `notification-${index + 1}`,
      type: 'system',
      title: `System update ${index + 1}`,
      message: `Update ${index + 1} is available.`,
      time: '2026-09-24T00:00:00.000Z',
      isRead: false,
    }));
    notificationServer.use(
      http.get('*/notifications', () => {
        listCalls += 1;
        return HttpResponse.json({
          items: notifications.map((item) =>
            item.id === 'notification-1' ? { ...item, isRead: firstNotificationRead } : item,
          ),
        });
      }),
      http.post('*/notifications/notification-1/read', () => {
        firstNotificationRead = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(
      <>
        <WebSidebar />
        <WebCommandBar />
        <TabletSidebar />
        <TabletTopBar />
        <AppHeader title="Shell notification count" right="bell" />
        <NotificationsPageAdapter />
      </>,
      { authAdapter: supportWriteAdapter() },
    );

    expect(await screen.findByText('6 chưa đọc')).toBeVisible();
    expect(screen.getAllByText('6', { exact: true })).toHaveLength(5);
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Đã đọc' })[0]);

    expect(await screen.findByText('5 chưa đọc')).toBeVisible();
    await waitFor(() => expect(screen.getAllByText('5', { exact: true })).toHaveLength(5));
    expect(listCalls).toBe(2);
  });
});
