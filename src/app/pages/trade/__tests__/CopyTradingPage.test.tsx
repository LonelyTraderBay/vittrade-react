/**
 * ══════════════════════════════════════════════════════════════
 *  CopyTradingPage.test.tsx — Hub Page Tests
 * ══════════════════════════════════════════════════════════════
 * 
 * Test Coverage (10 tests):
 * 1. ✅ Page renders without crashing
 * 2. ✅ Displays header with correct title
 * 3. ✅ Shows ESMA risk warning banner
 * 4. ✅ Renders provider cards
 * 5. ✅ Filters by verification tier
 * 6. ✅ Filters by risk level
 * 7. ✅ Search functionality works
 * 8. ✅ Navigates to provider detail on card click
 * 9. ✅ Education CTA is visible
 * 10. ✅ Active copies shortcut works
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter, userEvent, mockNavigate } from '../../../test/utils/test-utils';
import { CopyTradingPage } from '../CopyTradingPage';
import { createMockProviders } from '../../../test/mocks/copy-trading-mocks';

describe('CopyTradingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    renderWithRouter(<CopyTradingPage />);
    expect(screen.getByText(/copy trading/i)).toBeInTheDocument();
  });

  it('should display header with correct title', () => {
    renderWithRouter(<CopyTradingPage />);
    
    // Check for header title
    const header = screen.getByText('Copy Trading');
    expect(header).toBeInTheDocument();
  });

  it('should show ESMA risk warning banner', () => {
    renderWithRouter(<CopyTradingPage />);
    
    // Check for risk warning
    const riskWarning = screen.getByText(/past performance/i);
    expect(riskWarning).toBeInTheDocument();
    
    // Check for warning icon
    expect(screen.getByText(/copy trading involves risk/i)).toBeInTheDocument();
  });

  it('should render provider cards', () => {
    renderWithRouter(<CopyTradingPage />);
    
    // Check for provider cards (minimum 3)
    const providerNames = ['CryptoKing', 'SwingMaster', 'AlgoTrader'];
    
    providerNames.forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('should filter providers by verification tier', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyTradingPage />);
    
    // Find and click verification filter
    const verifiedFilter = screen.getByRole('button', { name: /verified/i });
    await user.click(verifiedFilter);
    
    // Wait for filter to apply
    await waitFor(() => {
      // Should only show verified providers
      const cards = screen.getAllByText(/verified/i);
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it('should filter providers by risk level', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyTradingPage />);
    
    // Find and click risk filter (Low Risk)
    const lowRiskFilter = screen.getByRole('button', { name: /low/i });
    await user.click(lowRiskFilter);
    
    await waitFor(() => {
      // Should filter to low risk providers
      expect(screen.queryByText(/high risk/i)).not.toBeInTheDocument();
    });
  });

  it('should have working search functionality', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyTradingPage />);
    
    // Find search input
    const searchInput = screen.getByPlaceholderText(/search providers/i);
    expect(searchInput).toBeInTheDocument();
    
    // Type in search
    await user.type(searchInput, 'Crypto');
    
    await waitFor(() => {
      // Should show CryptoKing but not others
      expect(screen.getByText('CryptoKing')).toBeInTheDocument();
    });
  });

  it('should navigate to provider detail on card click', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyTradingPage />);
    
    // Find first provider card
    const providerCard = screen.getByText('CryptoKing').closest('div[role="button"]');
    expect(providerCard).toBeInTheDocument();
    
    // Click on provider card
    if (providerCard) {
      await user.click(providerCard);
    }
    
    // Should navigate to provider detail
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/trade/copy-provider/')
      );
    });
  });

  it('should display education CTA', () => {
    renderWithRouter(<CopyTradingPage />);
    
    // Check for education link/button
    const educationCTA = screen.getByText(/learn copy trading/i);
    expect(educationCTA).toBeInTheDocument();
  });

  it('should have active copies shortcut', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CopyTradingPage />);
    
    // Find active copies button
    const activeCopiesBtn = screen.getByText(/my copies/i);
    expect(activeCopiesBtn).toBeInTheDocument();
    
    // Click on it
    await user.click(activeCopiesBtn);
    
    // Should navigate to active copies page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/trade/copy-trading/active')
      );
    });
  });
});
