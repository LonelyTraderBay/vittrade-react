/**
 * ══════════════════════════════════════════════════════════════
 *  RegulatoryDisclosuresPage.test.tsx — Regulatory Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (2 tests):
 * 1. ✅ MiFID II statement complete
 * 2. ✅ All regulatory disclosures visible
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils/test-utils';
import { RegulatoryDisclosuresPage } from '../RegulatoryDisclosuresPage';

describe('RegulatoryDisclosuresPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display complete MiFID II statement', () => {
    renderWithRouter(<RegulatoryDisclosuresPage />);

    // Page title
    expect(screen.getByText(/regulatory disclosures/i)).toBeInTheDocument();

    // MiFID II header
    expect(screen.getByText(/mifid ii/i)).toBeInTheDocument();
    expect(screen.getByText(/markets in financial instruments directive/i)).toBeInTheDocument();

    // Art. 25.3 Appropriateness Assessment
    expect(screen.getByText(/article 25\.3/i)).toBeInTheDocument();
    expect(screen.getByText(/appropriateness assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/required.*copy trading/i)).toBeInTheDocument();

    // Art. 24.4 Best Execution
    expect(screen.getByText(/article 24\.4/i)).toBeInTheDocument();
    expect(screen.getByText(/best execution/i)).toBeInTheDocument();

    // ESMA Guidelines
    expect(screen.getByText(/esma.*guidelines/i)).toBeInTheDocument();
    expect(screen.getByText(/leverage warnings/i)).toBeInTheDocument();
    expect(screen.getByText(/performance warnings/i)).toBeInTheDocument();

    // Investor Protection
    expect(screen.getByText(/investor protection/i)).toBeInTheDocument();
    expect(screen.getByText(/segregated accounts/i)).toBeInTheDocument();
    expect(screen.getByText(/negative balance protection/i)).toBeInTheDocument();

    // Risk Warnings (prominently displayed)
    expect(screen.getByText(/risk warning/i)).toBeInTheDocument();
    expect(screen.getByText(/can lose.*capital/i)).toBeInTheDocument();
    expect(screen.getByText(/past performance.*not indicative/i)).toBeInTheDocument();
  });

  it('should show all required regulatory disclosures', () => {
    renderWithRouter(<RegulatoryDisclosuresPage />);

    // Jurisdictional restrictions
    expect(screen.getByText(/jurisdictional restrictions/i)).toBeInTheDocument();
    expect(screen.getByText(/not available.*certain jurisdictions/i)).toBeInTheDocument();
    expect(screen.getByText(/united states.*prohibited/i)).toBeInTheDocument();

    // Liability limitations
    expect(screen.getByText(/liability limitations/i)).toBeInTheDocument();
    expect(screen.getByText(/platform.*not liable.*provider actions/i)).toBeInTheDocument();
    expect(screen.getByText(/copy at your own risk/i)).toBeInTheDocument();

    // Data privacy (GDPR)
    expect(screen.getByText(/data privacy/i)).toBeInTheDocument();
    expect(screen.getByText(/gdpr compliant/i)).toBeInTheDocument();
    expect(screen.getByText(/data protection.*eu regulation/i)).toBeInTheDocument();

    // Regulatory contacts
    expect(screen.getByText(/regulatory contacts/i)).toBeInTheDocument();
    expect(screen.getByText(/financial conduct authority/i)).toBeInTheDocument();
    expect(screen.getByText(/complaints.*financial ombudsman/i)).toBeInTheDocument();

    // Last updated date
    expect(screen.getByText(/last updated.*march.*2026/i)).toBeInTheDocument();

    // Download disclosures
    expect(screen.getByRole('button', { name: /download pdf/i })).toBeInTheDocument();

    // Acknowledgment checkbox
    expect(screen.getByRole('checkbox', { name: /acknowledge.*read/i })).toBeInTheDocument();
  });
});
