/**
 * ══════════════════════════════════════════════════════════════
 *  CopyProviderDetailPage.test.tsx — Provider Deep Dive Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: ESMA risk banner, provider
 * header with tier/risk badges and equal-prominence ROI vs Max DD,
 * and 4 tab buttons (Tổng quan / Hiệu suất / Chiến lược / Công khai)
 * covering metrics, execution quality, a fee calculator, risk-adjusted
 * ratios, follower distribution, strategy change log and MiFID II
 * disclosures.
 *
 * The provider is resolved from :providerId (COPY_TRADERS ct001…ct005).
 *
 * Test Coverage (12 tests):
 * 1. ✅ ESMA risk warning + provider header with KYC line
 * 2. ✅ Verification tier and risk badges per provider
 * 3. ✅ Key stats give ROI and Max DD equal prominence
 * 4. ✅ Overview tab performance metrics
 * 5. ✅ Execution quality stats
 * 6. ✅ Fee calculator defaults and recalculation
 * 7. ✅ Tab buttons switch content
 * 8. ✅ Performance tab: equity curve, risk-adjusted metrics, followers
 * 9. ✅ Strategy tab: description, change log, trading hours
 * 10. ✅ Disclosure tab: verification, compensation, conflicts, disclaimer
 * 11. ✅ "Đánh giá rủi ro" CTA navigates to assessment; back goes -1
 * 12. ✅ Unknown provider renders the not-found state
 *
 * Dropped from the old suite (features no longer exist):
 * - Related providers section
 * - Responsive viewport behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { Routes, Route } from 'react-router';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { CopyProviderDetailPage } from '../CopyProviderDetailPage';

const ROUTE_PATH = '/trade/copy-provider/:providerId';

function renderPage(providerId = 'ct001') {
  return renderWithRouter(
    <Routes>
      <Route path={ROUTE_PATH} element={<CopyProviderDetailPage />} />
    </Routes>,
    { initialRoute: `/trade/copy-provider/${providerId}` },
  );
}

/** Fee calculator input located by its (non-htmlFor) label. */
function getFeeInput(label: string): HTMLInputElement {
  const wrapper = screen.getByText(label).parentElement as HTMLElement;
  return within(wrapper).getByRole('spinbutton') as HTMLInputElement;
}

