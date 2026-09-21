/**
 * ══════════════════════════════════════════════════════════════
 *  CopyConfirmationPage.test.tsx — Final Confirmation Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: critical risk banner,
 * provider stats, config summary (from navigation state or safe
 * defaults), expandable fee breakdown and 30-day scenario
 * projections, max-loss disclosure, 4 required consent toggles,
 * cooling-off notice, "what happens next" steps and the gated
 * "Xác nhận & Bắt đầu Copy" CTA.
 *
 * The page resolves the provider from :providerId (COPY_TRADERS
 * ct001…ct005) and the configuration from location.state.
 *
 * Test Coverage (10 tests):
 * 1. ✅ Critical risk warning banner (lose-all-capital + past performance)
 * 2. ✅ Provider summary stats
 * 3. ✅ Configuration summary (defaults)
 * 4. ✅ Expandable fee breakdown is itemized with a total
 * 5. ✅ Expandable scenario projections (best / realistic / worst + disclaimer)
 * 6. ✅ Max-loss disclosure without custom stop-loss
 * 7. ✅ Configuration + max-loss reflect navigation state (custom SL)
 * 8. ✅ Cooling-off notice and next steps
 * 9. ✅ All 4 consents are required to enable the CTA
 * 10. ✅ Confirm navigates to active copies; back navigates -1
 *
 * Dropped from the old suite (features no longer exist):
 * - 2FA verification step for first copies
 * - Circuit breaker / max open positions summary rows
 * (ESMA banner content is asserted via the actual Vietnamese texts)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, render, within } from '@testing-library/react';
import { Routes, Route, MemoryRouter } from 'react-router';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { UIProvider } from '@/app/contexts/UIContext';
import { CopyConfirmationPage } from '../CopyConfirmationPage';

const ROUTE_PATH = '/trade/copy-provider/:providerId/confirmation';

function renderPage(providerId = 'ct001') {
  return renderWithRouter(
    <Routes>
      <Route path={ROUTE_PATH} element={<CopyConfirmationPage />} />
    </Routes>,
    { initialRoute: `/trade/copy-provider/${providerId}/confirmation` },
  );
}

/** Match a <p> whose full text content contains all given fragments. */
const pContaining = (...fragments: string[]) => (_: string, el: Element | null) =>
  el?.tagName === 'P' && fragments.every((f) => (el.textContent ?? '').includes(f));

