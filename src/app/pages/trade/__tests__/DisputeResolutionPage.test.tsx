/**
 * ══════════════════════════════════════════════════════════════
 *  DisputeResolutionPage.test.tsx — Dispute Resolution Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (4 tests):
 * 1. ✅ File complaint form complete
 * 2. ✅ 5 complaint types available
 * 3. ✅ Case tracking timeline accurate
 * 4. ✅ Resolution history accessible
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent } from '../../../test/utils/test-utils';
import { DisputeResolutionPage } from '../DisputeResolutionPage';

describe('DisputeResolutionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have complete file complaint form', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DisputeResolutionPage />);

    // Page title
    expect(screen.getByText(/dispute resolution/i)).toBeInTheDocument();

    // File complaint button
    const fileBtn = screen.getByRole('button', { name: /file complaint/i });
    expect(fileBtn).toBeInTheDocument();

    await user.click(fileBtn);

    // Complaint form modal
    await waitFor(() => {
      expect(screen.getByText(/file a complaint/i)).toBeInTheDocument();
    });

    // Form fields
    expect(screen.getByLabelText(/complaint type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/provider name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/evidence/i)).toBeInTheDocument();

    // Fill in form
    const typeSelect = screen.getByLabelText(/complaint type/i);
    await user.click(typeSelect);
    await user.click(screen.getByText(/performance discrepancy/i));

    const providerInput = screen.getByLabelText(/provider name/i);
    await user.type(providerInput, 'CryptoKing');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Reported returns do not match my actual results.');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit complaint/i });
    await user.click(submitBtn);

    // Confirmation
    await waitFor(() => {
      expect(screen.getByText(/complaint submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/case.*#CP-\d+/i)).toBeInTheDocument();
      expect(screen.getByText(/review within 2-3 business days/i)).toBeInTheDocument();
    });
  });

  it('should offer 5 complaint types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DisputeResolutionPage />);

    // Open file complaint
    const fileBtn = screen.getByRole('button', { name: /file complaint/i });
    await user.click(fileBtn);

    // Open complaint type dropdown
    const typeSelect = screen.getByLabelText(/complaint type/i);
    await user.click(typeSelect);

    // 5 complaint types
    await waitFor(() => {
      expect(screen.getByText(/performance discrepancy/i)).toBeInTheDocument();
      expect(screen.getByText(/unauthorized trades/i)).toBeInTheDocument();
      expect(screen.getByText(/fee disputes/i)).toBeInTheDocument();
      expect(screen.getByText(/communication issues/i)).toBeInTheDocument();
      expect(screen.getByText(/strategy violations/i)).toBeInTheDocument();
    });

    // Each type should have description
    const perfDiscrepancy = screen.getByText(/performance discrepancy/i).closest('div');
    expect(within(perfDiscrepancy!).getByText(/reported.*not match/i)).toBeInTheDocument();
  });

  it('should display accurate case tracking timeline', () => {
    renderWithRouter(<DisputeResolutionPage />, {
      initialRoute: '/trade/copy-trading/dispute/CP-12345',
    });

    // Case details
    expect(screen.getByText(/case.*#CP-12345/i)).toBeInTheDocument();
    expect(screen.getByText(/performance discrepancy/i)).toBeInTheDocument();

    // Timeline
    expect(screen.getByText(/case timeline/i)).toBeInTheDocument();

    // Timeline events
    expect(screen.getByText(/complaint filed/i)).toBeInTheDocument();
    expect(screen.getByText(/march 1.*10:30 am/i)).toBeInTheDocument();

    expect(screen.getByText(/under review/i)).toBeInTheDocument();
    expect(screen.getByText(/march 2.*2:15 pm/i)).toBeInTheDocument();

    expect(screen.getByText(/provider response received/i)).toBeInTheDocument();
    expect(screen.getByText(/march 5.*9:45 am/i)).toBeInTheDocument();

    expect(screen.getByText(/resolution proposed/i)).toBeInTheDocument();
    expect(screen.getByText(/march 7.*4:20 pm/i)).toBeInTheDocument();

    // Current status
    expect(screen.getByText(/status.*awaiting your response/i)).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: /accept resolution/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /counter-propose/i })).toBeInTheDocument();
  });

  it('should show resolution history', () => {
    renderWithRouter(<DisputeResolutionPage />);

    // Resolution history tab
    expect(screen.getByText(/resolution history/i)).toBeInTheDocument();

    // Past cases
    expect(screen.getByText(/case.*#CP-10234/i)).toBeInTheDocument();
    expect(screen.getByText(/resolved.*feb 20/i)).toBeInTheDocument();
    expect(screen.getByText(/outcome.*partial refund/i)).toBeInTheDocument();

    expect(screen.getByText(/case.*#CP-09876/i)).toBeInTheDocument();
    expect(screen.getByText(/resolved.*jan 15/i)).toBeInTheDocument();
    expect(screen.getByText(/outcome.*no action/i)).toBeInTheDocument();

    // Stats
    expect(screen.getByText(/total cases.*2/i)).toBeInTheDocument();
    expect(screen.getByText(/resolved.*2/i)).toBeInTheDocument();
    expect(screen.getByText(/avg resolution time.*5 days/i)).toBeInTheDocument();

    // View details buttons
    const viewBtns = screen.getAllByRole('button', { name: /view details/i });
    expect(viewBtns.length).toBeGreaterThanOrEqual(2);
  });
});
