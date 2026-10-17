/**
 * ══════════════════════════════════════════════════════════════
 *  CopyEducationPage.test.tsx — Education Hub Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: a 5-tab educational hub
 * (Cơ chế / Kịch bản / Phí & Chi phí / Sai lầm / Quy định) with an
 * interactive scenario simulator, a fee calculator, a common
 * mistakes guide and regulatory disclosures.
 *
 * Test Coverage (10 tests):
 * 1. ✅ Intro banner + default "Cơ chế" tab renders the 4 steps
 * 2. ✅ Copy modes and key concepts are explained
 * 3. ✅ Tab navigation switches content
 * 4. ✅ Scenario simulator shows provider-vs-you outcomes per scenario
 * 5. ✅ Real-world risk scenarios are listed with impacts
 * 6. ✅ Fee calculator computes fees for defaults
 * 7. ✅ Fee calculator recalculates from inputs
 * 8. ✅ Fee structure breakdown documents all 4 cost types
 * 9. ✅ "Sai lầm" tab lists 10 common mistakes with fixes
 * 10. ✅ "Quy định" tab shows regulatory framework, rights and disclaimer
 *
 * Dropped from the old suite (features no longer exist):
 * - Module progress tracking / mandatory checkpoints / module locking
 * - Quiz questions
 * - Completion certificate and localStorage persistence
 * The page is now a reference hub without gated completion state.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { CopyEducationPage } from './CopyEducationPage';

/** Match a <p> whose full text content contains all given fragments. */
const pContaining =
  (...fragments: string[]) =>
  (_: string, el: Element | null) =>
    el?.tagName === 'P' && fragments.every((f) => (el.textContent ?? '').includes(f));

/** Fee calculator input located by its (non-htmlFor) label. */
function getInputByLabel(label: string): HTMLInputElement {
  const wrapper = screen.getByText(label).parentElement as HTMLElement;
  return within(wrapper).getByRole('spinbutton') as HTMLInputElement;
}

