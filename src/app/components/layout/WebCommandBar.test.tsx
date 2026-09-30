import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import { WebCommandBar } from './WebCommandBar';

afterEach(() => {
  document.documentElement.classList.remove('dark', 'light');
});

describe('WebCommandBar', () => {
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

    fireEvent.click(screen.getByTitle('Thông báo'));
    expect(screen.getByRole('button', { name: 'Thông báo' })).toBeInTheDocument();

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
});
