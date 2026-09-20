/**
 * ══════════════════════════════════════════════════════════════
 *  PortfolioRiskAnalysisPage.test.tsx — Risk Analysis Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (8 tests):
 * 1. ✅ Aggregate exposure chart renders
 * 2. ✅ Correlation heatmap works
 * 3. ✅ VaR 95%/99% calculated
 * 4. ✅ Stress test scenarios run
 * 5. ✅ Diversification score shown
 * 6. ✅ Recommendations displayed
 * 7. ✅ Tab switching works
 * 8. ✅ Real-time updates work
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '../../../test/utils/test-utils';
import { PortfolioRiskAnalysisPage } from '../PortfolioRiskAnalysisPage';

describe('PortfolioRiskAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render aggregate exposure chart', () => {
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Page title
    expect(screen.getByText(/portfolio risk analysis/i)).toBeInTheDocument();

    // Exposure chart
    expect(screen.getByText(/aggregate exposure/i)).toBeInTheDocument();

    // Exposure by asset
    expect(screen.getByText(/BTC.*45%/)).toBeInTheDocument();
    expect(screen.getByText(/ETH.*30%/)).toBeInTheDocument();
    expect(screen.getByText(/other.*25%/)).toBeInTheDocument();

    // Total exposure
    expect(screen.getByText(/total exposure/i)).toBeInTheDocument();
    expect(screen.getByText(/\$15,000/)).toBeInTheDocument();

    // Pie chart or bar chart should render
    const chartSection = screen.getByText(/aggregate exposure/i).closest('div');
    expect(chartSection).toBeInTheDocument();
  });

  it('should display correlation heatmap', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Switch to Correlation tab
    const correlationTab = screen.getByRole('tab', { name: /correlation/i });
    await user.click(correlationTab);

    // Heatmap
    await waitFor(() => {
      expect(screen.getByText(/correlation heatmap/i)).toBeInTheDocument();
    });

    // Provider correlations
    expect(screen.getByText(/CryptoKing/i)).toBeInTheDocument();
    expect(screen.getByText(/SwingMaster/i)).toBeInTheDocument();
    expect(screen.getByText(/AlgoTrader/i)).toBeInTheDocument();

    // Correlation values (should be between -1 and 1)
    expect(screen.getByText(/0\.72/)).toBeInTheDocument(); // High correlation
    expect(screen.getByText(/0\.15/)).toBeInTheDocument(); // Low correlation

    // Interpretation
    expect(screen.getByText(/high correlation.*increased risk/i)).toBeInTheDocument();

    // Diversification recommendation
    expect(screen.getByText(/consider.*less correlated/i)).toBeInTheDocument();
  });

  it('should calculate VaR at 95% and 99% confidence', () => {
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // VaR section
    expect(screen.getByText(/value at risk/i)).toBeInTheDocument();

    // VaR 95%
    expect(screen.getByText(/var 95%/i)).toBeInTheDocument();
    expect(screen.getByText(/\$425/)).toBeInTheDocument();
    expect(screen.getByText(/2\.8% of portfolio/i)).toBeInTheDocument();

    // VaR 99%
    expect(screen.getByText(/var 99%/i)).toBeInTheDocument();
    expect(screen.getByText(/\$780/)).toBeInTheDocument();
    expect(screen.getByText(/5\.2% of portfolio/i)).toBeInTheDocument();

    // Interpretation
    expect(screen.getByText(/95% confident.*not lose more than/i)).toBeInTheDocument();

    // CVaR (Expected Shortfall)
    expect(screen.getByText(/cvar 95%/i)).toBeInTheDocument();
    expect(screen.getByText(/\$950/)).toBeInTheDocument();
  });

  it('should run stress test scenarios', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Switch to Stress Test tab
    const stressTab = screen.getByRole('tab', { name: /stress test/i });
    await user.click(stressTab);

    // Stress test scenarios
    await waitFor(() => {
      expect(screen.getByText(/stress test scenarios/i)).toBeInTheDocument();
    });

    // Scenario 1: Market crash (-30%)
    expect(screen.getByText(/market crash.*-30%/i)).toBeInTheDocument();
    expect(screen.getByText(/portfolio impact.*-\$4,500/i)).toBeInTheDocument();

    // Scenario 2: Flash crash (-15%)
    expect(screen.getByText(/flash crash.*-15%/i)).toBeInTheDocument();
    expect(screen.getByText(/portfolio impact.*-\$2,250/i)).toBeInTheDocument();

    // Scenario 3: Volatility spike (+200%)
    expect(screen.getByText(/volatility spike/i)).toBeInTheDocument();

    // Scenario 4: Correlation breakdown
    expect(screen.getByText(/correlation breakdown/i)).toBeInTheDocument();

    // Run custom scenario button
    const customScenarioBtn = screen.getByRole('button', { name: /custom scenario/i });
    expect(customScenarioBtn).toBeInTheDocument();

    await user.click(customScenarioBtn);

    // Custom scenario modal
    await waitFor(() => {
      expect(screen.getByText(/define custom scenario/i)).toBeInTheDocument();
    });
  });

  it('should show diversification score', () => {
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Diversification section
    expect(screen.getByText(/diversification score/i)).toBeInTheDocument();

    // Score (0-100)
    expect(screen.getByText(/65.*100/)).toBeInTheDocument();

    // Rating
    expect(screen.getByText(/moderate diversification/i)).toBeInTheDocument();

    // Breakdown
    expect(screen.getByText(/provider diversity/i)).toBeInTheDocument();
    expect(screen.getByText(/3 providers/)).toBeInTheDocument();

    expect(screen.getByText(/asset diversity/i)).toBeInTheDocument();
    expect(screen.getByText(/5 assets/)).toBeInTheDocument();

    expect(screen.getByText(/strategy diversity/i)).toBeInTheDocument();
    expect(screen.getByText(/2 strategies/)).toBeInTheDocument();

    // Visual indicator (progress bar or gauge)
    const scoreIndicator = screen.getByRole('progressbar');
    expect(scoreIndicator).toBeInTheDocument();
    expect(scoreIndicator).toHaveAttribute('aria-valuenow', '65');
  });

  it('should display actionable recommendations', () => {
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Recommendations section
    expect(screen.getByText(/recommendations/i)).toBeInTheDocument();

    // Recommendation 1: Reduce concentration
    expect(screen.getByText(/reduce concentration/i)).toBeInTheDocument();
    expect(screen.getByText(/btc exposure.*45%.*exceeds.*30%/i)).toBeInTheDocument();

    // Recommendation 2: Add uncorrelated provider
    expect(screen.getByText(/add.*uncorrelated provider/i)).toBeInTheDocument();
    expect(screen.getByText(/current providers.*highly correlated/i)).toBeInTheDocument();

    // Recommendation 3: Reduce allocation
    expect(screen.getByText(/reduce total allocation/i)).toBeInTheDocument();
    expect(screen.getByText(/current.*45%.*portfolio.*exceeds.*25%/i)).toBeInTheDocument();

    // Priority indicators
    const highPriority = screen.getAllByText(/high priority/i);
    expect(highPriority.length).toBeGreaterThan(0);

    // Action buttons
    const actionBtns = screen.getAllByRole('button', { name: /view suggestion/i });
    expect(actionBtns.length).toBeGreaterThan(0);
  });

  it('should support tab navigation between analysis views', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Tab 1: Overview (default)
    expect(screen.getByText(/aggregate exposure/i)).toBeInTheDocument();

    // Switch to Tab 2: Correlation
    const correlationTab = screen.getByRole('tab', { name: /correlation/i });
    await user.click(correlationTab);
    await waitFor(() => {
      expect(screen.getByText(/correlation heatmap/i)).toBeInTheDocument();
    });

    // Switch to Tab 3: Stress Test
    const stressTab = screen.getByRole('tab', { name: /stress test/i });
    await user.click(stressTab);
    await waitFor(() => {
      expect(screen.getByText(/stress test scenarios/i)).toBeInTheDocument();
    });

    // Switch to Tab 4: Recommendations
    const recoTab = screen.getByRole('tab', { name: /recommendations/i });
    await user.click(recoTab);
    await waitFor(() => {
      expect(screen.getByText(/actionable recommendations/i)).toBeInTheDocument();
    });

    // All tabs should be accessible
    expect(screen.getAllByRole('tab').length).toBe(4);
  });

  it('should update risk metrics in real-time', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Initial VaR
    expect(screen.getByText(/\$425/)).toBeInTheDocument();

    // Simulate live trade update (mock WebSocket)
    // In real app, this would update via WebSocket
    
    // Trigger refresh
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshBtn);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });

    // Should update metrics
    await waitFor(() => {
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    // Last update timestamp
    expect(screen.getByText(/last updated.*just now/i)).toBeInTheDocument();

    // Auto-refresh toggle
    const autoRefreshToggle = screen.getByRole('switch', { name: /auto-refresh/i });
    expect(autoRefreshToggle).toBeInTheDocument();

    await user.click(autoRefreshToggle);

    // Should enable auto-refresh
    expect(autoRefreshToggle).toBeChecked();
    expect(screen.getByText(/refreshes every 30s/i)).toBeInTheDocument();
  });
});
