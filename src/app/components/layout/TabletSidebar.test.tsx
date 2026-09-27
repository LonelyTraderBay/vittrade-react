import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { TabletSidebar } from './TabletSidebar';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('TabletSidebar', () => {
  it('expands accessibly and routes tablet navigation within its shell', () => {
    renderWithProviders(
      <>
        <TabletSidebar />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/t/markets/overview'] } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mở rộng' }));
    expect(screen.getByText('Chính')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ví' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/t/wallet');

    fireEvent.click(screen.getByRole('button', { name: 'Thu gọn' }));
    expect(screen.getByRole('button', { name: 'Mở rộng' })).toBeInTheDocument();
  });
});
