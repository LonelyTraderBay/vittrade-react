import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { DiscoverMoreSection } from './DiscoverMoreSection';

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

describe('DiscoverMoreSection', () => {
  it('renders the linked modules and preserves the active shell prefix', () => {
    render(
      <MemoryRouter initialEntries={['/w/markets']}>
        <DiscoverMoreSection />
        <CurrentPath />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Prediction Markets/ }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/markets/predictions');

    fireEvent.click(screen.getByRole('button', { name: /Open Arena/ }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/arena');
  });
});
