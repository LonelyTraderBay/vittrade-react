import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '@/test/test-utils';
import { ButtonGradients, ButtonTextColors } from '@/shared/theme/button';
import { Plus } from 'lucide-react';
import { CTAButton } from './CTAButton';

function luminance(hex: string) {
  const [red, green, blue] = hex.match(/[0-9a-f]{2}/gi)!.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

function interpolateHex(start: string, end: string, progress: number) {
  const startChannels = start.match(/[0-9a-f]{2}/gi)!.map((channel) => parseInt(channel, 16));
  const endChannels = end.match(/[0-9a-f]{2}/gi)!.map((channel) => parseInt(channel, 16));
  return `#${startChannels
    .map((channel, index) => Math.round(channel + (endChannels[index] - channel) * progress))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

describe('CTAButton', () => {
  it('renders label and a decorative leading icon without leaking component props to the DOM', () => {
    renderWithTheme(<CTAButton label="Create" icon={Plus} />);
    const button = screen.getByRole('button', { name: 'Create' });
    expect(button).not.toHaveAttribute('label');
    expect(button).not.toHaveAttribute('icon');
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps label content while loading and gives explicit children precedence', () => {
    const { rerender } = renderWithTheme(<CTAButton label="Saving" icon={Plus} loading />);
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeNull();
    rerender(
      <CTAButton label="Fallback" icon={Plus}>
        Visible
      </CTAButton>,
    );
    expect(screen.getByRole('button', { name: 'Visible' })).toBeEnabled();
    expect(screen.queryByText('Fallback')).not.toBeInTheDocument();
  });

  it('applies caller color overrides and supports content-width layout', () => {
    renderWithTheme(
      <CTAButton fullWidth={false} bg="#123456" textColor="#abcdef">
        Place order
      </CTAButton>,
    );

    const button = screen.getByRole('button', { name: 'Place order' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveStyle({ background: '#123456', color: '#abcdef' });
    expect(button).not.toHaveClass('w-full');
  });

  it('keeps a loading action readable while disabling repeat submission', () => {
    renderWithTheme(<CTAButton loading>Saving</CTAButton>);

    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.style.background).toContain('linear-gradient');
    expect(button).toHaveStyle({ color: ButtonTextColors.primary });
    expect(button.style.boxShadow).not.toBe('none');
    expect(button.querySelector('.animate-spin')).toHaveClass(
      'border-current',
      'border-t-transparent',
    );
  });

  it('uses readable text on the secondary surface without a gradient or shadow', () => {
    renderWithTheme(<CTAButton variant="secondary">Secondary action</CTAButton>);

    const button = screen.getByRole('button', { name: 'Secondary action' });
    expect(button).toHaveStyle({ background: 'var(--tr-surface-2)', color: 'var(--tr-text-1)' });
    expect(button.style.boxShadow).toBe('');
  });

  it('uses the semantic theme foreground on ghost actions', () => {
    renderWithTheme(<CTAButton variant="ghost">Ghost action</CTAButton>);

    expect(screen.getByRole('button', { name: 'Ghost action' })).toHaveStyle({
      background: 'transparent',
      color: 'var(--tr-text-1)',
    });
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

  it('keeps every gradient CTA above 4.5:1 across interpolated color stops', () => {
    for (const variant of ['primary', 'success', 'danger', 'warning', 'info'] as const) {
      const stops = ButtonGradients[variant].match(/#[0-9a-f]{6}/gi)!;
      expect(stops.length, `${variant} gradient stops`).toBeGreaterThanOrEqual(2);

      for (let segment = 0; segment < stops.length - 1; segment += 1) {
        for (let sample = 0; sample <= 100; sample += 1) {
          const background = interpolateHex(stops[segment], stops[segment + 1], sample / 100);
          expect(
            contrastRatio(ButtonTextColors[variant], background),
            `${variant} foreground against ${background}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});
