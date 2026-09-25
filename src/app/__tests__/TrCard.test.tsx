/**
 * ══════════════════════════════════════════════════════════
 *  TrCard Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for enterprise card component
 *
 *  Run: npx vitest run src/app/__tests__/TrCard.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrCard, TrCardStat } from '../components/ui/TrCard';

describe('TrCard', () => {
  describe('Basic Rendering', () => {
    it('should render children', () => {
      render(<TrCard>Test content</TrCard>);

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render as div by default', () => {
      const { container } = render(<TrCard>Content</TrCard>);

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('should render with custom className', () => {
      const { container } = render(<TrCard className="custom-class">Content</TrCard>);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render with data-testid', () => {
      render(<TrCard data-testid="test-card">Content</TrCard>);

      expect(screen.getByTestId('test-card')).toBeInTheDocument();
    });

    it('should render with id', () => {
      const { container } = render(<TrCard id="card-1">Content</TrCard>);

      expect(container.firstChild).toHaveAttribute('id', 'card-1');
    });
  });

  describe('Variants', () => {
    it('should render standard variant by default', () => {
      const { container } = render(<TrCard>Standard</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.background).toBe('var(--tr-surface)');
      expect(card.style.border).toContain('var(--tr-card-border)');
      expect(card.style.boxShadow).toBe('var(--tr-card-shadow)');
    });

    it('should render hero variant correctly', () => {
      const { container } = render(<TrCard variant="hero">Hero</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.background).toBe('var(--tr-portfolio-bg)');
      expect(card.style.border).toContain('var(--tr-portfolio-border)');
      expect(card.style.boxShadow).toBe('var(--tr-portfolio-shadow)');
    });

    it('should render inner variant correctly', () => {
      const { container } = render(<TrCard variant="inner">Inner</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.background).toBe('var(--tr-surface-2)');
      expect(card.style.borderStyle).toBe('none');
      expect(card.style.boxShadow).toBe('none');
    });

    it('should render ghost variant correctly', () => {
      const { container } = render(<TrCard variant="ghost">Ghost</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.background).toBe('transparent');
      expect(card.style.borderStyle).toBe('none');
      expect(card.style.boxShadow).toBe('none');
    });
  });

  describe('Rounded Prop', () => {
    it('should apply medium rounded by default', () => {
      const { container } = render(<TrCard>Content</TrCard>);

      expect(container.firstChild).toHaveClass('rounded-2xl');
    });

    it('should apply small rounded', () => {
      const { container } = render(<TrCard rounded="sm">Content</TrCard>);

      expect(container.firstChild).toHaveClass('rounded-xl');
    });

    it('should apply medium rounded', () => {
      const { container } = render(<TrCard rounded="md">Content</TrCard>);

      expect(container.firstChild).toHaveClass('rounded-2xl');
    });

    it('should apply large rounded', () => {
      const { container } = render(<TrCard rounded="lg">Content</TrCard>);

      expect(container.firstChild).toHaveClass('rounded-3xl');
    });
  });

  describe('Hover Prop', () => {
    it('should not have hover class by default', () => {
      const { container } = render(<TrCard>Content</TrCard>);

      expect(container.firstChild).not.toHaveClass('hover-card');
    });

    it('should apply hover class when enabled', () => {
      const { container } = render(<TrCard hover>Content</TrCard>);

      expect(container.firstChild).toHaveClass('hover-card');
    });
  });

  describe('Overflow Prop', () => {
    it('should not have overflow-hidden by default', () => {
      const { container } = render(<TrCard>Content</TrCard>);

      expect(container.firstChild).not.toHaveClass('overflow-hidden');
    });

    it('should apply overflow-hidden when enabled', () => {
      const { container } = render(<TrCard overflow>Content</TrCard>);

      expect(container.firstChild).toHaveClass('overflow-hidden');
    });
  });

  describe('Accent Border', () => {
    it('should not have accent border by default', () => {
      const { container } = render(<TrCard variant="standard">Content</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.border).toContain('var(--tr-card-border)');
    });

    it('should override border with accent color', () => {
      const { container } = render(<TrCard accentBorder="rgba(16,185,129,0.2)">Content</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.border).toBe('1px solid rgba(16, 185, 129, 0.2)');
    });

    it('should support custom accent colors', () => {
      const { container } = render(<TrCard accentBorder="#EF4444">Content</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.border).toBe('1px solid rgb(239, 68, 68)');
    });
  });

  describe('As Prop (Polymorphic)', () => {
    it('should render as div by default', () => {
      const { container } = render(<TrCard>Content</TrCard>);

      expect(container.firstChild?.nodeName).toBe('DIV');
    });

    it('should render as button', () => {
      const { container } = render(<TrCard as="button">Content</TrCard>);

      expect(container.firstChild?.nodeName).toBe('BUTTON');
    });

    it('should render as section', () => {
      const { container } = render(<TrCard as="section">Content</TrCard>);

      expect(container.firstChild?.nodeName).toBe('SECTION');
    });

    it('should render as article', () => {
      const { container } = render(<TrCard as="article">Content</TrCard>);

      expect(container.firstChild?.nodeName).toBe('ARTICLE');
    });
  });

  describe('Event Handlers', () => {
    it('should handle onClick', () => {
      let clicked = false;
      const { container } = render(
        <TrCard
          onClick={() => {
            clicked = true;
          }}
        >
          Clickable
        </TrCard>,
      );

      (container.firstChild as HTMLElement).click();

      expect(clicked).toBe(true);
    });

    it('should handle onMouseEnter', () => {
      let entered = false;
      const { container } = render(
        <TrCard
          onMouseEnter={() => {
            entered = true;
          }}
        >
          Hoverable
        </TrCard>,
      );

      const card = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(card);

      expect(entered).toBe(true);
    });

    it('should handle onMouseLeave', () => {
      let left = false;
      const { container } = render(
        <TrCard
          onMouseLeave={() => {
            left = true;
          }}
        >
          Hoverable
        </TrCard>,
      );

      const card = container.firstChild as HTMLElement;
      fireEvent.mouseLeave(card);

      expect(left).toBe(true);
    });
  });

  describe('Custom Styles', () => {
    it('should merge custom inline styles', () => {
      const { container } = render(
        <TrCard style={{ padding: '20px', margin: '10px' }}>Content</TrCard>,
      );
      const card = container.firstChild as HTMLElement;

      expect(card.style.padding).toBe('20px');
      expect(card.style.margin).toBe('10px');
    });

    it('should allow overriding variant styles', () => {
      const { container } = render(<TrCard style={{ background: 'red' }}>Content</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.background).toBe('red');
    });
  });

  describe('Accessibility', () => {
    it('should support role attribute', () => {
      const { container } = render(<TrCard role="region">Content</TrCard>);

      expect(container.firstChild).toHaveAttribute('role', 'region');
    });

    it('should support aria-label', () => {
      const { container } = render(<TrCard aria-label="Portfolio card">Content</TrCard>);

      expect(container.firstChild).toHaveAttribute('aria-label', 'Portfolio card');
    });

    it('should be focusable when rendered as button', () => {
      const { container } = render(<TrCard as="button">Content</TrCard>);

      expect(container.firstChild).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Combined Props', () => {
    it('should combine variant, rounded, and hover', () => {
      const { container } = render(
        <TrCard variant="hero" rounded="lg" hover>
          Combined
        </TrCard>,
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('rounded-3xl');
      expect(card).toHaveClass('hover-card');
      expect(card.style.background).toBe('var(--tr-portfolio-bg)');
    });

    it('should combine all customization options', () => {
      const { container } = render(
        <TrCard
          variant="inner"
          rounded="sm"
          hover
          overflow
          accentBorder="#10B981"
          className="custom"
          style={{ padding: '16px' }}
        >
          Full featured
        </TrCard>,
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('rounded-xl');
      expect(card).toHaveClass('hover-card');
      expect(card).toHaveClass('overflow-hidden');
      expect(card).toHaveClass('custom');
      expect(card.style.border).toBe('1px solid rgb(16, 185, 129)');
      expect(card.style.padding).toBe('16px');
    });
  });

  describe('Density & Alignment', () => {
    it('should apply density-driven padding', () => {
      const { container } = render(<TrCard density="standard">Standard density</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.padding).toBe('16px');
    });

    it('should apply compact density padding', () => {
      const { container } = render(<TrCard density="compact">Compact density</TrCard>);
      const card = container.firstChild as HTMLElement;

      expect(card.style.padding).toBe('12px');
    });

    it('should allow explicit padding override', () => {
      const { container } = render(
        <TrCard density="compact" padding={24}>
          Custom padding
        </TrCard>,
      );
      const card = container.firstChild as HTMLElement;

      expect(card.style.padding).toBe('24px');
    });

    it('should center content when contentAlign is center', () => {
      const { container } = render(
        <TrCard contentAlign="center" style={{ height: 120 }}>
          Centered
        </TrCard>,
      );
      const card = container.firstChild as HTMLElement;
      const wrapper = card.firstChild as HTMLElement;

      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('should override background with background prop', () => {
      const { container } = render(
        <TrCard background="linear-gradient(red, blue)">Custom bg</TrCard>,
      );
      const card = container.firstChild as HTMLElement;

      expect(card.style.background).toBe('linear-gradient(red, blue)');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should render portfolio hero card', () => {
      const { container } = render(
        <TrCard variant="hero" rounded="lg">
          <div>Portfolio Balance</div>
        </TrCard>,
      );
      const card = container.firstChild as HTMLElement;

      expect(card).toHaveClass('rounded-3xl');
      expect(card.style.background).toBe('var(--tr-portfolio-bg)');
      expect(screen.getByText('Portfolio Balance')).toBeInTheDocument();
    });

    it('should render clickable market card', () => {
      let clicked = false;
      const { container } = render(
        <TrCard
          hover
          onClick={() => {
            clicked = true;
          }}
        >
          BTC/USDT
        </TrCard>,
      );

      expect(container.firstChild).toHaveClass('hover-card');

      (container.firstChild as HTMLElement).click();
      expect(clicked).toBe(true);
    });

    it('should render nested inner card', () => {
      render(
        <TrCard variant="hero">
          <TrCard variant="inner">Nested content</TrCard>
        </TrCard>,
      );

      expect(screen.getByText('Nested content')).toBeInTheDocument();
    });

    it('should render position card with accent border', () => {
      const { container } = render(
        <TrCard accentBorder="rgba(16,185,129,0.2)">Long Position</TrCard>,
      );
      const card = container.firstChild as HTMLElement;

      expect(card.style.border).toBe('1px solid rgba(16, 185, 129, 0.2)');
      expect(screen.getByText('Long Position')).toBeInTheDocument();
    });

    it('should render button card for interaction', () => {
      const { container } = render(
        <TrCard as="button" hover>
          Tap to trade
        </TrCard>,
      );

      expect(container.firstChild?.nodeName).toBe('BUTTON');
      expect(container.firstChild).toHaveClass('hover-card');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<TrCard />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      render(
        <TrCard>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </TrCard>,
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should handle complex nested content', () => {
      render(
        <TrCard>
          <div>
            <h1>Title</h1>
            <p>Description</p>
            <button>Action</button>
          </div>
        </TrCard>,
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });
});

describe('TrCardStat', () => {
  describe('Basic Rendering', () => {
    it('should render children', () => {
      render(<TrCardStat>Stat value</TrCardStat>);

      expect(screen.getByText('Stat value')).toBeInTheDocument();
    });

    it('should render as div', () => {
      const { container } = render(<TrCardStat>Content</TrCardStat>);

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct base classes', () => {
      const { container } = render(<TrCardStat>Content</TrCardStat>);

      expect(container.firstChild).toHaveClass('rounded-xl');
      expect(container.firstChild).toHaveClass('p-2.5');
    });
  });

  describe('Styling', () => {
    it('should apply portfolio button ghost background', () => {
      const { container } = render(<TrCardStat>Content</TrCardStat>);
      const stat = container.firstChild as HTMLElement;

      expect(stat.style.background).toBe('var(--tr-portfolio-btn-ghost)');
    });

    it('should support custom className', () => {
      const { container } = render(<TrCardStat className="custom-stat">Content</TrCardStat>);

      expect(container.firstChild).toHaveClass('custom-stat');
      expect(container.firstChild).toHaveClass('rounded-xl');
    });

    it('should support custom styles', () => {
      const { container } = render(<TrCardStat style={{ padding: '10px' }}>Content</TrCardStat>);
      const stat = container.firstChild as HTMLElement;

      expect(stat.style.padding).toBe('10px');
    });
  });

  describe('Real-world Usage', () => {
    it('should render inside hero card', () => {
      render(
        <TrCard variant="hero">
          <TrCardStat>
            <div>Total Balance</div>
            <div>$10,000</div>
          </TrCardStat>
        </TrCard>,
      );

      expect(screen.getByText('Total Balance')).toBeInTheDocument();
      expect(screen.getByText('$10,000')).toBeInTheDocument();
    });

    it('should support multiple stats in one card', () => {
      render(
        <TrCard variant="hero">
          <TrCardStat>Stat 1</TrCardStat>
          <TrCardStat>Stat 2</TrCardStat>
          <TrCardStat>Stat 3</TrCardStat>
        </TrCard>,
      );

      expect(screen.getByText('Stat 1')).toBeInTheDocument();
      expect(screen.getByText('Stat 2')).toBeInTheDocument();
      expect(screen.getByText('Stat 3')).toBeInTheDocument();
    });

    it('should render portfolio metrics', () => {
      render(
        <TrCardStat>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>P/L Today</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#10B981' }}>+$125.50</div>
        </TrCardStat>,
      );

      expect(screen.getByText('P/L Today')).toBeInTheDocument();
      expect(screen.getByText('+$125.50')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<TrCardStat />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle complex nested content', () => {
      render(
        <TrCardStat>
          <div>
            <span>Label:</span>
            <strong>Value</strong>
          </div>
        </TrCardStat>,
      );

      expect(screen.getByText('Label:')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });
  });
});
