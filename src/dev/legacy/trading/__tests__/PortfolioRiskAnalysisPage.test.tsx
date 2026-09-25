/**
 * ══════════════════════════════════════════════════════════════
 *  PortfolioRiskAnalysisPage.test.tsx — Risk Analysis Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current Vietnamese-localized page.
 *
 * Test Coverage (8 tests):
 * 1. ✅ Renders header + risk summary cards (exposure, VaR, diversification, alerts)
 * 2. ✅ Asset allocation breakdown by asset with values and weights
 * 3. ✅ Risk warning banner flags BTC concentration above the 30% limit
 * 4. ✅ Correlation matrix tab renders providers + coefficients
 * 5. ✅ VaR tab shows 95%/99% cards + black swan disclaimer
 * 6. ✅ Stress test tab lists scenarios with impact and probability
 * 7. ✅ Tab navigation between the 4 analysis views
 * 8. ✅ Back button navigates back via router
 *
 * DROPPED from the old suite (features no longer exist on the page):
 * - Recommendations tab / actionable recommendations list
 * - Real-time refresh button, updating state, auto-refresh toggle
 * - Custom scenario builder modal
 * - CVaR (Expected Shortfall) card
 * - Diversification progressbar with aria-valuenow (score is plain text now)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { PortfolioRiskAnalysisPage } from '@/dev/legacy/trading/PortfolioRiskAnalysisPage';

/** Mirrors the page's `$${value.toLocaleString()}` formatting (locale-safe). */
const money = (n: number) => `$${n.toLocaleString()}`;

