import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { ResponsiveBottomNav } from './ResponsiveBottomNav';

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('ResponsiveBottomNav', () => {
  it('marks the active route and navigates each primary tab', () => {
    renderWithProviders(
      <>
        <ResponsiveBottomNav />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/r/home'] } },
    );

    let buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    expect(buttons[0]).toHaveAttribute('aria-current', 'page');

    fireEvent.click(buttons[1]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/markets');
    buttons = screen.getAllByRole('button');
    expect(buttons[1]).toHaveAttribute('aria-current', 'page');

    fireEvent.click(buttons[2]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/trade/btcusdt');
    expect(screen.getAllByRole('button')[2]).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getAllByRole('button')[3]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/wallet');
    expect(screen.getAllByRole('button')[3]).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getAllByRole('button')[4]);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/profile');
    expect(screen.getAllByRole('button')[4]).toHaveAttribute('aria-current', 'page');
  });
});
