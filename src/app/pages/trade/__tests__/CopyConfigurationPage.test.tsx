/**
 * ══════════════════════════════════════════════════════════════
 *  CopyConfigurationPage.test.tsx — Configuration Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (14 tests):
 * 1. ✅ 3 copy modes selectable
 * 2. ✅ Position sizing calculator works
 * 3. ✅ Risk overrides customizable
 * 4. ✅ Portfolio allocation check works
 * 5. ✅ Fee impact preview accurate
 * 6. ✅ Max allocation warning shows
 * 7. ✅ Validation enforces limits
 * 8. ✅ Can save configuration
 * 9. ✅ Back/forward navigation works
 * 10. ✅ Default values loaded
 * 11. ✅ Slippage protection configurable
 * 12. ✅ Circuit breaker settings work
 * 13. ✅ Preview updates in real-time
 * 14. ✅ Form persistence works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { CopyConfigurationPage } from '../CopyConfigurationPage';

describe('CopyConfigurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow selection of 3 copy modes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Check all 3 modes are available
    expect(screen.getByText(/mirror mode/i)).toBeInTheDocument();
    expect(screen.getByText(/market mode/i)).toBeInTheDocument();
    expect(screen.getByText(/smart mode/i)).toBeInTheDocument();

    // Select Smart Mode
    const smartModeBtn = screen.getByRole('button', { name: /smart mode/i });
    await user.click(smartModeBtn);

    // Should show selected state
    await waitFor(() => {
      expect(smartModeBtn).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('should have working position sizing calculator', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Find position sizing slider
    const sizeSlider = screen.getByLabelText(/position sizing/i);
    expect(sizeSlider).toBeInTheDocument();

    // Default should be 50%
    expect(sizeSlider).toHaveValue('50');

    // Adjust to 75%
    await user.clear(sizeSlider);
    await user.type(sizeSlider, '75');

    // Should update preview
    await waitFor(() => {
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
  });

  it('should allow risk override customization', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Find risk override section
    expect(screen.getByText(/risk overrides/i)).toBeInTheDocument();

    // Max open positions
    const maxPositionsInput = screen.getByLabelText(/max open positions/i);
    await user.clear(maxPositionsInput);
    await user.type(maxPositionsInput, '10');

    // Max position size
    const maxSizeInput = screen.getByLabelText(/max position size/i);
    await user.clear(maxSizeInput);
    await user.type(maxSizeInput, '5000');

    // Values should update
    expect(maxPositionsInput).toHaveValue('10');
    expect(maxSizeInput).toHaveValue('5000');
  });

  it('should perform portfolio allocation check', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Find allocation input
    const allocationInput = screen.getByLabelText(/allocation amount/i);
    await user.clear(allocationInput);
    await user.type(allocationInput, '10000');

    // Should show allocation check
    await waitFor(() => {
      expect(screen.getByText(/20% of portfolio/i)).toBeInTheDocument();
    });

    // Should show diversification recommendation
    expect(screen.getByText(/recommended max.*25%/i)).toBeInTheDocument();
  });

  it('should show accurate fee impact preview', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Enter allocation
    const allocationInput = screen.getByLabelText(/allocation amount/i);
    await user.clear(allocationInput);
    await user.type(allocationInput, '5000');

    // Fee preview should calculate
    await waitFor(() => {
      // Performance fee (10% of profits)
      expect(screen.getByText(/performance fee.*10%/i)).toBeInTheDocument();

      // Platform fee (0.1% monthly)
      expect(screen.getByText(/platform fee.*0\.1%/i)).toBeInTheDocument();

      // Estimated monthly cost
      expect(screen.getByText(/\$5\.00.*month/i)).toBeInTheDocument();
    });
  });

  it('should show warning when allocation exceeds max', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Enter very high allocation (>50% of portfolio)
    const allocationInput = screen.getByLabelText(/allocation amount/i);
    await user.clear(allocationInput);
    await user.type(allocationInput, '30000');

    // Should show warning
    await waitFor(() => {
      expect(screen.getByText(/exceeds recommended maximum/i)).toBeInTheDocument();
      expect(screen.getByText(/high concentration risk/i)).toBeInTheDocument();
    });
  });

  it('should enforce validation limits', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Try to enter invalid position sizing (>100%)
    const sizeSlider = screen.getByLabelText(/position sizing/i);
    await user.clear(sizeSlider);
    await user.type(sizeSlider, '150');

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/must be between 1% and 100%/i)).toBeInTheDocument();
    });

    // Try to enter negative allocation
    const allocationInput = screen.getByLabelText(/allocation amount/i);
    await user.clear(allocationInput);
    await user.type(allocationInput, '-500');

    await waitFor(() => {
      expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
    });
  });

  it('should allow saving configuration', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Fill in valid configuration
    await user.click(screen.getByRole('button', { name: /smart mode/i }));

    const allocationInput = screen.getByLabelText(/allocation amount/i);
    await user.clear(allocationInput);
    await user.type(allocationInput, '2000');

    // Click Continue button
    const continueBtn = screen.getByRole('button', { name: /continue to review/i });
    await user.click(continueBtn);

    // Should navigate to confirmation
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/trade/copy-provider/provider-123/confirmation')
      );
    });
  });

  it('should support back and forward navigation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Back button should go to assessment
    const backBtn = screen.getByRole('button', { name: /back/i });
    await user.click(backBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it('should load default values on mount', () => {
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Default copy mode (Smart Mode recommended)
    expect(screen.getByText(/smart mode.*recommended/i)).toBeInTheDocument();

    // Default position sizing (50%)
    const sizeSlider = screen.getByLabelText(/position sizing/i);
    expect(sizeSlider).toHaveValue('50');

    // Default max open positions (20)
    const maxPositionsInput = screen.getByLabelText(/max open positions/i);
    expect(maxPositionsInput).toHaveValue('20');
  });

  it('should allow configurable slippage protection', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Find slippage protection section
    expect(screen.getByText(/slippage protection/i)).toBeInTheDocument();

    // Max slippage tolerance
    const slippageInput = screen.getByLabelText(/max slippage/i);
    expect(slippageInput).toBeInTheDocument();

    // Default should be 0.5%
    expect(slippageInput).toHaveValue('0.5');

    // Adjust to 1%
    await user.clear(slippageInput);
    await user.type(slippageInput, '1.0');

    // Should show impact
    await waitFor(() => {
      expect(screen.getByText(/higher slippage may reduce returns/i)).toBeInTheDocument();
    });
  });

  it('should have working circuit breaker settings', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Find circuit breaker section
    expect(screen.getByText(/circuit breakers/i)).toBeInTheDocument();

    // Daily loss limit
    const dailyLossInput = screen.getByLabelText(/daily loss limit/i);
    await user.clear(dailyLossInput);
    await user.type(dailyLossInput, '5');

    // Total loss limit
    const totalLossInput = screen.getByLabelText(/total loss limit/i);
    await user.clear(totalLossInput);
    await user.type(totalLossInput, '20');

    // Should show explanation
    expect(screen.getByText(/auto-pause when limit reached/i)).toBeInTheDocument();
  });

  it('should update preview in real-time', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Find preview section
    const previewSection = screen.getByText(/configuration preview/i).closest('div');
    expect(previewSection).toBeInTheDocument();

    // Change allocation
    const allocationInput = screen.getByLabelText(/allocation amount/i);
    await user.clear(allocationInput);
    await user.type(allocationInput, '3000');

    // Preview should update immediately
    await waitFor(() => {
      const updatedPreview = within(previewSection!).getByText(/\$3,000/);
      expect(updatedPreview).toBeInTheDocument();
    });

    // Change position sizing
    const sizeSlider = screen.getByLabelText(/position sizing/i);
    await user.clear(sizeSlider);
    await user.type(sizeSlider, '75');

    // Preview should reflect new sizing
    await waitFor(() => {
      const updatedSizing = within(previewSection!).getByText(/75%/);
      expect(updatedSizing).toBeInTheDocument();
    });
  });

  it('should persist form values on navigation', async () => {
    const user = userEvent.setup();
    const sessionStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithRouter(<CopyConfigurationPage />, {
      initialRoute: '/trade/copy-provider/provider-123/configure',
    });

    // Fill in form
    const allocationInput = screen.getByLabelText(/allocation amount/i);
    await user.clear(allocationInput);
    await user.type(allocationInput, '2500');

    // Should save to sessionStorage
    await waitFor(() => {
      expect(sessionStorageSpy).toHaveBeenCalledWith(
        expect.stringContaining('copyConfig'),
        expect.stringContaining('2500')
      );
    });
  });
});