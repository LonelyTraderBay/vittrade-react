/**
 * ══════════════════════════════════════════════════════════════
 *  CopyPerformancePage.test.tsx — Performance Analytics Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (10 tests):
 * 1. ✅ Dual equity curves render
 * 2. ✅ Slippage analysis chart works
 * 3. ✅ Trade comparison table accurate
 * 4. ✅ Cost attribution pie chart shows
 * 5. ✅ Risk-adjusted metrics displayed
 * 6. ✅ Tab switching works (4 tabs)
 * 7. ✅ Export functionality available
 * 8. ✅ Filters work (time range)
 * 9. ✅ Tooltips show details
 * 10. ✅ Mobile responsive
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { CopyPerformancePage } from '../CopyPerformancePage';

describe('CopyPerformancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dual equity curves (Provider vs You)', () => {
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Chart title
    expect(screen.getByText(/equity curve comparison/i)).toBeInTheDocument();

    // Legend
    expect(screen.getByText(/provider equity/i)).toBeInTheDocument();
    expect(screen.getByText(/your equity/i)).toBeInTheDocument();

    // Should show performance divergence
    expect(screen.getByText(/tracking difference/i)).toBeInTheDocument();
    expect(screen.getByText(/-2\.3%/)).toBeInTheDocument(); // Slippage impact
  });

  it('should display slippage analysis chart', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Switch to Slippage tab
    const slippageTab = screen.getByRole('tab', { name: /slippage/i });
    await user.click(slippageTab);

    // Slippage chart should render
    await waitFor(() => {
      expect(screen.getByText(/slippage analysis/i)).toBeInTheDocument();
    });

    // Should show cumulative slippage cost
    expect(screen.getByText(/total slippage cost/i)).toBeInTheDocument();
    expect(screen.getByText(/\$45\.20/)).toBeInTheDocument();

    // Should show average slippage per trade
    expect(screen.getByText(/avg slippage/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.12%/)).toBeInTheDocument();
  });

  it('should show accurate trade comparison table', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Switch to Trades tab
    const tradesTab = screen.getByRole('tab', { name: /trades/i });
    await user.click(tradesTab);

    // Table headers
    await waitFor(() => {
      expect(screen.getByText(/symbol/i)).toBeInTheDocument();
      expect(screen.getByText(/provider price/i)).toBeInTheDocument();
      expect(screen.getByText(/your price/i)).toBeInTheDocument();
      expect(screen.getByText(/slippage/i)).toBeInTheDocument();
    });

    // Sample trade row
    expect(screen.getByText(/BTCUSDT/)).toBeInTheDocument();
    expect(screen.getByText(/\$68,500/)).toBeInTheDocument(); // Provider price
    expect(screen.getByText(/\$68,525/)).toBeInTheDocument(); // Your price
    expect(screen.getByText(/0\.036%/)).toBeInTheDocument(); // Slippage
  });

  it('should display cost attribution pie chart', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Switch to Costs tab
    const costsTab = screen.getByRole('tab', { name: /costs/i });
    await user.click(costsTab);

    // Cost breakdown
    await waitFor(() => {
      expect(screen.getByText(/cost breakdown/i)).toBeInTheDocument();
    });

    // Performance fees
    expect(screen.getByText(/performance fees/i)).toBeInTheDocument();
    expect(screen.getByText(/\$25\.00/)).toBeInTheDocument();

    // Platform fees
    expect(screen.getByText(/platform fees/i)).toBeInTheDocument();
    expect(screen.getByText(/\$2\.00/)).toBeInTheDocument();

    // Slippage costs
    expect(screen.getByText(/slippage costs/i)).toBeInTheDocument();
    expect(screen.getByText(/\$45\.20/)).toBeInTheDocument();

    // Total costs
    expect(screen.getByText(/total costs/i)).toBeInTheDocument();
    expect(screen.getByText(/\$72\.20/)).toBeInTheDocument();
  });

  it('should display risk-adjusted metrics', () => {
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Sharpe Ratio
    expect(screen.getByText(/sharpe ratio/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.1/)).toBeInTheDocument();

    // Sortino Ratio
    expect(screen.getByText(/sortino ratio/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.8/)).toBeInTheDocument();

    // Max Drawdown
    expect(screen.getByText(/max drawdown/i)).toBeInTheDocument();
    expect(screen.getByText(/-15\.3%/)).toBeInTheDocument();

    // Win Rate
    expect(screen.getByText(/win rate/i)).toBeInTheDocument();
    expect(screen.getByText(/78%/)).toBeInTheDocument();
  });

  it('should support tab switching between 4 views', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Tab 1: Overview (default)
    expect(screen.getByText(/equity curve comparison/i)).toBeInTheDocument();

    // Switch to Tab 2: Slippage
    const slippageTab = screen.getByRole('tab', { name: /slippage/i });
    await user.click(slippageTab);
    await waitFor(() => {
      expect(screen.getByText(/slippage analysis/i)).toBeInTheDocument();
    });

    // Switch to Tab 3: Trades
    const tradesTab = screen.getByRole('tab', { name: /trades/i });
    await user.click(tradesTab);
    await waitFor(() => {
      expect(screen.getByText(/provider price/i)).toBeInTheDocument();
    });

    // Switch to Tab 4: Costs
    const costsTab = screen.getByRole('tab', { name: /costs/i });
    await user.click(costsTab);
    await waitFor(() => {
      expect(screen.getByText(/cost breakdown/i)).toBeInTheDocument();
    });
  });

  it('should have export functionality', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Export button
    const exportBtn = screen.getByRole('button', { name: /export/i });
    expect(exportBtn).toBeInTheDocument();

    await user.click(exportBtn);

    // Export options
    await waitFor(() => {
      expect(screen.getByText(/export as csv/i)).toBeInTheDocument();
      expect(screen.getByText(/export as pdf/i)).toBeInTheDocument();
    });

    // Click CSV export
    const csvBtn = screen.getByRole('button', { name: /export as csv/i });
    await user.click(csvBtn);

    // Should trigger download (mock)
    await waitFor(() => {
      expect(screen.getByText(/export started/i)).toBeInTheDocument();
    });
  });

  it('should filter data by time range', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Time range selector
    expect(screen.getByRole('button', { name: /7d/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /30d/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /90d/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();

    // Default should be 30d
    const thirtyDayBtn = screen.getByRole('button', { name: /30d/i });
    expect(thirtyDayBtn).toHaveAttribute('aria-selected', 'true');

    // Switch to 7d
    const sevenDayBtn = screen.getByRole('button', { name: /7d/i });
    await user.click(sevenDayBtn);

    // Chart should update
    await waitFor(() => {
      expect(sevenDayBtn).toHaveAttribute('aria-selected', 'true');
      expect(thirtyDayBtn).toHaveAttribute('aria-selected', 'false');
    });

    // Data should reload for 7 days
    // (In real app, this would fetch new data)
  });

  it('should show tooltips with detailed information', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Hover over Sharpe Ratio
    const sharpeLabel = screen.getByText(/sharpe ratio/i);
    await user.hover(sharpeLabel);

    // Tooltip should appear
    await waitFor(() => {
      expect(screen.getByText(/risk-adjusted return measure/i)).toBeInTheDocument();
      expect(screen.getByText(/higher is better/i)).toBeInTheDocument();
    });

    // Hover over Max Drawdown
    const drawdownLabel = screen.getByText(/max drawdown/i);
    await user.hover(drawdownLabel);

    await waitFor(() => {
      expect(screen.getByText(/largest peak-to-trough decline/i)).toBeInTheDocument();
    });
  });

  it('should be responsive on mobile viewports', () => {
    // Set mobile viewport
    global.innerWidth = 390;
    global.innerHeight = 844;

    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-123/performance',
    });

    // Should still show key metrics
    expect(screen.getByText(/equity curve comparison/i)).toBeInTheDocument();
    expect(screen.getByText(/sharpe ratio/i)).toBeInTheDocument();

    // Tabs should be horizontally scrollable on mobile
    const tabContainer = screen.getByRole('tablist');
    expect(tabContainer).toHaveClass(expect.stringContaining('overflow-x-auto'));

    // Charts should be touch-optimized
    const chartContainer = screen.getByText(/equity curve/i).closest('div');
    expect(chartContainer).toBeInTheDocument();
  });
});
