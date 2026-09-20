/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderComparisonPage.test.tsx — Comparison Tool Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (6 tests):
 * 1. ✅ Compare up to 5 providers
 * 2. ✅ Metrics table renders
 * 3. ✅ Fee impact comparison accurate
 * 4. ✅ Execution quality comparison shown
 * 5. ✅ Add/remove providers works
 * 6. ✅ Best value highlighting works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '../../../test/utils/test-utils';
import { ProviderComparisonPage } from '../ProviderComparisonPage';

describe('ProviderComparisonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow comparing up to 5 providers', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderComparisonPage />);

    // Initially should have 2 providers selected (minimum)
    expect(screen.getByText(/comparing 2 providers/i)).toBeInTheDocument();

    // Add provider button
    const addProviderBtn = screen.getByRole('button', { name: /add provider/i });
    expect(addProviderBtn).toBeInTheDocument();

    // Add 3 more providers (total 5)
    await user.click(addProviderBtn);
    await user.click(addProviderBtn);
    await user.click(addProviderBtn);

    // Should now show 5 providers
    await waitFor(() => {
      expect(screen.getByText(/comparing 5 providers/i)).toBeInTheDocument();
    });

    // Add button should be disabled at max (5)
    expect(addProviderBtn).toBeDisabled();

    // Warning about max
    expect(screen.getByText(/maximum 5 providers/i)).toBeInTheDocument();
  });

  it('should render comprehensive metrics comparison table', () => {
    renderWithRouter(<ProviderComparisonPage />);

    // Table headers (providers)
    expect(screen.getByText(/CryptoKing/i)).toBeInTheDocument();
    expect(screen.getByText(/SwingMaster/i)).toBeInTheDocument();

    // Metric rows
    expect(screen.getByText(/30-day roi/i)).toBeInTheDocument();
    expect(screen.getByText(/sharpe ratio/i)).toBeInTheDocument();
    expect(screen.getByText(/max drawdown/i)).toBeInTheDocument();
    expect(screen.getByText(/win rate/i)).toBeInTheDocument();
    expect(screen.getByText(/total trades/i)).toBeInTheDocument();
    expect(screen.getByText(/copiers/i)).toBeInTheDocument();
    expect(screen.getByText(/aum/i)).toBeInTheDocument();
    expect(screen.getByText(/performance fee/i)).toBeInTheDocument();
    expect(screen.getByText(/platform fee/i)).toBeInTheDocument();
    expect(screen.getByText(/verification tier/i)).toBeInTheDocument();

    // Should show actual values
    expect(screen.getByText(/25\.5%/)).toBeInTheDocument(); // ROI
    expect(screen.getByText(/2\.4/)).toBeInTheDocument(); // Sharpe
  });

  it('should show accurate fee impact comparison', () => {
    renderWithRouter(<ProviderComparisonPage />);

    // Fee impact section
    expect(screen.getByText(/fee impact comparison/i)).toBeInTheDocument();

    // Example allocation
    expect(screen.getByText(/based on.*\$2,000 allocation/i)).toBeInTheDocument();

    // Fee breakdown for each provider
    const provider1Fees = screen.getByText(/CryptoKing/i).closest('tr');
    expect(within(provider1Fees!).getByText(/\$20\.00.*month/i)).toBeInTheDocument();

    const provider2Fees = screen.getByText(/SwingMaster/i).closest('tr');
    expect(within(provider2Fees!).getByText(/\$18\.00.*month/i)).toBeInTheDocument();

    // Total cost estimate
    expect(screen.getByText(/total monthly cost/i)).toBeInTheDocument();

    // Best value indicator
    expect(screen.getByText(/best value/i)).toBeInTheDocument();
  });

  it('should display execution quality comparison', () => {
    renderWithRouter(<ProviderComparisonPage />);

    // Execution quality section
    expect(screen.getByText(/execution quality/i)).toBeInTheDocument();

    // Average slippage
    expect(screen.getByText(/avg slippage/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.08%/)).toBeInTheDocument(); // Provider 1
    expect(screen.getByText(/0\.12%/)).toBeInTheDocument(); // Provider 2

    // Fill rate
    expect(screen.getByText(/fill rate/i)).toBeInTheDocument();
    expect(screen.getByText(/98\.5%/)).toBeInTheDocument();

    // Average execution time
    expect(screen.getByText(/avg execution time/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.2s/)).toBeInTheDocument();

    // Best execution marker
    const bestExecution = screen.getAllByText(/best/i);
    expect(bestExecution.length).toBeGreaterThanOrEqual(1);
  });

  it('should allow adding and removing providers', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderComparisonPage />);

    // Initially 2 providers
    expect(screen.getByText(/comparing 2 providers/i)).toBeInTheDocument();

    // Add a provider
    const addProviderBtn = screen.getByRole('button', { name: /add provider/i });
    await user.click(addProviderBtn);

    // Provider selector modal
    await waitFor(() => {
      expect(screen.getByText(/select provider/i)).toBeInTheDocument();
    });

    // Select "AlgoTrader"
    const algoTrader = screen.getByText(/AlgoTrader/i);
    await user.click(algoTrader);

    // Confirm selection
    const confirmBtn = screen.getByRole('button', { name: /add to comparison/i });
    await user.click(confirmBtn);

    // Should now have 3 providers
    await waitFor(() => {
      expect(screen.getByText(/comparing 3 providers/i)).toBeInTheDocument();
      expect(screen.getByText(/AlgoTrader/i)).toBeInTheDocument();
    });

    // Remove a provider
    const removeBtn = screen.getAllByRole('button', { name: /remove/i })[0];
    await user.click(removeBtn);

    // Confirm removal
    await waitFor(() => {
      expect(screen.getByText(/comparing 2 providers/i)).toBeInTheDocument();
    });
  });

  it('should highlight best value provider', () => {
    renderWithRouter(<ProviderComparisonPage />);

    // Best value analysis
    expect(screen.getByText(/best value analysis/i)).toBeInTheDocument();

    // Overall best value
    const bestValueBadge = screen.getByText(/best overall value/i);
    expect(bestValueBadge).toBeInTheDocument();

    // Should have visual highlighting (border/background)
    const bestValueCard = bestValueBadge.closest('div');
    expect(bestValueCard).toHaveClass(expect.stringContaining('highlight'));

    // Best in categories
    expect(screen.getByText(/best roi/i)).toBeInTheDocument();
    expect(screen.getByText(/lowest fees/i)).toBeInTheDocument();
    expect(screen.getByText(/best risk-adjusted/i)).toBeInTheDocument();
    expect(screen.getByText(/most experienced/i)).toBeInTheDocument();

    // Recommendation
    expect(screen.getByText(/recommended/i)).toBeInTheDocument();
    expect(screen.getByText(/based on.*metrics/i)).toBeInTheDocument();
  });
});
