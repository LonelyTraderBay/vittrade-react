/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderGovernancePage.test.tsx — Provider Governance Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current 4-tab page
 * (Modifications / Communication / Fees / Compliance).
 *
 * Test Coverage (6 tests):
 * 1. ✅ Provider dashboard summary stats render
 * 2. ✅ Strategy modification log with 24h notice requirement
 * 3. ✅ Follower communication center lists broadcasts
 * 4. ✅ Performance fee waterfall with high-water mark disclosure
 * 5. ✅ Compliance checklist is complete with score
 * 6. ✅ Broadcast message modal opens, sends, and closes
 *
 * DROPPED from the old suite (features no longer exist on the page):
 * - Upcoming/scheduled changes with countdown ("effective in 18 hours")
 * - View-announcement modal with read receipts
 * - Gross/platform/net fee waterfall amounts (now earnings + contributors)
 * - Transparency score with progressbar
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent } from '@/test/test-utils-navigation';
import { ProviderGovernancePage } from '../ProviderGovernancePage';

describe('ProviderGovernancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display provider dashboard summary stats', () => {
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    expect(screen.getByText('Provider Governance')).toBeInTheDocument();
    expect(screen.getByText('Provider Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Managing 245 followers')).toBeInTheDocument();

    // Stats: AUM, monthly fees, compliance (fee values interpolate raw numbers)
    expect(screen.getByText('AUM')).toBeInTheDocument();
    expect(screen.getByText('$125K')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('$1850')).toBeInTheDocument();
    // "Compliance" appears in the stats card AND as a tab name
    expect(screen.getAllByText('Compliance').length).toBe(2);
    expect(screen.getByText('95/100')).toBeInTheDocument();

    // 4 tabs
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('should show strategy modification log with 24h notice requirement', () => {
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    // 24-hour notice banner (default Modifications tab)
    expect(screen.getByText(/24-Hour Notice Required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/notify all followers at least 24 hours before/i),
    ).toBeInTheDocument();

    // Modification log with the three mock entries
    expect(screen.getByText('Strategy Modification Log')).toBeInTheDocument();
    expect(screen.getByText('strategy change', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('risk level', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('fee structure', { exact: true })).toBeInTheDocument();

    // Old → new value pairs
    expect(screen.getByText('Swing Trading')).toBeInTheDocument();
    expect(screen.getByText('Scalping')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('15% performance fee')).toBeInTheDocument();
    expect(screen.getByText('10% performance fee')).toBeInTheDocument();

    // Follower impact + notification confirmation (shown on every logged mod)
    expect(screen.getByText('245 followers impacted')).toBeInTheDocument();
    expect(screen.getByText('320 followers impacted')).toBeInTheDocument();
    expect(screen.getAllByText('✓ Notification sent 24h before implementation')).toHaveLength(3);

    // Entry point for requesting a modification
    expect(
      screen.getByRole('button', { name: /Request Strategy Modification/i }),
    ).toBeInTheDocument();
  });

  it('should list follower communications on the Communication tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    await user.click(screen.getByRole('tab', { name: 'Communication' }));

    expect(screen.getByText('Follower Communication Center')).toBeInTheDocument();

    // Broadcast CTA
    expect(screen.getAllByText('Broadcast Message').length).toBeGreaterThan(0);
    expect(screen.getByText('Send announcement to all 245 followers')).toBeInTheDocument();

    // The two mock announcements with engagement stats
    expect(
      screen.getByText('Strategy Change Notification: Swing → Scalping'),
    ).toBeInTheDocument();
    expect(screen.getByText('Risk Level Adjustment Notice')).toBeInTheDocument();
    expect(screen.getByText('245 recipients')).toBeInTheDocument();
    expect(screen.getByText('180 recipients')).toBeInTheDocument();
    expect(screen.getByText('78% open rate')).toBeInTheDocument();
    expect(screen.getByText('85% open rate')).toBeInTheDocument();
    expect(screen.getByText('2026-03-04')).toBeInTheDocument();
  });

  it('should display fee waterfall with high-water mark disclosure', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    await user.click(screen.getByRole('tab', { name: 'Fees' }));

    expect(screen.getByText('Performance Fee Waterfall')).toBeInTheDocument();

    // Earnings summary (This Month value also appears in the dashboard card)
    expect(screen.getAllByText('$1850').length).toBe(2);
    expect(screen.getByText('All-Time')).toBeInTheDocument();
    expect(screen.getByText('$12400')).toBeInTheDocument();

    // High-water mark fairness disclosure
    expect(screen.getByText('High-Water Mark System')).toBeInTheDocument();
    expect(
      screen.getByText(/only earn performance fees when followers are in profit/i),
    ).toBeInTheDocument();

    // Top contributors with profit → fee math (10% fee)
    expect(screen.getByText('Top Fee Contributors (This Month)')).toBeInTheDocument();
    expect(screen.getByText('Follower #001')).toBeInTheDocument();
    expect(screen.getByText('Profit: $450 (10% fee)')).toBeInTheDocument();
    expect(screen.getByText('$45')).toBeInTheDocument();
    expect(screen.getByText('Follower #089')).toBeInTheDocument();
    expect(screen.getByText('$25')).toBeInTheDocument();
  });

  it('should show the complete compliance checklist', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    await user.click(screen.getByRole('tab', { name: 'Compliance' }));

    expect(screen.getByText('Compliance Checklist')).toBeInTheDocument();

    // All six obligations with last-check dates
    const items = [
      'KYC verification up-to-date',
      'Risk disclosure accurate',
      'Fee structure transparent',
      'No conflicts of interest undisclosed',
      'Strategy description current',
      'Communication obligations met',
    ];
    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Last check: 2026-0\d-\d{2}/).length).toBe(6);

    // Score card
    expect(screen.getByText('Compliance Score: 95/100')).toBeInTheDocument();
    expect(screen.getByText('Excellent standing — All requirements met')).toBeInTheDocument();
  });

  it('should open the broadcast modal, send a message, and close it', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    await user.click(screen.getByRole('tab', { name: 'Communication' }));
    await user.click(screen.getByRole('button', { name: /Broadcast Message/i }));

    // Modal with subject + message fields (labels are not linked via htmlFor)
    expect(screen.getByText('Send announcement to all followers')).toBeInTheDocument();
    const subjectInput = screen.getByPlaceholderText('e.g., Strategy Change Notification');
    const messageInput = screen.getByPlaceholderText('Enter your message...');
    expect(subjectInput).toBeInTheDocument();
    expect(messageInput).toBeInTheDocument();

    await user.type(subjectInput, 'Strategy update');
    await user.type(messageInput, 'We are adjusting risk parameters.');

    // Send → alert + close
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(alertSpy).toHaveBeenCalledWith('Message sent to all followers!');
    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText('e.g., Strategy Change Notification'),
      ).not.toBeInTheDocument();
    });

    alertSpy.mockRestore();
  });
});
