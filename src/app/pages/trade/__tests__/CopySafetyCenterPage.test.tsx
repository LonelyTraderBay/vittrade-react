/**
 * ══════════════════════════════════════════════════════════════
 *  CopySafetyCenterPage.test.tsx — Safety Center Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (3 tests):
 * 1. ✅ Verification tiers explained
 * 2. ✅ Trust metrics breakdown clear
 * 3. ✅ Safety tools accessible
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent } from '../../../test/utils/test-utils';
import { CopySafetyCenterPage } from '../CopySafetyCenterPage';

describe('CopySafetyCenterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should explain all verification tiers', () => {
    renderWithRouter(<CopySafetyCenterPage />);

    // Page title
    expect(screen.getByText(/safety center/i)).toBeInTheDocument();

    // Verification tiers
    expect(screen.getByText(/verification tiers/i)).toBeInTheDocument();

    // Tier 1: Basic
    expect(screen.getByText(/basic/i)).toBeInTheDocument();
    expect(screen.getByText(/email.*phone verified/i)).toBeInTheDocument();
    expect(screen.getByText(/low trust/i)).toBeInTheDocument();

    // Tier 2: Verified
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
    expect(screen.getByText(/kyc.*identity verified/i)).toBeInTheDocument();
    expect(screen.getByText(/medium trust/i)).toBeInTheDocument();

    // Tier 3: Pro
    expect(screen.getByText(/pro/i)).toBeInTheDocument();
    expect(screen.getByText(/enhanced verification/i)).toBeInTheDocument();
    expect(screen.getByText(/trading history.*verified/i)).toBeInTheDocument();
    expect(screen.getByText(/high trust/i)).toBeInTheDocument();

    // Recommendation
    expect(screen.getByText(/only copy.*verified.*above/i)).toBeInTheDocument();

    // Visual badges
    const badges = screen.getAllByTestId('badge-icon');
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });

  it('should provide clear trust metrics breakdown', () => {
    renderWithRouter(<CopySafetyCenterPage />);

    // Trust metrics section
    expect(screen.getByText(/trust metrics/i)).toBeInTheDocument();

    // Metric 1: Fair Play Score
    expect(screen.getByText(/fair play score/i)).toBeInTheDocument();
    expect(screen.getByText(/based on.*following rules/i)).toBeInTheDocument();

    // Metric 2: Completion Rate
    expect(screen.getByText(/completion rate/i)).toBeInTheDocument();
    expect(screen.getByText(/percentage.*completed trades/i)).toBeInTheDocument();

    // Metric 3: Dispute Rate
    expect(screen.getByText(/dispute rate/i)).toBeInTheDocument();
    expect(screen.getByText(/complaints per 1000.*followers/i)).toBeInTheDocument();

    // Metric 4: Response Time
    expect(screen.getByText(/response time/i)).toBeInTheDocument();
    expect(screen.getByText(/avg time.*respond.*followers/i)).toBeInTheDocument();

    // Metric 5: Transparency Score
    expect(screen.getByText(/transparency score/i)).toBeInTheDocument();
    expect(screen.getByText(/communication.*disclosure quality/i)).toBeInTheDocument();

    // How it's calculated
    expect(screen.getByText(/how.*calculated/i)).toBeInTheDocument();

    // Example provider scores
    expect(screen.getByText(/example.*high trust.*95/i)).toBeInTheDocument();
    expect(screen.getByText(/example.*low trust.*45/i)).toBeInTheDocument();
  });

  it('should make safety tools easily accessible', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySafetyCenterPage />);

    // Safety tools section
    expect(screen.getByText(/safety tools/i)).toBeInTheDocument();

    // Tool 1: Report Provider
    const reportBtn = screen.getByRole('button', { name: /report provider/i });
    expect(reportBtn).toBeInTheDocument();

    await user.click(reportBtn);
    await waitFor(() => {
      expect(screen.getByText(/report.*suspicious activity/i)).toBeInTheDocument();
    });

    // Tool 2: Block Provider
    expect(screen.getByRole('button', { name: /block provider/i })).toBeInTheDocument();

    // Tool 3: Emergency Stop
    expect(screen.getByRole('button', { name: /emergency stop/i })).toBeInTheDocument();

    // Tool 4: Safety Checklist
    expect(screen.getByRole('button', { name: /safety checklist/i })).toBeInTheDocument();

    // Tool 5: Risk Calculator
    expect(screen.getByRole('button', { name: /risk calculator/i })).toBeInTheDocument();

    // Educational resources
    expect(screen.getByText(/safety education/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /scam awareness/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /red flags guide/i })).toBeInTheDocument();

    // Contact support
    expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument();
  });
});
