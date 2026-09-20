/**
 * ══════════════════════════════════════════════════════════
 *  SectionHeader Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for section header component
 *
 *  Run: npx vitest run src/app/__tests__/SectionHeader.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionHeader } from '../components/ui/SectionHeader';

describe('SectionHeader', () => {
  describe('Basic Rendering', () => {
    it('should render title', () => {
      render(<SectionHeader title="Market Overview" />);

      expect(screen.getByText('Market Overview')).toBeInTheDocument();
    });

    it('should render as h3 element', () => {
      render(<SectionHeader title="Test Title" />);

      const title = screen.getByText('Test Title');
      expect(title.tagName).toBe('H3');
    });

    it('should render subtitle when provided', () => {
      render(
        <SectionHeader
          title="Title"
          subtitle="This is a description"
        />
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should not render subtitle when not provided', () => {
      const { container } = render(<SectionHeader title="Title" />);

      const paragraph = container.querySelector('p');
      expect(paragraph).not.toBeInTheDocument();
    });
  });

  describe('Title Styling', () => {
    it('should apply default font size of 14px', () => {
      render(<SectionHeader title="Test" />);

      const title = screen.getByText('Test');
      expect(title).toHaveStyle({ fontSize: '14px' });
    });

    it('should apply custom title size', () => {
      render(<SectionHeader title="Test" titleSize={18} />);

      const title = screen.getByText('Test');
      expect(title).toHaveStyle({ fontSize: '18px' });
    });

    it('should have font weight 700', () => {
      render(<SectionHeader title="Test" />);

      const title = screen.getByText('Test');
      expect(title).toHaveStyle({ fontWeight: '700' });
    });

    it('should have line height 1.3', () => {
      render(<SectionHeader title="Test" />);

      const title = screen.getByText('Test');
      expect(title).toHaveStyle({ lineHeight: '1.3' });
    });

    it('should have text-truncate class', () => {
      render(<SectionHeader title="Test" />);

      const title = screen.getByText('Test');
      expect(title).toHaveClass('text-truncate');
    });

    it('should use theme color for title', () => {
      render(<SectionHeader title="Test" />);

      const title = screen.getByText('Test');
      expect(title).toHaveStyle({ color: 'var(--tr-text-1)' });
    });
  });

  describe('Subtitle Styling', () => {
    it('should apply font size 12px', () => {
      render(<SectionHeader title="Title" subtitle="Subtitle" />);

      const subtitle = screen.getByText('Subtitle');
      expect(subtitle).toHaveStyle({ fontSize: '12px' });
    });

    it('should have line height 1.4', () => {
      render(<SectionHeader title="Title" subtitle="Subtitle" />);

      const subtitle = screen.getByText('Subtitle');
      expect(subtitle).toHaveStyle({ lineHeight: '1.4' });
    });

    it('should have margin top 2px', () => {
      render(<SectionHeader title="Title" subtitle="Subtitle" />);

      const subtitle = screen.getByText('Subtitle');
      expect(subtitle).toHaveStyle({ marginTop: '2px' });
    });

    it('should use theme color for subtitle', () => {
      render(<SectionHeader title="Title" subtitle="Subtitle" />);

      const subtitle = screen.getByText('Subtitle');
      expect(subtitle).toHaveStyle({ color: 'var(--tr-text-3)' });
    });
  });

  describe('Accent Bar', () => {
    it('should not show accent bar by default', () => {
      const { container } = render(<SectionHeader title="Test" />);

      const accentBar = container.querySelector('.shrink-0');
      // Check if there's a div with specific width/height (accent bar)
      const divs = container.querySelectorAll('div');
      const hasAccent = Array.from(divs).some(div => {
        const style = window.getComputedStyle(div);
        return style.width === '3px' && style.height === '16px';
      });

      expect(hasAccent).toBe(false);
    });

    it('should show accent bar when enabled', () => {
      const { container } = render(<SectionHeader title="Test" accent />);

      const accentDivs = container.querySelectorAll('div.shrink-0');
      expect(accentDivs.length).toBeGreaterThan(0);
    });

    it('should use default amber accent color', () => {
      const { container } = render(<SectionHeader title="Test" accent />);

      const divs = container.querySelectorAll('div');
      const accentBar = Array.from(divs).find(div => {
        return div.style.background === 'rgb(229, 138, 0)';
      });

      expect(accentBar).toBeDefined();
    });

    it('should use custom accent color', () => {
      const { container } = render(
        <SectionHeader title="Test" accent accentColor="#10B981" />
      );

      const divs = container.querySelectorAll('div');
      const accentBar = Array.from(divs).find(div => {
        return div.style.background === 'rgb(16, 185, 129)';
      });

      expect(accentBar).toBeDefined();
    });

    it('should have correct accent bar dimensions', () => {
      const { container } = render(<SectionHeader title="Test" accent />);

      const divs = container.querySelectorAll('div');
      const accentBar = Array.from(divs).find(div => {
        return div.style.width === '4px';
      });

      expect(accentBar).toBeDefined();
      if (accentBar) {
        expect(accentBar.style.height).toBe('16px');
        expect(accentBar.style.borderRadius).toBe('2px');
      }
    });
  });

  describe('Variants', () => {
    it('should render plain variant by default', () => {
      const { container } = render(<SectionHeader title="Test" />);

      const divs = container.querySelectorAll('div');
      const accentBar = Array.from(divs).find(div => {
        return div.style.width === '4px' && div.style.height === '16px';
      });

      expect(accentBar).toBeUndefined();
    });

    it('should render accentBar variant', () => {
      const { container } = render(
        <SectionHeader title="Test" variant="accentBar" />
      );

      const divs = container.querySelectorAll('div');
      const accentBar = Array.from(divs).find(div => {
        return div.style.width === '4px' && div.style.height === '16px';
      });

      expect(accentBar).toBeDefined();
    });

    it('should render markerTitle variant with larger title', () => {
      render(<SectionHeader title="Test" variant="markerTitle" />);

      const title = screen.getByText('Test');
      expect(title).toHaveStyle({ fontSize: '16px', fontWeight: '600' });
    });

    it('should render action label with chevron', () => {
      const onAction = vi.fn();
      render(
        <SectionHeader
          title="Test"
          actionLabel="Xem thêm"
          onAction={onAction}
        />
      );

      expect(screen.getByText('Xem thêm')).toBeInTheDocument();
    });

    it('should call onAction when action label clicked', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();
      render(
        <SectionHeader
          title="Test"
          actionLabel="Xem thêm"
          onAction={onAction}
        />
      );

      await user.click(screen.getByText('Xem thêm'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Right Action', () => {
    it('should not render right section by default', () => {
      const { container } = render(<SectionHeader title="Test" />);

      // Count shrink-0 divs (right section is one of them)
      const shrinkDivs = container.querySelectorAll('.shrink-0');
      // Should be 0 if no accent and no right action
      expect(shrinkDivs.length).toBe(0);
    });

    it('should render right action when provided', () => {
      render(
        <SectionHeader
          title="Test"
          right={<button>View All</button>}
        />
      );

      expect(screen.getByText('View All')).toBeInTheDocument();
    });

    it('should render button in right section', () => {
      render(
        <SectionHeader
          title="Test"
          right={<button>Action</button>}
        />
      );

      const button = screen.getByRole('button', { name: 'Action' });
      expect(button).toBeInTheDocument();
    });

    it('should render link in right section', () => {
      render(
        <SectionHeader
          title="Test"
          right={<a href="/all">See all</a>}
        />
      );

      const link = screen.getByText('See all');
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
    });

    it('should render badge in right section', () => {
      render(
        <SectionHeader
          title="Test"
          right={<span className="badge">New</span>}
        />
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  describe('Margin Bottom', () => {
    it('should apply default margin bottom of 12px', () => {
      const { container } = render(<SectionHeader title="Test" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ marginBottom: '12px' });
    });

    it('should apply custom margin bottom', () => {
      const { container } = render(<SectionHeader title="Test" mb={24} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ marginBottom: '24px' });
    });

    it('should support zero margin bottom', () => {
      const { container } = render(<SectionHeader title="Test" mb={0} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ marginBottom: '0px' });
    });
  });

  describe('Custom className', () => {
    it('should not have custom className by default', () => {
      const { container } = render(<SectionHeader title="Test" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex items-center gap-2');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SectionHeader title="Test" className="custom-header" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('custom-header');
    });

    it('should preserve base classes with custom className', () => {
      const { container } = render(
        <SectionHeader title="Test" className="custom" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('gap-2');
      expect(wrapper).toHaveClass('custom');
    });
  });

  describe('Layout', () => {
    it('should use flex layout', () => {
      const { container } = render(<SectionHeader title="Test" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('items-center');
    });

    it('should have gap-2 between elements', () => {
      const { container } = render(<SectionHeader title="Test" />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('gap-2');
    });

    it('should have flex-1 on title container', () => {
      const { container } = render(<SectionHeader title="Test" />);

      const titleContainer = container.querySelector('.flex-1');
      expect(titleContainer).toBeInTheDocument();
    });

    it('should have min-w-0 on title container for text truncation', () => {
      const { container } = render(<SectionHeader title="Test" />);

      const titleContainer = container.querySelector('.min-w-0');
      expect(titleContainer).toBeInTheDocument();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should render market section header', () => {
      render(
        <SectionHeader
          title="Thị trường"
          subtitle="24h Volume: $1.2B"
          right={<button>Xem tất cả</button>}
        />
      );

      expect(screen.getByText('Thị trường')).toBeInTheDocument();
      expect(screen.getByText('24h Volume: $1.2B')).toBeInTheDocument();
      expect(screen.getByText('Xem tất cả')).toBeInTheDocument();
    });

    it('should render portfolio section with accent', () => {
      render(
        <SectionHeader
          title="Portfolio"
          accent
          accentColor="#10B981"
        />
      );

      expect(screen.getByText('Portfolio')).toBeInTheDocument();
    });

    it('should render activity section with custom size', () => {
      render(
        <SectionHeader
          title="Recent Activity"
          titleSize={16}
          mb={16}
        />
      );

      const title = screen.getByText('Recent Activity');
      expect(title).toHaveStyle({ fontSize: '16px' });
    });

    it('should render trending section with right action', () => {
      render(
        <SectionHeader
          title="Trending"
          right={
            <a href="/trending" style={{ color: '#3B82F6', fontSize: 13 }}>
              See all →
            </a>
          }
        />
      );

      expect(screen.getByText('Trending')).toBeInTheDocument();
      expect(screen.getByText('See all →')).toBeInTheDocument();
    });
  });

  describe('Complex Layouts', () => {
    it('should render with accent and right action', () => {
      render(
        <SectionHeader
          title="Hot Markets"
          accent
          accentColor="#F59E0B"
          right={<button>View</button>}
        />
      );

      expect(screen.getByText('Hot Markets')).toBeInTheDocument();
      expect(screen.getByText('View')).toBeInTheDocument();
    });

    it('should render with all options combined', () => {
      render(
        <SectionHeader
          title="Complete Example"
          subtitle="With all features"
          accent
          accentColor="#EF4444"
          titleSize={16}
          right={<span className="badge">3</span>}
          className="section-header"
          mb={20}
        />
      );

      expect(screen.getByText('Complete Example')).toBeInTheDocument();
      expect(screen.getByText('With all features')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'This is a very long title that should be truncated properly when it exceeds the container width';
      render(<SectionHeader title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
      expect(screen.getByText(longTitle)).toHaveClass('text-truncate');
    });

    it('should handle very long subtitles', () => {
      const longSubtitle = 'This is a very long subtitle with a lot of text';
      render(
        <SectionHeader title="Title" subtitle={longSubtitle} />
      );

      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('should handle empty title', () => {
      render(<SectionHeader title="" />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      render(<SectionHeader title="Title with <special> & characters" />);

      expect(screen.getByText('Title with <special> & characters')).toBeInTheDocument();
    });

    it('should handle Vietnamese characters', () => {
      render(
        <SectionHeader
          title="Thị trường crypto"
          subtitle="Biến động 24 giờ"
        />
      );

      expect(screen.getByText('Thị trường crypto')).toBeInTheDocument();
      expect(screen.getByText('Biến động 24 giờ')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic h3 element for title', () => {
      render(<SectionHeader title="Accessible Title" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Accessible Title');
    });

    it('should have zero margin on heading', () => {
      render(<SectionHeader title="Test" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveStyle({ margin: '0' });
    });

    it('should allow screen readers to read title and subtitle', () => {
      render(
        <SectionHeader
          title="Main Title"
          subtitle="Supporting description"
        />
      );

      const title = screen.getByText('Main Title');
      const subtitle = screen.getByText('Supporting description');

      expect(title).toBeVisible();
      expect(subtitle).toBeVisible();
    });
  });
});
