import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IntegrationPendingPage } from './IntegrationPendingPage';
import { renderWithProviders } from '@/test/test-utils';

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
});
