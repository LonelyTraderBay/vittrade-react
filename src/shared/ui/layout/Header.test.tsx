import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Search } from 'lucide-react';
import { renderWithProviders } from '@/test/test-utils';
import { Header } from './Header';

afterEach(() => {
  vi.useRealTimers();
});

describe('Header', () => {
  it('renders the page title without a blank action placeholder by default', () => {
    const { container } = renderWithProviders(<Header title="P2P" subtitle="Giao dịch" />);

    expect(screen.getByText('P2P')).toBeInTheDocument();
    expect(screen.getByText('Giao dịch')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label="Quay lại"]')).not.toBeInTheDocument();
  });

  it('renders standard title badges and handles notification actions', () => {
    const onNotificationsClick = vi.fn();
    renderWithProviders(
      <Header
        variant="standard"
        title="Tổng quan"
        badge={120}
        right="bell"
        notifications={120}
        onNotificationsClick={onNotificationsClick}
      />,
    );

    expect(screen.getAllByText('99+')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Thông báo (120)' }));
    expect(onNotificationsClick).toHaveBeenCalledOnce();
  });

  it('calls the back handler once until its navigation guard expires', () => {
    vi.useFakeTimers();
    const onBack = vi.fn();
    renderWithProviders(<Header back onBack={onBack} />);
    const back = screen.getByRole('button', { name: 'Quay lại' });

    fireEvent.click(back);
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(300);
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it('lets a custom action take priority over the right-side variant', () => {
    const onAction = vi.fn();
    renderWithProviders(
      <Header
        right="bell"
        notifications={4}
        action={{ icon: Search, label: 'Tìm kiếm nâng cao', onClick: onAction }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm nâng cao' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Thông báo (4)' })).not.toBeInTheDocument();
  });

  it('supports a custom content variant and optional breadcrumb', () => {
    renderWithProviders(
      <Header variant="custom" breadcrumb>
        <button type="button">Nội dung riêng</button>
      </Header>,
      { routerProps: { initialEntries: ['/w/markets/overview'] } },
    );

    expect(screen.getByRole('button', { name: 'Nội dung riêng' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
  });

  it('renders the search button and invokes the search callback', () => {
    const onSearch = vi.fn();
    renderWithProviders(<Header variant="standard" right="search" onSearch={onSearch} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
    expect(onSearch).toHaveBeenCalledOnce();
  });
});
