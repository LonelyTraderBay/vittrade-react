/**
 * ══════════════════════════════════════════════════════════════
 *  CopyTradingPage.test.tsx — Hub Page Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Test Coverage (10 tests):
 * 1. ✅ Page renders without crashing
 * 2. ✅ Displays header with correct title
 * 3. ✅ Shows ESMA risk warning banner
 * 4. ✅ Renders provider cards
 * 5. ✅ Shows verification tier badges (Pro Trader / Verified / Basic)
 * 6. ✅ Shows risk level badges (Thấp / Trung bình / Cao)
 * 7. ✅ Sorting by selected option reorders providers
 * 8. ✅ Navigates to provider detail via "Xem chi tiết" CTA
 * 9. ✅ Past performance disclaimer is visible
 * 10. ✅ Hero summary metrics (AUM / Traders / Copiers)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { CopyTradingPage } from '../CopyTradingPage';
import { createMockProviders } from '@/test/mocks/copy-trading-mocks';

describe('CopyTradingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    renderWithRouter(<CopyTradingPage />);
    expect(screen.getAllByText(/copy trading/i).length).toBeGreaterThan(0);
  });

  it('should display header with correct title', () => {
    renderWithRouter(<CopyTradingPage />);

    // Check for header title
    const header = screen.getByText('Copy Trading');
    expect(header).toBeInTheDocument();
  });

  it('should show ESMA risk warning banner', () => {
    renderWithRouter(<CopyTradingPage />);

    // Check for risk warning heading
    expect(screen.getByText(/cảnh báo rủi ro/i)).toBeInTheDocument();

    // Check for ESMA-compliant warning content
    expect(
      screen.getByText(/hiệu suất quá khứ không đảm bảo lợi nhuận tương lai/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/mất toàn bộ vốn đầu tư/i)).toBeInTheDocument();
  });

  it('should render provider cards', () => {
    renderWithRouter(<CopyTradingPage />);

    // Check for provider cards from COPY_TRADERS mock data
    const providerNames = ['AlphaHunter_VN', 'SteadyGains_Pro', 'RiskMaster_88'];

    providerNames.forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('should display verification tier badges', () => {
    renderWithRouter(<CopyTradingPage />);

    // Tier badges derived from copier counts (TIER_THRESHOLDS)
    expect(screen.getAllByText('Pro Trader').length).toBeGreaterThan(0); // > 3000 copiers
    expect(screen.getAllByText('Verified').length).toBeGreaterThan(0); // > 1000 copiers
    expect(screen.getAllByText('Basic').length).toBeGreaterThan(0); // default tier
  });

  it('should display risk level badges', () => {
    renderWithRouter(<CopyTradingPage />);

    // Risk badges shown on every provider card
    expect(screen.getAllByText('Rủi ro: Thấp').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rủi ro: Trung bình').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rủi ro: Cao').length).toBeGreaterThan(0);
  });

  it('should reorder providers when sorting by copier count', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyTradingPage />);

    // Default sort is "Top ROI" → RiskMaster_88 (567.8%) leads
    const html = document.body.textContent ?? '';
    expect(html.indexOf('RiskMaster_88')).toBeLessThan(html.indexOf('WhaleWatcher'));

    // Switch to "Nhiều copier" → WhaleWatcher (4890 copiers) leads
    const sortChip = screen.getByRole('button', { name: 'Nhiều copier' });
    await user.click(sortChip);

    await waitFor(() => {
      const sortedHtml = document.body.textContent ?? '';
      expect(sortedHtml.indexOf('WhaleWatcher')).toBeLessThan(sortedHtml.indexOf('RiskMaster_88'));
    });
  });

  it('should navigate to provider detail on CTA click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyTradingPage />);

    // Find "Xem chi tiết" CTA on each provider card
    const detailButtons = screen.getAllByRole('button', { name: /xem chi tiết/i });
    expect(detailButtons.length).toBeGreaterThan(0);

    // Click the first provider card CTA
    await user.click(detailButtons[0]);

    // Should navigate to provider detail
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/trade/copy-provider/'));
    });
  });

  it('should display past performance disclaimer', () => {
    renderWithRouter(<CopyTradingPage />);

    // Regulatory disclaimer at the bottom of the page
    expect(
      screen.getByText(/hiệu suất quá khứ không đảm bảo kết quả tương lai/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/chỉ số mang tính tham khảo/i)).toBeInTheDocument();
  });

  it('should display hero summary metrics', () => {
    renderWithRouter(<CopyTradingPage />);

    // Hero card aggregate metrics
    expect(screen.getByText(/asset under management/i)).toBeInTheDocument();
    expect(screen.getAllByText('Traders').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Copiers').length).toBeGreaterThan(0);
  });
});