describe('CopyProviderDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render ESMA warning and provider header with KYC line', () => {
    renderPage('ct001');

    // ESMA risk warning banner
    expect(screen.getByText('Cảnh báo rủi ro')).toBeInTheDocument();
    expect(
      screen.getByText(/Hiệu suất quá khứ không đảm bảo lợi nhuận tương lai/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/mất toàn bộ vốn đầu tư/i)).toBeInTheDocument();

    // Header + provider identity (name appears in header title and profile h2)
    expect(screen.getAllByText('AlphaHunter_VN').length).toBe(2);
    expect(screen.getByText(/KYC Level 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Real Account/i)).toBeInTheDocument();
    expect(screen.getByText(/Joined Nov 2024/i)).toBeInTheDocument();

    // Past performance disclaimer at the bottom
    expect(
      screen.getByText(/Copy Trading có rủi ro cao\. Chỉ đầu tư số tiền bạn có thể chấp nhận mất/i),
    ).toBeInTheDocument();
  });

  it('should show verification tier and risk badges per provider', () => {
    const { unmount } = renderPage('ct001');
    // 1,243 copiers → Verified; medium risk
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Rủi ro: Trung bình')).toBeInTheDocument();
    expect(screen.getByText('Top ROI')).toBeInTheDocument();
    expect(screen.getByText('Scalper')).toBeInTheDocument();
    unmount();

    renderPage('ct005'); // WhaleWatcher — 4,890 copiers, low risk
    expect(screen.getByText('Pro Trader')).toBeInTheDocument();
    expect(screen.getByText('Rủi ro: Thấp')).toBeInTheDocument();
  });

  it('should give ROI and Max Drawdown equal prominence in key stats', () => {
    renderPage('ct001');

    expect(screen.getByText('Tổng ROI')).toBeInTheDocument();
    expect(screen.getByText('+342.5%')).toBeInTheDocument();
    expect(screen.getByText('Max Drawdown')).toBeInTheDocument();
    expect(screen.getByText('-12.4%')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    expect(screen.getByText('2.31')).toBeInTheDocument();

    // Same tile structure: all three stat labels are present once
    ['Tổng ROI', 'Max Drawdown', 'Sharpe Ratio'].forEach((label) =>
      expect(screen.getAllByText(label).length).toBe(1),
    );
  });

  it('should display performance metrics on the overview tab', () => {
    renderPage('ct001');

    expect(screen.getByText('Chỉ số hiệu suất')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('78.5%')).toBeInTheDocument();
    expect(screen.getByText('Total P/L')).toBeInTheDocument();
    expect(screen.getByText('+$125,430.00')).toBeInTheDocument();
    expect(screen.getByText('Copiers')).toBeInTheDocument();
    expect(screen.getByText('1243 / 2000')).toBeInTheDocument();
    expect(screen.getByText('AUM')).toBeInTheDocument();
    expect(screen.getByText('$2.45M')).toBeInTheDocument();
    expect(screen.getByText('Avg Hold')).toBeInTheDocument();
    expect(screen.getByText('4.2h')).toBeInTheDocument();
    expect(screen.getByText('Total Trades')).toBeInTheDocument();
    // Locale-formatted total trades — compute identically
    expect(screen.getByText((4521).toLocaleString())).toBeInTheDocument();
  });

  it('should display execution quality stats', () => {
    renderPage('ct001');

    expect(screen.getByText('Chất lượng thực thi')).toBeInTheDocument();
    expect(screen.getByText('Dữ liệu từ 200 lệnh gần nhất (30 ngày)')).toBeInTheDocument();
    expect(screen.getByText('Avg Slippage')).toBeInTheDocument();
    expect(screen.getByText('0.08%')).toBeInTheDocument();
    expect(screen.getByText('Exec Delay (P50)')).toBeInTheDocument();
    expect(screen.getByText('0.5s')).toBeInTheDocument();
    expect(screen.getByText('Fill Rate')).toBeInTheDocument();
    expect(screen.getByText('98.5%')).toBeInTheDocument();
    expect(screen.getByText(/72\.5% lệnh có slippage/i)).toBeInTheDocument();
  });

  it('should calculate fees and recalculate when inputs change', async () => {
    const user = userEvent.setup();
    renderPage('ct001');

    expect(screen.getByText('Tính phí dự kiến')).toBeInTheDocument();

    // Defaults: $1,000 at 10% profit
    expect(getFeeInput('Số tiền copy (USD)')).toHaveValue(1000);
    expect(getFeeInput('Lợi nhuận dự kiến (%)')).toHaveValue(10);
    expect(screen.getByText('$1.00')).toBeInTheDocument(); // platform 0.1%
    expect(screen.getByText('$10.00')).toBeInTheDocument(); // performance 10% of profit
    expect(screen.getByText('$2.50')).toBeInTheDocument(); // trading 0.25%
    expect(screen.getByText('$13.50')).toBeInTheDocument(); // total
    expect(screen.getByText('$86.50')).toBeInTheDocument(); // net profit
    expect(screen.getByText(/high-water mark/i)).toBeInTheDocument();

    // Change capital to $5,000
    const amount = getFeeInput('Số tiền copy (USD)');
    await user.clear(amount);
    await user.type(amount, '5000');

    await waitFor(() => {
      expect(screen.getByText('$5.00')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('$12.50')).toBeInTheDocument();
      expect(screen.getByText('$67.50')).toBeInTheDocument(); // total
      expect(screen.getByText('$432.50')).toBeInTheDocument(); // net
    });
  });

  it('should switch content between the 4 tab buttons', async () => {
    const user = userEvent.setup();
    renderPage('ct001');

    ['Tổng quan', 'Hiệu suất', 'Chiến lược', 'Công khai'].forEach((label) =>
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Hiệu suất' }));
    await waitFor(() => {
      expect(screen.getByText('Đường equity (90 ngày)')).toBeInTheDocument();
      expect(screen.queryByText('Chỉ số hiệu suất')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Công khai' }));
    await waitFor(() => {
      expect(screen.getByText('Chi tiết xác minh')).toBeInTheDocument();
      expect(screen.queryByText('Đường equity (90 ngày)')).not.toBeInTheDocument();
    });
  });

  it('should show equity curve, risk-adjusted metrics and follower distribution', async () => {
    const user = userEvent.setup();
    renderPage('ct001');

    await user.click(screen.getByRole('button', { name: 'Hiệu suất' }));

    // Equity curve section with its own disclaimer
    expect(screen.getByText('Đường equity (90 ngày)')).toBeInTheDocument();
    expect(screen.getAllByText(/Hiệu suất quá khứ không đảm bảo kết quả tương lai/i).length).toBe(
      2,
    ); // top banner + chart subtitle

    // Risk-adjusted metrics
    expect(screen.getByText('Chỉ số rủi ro điều chỉnh')).toBeInTheDocument();
    expect(screen.getByText('Sortino Ratio')).toBeInTheDocument();
    expect(screen.getByText('2.87')).toBeInTheDocument();
    expect(screen.getByText('Calmar Ratio')).toBeInTheDocument();
    expect(screen.getByText('27.62')).toBeInTheDocument(); // 342.5 / 12.4
    expect(screen.getByText('Profit Factor')).toBeInTheDocument();
    expect(screen.getByText('2.15')).toBeInTheDocument();
    expect(screen.getAllByText(/Benchmark: > 2\.0 là tốt/).length).toBe(2);

    // Follower distribution
    expect(screen.getByText('Phân bố follower theo vn')).toBeInTheDocument();
    expect(screen.getByText('52 người (21%)')).toBeInTheDocument();
    expect(screen.getByText('89 người (35%)')).toBeInTheDocument();
    expect(screen.getByText('8 người (4%)')).toBeInTheDocument();
  });

  it('should show strategy description, change log and trading hours', async () => {
    const user = userEvent.setup();
    renderPage('ct001');

    await user.click(screen.getByRole('button', { name: 'Chiến lược' }));

    expect(screen.getByText('Mô tả chiến lược')).toBeInTheDocument();
    expect(screen.getByText(/Scalping strategies với focus vào BTC\/USDT/i)).toBeInTheDocument();

    // Change log with 24h notice requirement
    expect(screen.getByText('Lịch sử thay đổi chiến lược')).toBeInTheDocument();
    expect(
      screen.getByText(/Provider phải thông báo trước 24h khi thay đổi chiến lược quan trọng/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Swing Trading → Scalping')).toBeInTheDocument();
    expect(screen.getByText('Market volatility increase')).toBeInTheDocument();
    expect(screen.getByText('Risk level: Medium → High')).toBeInTheDocument();
    expect(screen.getByText('2026-01-15')).toBeInTheDocument();

    // Trading hours
    expect(screen.getByText('Thời gian giao dịch')).toBeInTheDocument();
    expect(screen.getByText('08:00 - 22:00 UTC+7')).toBeInTheDocument();
    expect(screen.getByText('GMT+7 (Vietnam)')).toBeInTheDocument();
    expect(screen.getByText('12-18 trades')).toBeInTheDocument();
  });

  it('should show MiFID II disclosures on the disclosure tab', async () => {
    const user = userEvent.setup();
    renderPage('ct001');

    await user.click(screen.getByRole('button', { name: 'Công khai' }));

    // Verification details
    expect(screen.getByText('Chi tiết xác minh')).toBeInTheDocument();
    expect(screen.getByText('KYC Level')).toBeInTheDocument();
    expect(screen.getAllByText('Level 2 ✓').length).toBeGreaterThan(0);
    expect(screen.getByText('Real Money Trading')).toBeInTheDocument();
    expect(screen.getByText('4 months verified')).toBeInTheDocument();

    // Compensation model
    expect(screen.getByText('Cơ chế thu nhập')).toBeInTheDocument();
    expect(screen.getByText(/MiFID II requires full compensation disclosure/i)).toBeInTheDocument();
    expect(screen.getByText('10% of profit')).toBeInTheDocument();
    expect(screen.getByText('Enabled ✓')).toBeInTheDocument();
    expect(screen.getByText('None disclosed')).toBeInTheDocument();

    // Conflict of interest
    expect(screen.getByText('Xung đột lợi ích')).toBeInTheDocument();
    expect(
      screen.getByText('Provider có thể giữ vị thế trên các tài sản được copy'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Provider không nhận commission từ trading volume của followers'),
    ).toBeInTheDocument();

    // Fiduciary disclaimer
    expect(screen.getByText(/Fiduciary Disclaimer:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Bạn hoàn toàn chịu trách nhiệm cho quyết định đầu tư của mình/i),
    ).toBeInTheDocument();
  });

  it('should navigate to assessment on CTA and back via header', async () => {
    const user = userEvent.setup();
    renderPage('ct001');

    await user.click(screen.getByRole('button', { name: /Đánh giá rủi ro/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-provider/ct001/assessment');
    });

    await user.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should render the not-found state for an unknown provider', () => {
    renderPage('does-not-exist');

    expect(screen.getByText('Provider Not Found')).toBeInTheDocument();
    expect(screen.getByText('Provider không tồn tại')).toBeInTheDocument();
    // No provider stats rendered
    expect(screen.queryByText('Tổng ROI')).not.toBeInTheDocument();
  });
});
