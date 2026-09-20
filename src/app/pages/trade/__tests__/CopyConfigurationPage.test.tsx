/**
 * ══════════════════════════════════════════════════════════════
 *  CopyConfigurationPage.test.tsx — Configuration Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: capital allocation with
 * portfolio visualizer + quick presets, 3 copy modes (Mirror / Fixed
 * Ratio / Smart), risk override toggles (SL / TP / trailing), a fee
 * preview, live validation messages and a sticky "Xem xác nhận" CTA.
 *
 * The page resolves the provider from the :providerId route param
 * (COPY_TRADERS ids ct001…ct005), so it is rendered inside a
 * matching <Route>.
 *
 * Test Coverage (14 tests):
 * 1. ✅ Provider info card shows resolved provider stats
 * 2. ✅ Conservative defaults load (capital / mode / provider-level limits)
 * 3. ✅ Portfolio allocation visualizer + quick presets
 * 4. ✅ Quick presets update capital and allocation %
 * 5. ✅ All 3 copy modes selectable, summary updates
 * 6. ✅ Mirror mode on high-risk provider shows warning
 * 7. ✅ Fixed ratio slider updates ratio and trade size preview
 * 8. ✅ Stop-loss override toggle exposes input and summary
 * 9. ✅ Take-profit override toggle exposes input and summary
 * 10. ✅ Trailing stop toggle exposes input and info message
 * 11. ✅ Fee preview shows platform/trading/total fees
 * 12. ✅ Fee preview recalculates when capital changes
 * 13. ✅ Validation blocks invalid allocations and disables CTA
 * 14. ✅ "Xem xác nhận" navigates to confirmation with config state
 *
 * Dropped from the old suite (features no longer exist):
 * - Max open positions / max position size inputs
 * - Slippage protection setting
 * - Circuit breaker (daily/total loss limit) settings
 * - sessionStorage persistence of the form
 * (positionSizing state exists in the component but is never rendered)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import { Routes, Route } from 'react-router';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { CopyConfigurationPage } from '../CopyConfigurationPage';

const ROUTE_PATH = '/trade/copy-provider/:providerId/configuration';

function renderPage(providerId = 'ct001') {
  return renderWithRouter(
    <Routes>
      <Route path={ROUTE_PATH} element={<CopyConfigurationPage />} />
    </Routes>,
    { initialRoute: `/trade/copy-provider/${providerId}/configuration` },
  );
}

/** The capital amount input (its label is not htmlFor-associated). */
function getCapitalInput(): HTMLInputElement {
  const wrapper = screen.getByText('Số tiền copy (USD)').parentElement as HTMLElement;
  return within(wrapper).getByRole('spinbutton') as HTMLInputElement;
}

/** Container of one of the risk override cards (title may also appear elsewhere). */
function getRiskCard(title: string): HTMLElement {
  const el = screen
    .getAllByText(title)
    .find((node) => node.closest('div.p-3') !== null);
  return el?.closest('div.p-3') as HTMLElement;
}

