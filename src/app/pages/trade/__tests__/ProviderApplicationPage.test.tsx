/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderApplicationPage.test.tsx — Provider Application Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current Vietnamese 5-step wizard
 * (intro → requirements → disclosure → fees → review).
 *
 * Test Coverage (8 tests):
 * 1. ✅ Intro step renders benefits, responsibilities, requirements
 * 2. ✅ Requirements step blocks progression until criteria met
 * 3. ✅ Requirement validation messages (KYC, months, capital)
 * 4. ✅ Disclosure step requires both consents (disclosure + fiduciary)
 * 5. ✅ Fee step: performance fee example + 100-char strategy minimum
 * 6. ✅ Review step shows entered data and requires terms acceptance
 * 7. ✅ Submission alerts and navigates back to copy trading list
 * 8. ✅ Header back button uses router history
 *
 * DROPPED from the old suite (features no longer exist on the page):
 * - Clickable stepper with locked steps / lock icons (progress is a passive bar)
 * - Document uploads (trading statement, proof of performance)
 * - localStorage persistence of the application
 * - Confirmation modal before submit (page uses window.alert)
 * - Post-submit success screen (page navigates straight away)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { ProviderApplicationPage } from '../ProviderApplicationPage';

const STRATEGY_100CHARS =
  'Chiến lược swing trading trên BTC/ETH với phân tích kỹ thuật, risk/reward 1:2, stop-loss chặt chẽ, quản lý vốn 2% mỗi giao dịch.';

