/**
 * ══════════════════════════════════════════════════════════════
 *  PerformanceAttributionPage.test.tsx — Advanced Analytics Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (8 tests):
 * 1. ✅ Alpha/Beta decomposition renders
 * 2. ✅ Monte Carlo simulation works (50 paths)
 * 3. ✅ Correlation R² chart shows
 * 4. ✅ Drawdown analysis complete
 * 5. ✅ VaR calculation accurate
 * 6. ✅ CVaR shown
 * 7. ✅ Tab navigation works
 * 8. ✅ Export PDF works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '../../../test/utils/test-utils';
import { PerformanceAttributionPage } from '../PerformanceAttributionPage';

describe('PerformanceAttributionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Alpha/Beta decomposition', () => {
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Alpha/Beta section
    expect(screen.getByText(/alpha.*beta decomposition/i)).toBeInTheDocument();

    // Alpha (excess return)
    expect(screen.getByText(/alpha/i)).toBeInTheDocument();
    expect(screen.getByText(/\+2\.3%/)).toBeInTheDocument();

    // Beta (market exposure)
    expect(screen.getByText(/beta/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.85/)).toBeInTheDocument();

    // Explanation tooltips
    expect(screen.getByText(/risk-adjusted excess return/i)).toBeInTheDocument();
    expect(screen.getByText(/market correlation/i)).toBeInTheDocument();

    // Attribution chart
    expect(screen.getByText(/return attribution/i)).toBeInTheDocument();
  });

  it('should run Monte Carlo simulation with 50 paths', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Switch to Monte Carlo tab
    const monteCarloTab = screen.getByRole('tab', { name: /monte carlo/i });
    await user.click(monteCarloTab);

    // Simulation chart should render
    await waitFor(() => {
      expect(screen.getByText(/monte carlo simulation/i)).toBeInTheDocument();
    });

    // Should show 50 paths
    expect(screen.getByText(/50 simulated paths/i)).toBeInTheDocument();

    // Confidence intervals
    expect(screen.getByText(/95% confidence interval/i)).toBeInTheDocument();
    expect(screen.getByText(/5th percentile/i)).toBeInTheDocument();
    expect(screen.getByText(/95th percentile/i)).toBeInTheDocument();

    // Expected value
    expect(screen.getByText(/expected value/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,250/)).toBeInTheDocument();

    // Worst case scenario
    expect(screen.getByText(/worst case/i)).toBeInTheDocument();
    expect(screen.getByText(/\$800/)).toBeInTheDocument();

    // Best case scenario
    expect(screen.getByText(/best case/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,850/)).toBeInTheDocument();
  });

  it('should display correlation R² chart', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Switch to Correlation tab
    const correlationTab = screen.getByRole('tab', { name: /correlation/i });
    await user.click(correlationTab);

    // Correlation chart
    await waitFor(() => {
      expect(screen.getByText(/correlation analysis/i)).toBeInTheDocument();
    });

    // R² value
    expect(screen.getByText(/r²/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.72/)).toBeInTheDocument();

    // Scatter plot
    expect(screen.getByText(/provider returns/i)).toBeInTheDocument();
    expect(screen.getByText(/your returns/i)).toBeInTheDocument();

    // Tracking error
    expect(screen.getByText(/tracking error/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.3%/)).toBeInTheDocument();

    // Information ratio
    expect(screen.getByText(/information ratio/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.15/)).toBeInTheDocument();
  });

  it('should show complete drawdown analysis', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Switch to Drawdown tab
    const drawdownTab = screen.getByRole('tab', { name: /drawdown/i });
    await user.click(drawdownTab);

    // Drawdown chart
    await waitFor(() => {
      expect(screen.getByText(/drawdown analysis/i)).toBeInTheDocument();
    });

    // Max drawdown
    expect(screen.getByText(/max drawdown/i)).toBeInTheDocument();
    expect(screen.getByText(/-15\.3%/)).toBeInTheDocument();

    // Drawdown duration
    expect(screen.getByText(/longest drawdown/i)).toBeInTheDocument();
    expect(screen.getByText(/23 days/)).toBeInTheDocument();

    // Recovery time
    expect(screen.getByText(/avg recovery time/i)).toBeInTheDocument();
    expect(screen.getByText(/12 days/)).toBeInTheDocument();

    // Drawdown periods table
    expect(screen.getByText(/drawdown periods/i)).toBeInTheDocument();
    expect(screen.getByText(/start date/i)).toBeInTheDocument();
    expect(screen.getByText(/end date/i)).toBeInTheDocument();
    expect(screen.getByText(/depth/i)).toBeInTheDocument();
  });

  it('should calculate VaR (Value at Risk) accurately', () => {
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // VaR section
    expect(screen.getByText(/value at risk/i)).toBeInTheDocument();

    // VaR 95%
    expect(screen.getByText(/var 95%/i)).toBeInTheDocument();
    expect(screen.getByText(/\$125/)).toBeInTheDocument();

    // VaR 99%
    expect(screen.getByText(/var 99%/i)).toBeInTheDocument();
    expect(screen.getByText(/\$210/)).toBeInTheDocument();

    // Interpretation
    expect(screen.getByText(/95% confidence.*not lose more than/i)).toBeInTheDocument();
  });

  it('should display CVaR (Conditional VaR)', () => {
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // CVaR section
    expect(screen.getByText(/conditional var/i)).toBeInTheDocument();
    expect(screen.getByText(/expected shortfall/i)).toBeInTheDocument();

    // CVaR 95%
    expect(screen.getByText(/cvar 95%/i)).toBeInTheDocument();
    expect(screen.getByText(/\$285/)).toBeInTheDocument();

    // Explanation
    expect(screen.getByText(/average loss.*worst 5%/i)).toBeInTheDocument();

    // Tail risk indicator
    expect(screen.getByText(/tail risk/i)).toBeInTheDocument();
  });

  it('should support tab navigation between analytics views', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Tab 1: Alpha/Beta (default)
    expect(screen.getByText(/alpha.*beta decomposition/i)).toBeInTheDocument();

    // Switch to Tab 2: Monte Carlo
    const monteCarloTab = screen.getByRole('tab', { name: /monte carlo/i });
    await user.click(monteCarloTab);
    await waitFor(() => {
      expect(screen.getByText(/monte carlo simulation/i)).toBeInTheDocument();
    });

    // Switch to Tab 3: Correlation
    const correlationTab = screen.getByRole('tab', { name: /correlation/i });
    await user.click(correlationTab);
    await waitFor(() => {
      expect(screen.getByText(/correlation analysis/i)).toBeInTheDocument();
    });

    // Switch to Tab 4: Drawdown
    const drawdownTab = screen.getByRole('tab', { name: /drawdown/i });
    await user.click(drawdownTab);
    await waitFor(() => {
      expect(screen.getByText(/drawdown analysis/i)).toBeInTheDocument();
    });

    // All tabs should be accessible
    expect(screen.getAllByRole('tab').length).toBe(4);
  });

  it('should export attribution report as PDF', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Export button
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeInTheDocument();

    await user.click(exportBtn);

    // Export modal
    await waitFor(() => {
      expect(screen.getByText(/export attribution report/i)).toBeInTheDocument();
    });

    // Export options
    expect(screen.getByRole('radio', { name: /pdf/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /csv/i })).toBeInTheDocument();

    // Select PDF
    const pdfOption = screen.getByRole('radio', { name: /pdf/i });
    await user.click(pdfOption);

    // Confirm export
    const confirmBtn = screen.getByRole('button', { name: /export report/i });
    await user.click(confirmBtn);

    // Should trigger download
    await waitFor(() => {
      expect(screen.getByText(/generating pdf/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/export complete/i)).toBeInTheDocument();
    });
  });
});