describe('CopyConfirmationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display the critical risk warning banner prominently', () => {
    renderPage();

    expect(screen.getByText('Cảnh báo rủi ro quan trọng')).toBeInTheDocument();

    // "You can lose ALL of the committed $5,000" + past performance disclaimer
    expect(
      screen.getByText(pContaining('mất toàn bộ', '$5000', 'Hiệu suất quá khứ')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(pContaining('Chỉ đầu tư số tiền bạn có thể chấp nhận mất')),
    ).toBeInTheDocument();
  });

  it('should display provider summary stats', () => {
    renderPage('ct001'); // AlphaHunter_VN

    expect(screen.getByText('Bạn sắp copy')).toBeInTheDocument();
    expect(screen.getByText('AlphaHunter_VN')).toBeInTheDocument();
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    expect(screen.getByText('Total ROI')).toBeInTheDocument();
    expect(screen.getByText('+342.5%')).toBeInTheDocument();
    expect(screen.getByText('Max DD')).toBeInTheDocument();
    expect(screen.getByText('-12.4%')).toBeInTheDocument();
    expect(screen.getByText('Sharpe')).toBeInTheDocument();
    expect(screen.getByText('2.31')).toBeInTheDocument();
  });

  it('should display the configuration summary with safe defaults', () => {
    renderPage();

    expect(screen.getByText('Cấu hình')).toBeInTheDocument();
    expect(screen.getByText('Số vốn copy')).toBeInTheDocument();
    const configCard = screen.getByText('Số vốn copy').closest('.rounded-xl') as HTMLElement;
    expect(within(configCard).getByText('$5000')).toBeInTheDocument();
    expect(screen.getByText('Chế độ copy')).toBeInTheDocument();
    expect(within(configCard).getByText('Fixed 50%')).toBeInTheDocument();
    expect(within(configCard).getAllByText('Theo provider').length).toBe(2); // SL + TP
    expect(screen.getByText('Trailing Stop')).toBeInTheDocument();
    expect(within(configCard).getByText('Không')).toBeInTheDocument();
  });

  it('should show an itemized fee breakdown when expanded', async () => {
    const user = userEvent.setup();
    renderPage();

    // Collapsed by default
    expect(screen.queryByText('Tổng phí cố định tháng đầu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Chi phí & Phí/i }));

    await waitFor(() => {
      expect(screen.getByText('Platform fee (0.1%)')).toBeInTheDocument();
      expect(screen.getByText('$5.00')).toBeInTheDocument();
      expect(screen.getByText('Trading fees (est. 50 trades/month)')).toBeInTheDocument();
      expect(screen.getByText('$125.00')).toBeInTheDocument();
      expect(screen.getByText(/0\.25% mỗi lần mở\/đóng lệnh \(\$1\.25\/trade\)/)).toBeInTheDocument();
      expect(screen.getByText('Performance fee (10% of profit)')).toBeInTheDocument();
      expect(screen.getByText('Chỉ khi lời')).toBeInTheDocument();
      expect(screen.getByText('High-water mark: chỉ tính trên profit vượt đỉnh cũ')).toBeInTheDocument();
      expect(screen.getByText('Slippage (ước tính 1.5%)')).toBeInTheDocument();
      expect(screen.getByText('Không phải phí')).toBeInTheDocument();
      expect(screen.getByText('Tổng phí cố định tháng đầu')).toBeInTheDocument();
      expect(screen.getByText('$130.00')).toBeInTheDocument();
    });
  });

  it('should show scenario projections when expanded', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByText('Kịch bản tốt (+15%)')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Kịch bản dự kiến \(30 ngày\)/i }));

    await waitFor(() => {
      // Three scenario cards for $5,000 capital
      expect(screen.getByText('Kịch bản tốt (+15%)')).toBeInTheDocument();
      expect(screen.getByText('Kịch bản thực tế (+5%)')).toBeInTheDocument();
      expect(screen.getByText('Kịch bản xấu (-10%)')).toBeInTheDocument();

      // Optimistic: +$750 gross, -$75 performance fee → +$534 (10.7%) net
      expect(screen.getByText('+$750')).toBeInTheDocument();
      expect(screen.getByText('-$75')).toBeInTheDocument();
      expect(screen.getByText('+$534 (10.7%)')).toBeInTheDocument();

      // Realistic: +$250 gross → +$91 (1.8%) net
      expect(screen.getByText('+$250')).toBeInTheDocument();
      expect(screen.getByText('+$91 (1.8%)')).toBeInTheDocument();

      // Pessimistic: $-500 gross, no performance fee, $-638 (-12.8%) net
      expect(screen.getByText('$-500')).toBeInTheDocument();
      expect(screen.getByText('$0 (chỉ khi lời)')).toBeInTheDocument();
      expect(screen.getByText('$-638 (-12.8%)')).toBeInTheDocument();

      // Disclaimer
      expect(
        screen.getByText(/Đây chỉ là ước tính\. Kết quả thực tế/i),
      ).toBeInTheDocument();
    });
  });

  it('should disclose max loss and warn when no custom stop-loss is set', () => {
    renderPage();

    expect(screen.getByText('Kịch bản mất vốn tối đa')).toBeInTheDocument();
    expect(
      screen.getByText(pContaining('mất toàn bộ $5000', 'drawdown 100%')),
    ).toBeInTheDocument();

    // Extra warning because no custom stop-loss is configured
    expect(screen.getByText(/Bạn chưa đặt stop-loss riêng/i)).toBeInTheDocument();
    expect(screen.getByText(/Max DD -12\.4%/)).toBeInTheDocument();
  });

  it('should reflect configuration passed via navigation state', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/trade/copy-provider/ct001/confirmation',
            state: {
              copyCapital: 10000,
              copyMode: 'smart',
              useCustomStopLoss: true,
              customStopLoss: 20,
              useCustomTakeProfit: true,
              customTakeProfit: 50,
              useTrailingStop: true,
              trailingStopPercent: 7,
            },
          },
        ]}
      >
        <UIProvider>
          <Routes>
            <Route path={ROUTE_PATH} element={<CopyConfirmationPage />} />
          </Routes>
        </UIProvider>
      </MemoryRouter>,
    );

    // Summary reflects the state
    const configCard = screen.getByText('Số vốn copy').closest('.rounded-xl') as HTMLElement;
    expect(within(configCard).getByText('$10000')).toBeInTheDocument();
    expect(within(configCard).getByText('Smart Copy')).toBeInTheDocument();
    expect(within(configCard).getByText('-20%')).toBeInTheDocument();
    expect(within(configCard).getByText('+50%')).toBeInTheDocument();
    expect(within(configCard).getByText('7%')).toBeInTheDocument();

    // Max loss is capped by the custom stop-loss (20% of $10,000)
    expect(
      screen.getByText(pContaining('Với stop-loss 20%', 'mất tối đa $2000')),
    ).toBeInTheDocument();
    // No "missing stop-loss" warning in this configuration
    expect(screen.queryByText(/Bạn chưa đặt stop-loss riêng/i)).not.toBeInTheDocument();
  });

  it('should show cooling-off notice and next steps', () => {
    renderPage();

    expect(screen.getByText('Thời gian suy nghĩ (24h)')).toBeInTheDocument();
    expect(
      screen.getByText(pContaining('24 giờ', 'review lại quyết định')),
    ).toBeInTheDocument();

    expect(screen.getByText('Điều gì xảy ra tiếp theo?')).toBeInTheDocument();
    expect(screen.getByText('Khóa vốn')).toBeInTheDocument();
    expect(screen.getByText('$5000 sẽ được khóa trong tài khoản copy')).toBeInTheDocument();
    expect(screen.getByText('Thời gian chờ')).toBeInTheDocument();
    expect(screen.getByText('24h cooling-off period (chỉ lần đầu)')).toBeInTheDocument();
    expect(screen.getByText('Kích hoạt')).toBeInTheDocument();
    expect(screen.getByText('Theo dõi')).toBeInTheDocument();
    expect(
      screen.getByText('Bạn có thể xem real-time P/L và dừng copy bất cứ lúc nào'),
    ).toBeInTheDocument();
  });

  it('should require all 4 consents before enabling the CTA', async () => {
    const user = userEvent.setup();
    renderPage();

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận & Bắt đầu Copy/i });

    // Initially disabled with helper message (no pre-checked boxes)
    expect(confirmBtn).toBeDisabled();
    expect(
      screen.getByText('Bạn cần đồng ý với tất cả 4 điều khoản để tiếp tục'),
    ).toBeInTheDocument();

    const consents = [
      screen.getByRole('button', { name: /mất toàn bộ vốn đầu tư/i }),
      screen.getByRole('button', { name: /tất cả các khoản phí/i }),
      screen.getByRole('button', { name: /có thể chấp nhận mất hoàn toàn/i }),
      screen.getByRole('button', { name: /Điều khoản sử dụng/i }),
    ];
    expect(consents.length).toBe(4);

    // Agree to the first three — CTA still gated
    await user.click(consents[0]);
    await user.click(consents[1]);
    await user.click(consents[2]);
    expect(confirmBtn).toBeDisabled();
    expect(
      screen.getByText('Bạn cần đồng ý với tất cả 4 điều khoản để tiếp tục'),
    ).toBeInTheDocument();

    // Agree to terms — CTA enables and helper disappears
    await user.click(consents[3]);
    await waitFor(() => {
      expect(confirmBtn).toBeEnabled();
      expect(
        screen.queryByText('Bạn cần đồng ý với tất cả 4 điều khoản để tiếp tục'),
      ).not.toBeInTheDocument();
    });
  });

  it('should navigate to active copies on confirm and go back via header', async () => {
    const user = userEvent.setup();
    renderPage();

    // Complete all consents then confirm
    await user.click(screen.getByRole('button', { name: /mất toàn bộ vốn đầu tư/i }));
    await user.click(screen.getByRole('button', { name: /tất cả các khoản phí/i }));
    await user.click(screen.getByRole('button', { name: /có thể chấp nhận mất hoàn toàn/i }));
    await user.click(screen.getByRole('button', { name: /Điều khoản sử dụng/i }));

    await user.click(screen.getByRole('button', { name: /Xác nhận & Bắt đầu Copy/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-trading/active');
    });

    // Header back button navigates back
    await user.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
