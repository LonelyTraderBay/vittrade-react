/**
 * ══════════════════════════════════════════════════════════════
 *  CopySettingsPage.test.tsx — Settings Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (8 tests):
 * 1. ✅ Global defaults editable
 * 2. ✅ Circuit breaker config works
 * 3. ✅ Notification preferences saveable
 * 4. ✅ Auto-stop rules configurable
 * 5. ✅ Emergency contact setup works
 * 6. ✅ Save button works
 * 7. ✅ Reset to defaults works
 * 8. ✅ Validation enforced
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '../../../test/utils/test-utils';
import { CopySettingsPage } from '../CopySettingsPage';

describe('CopySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow editing global defaults', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    // Default position sizing
    const positionSizingInput = screen.getByLabelText(/default position sizing/i);
    expect(positionSizingInput).toHaveValue('50');

    await user.clear(positionSizingInput);
    await user.type(positionSizingInput, '75');

    expect(positionSizingInput).toHaveValue('75');

    // Default max positions
    const maxPositionsInput = screen.getByLabelText(/default max positions/i);
    expect(maxPositionsInput).toHaveValue('20');

    await user.clear(maxPositionsInput);
    await user.type(maxPositionsInput, '15');

    expect(maxPositionsInput).toHaveValue('15');
  });

  it('should configure circuit breaker settings', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    // Circuit breaker section
    expect(screen.getByText(/circuit breakers/i)).toBeInTheDocument();

    // Daily loss limit
    const dailyLossInput = screen.getByLabelText(/daily loss limit/i);
    await user.clear(dailyLossInput);
    await user.type(dailyLossInput, '3');

    // Total loss limit
    const totalLossInput = screen.getByLabelText(/total loss limit/i);
    await user.clear(totalLossInput);
    await user.type(totalLossInput, '15');

    // Auto-pause toggle
    const autoPauseToggle = screen.getByRole('switch', { name: /auto-pause when triggered/i });
    expect(autoPauseToggle).toBeInTheDocument();
    
    await user.click(autoPauseToggle);
    expect(autoPauseToggle).toBeChecked();

    // Should show explanation
    expect(screen.getByText(/automatically pause.*limit reached/i)).toBeInTheDocument();
  });

  it('should save notification preferences', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    // Notification preferences section
    expect(screen.getByText(/notifications/i)).toBeInTheDocument();

    // Email notifications
    const emailToggle = screen.getByRole('switch', { name: /email notifications/i });
    await user.click(emailToggle);
    expect(emailToggle).toBeChecked();

    // Push notifications
    const pushToggle = screen.getByRole('switch', { name: /push notifications/i });
    await user.click(pushToggle);
    expect(pushToggle).toBeChecked();

    // Notification types
    const tradeNotifs = screen.getByRole('checkbox', { name: /new trades/i });
    const circuitBreakerNotifs = screen.getByRole('checkbox', { name: /circuit breaker/i });
    const pnlNotifs = screen.getByRole('checkbox', { name: /p&l updates/i });

    await user.click(tradeNotifs);
    await user.click(circuitBreakerNotifs);
    await user.click(pnlNotifs);

    expect(tradeNotifs).toBeChecked();
    expect(circuitBreakerNotifs).toBeChecked();
    expect(pnlNotifs).toBeChecked();
  });

  it('should configure auto-stop rules', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    // Auto-stop section
    expect(screen.getByText(/auto-stop rules/i)).toBeInTheDocument();

    // Stop on drawdown
    const drawdownToggle = screen.getByRole('switch', { name: /stop on max drawdown/i });
    await user.click(drawdownToggle);
    expect(drawdownToggle).toBeChecked();

    // Drawdown threshold
    const drawdownInput = screen.getByLabelText(/drawdown threshold/i);
    await user.clear(drawdownInput);
    await user.type(drawdownInput, '25');

    // Stop on provider tier downgrade
    const tierToggle = screen.getByRole('switch', { name: /stop on tier downgrade/i });
    await user.click(tierToggle);
    expect(tierToggle).toBeChecked();

    // Should show explanation
    expect(screen.getByText(/automatically stop.*provider loses verification/i)).toBeInTheDocument();
  });

  it('should setup emergency contact', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    // Emergency contact section
    expect(screen.getByText(/emergency contact/i)).toBeInTheDocument();

    // Email
    const emailInput = screen.getByLabelText(/emergency email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'emergency@example.com');
    expect(emailInput).toHaveValue('emergency@example.com');

    // Phone
    const phoneInput = screen.getByLabelText(/emergency phone/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, '+1234567890');
    expect(phoneInput).toHaveValue('+1234567890');

    // Trigger conditions
    const majorLossCheckbox = screen.getByRole('checkbox', { name: /major loss/i });
    const circuitBreakerCheckbox = screen.getByRole('checkbox', { name: /circuit breaker/i });

    await user.click(majorLossCheckbox);
    await user.click(circuitBreakerCheckbox);

    expect(majorLossCheckbox).toBeChecked();
    expect(circuitBreakerCheckbox).toBeChecked();
  });

  it('should save all settings', async () => {
    const user = userEvent.setup();
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderWithRouter(<CopySettingsPage />);

    // Make some changes
    const positionSizingInput = screen.getByLabelText(/default position sizing/i);
    await user.clear(positionSizingInput);
    await user.type(positionSizingInput, '60');

    // Save button
    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    expect(saveBtn).toBeInTheDocument();

    await user.click(saveBtn);

    // Should save to localStorage
    await waitFor(() => {
      expect(localStorageSpy).toHaveBeenCalledWith(
        expect.stringContaining('copySettings'),
        expect.any(String)
      );
    });

    // Success message
    await waitFor(() => {
      expect(screen.getByText(/settings saved/i)).toBeInTheDocument();
    });
  });

  it('should reset to default values', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    // Change some values
    const positionSizingInput = screen.getByLabelText(/default position sizing/i);
    await user.clear(positionSizingInput);
    await user.type(positionSizingInput, '80');

    expect(positionSizingInput).toHaveValue('80');

    // Reset button
    const resetBtn = screen.getByRole('button', { name: /reset to defaults/i });
    await user.click(resetBtn);

    // Confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/reset all settings to default/i)).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole('button', { name: /confirm reset/i });
    await user.click(confirmBtn);

    // Should reset to 50
    await waitFor(() => {
      expect(positionSizingInput).toHaveValue('50');
    });

    // Success message
    expect(screen.getByText(/settings reset/i)).toBeInTheDocument();
  });

  it('should enforce validation on settings', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    // Invalid position sizing (>100)
    const positionSizingInput = screen.getByLabelText(/default position sizing/i);
    await user.clear(positionSizingInput);
    await user.type(positionSizingInput, '150');

    // Try to save
    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    await user.click(saveBtn);

    // Validation error
    await waitFor(() => {
      expect(screen.getByText(/position sizing must be between 1 and 100/i)).toBeInTheDocument();
    });

    // Save button should be disabled
    expect(saveBtn).toBeDisabled();

    // Fix validation error
    await user.clear(positionSizingInput);
    await user.type(positionSizingInput, '70');

    // Save button should re-enable
    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });

    // Invalid daily loss limit (negative)
    const dailyLossInput = screen.getByLabelText(/daily loss limit/i);
    await user.clear(dailyLossInput);
    await user.type(dailyLossInput, '-5');

    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/loss limit must be positive/i)).toBeInTheDocument();
    });
  });
});
