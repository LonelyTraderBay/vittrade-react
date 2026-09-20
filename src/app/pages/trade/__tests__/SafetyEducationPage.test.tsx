/**
 * ══════════════════════════════════════════════════════════════
 *  SafetyEducationPage.test.tsx — Safety Education Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current Vietnamese 4-tab page
 * (Scams phổ biến / Red Flags / Verification / Report).
 *
 * Test Coverage (6 tests):
 * 1. ✅ Hero + all 5 scam types listed on the default tab
 * 2. ✅ Scam accordion expands to examples & prevention tips
 * 3. ✅ Red flags checklist grouped by severity
 * 4. ✅ Verification tier guide (Pro / Verified / Basic)
 * 5. ✅ Report form fills and submits with confirmation alert
 * 6. ✅ Tab navigation switches between the 4 views
 *
 * DROPPED from the old suite (features no longer exist on the page):
 * - Old scam set (withdrawal restrictions / fee manipulation / front-running)
 * - Acknowledgment checkboxes on the red-flag list
 * - Trust-level labels, external resource links, knowledge quiz,
 *   key takeaways section.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { SafetyEducationPage } from '../SafetyEducationPage';

describe('SafetyEducationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all 5 common scam types on the default tab', () => {
    renderWithRouter(<SafetyEducationPage />);

    // Header + hero
    expect(screen.getByText('An toàn & Bảo mật')).toBeInTheDocument();
    expect(screen.getByText('Bảo vệ bản thân khỏi scams')).toBeInTheDocument();
    expect(
      screen.getByText(/Đọc kỹ guide này trước khi copy bất kỳ ai/i),
    ).toBeInTheDocument();

    // Intro count line + all five scam titles
    expect(screen.getByText(/5 loại scam phổ biến trong copy trading/i)).toBeInTheDocument();
    expect(screen.getByText('Hứa hẹn lợi nhuận đảm bảo')).toBeInTheDocument();
    expect(screen.getByText('Giả mạo hiệu suất')).toBeInTheDocument();
    expect(screen.getByText('Pump & Dump scheme')).toBeInTheDocument();
    expect(screen.getByText('Giả danh trader nổi tiếng')).toBeInTheDocument();
    expect(screen.getByText('Exit Scam', { exact: true })).toBeInTheDocument();

    // Short description visible for each collapsed card
    expect(screen.getByText(/Provider hứa "đảm bảo 100% lời"/i)).toBeInTheDocument();
    expect(screen.getByText(/edit screenshots hoặc chọn lọc trades/i)).toBeInTheDocument();

    // Examples are hidden until expanded
    expect(screen.queryByText(/Trade altcoin volume thấp/i)).not.toBeInTheDocument();
  });

  it('should expand a scam card to show examples and avoidance tips', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SafetyEducationPage />);

    await user.click(screen.getByRole('button', { name: /Pump & Dump scheme/ }));

    // Examples section
    expect(screen.getByText('Ví dụ:', { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/Trade altcoin volume thấp/i)).toBeInTheDocument();
    expect(screen.getByText(/Provider sell ngay sau khi followers buy/i)).toBeInTheDocument();

    // Prevention tips
    expect(screen.getByText('Cách tránh:', { exact: true })).toBeInTheDocument();
    expect(screen.getByText(/Kiểm tra Conflict of Interest disclosure/i)).toBeInTheDocument();
    expect(screen.getByText(/Đọc trade history trước khi copy/i)).toBeInTheDocument();

    // Collapsing hides the detail again
    await user.click(screen.getByRole('button', { name: /Pump & Dump scheme/ }));
    expect(screen.queryByText('Ví dụ:', { exact: true })).not.toBeInTheDocument();
  });

  it('should display the red flags checklist grouped by severity', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SafetyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Red Flags' }));

    // Guidance intro
    expect(screen.getByText(/≥2 red flags nghiêm trọng, KHÔNG nên copy/i)).toBeInTheDocument();

    // Three severity groups
    expect(screen.getByText('🚨 Critical (Tuyệt đối không copy)')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Warning (Cần thận trọng)')).toBeInTheDocument();
    expect(screen.getByText('ℹ️ Caution (Kiểm tra kỹ)')).toBeInTheDocument();

    // Critical flags
    expect(screen.getByText(/ROI quá cao so với risk \(>100% với DD <10%\)/i)).toBeInTheDocument();
    expect(screen.getByText('Tất cả trades đều lời (win rate 100%)')).toBeInTheDocument();
    expect(screen.getByText(/Hứa lợi nhuận cố định \(VD: 5% mỗi tuần\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Chắc chắn là scam/i)).toBeInTheDocument();

    // Warning flags
    expect(screen.getByText('Không công khai Max Drawdown')).toBeInTheDocument();
    expect(screen.getByText(/Có thể đang chuẩn bị pump & dump/i)).toBeInTheDocument();

    // Caution flags
    expect(screen.getByText('Sample size quá nhỏ (<50 trades)')).toBeInTheDocument();
    expect(screen.getByText(/Có thể may mắn ngắn hạn/i)).toBeInTheDocument();
  });

  it('should show the verification tier guide', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SafetyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Verification' }));

    // Intro: what verification protects against
    expect(screen.getByText(/Provider verified đã qua kiểm tra KYC/i)).toBeInTheDocument();

    // Three tiers with their requirement lists
    expect(screen.getByText('Verification Tiers')).toBeInTheDocument();
    expect(screen.getAllByText('Pro').length).toBeGreaterThan(0);
    expect(screen.getByText('Verified', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('Basic', { exact: true })).toBeInTheDocument();

    expect(screen.getByText(/KYC Level 2 \(ID \+ Selfie \+ PoA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Vốn tối thiểu \$50,000/)).toBeInTheDocument();
    expect(screen.getByText(/Sharpe Ratio >1\.5/)).toBeInTheDocument();
    expect(screen.getByText(/Vốn tối thiểu \$10,000/)).toBeInTheDocument();
    expect(screen.getByText(/KYC Level 1 \(Email \+ Phone\)/i)).toBeInTheDocument();
    expect(screen.getByText(/KHÔNG khuyến nghị copy/)).toBeInTheDocument();

    // Caveat: verification is not a performance guarantee
    expect(
      screen.getByText(/KHÔNG đảm bảo provider sẽ tiếp tục thành công trong tương lai/i),
    ).toBeInTheDocument();
  });

  it('should fill and submit the report provider form', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<SafetyEducationPage />);

    await user.click(screen.getByRole('tab', { name: 'Report' }));

    // When to report
    expect(screen.getByText('Khi nào nên report?')).toBeInTheDocument();
    expect(screen.getByText(/Provider hứa lợi nhuận đảm bảo/i)).toBeInTheDocument();
    expect(screen.getByText(/hành vi market manipulation/i)).toBeInTheDocument();

    // Form fields (labels are not linked via htmlFor — use placeholders)
    expect(screen.getByText('Report Provider')).toBeInTheDocument();
    const providerInput = screen.getByPlaceholderText(/CryptoKing hoặc trader-1/);
    const reasonSelect = screen.getByRole('combobox');
    const detailInput = screen.getByPlaceholderText(/Mô tả chi tiết vấn đề/i);

    await user.type(providerInput, 'SuspiciousProvider');
    await user.selectOptions(reasonSelect, 'Fake performance');
    await user.type(detailInput, 'Screenshots do not match verified stats.');
    expect(reasonSelect).toHaveValue('Fake performance');

    // Submit → confirmation alert
    await user.click(screen.getByRole('button', { name: 'Submit Report' }));
    expect(alertSpy).toHaveBeenCalledWith(
      'Report submitted! Team sẽ review trong 24-48h.',
    );

    // False-report warning
    expect(screen.getByText(/Reports giả mạo có thể dẫn đến tài khoản của bạn bị khóa/i)).toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it('should support tab navigation between the four views', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SafetyEducationPage />);

    // 4 tabs, Scams active by default
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    const scamsTab = screen.getByRole('tab', { name: 'Scams phổ biến' });
    expect(scamsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Exit Scam', { exact: true })).toBeInTheDocument();

    // Red Flags
    await user.click(screen.getByRole('tab', { name: 'Red Flags' }));
    await waitFor(() => {
      expect(screen.getByText('🚨 Critical (Tuyệt đối không copy)')).toBeInTheDocument();
    });
    expect(screen.queryByText('Exit Scam', { exact: true })).not.toBeInTheDocument();

    // Verification
    await user.click(screen.getByRole('tab', { name: 'Verification' }));
    await waitFor(() => {
      expect(screen.getByText('Verification Tiers')).toBeInTheDocument();
    });

    // Report
    await user.click(screen.getByRole('tab', { name: 'Report' }));
    await waitFor(() => {
      expect(screen.getByText('Report Provider')).toBeInTheDocument();
    });
    expect(scamsTab).toHaveAttribute('aria-selected', 'false');

    // Header back button uses router history
    await user.click(screen.getByRole('button', { name: 'Quay lại' }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
