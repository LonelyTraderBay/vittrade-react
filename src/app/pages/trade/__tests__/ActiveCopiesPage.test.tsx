/**
 * ══════════════════════════════════════════════════════════════
 *  ActiveCopiesPage.test.tsx — Real-time Copy Monitoring Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current Vietnamese-localized component which
 * renders three mock copies (AlphaHunter_VN, SteadyGains_Pro active,
 * RiskMaster_88 cooling-off) from COPY_TRADERS.
 *
 * Test Coverage (12 tests):
 * 1. ✅ Renders the copy list with header and provider cards
 * 2. ✅ Portfolio overview aggregates capital / value / total P/L
 * 3. ✅ Per-copy P/L values and profit color-coding
 * 4. ✅ Cooling-off copy shows activation deadline and disabled stop
 * 5. ✅ Expanded card shows recent trades feed
 * 6. ✅ Expanded card shows stats (trades / win rate / copy mode / stop-loss)
 * 7. ✅ Stop copy flow requires typing STOP before confirming
 * 8. ✅ Stop copy modal can be cancelled
 * 9. ✅ "Điều chỉnh" navigates to the copy configuration page
 * 10. ✅ "Xem tất cả" navigates to provider detail page
 * 11. ✅ Header "+" action navigates to the copy trading hub
 * 12. ✅ Tab filters (Tất cả / Đang chạy / Tạm dừng / Lịch sử)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { ActiveCopiesPage } from '../ActiveCopiesPage';

/** Returns the outermost card element for a given provider name. */
function getCard(providerName: string): HTMLElement {
  return screen.getByText(providerName).closest('.rounded-2xl') as HTMLElement;
}

/** Cards start collapsed with a single chevron toggle button. */
async function expandCard(providerName: string) {
  const user = userEvent.setup();
  const card = getCard(providerName);
  await user.click(within(card).getByRole('button'));
  return card;
}

