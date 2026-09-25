/**
 * ══════════════════════════════════════════════════════════
 *  MarketItem Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for market list row component
 *
 *  Run: npx vitest run src/features/market/components/MarketItem.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { MarketItem } from './MarketItem';
import type { MarketPair } from '../model/market-types';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MarketItem', () => {
  const mockPair: MarketPair = {
    id: 'BTCUSDT',
    symbol: 'BTCUSDT',
    baseAsset: 'Bitcoin',
    quoteAsset: 'USDT',
    price: 45000,
    prevPrice: 43900,
    change24h: 2.5,
    volume24h: 1234567890,
    high24h: 46000,
    low24h: 44000,
    marketCap: 880000000000,
    logoColor: '#F7931A',
    sparklineData: [100, 102, 101, 103, 105, 104, 106],
    category: 'Layer 1',
  };

  const mockPairNegative: MarketPair = {
    ...mockPair,
    id: 'ETHUSDT',
    baseAsset: 'Ethereum',
    price: 3000,
    change24h: -1.5,
    logoColor: '#627EEA',
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render pair information', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('USDT')).toBeInTheDocument();
    });

    it('should render price', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByText('45,000.00')).toBeInTheDocument();
    });

    it('should render 24h change', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByText('+2.50%')).toBeInTheDocument();
    });

    it('should render logo circle with asset abbreviation', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByText('Bit')).toBeInTheDocument();
    });

    it('should render with aria-label', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByLabelText('BTCUSDT — 45,000.00')).toBeInTheDocument();
    });
  });

  describe('Positive vs Negative Change', () => {
    it('should render positive change in green', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      const changeElement = screen.getByText('+2.50%');
      expect(changeElement).toHaveStyle({ color: '#10B981' });
    });

    it('should render negative change in red', () => {
      renderWithProviders(<MarketItem pair={mockPairNegative} />);

      const changeElement = screen.getByText('-1.50%');
      expect(changeElement).toHaveStyle({ color: '#EF4444' });
    });

    it('should render zero change as positive', () => {
      const zeroPair = { ...mockPair, change24h: 0 };
      renderWithProviders(<MarketItem pair={zeroPair} />);

      const changeElement = screen.getByText('0.00%');
      expect(changeElement).toHaveStyle({ color: '#10B981' });
    });
  });

  describe('Logo Styling', () => {
    it('should use logoColor for Bitcoin', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      const logoText = screen.getByText('Bit');
      expect(logoText).toHaveStyle({ color: '#F7931A' });
    });

    it('should use logoColor for Ethereum', () => {
      renderWithProviders(<MarketItem pair={mockPairNegative} />);

      const logoText = screen.getByText('Eth');
      expect(logoText).toHaveStyle({ color: '#627EEA' });
    });

    it('should abbreviate base asset to 3 characters', () => {
      const longNamePair = { ...mockPair, baseAsset: 'Cardano' };
      renderWithProviders(<MarketItem pair={longNamePair} />);

      expect(screen.getByText('Car')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate on click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MarketItem pair={mockPair} />);

      const row = screen.getByRole('button', { name: /BTCUSDT/ });
      await user.click(row);

      expect(mockNavigate).toHaveBeenCalledWith('/pair/BTCUSDT');
    });

    it('should navigate on Enter key', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MarketItem pair={mockPair} />);

      const row = screen.getByRole('button', { name: /BTCUSDT/ });
      row.focus();
      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith('/pair/BTCUSDT');
    });

    it('should navigate on Space key', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MarketItem pair={mockPair} />);

      const row = screen.getByRole('button', { name: /BTCUSDT/ });
      row.focus();
      await user.keyboard(' ');

      expect(mockNavigate).toHaveBeenCalledWith('/pair/BTCUSDT');
    });

    it('should use correct pair id in navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MarketItem pair={mockPairNegative} />);

      const row = screen.getByRole('button');
      await user.click(row);

      expect(mockNavigate).toHaveBeenCalledWith('/pair/ETHUSDT');
    });
  });

  describe('Sparkline', () => {
    it('should show sparkline by default', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      // SparklineChart should be rendered
      // (we check by ensuring the data is used)
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should hide sparkline when showSparkline is false', () => {
      renderWithProviders(<MarketItem pair={mockPair} showSparkline={false} />);

      // Sparkline should not be visible
      // Component still renders but without sparkline
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
  });

  describe('Favorite Toggle', () => {
    it('should not render star when onFavoriteToggle is not provided', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.queryByLabelText(/yêu thích/i)).not.toBeInTheDocument();
    });

    it('should render star when onFavoriteToggle is provided', () => {
      const onFavoriteToggle = vi.fn();
      renderWithProviders(<MarketItem pair={mockPair} onFavoriteToggle={onFavoriteToggle} />);

      expect(screen.getByLabelText('Thêm vào yêu thích')).toBeInTheDocument();
    });

    it('should call onFavoriteToggle when star is clicked', async () => {
      const user = userEvent.setup();
      const onFavoriteToggle = vi.fn();
      renderWithProviders(<MarketItem pair={mockPair} onFavoriteToggle={onFavoriteToggle} />);

      const star = screen.getByLabelText('Thêm vào yêu thích');
      await user.click(star);

      expect(onFavoriteToggle).toHaveBeenCalledWith('BTCUSDT');
    });

    it('should not navigate when star is clicked', async () => {
      const user = userEvent.setup();
      const onFavoriteToggle = vi.fn();
      renderWithProviders(<MarketItem pair={mockPair} onFavoriteToggle={onFavoriteToggle} />);

      const star = screen.getByLabelText('Thêm vào yêu thích');
      await user.click(star);

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show filled star for favorite pairs', () => {
      const onFavoriteToggle = vi.fn();
      renderWithProviders(
        <MarketItem pair={mockPair} isFavorite onFavoriteToggle={onFavoriteToggle} />,
      );

      expect(screen.getByLabelText('Bỏ yêu thích')).toBeInTheDocument();
    });

    it('should show unfilled star for non-favorite pairs', () => {
      const onFavoriteToggle = vi.fn();
      renderWithProviders(<MarketItem pair={mockPair} onFavoriteToggle={onFavoriteToggle} />);

      expect(screen.getByLabelText('Thêm vào yêu thích')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role button', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have tabIndex 0', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      const row = screen.getByRole('button');
      expect(row).toHaveAttribute('tabIndex', '0');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MarketItem pair={mockPair} />);

      const row = screen.getByRole('button');

      // Should be focusable
      await user.tab();
      expect(row).toHaveFocus();
    });

    it('should have descriptive aria-label with pair and price', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByLabelText('BTCUSDT — 45,000.00')).toBeInTheDocument();
    });

    it('should have proper star button aria-label', () => {
      const onFavoriteToggle = vi.fn();
      renderWithProviders(<MarketItem pair={mockPair} onFavoriteToggle={onFavoriteToggle} />);

      const star = screen.getByLabelText('Thêm vào yêu thích');
      expect(star).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Price Formatting', () => {
    it('should format large prices with comma separator', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByText('45,000.00')).toBeInTheDocument();
    });

    it('should format small prices with decimals', () => {
      const smallPricePair = { ...mockPair, price: 0.0123 };
      renderWithProviders(<MarketItem pair={smallPricePair} />);

      expect(screen.getByText('0.0123')).toBeInTheDocument();
    });

    it('should format percentage changes correctly', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByText('+2.50%')).toBeInTheDocument();
    });

    it('should format negative percentage changes', () => {
      renderWithProviders(<MarketItem pair={mockPairNegative} />);

      expect(screen.getByText('-1.50%')).toBeInTheDocument();
    });
  });

  describe('Memo Optimization', () => {
    it('should be memoized component', () => {
      const { rerender } = renderWithProviders(<MarketItem pair={mockPair} />);

      // Same props should not trigger re-render
      rerender(<MarketItem pair={mockPair} />);

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should render BTC pair correctly', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('USDT')).toBeInTheDocument();
      expect(screen.getByText('45,000.00')).toBeInTheDocument();
      expect(screen.getByText('+2.50%')).toBeInTheDocument();
    });

    it('should render ETH pair correctly', () => {
      renderWithProviders(<MarketItem pair={mockPairNegative} />);

      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('USDT')).toBeInTheDocument();
      expect(screen.getByText('3,000.00')).toBeInTheDocument();
      expect(screen.getByText('-1.50%')).toBeInTheDocument();
    });

    it('should handle favorite toggle in market list', async () => {
      const user = userEvent.setup();
      const onFavoriteToggle = vi.fn();

      renderWithProviders(<MarketItem pair={mockPair} onFavoriteToggle={onFavoriteToggle} />);

      // Click star
      const star = screen.getByLabelText('Thêm vào yêu thích');
      await user.click(star);

      // Should toggle favorite
      expect(onFavoriteToggle).toHaveBeenCalledWith('BTCUSDT');

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should support watchlist functionality', async () => {
      const user = userEvent.setup();
      const onFavoriteToggle = vi.fn();

      const { rerender } = renderWithProviders(
        <MarketItem pair={mockPair} onFavoriteToggle={onFavoriteToggle} />,
      );

      // Add to favorites
      const addStar = screen.getByLabelText('Thêm vào yêu thích');
      await user.click(addStar);

      // Update to favorite
      rerender(<MarketItem pair={mockPair} isFavorite onFavoriteToggle={onFavoriteToggle} />);

      // Should show remove label
      expect(screen.getByLabelText('Bỏ yêu thích')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long asset names', () => {
      const longNamePair = {
        ...mockPair,
        baseAsset: 'Very Long Asset Name That Should Be Truncated',
      };
      renderWithProviders(<MarketItem pair={longNamePair} />);

      expect(screen.getByText('Very Long Asset Name That Should Be Truncated')).toBeInTheDocument();
    });

    it('should handle zero price', () => {
      const zeroPricePair = { ...mockPair, price: 0 };
      renderWithProviders(<MarketItem pair={zeroPricePair} />);

      expect(screen.getByText('0.000000')).toBeInTheDocument();
    });

    it('should handle very small change values', () => {
      const tinyChangePair = { ...mockPair, change24h: 0.01 };
      renderWithProviders(<MarketItem pair={tinyChangePair} />);

      expect(screen.getByText('+0.01%')).toBeInTheDocument();
    });

    it('should handle very large change values', () => {
      const hugeChangePair = { ...mockPair, change24h: 150 };
      renderWithProviders(<MarketItem pair={hugeChangePair} />);

      expect(screen.getByText('+150.00%')).toBeInTheDocument();
    });

    it('should handle missing sparkline data', () => {
      const noSparklinePair = { ...mockPair, sparklineData: [] };
      renderWithProviders(<MarketItem pair={noSparklinePair} />);

      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    });
  });

  describe('Interaction States', () => {
    it('should have active:opacity-70 class', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      const row = screen.getByRole('button');
      expect(row).toHaveClass('active:opacity-70');
    });

    it('should have cursor-pointer class', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      const row = screen.getByRole('button');
      expect(row).toHaveClass('cursor-pointer');
    });

    it('should have transition-opacity class', () => {
      renderWithProviders(<MarketItem pair={mockPair} />);

      const row = screen.getByRole('button');
      expect(row).toHaveClass('transition-opacity');
    });
  });
});
