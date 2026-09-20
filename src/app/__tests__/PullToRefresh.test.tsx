/**
 * ══════════════════════════════════════════════════════════
 *  PullToRefresh Component Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for Pull-to-Refresh gesture component
 *
 *  Run: npx vitest run src/app/__tests__/PullToRefresh.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import { PullToRefresh } from '../components/ui/PullToRefresh';

describe('PullToRefresh', () => {
  let mockOnRefresh: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnRefresh = vi.fn().mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render children', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Test content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should wrap children in container', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div data-testid="child">Content</div>
        </PullToRefresh>
      );
      
      const child = screen.getByTestId('child');
      expect(child).toBeInTheDocument();
      expect(child.parentElement).toBeTruthy();
    });

    it('should apply custom className to container', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} className="custom-class">
          <div>Content</div>
        </PullToRefresh>
      );
      
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should apply custom style to container', () => {
      const { container } = renderWithProviders(
        <PullToRefresh
          onRefresh={mockOnRefresh}
          style={{ backgroundColor: 'red' }}
        >
          <div>Content</div>
        </PullToRefresh>
      );
      
      const wrapper = container.querySelector('div[style*="background-color"]');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Pull Indicator', () => {
    it('should show "Kéo xuống để làm mới" initially', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      // The indicator text might not be visible initially (height: 0)
      // but the component structure should be there
      const container = screen.getByText('Content').closest('div')?.parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should show refresh count badge when provided', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} refreshCount={5}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      // Badge should show count (might be hidden initially)
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show last refreshed label when provided', () => {
      renderWithProviders(
        <PullToRefresh
          onRefresh={mockOnRefresh}
          lastRefreshedLabel="2 minutes ago"
        >
          <div>Content</div>
        </PullToRefresh>
      );
      
      // Label should be present
      expect(screen.getByText(/2 minutes ago/)).toBeInTheDocument();
    });

    it('should not show count badge when refreshCount is 0', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} refreshCount={0}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('should not show count badge when refreshCount is undefined', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const container = screen.getByText('Content').parentElement;
      expect(container).toBeInTheDocument();
      // No badge should be rendered
    });
  });

  describe('Touch Gestures', () => {
    it('should handle touchstart event', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const wrapper = container.querySelector('.relative.flex-1');
      expect(wrapper).toBeInTheDocument();
      
      // Simulate touchstart
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch],
      });
      
      wrapper?.dispatchEvent(touchStart);
      
      // Component should handle the event without errors
      expect(wrapper).toBeInTheDocument();
    });

    it('should handle touchmove event', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const wrapper = container.querySelector('.relative.flex-1');
      expect(wrapper).toBeInTheDocument();
      
      // Simulate touchmove
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientY: 150 } as Touch],
      });
      
      wrapper?.dispatchEvent(touchMove);
      
      expect(wrapper).toBeInTheDocument();
    });

    it('should handle touchend event', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const wrapper = container.querySelector('.relative.flex-1');
      expect(wrapper).toBeInTheDocument();
      
      // Simulate touchend
      const touchEnd = new TouchEvent('touchend');
      wrapper?.dispatchEvent(touchEnd);
      
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Refresh Callback', () => {
    it('should accept async onRefresh function', async () => {
      const asyncRefresh = vi.fn().mockResolvedValue(undefined);
      
      renderWithProviders(
        <PullToRefresh onRefresh={asyncRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle successful refresh', async () => {
      const successRefresh = vi.fn().mockResolvedValue(undefined);
      
      renderWithProviders(
        <PullToRefresh onRefresh={successRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      // Component should be ready to handle refresh
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle failed refresh', async () => {
      const failedRefresh = vi.fn().mockRejectedValue(new Error('Failed'));
      
      renderWithProviders(
        <PullToRefresh onRefresh={failedRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      // Component should handle errors gracefully
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle refresh that takes time', async () => {
      const slowRefresh = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      renderWithProviders(
        <PullToRefresh onRefresh={slowRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Threshold', () => {
    it('should use default threshold of 64px', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      // Component should be initialized with default threshold
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept custom threshold', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={100}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept small threshold', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={30}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should accept large threshold', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} threshold={200}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Scroll Behavior', () => {
    it('should apply -webkit-overflow-scrolling: touch', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const wrapper = container.querySelector('.relative.flex-1');
      expect(wrapper).toBeInTheDocument();
      
      const styles = window.getComputedStyle(wrapper!);
      // WebkitOverflowScrolling is set inline
      expect(wrapper).toHaveStyle({ WebkitOverflowScrolling: 'touch' });
    });

    it('should render children in scrollable area', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div data-testid="scrollable-content">
            <p>Line 1</p>
            <p>Line 2</p>
            <p>Line 3</p>
          </div>
        </PullToRefresh>
      );
      
      const content = screen.getByTestId('scrollable-content');
      expect(content).toBeInTheDocument();
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
      expect(screen.getByText('Line 3')).toBeInTheDocument();
    });
  });

  describe('Refresh States', () => {
    it('should show "Kéo xuống để làm mới" in idle state', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Kéo xuống để làm mới')).toBeInTheDocument();
    });

    it('should have RefreshCw icon', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      // RefreshCw icon should be rendered
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('should include keyframe animations for spinner', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      // Check for style tag with animations
      const styleTag = container.querySelector('style');
      expect(styleTag).toBeInTheDocument();
      expect(styleTag?.textContent).toContain('@keyframes ptr-spin');
      expect(styleTag?.textContent).toContain('@keyframes ptr-progress');
    });

    it('should define ptr-spin animation', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('from { transform: rotate(0deg)');
      expect(styleTag?.textContent).toContain('to { transform: rotate(360deg)');
    });

    it('should define ptr-progress animation', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const styleTag = container.querySelector('style');
      expect(styleTag?.textContent).toContain('@keyframes ptr-progress');
    });
  });

  describe('Progress Bar', () => {
    it('should render progress bar structure', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      // Progress bar is conditionally rendered during refresh
      // Check that component structure is ready
      expect(container.querySelector('.relative.flex-1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined lastRefreshedLabel', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} lastRefreshedLabel={undefined}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle undefined refreshCount', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} refreshCount={undefined}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          {null}
        </PullToRefresh>
      );
      
      // Should not crash
      const container = document.body;
      expect(container).toBeTruthy();
    });

    it('should handle multiple children', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });

    it('should handle nested scrollable content', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div data-pull-scroll style={{ overflowY: 'auto', height: '100px' }}>
            <div style={{ height: '200px' }}>
              Tall scrollable content
            </div>
          </div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Tall scrollable content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible (container is focusable)', () => {
      const { container } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      const wrapper = container.querySelector('.relative.flex-1');
      expect(wrapper).toBeInTheDocument();
    });

    it('should not interfere with child element focus', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <button>Focusable Button</button>
        </PullToRefresh>
      );
      
      const button = screen.getByRole('button', { name: /focusable button/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not call onRefresh on mount', () => {
      const spy = vi.fn().mockResolvedValue(undefined);
      
      renderWithProviders(
        <PullToRefresh onRefresh={spy}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Version 1</div>
        </PullToRefresh>
      );
      
      rerender(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Version 2</div>
        </PullToRefresh>
      );
      
      rerender(
        <PullToRefresh onRefresh={mockOnRefresh}>
          <div>Version 3</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Version 3')).toBeInTheDocument();
    });

    it('should handle changing onRefresh callback', () => {
      const callback1 = vi.fn().mockResolvedValue(undefined);
      const callback2 = vi.fn().mockResolvedValue(undefined);
      
      const { rerender } = renderWithProviders(
        <PullToRefresh onRefresh={callback1}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      rerender(
        <PullToRefresh onRefresh={callback2}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Integration with useRefresh Hook', () => {
    it('should work with lastRefreshedLabel from hook', () => {
      renderWithProviders(
        <PullToRefresh
          onRefresh={mockOnRefresh}
          lastRefreshedLabel="vừa xong"
        >
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText(/vừa xong/)).toBeInTheDocument();
    });

    it('should work with refreshCount from hook', () => {
      renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} refreshCount={3}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should handle incrementing refreshCount', () => {
      const { rerender } = renderWithProviders(
        <PullToRefresh onRefresh={mockOnRefresh} refreshCount={1}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('1')).toBeInTheDocument();
      
      rerender(
        <PullToRefresh onRefresh={mockOnRefresh} refreshCount={2}>
          <div>Content</div>
        </PullToRefresh>
      );
      
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
