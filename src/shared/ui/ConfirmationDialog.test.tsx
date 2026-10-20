import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { ButtonGradients, ButtonTextColors } from '@/shared/theme/button';
import { ConfirmationDialog } from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
  it('renders optional supporting content with the compact description spacing', () => {
    renderWithProviders(
      <ConfirmationDialog
        open
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        icon={<span aria-hidden="true">!</span>}
        title="Confirm action"
        description="Review this change before continuing."
      >
        <p>Additional review details</p>
      </ConfirmationDialog>,
    );

    expect(screen.getByText('Additional review details')).toBeInTheDocument();
  });

  it.each([
    ['danger', ButtonGradients.danger, ButtonTextColors.danger],
    ['warning', ButtonGradients.warning, ButtonTextColors.warning],
    ['success', ButtonGradients.success, ButtonTextColors.success],
    ['info', ButtonGradients.info, ButtonTextColors.info],
  ] as const)(
    'uses the shared readable action colors for %s confirmation',
    (variant, gradient, text) => {
      renderWithProviders(
        <ConfirmationDialog
          open
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          variant={variant}
          icon={<span aria-hidden="true">!</span>}
          title="Confirm action"
          description="Review this change before continuing."
          confirmText="Confirm"
        />,
      );

      const button = screen.getByRole('button', { name: 'Confirm' });
      const firstStop = gradient.match(/#[\da-f]{6}/i)?.[0];
      const firstStopRgb = firstStop
        ?.match(/[\da-f]{2}/gi)
        ?.map((channel) => Number.parseInt(channel, 16))
        .join(', ');
      expect(button.style.background).toContain('linear-gradient');
      expect(firstStopRgb).toBeDefined();
      expect(button.style.background).toContain(`rgb(${firstStopRgb})`);
      expect(text).toBe('#111111');
      expect(button.style.color).toBe('rgb(17, 17, 17)');
    },
  );
});