describe('ProviderApplicationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render intro step with benefits, responsibilities and requirements', () => {
    renderWithRouter(<ProviderApplicationPage />);

    expect(screen.getByText('Đăng ký Provider')).toBeInTheDocument();
    expect(screen.getByText('Trở thành Copy Trading Provider')).toBeInTheDocument();
    expect(
      screen.getByText(/kiếm performance fee từ những người copy bạn/i),
    ).toBeInTheDocument();

    // Benefits
    expect(screen.getByText('Lợi ích')).toBeInTheDocument();
    expect(screen.getByText('Performance Fee')).toBeInTheDocument();
    expect(screen.getByText('Xây dựng danh tiếng')).toBeInTheDocument();
    expect(screen.getByText('Không giới hạn thu nhập')).toBeInTheDocument();

    // Responsibilities warning
    expect(screen.getByText('Trách nhiệm quan trọng')).toBeInTheDocument();
    expect(screen.getByText(/Vi phạm sẽ bị cấm vĩnh viễn và xử lý pháp lý/i)).toBeInTheDocument();

    // Requirements preview
    expect(screen.getByText('Yêu cầu cơ bản')).toBeInTheDocument();
    expect(screen.getByText('KYC Level 2')).toBeInTheDocument();
    expect(screen.getByText('Trading history ≥6 tháng')).toBeInTheDocument();
    expect(screen.getByText('Vốn tối thiểu $10,000')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio >1.0')).toBeInTheDocument();
  });

  it('should block requirements step until all criteria are met', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderApplicationPage />);

    // Intro → Requirements
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    expect(screen.getByText('Kiểm tra điều kiện')).toBeInTheDocument();

    // Nothing satisfied yet → blocked with a summary error
    const nextBtn = screen.getByRole('button', { name: 'Tiếp tục' });
    expect(nextBtn).toBeDisabled();
    expect(
      screen.getByText(/Bạn chưa đáp ứng tất cả các yêu cầu/i),
    ).toBeInTheDocument();

    // Complete KYC
    await user.click(screen.getByRole('button', { name: 'Hoàn thành KYC ngay' }));
    expect(screen.getByRole('button', { name: 'Đã hoàn thành KYC' })).toBeInTheDocument();

    // 6 months of history (default capital $10,000 already passes)
    const monthsInput = screen.getByDisplayValue('0');
    await user.clear(monthsInput);
    await user.type(monthsInput, '8');

    // Error disappears, button enables
    expect(screen.queryByText(/Bạn chưa đáp ứng tất cả các yêu cầu/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();
  });

  it('should show specific validation messages for each requirement', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderApplicationPage />);

    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    expect(screen.getByText('Kiểm tra điều kiện')).toBeInTheDocument();

    // Trading history below 6 months
    const monthsInput = screen.getByDisplayValue('0');
    await user.clear(monthsInput);
    await user.type(monthsInput, '3');
    expect(screen.getByText('Cần ít nhất 6 tháng (hiện tại: 3 tháng)')).toBeInTheDocument();

    // Capital below the $10,000 minimum
    const capitalInput = screen.getByDisplayValue('10000');
    await user.clear(capitalInput);
    await user.type(capitalInput, '5000');
    const missing = 10000 - 5000;
    expect(screen.getByText(`Thiếu $${missing.toLocaleString()}`)).toBeInTheDocument();

    // Still blocked
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeDisabled();

    // Fix both → unblocked
    await user.click(screen.getByRole('button', { name: 'Hoàn thành KYC ngay' }));
    await user.clear(monthsInput);
    await user.type(monthsInput, '6');
    await user.clear(capitalInput);
    await user.type(capitalInput, '15000');

    expect(screen.queryByText(/Cần ít nhất 6 tháng/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Thiếu \$/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();
  });

  it('should require both disclosure and fiduciary consents', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderApplicationPage />);

    // Advance through requirements
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.click(screen.getByRole('button', { name: 'Hoàn thành KYC ngay' }));
    const monthsInput = screen.getByDisplayValue('0');
    await user.clear(monthsInput);
    await user.type(monthsInput, '8');
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Disclosure step
    expect(screen.getByText('Nghĩa vụ công khai')).toBeInTheDocument();
    expect(screen.getByText('Bạn đồng ý công khai')).toBeInTheDocument();

    // The mandated disclosure list
    expect(
      screen.getByText(/Mọi thay đổi chiến lược \(phải thông báo trước 7 ngày\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Conflict of interest \(nếu trade coin mình hold\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Slippage trung bình và execution quality/i)).toBeInTheDocument();

    // Blocked until both consents
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Tôi cam kết công khai tất cả thông tin trên/i }));
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /fiduciary duty/i }));
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();
  });

  it('should configure fee and enforce the 100-char strategy minimum', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderApplicationPage />);

    // Advance through requirements + disclosure
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.click(screen.getByRole('button', { name: 'Hoàn thành KYC ngay' }));
    const monthsInput = screen.getByDisplayValue('0');
    await user.clear(monthsInput);
    await user.type(monthsInput, '8');
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.click(screen.getByRole('button', { name: /Tôi cam kết công khai tất cả thông tin trên/i }));
    await user.click(screen.getByRole('button', { name: /fiduciary duty/i }));
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Fee step
    expect(screen.getByText('Cấu trúc phí')).toBeInTheDocument();
    expect(screen.getByText('Performance Fee (0-30%)')).toBeInTheDocument();

    // Default 10% fee → example payout
    const feeInput = screen.getByDisplayValue('10');
    expect(feeInput).toBeInTheDocument();
    expect(screen.getByText(/Copier lời \$100 → bạn nhận \$10/i)).toBeInTheDocument();

    // Change to 25% → example updates
    await user.clear(feeInput);
    await user.type(feeInput, '25');
    expect(screen.getByText(/bạn nhận \$25/i)).toBeInTheDocument();

    // Strategy description counter starts at 0 → blocked
    expect(screen.getByText('0/100 ký tự')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeDisabled();

    // Write a ≥100 char strategy → unblocked
    const textarea = screen.getByPlaceholderText(/Tôi sử dụng chiến lược swing trading/i);
    await user.type(textarea, STRATEGY_100CHARS);
    expect(STRATEGY_100CHARS.length).toBeGreaterThanOrEqual(100);
    expect(screen.getByText(`${STRATEGY_100CHARS.length}/100 ký tự`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeEnabled();
  });

  it('should review entered data and require terms acceptance before submit', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderApplicationPage />);

    // Full flow to the review step
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.click(screen.getByRole('button', { name: 'Hoàn thành KYC ngay' }));
    const monthsInput = screen.getByDisplayValue('0');
    await user.clear(monthsInput);
    await user.type(monthsInput, '12');
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.click(screen.getByRole('button', { name: /Tôi cam kết công khai tất cả thông tin trên/i }));
    await user.click(screen.getByRole('button', { name: /fiduciary duty/i }));
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    const feeInput = screen.getByDisplayValue('10');
    await user.clear(feeInput);
    await user.type(feeInput, '20');
    await user.type(
      screen.getByPlaceholderText(/Tôi sử dụng chiến lược swing trading/i),
      STRATEGY_100CHARS,
    );
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));

    // Review shows the entered data
    expect(screen.getByText('Xem lại đơn đăng ký')).toBeInTheDocument();
    expect(screen.getByText('Thông tin cơ bản')).toBeInTheDocument();
    expect(screen.getByText('12 tháng')).toBeInTheDocument();
    // Capital kept at its $10,000 default in this flow
    expect(screen.getByText(`$${(10000).toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText(STRATEGY_100CHARS)).toBeInTheDocument();

    // Terms consent lists the three documents
    expect(screen.getByText('Điều khoản Provider')).toBeInTheDocument();
    expect(screen.getByText('Code of Conduct')).toBeInTheDocument();
    expect(screen.getByText('Disclosure Requirements')).toBeInTheDocument();

    // Submit blocked before consent
    const submitBtn = screen.getByRole('button', { name: /Gửi đơn đăng ký/ });
    expect(submitBtn).toBeDisabled();

    // Processing time notice
    expect(screen.getByText(/xem xét đơn trong 2-3 ngày làm việc/i)).toBeInTheDocument();

    // Accept terms → enabled
    await user.click(screen.getByRole('button', { name: /Tôi đã đọc và đồng ý với/i }));
    expect(submitBtn).toBeEnabled();
  });

  it('should submit the application and navigate back to the list', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<ProviderApplicationPage />);

    // Full flow to review
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.click(screen.getByRole('button', { name: 'Hoàn thành KYC ngay' }));
    const monthsInput = screen.getByDisplayValue('0');
    await user.clear(monthsInput);
    await user.type(monthsInput, '12');
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.click(screen.getByRole('button', { name: /Tôi cam kết công khai tất cả thông tin trên/i }));
    await user.click(screen.getByRole('button', { name: /fiduciary duty/i }));
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.type(
      screen.getByPlaceholderText(/Tôi sử dụng chiến lược swing trading/i),
      STRATEGY_100CHARS,
    );
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    await user.click(screen.getByRole('button', { name: /Tôi đã đọc và đồng ý với/i }));

    await user.click(screen.getByRole('button', { name: /Gửi đơn đăng ký/ }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Đơn đăng ký đã được gửi'),
      );
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-trading');
    });

    alertSpy.mockRestore();
  });

  it('should navigate back via the header back button', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderApplicationPage />);

    await user.click(screen.getByRole('button', { name: 'Quay lại' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
