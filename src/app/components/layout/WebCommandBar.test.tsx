import { act, fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { WEB_AVATAR_GRADIENT } from '@/shared/theme/webTokens';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import { WebCommandBar } from './WebCommandBar';

const server = setupServer();

function createAdapterWithUser(overrides: Partial<typeof testAuthSession.user>) {
  const session = { ...testAuthSession, user: { ...testAuthSession.user, ...overrides } };
  return { ...testAuthAdapter, initialSession: session, getSession: async () => session };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

afterEach(() => {
  document.documentElement.classList.remove('dark', 'light');
  server.resetHandlers();
  vi.useRealTimers();
});

describe('WebCommandBar', () => {
  it('exposes the command bar as a named banner landmark', () => {
    renderWithProviders(<WebCommandBar />);

    expect(screen.getByRole('banner', { name: 'Thanh công cụ chính' })).toBeInTheDocument();
  });

  it('shows labeled breadcrumbs and navigates from a parent breadcrumb', () => {
    renderWithProviders(<WebCommandBar />, {
      routerProps: { initialEntries: ['/w/markets/overview'] },
    });

    expect(screen.getByRole('button', { name: 'Thị trường' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tổng quan' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thị trường' }));

    expect(screen.getByRole('button', { name: 'Thị trường' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tổng quan' })).not.toBeInTheDocument();
  });

  it('shows a DCA breadcrumb instead of the dashboard fallback on /w/dca', () => {
    renderWithProviders(<WebCommandBar />, {
      routerProps: { initialEntries: ['/w/dca'] },
    });

    expect(screen.getByRole('button', { name: 'DCA' })).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows a News breadcrumb instead of the dashboard fallback on /w/news', () => {
    renderWithProviders(<WebCommandBar />, {
      routerProps: { initialEntries: ['/w/news'] },
    });

    expect(screen.getByRole('button', { name: 'Tin tức' })).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it.each([
    { user: { fullName: ' ', username: 'trader' }, name: 'trader' },
    {
      user: { fullName: ' ', username: '', email: 'trader@example.com' },
      name: 'trader@example.com',
    },
    { user: { fullName: ' ', username: '', email: '' }, name: 'Tài khoản' },
  ])('uses the next available account label when the full name is blank', ({ user, name }) => {
    const view = renderWithProviders(<WebCommandBar />, {
      authAdapter: createAdapterWithUser(user),
    });

    expect(screen.getByText(name)).toBeInTheDocument();
    view.unmount();
  });

  it('shows the signed-out account label when no session exists', () => {
    renderWithProviders(<WebCommandBar />, {
      authAdapter: {
        ...testAuthAdapter,
        initialSession: null,
        getSession: async () => null,
      },
    });

    expect(screen.getByText('Chưa đăng nhập')).toBeInTheDocument();
  });

  it('leaves the current breadcrumb in place when it has no parent route', () => {
    renderWithProviders(<WebCommandBar />, {
      routerProps: { initialEntries: ['/w/dca'] },
    });

    fireEvent.click(screen.getByRole('button', { name: 'DCA' }));

    expect(screen.getByRole('button', { name: 'DCA' })).toBeInTheDocument();
  });

  it('focuses search with Ctrl+K and clears it on Escape', () => {
    renderWithProviders(<WebCommandBar />);
    const input = screen.getByPlaceholderText('Tìm kiếm thị trường, tài sản, tính năng...');

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(input).toHaveFocus();
    expect(screen.queryByText('K')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'BTC' } });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(input).toHaveValue('');
    expect(input).not.toHaveFocus();
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('shows the dashboard at the root and navigates to notifications and profile', () => {
    renderWithProviders(<WebCommandBar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    const accountButton = screen.getByText(testAuthSession.user.fullName).closest('button');
    const avatar = accountButton?.querySelector('div');
    expect(avatar).toHaveStyle({ background: WEB_AVATAR_GRADIENT });
    expect(avatar?.querySelector('span')).toHaveStyle({ color: '#fff' });

    fireEvent.click(screen.getByTitle('Thông báo'));
    expect(screen.getByTitle('Thông báo')).toBeInTheDocument();

    expect(screen.getByText(testAuthSession.user.fullName)).toBeInTheDocument();
    fireEvent.click(screen.getByText(testAuthSession.user.fullName));
    expect(screen.getByRole('button', { name: 'Tài khoản' })).toBeInTheDocument();
  });

  it('does not show a fixture identity while the session is loading', () => {
    renderWithProviders(<WebCommandBar />, {
      authAdapter: {
        ...testAuthAdapter,
        initialSession: undefined,
        getSession: () => new Promise(() => {}),
      },
    });

    expect(screen.getByText('Đang kiểm tra phiên đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText('VitTrader')).not.toBeInTheDocument();
    expect(screen.queryByText('VIP 3')).not.toBeInTheDocument();
  });

  it('toggles from dark mode and advances the displayed clock every minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-10T12:00:00.000Z'));
    renderWithProviders(<WebCommandBar />);

    expect(screen.getByTitle('Chế độ tối')).toBeInTheDocument();
    const clock = screen.getByText(/^\d{2}:\d{2}$/);
    const initialTime = clock.textContent;

    fireEvent.click(screen.getByTitle('Chế độ tối'));
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByTitle('Chế độ sáng')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Chế độ sáng'));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement).toHaveClass('light');
    expect(screen.getByTitle('Chế độ tối')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));
    expect(clock.textContent).not.toBe(initialTime);
  });

  it.each([
    { count: 1, label: '1' },
    { count: 12, label: '9+' },
  ])('displays the unread badge for $count notifications', async ({ count, label }) => {
    server.use(
      http.get('*/notifications', () =>
        HttpResponse.json({
          items: Array.from({ length: count }, (_, index) => ({
            id: `notification-${index + 1}`,
            type: 'system',
            title: `Notice ${index + 1}`,
            message: 'Unread notice',
            time: '2026-10-10T12:00:00.000Z',
            isRead: false,
          })),
        }),
      ),
    );
    const session = {
      ...testAuthSession,
      user: {
        ...testAuthSession.user,
        permissions: [...testAuthSession.user.permissions, 'notifications:read'],
      },
    };
    renderWithProviders(<WebCommandBar />, {
      authAdapter: { ...testAuthAdapter, initialSession: session, getSession: async () => session },
    });

    expect(await screen.findByText(label)).toBeInTheDocument();
  });
});
