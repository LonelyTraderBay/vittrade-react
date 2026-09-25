/**
 * ══════════════════════════════════════════════════════════════
 *  CopyAuditLogPage.test.tsx — Audit Log Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: a filterable event timeline
 * (7 mock MiFID II audit events), keyword search, per-event trade
 * reconciliation metadata, summary stats and a CSV/PDF/JSON export
 * modal.
 *
 * Test Coverage (8 tests):
 * 1. ✅ Event timeline renders all audit events + compliance notice
 * 2. ✅ Type filter tabs narrow the timeline
 * 3. ✅ Keyword search narrows the timeline / empty result state
 * 4. ✅ Trade events show reconciliation metadata (prices, slippage, P/L)
 * 5. ✅ Config events show old → new value diff
 * 6. ✅ Summary stats section counts event types
 * 7. ✅ Export modal offers CSV/PDF/JSON and exports CSV
 * 8. ✅ Export PDF/JSON work and modal can be cancelled
 *
 * Dropped from the old suite (features no longer exist):
 * - Dedicated reconciliation table tab (replaced by per-event metadata)
 * - Slippage report generator modal
 * - Pagination (the mock timeline is a single flat list)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '@/test/test-utils-navigation';
import { CopyAuditLogPage } from '@/dev/legacy/trading/CopyAuditLogPage';

describe('CopyAuditLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the event timeline with all audit events and compliance notice', () => {
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Header + MiFID II retention notice
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
    expect(screen.getByText('MiFID II Compliant Audit Trail')).toBeInTheDocument();
    expect(screen.getByText(/lưu trữ 5 năm/i)).toBeInTheDocument();

    // All 7 mock event titles
    ['Trade Executed', 'Risk Alert Triggered', 'Stop-Loss Updated', 'Position Closed'].forEach(
      (title) => expect(screen.getByText(title)).toBeInTheDocument(),
    );
    ['Copy Activated', 'Copy Configuration Created', 'Risk Assessment Completed'].forEach((title) =>
      expect(screen.getByText(title)).toBeInTheDocument(),
    );

    // Reverse-chronological timestamps and event details
    expect(screen.getByText('2026-03-08 14:23:15')).toBeInTheDocument();
    expect(screen.getByText('BUY 0.05 BTC @ $67,835 (Provider: $67,800)')).toBeInTheDocument();

    // Type chips: 2 trade, 2 config, 1 risk, 2 system
    expect(screen.getAllByText('trade').length).toBe(2);
    expect(screen.getAllByText('config').length).toBe(2);
    expect(screen.getAllByText('risk').length).toBe(1);
    expect(screen.getAllByText('system').length).toBe(2);
  });

  it('should filter events by type tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Trades tab → only the 2 trade events
    await user.click(screen.getByRole('tab', { name: 'Trades' }));
    await waitFor(() => {
      expect(screen.getAllByText('trade').length).toBe(2);
      expect(screen.queryByText('config')).not.toBeInTheDocument();
      expect(screen.queryByText('Risk Alert Triggered')).not.toBeInTheDocument();
      expect(screen.getByText('Trade Executed')).toBeInTheDocument();
      expect(screen.getByText('Position Closed')).toBeInTheDocument();
    });

    // Risk tab → only the risk alert
    await user.click(screen.getByRole('tab', { name: 'Risk' }));
    await waitFor(() => {
      expect(screen.getByText('Risk Alert Triggered')).toBeInTheDocument();
      expect(screen.queryByText('Trade Executed')).not.toBeInTheDocument();
    });

    // System tab → activation + risk assessment
    await user.click(screen.getByRole('tab', { name: 'System' }));
    await waitFor(() => {
      expect(screen.getByText('Copy Activated')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment Completed')).toBeInTheDocument();
      expect(screen.queryByText('Trade Executed')).not.toBeInTheDocument();
    });
  });

  it('should search events by keyword and show empty result state', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    const searchInput = screen.getByPlaceholderText('Tìm kiếm event, pair, ID...');

    // "ETH" matches only the Position Closed event
    await user.type(searchInput, 'ETH');
    await waitFor(() => {
      expect(screen.getByText('Position Closed')).toBeInTheDocument();
      expect(screen.queryByText('Trade Executed')).not.toBeInTheDocument();
      expect(screen.queryByText('Copy Activated')).not.toBeInTheDocument();
    });

    // Gibberish → no results message
    await user.clear(searchInput);
    await user.type(searchInput, 'xyz-nonexistent');
    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy event phù hợp')).toBeInTheDocument();
    });
  });

  it('should display trade reconciliation metadata on trade events', () => {
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // BTC trade event (amounts rendered via toLocaleString — compute the same way)
    const fmt = (n: number) => `$${n.toLocaleString()}`;
    expect(screen.getAllByText('Provider Price').length).toBe(2); // both trade events
    expect(screen.getByText(fmt(67800))).toBeInTheDocument();
    expect(screen.getByText(fmt(67835))).toBeInTheDocument();
    expect(screen.getByText('0.52%')).toBeInTheDocument();

    // ETH position closed event carries P/L
    expect(screen.getAllByText('Your Price').length).toBe(2);
    expect(screen.getByText(fmt(3848))).toBeInTheDocument();
    expect(screen.getByText('0.31%')).toBeInTheDocument();

    // P/L metadata lives inside the "Position Closed" event card
    const closedEvent = screen.getByText('Position Closed').closest('.rounded-2xl') as HTMLElement;
    expect(within(closedEvent).getByText('P/L')).toBeInTheDocument();
    expect(within(closedEvent).getByText('+$45')).toBeInTheDocument();
  });

  it('should display old → new value diff on config events', () => {
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    expect(screen.getByText('Stop-Loss Updated')).toBeInTheDocument();
    expect(screen.getByText('-15% → -10%')).toBeInTheDocument();
  });

  it('should display summary stats for event types', () => {
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    expect(screen.getByText('Thống kê tổng quan')).toBeInTheDocument();

    // Total Events = 7
    const totalTile = screen.getByText('Total Events').closest('div');
    expect(within(totalTile as HTMLElement).getByText('7')).toBeInTheDocument();

    // Trades = 2, Config Changes = 2, Risk Alerts = 1
    const tradesTile = screen.getByText('Trades', { selector: 'p' }).closest('div');
    expect(within(tradesTile as HTMLElement).getByText('2')).toBeInTheDocument();
    const configTile = screen.getByText('Config Changes').closest('div');
    expect(within(configTile as HTMLElement).getByText('2')).toBeInTheDocument();
    const riskTile = screen.getByText('Risk Alerts').closest('div');
    expect(within(riskTile as HTMLElement).getByText('1')).toBeInTheDocument();
  });

  it('should open export modal and export the audit log as CSV', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // Download icon in the header opens the export modal
    await user.click(screen.getByRole('button', { name: 'Action' }));

    const modal = screen.getByText('Export Audit Log').closest('div.fixed') as HTMLElement;
    expect(modal).not.toBeNull();
    expect(within(modal).getByText('Chọn định dạng export')).toBeInTheDocument();
    expect(within(modal).getByText('Excel-compatible spreadsheet')).toBeInTheDocument();

    await user.click(within(modal).getByRole('button', { name: /CSV/ }));

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('CSV'));
    // Modal closes after export
    await waitFor(() => {
      expect(screen.queryByText('Export Audit Log')).not.toBeInTheDocument();
    });
  });

  it('should export as PDF/JSON and support cancelling the modal', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyAuditLogPage />, {
      initialRoute: '/trade/copy-trading/copy-123/audit',
    });

    // PDF export
    await user.click(screen.getByRole('button', { name: 'Action' }));
    let modal = screen.getByText('Export Audit Log').closest('div.fixed') as HTMLElement;
    await user.click(within(modal).getByRole('button', { name: /PDF/ }));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('PDF'));
    await waitFor(() => {
      expect(screen.queryByText('Export Audit Log')).not.toBeInTheDocument();
    });

    // JSON export
    await user.click(screen.getByRole('button', { name: 'Action' }));
    modal = screen.getByText('Export Audit Log').closest('div.fixed') as HTMLElement;
    await user.click(within(modal).getByRole('button', { name: /JSON/ }));
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('JSON'));
    await waitFor(() => {
      expect(screen.queryByText('Export Audit Log')).not.toBeInTheDocument();
    });

    // Cancel button closes without exporting
    await user.click(screen.getByRole('button', { name: 'Action' }));
    modal = screen.getByText('Export Audit Log').closest('div.fixed') as HTMLElement;
    await user.click(within(modal).getByRole('button', { name: 'Hủy' }));
    expect(window.alert).not.toHaveBeenCalledWith(expect.stringContaining('Hủy'));
    expect(screen.queryByText('Export Audit Log')).not.toBeInTheDocument();
  });
});