describe('PortfolioRiskAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header and risk summary cards', () => {
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Page header
    expect(screen.getByText('Phân tích rủi ro')).toBeInTheDocument();

    // Total exposure = 2800+2000+1200+800+600+600 across 6 mock assets
    expect(screen.getByText('Total Exposure')).toBeInTheDocument();
    expect(screen.getByText(money(8000))).toBeInTheDocument();
    expect(screen.getByText('Across 6 assets')).toBeInTheDocument();

    // VaR summary card
    expect(screen.getByText('VaR (95%, 1-day)')).toBeInTheDocument();
    expect(screen.getByText('Max loss @ 95%')).toBeInTheDocument();

    // Diversification score (Herfindahl-based, deterministic for mock data)
    expect(screen.getByText('Diversification')).toBeInTheDocument();
    expect(screen.getByText('93/100')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Risk alerts card shows at least one active warning (BTC concentration)
    expect(screen.getByText('Risk Alerts')).toBeInTheDocument();
    const alertCount = Number(screen.getByText('Risk Alerts').nextElementSibling?.textContent);
    expect(alertCount).toBeGreaterThan(0);
  });

  it('should show asset allocation breakdown on Exposure tab', () => {
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    expect(screen.getByText('Asset Allocation')).toBeInTheDocument();

    // Every mock asset appears with its value; USDT and Others share $600
    const expected: Array<{ asset: string; value: number }> = [
      { asset: 'BTC', value: 2800 },
      { asset: 'ETH', value: 2000 },
      { asset: 'SOL', value: 1200 },
      { asset: 'AVAX', value: 800 },
      { asset: 'USDT', value: 600 },
      { asset: 'Others', value: 600 },
    ];

    expected.forEach(({ asset }) => {
      expect(screen.getByText(asset, { exact: true })).toBeInTheDocument();
    });
    [2800, 2000, 1200, 800].forEach((value) => {
      expect(screen.getAllByText(money(value)).length).toBe(1);
    });
    expect(screen.getAllByText(money(600)).length).toBe(2);
    // Percentages appear once per row (7.5% twice for USDT + Others)
    expect(screen.getAllByText('35%').length).toBe(1);
    expect(screen.getAllByText('7.5%').length).toBe(2);

    // Diversification guidance note
    expect(
      screen.getByText(/Khuyến nghị không để asset nào chiếm >30% portfolio/i),
    ).toBeInTheDocument();
  });

  it('should flag concentration risk in the warning banner', () => {
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // Vietnamese risk warning banner is shown because BTC > 30%
    expect(screen.getByText('Cảnh báo rủi ro')).toBeInTheDocument();
    expect(screen.getByText(/BTC chiếm 35% \(khuyến nghị <30%\)/i)).toBeInTheDocument();
  });

  it('should display provider correlation matrix on Correlation tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    await user.click(screen.getByRole('tab', { name: 'Correlation' }));

    expect(screen.getByText('Provider Correlation Matrix')).toBeInTheDocument();

    // Interpretation note
    expect(
      screen.getByText(/Correlation >0\.8 nghĩa là 2 providers có xu hướng giống nhau/i),
    ).toBeInTheDocument();

    // Matrix is symmetric: each off-diagonal pair appears twice
    expect(screen.getAllByText('0.72').length).toBe(2); // CryptoKing ↔ SwingMaster
    expect(screen.getAllByText('0.45').length).toBe(2); // CryptoKing ↔ AlgoTrader
    expect(screen.getAllByText('0.38').length).toBe(2); // SwingMaster ↔ AlgoTrader
    expect(screen.getAllByText('1.00').length).toBe(3); // diagonal

    // Header row + first column display the providers (name split on camelCase)
    expect(screen.getAllByText('Crypto King').length).toBe(2);
    expect(screen.getAllByText('Swing Master').length).toBe(2);
    expect(screen.getAllByText('Algo Trader').length).toBe(2);
  });

  it('should calculate VaR at 95% and 99% confidence on VaR tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    await user.click(screen.getByRole('tab', { name: 'VaR' }));

    expect(screen.getByText('Value at Risk (30 ngày)')).toBeInTheDocument();

    // Both confidence cards render with dollar amounts
    const var95Card = screen.getByText('VaR 95% (1-day)');
    expect(var95Card.nextElementSibling?.textContent ?? '').toMatch(/^\$\d+$/);
    const var99Card = screen.getByText('VaR 99% (1-day)');
    expect(var99Card.nextElementSibling?.textContent ?? '').toMatch(/^\$\d+$/);

    // VaR 99% must exceed VaR 95% for the same portfolio
    const v95 = Number(var95Card.nextElementSibling?.textContent?.replace(/\$/g, ''));
    const v99 = Number(var99Card.nextElementSibling?.textContent?.replace(/\$/g, ''));
    expect(v99).toBeGreaterThan(v95);

    // Interpretations
    expect(screen.getByText('5% ngày có thể lỗ nhiều hơn')).toBeInTheDocument();
    expect(screen.getByText('1% ngày có thể lỗ nhiều hơn')).toBeInTheDocument();

    // Tail-risk disclaimer
    expect(screen.getByText(/black swan events, loss có thể vượt xa VaR 99%/i)).toBeInTheDocument();
  });

  it('should run stress test scenarios on Stress Test tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    await user.click(screen.getByRole('tab', { name: 'Stress Test' }));

    expect(screen.getByText('Stress Test Scenarios')).toBeInTheDocument();

    // All five scenarios with their impacts.
    // NOTE page bug: negative impacts render as "$-2.400" (minus AFTER the
    // dollar sign) because the JSX emits `$` before `impact.toLocaleString()`.
    expect(screen.getByText('Market Crash (-30%)')).toBeInTheDocument();
    expect(screen.getByText(money(-2400))).toBeInTheDocument();
    expect(screen.getByText('BTC Halving Rally')).toBeInTheDocument();
    expect(screen.getByText(`+${money(1800)}`)).toBeInTheDocument();
    expect(screen.getByText('Regulatory Crackdown')).toBeInTheDocument();
    expect(screen.getByText(money(-1500))).toBeInTheDocument();
    expect(screen.getByText('Stable Bull Market')).toBeInTheDocument();
    expect(screen.getByText(`+${money(600)}`)).toBeInTheDocument();
    expect(screen.getByText('High Volatility')).toBeInTheDocument();
    expect(screen.getByText(money(-800))).toBeInTheDocument();

    // Probabilities
    expect(screen.getByText('Probability: 5%')).toBeInTheDocument();
    expect(screen.getByText('Probability: 40%')).toBeInTheDocument();

    // Guidance note
    expect(
      screen.getByText(/hiểu portfolio sẽ phản ứng ra sao trong các tình huống/i),
    ).toBeInTheDocument();
  });

  it('should support tab navigation between analysis views', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    // 4 tabs, Exposure active by default
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    const exposureTab = screen.getByRole('tab', { name: 'Exposure' });
    expect(exposureTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Asset Allocation')).toBeInTheDocument();

    // Correlation
    await user.click(screen.getByRole('tab', { name: 'Correlation' }));
    await waitFor(() => {
      expect(screen.getByText('Provider Correlation Matrix')).toBeInTheDocument();
    });
    expect(screen.queryByText('Asset Allocation')).not.toBeInTheDocument();

    // VaR
    await user.click(screen.getByRole('tab', { name: 'VaR' }));
    await waitFor(() => {
      expect(screen.getByText('Value at Risk (30 ngày)')).toBeInTheDocument();
    });

    // Stress Test
    await user.click(screen.getByRole('tab', { name: 'Stress Test' }));
    await waitFor(() => {
      expect(screen.getByText('Stress Test Scenarios')).toBeInTheDocument();
    });
    expect(exposureTab).toHaveAttribute('aria-selected', 'false');
  });

  it('should navigate back when the back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PortfolioRiskAnalysisPage />);

    await user.click(screen.getByRole('button', { name: 'Quay lại' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
