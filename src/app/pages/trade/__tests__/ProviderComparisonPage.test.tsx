/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderComparisonPage.test.tsx — Comparison Tool Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current Vietnamese-localized page.
 *
 * Test Coverage (6 tests):
 * 1. ✅ Renders header, disclaimer and provider count for 3 providers
 * 2. ✅ Metrics table renders all 13 metrics in 4 categories
 * 3. ✅ Deterministic metrics derive from mock data (ROI / Win Rate / Risk Score)
 * 4. ✅ Providers can be removed down to the minimum of 2
 * 5. ✅ Best value per metric is highlighted green
 * 6. ✅ Legend shown; quick actions navigate to provider detail
 *
 * DROPPED from the old suite (features no longer exist on the page):
 * - In-page "add provider" selector modal (the + button navigates to the list)
 * - Fee impact comparison based on a $2,000 allocation
 * - "Best value analysis" / recommendation cards
 * - Hard-coded slippage/fill-rate values (they are randomized per render)
 *
 * NOTE page bug: the default id fallback ['trader-1','trader-2','trader-3']
 * matches no COPY_TRADERS entry (ids are ct001..ct005), so the page renders
 * an empty table unless ?ids= is provided. Tests pass explicit ids.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { ProviderComparisonPage } from '../ProviderComparisonPage';

// ct001 AlphaHunter_VN (medium risk), ct002 SteadyGains_Pro (low), ct003 RiskMaster_88 (high)
const COMPARE_ROUTE = '/trade/copy-comparison?ids=ct001,ct002,ct003';

/** The remove (X) buttons live in the table header cells. */
function getRemoveButtons(): HTMLElement[] {
  const thead = document.querySelector('thead');
  if (!thead) return [];
  return within(thead as HTMLElement).getAllByRole('button');
}

describe('ProviderComparisonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header, disclaimer and provider count', () => {
    renderWithRouter(<ProviderComparisonPage />, { initialRoute: COMPARE_ROUTE });

    expect(screen.getByText('So sánh Providers')).toBeInTheDocument();

    // Past performance disclaimer
    expect(
      screen.getByText(/Hiệu suất quá khứ không đảm bảo kết quả tương lai/i),
    ).toBeInTheDocument();

    // 3 selected providers appear as column headers
    expect(screen.getByText('Đang so sánh 3/5 providers')).toBeInTheDocument();
    expect(screen.getAllByText('AlphaHunter_VN').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SteadyGains_Pro').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RiskMaster_88').length).toBeGreaterThan(0);

    // "Add provider" affordance is shown while below the 5-provider cap
    expect(screen.getByRole('button', { name: '+ Thêm provider' })).toBeInTheDocument();
  });

  it('should render the full metrics table with 4 categories', () => {
    renderWithRouter(<ProviderComparisonPage />, { initialRoute: COMPARE_ROUTE });

    // Category section headers
    ['Performance', 'Risk', 'Execution', 'Cost'].forEach((section) => {
      expect(screen.getByText(section, { exact: true })).toBeInTheDocument();
    });

    // All 13 metric row labels
    const metrics = [
      'Total ROI',
      '30D Return',
      'Win Rate',
      'Avg Trade',
      'Sharpe Ratio',
      'Max Drawdown',
      'Volatility',
      'Risk Score',
      'Avg Slippage',
      'Avg Delay',
      'Fill Rate',
      'Performance Fee',
      'Est. Monthly Cost',
    ];
    metrics.forEach((label) => {
      expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
    });
  });

  it('should derive deterministic metrics from mock provider data', () => {
    renderWithRouter(<ProviderComparisonPage />, { initialRoute: COMPARE_ROUTE });

    // Total ROI comes straight from COPY_TRADERS
    expect(screen.getByText('+342.5%')).toBeInTheDocument(); // AlphaHunter_VN
    expect(screen.getByText('+187.2%')).toBeInTheDocument(); // SteadyGains_Pro

    // Win Rate
    expect(screen.getByText('78.5%')).toBeInTheDocument();
    expect(screen.getByText('82.3%')).toBeInTheDocument();

    // 30D Return = totalPnlPct * 0.3 → 342.5 * 0.3 = 102.75 → +102.8%
    expect(screen.getByText('+102.8%')).toBeInTheDocument();

    // Sharpe ratios
    expect(screen.getByText('2.31')).toBeInTheDocument();
    expect(screen.getByText('3.12')).toBeInTheDocument();

    // Risk score maps from risk level: low=35, medium=60, high=85
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should allow removing providers down to the minimum of two', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderComparisonPage />, { initialRoute: COMPARE_ROUTE });

    expect(screen.getByText('Đang so sánh 3/5 providers')).toBeInTheDocument();

    // Remove AlphaHunter_VN (first header X button)
    const removeButtons = getRemoveButtons();
    expect(removeButtons).toHaveLength(3);
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Đang so sánh 2/5 providers')).toBeInTheDocument();
    });
    expect(screen.queryByText('AlphaHunter_VN')).not.toBeInTheDocument();
    expect(screen.getAllByText('SteadyGains_Pro').length).toBeGreaterThan(0);

    // Minimum is 2 — removing another provider is refused
    const remainingButtons = getRemoveButtons();
    expect(remainingButtons).toHaveLength(2);
    await user.click(remainingButtons[0]);

    expect(screen.getByText('Đang so sánh 2/5 providers')).toBeInTheDocument();
    expect(getRemoveButtons()).toHaveLength(2);
  });

  it('should highlight the best value per metric in green', () => {
    renderWithRouter(<ProviderComparisonPage />, { initialRoute: COMPARE_ROUTE });

    // Total ROI: higher is better → RiskMaster_88 (+567.8%) is best
    const roiRow = screen.getByText('Total ROI', { exact: true }).closest('tr')!;
    const bestRoi = within(roiRow).getByText('+567.8%');
    expect(bestRoi).toHaveStyle({ color: 'rgb(16, 185, 129)', fontWeight: '700' });
    // Non-best values keep the default colour
    const otherRoi = within(roiRow).getByText('+342.5%');
    expect(otherRoi).not.toHaveStyle({ color: 'rgb(16, 185, 129)' });

    // Risk Score: lower is better → SteadyGains_Pro (low risk, 35) is best
    const riskRow = screen.getByText('Risk Score', { exact: true }).closest('tr')!;
    const bestRisk = within(riskRow).getByText('35');
    expect(bestRisk).toHaveStyle({ color: 'rgb(16, 185, 129)' });
  });

  it('should navigate from quick actions and the add-provider link', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderComparisonPage />, { initialRoute: COMPARE_ROUTE });

    // Legend explains the green highlighting
    expect(screen.getByText('= Giá trị tốt nhất trong nhóm')).toBeInTheDocument();

    // Quick action per provider navigates to its detail page
    const firstAction = screen.getByRole('button', { name: /AlphaHunter_VN/ });
    expect(screen.getAllByText('Xem chi tiết & bắt đầu copy').length).toBe(3);
    await user.click(firstAction);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-provider/ct001');
    });

    // "+ Thêm provider" navigates back to the copy trading list
    await user.click(screen.getByRole('button', { name: '+ Thêm provider' }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-trading');
    });
  });
});
