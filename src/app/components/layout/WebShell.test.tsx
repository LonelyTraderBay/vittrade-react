import { lazy } from 'react';
import { act, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { WebShell } from './WebShell';

const initialWidth = window.innerWidth;

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: initialWidth });
});

describe('WebShell loading and connectivity', () => {
  it('keeps shell navigation and offline feedback visible while a child route loads', async () => {
    let finish!: (module: { default: () => React.JSX.Element }) => void;
    const Page = lazy(
      () =>
        new Promise<{ default: () => React.JSX.Element }>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithProviders(
      <UIContext.Provider
        value={{
          isBalanceHidden: false,
          isOffline: true,
          pendingRewards: 0,
          notifications: 0,
          toggleBalanceHidden: () => {},
          setIsOffline: () => {},
          setPendingRewards: () => {},
        }}
      >
        <Routes>
          <Route path="/w" element={<WebShell />}>
            <Route path="home" element={<Page />} />
          </Route>
        </Routes>
      </UIContext.Provider>,
      { routerProps: { initialEntries: ['/w/home'] } },
    );
    expect(screen.getByText('Đang tải...')).toBeInTheDocument();
    expect(
      screen.getByText('Mất kết nối mạng — Đang hiển thị dữ liệu lưu trữ'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ví' })).toBeInTheDocument();
    await act(async () => finish({ default: () => <p>Loaded page</p> }));
    expect(await screen.findByText('Loaded page')).toBeInTheDocument();
    expect(screen.queryByText('Đang tải...')).not.toBeInTheDocument();
    expect(
      screen.getByText('Mất kết nối mạng — Đang hiển thị dữ liệu lưu trữ'),
    ).toBeInTheDocument();
  });

  it('uses a phone navigation layout when a Web-only route remains open at a narrow width', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });

    renderWithProviders(
      <Routes>
        <Route path="/w" element={<WebShell />}>
          <Route path="address-book" element={<p>Address book</p>} />
        </Route>
      </Routes>,
      { routerProps: { initialEntries: ['/w/address-book'] } },
    );

    expect(screen.getByText('Address book')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.queryByText('TÀI SẢN')).not.toBeInTheDocument();
  });

  it('reserves space below full-bleed Web content for narrow-screen navigation', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });

    renderWithProviders(
      <Routes>
        <Route path="/w" element={<WebShell />}>
          <Route path="trade/analytics" element={<p>Full-bleed analytics</p>} />
        </Route>
      </Routes>,
      { routerProps: { initialEntries: ['/w/trade/analytics'] } },
    );

    expect(screen.getByText('Full-bleed analytics').parentElement).toHaveClass('pb-24');
  });
});
