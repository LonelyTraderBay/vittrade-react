import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '@/test/test-utils';
import { CTAButton } from './CTAButton';

describe('CTAButton', () => {
  it('applies caller color overrides and supports content-width layout', () => {
    renderWithTheme(
      <CTAButton fullWidth={false} bg="#123456" textColor="#abcdef">
        Place order
      </CTAButton>,
    );

    const button = screen.getByRole('button', { name: 'Place order' });
    expect(button).toHaveStyle({ background: '#123456', color: '#abcdef' });
    expect(button).not.toHaveClass('w-full');
  });

  it('marks a loading action busy and disables repeat submission', () => {
    renderWithTheme(<CTAButton loading>Saving</CTAButton>);

    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveStyle({ boxShadow: 'none' });
  });

  it('uses the secondary surface styling without a gradient or shadow', () => {
    renderWithTheme(<CTAButton variant="secondary">Secondary action</CTAButton>);

    const button = screen.getByRole('button', { name: 'Secondary action' });
    expect(button.style.background).toBe('');
    expect(button.style.boxShadow).toBe('');
  });

  it('uses the primary theme gradient and shadow by default', () => {
    renderWithTheme(<CTAButton>Continue</CTAButton>);

    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button.style.background).not.toBe('');
    expect(button.style.boxShadow).not.toBe('');
  });

  it('keeps disabled actions inert and removes their shadow', () => {
    renderWithTheme(<CTAButton disabled>Unavailable</CTAButton>);

    const button = screen.getByRole('button', { name: 'Unavailable' });
    expect(button).toBeDisabled();
    expect(button).toHaveStyle({ boxShadow: 'none' });
  });
});
