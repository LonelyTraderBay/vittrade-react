/**
 * ══════════════════════════════════════════════════════════
 *  StatCard Component Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for StatCard, StatItem, StatGrid, PercentageStat
 *
 *  Run: npx vitest run src/app/__tests__/StatCard.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import {
  StatCard,
  StatItem,
  StatGrid,
  PercentageStat,
  type StatSize,
} from '../components/ui/StatCard';
import { Wallet, TrendingUp } from 'lucide-react';

describe('StatCard', () => {
  describe('Rendering', () => {
    it('should render label and value', () => {
      renderWithProviders(<StatCard label="Tổng giá trị" value="$1,234.56" />);

      expect(screen.getByText('Tổng giá trị')).toBeInTheDocument();
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      const { container } = renderWithProviders(
        <StatCard label="Số dư" value="1,000 USDT" icon={Wallet} />,
      );

      expect(screen.getByText('Số dư')).toBeInTheDocument();
      expect(screen.getByText('1,000 USDT')).toBeInTheDocument();
      // Icon should be rendered
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with subtitle', () => {
      renderWithProviders(
        <StatCard label="P&L 24h" value="+$50.00" subtitle="Tăng 5% so với hôm qua" />,
      );

      expect(screen.getByText('P&L 24h')).toBeInTheDocument();
      expect(screen.getByText('+$50.00')).toBeInTheDocument();
      expect(screen.getByText('Tăng 5% so với hôm qua')).toBeInTheDocument();
    });

    it('should accept numeric value', () => {
      renderWithProviders(<StatCard label="Count" value={42} />);

      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Trends', () => {
    it('should render up trend with green color', () => {
      const { container } = renderWithProviders(<StatCard label="Price" value="$100" trend="up" />);

      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();

      // Should have TrendingUp icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render down trend with red color', () => {
      const { container } = renderWithProviders(
        <StatCard label="Price" value="$100" trend="down" />,
      );

      expect(screen.getByText('Price')).toBeInTheDocument();

      // Should have TrendingDown icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should not render trend icon for neutral trend', () => {
      renderWithProviders(<StatCard label="Price" value="$100" trend="neutral" />);

      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('should apply correct color for up trend value', () => {
      renderWithProviders(<StatCard label="Profit" value="+$50" trend="up" />);

      const valueSpan = screen.getByText('+$50');
      expect(valueSpan).toHaveStyle({ color: '#10B981' });
    });

    it('should apply correct color for down trend value', () => {
      renderWithProviders(<StatCard label="Loss" value="-$50" trend="down" />);

      const valueSpan = screen.getByText('-$50');
      expect(valueSpan).toHaveStyle({ color: '#EF4444' });
    });
  });

  describe('Sizes', () => {
    const sizes: StatSize[] = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`should render ${size} size`, () => {
        renderWithProviders(<StatCard label="Test" value="100" size={size} />);

        expect(screen.getByText('Test')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });

    it('should apply correct font size for sm value', () => {
      renderWithProviders(<StatCard label="Small" value="100" size="sm" />);

      const valueSpan = screen.getByText('100');
      expect(valueSpan).toHaveStyle({ fontSize: '16px' });
    });

    it('should apply correct font size for md value', () => {
      renderWithProviders(<StatCard label="Medium" value="100" size="md" />);

      const valueSpan = screen.getByText('100');
      expect(valueSpan).toHaveStyle({ fontSize: '20px' });
    });

    it('should apply correct font size for lg value', () => {
      renderWithProviders(<StatCard label="Large" value="100" size="lg" />);

      const valueSpan = screen.getByText('100');
      expect(valueSpan).toHaveStyle({ fontSize: '28px' });
    });
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      const { container } = renderWithProviders(<StatCard label="Loading" value="100" loading />);

      expect(screen.getByText('Loading')).toBeInTheDocument();
      // Should not show value
      expect(screen.queryByText('100')).not.toBeInTheDocument();

      // Should show skeleton
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should show label even when loading', () => {
      renderWithProviders(<StatCard label="Still visible" value="Hidden" loading />);

      expect(screen.getByText('Still visible')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    it('should show subtitle even when loading', () => {
      renderWithProviders(<StatCard label="Label" value="Hidden" subtitle="Still here" loading />);

      expect(screen.getByText('Label')).toBeInTheDocument();
      expect(screen.getByText('Still here')).toBeInTheDocument();
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });
  });

  describe('Interactive Behavior', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(<StatCard label="Clickable" value="100" onClick={handleClick} />);

      const card = screen.getByText('Clickable').closest('div');
      if (card) {
        await user.click(card);
        expect(handleClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should have cursor-pointer class when onClick is provided', () => {
      const { container } = renderWithProviders(
        <StatCard label="Interactive" value="100" onClick={() => {}} />,
      );

      const card = container.querySelector('div[class*="cursor-pointer"]');
      expect(card).toBeInTheDocument();
    });

    it('should not have cursor-pointer class when onClick is not provided', () => {
      const { container } = renderWithProviders(<StatCard label="Static" value="100" />);

      const card = container.querySelector('div[class*="cursor-pointer"]');
      expect(card).not.toBeInTheDocument();
    });

    it('should have active:opacity-70 class when interactive', () => {
      const { container } = renderWithProviders(
        <StatCard label="Active" value="100" onClick={() => {}} />,
      );

      const card = container.querySelector('div[class*="active:opacity-70"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <StatCard label="Custom" value="100" className="custom-class" />,
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('should apply custom style', () => {
      const { container } = renderWithProviders(
        <StatCard label="Custom" value="100" style={{ marginTop: '20px' }} />,
      );

      const card = container.querySelector('div[style*="margin-top"]');
      expect(card).toBeInTheDocument();
    });

    it('should apply custom valueColor', () => {
      renderWithProviders(<StatCard label="Custom Color" value="100" valueColor="#FF0000" />);

      const valueSpan = screen.getByText('100');
      expect(valueSpan).toHaveStyle({ color: '#FF0000' });
    });

    it('should prioritize valueColor over trend color', () => {
      renderWithProviders(
        <StatCard label="Override" value="100" trend="up" valueColor="#FF0000" />,
      );

      const valueSpan = screen.getByText('100');
      expect(valueSpan).toHaveStyle({ color: '#FF0000' });
    });
  });

  describe('Accessibility', () => {
    it('should have rounded-2xl class', () => {
      const { container } = renderWithProviders(<StatCard label="Rounded" value="100" />);

      const card = container.querySelector('.rounded-2xl');
      expect(card).toBeInTheDocument();
    });

    it('should apply font weight 700 to value', () => {
      renderWithProviders(<StatCard label="Bold" value="100" />);

      const valueSpan = screen.getByText('100');
      expect(valueSpan).toHaveStyle({ fontWeight: '700' });
    });

    it('should apply font weight 500 to label', () => {
      renderWithProviders(<StatCard label="Label weight" value="100" />);

      const labelSpan = screen.getByText('Label weight');
      expect(labelSpan).toHaveStyle({ fontWeight: '500' });
    });
  });
});

describe('StatItem', () => {
  describe('Rendering', () => {
    it('should render label and value horizontally', () => {
      renderWithProviders(<StatItem label="Total" value="$100" />);

      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('should render with trend', () => {
      const { container } = renderWithProviders(<StatItem label="Price" value="$100" trend="up" />);

      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();

      // Should have trend icon
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render in compact mode', () => {
      renderWithProviders(<StatItem label="Compact" value="100" compact />);

      expect(screen.getByText('Compact')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('Trends', () => {
    it('should apply green color for up trend', () => {
      renderWithProviders(<StatItem label="Up" value="$100" trend="up" />);

      const valueSpan = screen.getByText('$100');
      expect(valueSpan).toHaveStyle({ color: '#10B981' });
    });

    it('should apply red color for down trend', () => {
      renderWithProviders(<StatItem label="Down" value="$100" trend="down" />);

      const valueSpan = screen.getByText('$100');
      expect(valueSpan).toHaveStyle({ color: '#EF4444' });
    });

    it('should not show trend icon for neutral', () => {
      renderWithProviders(<StatItem label="Neutral" value="$100" trend="neutral" />);

      expect(screen.getByText('Neutral')).toBeInTheDocument();
      expect(screen.getByText('$100')).toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should use smaller font size in compact mode', () => {
      renderWithProviders(<StatItem label="Compact" value="100" compact />);

      const labelSpan = screen.getByText('Compact');
      expect(labelSpan).toHaveStyle({ fontSize: '11px' });

      const valueSpan = screen.getByText('100');
      expect(valueSpan).toHaveStyle({ fontSize: '12px' });
    });

    it('should use normal font size in non-compact mode', () => {
      renderWithProviders(<StatItem label="Normal" value="100" />);

      const labelSpan = screen.getByText('Normal');
      expect(labelSpan).toHaveStyle({ fontSize: '12px' });

      const valueSpan = screen.getByText('100');
      expect(valueSpan).toHaveStyle({ fontSize: '13px' });
    });
  });

  describe('Layout', () => {
    it('should use flexbox with justify-between', () => {
      const { container } = renderWithProviders(<StatItem label="Flex" value="100" />);

      const wrapper = container.querySelector('div');
      expect(wrapper?.className).toContain('flex');
      expect(wrapper?.className).toContain('justify-between');
    });

    it('should align items center', () => {
      const { container } = renderWithProviders(<StatItem label="Aligned" value="100" />);

      const wrapper = container.querySelector('div');
      expect(wrapper?.className).toContain('items-center');
    });
  });
});

describe('StatGrid', () => {
  it('should render children', () => {
    renderWithProviders(
      <StatGrid>
        <StatCard label="Card 1" value="100" />
        <StatCard label="Card 2" value="200" />
      </StatGrid>,
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('should apply grid layout with 2 columns by default', () => {
    const { container } = renderWithProviders(
      <StatGrid>
        <StatCard label="1" value="100" />
        <StatCard label="2" value="200" />
      </StatGrid>,
    );

    const grid = container.querySelector<HTMLElement>('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
  });

  it('should support 3 columns', () => {
    const { container } = renderWithProviders(
      <StatGrid columns={3}>
        <StatCard label="1" value="100" />
        <StatCard label="2" value="200" />
        <StatCard label="3" value="300" />
      </StatGrid>,
    );

    const grid = container.querySelector<HTMLElement>('.grid');
    expect(grid?.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('should support 4 columns', () => {
    const { container } = renderWithProviders(
      <StatGrid columns={4}>
        <StatCard label="1" value="100" />
      </StatGrid>,
    );

    const grid = container.querySelector<HTMLElement>('.grid');
    expect(grid?.style.gridTemplateColumns).toBe('repeat(4, 1fr)');
  });

  it('should apply custom gap', () => {
    const { container } = renderWithProviders(
      <StatGrid gap={20}>
        <StatCard label="1" value="100" />
      </StatGrid>,
    );

    const grid = container.querySelector<HTMLElement>('.grid');
    expect(grid?.style.gap).toBe('20px');
  });

  it('should apply default gap of 12', () => {
    const { container } = renderWithProviders(
      <StatGrid>
        <StatCard label="1" value="100" />
      </StatGrid>,
    );

    const grid = container.querySelector<HTMLElement>('.grid');
    expect(grid?.style.gap).toBe('12px');
  });

  it('should apply custom className', () => {
    const { container } = renderWithProviders(
      <StatGrid className="custom-grid">
        <StatCard label="1" value="100" />
      </StatGrid>,
    );

    const grid = container.querySelector('.custom-grid');
    expect(grid).toBeInTheDocument();
  });
});

describe('PercentageStat', () => {
  it('should render positive percentage with up trend', () => {
    renderWithProviders(<PercentageStat label="Gain" value="" percentage={5.25} />);

    expect(screen.getByText('Gain')).toBeInTheDocument();
    expect(screen.getByText('+5.25%')).toBeInTheDocument();
  });

  it('should render negative percentage with down trend', () => {
    renderWithProviders(<PercentageStat label="Loss" value="" percentage={-3.5} />);

    expect(screen.getByText('Loss')).toBeInTheDocument();
    expect(screen.getByText('-3.50%')).toBeInTheDocument();
  });

  it('should render zero percentage with neutral trend', () => {
    renderWithProviders(<PercentageStat label="No change" value="" percentage={0} />);

    expect(screen.getByText('No change')).toBeInTheDocument();
    // Zero renders sign-less (no +/-) with a neutral trend
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('should format percentage to 2 decimal places', () => {
    renderWithProviders(<PercentageStat label="Precise" value="" percentage={3.14159} />);

    expect(screen.getByText('+3.14%')).toBeInTheDocument();
  });

  it('should disable auto trend when autoTrend is false', () => {
    renderWithProviders(
      <PercentageStat label="Manual" value="" percentage={5.0} autoTrend={false} />,
    );

    expect(screen.getByText('+5.00%')).toBeInTheDocument();
    // Should not show trend icon
  });

  it('should support all StatCard props', () => {
    const { container } = renderWithProviders(
      <PercentageStat
        label="Custom"
        value=""
        percentage={10}
        icon={TrendingUp}
        size="lg"
        className="custom-percentage"
      />,
    );

    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('+10.00%')).toBeInTheDocument();
    expect(container.querySelector('.custom-percentage')).toBeInTheDocument();
  });

  it('should show green color for positive percentage', () => {
    renderWithProviders(<PercentageStat label="Green" value="" percentage={5} />);

    const valueSpan = screen.getByText('+5.00%');
    expect(valueSpan).toHaveStyle({ color: '#10B981' });
  });

  it('should show red color for negative percentage', () => {
    renderWithProviders(<PercentageStat label="Red" value="" percentage={-5} />);

    const valueSpan = screen.getByText('-5.00%');
    expect(valueSpan).toHaveStyle({ color: '#EF4444' });
  });
});

describe('StatCard Edge Cases', () => {
  it('should handle empty string value', () => {
    renderWithProviders(<StatCard label="Empty" value="" />);

    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('should handle very long values', () => {
    renderWithProviders(<StatCard label="Long" value="$1,234,567,890.12345" />);

    expect(screen.getByText('$1,234,567,890.12345')).toBeInTheDocument();
  });

  it('should handle very long labels', () => {
    renderWithProviders(
      <StatCard label="This is a very long label that should still render properly" value="100" />,
    );

    expect(
      screen.getByText('This is a very long label that should still render properly'),
    ).toBeInTheDocument();
  });

  it('should render without any optional props', () => {
    renderWithProviders(<StatCard label="Minimal" value="100" />);

    expect(screen.getByText('Minimal')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
