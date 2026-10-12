import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { LeftRail } from './LeftRail';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('LeftRail', () => {
  it('navigates primary, center and bottom rail controls', () => {
    renderWithProviders(
      <>
        <LeftRail />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/r/home'] } },
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
    fireEvent.click(buttons[1]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/markets');
    fireEvent.click(screen.getAllByRole('button')[2]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/trade/btcusdt');
    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/wallet');
    fireEvent.click(screen.getAllByRole('button')[4]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/profile');
    fireEvent.click(screen.getAllByRole('button')[5]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/notifications');
    fireEvent.click(screen.getAllByRole('button')[6]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/support');
    fireEvent.click(screen.getAllByRole('button')[7]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/profile/settings');
  });
});
