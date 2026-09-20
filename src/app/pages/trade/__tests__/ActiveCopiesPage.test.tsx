/**
 * ══════════════════════════════════════════════════════════════
 *  ActiveCopiesPage.test.tsx — Active Copies Monitoring Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (12 tests):
 * 1. ✅ Renders active copies list
 * 2. ✅ Real-time P/L updates
 * 3. ✅ Trade feed shows recent trades
 * 4. ✅ Circuit breaker visible
 * 5. ✅ Emergency stop button prominent
 * 6. ✅ Pause copy action works
 * 7. ✅ Reduce allocation works
 * 8. ✅ Stop & close positions works
 * 9. ✅ Modify settings navigates
 * 10. ✅ Alert panel shows notifications
 * 11. ✅ Empty state when no copies
 * 12. ✅ Filters work (active/paused)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { ActiveCopiesPage } from '../ActiveCopiesPage';
import { createMockCopyRelationship } from '../../../test/mocks/copy-trading-mocks';

describe('ActiveCopiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render active copies list', () => {
    renderWithRouter(<ActiveCopiesPage />);

    // Page header
    expect(screen.getByText(/active copies/i)).toBeInTheDocument();

    // Should show at least one active copy
    expect(screen.getByText(/CryptoKing/i)).toBeInTheDocument();

    // Should show copy status
    expect(screen.getByText(/active/i)).toBeInTheDocument();

    // Should show allocation
    expect(screen.getByText(/\$1,500/)).toBeInTheDocument();
  });

  it('should display real-time P/L updates', () => {
    renderWithRouter(<ActiveCopiesPage />);

    // Should show P/L for each copy
    expect(screen.getByText(/\+\$125\.50/)).toBeInTheDocument();
    expect(screen.getByText(/\+8\.37%/)).toBeInTheDocument();

    // P/L should be color-coded (green for profit)
    const pnlElement = screen.getByText(/\+\$125\.50/);
    expect(pnlElement).toHaveStyle({ color: expect.stringContaining('green') });

    // Should show today's P/L separately
    expect(screen.getByText(/today/i)).toBeInTheDocument();
    expect(screen.getByText(/\+\$12\.50/)).toBeInTheDocument();
  });

  it('should show recent trades in live feed', () => {
    renderWithRouter(<ActiveCopiesPage />);

    // Trade feed section
    expect(screen.getByText(/recent trades/i)).toBeInTheDocument();

    // Should show trade details
    expect(screen.getByText(/BTCUSDT/)).toBeInTheDocument();
    expect(screen.getByText(/BUY/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.05 BTC/)).toBeInTheDocument();

    // Should show time
    expect(screen.getByText(/2 min ago/i)).toBeInTheDocument();

    // Should show slippage
    expect(screen.getByText(/slippage.*0\.036%/i)).toBeInTheDocument();
  });

  it('should display circuit breaker status', () => {
    renderWithRouter(<ActiveCopiesPage />);

    // Circuit breaker section
    expect(screen.getByText(/circuit breakers/i)).toBeInTheDocument();

    // Daily loss limit
    expect(screen.getByText(/daily loss.*5%/i)).toBeInTheDocument();
    expect(screen.getByText(/used.*2\.3%/i)).toBeInTheDocument();

    // Total loss limit
    expect(screen.getByText(/total loss.*20%/i)).toBeInTheDocument();

    // Visual indicator (progress bar)
    const dailyProgress = screen.getByRole('progressbar', { name: /daily loss/i });
    expect(dailyProgress).toBeInTheDocument();
    expect(dailyProgress).toHaveAttribute('aria-valuenow', '46'); // 2.3/5 = 46%
  });

  it('should have prominent emergency stop button', () => {
    renderWithRouter(<ActiveCopiesPage />);

    // Emergency stop should be highly visible
    const emergencyBtn = screen.getByRole('button', { name: /emergency stop/i });
    expect(emergencyBtn).toBeInTheDocument();

    // Should have destructive styling
    expect(emergencyBtn).toHaveClass(expect.stringContaining('danger'));

    // Should show warning icon
    const warningIcon = within(emergencyBtn).getByTestId('alert-triangle-icon');
    expect(warningIcon).toBeInTheDocument();
  });

  it('should pause copy when pause button clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    // Find pause button for active copy
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    await user.click(pauseBtn);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/pause copy/i)).toBeInTheDocument();
      expect(screen.getByText(/no new trades.*current positions remain/i)).toBeInTheDocument();
    });

    // Confirm pause
    const confirmBtn = screen.getByRole('button', { name: /confirm pause/i });
    await user.click(confirmBtn);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/copy paused/i)).toBeInTheDocument();
    });

    // Status should update to "Paused"
    expect(screen.getByText(/paused/i)).toBeInTheDocument();
  });

  it('should reduce allocation when reduce button clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    // Find reduce allocation button
    const reduceBtn = screen.getByRole('button', { name: /reduce/i });
    await user.click(reduceBtn);

    // Should show reduce allocation modal
    await waitFor(() => {
      expect(screen.getByText(/reduce allocation/i)).toBeInTheDocument();
      expect(screen.getByText(/current.*\$1,500/i)).toBeInTheDocument();
    });

    // Enter new allocation
    const newAllocationInput = screen.getByLabelText(/new allocation/i);
    await user.clear(newAllocationInput);
    await user.type(newAllocationInput, '1000');

    // Should show impact
    await waitFor(() => {
      expect(screen.getByText(/33% reduction/i)).toBeInTheDocument();
    });

    // Confirm
    const confirmBtn = screen.getByRole('button', { name: /confirm reduce/i });
    await user.click(confirmBtn);

    // Should update allocation
    await waitFor(() => {
      expect(screen.getByText(/\$1,000/)).toBeInTheDocument();
    });
  });

  it('should stop and close positions when stop clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    // Find stop button
    const stopBtn = screen.getByRole('button', { name: /stop/i });
    await user.click(stopBtn);

    // Should show DANGEROUS confirmation
    await waitFor(() => {
      expect(screen.getByText(/stop copy.*close all positions/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    // Should require typing "CONFIRM"
    const confirmInput = screen.getByPlaceholderText(/type.*confirm/i);
    await user.type(confirmInput, 'CONFIRM');

    // Confirm button should enable
    const confirmBtn = screen.getByRole('button', { name: /stop.*close/i });
    expect(confirmBtn).not.toBeDisabled();

    await user.click(confirmBtn);

    // Should show success
    await waitFor(() => {
      expect(screen.getByText(/copy stopped/i)).toBeInTheDocument();
      expect(screen.getByText(/positions closed/i)).toBeInTheDocument();
    });
  });

  it('should navigate to settings when modify clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    // Find modify settings button
    const modifyBtn = screen.getByRole('button', { name: /modify/i });
    await user.click(modifyBtn);

    // Should navigate to copy settings
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/copy-trading/settings')
      );
    });
  });

  it('should display alert panel with notifications', () => {
    renderWithRouter(<ActiveCopiesPage />);

    // Alert panel
    expect(screen.getByText(/alerts/i)).toBeInTheDocument();

    // Should show active alerts
    expect(screen.getByText(/high slippage detected/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.8%.*ETHUSDT/i)).toBeInTheDocument();

    // Should show alert severity
    const alertItem = screen.getByText(/high slippage/i).closest('div');
    expect(alertItem).toHaveClass(expect.stringContaining('warning'));

    // Should have dismiss button
    const dismissBtn = within(alertItem!).getByRole('button', { name: /dismiss/i });
    expect(dismissBtn).toBeInTheDocument();
  });

  it('should show empty state when no active copies', () => {
    // Mock empty state
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    renderWithRouter(<ActiveCopiesPage />);

    // Empty state message
    expect(screen.getByText(/no active copies/i)).toBeInTheDocument();
    expect(screen.getByText(/browse providers/i)).toBeInTheDocument();

    // CTA to browse providers
    const browseBtn = screen.getByRole('button', { name: /browse providers/i });
    expect(browseBtn).toBeInTheDocument();
  });

  it('should filter copies by status', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    // Should show all copies by default
    expect(screen.getByText(/CryptoKing/i)).toBeInTheDocument();
    expect(screen.getByText(/SwingMaster/i)).toBeInTheDocument();

    // Click "Paused" filter
    const pausedFilter = screen.getByRole('button', { name: /paused/i });
    await user.click(pausedFilter);

    // Should only show paused copies
    await waitFor(() => {
      expect(screen.getByText(/SwingMaster/i)).toBeInTheDocument();
      expect(screen.queryByText(/CryptoKing/i)).not.toBeInTheDocument();
    });

    // Click "Active" filter
    const activeFilter = screen.getByRole('button', { name: /^active$/i });
    await user.click(activeFilter);

    // Should only show active copies
    await waitFor(() => {
      expect(screen.getByText(/CryptoKing/i)).toBeInTheDocument();
      expect(screen.queryByText(/SwingMaster/i)).not.toBeInTheDocument();
    });
  });
});