describe('CopyConfigurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render provider info card with stats for the routed provider', () => {
    renderPage('ct001'); // AlphaHunter_VN

    expect(screen.getByText('Cấu hình Copy')).toBeInTheDocument();
    expect(screen.getByText('Đang cấu hình copy cho')).toBeInTheDocument();
    expect(screen.getByText('AlphaHunter_VN')).toBeInTheDocument();
    expect(screen.getByText('ROI: +342.5%')).toBeInTheDocument();
    expect(screen.getByText('Max DD: -12.4%')).toBeInTheDocument();
    expect(screen.getByText('Medium Risk')).toBeInTheDocument();
  });

  it('should load conservative default values', () => {
    renderPage();

    // Default capital $5,000 in the input
    expect(getCapitalInput()).toHaveValue(5000);

    // Summary defaults
    expect(screen.getByText('Tóm tắt cấu hình')).toBeInTheDocument();
    expect(screen.getByText('$5000')).toBeInTheDocument();
    expect(screen.getByText('Fixed 50%')).toBeInTheDocument(); // default mode + ratio
    expect(screen.getAllByText('Theo provider').length).toBe(2); // SL + TP
    expect(screen.getByText('Không')).toBeInTheDocument(); // trailing off
  });

  it('should display portfolio allocation visualizer and preset buttons', () => {
    renderPage();

    expect(screen.getByText('Phân bổ portfolio')).toBeInTheDocument();
    expect(screen.getByText('20.0%')).toBeInTheDocument(); // 5000 / 25000
    expect(screen.getByText('Vốn khả dụng: $17000')).toBeInTheDocument();
    expect(screen.getByText('Tổng portfolio: $25000')).toBeInTheDocument();

    // 4 quick presets; 20% ($5000) matches the default capital
    ['5%', '10%', '15%', '20%'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '20%' })).toHaveStyle({
      background: '#3B82F622',
    });
  });

  it('should update capital and allocation when preset clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '10%' }));

    await waitFor(() => {
      expect(getCapitalInput()).toHaveValue(2500);
      expect(screen.getByText('10.0%')).toBeInTheDocument();
      expect(screen.getByText('$2500')).toBeInTheDocument(); // summary
    });
  });

  it('should allow selecting between the 3 copy modes', async () => {
    const user = userEvent.setup();
    renderPage();

    // All three modes listed with their trade-offs
    expect(screen.getByText('Sao chép chính xác tỷ lệ % vị thế của provider')).toBeInTheDocument();
    expect(screen.getByText('Tối ưu risk-adjusted returns')).toBeInTheDocument();

    // Switch to Smart Copy → summary updates and fixed-ratio control disappears
    await user.click(screen.getByRole('button', { name: /Smart Copy/ }));
    const summary = screen.getByText('Tóm tắt cấu hình').closest('.rounded-2xl') as HTMLElement;
    await waitFor(() => {
      expect(within(summary).getByText('Smart Copy')).toBeInTheDocument();
      expect(screen.queryByText('Tỷ lệ sao chép (%)')).not.toBeInTheDocument();
    });

    // Switch to Mirror Copy
    await user.click(screen.getByRole('button', { name: /Mirror Copy/ }));
    await waitFor(() => {
      expect(within(summary).getByText('Mirror Copy')).toBeInTheDocument();
    });
  });

  it('should warn when mirror-copying a high-risk provider', async () => {
    const user = userEvent.setup();
    renderPage('ct003'); // RiskMaster_88 — riskLevel: high

    await user.click(screen.getByRole('button', { name: /Mirror Copy/ }));

    await waitFor(() => {
      expect(
        screen.getByText('Mirror copy với high-risk provider = rủi ro cao'),
      ).toBeInTheDocument();
    });
  });

  it('should update copy ratio via the fixed-ratio slider', async () => {
    const user = userEvent.setup();
    renderPage();

    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('50');
    expect(screen.getByText('Provider mở $1000 → Bạn mở $500')).toBeInTheDocument();

    // jsdom does not implement range keyboard semantics — drive the change event
    fireEvent.change(slider, { target: { value: '75' } });

    await waitFor(() => {
      expect(screen.getByText('Provider mở $1000 → Bạn mở $750')).toBeInTheDocument();
      expect(screen.getByText('Fixed 75%')).toBeInTheDocument();
    });
  });

  it('should expose stop-loss override and reflect it in the summary', async () => {
    const user = userEvent.setup();
    renderPage();

    const card = getRiskCard('Stop-Loss riêng');

    // Hidden until toggled on
    expect(screen.queryByText('Dừng lỗ khi tài khoản giảm (%)')).not.toBeInTheDocument();

    await user.click(within(card).getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Dừng lỗ khi tài khoản giảm (%)')).toBeInTheDocument();
      expect(screen.getByText('Vd: 10% = dừng khi vốn còn $4500')).toBeInTheDocument();
      expect(screen.getByText('-10%')).toBeInTheDocument(); // summary
    });

    // Change to 20% → summary updates. NOTE: the "Vd: 10% ..." example is a
    // hardcoded literal in the page and does not track the entered value —
    // asserted as rendered (see page bug notes).
    const input = within(
      screen.getByText('Dừng lỗ khi tài khoản giảm (%)').parentElement as HTMLElement,
    ).getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '20' } });

    await waitFor(() => {
      expect(screen.getByText('-20%')).toBeInTheDocument();
      expect(screen.getByText('Vd: 10% = dừng khi vốn còn $4500')).toBeInTheDocument();
      expect(screen.queryByText('Vd: 20% = dừng khi vốn còn $4000')).not.toBeInTheDocument();
    });
  });

  it('should expose take-profit override and reflect it in the summary', async () => {
    const user = userEvent.setup();
    renderPage();

    const card = getRiskCard('Take-Profit riêng');
    await user.click(within(card).getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Chốt lời khi tài khoản tăng (%)')).toBeInTheDocument();
      expect(screen.getByText('Vd: 20% = chốt khi vốn lên $6000')).toBeInTheDocument();
      expect(screen.getByText('+20%')).toBeInTheDocument(); // summary
    });
  });

  it('should expose trailing stop and show an info message', async () => {
    const user = userEvent.setup();
    renderPage();

    const card = getRiskCard('Trailing Stop');
    await user.click(within(card).getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Khoảng cách trailing (%)')).toBeInTheDocument();
      expect(
        screen.getByText('Stop-loss tự động di chuyển theo giá, cách đỉnh 5%'),
      ).toBeInTheDocument();

      const summary = screen.getByText('Tóm tắt cấu hình').closest('.rounded-2xl') as HTMLElement;
      expect(within(summary).getByText('5%')).toBeInTheDocument(); // summary value

      // Info-level validation note appears
      expect(
        screen.getByText('Trailing stop giúp bảo vệ lợi nhuận khi thị trường đảo chiều'),
      ).toBeInTheDocument();
    });
  });

  it('should show fee preview for default capital', () => {
    renderPage();

    expect(screen.getByText('Chi phí tháng đầu tiên')).toBeInTheDocument();
    expect(screen.getByText('Platform fee (0.1%)')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument(); // 5000 × 0.1%
    expect(screen.getByText('Trading fees (est. 50 trades)')).toBeInTheDocument();
    expect(screen.getByText('$125.00')).toBeInTheDocument();
    expect(screen.getByText('Tổng phí cố định')).toBeInTheDocument();
    expect(screen.getByText('$130.00')).toBeInTheDocument();

    // Fee transparency disclosures
    expect(screen.getByText('Performance fee (10% of profit)')).toBeInTheDocument();
    expect(screen.getByText('Chỉ tính khi lời')).toBeInTheDocument();
    expect(screen.getByText(/Chưa tính slippage \(0\.5-2%\)/i)).toBeInTheDocument();
  });

  it('should recalculate fees when capital changes', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '10%' })); // $2,500

    await waitFor(() => {
      expect(screen.getByText('$2.50')).toBeInTheDocument(); // platform fee
      expect(screen.getByText('$62.50')).toBeInTheDocument(); // trading fees
      expect(screen.getByText('$65.00')).toBeInTheDocument(); // total
    });
  });

  it('should enforce validation limits and disable the CTA on errors', async () => {
    const user = userEvent.setup();
    renderPage();

    const cta = screen.getByRole('button', { name: /xem xác nhận/i });

    // Default (20% allocation) is valid apart from a concentration warning
    expect(cta).toBeEnabled();
    expect(
      screen.getByText('Phân bổ >15% cho 1 provider tăng rủi ro tập trung'),
    ).toBeInTheDocument();

    // Above the 20% MiFID II per-provider cap → blocking error
    const input = getCapitalInput();
    await user.clear(input);
    await user.type(input, '6000');

    await waitFor(() => {
      expect(
        screen.getByText('Không được copy quá 20% tổng vốn cho 1 provider (MiFID II)'),
      ).toBeInTheDocument();
      expect(cta).toBeDisabled();
    });

    // Below the $100 minimum
    await user.clear(input);
    await user.type(input, '50');
    await waitFor(() => {
      expect(screen.getByText('Số tiền copy tối thiểu là $100')).toBeInTheDocument();
      expect(cta).toBeDisabled();
    });

    // Above available capital
    await user.clear(input);
    await user.type(input, '30000');
    await waitFor(() => {
      expect(screen.getByText('Vốn khả dụng chỉ còn $17000')).toBeInTheDocument();
      expect(cta).toBeDisabled();
    });
  });

  it('should navigate to confirmation with the configured state', async () => {
    const user = userEvent.setup();
    renderPage('ct001');

    await user.click(screen.getByRole('button', { name: /xem xác nhận/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/trade/copy-provider/ct001/confirmation',
        expect.objectContaining({
          state: expect.objectContaining({
            copyCapital: 5000,
            copyMode: 'fixed',
            copyRatio: 50,
            useCustomStopLoss: false,
            useTrailingStop: false,
          }),
        }),
      );
    });
  });
});
