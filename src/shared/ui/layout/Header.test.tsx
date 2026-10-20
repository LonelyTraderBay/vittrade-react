import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { Search } from 'lucide-react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { CountBadge, Header } from './Header';

function CurrentPath() {
  return <output data-testid="current-path">{useLocation().pathname}</output>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Header', () => {
  it('renders the page title without a blank action placeholder by default', () => {
    const { container } = renderWithProviders(<Header title="P2P" subtitle="Giao dịch" />);

    expect(screen.getByRole('heading', { level: 1, name: 'P2P' })).toBeInTheDocument();
    expect(screen.getByText('Giao dịch')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label="Quay lại"]')).not.toBeInTheDocument();
  });

  it('does not infer a breadcrumb from the back action', () => {
    renderWithProviders(<Header title="Lệnh" back />, {
      routerProps: { initialEntries: ['/w/trading/orders/history'] },
    });

    expect(screen.getByRole('button', { name: 'Quay lại' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'breadcrumb' })).not.toBeInTheDocument();
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

    expect(screen.getByRole('heading', { level: 1, name: 'Tổng quan' })).toBeInTheDocument();
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

  it('omits count badges for zero and negative counts', () => {
    const { container } = renderWithProviders(
      <>
        <CountBadge count={0} />
        <CountBadge count={-1} />
      </>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('uses a supplied page leading element and transparent bar without a breadcrumb', () => {
    const { container } = renderWithProviders(
      <Header variant="page" title="Ví" transparent left={<span>Ví spot</span>} />,
    );
    const bar = container.querySelector('.contents > div');

    expect(screen.getByText('Ví spot')).toBeInTheDocument();
    expect((bar as HTMLElement).style.background).toBe('transparent');
    expect((bar as HTMLElement).style.borderBottomStyle).toBe('none');
  });

  it('keeps the transparent page border when its breadcrumb is shown', () => {
    const { container } = renderWithProviders(
      <Header variant="page" title="Thị trường" transparent breadcrumb />,
      { routerProps: { initialEntries: ['/w/markets/overview'] } },
    );
    const bar = container.querySelector('.contents > div');

    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    expect(bar).not.toHaveStyle({ borderBottom: 'none' });
  });

  it('keeps the standard placeholder and renders its more action and breadcrumb', () => {
    const { container } = renderWithProviders(
      <Header
        variant="standard"
        title="Tài khoản"
        subtitle="Thông tin của bạn"
        badge={0}
        right="more"
        transparent
        breadcrumb
      />,
      { routerProps: { initialEntries: ['/w/account/profile'] } },
    );
    const bar = container.querySelector('.contents > div');

    expect(screen.getByRole('button', { name: 'Thêm' })).toBeInTheDocument();
    expect(screen.getByText('Thông tin của bạn')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(bar).toHaveStyle({ background: 'transparent' });
  });

  it('keeps a 36-pixel right placeholder for a standard header with no action', () => {
    const { container } = renderWithProviders(<Header variant="standard" right="none" />);
    const placeholder = Array.from(container.querySelectorAll('div')).find(
      (element) => (element as HTMLElement).style.width === '36px',
    );

    expect(placeholder).toBeInTheDocument();
  });

  it('uses the default accessible label for an action without a label', () => {
    const onAction = vi.fn();
    renderWithProviders(<Header action={{ icon: Search, onClick: onAction }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Action' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('renders a React element supplied as the standard right-side content', () => {
    renderWithProviders(
      <Header
        variant="standard"
        right={<span data-testid="custom-header-action">Tuỳ chọn</span>}
      />,
    );

    expect(screen.getByTestId('custom-header-action')).toHaveTextContent('Tuỳ chọn');
  });

  it('navigates to the current shell notification route when no callback is supplied', () => {
    renderWithProviders(
      <>
        <Header variant="standard" right="bell" notifications={4} />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/w/markets/overview'] } },
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thông báo (4)' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/notifications');
  });

  it('uses router history for the standard back button when no callback is supplied', () => {
    renderWithProviders(
      <>
        <Header variant="standard" back />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/w/markets', '/w/markets/overview'], initialIndex: 1 } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/markets');
  });
});
