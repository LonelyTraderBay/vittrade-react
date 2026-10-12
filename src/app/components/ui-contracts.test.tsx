import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MobileFrame } from './layout/MobileFrame';
import { ResponsivePageHeader } from './layout/ResponsivePageHeader';
import { ScrollToTopFAB } from './mobile/ScrollToTopFAB';
import { SessionTimedOutModal, SessionWarningBar } from './states/SessionTimeoutOverlay';
import { PlaceholderPage } from './system/PlaceholderPage';
import { TradingFeeNotice } from '@/features/trading/components/TradingFeeNotice';

function CurrentPath() {
  return <output aria-label="current path">{useLocation().pathname}</output>;
}

describe('application UI contracts', () => {
  it('renders image props and replaces a failed image with its accessible fallback', () => {
    const { unmount } = render(
      <ImageWithFallback src="/chart.png" alt="Price chart" className="chart" data-kind="asset" />,
    );

    const image = screen.getByRole('img', { name: 'Price chart' });
    expect(image).toHaveAttribute('src', '/chart.png');
    expect(image).toHaveClass('chart');
    expect(image).toHaveAttribute('data-kind', 'asset');
    fireEvent.error(image);

    const fallback = screen.getByRole('img', { name: 'Error loading image' });
    expect(fallback).toHaveAttribute('data-original-url', '/chart.png');
    expect(fallback).toHaveAttribute('data-kind', 'asset');

    unmount();
    render(<ImageWithFallback src="/unlabeled.png" />);
    const unlabeledImage = screen.getByRole('img');
    expect(unlabeledImage).toHaveAttribute('src', '/unlabeled.png');
    fireEvent.error(unlabeledImage);
    expect(
      screen.getByRole('img', { name: 'Error loading image' }).parentElement?.parentElement,
    ).toHaveClass('inline-block bg-gray-100 text-center align-middle');
  });

  it('keeps the mobile frame around its route content and renders the device details', () => {
    const { container } = render(
      <MobileFrame>
        <main>Mobile route</main>
      </MobileFrame>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('Mobile route');
    expect(container.querySelectorAll('.absolute.rounded-full')).toHaveLength(3);
    expect(container.querySelector('.pointer-events-none')).toBeInTheDocument();
  });

  it('supports hidden, history-back, explicit-route, and right-side header actions', () => {
    const renderHeader = (back: boolean | string) =>
      render(
        <MemoryRouter initialEntries={['/previous', '/current']} initialIndex={1}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <ResponsivePageHeader
                    title="Orders"
                    back={back}
                    right={<button>Filter</button>}
                  />
                  <CurrentPath />
                </>
              }
            />
          </Routes>
        </MemoryRouter>,
      );

    const historyRender = renderHeader(true);
    expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(screen.getByLabelText('current path')).toHaveTextContent('/previous');
    historyRender.unmount();

    const explicitRender = renderHeader('/settings');
    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(screen.getByLabelText('current path')).toHaveTextContent('/settings');
    explicitRender.unmount();

    render(
      <MemoryRouter>
        <ResponsivePageHeader title="No back" back={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'No back' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the scroll action only when visible and invokes it when activated', () => {
    const onClick = vi.fn();
    const { rerender } = render(<ScrollToTopFAB visible={false} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Cuộn lên đầu trang' });
    expect(button).toHaveStyle({ opacity: '0', pointerEvents: 'none' });

    rerender(<ScrollToTopFAB visible onClick={onClick} />);
    expect(button).toHaveStyle({ opacity: '1', pointerEvents: 'auto' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('extends a warning session and keeps the timed-out modal closed until opened', () => {
    const onExtend = vi.fn();
    const onReauth = vi.fn();
    const outerClick = vi.fn();
    const { rerender } = render(
      <>
        <SessionWarningBar remainingSeconds={12} onExtend={onExtend} />
        <SessionTimedOutModal open={false} onReauth={onReauth} />
      </>,
    );

    expect(screen.getByText('Phiên sẽ hết hạn trong 12s')).toBeInTheDocument();
    expect(screen.queryByText('Phiên đã hết thời gian')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gia hạn' }));
    expect(onExtend).toHaveBeenCalledOnce();

    rerender(
      <div onClick={outerClick}>
        <SessionTimedOutModal open onReauth={onReauth} />
      </div>,
    );
    expect(screen.getByText('Phiên đã hết thời gian')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xác thực lại' }));
    expect(onReauth).toHaveBeenCalledOnce();
    expect(outerClick).not.toHaveBeenCalled();
  });

  it('documents the placeholder route and server-confirmed trading fee', () => {
    render(
      <>
        <PlaceholderPage pageName="Portfolio" path="/portfolio" />
        <TradingFeeNotice />
      </>,
    );

    expect(screen.getByRole('heading', { name: 'Portfolio' })).toBeInTheDocument();
    expect(screen.getByText('/portfolio')).toBeInTheDocument();
    expect(screen.getByText('Phí giao dịch sẽ được xác nhận từ máy chủ.')).toBeInTheDocument();
  });
});
