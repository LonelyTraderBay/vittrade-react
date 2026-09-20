/**
 * ══════════════════════════════════════════════════════════════
 *  CopyConfirmationPage.test.tsx — Final Confirmation Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (10 tests):
 * 1. ✅ ESMA warnings prominent
 * 2. ✅ Cooling-off notice shown (first copy)
 * 3. ✅ Configuration summary correct
 * 4. ✅ Fee breakdown detailed
 * 5. ✅ 4 scenario projections shown
 * 6. ✅ 4 consent checkboxes required
 * 7. ✅ 2FA confirmation (first copy)
 * 8. ✅ Cannot submit without all consents
 * 9. ✅ Confirm CTA works
 * 10. ✅ Back button works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { CopyConfirmationPage } from '../CopyConfirmationPage';

describe('CopyConfirmationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display ESMA warnings prominently', () => {
    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // ESMA warning banner should be prominent
    const esmaWarning = screen.getByText(/esma warning/i);
    expect(esmaWarning).toBeInTheDocument();

    // "Past performance is not indicative of future results"
    expect(screen.getByText(/past performance.*not indicative/i)).toBeInTheDocument();

    // Risk of capital loss
    expect(screen.getByText(/you can lose.*capital/i)).toBeInTheDocument();

    // Leverage warning
    expect(screen.getByText(/leveraged positions.*magnify losses/i)).toBeInTheDocument();
  });

  it('should show cooling-off notice for first copy', () => {
    // Mock first-time copy user
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // 24-48h cooling-off period notice
    expect(screen.getByText(/24.*48.*hour.*cooling.*off/i)).toBeInTheDocument();
    expect(screen.getByText(/your first copy/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel within 48 hours/i)).toBeInTheDocument();
  });

  it('should display complete configuration summary', () => {
    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // Provider name
    expect(screen.getByText(/CryptoKing/i)).toBeInTheDocument();

    // Copy mode
    expect(screen.getByText(/copy mode.*smart mode/i)).toBeInTheDocument();

    // Allocation
    expect(screen.getByText(/allocation.*\$2,000/i)).toBeInTheDocument();

    // Position sizing
    expect(screen.getByText(/position sizing.*50%/i)).toBeInTheDocument();

    // Max open positions
    expect(screen.getByText(/max positions.*20/i)).toBeInTheDocument();

    // Circuit breakers
    expect(screen.getByText(/daily loss limit.*5%/i)).toBeInTheDocument();
    expect(screen.getByText(/total loss limit.*20%/i)).toBeInTheDocument();
  });

  it('should show detailed fee breakdown', () => {
    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // Fee breakdown section
    expect(screen.getByText(/fee breakdown/i)).toBeInTheDocument();

    // Performance fee
    expect(screen.getByText(/performance fee.*10%/i)).toBeInTheDocument();
    expect(screen.getByText(/charged on profits only/i)).toBeInTheDocument();

    // Platform fee
    expect(screen.getByText(/platform fee.*0\.1%/i)).toBeInTheDocument();
    expect(screen.getByText(/monthly/i)).toBeInTheDocument();

    // Example calculation
    expect(screen.getByText(/example.*\$200 profit/i)).toBeInTheDocument();
    expect(screen.getByText(/you pay.*\$20/i)).toBeInTheDocument();

    // Total cost estimate
    expect(screen.getByText(/estimated monthly cost.*\$2\.00/i)).toBeInTheDocument();
  });

  it('should display 4 scenario projections', () => {
    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // Scenario projection section
    expect(screen.getByText(/scenario analysis/i)).toBeInTheDocument();

    // Best case (+30% annual)
    expect(screen.getByText(/best case/i)).toBeInTheDocument();
    expect(screen.getByText(/\+30%/)).toBeInTheDocument();

    // Good case (+15% annual)
    expect(screen.getByText(/good case/i)).toBeInTheDocument();
    expect(screen.getByText(/\+15%/)).toBeInTheDocument();

    // Base case (+5% annual)
    expect(screen.getByText(/base case/i)).toBeInTheDocument();
    expect(screen.getByText(/\+5%/)).toBeInTheDocument();

    // Worst case (-20% annual)
    expect(screen.getByText(/worst case/i)).toBeInTheDocument();
    expect(screen.getByText(/-20%/)).toBeInTheDocument();

    // Disclaimer
    expect(screen.getByText(/scenarios are illustrative/i)).toBeInTheDocument();
  });

  it('should require all 4 consent checkboxes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // Find all 4 consent checkboxes
    const consent1 = screen.getByRole('checkbox', { name: /understand risks/i });
    const consent2 = screen.getByRole('checkbox', { name: /past performance/i });
    const consent3 = screen.getByRole('checkbox', { name: /reviewed fees/i });
    const consent4 = screen.getByRole('checkbox', { name: /terms and conditions/i });

    expect(consent1).toBeInTheDocument();
    expect(consent2).toBeInTheDocument();
    expect(consent3).toBeInTheDocument();
    expect(consent4).toBeInTheDocument();

    // All should be unchecked initially
    expect(consent1).not.toBeChecked();
    expect(consent2).not.toBeChecked();
    expect(consent3).not.toBeChecked();
    expect(consent4).not.toBeChecked();

    // Confirm button should be disabled
    const confirmBtn = screen.getByRole('button', { name: /confirm.*start/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('should require 2FA confirmation for first copy', async () => {
    const user = userEvent.setup();
    
    // Mock first-time copy user
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // Check all consent boxes
    const consent1 = screen.getByRole('checkbox', { name: /understand risks/i });
    const consent2 = screen.getByRole('checkbox', { name: /past performance/i });
    const consent3 = screen.getByRole('checkbox', { name: /reviewed fees/i });
    const consent4 = screen.getByRole('checkbox', { name: /terms and conditions/i });

    await user.click(consent1);
    await user.click(consent2);
    await user.click(consent3);
    await user.click(consent4);

    // Click confirm
    const confirmBtn = screen.getByRole('button', { name: /confirm.*start/i });
    await user.click(confirmBtn);

    // Should show 2FA modal
    await waitFor(() => {
      expect(screen.getByText(/2fa verification/i)).toBeInTheDocument();
      expect(screen.getByText(/enter your 2fa code/i)).toBeInTheDocument();
    });
  });

  it('should not allow submission without all consents', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // Check only 3 out of 4 consents
    const consent1 = screen.getByRole('checkbox', { name: /understand risks/i });
    const consent2 = screen.getByRole('checkbox', { name: /past performance/i });
    const consent3 = screen.getByRole('checkbox', { name: /reviewed fees/i });

    await user.click(consent1);
    await user.click(consent2);
    await user.click(consent3);
    // Skip consent4 (terms and conditions)

    // Confirm button should still be disabled
    const confirmBtn = screen.getByRole('button', { name: /confirm.*start/i });
    expect(confirmBtn).toBeDisabled();

    // Validation message should appear
    await waitFor(() => {
      expect(screen.getByText(/must accept all terms/i)).toBeInTheDocument();
    });
  });

  it('should confirm and start copy after all consents', async () => {
    const user = userEvent.setup();
    
    // Mock returning user (no 2FA required)
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('true');

    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // Check all 4 consents
    const consent1 = screen.getByRole('checkbox', { name: /understand risks/i });
    const consent2 = screen.getByRole('checkbox', { name: /past performance/i });
    const consent3 = screen.getByRole('checkbox', { name: /reviewed fees/i });
    const consent4 = screen.getByRole('checkbox', { name: /terms and conditions/i });

    await user.click(consent1);
    await user.click(consent2);
    await user.click(consent3);
    await user.click(consent4);

    // Confirm button should be enabled
    const confirmBtn = screen.getByRole('button', { name: /confirm.*start/i });
    expect(confirmBtn).not.toBeDisabled();

    // Click confirm
    await user.click(confirmBtn);

    // Should navigate to active copies
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/trade/copy-trading/active')
      );
    });
  });

  it('should allow navigation back to configuration', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfirmationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/confirmation',
    });

    // Find back button
    const backBtn = screen.getByRole('button', { name: /back/i });
    await user.click(backBtn);

    // Should navigate back to configuration page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});