describe('ActiveCopiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the active copies list with provider cards', () => {
    renderWithRouter(<ActiveCopiesPage />);

    // Page header (Vietnamese)
    expect(screen.getByText('Copy đang chạy')).toBeInTheDocument();

    // One card per mock copy
    expect(screen.getByText('AlphaHunter_VN')).toBeInTheDocument();
    expect(screen.getByText('SteadyGains_Pro')).toBeInTheDocument();
    expect(screen.getByText('RiskMaster_88')).toBeInTheDocument();

    // Status badges: 2 running copies + 1 cooling-off
    expect(screen.getByText('Chờ kích hoạt')).toBeInTheDocument();
    expect(within(getCard('AlphaHunter_VN')).getByText('Đang chạy')).toBeInTheDocument();
    expect(within(getCard('SteadyGains_Pro')).getByText('Đang chạy')).toBeInTheDocument();
  });

  it('should display portfolio overview aggregates', () => {
    renderWithRouter(<ActiveCopiesPage />);

    expect(screen.getByText('Tổng quan portfolio')).toBeInTheDocument();

    // 5000 + 3000 + 2000 = $10,000 capital; $10,500 current value
    expect(screen.getByText('Vốn đầu tư')).toBeInTheDocument();
    expect(screen.getByText('$10000')).toBeInTheDocument();
    expect(screen.getByText('Giá trị hiện tại')).toBeInTheDocument();
    expect(screen.getByText('$10500')).toBeInTheDocument();

    // Total P/L = +500 (+5.00%), 2 running copies
    expect(screen.getByText('P/L tổng')).toBeInTheDocument();
    expect(screen.getByText('+$500')).toBeInTheDocument();
    expect(screen.getByText('+5.00%')).toBeInTheDocument();
    expect(screen.getByText('2 active')).toBeInTheDocument();
  });

  it('should display per-copy P/L values with profit color-coding', () => {
    renderWithRouter(<ActiveCopiesPage />);

    const winner = getCard('AlphaHunter_VN');
    expect(within(winner).getByText('$5000')).toBeInTheDocument(); // Vốn
    expect(within(winner).getByText('$5650')).toBeInTheDocument(); // Hiện tại
    expect(within(winner).getByText('+$650')).toBeInTheDocument(); // P/L
    expect(within(winner).getByText('+13.00%')).toBeInTheDocument(); // Return

    const loser = getCard('SteadyGains_Pro');
    // Negative amounts render as "$-150" (literal $ before the signed number)
    expect(within(loser).getByText('$-150')).toBeInTheDocument();
    expect(within(loser).getByText('-5.00%')).toBeInTheDocument();

    // Profitable P/L is rendered in the green palette color
    const pnlElement = within(winner).getByText('+$650');
    expect(pnlElement).toHaveStyle({ color: '#10B981' });

    // Loss is rendered in the red palette color
    expect(within(loser).getByText('$-150')).toHaveStyle({ color: '#EF4444' });
  });

  it('should show cooling-off deadline and disable stop for cooling-off copy', async () => {
    renderWithRouter(<ActiveCopiesPage />);

    const card = await expandCard('RiskMaster_88');

    // Cooling-off until timestamp
    expect(within(card).getByText(/đến 2026-03-09 14:30/)).toBeInTheDocument();

    // Destructive stop action must be disabled while cooling off
    const stopButton = within(card).getByRole('button', { name: /dừng copy/i });
    expect(stopButton).toBeDisabled();
  });

  it('should show recent trades feed when card expanded', async () => {
    renderWithRouter(<ActiveCopiesPage />);

    const card = await expandCard('AlphaHunter_VN');

    expect(within(card).getByText('Trades gần đây')).toBeInTheDocument();
    expect(within(card).getAllByText('BTC/USDT').length).toBe(2); // two BTC trades
    expect(within(card).getByText('ETH/USDT')).toBeInTheDocument();

    // Trade sides, sizes and timestamps
    expect(within(card).getAllByText('sell').length).toBe(1);
    expect(within(card).getAllByText('buy').length).toBe(2);
    expect(within(card).getByText('0.05 @ $68500')).toBeInTheDocument();
    expect(within(card).getByText('2h ago')).toBeInTheDocument();
  });

  it('should show expanded stats: trades, win rate, copy mode and stop-loss', async () => {
    renderWithRouter(<ActiveCopiesPage />);

    const card = await expandCard('AlphaHunter_VN');

    expect(within(card).getByText('Số lượng trades')).toBeInTheDocument();
    expect(within(card).getByText('48')).toBeInTheDocument();
    expect(within(card).getByText('Win rate')).toBeInTheDocument();
    expect(within(card).getByText('62.5%')).toBeInTheDocument();
    expect(within(card).getByText('Copy mode')).toBeInTheDocument();
    expect(within(card).getByText('Fixed 50%')).toBeInTheDocument();
    expect(within(card).getByText('Stop-loss')).toBeInTheDocument();
    expect(within(card).getByText('-10%')).toBeInTheDocument();

    // Mirror copy (SteadyGains_Pro) has no custom stop-loss → falls back to provider
    const mirrorCard = getCard('SteadyGains_Pro');
    await userEvent.setup().click(within(mirrorCard).getByRole('button'));
    expect(within(mirrorCard).getByText('Mirror')).toBeInTheDocument();
    expect(within(mirrorCard).getByText('Provider')).toBeInTheDocument();
  });

  it('should require typing STOP before confirming stop copy', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    const card = await expandCard('AlphaHunter_VN');
    await user.click(within(card).getByRole('button', { name: /dừng copy/i }));

    // Confirmation modal with destructive warning
    const modal = screen.getByText('Dừng copy?').closest('div.fixed') as HTMLElement;
    expect(modal).not.toBeNull();
    expect(
      within(modal).getByText(/Bạn không thể hoàn tác hành động này/i),
    ).toBeInTheDocument();
    // Label text is "Nhập <strong>STOP</strong> để xác nhận" (split by the strong tag)
    expect(
      within(modal).getByText(
        (_, element) =>
          element?.tagName === 'LABEL' && element.textContent === 'Nhập STOP để xác nhận',
      ),
    ).toBeInTheDocument();

    // Summary of what stopping means
    expect(within(modal).getByText('Vị thế đang mở')).toBeInTheDocument();
    expect(within(modal).getByText('Vốn sẽ về ví')).toBeInTheDocument();
    expect(within(modal).getByText('$5650')).toBeInTheDocument();

    // Confirm disabled until "STOP" is typed
    const confirmBtn = within(modal).getByRole('button', { name: 'Dừng copy' });
    expect(confirmBtn).toBeDisabled();

    await user.type(within(modal).getByPlaceholderText('STOP'), 'STOP');
    expect(confirmBtn).toBeEnabled();

    await user.click(confirmBtn);

    // Modal closes after confirming
    await waitFor(() => {
      expect(screen.queryByText('Dừng copy?')).not.toBeInTheDocument();
    });
  });

  it('should close the stop modal without stopping when cancelled', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    const card = await expandCard('AlphaHunter_VN');
    await user.click(within(card).getByRole('button', { name: /dừng copy/i }));

    await user.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(screen.queryByText('Dừng copy?')).not.toBeInTheDocument();
    // Copy card still visible and running
    expect(screen.getByText('AlphaHunter_VN')).toBeInTheDocument();
  });

  it('should navigate to configuration when "Điều chỉnh" clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    const card = await expandCard('AlphaHunter_VN');
    await user.click(within(card).getByRole('button', { name: 'Điều chỉnh' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-provider/trader-1/configuration');
    });
  });

  it('should navigate to provider detail when "Xem tất cả" clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    const card = await expandCard('AlphaHunter_VN');
    await user.click(within(card).getByRole('button', { name: 'Xem tất cả' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-provider/trader-1');
    });
  });

  it('should navigate to copy trading hub from header action', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    await user.click(screen.getByRole('button', { name: 'Action' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-trading');
    });
  });

  it('should filter copies by tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ActiveCopiesPage />);

    // "Tất cả" shows all three copies
    expect(screen.getByRole('tab', { name: /tất cả/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('AlphaHunter_VN')).toBeInTheDocument();
    expect(screen.getByText('SteadyGains_Pro')).toBeInTheDocument();
    expect(screen.getByText('RiskMaster_88')).toBeInTheDocument();

    // "Tạm dừng" has no copies in mock data
    await user.click(screen.getByRole('tab', { name: /tạm dừng/i }));
    await waitFor(() => {
      expect(screen.queryByText('AlphaHunter_VN')).not.toBeInTheDocument();
      expect(screen.queryByText('SteadyGains_Pro')).not.toBeInTheDocument();
    });

    // "Lịch sử" shows the placeholder
    await user.click(screen.getByRole('tab', { name: /lịch sử/i }));
    await waitFor(() => {
      expect(screen.getByText('Lịch sử copy sẽ hiển thị ở đây')).toBeInTheDocument();
    });

    // "Đang chạy" includes running and cooling-off copies
    await user.click(screen.getByRole('tab', { name: /đang chạy/i }));
    await waitFor(() => {
      expect(screen.getByText('AlphaHunter_VN')).toBeInTheDocument();
      expect(screen.getByText('SteadyGains_Pro')).toBeInTheDocument();
      expect(screen.getByText('RiskMaster_88')).toBeInTheDocument();
    });
  });
});
