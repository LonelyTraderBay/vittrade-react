/**
 * ══════════════════════════════════════════════════════════════
 *  RegulatoryDisclosuresPage.test.tsx — Regulatory Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Rewritten for the current 5-tab disclosure page
 * (MiFID II / Protection / Restrictions / Liability / Contact).
 *
 * Test Coverage (2 tests):
 * 1. ✅ MiFID II compliance statement is complete (Art. 24/25/27/58)
 * 2. ✅ All other disclosure tabs render their required content
 *
 * DROPPED from the old suite (features no longer exist on the page):
 * - GDPR / data privacy section, "last updated" date, PDF download,
 *   acknowledgment checkbox, negative balance protection wording.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent } from '@/test/test-utils-navigation';
import { RegulatoryDisclosuresPage } from '../RegulatoryDisclosuresPage';

describe('RegulatoryDisclosuresPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display the complete MiFID II statement', () => {
    renderWithRouter(<RegulatoryDisclosuresPage />);

    // Page header + hero banner
    expect(screen.getByText('Regulatory Disclosures')).toBeInTheDocument();
    expect(screen.getByText('Legal & Regulatory Framework')).toBeInTheDocument();
    expect(screen.getByText(/rights and protections under MiFID II/i)).toBeInTheDocument();

    // MiFID II tab is active by default with all four article cards
    expect(screen.getByText('MiFID II Compliance Statement')).toBeInTheDocument();
    expect(screen.getByText('Article 24: Information to Clients')).toBeInTheDocument();
    expect(
      screen.getByText('Article 25: Assessment of Suitability and Appropriateness'),
    ).toBeInTheDocument();
    expect(screen.getByText('Article 27: Best Execution Obligation')).toBeInTheDocument();
    expect(screen.getByText('Article 58: Record Keeping')).toBeInTheDocument();

    // Appropriateness assessment criteria (Art. 25)
    expect(screen.getByText(/knowledge and experience with copy trading/i)).toBeInTheDocument();
    expect(screen.getByText(/ability to bear financial losses/i)).toBeInTheDocument();

    // Record retention (Art. 58)
    expect(screen.getByText(/retained for a minimum of 5 years/i)).toBeInTheDocument();

    // Commitment note
    expect(screen.getByText(/Our Commitment:/i)).toBeInTheDocument();

    // 5 tabs available
    expect(screen.getAllByRole('tab')).toHaveLength(5);
  });

  it('should show all other required disclosures via tab navigation', async () => {
    const user = userEvent.setup();
    renderWithRouter(<RegulatoryDisclosuresPage />);

    // Protection tab
    await user.click(screen.getByRole('tab', { name: 'Protection' }));
    await waitFor(() => {
      expect(screen.getByText('Investor Protection Scheme')).toBeInTheDocument();
    });
    expect(screen.getByText('Coverage Limit')).toBeInTheDocument();
    expect(screen.getByText(/€20,000 per user/i)).toBeInTheDocument();
    expect(screen.getByText("What's NOT Covered")).toBeInTheDocument();
    expect(screen.getByText(/Trading losses \(market risk\)/i)).toBeInTheDocument();
    expect(screen.getByText('How to File a Claim')).toBeInTheDocument();
    expect(screen.getByText('ICS Operator Contact')).toBeInTheDocument();

    // Restrictions tab
    await user.click(screen.getByRole('tab', { name: 'Restrictions' }));
    await waitFor(() => {
      expect(screen.getByText('Jurisdictional Restrictions')).toBeInTheDocument();
    });
    expect(screen.getByText('Copy Trading Not Available In:')).toBeInTheDocument();
    expect(screen.getByText(/United States \(US residents\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Countries under OFAC sanctions/i)).toBeInTheDocument();
    expect(screen.getByText('Leverage Restrictions by Region')).toBeInTheDocument();
    expect(screen.getByText('Tax Reporting Obligations')).toBeInTheDocument();

    // Liability tab
    await user.click(screen.getByRole('tab', { name: 'Liability' }));
    await waitFor(() => {
      expect(screen.getByText('Liability Limitations')).toBeInTheDocument();
    });
    expect(screen.getByText('Platform Role')).toBeInTheDocument();
    expect(screen.getByText(/not an investment advisor/i)).toBeInTheDocument();
    expect(screen.getByText('User Responsibility')).toBeInTheDocument();
    expect(screen.getByText('Indemnification')).toBeInTheDocument();
    expect(screen.getByText('Limitation of Liability')).toBeInTheDocument();

    // Contact tab
    await user.click(screen.getByRole('tab', { name: 'Contact' }));
    await waitFor(() => {
      expect(screen.getByText('Regulatory Contact Information')).toBeInTheDocument();
    });
    expect(screen.getByText('Financial Conduct Authority (FCA)')).toBeInTheDocument();
    expect(
      screen.getByText('European Securities and Markets Authority (ESMA)'),
    ).toBeInTheDocument();
    expect(screen.getByText('Financial Ombudsman Service')).toBeInTheDocument();
    expect(screen.getByText('Whistleblower Protection')).toBeInTheDocument();
    expect(screen.getByText('Copy Trading Terms of Service')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy (Data Handling)')).toBeInTheDocument();
  });
});
