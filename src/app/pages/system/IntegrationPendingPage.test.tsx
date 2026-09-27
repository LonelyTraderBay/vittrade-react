import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { IntegrationPendingPage } from './IntegrationPendingPage';
import { renderWithProviders } from '@/test/test-utils';

function CurrentPath() {
  return <output data-testid="current-path">{useLocation().pathname}</output>;
}

describe('IntegrationPendingPage', () => {
  it('explains why a contract-pending route is unavailable outside development', () => {
    renderWithProviders(<IntegrationPendingPage />, {
      routerProps: { initialEntries: ['/w/trade/convert'] },
    });

    expect(
      screen.getByRole('heading', { name: 'Route này chưa sẵn sàng cho production' }),
    ).toBeInTheDocument();
    expect(screen.getByText('/w/trade/convert')).toBeInTheDocument();
    expect(screen.getByText(/Không có dữ liệu giả/)).toBeInTheDocument();
  });

  it('returns to the current platform home route', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <IntegrationPendingPage />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/w/trade/convert'] } },
    );

    await user.click(screen.getByRole('button', { name: 'Về trang chính' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w');
  });
});
