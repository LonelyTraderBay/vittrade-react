/**
 * ══════════════════════════════════════════════════════════════
 *  DisputeResolutionPage.test.tsx — Dispute Resolution Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: a 3-tab complaint hub
 * (File Complaint / Active Cases / History). The file tab has 5
 * complaint type cards, provider select, subject/description and a
 * gated submit; active cases show a status timeline and escalation;
 * history shows resolved cases with outcomes.
 *
 * Test Coverage (5 tests):
 * 1. ✅ File complaint form renders all fields and gates the CTA
 * 2. ✅ All 5 complaint types offered with descriptions and selection
 * 3. ✅ Submitting a valid complaint succeeds and switches to Active Cases
 * 4. ✅ Active case shows status, timeline and escalation action
 * 5. ✅ History shows the resolved case with refund outcome
 *
 * Dropped from the old suite (features no longer exist):
 * - Modal-based complaint form (now a full-page tab)
 * - Accept/counter-propose resolution actions
 * - Resolution history stats (total / avg resolution time)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent } from '@/test/test-utils-navigation';
import { DisputeResolutionPage } from '../DisputeResolutionPage';

describe('DisputeResolutionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the complete file complaint form with a gated submit', () => {
    renderWithRouter(<DisputeResolutionPage />);

    expect(screen.getByText('Dispute Resolution')).toBeInTheDocument();

    // Fairness notice
    expect(screen.getByText('Fair Dispute Resolution')).toBeInTheDocument();
    expect(screen.getByText(/Most cases are resolved within 48 hours/i)).toBeInTheDocument();

    // Form fields
    expect(screen.getByText('Complaint Type')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brief summary of the issue')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Describe the issue in detail\. Include dates, trade IDs/),
    ).toBeInTheDocument();
    expect(screen.getByText('Upload Evidence (Optional)')).toBeInTheDocument();

    // Provider select offers the mock providers
    const providerSelect = screen.getByRole('combobox');
    expect(screen.getByRole('option', { name: 'Select provider...' })).toBeInTheDocument();
    ['CryptoKing', 'SwingMaster', 'AlgoTrader'].forEach((name) =>
      expect(screen.getByRole('option', { name })).toBeInTheDocument(),
    );
    expect(providerSelect).toHaveValue('');

    // Submit is disabled until the form is complete
    expect(screen.getByRole('button', { name: /submit complaint/i })).toBeDisabled();
  });

  it('should offer 5 complaint types with descriptions and selection state', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DisputeResolutionPage />);

    const expected = [
      ['Execution Issue', 'Slippage, delay, or fill rate problems'],
      ['Fee Discrepancy', 'Incorrect fee calculation or charge'],
      ['Strategy Change Without Notice', 'Provider changed strategy without 24h notice'],
      ['Performance Data Inaccuracy', 'Suspicious or fake performance stats'],
      ['Provider Misconduct', 'Unethical behavior or scam'],
    ];
    expected.forEach(([label, desc]) => {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
      expect(screen.getByText(desc)).toBeInTheDocument();
    });

    // Selecting a type highlights it
    const misconductBtn = screen.getByRole('button', { name: /Provider Misconduct/ });
    expect(misconductBtn).toHaveStyle({ background: '#F3F4F6' }); // unselected
    await user.click(misconductBtn);
    await waitFor(() => {
      expect(misconductBtn).toHaveStyle({ background: '#3B82F622' });
    });
  });

  it('should submit a valid complaint and switch to Active Cases', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DisputeResolutionPage />);

    const submitBtn = screen.getByRole('button', { name: /submit complaint/i });

    // Fill in the full form
    await user.click(screen.getByRole('button', { name: /Execution Issue/ }));
    await user.selectOptions(screen.getByRole('combobox'), 'trader-2');
    await user.type(screen.getByPlaceholderText('Brief summary of the issue'), 'Bad fills');
    await user.type(
      screen.getByPlaceholderText(/Describe the issue in detail/),
      'Slippage was 0.36% on the BTC trade.',
    );

    await waitFor(() => expect(submitBtn).toBeEnabled());

    await user.click(submitBtn);

    // Success feedback and form reset + navigation to Active Cases
    expect(window.alert).toHaveBeenCalledWith(
      'Complaint submitted successfully! You will receive updates via email.',
    );
    await waitFor(() => {
      expect(screen.getByText('Excessive slippage on BTC trade')).toBeInTheDocument();
      // Tab bar becomes visible after leaving the file tab
      expect(screen.getByRole('tab', { name: /file complaint/i })).toBeInTheDocument();
    });
    // The complaint form is no longer rendered on the active tab
    expect(
      screen.queryByPlaceholderText('Brief summary of the issue'),
    ).not.toBeInTheDocument();
  });

  it('should show the active case with status, timeline and escalation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DisputeResolutionPage />);

    // Navigate via the tab bar (visible once away from the file tab)
    // The only path from file tab is submit; simulate by using history tab after
    // submitting is covered above — here switch through tab bar after mount:
    // Mount starts on file tab without tab bar, so drive it through a submit.
    await user.click(screen.getByRole('button', { name: /Fee Discrepancy/ }));
    await user.selectOptions(screen.getByRole('combobox'), 'trader-1');
    await user.type(screen.getByPlaceholderText('Brief summary of the issue'), 'Fee');
    await user.type(screen.getByPlaceholderText(/Describe the issue in detail/), 'Wrong fee.');
    await user.click(screen.getByRole('button', { name: /submit complaint/i }));

    await waitFor(() => {
      expect(screen.getByText('Excessive slippage on BTC trade')).toBeInTheDocument();
    });

    // Case details (badge text is uppercased via CSS)
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Case #case-001')).toBeInTheDocument();
    expect(screen.getByText('Provider: SwingMaster')).toBeInTheDocument();
    expect(
      screen.getByText(/my copy filled at \$68,750 \(0\.36% slippage\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Submitted: 2026-03-06')).toBeInTheDocument();
    expect(screen.getByText('Est. resolution: 2026-03-10')).toBeInTheDocument();

    // Timeline: first two steps done, last two pending
    expect(screen.getByText('Complaint submitted')).toBeInTheDocument();
    expect(screen.getByText('Under review by support team')).toBeInTheDocument();
    expect(screen.getByText('Awaiting provider response')).toBeInTheDocument();
    expect(screen.getByText('Resolution')).toBeInTheDocument();

    // Escalation action (feature stub)
    await user.click(screen.getByRole('button', { name: /escalate to senior support/i }));
    expect(window.alert).toHaveBeenCalledWith('Escalation feature coming soon');
  });

  it('should show the resolved case with refund outcome in History', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DisputeResolutionPage />);

    // Reach the tab bar via a minimal valid submit, then switch to History
    await user.click(screen.getByRole('button', { name: /Fee Discrepancy/ }));
    await user.selectOptions(screen.getByRole('combobox'), 'trader-3');
    await user.type(screen.getByPlaceholderText('Brief summary of the issue'), 'Fee');
    await user.type(screen.getByPlaceholderText(/Describe the issue in detail/), 'Wrong fee.');
    await user.click(screen.getByRole('button', { name: /submit complaint/i }));

    await user.click(screen.getByRole('tab', { name: /history/i }));

    await waitFor(() => {
      expect(screen.getByText('Refund Issued')).toBeInTheDocument();
      expect(screen.getByText('Charged 15% instead of 10%')).toBeInTheDocument();
      expect(screen.getByText('Provider: AlgoTrader')).toBeInTheDocument();
      expect(
        screen.getByText('My profit was $100 but fee charged was $15 instead of $10'),
      ).toBeInTheDocument();
      expect(screen.getByText('Resolved: 2026-02-25')).toBeInTheDocument();
      expect(screen.getByText('✓ $5 refund issued to your account')).toBeInTheDocument();
    });
  });
});
