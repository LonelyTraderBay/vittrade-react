/**
 * ══════════════════════════════════════════════════════════════
 *  CopyPerformancePage.test.tsx — Performance Analysis Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: a you-vs-provider
 * performance comparison with 4 tabs (Tổng quan / Trades / Chi phí
 * / Metrics), covering the summary gap card, equity-curve section,
 * slippage distribution stats, per-trade execution comparison,
 * cost attribution and risk-adjusted metrics.
 *
 * Test Coverage (10 tests):
 * 1. ✅ Summary comparison card (returns + performance gap + causes)
 * 2. ✅ Overview tab shows equity curve section and gap reasons
 * 3. ✅ Slippage distribution stats (yours vs provider average)
 * 4. ✅ Tab switching swaps content
 * 5. ✅ Trades tab lists the 3 trade comparisons
 * 6. ✅ Trade cards show entries/exits/P&L, delay and slippage
 * 7. ✅ Costs tab shows cost attribution items and total
 * 8. ✅ Costs tab shows gross → net return impact
 * 9. ✅ Metrics tab shows risk-adjusted metric pairs
 * 10. ✅ Metrics tab explains why your metrics are lower
 *
 * Dropped from the old suite (features no longer exist):
 * - Export functionality
 * - Time-range filtering
 * - Chart tooltip detail assertions (recharts internals)
 * - Responsive viewport behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '@/test/test-utils-navigation';
import { CopyPerformancePage } from '../CopyPerformancePage';

describe('CopyPerformancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the summary comparison card', () => {
    renderWithRouter(<CopyPerformancePage />, {
      initialRoute: '/trade/copy-trading/copy-1/performance',
    });

    expect(screen.getByText('Phân tích hiệu suất')).toBeInTheDocument();
    expect(screen.getByText('Tổng quan so sánh')).toBeInTheDocument();

    // You: +13.0% ($5,000 → $5,650); Provider: +15.6% ($5,000 → $5,780)
    expect(screen.getByText('Hiệu suất của bạn')).toBeInTheDocument();
    expect(screen.getByText('+13.0%')).toBeInTheDocument();
    expect(screen.getByText('$5,000 → $5,650')).toBeInTheDocument();
    expect(screen.getByText('Provider lý thuyết')).toBeInTheDocument();
    expect(screen.getByText('+15.6%')).toBeInTheDocument();
    expect(screen.getByText('$5,000 → $5,780')).toBeInTheDocument();

    // Gap: provider outperforms by 2.60% (rendered positive), attributed to
    // slippage (0.68%) and costs ($290)
    expect(screen.getByText('Chênh lệch hiệu suất')).toBeInTheDocument();
    expect(screen.getByText('2.60%')).toBeInTheDocument();
    expect(
      screen.getByText(/Nguyên nhân chính: slippage \(0\.68%\) và chi phí \(\$290\)/i),
    ).toBeInTheDocument();
  });

  it('should show equity curve section with gap reasons on overview tab', () => {
    renderWithRouter(<CopyPerformancePage />);

    expect(screen.getByText('Đường vốn so sánh (30 ngày)')).toBeInTheDocument();
    expect(screen.getByText('Tại sao có chênh lệch?')).toBeInTheDocument();
    expect(screen.getByText(/Slippage: Copy orders thực thi chậm hơn 0\.5-3s/i)).toBeInTheDocument();
    expect(screen.getByText(/Chi phí: Trading fees \+ performance fees/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Position sizing: Fixed mode sử dụng 50% capital/i),
    ).toBeInTheDocument();
  });

  it('should show slippage distribution stats', () => {
    renderWithRouter(<CopyPerformancePage />);

    expect(screen.getByText('Phân bố Slippage')).toBeInTheDocument();
    expect(screen.getByText('Slippage TB của bạn')).toBeInTheDocument();
    expect(screen.getByText('0.68%')).toBeInTheDocument();
    expect(screen.getByText('Provider TB')).toBeInTheDocument();
    expect(screen.getByText('0.48%')).toBeInTheDocument();
  });

  it('should switch between the 4 tabs', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />);

    ['Tổng quan', 'Trades', 'Chi phí', 'Metrics'].forEach((label) =>
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument(),
    );

    // Switch to Trades
    await user.click(screen.getByRole('tab', { name: 'Trades' }));
    await waitFor(() => {
      expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
      expect(screen.queryByText('Đường vốn so sánh (30 ngày)')).not.toBeInTheDocument();
    });

    // Switch to Metrics
    await user.click(screen.getByRole('tab', { name: 'Metrics' }));
    await waitFor(() => {
      expect(screen.getByText('Metrics điều chỉnh rủi ro')).toBeInTheDocument();
      expect(screen.queryByText('BTC/USDT')).not.toBeInTheDocument();
    });
  });

  it('should list the 3 trade comparisons on the trades tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />);

    await user.click(screen.getByRole('tab', { name: 'Trades' }));

    expect(
      screen.getByText(/So sánh từng giao dịch giữa bạn và provider/i),
    ).toBeInTheDocument();

    ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'].forEach((pair) =>
      expect(screen.getByText(pair)).toBeInTheDocument(),
    );
    expect(screen.getByText('2024-03-05 14:23')).toBeInTheDocument();
    expect(screen.getByText('2024-03-04 09:15')).toBeInTheDocument();
    expect(screen.getByText('2024-03-03 16:42')).toBeInTheDocument();
  });

  it('should show entries, exits, P/L, delay and slippage per trade', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />);

    await user.click(screen.getByRole('tab', { name: 'Trades' }));

    // BTC trade card
    const btcCard = screen.getByText('BTC/USDT').closest('.rounded-2xl') as HTMLElement;
    expect(btcCard).not.toBeNull();
    expect(screen.getAllByText('Entry').length).toBe(6); // provider + you per trade card
    expect(within(btcCard).getAllByText('$67800').length).toBeGreaterThan(0); // provider entry
    expect(within(btcCard).getAllByText('$68500').length).toBeGreaterThan(0); // provider exit
    expect(within(btcCard).getByText('+$35')).toBeInTheDocument(); // provider P/L
    expect(within(btcCard).getByText('+$32')).toBeInTheDocument(); // your P/L
    expect(within(btcCard).getByText('Delay: 2.1s')).toBeInTheDocument();
    expect(within(btcCard).getByText('Slippage: 0.52%')).toBeInTheDocument();

    // Losing SOL trade renders negative P/L for both sides
    const solCard = screen.getByText('SOL/USDT').closest('.rounded-2xl') as HTMLElement;
    expect(within(solCard).getByText('$-40')).toBeInTheDocument();
    expect(within(solCard).getByText('$-43')).toBeInTheDocument();
  });

  it('should show cost attribution items and total on the costs tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />);

    await user.click(screen.getByRole('tab', { name: 'Chi phí' }));

    expect(screen.getByText('Phân bổ chi phí')).toBeInTheDocument();
    ['Trading Fees', 'Performance Fee', 'Slippage', 'Platform Fee'].forEach((name) =>
      expect(screen.getByText(name)).toBeInTheDocument(),
    );
    expect(screen.getByText('$125')).toBeInTheDocument();
    expect(screen.getByText('$65')).toBeInTheDocument();
    expect(screen.getByText('$95')).toBeInTheDocument();
    expect(screen.getByText('$5')).toBeInTheDocument();
    expect(screen.getByText('Tổng chi phí')).toBeInTheDocument();
    expect(screen.getByText('$290')).toBeInTheDocument();
  });

  it('should show gross → net return impact on the costs tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />);

    await user.click(screen.getByRole('tab', { name: 'Chi phí' }));

    expect(screen.getByText('Ảnh hưởng đến lợi nhuận')).toBeInTheDocument();
    expect(screen.getByText('Return gross')).toBeInTheDocument();
    expect(screen.getByText('+18.8%')).toBeInTheDocument();
    expect(screen.getByText('- Chi phí (5.8%)')).toBeInTheDocument();
    expect(screen.getByText('-5.8%')).toBeInTheDocument();
    expect(screen.getByText('Return net')).toBeInTheDocument();
    // Net +13.0% appears both in the summary card and here
    expect(screen.getAllByText('+13.0%').length).toBe(2);
  });

  it('should show risk-adjusted metric pairs on the metrics tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />);

    await user.click(screen.getByRole('tab', { name: 'Metrics' }));

    expect(screen.getByText('Metrics điều chỉnh rủi ro')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    expect(screen.getByText('1.82')).toBeInTheDocument();
    expect(screen.getByText('2.15')).toBeInTheDocument();
    expect(screen.getByText('Max Drawdown')).toBeInTheDocument();
    expect(screen.getByText('-8.50')).toBeInTheDocument();
    expect(screen.getByText('-6.20')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('62.50%')).toBeInTheDocument();
    expect(screen.getByText('68.30%')).toBeInTheDocument();
    expect(screen.getByText('Avg Win/Loss')).toBeInTheDocument();
    expect(screen.getByText('1.42')).toBeInTheDocument();
    expect(screen.getByText('1.68')).toBeInTheDocument();
  });

  it('should explain why your metrics are lower', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyPerformancePage />);

    await user.click(screen.getByRole('tab', { name: 'Metrics' }));

    expect(screen.getByText('Tại sao metrics của bạn thấp hơn?')).toBeInTheDocument();
    expect(
      screen.getByText(/Slippage và execution delay làm giảm Sharpe Ratio và tăng Max Drawdown/i),
    ).toBeInTheDocument();
  });
});
