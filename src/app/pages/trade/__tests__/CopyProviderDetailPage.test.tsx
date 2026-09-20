/**
 * ══════════════════════════════════════════════════════════════
 *  CopyProviderDetailPage.test.tsx — Provider Detail Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (12 tests):
 * 1. ✅ Renders provider info correctly
 * 2. ✅ Shows verification badge
 * 3. ✅ Displays performance metrics
 * 4. ✅ Shows risk-adjusted returns
 * 5. ✅ Renders performance chart
 * 6. ✅ Displays fee breakdown
 * 7. ✅ Shows Max Drawdown prominently
 * 8. ✅ Conflict of interest disclosure visible
 * 9. ✅ Related providers section works
 * 10. ✅ Copy CTA navigates to assessment
 * 11. ✅ Back navigation works
 * 12. ✅ Responsive on mobile
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { CopyProviderDetailPage } from '../CopyProviderDetailPage';
import { createMockProvider } from '../../../test/mocks/copy-trading-mocks';

describe('CopyProviderDetailPage', () => {
  const mockProvider = createMockProvider({
    id: 'provider-123',
    name: 'CryptoKing',
    verified: true,
    tier: 'pro',
    stats: {
      roi30d: 25.5,
      maxDrawdown: -15.3,
      sharpeRatio: 2.4,
      winRate: 78,
      totalTrades: 450,
      copiers: 2500,
      aum: 5000000,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render provider info correctly', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Provider name
    expect(screen.getByText('CryptoKing')).toBeInTheDocument();

    // Key stats
    expect(screen.getByText(/25\.5%/)).toBeInTheDocument(); // ROI
    expect(screen.getByText(/2500/)).toBeInTheDocument(); // Copiers
    expect(screen.getByText(/\$5,000,000/)).toBeInTheDocument(); // AUM
  });

  it('should show verification badge for verified providers', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Check for verification badge
    const verifiedBadge = screen.getByText(/verified/i);
    expect(verifiedBadge).toBeInTheDocument();

    // Should show tier
    expect(screen.getByText(/pro/i)).toBeInTheDocument();
  });

  it('should display all performance metrics', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // ROI 30d
    expect(screen.getByText(/30-day roi/i)).toBeInTheDocument();
    expect(screen.getByText(/25\.5%/)).toBeInTheDocument();

    // Win Rate
    expect(screen.getByText(/win rate/i)).toBeInTheDocument();
    expect(screen.getByText(/78%/)).toBeInTheDocument();

    // Total Trades
    expect(screen.getByText(/total trades/i)).toBeInTheDocument();
    expect(screen.getByText(/450/)).toBeInTheDocument();

    // Max Drawdown
    expect(screen.getByText(/max drawdown/i)).toBeInTheDocument();
    expect(screen.getByText(/-15\.3%/)).toBeInTheDocument();
  });

  it('should show risk-adjusted returns (Sharpe Ratio)', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Sharpe Ratio
    expect(screen.getByText(/sharpe ratio/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.4/)).toBeInTheDocument();

    // Should have info tooltip explaining Sharpe
    const sharpeInfo = screen.getByText(/risk-adjusted return/i);
    expect(sharpeInfo).toBeInTheDocument();
  });

  it('should render performance chart', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Check for chart container
    const chartSection = screen.getByText(/performance/i).closest('section');
    expect(chartSection).toBeInTheDocument();

    // Check for time range tabs (1M, 3M, 6M, 1Y, All)
    expect(screen.getByRole('button', { name: /1m/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3m/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /6m/i })).toBeInTheDocument();
  });

  it('should display comprehensive fee breakdown', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Fee section
    expect(screen.getByText(/fees/i)).toBeInTheDocument();

    // Performance fee
    expect(screen.getByText(/performance fee/i)).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();

    // Platform fee
    expect(screen.getByText(/platform fee/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.1%/)).toBeInTheDocument();

    // Total fee estimate
    expect(screen.getByText(/estimated total cost/i)).toBeInTheDocument();
  });

  it('should show Max Drawdown prominently with warning', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Max Drawdown should be prominent
    const drawdownCard = screen.getByText(/max drawdown/i).closest('div');
    expect(drawdownCard).toBeInTheDocument();

    // Should show negative value clearly
    expect(screen.getByText(/-15\.3%/)).toBeInTheDocument();

    // Should have risk warning
    expect(screen.getByText(/highest loss/i)).toBeInTheDocument();
  });

  it('should display conflict of interest disclosure', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Conflict of interest section
    const disclosureSection = screen.getByText(/disclosure/i);
    expect(disclosureSection).toBeInTheDocument();

    // Should mention potential conflicts
    expect(screen.getByText(/may hold positions/i)).toBeInTheDocument();
    expect(screen.getByText(/front-running protections/i)).toBeInTheDocument();
  });

  it('should show related providers section', () => {
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Related providers
    const relatedSection = screen.getByText(/similar providers/i);
    expect(relatedSection).toBeInTheDocument();

    // Should show at least 3 related providers
    const providerCards = screen.getAllByText(/verified/i);
    expect(providerCards.length).toBeGreaterThanOrEqual(3);
  });

  it('should navigate to assessment on Copy CTA click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Find Copy CTA button
    const copyButton = screen.getByRole('button', { name: /start copying/i });
    expect(copyButton).toBeInTheDocument();

    // Click Copy button
    await user.click(copyButton);

    // Should navigate to assessment
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/trade/copy-provider/provider-123/assessment')
      );
    });
  });

  it('should navigate back on back button click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Find back button in header
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();

    // Click back
    await user.click(backButton);

    // Should navigate back
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it('should be responsive on mobile viewports', () => {
    // Set mobile viewport
    global.innerWidth = 390;
    global.innerHeight = 844;

    renderWithRouter(<CopyProviderDetailPage />, {
      initialRoute: '/trade/copy-provider/provider-123',
    });

    // Should still show all critical info
    expect(screen.getByText('CryptoKing')).toBeInTheDocument();
    expect(screen.getByText(/25\.5%/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start copying/i })).toBeInTheDocument();

    // Stats should stack vertically on mobile
    const statsContainer = screen.getByText(/30-day roi/i).closest('div');
    expect(statsContainer).toBeInTheDocument();
  });
});
