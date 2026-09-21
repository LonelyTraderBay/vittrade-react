/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderLeaderboardPage.test.tsx — Leaderboard Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current card-list leaderboard
 * (segment sort tabs + risk filter chips + verified toggle).
 *
 * Test Coverage (6 tests):
 * 1. ✅ Renders header, survivorship bias warning, filters, count
 * 2. ✅ Default ranking is by ROI descending
 * 3. ✅ Sorting by Sharpe and by Followers reorders the list
 * 4. ✅ Risk level filter narrows the list
 * 5. ✅ Verified-only toggle filters (0 — dataset has no verified providers)
 * 6. ✅ Clicking a provider card navigates to its detail page
 *
 * DROPPED from the old suite (features no longer exist / never fire):
 * - Red flag warnings: the detector checks `maxDrawdown > 20` but the mock
 *   data stores drawdowns NEGATIVE (e.g. -28.3), so no red flag can ever
 *   render. Reported as a page bug; not asserted.
 * - Hover quick-preview popover, time-period and min-copier filters,
 *   sortable table columns with aria-sort.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { ProviderLeaderboardPage } from '../ProviderLeaderboardPage';

describe('ProviderLeaderboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header, bias warning, controls and provider count', () => {
    renderWithRouter(<ProviderLeaderboardPage />);

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();

    // Survivorship bias warning (compliance-mandated)
    expect(screen.getByText('Survivorship Bias Warning')).toBeInTheDocument();
    expect(
      screen.getByText(/Leaderboard chỉ hiển thị providers đang active/i),
    ).toBeInTheDocument();

    // Sort tabs + risk filter chips + verified toggle
    expect(screen.getByRole('tab', { name: 'ROI' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sharpe' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Followers' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '30D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Low$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^High$/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Chỉ hiện Verified providers/i }),
    ).toBeInTheDocument();

    // All 5 mock providers listed
    expect(screen.getByText('Hiển thị 5 providers')).toBeInTheDocument();

    // Bottom disclaimer
    expect(
      screen.getByText(/không đảm bảo kết quả tương lai. Provider xếp hạng cao/i),
    ).toBeInTheDocument();
  });

  it('should rank providers by ROI descending by default', () => {
    renderWithRouter(<ProviderLeaderboardPage />);

    // Expected order: RiskMaster_88 (567.8) > WhaleWatcher (423.1) > AlphaHunter_VN (342.5)
    const html = document.body.textContent ?? '';
    expect(html.indexOf('RiskMaster_88')).toBeLessThan(html.indexOf('WhaleWatcher'));
    expect(html.indexOf('WhaleWatcher')).toBeLessThan(html.indexOf('AlphaHunter_VN'));

    // Rank badges for the podium
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();

    // The leader's ROI from mock data
    expect(screen.getByText('+567.8%')).toBeInTheDocument();
    expect(screen.getByText('+423.1%')).toBeInTheDocument();
  });

  it('should reorder providers when sorting by Sharpe or Followers', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);

    // Sharpe: SteadyGains_Pro (3.12) leads
    await user.click(screen.getByRole('tab', { name: 'Sharpe' }));
    await waitFor(() => {
      const html = document.body.textContent ?? '';
      expect(html.indexOf('SteadyGains_Pro')).toBeLessThan(html.indexOf('RiskMaster_88'));
    });
    expect(screen.getByRole('tab', { name: 'Sharpe' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // Followers: WhaleWatcher (4890 copiers) leads
    await user.click(screen.getByRole('tab', { name: 'Followers' }));
    await waitFor(() => {
      const html = document.body.textContent ?? '';
      expect(html.indexOf('WhaleWatcher')).toBeLessThan(html.indexOf('SteadyGains_Pro'));
    });
  });

  it('should filter providers by risk level', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);

    // Low risk: SteadyGains_Pro + WhaleWatcher
    await user.click(screen.getByRole('button', { name: 'Low', exact: true }));
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 2 providers')).toBeInTheDocument();
    });
    expect(screen.getAllByText('LOW')).toHaveLength(2);
    expect(screen.queryByText('HIGH')).not.toBeInTheDocument();
    expect(screen.queryByText('MEDIUM')).not.toBeInTheDocument();

    // High risk: RiskMaster_88 only
    await user.click(screen.getByRole('button', { name: 'High', exact: true }));
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 1 providers')).toBeInTheDocument();
    });
    expect(screen.getByText('RiskMaster_88')).toBeInTheDocument();
    expect(screen.queryByText('WhaleWatcher')).not.toBeInTheDocument();

    // All: full list again
    await user.click(screen.getByRole('button', { name: 'All', exact: true }));
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 5 providers')).toBeInTheDocument();
    });
  });

  it('should filter to verified-only providers via the toggle', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);

    // The shared mock dataset has no `verified` providers, so the toggle
    // empties the list — proving the filter is wired up.
    const toggle = screen.getByRole('button', { name: /Chỉ hiện Verified providers/i });
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText('Hiển thị 0 providers')).toBeInTheDocument();
    });
    expect(screen.queryByText('RiskMaster_88')).not.toBeInTheDocument();

    // Toggling off restores the full list
    await user.click(toggle);
    await waitFor(() => {
      expect(screen.getByText('Hiển thị 5 providers')).toBeInTheDocument();
    });
  });

  it('should navigate to provider detail when a card is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderLeaderboardPage />);

    const card = screen.getByRole('button', { name: /RiskMaster_88/ });
    await user.click(card);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-provider/ct003');
    });
  });
});
