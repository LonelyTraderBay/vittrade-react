/**
 * ══════════════════════════════════════════════════════════════
 *  ProviderGovernancePage.test.tsx — Provider Governance Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (6 tests):
 * 1. ✅ Strategy modification log shown
 * 2. ✅ 24h notice requirement enforced
 * 3. ✅ Follower communication works
 * 4. ✅ Fee waterfall report accurate
 * 5. ✅ Compliance checklist complete
 * 6. ✅ Transparency score displayed
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '../../../test/utils/test-utils';
import { ProviderGovernancePage } from '../ProviderGovernancePage';

describe('ProviderGovernancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display strategy modification log', () => {
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    // Page title
    expect(screen.getByText(/provider governance/i)).toBeInTheDocument();

    // Modification log
    expect(screen.getByText(/strategy modification log/i)).toBeInTheDocument();

    // Recent modifications
    expect(screen.getByText(/march 1.*risk parameters updated/i)).toBeInTheDocument();
    expect(screen.getByText(/feb 15.*max position size increased/i)).toBeInTheDocument();

    // Modification details
    expect(screen.getByText(/max drawdown.*10%.*15%/i)).toBeInTheDocument();
    expect(screen.getByText(/position size.*\$5,000.*\$7,500/i)).toBeInTheDocument();

    // Follower impact
    expect(screen.getByText(/affects.*2,500 followers/i)).toBeInTheDocument();
  });

  it('should enforce 24h notice requirement', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    // Notice requirement banner
    expect(screen.getByText(/24.*hour notice/i)).toBeInTheDocument();
    expect(screen.getByText(/all strategy changes.*24h advance notice/i)).toBeInTheDocument();

    // Upcoming changes section
    expect(screen.getByText(/upcoming changes/i)).toBeInTheDocument();

    // Scheduled change
    expect(screen.getByText(/march 10.*max positions.*20.*25/i)).toBeInTheDocument();
    expect(screen.getByText(/effective in.*18 hours/i)).toBeInTheDocument();

    // Should show countdown
    const countdown = screen.getByText(/18 hours/i);
    expect(countdown).toBeInTheDocument();

    // Past changes should show "Implemented"
    expect(screen.getByText(/implemented/i)).toBeInTheDocument();
  });

  it('should enable follower communication', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    // Communication section
    expect(screen.getByText(/follower communication/i)).toBeInTheDocument();

    // Recent announcements
    expect(screen.getByText(/march 5.*strategy update/i)).toBeInTheDocument();
    expect(screen.getByText(/adjusting risk parameters/i)).toBeInTheDocument();

    // Read announcement
    const viewBtn = screen.getByRole('button', { name: /view announcement/i });
    await user.click(viewBtn);

    // Announcement modal
    await waitFor(() => {
      expect(screen.getByText(/full announcement/i)).toBeInTheDocument();
      expect(screen.getByText(/posted.*march 5/i)).toBeInTheDocument();
    });

    // Should show read receipt count
    expect(screen.getByText(/read by.*1,850.*2,500 followers/i)).toBeInTheDocument();
  });

  it('should display accurate fee waterfall report', () => {
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    // Fee waterfall section
    expect(screen.getByText(/fee waterfall/i)).toBeInTheDocument();

    // Gross profit
    expect(screen.getByText(/gross profit/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10,000/)).toBeInTheDocument();

    // Platform fees (0.1% monthly)
    expect(screen.getByText(/platform fees/i)).toBeInTheDocument();
    expect(screen.getByText(/-\$100/)).toBeInTheDocument();

    // Performance fees (10%)
    expect(screen.getByText(/performance fees/i)).toBeInTheDocument();
    expect(screen.getByText(/-\$1,000/)).toBeInTheDocument();

    // Net to provider
    expect(screen.getByText(/net to provider/i)).toBeInTheDocument();
    expect(screen.getByText(/\$8,900/)).toBeInTheDocument();

    // Transparency note
    expect(screen.getByText(/all fees disclosed.*advance/i)).toBeInTheDocument();
  });

  it('should show complete compliance checklist', () => {
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    // Compliance checklist
    expect(screen.getByText(/compliance checklist/i)).toBeInTheDocument();

    // Checklist items with status
    expect(screen.getByText(/kyc verified/i)).toBeInTheDocument();
    expect(screen.getByText(/2fa enabled/i)).toBeInTheDocument();
    expect(screen.getByText(/disclosure obligations met/i)).toBeInTheDocument();
    expect(screen.getByText(/24h notice compliance/i)).toBeInTheDocument();
    expect(screen.getByText(/fee transparency/i)).toBeInTheDocument();
    expect(screen.getByText(/conflict of interest disclosed/i)).toBeInTheDocument();

    // All should have checkmarks
    const checkmarks = screen.getAllByTestId('check-icon');
    expect(checkmarks.length).toBeGreaterThanOrEqual(6);

    // Compliance score
    expect(screen.getByText(/compliance score.*100%/i)).toBeInTheDocument();
  });

  it('should display transparency score', () => {
    renderWithRouter(<ProviderGovernancePage />, {
      initialRoute: '/trade/copy-provider/provider-123/governance',
    });

    // Transparency score section
    expect(screen.getByText(/transparency score/i)).toBeInTheDocument();

    // Overall score (0-100)
    expect(screen.getByText(/92.*100/)).toBeInTheDocument();
    expect(screen.getByText(/excellent transparency/i)).toBeInTheDocument();

    // Score breakdown
    expect(screen.getByText(/communication frequency/i)).toBeInTheDocument();
    expect(screen.getByText(/95/)).toBeInTheDocument();

    expect(screen.getByText(/disclosure quality/i)).toBeInTheDocument();
    expect(screen.getByText(/98/)).toBeInTheDocument();

    expect(screen.getByText(/response time/i)).toBeInTheDocument();
    expect(screen.getByText(/85/)).toBeInTheDocument();

    // Visual indicator (progress bar)
    const scoreBar = screen.getByRole('progressbar', { name: /transparency/i });
    expect(scoreBar).toBeInTheDocument();
    expect(scoreBar).toHaveAttribute('aria-valuenow', '92');
  });
});
