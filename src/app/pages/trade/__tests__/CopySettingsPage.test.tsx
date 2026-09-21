/**
 * ══════════════════════════════════════════════════════════════
 *  CopySettingsPage.test.tsx — Copy Trading Settings Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: default copy mode/ratio/
 * SL/TP pickers, risk limits (max allocation, max active copies,
 * circuit breaker), notification toggles + channels, emergency
 * contact form, privacy toggle and a save button with feedback.
 *
 * Test Coverage (8 tests):
 * 1. ✅ Default settings render (mode, ratio, SL/TP)
 * 2. ✅ Copy mode selection shows/hides the ratio control
 * 3. ✅ Risk limits render and sliders update values
 * 4. ✅ Circuit breaker toggle shows/hides threshold control
 * 5. ✅ Notification toggles and channel buttons switch state
 * 6. ✅ Emergency contact inputs accept values
 * 7. ✅ Privacy toggle switches portfolio visibility
 * 8. ✅ Save button shows success feedback
 *
 * Dropped from the old suite (features no longer exist):
 * - Reset-to-defaults action
 * - Settings validation errors (no validation in this version)
 * - Auto-stop rules beyond the circuit breaker threshold
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import { renderWithRouter, userEvent } from '@/test/test-utils-navigation';
import { CopySettingsPage } from '../CopySettingsPage';

/** The settings card (div.p-3) containing a given label text. */
function getCard(label: string): HTMLElement {
  return screen.getByText(label).closest('div.p-3') as HTMLElement;
}

