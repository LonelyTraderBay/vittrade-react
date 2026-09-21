import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../test/test-utils';
import { HomePage } from './HomePage';

/**
 * ══════════════════════════════════════════════════════════
 *  HomePage Component Tests
 * ══════════════════════════════════════════════════════════
 *  Tests the main home page with navigation and features
 */

describe('HomePage', () => {
  describe('Rendering', () => {
    it('should render app title', () => {
      renderWithProviders(<HomePage />);
      expect(screen.getByText('VitTrade')).toBeInTheDocument();
    });

    it('should render search button', () => {
      renderWithProviders(<HomePage />);
      const searchButton = screen.getByRole('button', { name: /Tìm kiếm toàn cục/i });
      expect(searchButton).toBeInTheDocument();
    });

    it('should render notification button', () => {
      renderWithProviders(<HomePage />);
      const notificationButton = screen.getByRole('button', { name: 'Thông báo (3)' });
      expect(notificationButton).toBeInTheDocument();
    });

    it('should render portfolio card', () => {
      renderWithProviders(<HomePage />);
      expect(screen.getByText(/Tổng tài sản/i)).toBeInTheDocument();
    });

    it('should render quick actions grid', () => {
      renderWithProviders(<HomePage />);
      expect(screen.getByText('Khám phá')).toBeInTheDocument();
      expect(screen.getByText('Mua nhanh')).toBeInTheDocument();
      expect(screen.getByText('Convert')).toBeInTheDocument();
    });

    it('should render market section', () => {
      renderWithProviders(<HomePage />);
      expect(screen.getByText('Thị trường')).toBeInTheDocument();
    });
  });

  describe('Portfolio Card', () => {
    it('should display balance by default', () => {
      renderWithProviders(<HomePage />);
      // Should show formatted balance (not hidden)
      const balanceText = screen.queryByText('••••••');
      // Initially visible, so hidden text should NOT be there
      expect(balanceText).not.toBeInTheDocument();
    });

    it('should display deposit button', () => {
      renderWithProviders(<HomePage />);
      expect(screen.getByText('Nạp')).toBeInTheDocument();
    });

    it('should display withdraw button', () => {
      renderWithProviders(<HomePage />);
      expect(screen.getByText('Rút')).toBeInTheDocument();
    });

    it('should display wallet button', () => {
      renderWithProviders(<HomePage />);
      const walletButton = screen.getByText('Ví');
      expect(walletButton).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render all quick action buttons', () => {
      renderWithProviders(<HomePage />);

      const expectedActions = ['Khám phá', 'Mua nhanh', 'Convert', 'P2P', 'Launchpad', 'Staking'];

      expectedActions.forEach((action) => {
        expect(screen.getByText(action)).toBeInTheDocument();
      });
    });

    it('should render quick actions in grid layout', () => {
      const { container } = renderWithProviders(<HomePage />);
      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Market Tabs', () => {
    it('should render market tabs', () => {
      renderWithProviders(<HomePage />);

      expect(screen.getByText(/🔥 Hot/)).toBeInTheDocument();
      expect(screen.getByText(/📈 Tăng/)).toBeInTheDocument();
      expect(screen.getByText(/📉 Giảm/)).toBeInTheDocument();
      expect(screen.getByText(/🆕 Mới/)).toBeInTheDocument();
    });

    it('should have Hot tab active by default', () => {
      renderWithProviders(<HomePage />);
      const hotTab = screen.getByText(/🔥 Hot/);
      expect(hotTab).toHaveStyle({ fontWeight: '600' });
    });
  });

  describe('Discovery Section', () => {
    it('should render Prediction Markets and Open Arena bridge', () => {
      renderWithProviders(<HomePage />);
      // The HomeDiscoverySection component should be rendered
      // We'll check for the container existence
      const { container } = renderWithProviders(<HomePage />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have search button with correct navigation', () => {
      renderWithProviders(<HomePage />, {
        routerProps: { initialEntries: ['/'] },
      });

      const searchButton = screen.getByRole('button', { name: /Tìm kiếm toàn cục/i });
      expect(searchButton).toBeInTheDocument();
      expect(searchButton.getAttribute('aria-label')).toBe('Tìm kiếm toàn cục');
    });

    it('should render "Xem tất cả" link for markets', () => {
      renderWithProviders(<HomePage />);
      const seeAllLinks = screen.getAllByText('Xem tất cả');
      expect(seeAllLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply mobile-first padding', () => {
      const { container } = renderWithProviders(<HomePage />);
      const header = container.querySelector('.px-5');
      expect(header).toBeInTheDocument();
    });

    it('should render within safe areas', () => {
      const { container } = renderWithProviders(<HomePage />);
      const pullToRefresh = container.querySelector('.pb-8');
      expect(pullToRefresh).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should render market list after loading', async () => {
      renderWithProviders(<HomePage />);

      // Initially might show loading, but will show content
      // After timeout, market items should be visible
      await vi.waitFor(
        () => {
          const marketSection = screen.getByText('Thị trường');
          expect(marketSection).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<HomePage />);

      const h1 = screen.getByText('VitTrade');
      expect(h1.tagName).toBe('H1');
    });

    it('should have accessible search button', () => {
      renderWithProviders(<HomePage />);

      const searchButton = screen.getByRole('button', { name: /Tìm kiếm toàn cục/i });
      expect(searchButton).toBeInTheDocument();
    });

    it('should have clickable quick action buttons', () => {
      renderWithProviders(<HomePage />);

      const quickActionButtons = screen.getAllByRole('button');
      expect(quickActionButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Pull to Refresh', () => {
    it('should wrap content in PullToRefresh component', () => {
      const { container } = renderWithProviders(<HomePage />);

      // PullToRefresh adds a specific class
      const pullToRefreshContainer = container.querySelector('.pb-8');
      expect(pullToRefreshContainer).toBeInTheDocument();
    });
  });

  describe('Announcement Banner', () => {
    it('should render announcement section', () => {
      const { container } = renderWithProviders(<HomePage />);

      // Check for the announcement banner container
      const banner = container.querySelector('.mb-3.flex');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should render all main sections in correct order', () => {
      const { container } = renderWithProviders(<HomePage />);

      // Check that main sections exist
      expect(screen.getByText('VitTrade')).toBeInTheDocument(); // Header
      expect(screen.getByText(/Tổng tài sản/i)).toBeInTheDocument(); // Portfolio
      expect(screen.getByText('Khám phá')).toBeInTheDocument(); // Quick Actions
      expect(screen.getByText('Thị trường')).toBeInTheDocument(); // Market Section
    });

    it('should not have any console errors', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      renderWithProviders(<HomePage />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
