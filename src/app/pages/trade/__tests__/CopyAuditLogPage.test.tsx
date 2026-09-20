/**
 * ══════════════════════════════════════════════════════════════
 *  CopyAuditLogPage.test.tsx — Audit Log Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (8 tests):
 * 1. ✅ Event timeline renders
 * 2. ✅ Filters work (type/provider/date)
 * 3. ✅ Trade reconciliation view accurate
 * 4. ✅ Slippage report generates
 * 5. ✅ Export CSV works
 * 6. ✅ Export PDF works
 * 7. ✅ Export JSON works
 * 8. ✅ Pagination works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '../../../test/utils/test-utils';
import { CopyAuditLogPage } from '../CopyAuditLogPage';

describe('CopyAuditLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render event timeline with all events', () => {
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Timeline header
    expect(screen.getByText(/audit log/i)).toBeInTheDocument();
    expect(screen.getByText(/event timeline/i)).toBeInTheDocument();

    // Event types
    expect(screen.getByText(/copy started/i)).toBeInTheDocument();
    expect(screen.getByText(/trade executed/i)).toBeInTheDocument();
    expect(screen.getByText(/configuration changed/i)).toBeInTheDocument();
    expect(screen.getByText(/circuit breaker triggered/i)).toBeInTheDocument();

    // Timestamps
    expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument();
    expect(screen.getByText(/1 day ago/i)).toBeInTheDocument();

    // Event details
    expect(screen.getByText(/BTCUSDT/)).toBeInTheDocument();
    expect(screen.getByText(/BUY/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.05 BTC/)).toBeInTheDocument();
  });

  it('should filter events by type, provider, and date', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Filter by event type
    const typeFilter = screen.getByLabelText(/event type/i);
    await user.click(typeFilter);

    await waitFor(() => {
      expect(screen.getByText(/trades only/i)).toBeInTheDocument();
    });

    const tradesOption = screen.getByText(/trades only/i);
    await user.click(tradesOption);

    // Should only show trade events
    await waitFor(() => {
      expect(screen.getAllByText(/trade executed/i).length).toBeGreaterThan(0);
      expect(screen.queryByText(/copy started/i)).not.toBeInTheDocument();
    });

    // Filter by date range
    const dateFilter = screen.getByLabelText(/date range/i);
    await user.click(dateFilter);

    const last7Days = screen.getByText(/last 7 days/i);
    await user.click(last7Days);

    // Should filter to last 7 days
    await waitFor(() => {
      const oldEvent = screen.queryByText(/30 days ago/i);
      expect(oldEvent).not.toBeInTheDocument();
    });

    // Filter by provider
    const providerFilter = screen.getByLabelText(/provider/i);
    await user.click(providerFilter);

    const cryptoKing = screen.getByText(/CryptoKing/i);
    await user.click(cryptoKing);

    // Should only show CryptoKing events
    await waitFor(() => {
      const allEvents = screen.getAllByText(/CryptoKing/i);
      expect(allEvents.length).toBeGreaterThan(0);
    });
  });

  it('should display accurate trade reconciliation view', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Switch to Reconciliation tab
    const reconTab = screen.getByRole('tab', { name: /reconciliation/i });
    await user.click(reconTab);

    // Reconciliation table
    await waitFor(() => {
      expect(screen.getByText(/trade reconciliation/i)).toBeInTheDocument();
    });

    // Table headers
    expect(screen.getByText(/provider trade id/i)).toBeInTheDocument();
    expect(screen.getByText(/your trade id/i)).toBeInTheDocument();
    expect(screen.getByText(/provider price/i)).toBeInTheDocument();
    expect(screen.getByText(/your price/i)).toBeInTheDocument();
    expect(screen.getByText(/slippage/i)).toBeInTheDocument();
    expect(screen.getByText(/status/i)).toBeInTheDocument();

    // Sample row
    expect(screen.getByText(/PT-123456/)).toBeInTheDocument(); // Provider trade ID
    expect(screen.getByText(/UT-789012/)).toBeInTheDocument(); // Your trade ID
    expect(screen.getByText(/\$68,500/)).toBeInTheDocument();
    expect(screen.getByText(/\$68,525/)).toBeInTheDocument();
    expect(screen.getByText(/0\.036%/)).toBeInTheDocument();

    // Status indicators
    expect(screen.getByText(/matched/i)).toBeInTheDocument();
  });

  it('should generate slippage report', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Slippage Report button
    const slippageReportBtn = screen.getByRole('button', { name: /slippage report/i });
    expect(slippageReportBtn).toBeInTheDocument();

    await user.click(slippageReportBtn);

    // Report modal
    await waitFor(() => {
      expect(screen.getByText(/slippage analysis report/i)).toBeInTheDocument();
    });

    // Summary metrics
    expect(screen.getByText(/total slippage cost/i)).toBeInTheDocument();
    expect(screen.getByText(/\$45\.20/)).toBeInTheDocument();

    expect(screen.getByText(/average slippage/i)).toBeInTheDocument();
    expect(screen.getByText(/0\.12%/)).toBeInTheDocument();

    // Slippage breakdown by pair
    expect(screen.getByText(/by trading pair/i)).toBeInTheDocument();
    expect(screen.getByText(/BTCUSDT.*0\.08%/)).toBeInTheDocument();
    expect(screen.getByText(/ETHUSDT.*0\.15%/)).toBeInTheDocument();

    // Download report button
    const downloadBtn = screen.getByRole('button', { name: /download report/i });
    expect(downloadBtn).toBeInTheDocument();
  });

  it('should export audit log as CSV', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Export dropdown
    const exportBtn = screen.getByRole('button', { name: /export/i });
    await user.click(exportBtn);

    // CSV option
    await waitFor(() => {
      expect(screen.getByText(/export as csv/i)).toBeInTheDocument();
    });

    const csvBtn = screen.getByRole('button', { name: /export as csv/i });
    await user.click(csvBtn);

    // Should trigger download
    await waitFor(() => {
      expect(screen.getByText(/preparing csv/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/export complete/i)).toBeInTheDocument();
    });

    // Should download file with correct name
    // (In real app, would check download was triggered)
  });

  it('should export audit log as PDF', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Export dropdown
    const exportBtn = screen.getByRole('button', { name: /export/i });
    await user.click(exportBtn);

    // PDF option
    await waitFor(() => {
      expect(screen.getByText(/export as pdf/i)).toBeInTheDocument();
    });

    const pdfBtn = screen.getByRole('button', { name: /export as pdf/i });
    await user.click(pdfBtn);

    // Should show PDF generation progress
    await waitFor(() => {
      expect(screen.getByText(/generating pdf/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/export complete/i)).toBeInTheDocument();
    });
  });

  it('should export audit log as JSON', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Export dropdown
    const exportBtn = screen.getByRole('button', { name: /export/i });
    await user.click(exportBtn);

    // JSON option
    await waitFor(() => {
      expect(screen.getByText(/export as json/i)).toBeInTheDocument();
    });

    const jsonBtn = screen.getByRole('button', { name: /export as json/i });
    await user.click(jsonBtn);

    // Should trigger immediate download (JSON is fast)
    await waitFor(() => {
      expect(screen.getByText(/export complete/i)).toBeInTheDocument();
    });

    // Should include all event fields in JSON
    // (In real app, would validate JSON structure)
  });

  it('should paginate through events', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Pagination controls
    expect(screen.getByText(/showing 1-50 of 250/i)).toBeInTheDocument();

    // Next page button
    const nextBtn = screen.getByRole('button', { name: /next/i });
    expect(nextBtn).toBeInTheDocument();
    expect(nextBtn).not.toBeDisabled();

    await user.click(nextBtn);

    // Should load page 2
    await waitFor(() => {
      expect(screen.getByText(/showing 51-100 of 250/i)).toBeInTheDocument();
    });

    // Previous button should now be enabled
    const prevBtn = screen.getByRole('button', { name: /previous/i });
    expect(prevBtn).not.toBeDisabled();

    await user.click(prevBtn);

    // Should go back to page 1
    await waitFor(() => {
      expect(screen.getByText(/showing 1-50 of 250/i)).toBeInTheDocument();
    });

    // Previous button should be disabled on page 1
    expect(prevBtn).toBeDisabled();

    // Page size selector
    const pageSizeSelect = screen.getByLabelText(/items per page/i);
    await user.click(pageSizeSelect);

    const size100 = screen.getByText(/100/);
    await user.click(size100);

    // Should show 100 items
    await waitFor(() => {
      expect(screen.getByText(/showing 1-100 of 250/i)).toBeInTheDocument();
    });
  });
});
