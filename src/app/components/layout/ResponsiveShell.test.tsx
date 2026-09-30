import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { ResponsiveAppLayout } from './ResponsiveShell';

const originalWidth = window.innerWidth;

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
});

describe('ResponsiveAppLayout', () => {
  it('switches from the phone shell to the adaptive desktop shell on resize', () => {
    setWidth(390);
    const view = renderWithProviders(<ResponsiveAppLayout />);

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    setWidth(1024);
    fireEvent.resize(window);

    expect(screen.getByText('VitTrade Desktop')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
    view.unmount();
  });

  it('keeps the centered phone-like shell on wide desktop screens when requested', () => {
    setWidth(1280);
    const { container } = renderWithProviders(<ResponsiveAppLayout desktopMode="centered" />);

    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(container.querySelector('[style*="width: 480px"]')).toBeInTheDocument();
  });
});
