/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderLeaderboardPage.test.tsx — Leaderboard Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (6 tests):
 * 1. ✅ Multi-dimensional ranking works
 * 2. ✅ Filters apply correctly
 * 3. ✅ Red flag warnings show
 * 4. ✅ Survivorship bias disclaimer visible
 * 5. ✅ Provider quick preview works
 * 6. ✅ Sorting works (all dimensions)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { ProviderLeaderboardPage } from '../ProviderLeaderboardPage';

describe('ProviderLeaderboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display multi-dimensional rankings', () => {
    renderWithRouter(<ProviderLeaderboardPage />);

    // Leaderboard title
    expect(screen.getByText(/provider leaderboard/i)).toBeInTheDocument();

    // Ranking dimensions
    expect(screen.getByText(/roi ranking/i)).toBeInTheDocument();
    expect(screen.getByText(/risk-adjusted ranking/i)).toBeInTheDocument();
    expect(screen.getByText(/volume ranking/i)).toBeInTheDocument();
    expect(screen.getByText(/follower count/i)).toBeInTheDocument();

    // Top providers
    expect(screen.getByText(/#1.*CryptoKing/)).toBeInTheDocument();
    expect(screen.getByText(/#2.*SwingMaster/)).toBeInTheDocument();
    expect(screen.getByText(/#3.*AlgoTrader/)).toBeInTheDocument();

    // Provider stats
    expect(screen.getByText(/25\.5%.*roi/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.4.*sharpe/i)).toBeInTheDocument();
  });

  it('should apply filters correctly', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);

    // Time period filter
    const periodFilter = screen.getByLabelText(/time period/i);
    await user.click(periodFilter);

    const last30Days = screen.getByText(/last 30 days/i);
    await user.click(last30Days);

    await waitFor(() => {
      expect(screen.getByText(/30-day rankings/i)).toBeInTheDocument();
    });

    // Verification tier filter
    const tierFilter = screen.getByLabelText(/verification tier/i);
    await user.click(tierFilter);

    const verifiedOnly = screen.getByText(/verified only/i);
    await user.click(verifiedOnly);

    // Should only show verified providers
    await waitFor(() => {
      const verifiedBadges = screen.getAllByText(/verified/i);
      expect(verifiedBadges.length).toBeGreaterThan(0);
    });

    // Minimum copiers filter
    const copiersFilter = screen.getByLabelText(/minimum copiers/i);
    await user.clear(copiersFilter);
    await user.type(copiersFilter, '100');

    // Should filter out providers with < 100 copiers
    await waitFor(() => {
      const copierCounts = screen.getAllByText(/\d+.*copiers/i);
      copierCounts.forEach(count => {
        const num = parseInt(count.textContent?.match(/\d+/)?.[0] || '0');
        expect(num).toBeGreaterThanOrEqual(100);
      });
    });
  });

  it('should show red flag warnings for risky providers', () => {
    renderWithRouter(<ProviderLeaderboardPage />);

    // Red flag indicators
    const redFlags = screen.getAllByTestId('warning-icon');
    expect(redFlags.length).toBeGreaterThan(0);

    // Warning reasons
    expect(screen.getByText(/high drawdown/i)).toBeInTheDocument();
    expect(screen.getByText(/recent strategy change/i)).toBeInTheDocument();
    expect(screen.getByText(/low completion rate/i)).toBeInTheDocument();

    // Tooltip explanations
    const warningIcon = redFlags[0];
    expect(warningIcon).toHaveAttribute('title', expect.stringContaining('warning'));
  });

  it('should display survivorship bias disclaimer', () => {
    renderWithRouter(<ProviderLeaderboardPage />);

    // Disclaimer banner
    expect(screen.getByText(/survivorship bias/i)).toBeInTheDocument();
    expect(screen.getByText(/only shows currently active providers/i)).toBeInTheDocument();
    expect(screen.getByText(/past performance.*not guarantee/i)).toBeInTheDocument();

    // Should be prominent (at top of page)
    const disclaimer = screen.getByText(/survivorship bias/i).closest('div');
    expect(disclaimer).toHaveClass(expect.stringContaining('warning'));
  });

  it('should show provider quick preview on hover', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);

    // Hover over provider row
    const providerRow = screen.getByText(/CryptoKing/i).closest('tr');
    expect(providerRow).toBeInTheDocument();

    await user.hover(providerRow!);

    // Quick preview popover should appear
    await waitFor(() => {
      expect(screen.getByText(/quick preview/i)).toBeInTheDocument();
    });

    // Should show key metrics
    expect(screen.getByText(/30-day roi/i)).toBeInTheDocument();
    expect(screen.getByText(/max drawdown/i)).toBeInTheDocument();
    expect(screen.getByText(/sharpe ratio/i)).toBeInTheDocument();

    // Should have View Details button
    const viewDetailsBtn = screen.getByRole('button', { name: /view details/i });
    expect(viewDetailsBtn).toBeInTheDocument();

    await user.click(viewDetailsBtn);

    // Should navigate to provider detail
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/copy-provider/')
      );
    });
  });

  it('should sort by all ranking dimensions', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);

    // Default sort: ROI (descending)
    const roiHeader = screen.getByRole('columnheader', { name: /roi/i });
    expect(roiHeader).toHaveAttribute('aria-sort', 'descending');

    // Sort by Sharpe Ratio
    const sharpeHeader = screen.getByRole('columnheader', { name: /sharpe/i });
    await user.click(sharpeHeader);

    await waitFor(() => {
      expect(sharpeHeader).toHaveAttribute('aria-sort', 'descending');
    });

    // Click again to reverse order
    await user.click(sharpeHeader);

    await waitFor(() => {
      expect(sharpeHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    // Sort by Max Drawdown (best = least negative)
    const drawdownHeader = screen.getByRole('columnheader', { name: /drawdown/i });
    await user.click(drawdownHeader);

    await waitFor(() => {
      expect(drawdownHeader).toHaveAttribute('aria-sort', 'ascending');
    });

    // Sort by Copiers
    const copiersHeader = screen.getByRole('columnheader', { name: /copiers/i });
    await user.click(copiersHeader);

    await waitFor(() => {
      expect(copiersHeader).toHaveAttribute('aria-sort', 'descending');
    });

    // All sortable columns should have sort indicator
    const sortableHeaders = screen.getAllByRole('columnheader', { 
      name: /roi|sharpe|drawdown|copiers/i 
    });
    expect(sortableHeaders.length).toBeGreaterThanOrEqual(4);
  });
});
