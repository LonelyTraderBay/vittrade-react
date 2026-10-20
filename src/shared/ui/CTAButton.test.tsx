import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Plus } from 'lucide-react';
import { renderWithTheme } from '@/test/test-utils';
import { ButtonGradients, ButtonTextColors } from '@/shared/theme/button';
import { CTAButton } from './CTAButton';

describe('CTAButton', () => {
  it('uses its intent colors and supports content-width layout', () => {
    renderWithTheme(<CTAButton fullWidth={false}>Place order</CTAButton>);

    const button = screen.getByRole('button', { name: 'Place order' });
    expect(button.style.background).toContain('linear-gradient');
    expect(button.style.background).toContain('rgb(229, 138, 0)');
    expect(button.style.color).toBe('rgb(17, 17, 17)');
    expect(button).not.toHaveClass('w-full');
  });

  it('renders the public label and icon props as button content', () => {
    renderWithTheme(<CTAButton label="Upload" icon={Plus} />);

    const button = screen.getByRole('button', { name: 'Upload' });
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
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
    expect(button.style.background).not.toBe('');
    expect(button.style.color).not.toBe('');
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

  it.each(['primary', 'success', 'danger', 'warning', 'info'] as const)(
    'pairs the %s gradient with readable text at each declared color stop',
    (intent) => {
      const luminance = (hex: string) => {
        const channels = [1, 3, 5].map((offset) => {
          const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const contrast = (foreground: string, background: string) => {
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      };
      const stops = [...ButtonGradients[intent].matchAll(/#[\da-f]{6}/gi)].map(([color]) => color);

      expect(stops.length).toBeGreaterThan(0);
      for (const stop of stops) {
        expect(contrast(ButtonTextColors[intent], stop)).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
