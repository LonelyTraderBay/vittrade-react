import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
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
    expect(screen.getByRole('button', { name: 'Huỷ' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Xác nhận' })).toHaveAttribute('type', 'button');
  });
});