describe('CopyEducationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('explains the profit illustration consistently with the displayed capital outcomes', async () => {
    renderWithRouter(<CopyEducationPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Kịch bản' }));
    expect(screen.getByText('$13000')).toBeInTheDocument();
    expect(screen.getByText('$12760')).toBeInTheDocument();
    expect(
      screen.getByText(pContaining('bạn lời 27.6%', '2.4 điểm phần trăm')),
    ).toBeInTheDocument();
    expect(
      screen.getByText(pContaining('chi phí giả định', 'không phải biểu phí thực tế')),
    ).toBeInTheDocument();
  });

  it('labels both real chart tooltip series and formats the capital axis', async () => {
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 0, 800, 300));
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(800);
    const height = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(300);
    try {
      const { container } = renderWithRouter(<CopyEducationPage />);
      await userEvent.click(screen.getByRole('tab', { name: 'Kịch bản' }));
      await waitFor(() => expect(container.querySelector('.recharts-wrapper')).not.toBeNull());
      expect(screen.getAllByText(/^\$\d+k$/).length).toBeGreaterThan(0);
      fireEvent.mouseMove(container.querySelector('.recharts-wrapper')!, {
        clientX: 450,
        clientY: 100,
      });
      await waitFor(() => {
        const tooltip = container.querySelector('.recharts-tooltip-wrapper') as HTMLElement;
        expect(within(tooltip).getByText('Provider')).toBeInTheDocument();
        expect(within(tooltip).getByText('Bạn')).toBeInTheDocument();
        expect(within(tooltip).getAllByText(/^\$\d+$/)).toHaveLength(2);
      });
    } finally {
      rect.mockRestore();
      width.mockRestore();
      height.mockRestore();
    }
  });

  it('should render intro banner and the 4 how-it-works steps by default', () => {
    renderWithRouter(<CopyEducationPage />);

    expect(screen.getByText('Hướng dẫn Copy Trading')).toBeInTheDocument();
    expect(screen.getByText('Học trước khi đầu tư')).toBeInTheDocument();
    expect(
      screen.getByText(/Trang này giúp bạn hiểu rõ cơ chế, rủi ro và chi phí/i),
    ).toBeInTheDocument();

    // Default tab content
    expect(screen.getByText('Copy Trading hoạt động như thế nào?')).toBeInTheDocument();
    ['Chọn provider', 'Cấu hình sao chép', 'Sao chép tự động', 'Theo dõi & điều chỉnh'].forEach(
      (title) => expect(screen.getByText(title)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/hệ thống tự động sao chép vào tài khoản của bạn trong vòng 0\.5-3 giây/i),
    ).toBeInTheDocument();
  });

  it('should explain copy modes and key concepts', () => {
    renderWithRouter(<CopyEducationPage />);

    expect(screen.getByText('Các chế độ sao chép')).toBeInTheDocument();
    ['Mirror Copy', 'Fixed Ratio', 'Smart Copy'].forEach((mode) =>
      expect(screen.getByText(mode)).toBeInTheDocument(),
    );
    // Pros/cons for each mode (3 each)
    expect(screen.getAllByText(/Đơn giản, rủi ro tương tự provider/i).length).toBe(1);
    expect(screen.getAllByText(/Tối ưu risk-adjusted returns/i).length).toBe(1);

    expect(screen.getByText('Khái niệm quan trọng')).toBeInTheDocument();
    ['Slippage', 'High-Water Mark', 'Position Sizing', 'Execution Delay'].forEach((term) =>
      expect(screen.getByText(term)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Chênh lệch giá giữa lệnh của provider và lệnh của bạn/i),
    ).toBeInTheDocument();
  });

  it('should switch content between tabs', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    // Tabs available
    ['Cơ chế', 'Kịch bản', 'Phí & Chi phí', 'Sai lầm', 'Quy định'].forEach((label) =>
      expect(screen.getByRole('tab', { name: label })).toBeInTheDocument(),
    );

    // Switch to mistakes
    await user.click(screen.getByRole('tab', { name: 'Sai lầm' }));
    await waitFor(() => {
      expect(screen.getByText('10 sai lầm phổ biến')).toBeInTheDocument();
      expect(screen.queryByText('Copy Trading hoạt động như thế nào?')).not.toBeInTheDocument();
    });

    // Switch to fees
    await user.click(screen.getByRole('tab', { name: 'Phí & Chi phí' }));
    await waitFor(() => {
      expect(screen.getByText('Máy tính phí')).toBeInTheDocument();
      expect(screen.queryByText('10 sai lầm phổ biến')).not.toBeInTheDocument();
    });
  });

  it('should simulate provider-vs-you outcomes for each scenario', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Kịch bản' }));

    // Default: profit scenario
    await waitFor(() => {
      expect(screen.getByText(/Kịch bản: Provider lời 30%/i)).toBeInTheDocument();
      // Provider: 10000 + 30×100 = $13,000; You: $12,760; Gap −1.8%
      expect(screen.getByText('$13000')).toBeInTheDocument();
      expect(screen.getByText('$12760')).toBeInTheDocument();
      expect(screen.getByText('-1.8%')).toBeInTheDocument();
      expect(
        screen.getByText(pContaining('chi phí giả định', 'không phải biểu phí thực tế')),
      ).toBeInTheDocument();
    });

    // Loss scenario
    await user.click(screen.getByRole('button', { name: 'Lỗ' }));
    await waitFor(() => {
      expect(screen.getByText(/Kịch bản: Provider lỗ 24%/i)).toBeInTheDocument();
      expect(screen.getByText('$7600')).toBeInTheDocument();
      expect(screen.getByText('$7450')).toBeInTheDocument();
      expect(
        screen.getByText(pContaining('Trong thị trường xấu, bạn có thể lỗ nhiều hơn provider')),
      ).toBeInTheDocument();
    });

    // Slippage scenario
    await user.click(screen.getByRole('button', { name: 'Slippage' }));
    await waitFor(() => {
      expect(screen.getByText(/Kịch bản: Slippage impact 10%/i)).toBeInTheDocument();
      expect(screen.getByText('$11500')).toBeInTheDocument();
      expect(screen.getByText('$11350')).toBeInTheDocument();
      expect(
        screen.getByText(pContaining('nếu provider lời $1500, bạn chỉ lời $1350')),
      ).toBeInTheDocument();
    });
  });

  it('should list real-world risk scenarios with impacts', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Kịch bản' }));

    expect(screen.getByText('Kịch bản thực tế')).toBeInTheDocument();
    [
      'Provider thay đổi chiến lược đột ngột',
      'Flash crash + stop-loss cascade',
      'Provider đóng nền tảng, mở exchange khác',
      'Pump & dump coin nhỏ',
    ].forEach((title) => expect(screen.getByText(title)).toBeInTheDocument());

    expect(screen.getByText('Loss thêm 3-5% do slippage')).toBeInTheDocument();
    expect(screen.getByText('Loss thêm 2% so với provider')).toBeInTheDocument();
    expect(screen.getByText('Followers mua cao, bán thấp')).toBeInTheDocument();
  });

  it('should compute fee calculator results for defaults', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Phí & Chi phí' }));

    // Defaults: $5,000 capital, 15% profit, 50 trades
    expect(getInputByLabel('Số vốn copy (USD)')).toHaveValue(5000);
    expect(getInputByLabel('Lợi nhuận dự kiến (%)')).toHaveValue(15);
    expect(getInputByLabel('Số lượng trades (30 ngày)')).toHaveValue(50);

    await waitFor(() => {
      expect(screen.getByText('$5.00')).toBeInTheDocument(); // platform fee
      expect(screen.getByText('$75.00')).toBeInTheDocument(); // performance fee
      expect(screen.getByText('$25.00')).toBeInTheDocument(); // trading fees
      expect(screen.getByText('$105.00')).toBeInTheDocument(); // total
      expect(screen.getByText('$750.00')).toBeInTheDocument(); // gross profit
      expect(screen.getByText('$645.00')).toBeInTheDocument(); // net profit
      expect(screen.getByText(/Phí thực tế: 14\.0%/i)).toBeInTheDocument();
    });
  });

  it('should recalculate fees when inputs change', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Phí & Chi phí' }));

    const capital = getInputByLabel('Số vốn copy (USD)');
    const profit = getInputByLabel('Lợi nhuận dự kiến (%)');
    const trades = getInputByLabel('Số lượng trades (30 ngày)');

    await user.clear(capital);
    await user.type(capital, '10000');
    await user.clear(profit);
    await user.type(profit, '20');
    await user.clear(trades);
    await user.type(trades, '100');

    // platform $10 + performance $200 + trading $100 = $310; gross $2000; net $1690
    await waitFor(() => {
      expect(screen.getByText('$310.00')).toBeInTheDocument();
      expect(screen.getByText('$2000.00')).toBeInTheDocument();
      expect(screen.getByText('$1690.00')).toBeInTheDocument();
      expect(screen.getByText(/Phí thực tế: 15\.5%/i)).toBeInTheDocument();
    });
  });

  it('should document the fee structure breakdown', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Phí & Chi phí' }));

    expect(screen.getByText('Chi tiết cấu trúc phí')).toBeInTheDocument();

    // All 4 cost types with concrete examples
    expect(screen.getByText('Platform Fee (0.1%)')).toBeInTheDocument();
    expect(screen.getByText('Copy $10,000 → phí $10')).toBeInTheDocument();
    expect(screen.getByText('Performance Fee (10%)')).toBeInTheDocument();
    expect(screen.getByText('Lời $1,000 → phí $100')).toBeInTheDocument();
    expect(screen.getByText('Trading Fee (0.25%)')).toBeInTheDocument();
    expect(
      screen.getByText(/50 trades\/tháng, size trung bình \$2k → phí ~\$25/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Slippage (0.5-2%)')).toBeInTheDocument();
    expect(
      screen.getByText('Provider mua $100, bạn mua $100.50 → slippage $0.50'),
    ).toBeInTheDocument();

    // High-water mark disclosure
    expect(screen.getAllByText(/High-water mark/i).length).toBeGreaterThan(0);
  });

  it('should list 10 common mistakes with reasons and fixes', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Sai lầm' }));

    expect(screen.getByText('10 sai lầm phổ biến')).toBeInTheDocument();

    // All 10 items have a "why" and a "fix"
    expect(screen.getAllByText('Tại sao sai:').length).toBe(10);
    expect(screen.getAllByText('Cách fix:').length).toBe(10);

    // Spot-check the two critical mistakes
    expect(screen.getByText('Chỉ nhìn ROI, không nhìn Max Drawdown')).toBeInTheDocument();
    expect(
      screen.getByText('Chọn provider có Max DD <25%, Win Rate >55%, Sharpe Ratio >1.5'),
    ).toBeInTheDocument();
    expect(screen.getByText('Copy 100% vốn vào 1 provider')).toBeInTheDocument();
    expect(
      screen.getByText('Không copy quá 20% vốn cho 1 provider. Chia đều cho 3-5 providers.'),
    ).toBeInTheDocument();
  });

  it('should show regulatory framework, user rights and disclaimer, and provider CTA', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Quy định' }));

    expect(screen.getByText('Khung pháp lý')).toBeInTheDocument();
    expect(screen.getByText('MiFID II (EU)')).toBeInTheDocument();
    expect(
      screen.getByText('Appropriateness assessment trước khi copy (Art. 25.3)'),
    ).toBeInTheDocument();
    expect(screen.getByText('ESMA Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Local Regulations')).toBeInTheDocument();

    expect(screen.getByText('Quyền lợi của bạn')).toBeInTheDocument();
    expect(screen.getByText('Được cooling-off period để suy nghĩ')).toBeInTheDocument();
    expect(
      screen.getByText('Được dừng copy bất cứ lúc nào (vị thế đang mở sẽ theo provider)'),
    ).toBeInTheDocument();

    // Investment disclaimer (text split by <strong> — match on full paragraph text)
    expect(
      screen.getByText(pContaining('Investment Disclaimer', 'mất toàn bộ vốn đầu tư')),
    ).toBeInTheDocument();

    // CTA navigates to the provider list from any tab
    await user.click(screen.getByRole('button', { name: /Xem danh sách providers/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-trading');
    });
  });
});
