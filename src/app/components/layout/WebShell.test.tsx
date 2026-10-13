import { lazy } from 'react';
import { act, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { UIContext } from '../../contexts/ui-context';
import { WebShell } from './WebShell';

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
});
