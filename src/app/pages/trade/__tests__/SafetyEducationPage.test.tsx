/**
 * ══════════════════════════════════════════════════════════════
 *  SafetyEducationPage.test.tsx — Safety Education Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (6 tests):
 * 1. ✅ 5 scam types listed
 * 2. ✅ Red flags checklist complete
 * 3. ✅ Verification tier guide shown
 * 4. ✅ Report form accessible
 * 5. ✅ Tab navigation works
 * 6. ✅ Educational content clear
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { SafetyEducationPage } from '../SafetyEducationPage';

describe('SafetyEducationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list all 5 common scam types', () => {
    renderWithRouter(<SafetyEducationPage />);

    // Page title
    expect(screen.getByText(/safety.*education/i)).toBeInTheDocument();

    // Scam Type 1: Pump and Dump
    expect(screen.getByText(/pump.*dump/i)).toBeInTheDocument();
    expect(screen.getByText(/artificially inflate.*quickly sell/i)).toBeInTheDocument();

    // Scam Type 2: Fake Performance
    expect(screen.getByText(/fake performance/i)).toBeInTheDocument();
    expect(screen.getByText(/doctored screenshots/i)).toBeInTheDocument();

    // Scam Type 3: Withdrawal Restrictions
    expect(screen.getByText(/withdrawal restrictions/i)).toBeInTheDocument();
    expect(screen.getByText(/prevent followers.*withdraw/i)).toBeInTheDocument();

    // Scam Type 4: Fee Manipulation
    expect(screen.getByText(/fee manipulation/i)).toBeInTheDocument();
    expect(screen.getByText(/hidden fees/i)).toBeInTheDocument();

    // Scam Type 5: Front-Running
    expect(screen.getByText(/front-running/i)).toBeInTheDocument();
    expect(screen.getByText(/provider trades before.*followers/i)).toBeInTheDocument();

    // Each scam should have example and prevention tips
    expect(screen.getAllByText(/how to avoid/i).length).toBe(5);
  });

  it('should display complete red flags checklist', () => {
    renderWithRouter(<SafetyEducationPage />);

    // Red flags section
    expect(screen.getByText(/red flags checklist/i)).toBeInTheDocument();

    // Red flag 1: Unrealistic returns
    expect(screen.getByText(/guaranteed.*returns/i)).toBeInTheDocument();
    expect(screen.getByText(/100%.*month/i)).toBeInTheDocument();

    // Red flag 2: No verification
    expect(screen.getByText(/unverified provider/i)).toBeInTheDocument();
    expect(screen.getByText(/refuses to verify/i)).toBeInTheDocument();

    // Red flag 3: Pressure tactics
    expect(screen.getByText(/pressure.*urgency/i)).toBeInTheDocument();
    expect(screen.getByText(/limited.*spots/i)).toBeInTheDocument();

    // Red flag 4: Poor communication
    expect(screen.getByText(/poor communication/i)).toBeInTheDocument();
    expect(screen.getByText(/delays.*responses/i)).toBeInTheDocument();

    // Red flag 5: Frequent strategy changes
    expect(screen.getByText(/frequent.*changes/i)).toBeInTheDocument();

    // Red flag 6: Withdrawal issues
    expect(screen.getByText(/withdrawal.*problems/i)).toBeInTheDocument();

    // Checkboxes for user to acknowledge
    const checkboxes = screen.getAllByRole('checkbox', { name: /acknowledge/i });
    expect(checkboxes.length).toBeGreaterThanOrEqual(6);
  });

  it('should show verification tier guide', () => {
    renderWithRouter(<SafetyEducationPage />);

    // Verification tiers section
    expect(screen.getByText(/verification tiers/i)).toBeInTheDocument();

    // Tier 1: Basic
    expect(screen.getByText(/basic.*tier/i)).toBeInTheDocument();
    expect(screen.getByText(/email.*2fa verified/i)).toBeInTheDocument();

    // Tier 2: Verified
    expect(screen.getByText(/verified.*tier/i)).toBeInTheDocument();
    expect(screen.getByText(/kyc.*identity verified/i)).toBeInTheDocument();

    // Tier 3: Pro
    expect(screen.getByText(/pro.*tier/i)).toBeInTheDocument();
    expect(screen.getByText(/enhanced verification/i)).toBeInTheDocument();
    expect(screen.getByText(/trading history/i)).toBeInTheDocument();

    // Trust level indicators
    expect(screen.getByText(/low trust/i)).toBeInTheDocument();
    expect(screen.getByText(/medium trust/i)).toBeInTheDocument();
    expect(screen.getByText(/high trust/i)).toBeInTheDocument();

    // Recommendation
    expect(screen.getByText(/recommended.*verified.*above/i)).toBeInTheDocument();
  });

  it('should make report form easily accessible', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SafetyEducationPage />);

    // Report button should be prominent
    const reportBtn = screen.getByRole('button', { name: /report.*scam/i });
    expect(reportBtn).toBeInTheDocument();

    await user.click(reportBtn);

    // Report form modal
    await waitFor(() => {
      expect(screen.getByText(/report.*suspicious activity/i)).toBeInTheDocument();
    });

    // Form fields
    expect(screen.getByLabelText(/provider name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/issue type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

    // Evidence upload
    expect(screen.getByText(/upload evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/screenshots.*chat logs/i)).toBeInTheDocument();

    // Submit button
    const submitBtn = screen.getByRole('button', { name: /submit report/i });
    expect(submitBtn).toBeInTheDocument();

    // Fill in form
    const providerInput = screen.getByLabelText(/provider name/i);
    await user.type(providerInput, 'SuspiciousProvider');

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'This provider is offering guaranteed 100% returns.');

    // Submit
    await user.click(submitBtn);

    // Confirmation
    await waitFor(() => {
      expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/investigate within 24-48 hours/i)).toBeInTheDocument();
    });
  });

  it('should support tab navigation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SafetyEducationPage />);

    // Tab 1: Scam Types (default)
    expect(screen.getByText(/pump.*dump/i)).toBeInTheDocument();

    // Switch to Tab 2: Red Flags
    const redFlagsTab = screen.getByRole('tab', { name: /red flags/i });
    await user.click(redFlagsTab);

    await waitFor(() => {
      expect(screen.getByText(/red flags checklist/i)).toBeInTheDocument();
    });

    // Switch to Tab 3: Verification
    const verificationTab = screen.getByRole('tab', { name: /verification/i });
    await user.click(verificationTab);

    await waitFor(() => {
      expect(screen.getByText(/verification tiers/i)).toBeInTheDocument();
    });

    // Switch to Tab 4: How to Report
    const reportTab = screen.getByRole('tab', { name: /how to report/i });
    await user.click(reportTab);

    await waitFor(() => {
      expect(screen.getByText(/reporting process/i)).toBeInTheDocument();
    });

    // All tabs should be accessible
    expect(screen.getAllByRole('tab').length).toBe(4);
  });

  it('should present educational content clearly', () => {
    renderWithRouter(<SafetyEducationPage />);

    // Clear headings
    expect(screen.getByRole('heading', { name: /safety.*education/i })).toBeInTheDocument();

    // Visual aids (icons for each scam type)
    const warningIcons = screen.getAllByTestId('alert-triangle-icon');
    expect(warningIcons.length).toBeGreaterThan(0);

    // Real-world examples
    expect(screen.getByText(/example:/i)).toBeInTheDocument();

    // Actionable advice
    expect(screen.getByText(/always verify/i)).toBeInTheDocument();
    expect(screen.getByText(/never share/i)).toBeInTheDocument();
    expect(screen.getByText(/be skeptical/i)).toBeInTheDocument();

    // Key takeaways summary
    expect(screen.getByText(/key takeaways/i)).toBeInTheDocument();

    // Links to external resources
    expect(screen.getByText(/learn more/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /regulatory guidelines/i })).toBeInTheDocument();

    // Quiz to test understanding
    expect(screen.getByRole('button', { name: /test your knowledge/i })).toBeInTheDocument();
  });
});
