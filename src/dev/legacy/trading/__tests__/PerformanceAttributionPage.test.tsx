/**
 * ══════════════════════════════════════════════════════════════
 *  PerformanceAttributionPage.test.tsx — Deep Analytics Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current Vietnamese-localized page.
 *
 * Test Coverage (8 tests):
 * 1. ✅ Renders header + Alpha/Beta summary cards
 * 2. ✅ Shows fixed Beta (1.15) and R² (72%) metrics
 * 3. ✅ Attribution tab: decomposition section + Vietnamese explanation
 * 4. ✅ Drawdown tab: underwater chart stats + recovery metrics
 * 5. ✅ Projection tab: Monte Carlo simulation with percentiles + disclaimer
 * 6. ✅ Correlation tab: R coefficient and R² explained variance
 * 7. ✅ Tab navigation between the 4 analytics views
 * 8. ✅ Back button navigates back via router
 *
 * DROPPED from the old suite (features no longer exist on the page):
 * - VaR calculation (no VaR section rendered)
 * - CVaR / Expected Shortfall (no CVaR section rendered)
 * - Export PDF (no export button/modal on the page)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { PerformanceAttributionPage } from '@/dev/legacy/trading/PerformanceAttributionPage';

describe('PerformanceAttributionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header and Alpha/Beta summary cards', () => {
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Page header
    expect(screen.getByText('Phân tích hiệu suất')).toBeInTheDocument();

    // Summary metric cards
    expect(screen.getByText('Total Return')).toBeInTheDocument();
    expect(screen.getByText('Alpha (Skill)')).toBeInTheDocument();
    expect(screen.getByText('Beta (Market)')).toBeInTheDocument();
    expect(screen.getByText('R² (Fit)')).toBeInTheDocument();

    // Alpha card is labelled as relative to the market
    expect(screen.getByText('vs market')).toBeInTheDocument();
  });

  it('should display fixed Beta and R² values', () => {
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Beta is hardcoded at 1.15 on the page
    expect(screen.getByText('1.15')).toBeInTheDocument();

    // R² = 0.72 rendered as a percentage in the summary card
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('should show returns decomposition with Vietnamese explanation on Attribution tab', () => {
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // Section title
    expect(screen.getByText('Returns Decomposition')).toBeInTheDocument();

    // Explanation card
    expect(screen.getByText('Giải thích')).toBeInTheDocument();
    expect(screen.getByText(/Phần lợi nhuận do kỹ năng provider/i)).toBeInTheDocument();
    expect(screen.getByText(/Beta 1\.15 nghĩa là khi thị trường \+1%/i)).toBeInTheDocument();

    // Contribution breakdown rows
    expect(screen.getByText('Market contribution (Beta)')).toBeInTheDocument();
    expect(screen.getByText('Skill contribution (Alpha)')).toBeInTheDocument();
  });

  it('should show complete drawdown analysis on Drawdown tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    await user.click(screen.getByRole('tab', { name: 'Drawdown' }));

    // Underwater chart section
    expect(screen.getByText('Underwater Chart')).toBeInTheDocument();

    // Max / Avg drawdown cards (values are generated, labels are stable)
    expect(screen.getByText('Max Drawdown')).toBeInTheDocument();
    expect(screen.getByText('Avg Drawdown')).toBeInTheDocument();
    // Max drawdown must render as a negative percentage
    const maxDdValue = screen.getByText('Max Drawdown').nextElementSibling;
    expect(maxDdValue?.textContent ?? '').toMatch(/^-\d+\.\d{2}%$/);

    // Drawdown statistics
    expect(screen.getByText('Drawdown Stats')).toBeInTheDocument();
    expect(screen.getByText('Số lần drawdown >5%')).toBeInTheDocument();
    expect(screen.getByText('Thời gian trong drawdown')).toBeInTheDocument();
    expect(screen.getByText('Longest drawdown')).toBeInTheDocument();
    expect(screen.getByText('12 ngày')).toBeInTheDocument();
    expect(screen.getByText('Avg recovery time')).toBeInTheDocument();
    expect(screen.getByText('4.2 ngày')).toBeInTheDocument();

    // Risk warning about recovery stress
    expect(screen.getByText(/khoảng cách từ đỉnh lịch sử/i)).toBeInTheDocument();
  });

  it('should run Monte Carlo simulation with percentiles on Projection tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    await user.click(screen.getByRole('tab', { name: 'Projection' }));

    // Simulation section header
    expect(screen.getByText('Monte Carlo Simulation (30 ngày)')).toBeInTheDocument();

    // Methodology explanation: 50 scenarios + confidence interval
    expect(screen.getByText(/50 kịch bản ngẫu nhiên/i)).toBeInTheDocument();
    expect(screen.getByText(/90% confidence interval/i)).toBeInTheDocument();

    // Percentile cards
    expect(screen.getByText('5th Percentile (Worst)')).toBeInTheDocument();
    expect(screen.getByText('50th Percentile (Median)')).toBeInTheDocument();
    expect(screen.getByText('95th Percentile (Best)')).toBeInTheDocument();

    // Percentile values must render as dollar amounts
    const medianValue = screen.getByText('50th Percentile (Median)').nextElementSibling;
    expect(medianValue?.textContent ?? '').toMatch(/^\$\d+$/);

    // Compliance disclaimer
    expect(screen.getByText(/Đây chỉ là mô phỏng dựa trên dữ liệu lịch sử/i)).toBeInTheDocument();
  });

  it('should display correlation R and R² on Correlation tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    await user.click(screen.getByRole('tab', { name: 'Correlation' }));

    // Correlation section
    expect(screen.getByText('Daily Returns Correlation')).toBeInTheDocument();

    // R = sqrt(0.72) ≈ 0.85
    expect(screen.getByText('Correlation coefficient (R)')).toBeInTheDocument();
    expect(screen.getByText('0.85')).toBeInTheDocument();

    // R² appears in the summary card AND in this tab's breakdown
    expect(screen.getByText('R² (explained variance)')).toBeInTheDocument();
    expect(screen.getAllByText('72%').length).toBe(2);

    // Reading guide
    expect(screen.getByText('Cách đọc')).toBeInTheDocument();
    expect(
      screen.getByText(/biến động của bạn được giải thích bởi thị trường/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/skill\/strategy riêng của provider/i)).toBeInTheDocument();
  });

  it('should support tab navigation between analytics views', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    // All 4 tabs present, Attribution active by default
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    const attributionTab = screen.getByRole('tab', { name: 'Attribution' });
    expect(attributionTab).toHaveAttribute('aria-selected', 'true');

    // Default content visible
    expect(screen.getByText('Returns Decomposition')).toBeInTheDocument();

    // Switch to Drawdown
    await user.click(screen.getByRole('tab', { name: 'Drawdown' }));
    await waitFor(() => {
      expect(screen.getByText('Underwater Chart')).toBeInTheDocument();
    });
    expect(screen.queryByText('Returns Decomposition')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Drawdown' })).toHaveAttribute('aria-selected', 'true');
    expect(attributionTab).toHaveAttribute('aria-selected', 'false');

    // Switch to Projection
    await user.click(screen.getByRole('tab', { name: 'Projection' }));
    await waitFor(() => {
      expect(screen.getByText('Monte Carlo Simulation (30 ngày)')).toBeInTheDocument();
    });

    // Switch to Correlation
    await user.click(screen.getByRole('tab', { name: 'Correlation' }));
    await waitFor(() => {
      expect(screen.getByText('Daily Returns Correlation')).toBeInTheDocument();
    });
  });

  it('should navigate back when the back button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<PerformanceAttributionPage />, {
      initialRoute: '/trade/copy-trading/copy-123/attribution',
    });

    const backButton = screen.getByRole('button', { name: 'Quay lại' });
    await user.click(backButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