describe('CopySettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render default settings with current values', () => {
    renderWithRouter(<CopySettingsPage />);

    expect(screen.getByText('Cài đặt Copy Trading')).toBeInTheDocument();
    expect(screen.getByText('Cài đặt mặc định')).toBeInTheDocument();

    // Copy mode picker with Fixed as the default (primary background)
    expect(screen.getByRole('button', { name: 'Fixed' })).toHaveStyle({
      background: '#3B82F6',
    });
    expect(screen.getByRole('button', { name: 'Mirror' })).not.toHaveStyle({
      background: '#3B82F6',
    });

    // Default ratio 50% with its helper text
    expect(screen.getByText('Copy Ratio mặc định')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Copy 50% position size của provider')).toBeInTheDocument();

    // Default SL -10% and TP +20%
    expect(screen.getByText('Stop-Loss mặc định')).toBeInTheDocument();
    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getByText('Take-Profit mặc định')).toBeInTheDocument();
    expect(screen.getByText('+20%')).toBeInTheDocument();
  });

  it('should show the ratio control only for Fixed mode', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    expect(screen.getByText('Copy Ratio mặc định')).toBeInTheDocument();

    // Switch to Smart → ratio control disappears, Smart highlighted
    await user.click(screen.getByRole('button', { name: 'Smart' }));
    await waitFor(() => {
      expect(screen.queryByText('Copy Ratio mặc định')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Smart' })).toHaveStyle({ background: '#3B82F6' });
    });

    // Back to Mirror → still no ratio control
    await user.click(screen.getByRole('button', { name: 'Mirror' }));
    expect(screen.queryByText('Copy Ratio mặc định')).not.toBeInTheDocument();

    // Back to Fixed → ratio control returns
    await user.click(screen.getByRole('button', { name: 'Fixed' }));
    await waitFor(() => {
      expect(screen.getByText('Copy Ratio mặc định')).toBeInTheDocument();
    });
  });

  it('should render risk limits and update values via sliders', () => {
    renderWithRouter(<CopySettingsPage />);

    expect(screen.getByText('Giới hạn rủi ro')).toBeInTheDocument();

    // Max allocation per provider defaults to 20%
    const allocCard = getCard('Max allocation per provider');
    expect(within(allocCard).getByText('20%')).toBeInTheDocument();
    expect(
      within(allocCard).getByText('Không copy quá X% tổng portfolio vào 1 provider'),
    ).toBeInTheDocument();

    // Max active copies defaults to 5; slider moves it to 8
    const copiesCard = getCard('Max số copy đồng thời');
    expect(within(copiesCard).getByText('5')).toBeInTheDocument();
    const copiesSlider = within(copiesCard).getByRole('slider');
    expect(copiesSlider).toHaveAttribute('min', '1');
    expect(copiesSlider).toHaveAttribute('max', '10');

    // jsdom does not implement range keyboard semantics — drive the change event
    fireEvent.change(copiesSlider, { target: { value: '8' } });
    expect(within(copiesCard).getByText('8')).toBeInTheDocument();
  });

  it('should toggle the circuit breaker and its threshold control', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    const card = getCard('Circuit Breaker');
    expect(
      within(card).getByText(/Tự động dừng TẤT CẢ copy khi tổng portfolio lỗ quá X%/i),
    ).toBeInTheDocument();

    // Enabled by default with a -15% threshold
    expect(within(card).getByText('Ngưỡng kích hoạt')).toBeInTheDocument();
    expect(within(card).getByText('-15%')).toBeInTheDocument();

    // Toggle off → threshold control disappears
    await user.click(within(card).getByRole('button'));
    await waitFor(() => {
      expect(within(card).queryByText('Ngưỡng kích hoạt')).not.toBeInTheDocument();
    });

    // Toggle back on → threshold control returns
    await user.click(within(card).getByRole('button'));
    await waitFor(() => {
      expect(within(card).getByText('Ngưỡng kích hoạt')).toBeInTheDocument();
    });
  });

  it('should toggle notification preferences and channels', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    expect(screen.getByText('Thông báo')).toBeInTheDocument();

    // Four preference rows; first three default on, provider updates off
    const rows = [
      'Trades mới',
      'Thay đổi P/L',
      'Cảnh báo rủi ro',
      'Cập nhật provider',
    ].map((label) => getCard(label));

    expect(within(rows[0]).getByText('Thông báo mỗi khi provider mở/đóng lệnh')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Thông báo khi provider thay đổi chiến lược')).toBeInTheDocument();

    rows.slice(0, 3).forEach((row) => {
      expect(within(row).getByRole('button')).toHaveStyle({ background: '#3B82F6' });
    });
    expect(within(rows[3]).getByRole('button')).toHaveStyle({ background: '#E5E7EB' });

    // Toggle provider updates on
    await user.click(within(rows[3]).getByRole('button'));
    await waitFor(() => {
      expect(within(rows[3]).getByRole('button')).toHaveStyle({ background: '#3B82F6' });
    });

    // Channel buttons (Email + Push) default to highlighted state
    const emailBtn = screen.getByRole('button', { name: /Email/ });
    const pushBtn = screen.getByRole('button', { name: /Push/ });
    expect(emailBtn).toHaveStyle({ background: '#3B82F615' });
    expect(pushBtn).toHaveStyle({ background: '#3B82F615' });

    // Turning off email updates its style
    await user.click(emailBtn);
    await waitFor(() => {
      expect(emailBtn).toHaveStyle({ background: '#F3F4F6' });
    });
  });

  it('should accept emergency contact details', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    expect(screen.getByText('Liên hệ khẩn cấp')).toBeInTheDocument();
    expect(
      screen.getByText(/Người liên hệ khẩn cấp sẽ được thông báo/i),
    ).toBeInTheDocument();

    const email = screen.getByPlaceholderText('emergency@example.com');
    const phone = screen.getByPlaceholderText('+84 xxx xxx xxx');

    await user.type(email, 'guardian@example.com');
    await user.type(phone, '+84 901 234 567');

    expect(email).toHaveValue('guardian@example.com');
    expect(phone).toHaveValue('+84 901 234 567');
  });

  it('should toggle public portfolio visibility', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    const card = getCard('Hiển thị portfolio công khai');
    expect(
      within(card).getByText(/Cho phép người khác xem portfolio copy của bạn/i),
    ).toBeInTheDocument();

    // Off by default
    const toggle = within(card).getByRole('button');
    expect(toggle).toHaveStyle({ background: '#E5E7EB' });

    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveStyle({ background: '#3B82F6' });
    });
  });

  it('should show success feedback after saving', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySettingsPage />);

    const saveBtn = screen.getByRole('button', { name: /Lưu cài đặt/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('Đã lưu!')).toBeInTheDocument();
    });
    // Reverts to the normal label after the 2s feedback window
    await waitFor(
      () => {
        expect(screen.queryByText('Đã lưu!')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByRole('button', { name: /Lưu cài đặt/i })).toBeInTheDocument();
  });
});
