/**
 * ══════════════════════════════════════════════════════════════
 *  CopySafetyCenterPage.test.tsx — Safety Center Tests
 * ══════════════════════════════════════════════════════════════
 *
 * Written against the current component: a 5-tab trust & safety hub
 * (Verification / Metrics / Guidelines / Tools / Enforcement) with
 * expandable trust-metric explainers, community guidelines,
 * block/report/emergency-stop tools and a public enforcement log.
 *
 * Test Coverage (6 tests):
 * 1. ✅ Hero banner + all 3 verification tiers with requirements/benefits
 * 2. ✅ Trust metrics expand to show good/bad ranges and rationale
 * 3. ✅ Guidelines tab: prohibited behaviors, responsibilities, reporting
 * 4. ✅ Safety tools: block/report navigate; emergency stop confirms
 * 5. ✅ Enforcement tab lists actions with reasons and transparency note
 * 6. ✅ Tab switching swaps content
 *
 * Dropped from the old suite (features no longer exist):
 * - Fair Play / Completion / Dispute / Response / Transparency scores
 * - Safety checklist and risk calculator tools
 * - Educational resource links (scam awareness / red flags)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '@/test/test-utils-navigation';
import { CopySafetyCenterPage } from '@/dev/legacy/trade/CopySafetyCenterPage';

describe('CopySafetyCenterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should explain all verification tiers', () => {
    renderWithRouter(<CopySafetyCenterPage />);

    // Hero + intro
    expect(screen.getByText('Safety Center')).toBeInTheDocument();
    expect(screen.getByText('Your Safety is Our Priority')).toBeInTheDocument();
    expect(screen.getByText(/Provider verification tiers explained:/i)).toBeInTheDocument();

    // Tier 1: Basic
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('• Email verification')).toBeInTheDocument();
    expect(screen.getByText('• KYC Level 1')).toBeInTheDocument();

    // Tier 2: Verified
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('• KYC Level 2 (ID + Selfie)')).toBeInTheDocument();
    expect(screen.getByText('• 6 months trading history')).toBeInTheDocument();
    expect(screen.getByText('• $10,000 minimum capital')).toBeInTheDocument();

    // Tier 3: Pro
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('• 12 months trading history')).toBeInTheDocument();
    expect(screen.getByText('• $50,000 minimum capital')).toBeInTheDocument();
    expect(screen.getByText('• Sharpe Ratio > 1.5')).toBeInTheDocument();
    expect(screen.getByText('• Monthly performance audit')).toBeInTheDocument();
    expect(screen.getByText('✓ Featured in leaderboard')).toBeInTheDocument();

    // Badges do NOT guarantee performance
    expect(screen.getByText(/DO NOT guarantee future performance/i)).toBeInTheDocument();
  });

  it('should expand trust metrics with good/bad ranges and rationale', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySafetyCenterPage />);

    await user.click(screen.getByRole('tab', { name: 'Metrics' }));

    expect(screen.getByText('Understanding trust metrics:')).toBeInTheDocument();

    // All 4 metrics listed collapsed
    ['Sharpe Ratio', 'Max Drawdown', 'Slippage', 'Win Rate'].forEach((name) =>
      expect(screen.getByRole('button', { name: new RegExp(name) })).toBeInTheDocument(),
    );
    expect(screen.queryByText('✓ Good Range')).not.toBeInTheDocument();

    // Expand Sharpe Ratio
    await user.click(screen.getByRole('button', { name: /Sharpe Ratio/ }));
    await waitFor(() => {
      expect(screen.getByText('✓ Good Range')).toBeInTheDocument();
      expect(screen.getByText('> 1.5 (excellent), 1.0-1.5 (good)')).toBeInTheDocument();
      expect(screen.getByText('✗ Bad Range')).toBeInTheDocument();
      expect(screen.getByText('< 1.0 (poor)')).toBeInTheDocument();
      expect(screen.getByText('Why It Matters')).toBeInTheDocument();
      expect(
        screen.getByText('Shows if provider is taking smart risks or just gambling'),
      ).toBeInTheDocument();
    });

    // Expand Max Drawdown — Sharpe panel collapses (single-expand accordion)
    await user.click(screen.getByRole('button', { name: /Max Drawdown/ }));
    await waitFor(() => {
      expect(screen.getByText('< 15% (excellent), 15-25% (acceptable)')).toBeInTheDocument();
      expect(screen.getByText('> 25% (risky)')).toBeInTheDocument();
      expect(
        screen.getByText('Indicates worst-case loss scenario. Can you handle it?'),
      ).toBeInTheDocument();
      expect(screen.queryByText('< 1.0 (poor)')).not.toBeInTheDocument();
    });
  });

  it('should show guidelines: prohibited behaviors, responsibilities, reporting', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySafetyCenterPage />);

    await user.click(screen.getByRole('tab', { name: 'Guidelines' }));

    // 7 prohibited behaviors
    expect(screen.getByText('Prohibited Provider Behaviors')).toBeInTheDocument();
    ['Wash trading (fake volume)', 'Fake performance data', 'Hidden fee structures'].forEach(
      (item) => expect(screen.getByText(item)).toBeInTheDocument(),
    );
    expect(screen.getByText('Misleading claims (guaranteed profits)')).toBeInTheDocument();

    // 6 follower responsibilities
    expect(screen.getByText('Follower Responsibilities')).toBeInTheDocument();
    expect(screen.getByText('Do your own research before copying')).toBeInTheDocument();
    expect(screen.getByText('Do not over-allocate to single provider')).toBeInTheDocument();

    // Reporting procedure: 4 steps
    expect(screen.getByText('Reporting Procedures')).toBeInTheDocument();
    expect(screen.getByText('1. Collect Evidence')).toBeInTheDocument();
    expect(screen.getByText('2. File Report')).toBeInTheDocument();
    expect(screen.getByText('3. Investigation')).toBeInTheDocument();
    expect(screen.getByText('Team reviews within 24-48 hours')).toBeInTheDocument();
    expect(screen.getByText('4. Enforcement')).toBeInTheDocument();
  });

  it('should provide safety tools with confirmations where destructive', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySafetyCenterPage />);

    await user.click(screen.getByRole('tab', { name: 'Tools' }));

    expect(screen.getByText('Safety Tools')).toBeInTheDocument();

    // Block Provider navigates to the copy trading hub
    await user.click(screen.getByRole('button', { name: /Block Provider/ }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-trading');
    });

    // Report Provider navigates to the safety route
    await user.click(screen.getByRole('button', { name: /Report Provider/ }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/trade/copy-trading/safety');
    });

    // Emergency Stop All requires confirmation, then alerts
    await user.click(screen.getByRole('button', { name: /Emergency Stop All/ }));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('STOP ALL copying'));
    expect(window.alert).toHaveBeenCalledWith('Emergency stop activated! All copies stopped.');

    // Declining the confirmation does nothing destructive
    vi.mocked(window.confirm).mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: /Emergency Stop All/ }));
    expect(window.alert).toHaveBeenCalledTimes(1); // still only the first activation
  });

  it('should list recent enforcement actions transparently', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySafetyCenterPage />);

    await user.click(screen.getByRole('tab', { name: 'Enforcement' }));

    expect(
      screen.getByText(/Recent enforcement actions taken to protect users:/i),
    ).toBeInTheDocument();

    // 3 actions: suspended / warned / verified
    expect(screen.getByText('suspended')).toBeInTheDocument();
    expect(screen.getByText('Provider X')).toBeInTheDocument();
    expect(screen.getByText('Wash trading detected (fake volume)')).toBeInTheDocument();
    expect(screen.getByText('2026-03-05')).toBeInTheDocument();

    expect(screen.getByText('warned')).toBeInTheDocument();
    expect(screen.getByText('Provider Y')).toBeInTheDocument();
    expect(screen.getByText('Undisclosed fee changes')).toBeInTheDocument();

    expect(screen.getByText('verified')).toBeInTheDocument();
    expect(screen.getByText('Provider Z')).toBeInTheDocument();
    expect(screen.getByText('Passed Pro tier audit')).toBeInTheDocument();

    // Transparency note
    expect(screen.getByText(/All actions are logged and transparent/i)).toBeInTheDocument();
  });

  it('should switch content between tabs', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopySafetyCenterPage />);

    // Verification is the default tab
    expect(screen.getByText('Provider verification tiers explained:')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Enforcement' }));
    await waitFor(() => {
      expect(screen.getByText(/Recent enforcement actions/i)).toBeInTheDocument();
      expect(screen.queryByText('Provider verification tiers explained:')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Verification' }));
    await waitFor(() => {
      expect(screen.getByText('Provider verification tiers explained:')).toBeInTheDocument();
    });
  });
});
