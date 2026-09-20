import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithTheme, screen } from '../../../test/test-utils';
import { TrCard } from './TrCard';

/**
 * ══════════════════════════════════════════════════════════
 *  TrCard Component Tests
 * ══════════════════════════════════════════════════════════
 *  Tests the enterprise card component with all variants
 */

describe('TrCard', () => {
  describe('Rendering', () => {
    it('should render children correctly', () => {
      renderWithTheme(<TrCard>Test Content</TrCard>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render as div by default', () => {
      const { container } = renderWithTheme(<TrCard>Content</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.tagName).toBe('DIV');
    });

    it('should render as button when specified', () => {
      const { container } = renderWithTheme(<TrCard as="button">Button Card</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.tagName).toBe('BUTTON');
    });

    it('should render as section when specified', () => {
      const { container } = renderWithTheme(<TrCard as="section">Section Card</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.tagName).toBe('SECTION');
    });
  });

  describe('Variants', () => {
    it('should apply standard variant by default', () => {
      const { container } = renderWithTheme(<TrCard>Standard</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.background).toBeTruthy();
      expect(card.style.border).toBeTruthy();
    });

    it('should apply hero variant styles', () => {
      const { container } = renderWithTheme(<TrCard variant="hero">Hero</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.background).toBeTruthy();
      expect(card.style.boxShadow).toBeTruthy();
    });

    it('should apply inner variant with no border', () => {
      const { container } = renderWithTheme(<TrCard variant="inner">Inner</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.borderStyle).toBe('none');
      expect(card.style.boxShadow).toBe('none');
    });

    it('should apply ghost variant with transparent background', () => {
      const { container } = renderWithTheme(<TrCard variant="ghost">Ghost</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.style.background).toBe('transparent');
      expect(card.style.borderStyle).toBe('none');
    });
  });

  describe('Border Radius', () => {
    it('should apply md (rounded-2xl) by default', () => {
      const { container } = renderWithTheme(<TrCard>Content</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-2xl');
    });

    it('should apply sm border radius', () => {
      const { container } = renderWithTheme(<TrCard rounded="sm">Content</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-xl');
    });

    it('should apply lg border radius', () => {
      const { container } = renderWithTheme(<TrCard rounded="lg">Content</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('rounded-3xl');
    });
  });

  describe('Interactive States', () => {
    it('should add hover class when hover prop is true', () => {
      const { container } = renderWithTheme(<TrCard hover>Hoverable</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover-card');
    });

    it('should handle onClick events', () => {
      const handleClick = vi.fn();
      renderWithTheme(
        <TrCard as="button" onClick={handleClick}>
          Click me
        </TrCard>,
      );
      const button = screen.getByText('Click me');
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle onMouseEnter events', () => {
      const handleMouseEnter = vi.fn();
      renderWithTheme(<TrCard onMouseEnter={handleMouseEnter}>Hover me</TrCard>);
      const card = screen.getByText('Hover me');
      fireEvent.mouseEnter(card);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Styling', () => {
    it('should apply accent border when provided', () => {
      const accentColor = 'rgba(16, 185, 129, 0.2)';
      const { container } = renderWithTheme(
        <TrCard accentBorder="rgba(16,185,129,0.2)">Accent</TrCard>,
      );
      const card = container.firstChild as HTMLElement;
      expect(card.style.border).toContain(accentColor);
    });

    it('should merge custom styles with variant styles', () => {
      const { container } = renderWithTheme(
        <TrCard style={{ padding: '20px', margin: '10px' }}>Custom</TrCard>,
      );
      const card = container.firstChild as HTMLElement;
      expect(card.style.padding).toBe('20px');
      expect(card.style.margin).toBe('10px');
      expect(card.style.background).toBeTruthy(); // Variant style preserved
    });

    it('should apply additional className', () => {
      const { container } = renderWithTheme(<TrCard className="custom-class">Content</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('custom-class');
    });

    it('should clip overflow when overflow prop is true', () => {
      const { container } = renderWithTheme(<TrCard overflow>Content</TrCard>);
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('overflow-hidden');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible when as="button"', () => {
      renderWithTheme(<TrCard as="button">Accessible Button</TrCard>);
      const button = screen.getByText('Accessible Button');
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(button.tabIndex).toBe(0);
    });

    it('should support aria attributes', () => {
      const { container } = renderWithTheme(
        <TrCard as="button" aria-label="Custom Card">
          Content
        </TrCard>,
      );
      const card = container.firstChild as HTMLElement;
      expect(card.getAttribute('aria-label')).toBe('Custom Card');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = renderWithTheme(<TrCard />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle multiple children', () => {
      renderWithTheme(
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
      renderWithTheme(
        <TrCard>
          <div>
            <h2>Title</h2>
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
