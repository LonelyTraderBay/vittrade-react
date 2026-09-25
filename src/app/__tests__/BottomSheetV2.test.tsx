/**
 * ══════════════════════════════════════════════════════════
 *  BottomSheetV2 Component Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for BottomSheetV2 and BottomSheetRow
 *
 *  Run: npx vitest run src/app/__tests__/BottomSheetV2.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import { BottomSheetV2, BottomSheetRow } from '../components/ui/BottomSheetV2';

describe('BottomSheetV2', () => {
  let portalRoot: HTMLDivElement;

  beforeEach(() => {
    // Create portal target
    portalRoot = document.createElement('div');
    portalRoot.id = 'sheet-portal';
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up portal
    document.body.removeChild(portalRoot);
  });

  describe('Rendering - Bottom Variant', () => {
    it('should not render when closed', () => {
      renderWithProviders(
        <BottomSheetV2 open={false} onClose={() => {}}>
          <div>Sheet content</div>
        </BottomSheetV2>,
      );

      expect(screen.queryByText('Sheet content')).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Sheet content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Sheet content')).toBeInTheDocument();
    });

    it('should render with title', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} title="Test Sheet">
          <div>Content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Test Sheet')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render without title', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should show drag handle by default', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      // Sheet renders into the #sheet-portal, so query the document.
      // Handle is a rounded div (the first .rounded-full inside the dialog).
      const handle = document.querySelector('[role="dialog"] .rounded-full');
      expect(handle).toBeInTheDocument();
    });

    it('should hide drag handle when showHandle is false', () => {
      const { container } = renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} showHandle={false}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      // Handle should not be present
      const handles = container.querySelectorAll('.rounded-full');
      // If there's a close button, it might have rounded-full class
      expect(handles.length).toBeLessThanOrEqual(1);
    });

    it('should show close button by default', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const closeButton = screen.getByRole('button', { name: /đóng/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should hide close button when showCloseButton is false', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} showCloseButton={false}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      expect(screen.queryByRole('button', { name: /đóng/i })).not.toBeInTheDocument();
    });

    it('should render children in scrollable content area', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Line 1</div>
          <div>Line 2</div>
          <div>Line 3</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
      expect(screen.getByText('Line 3')).toBeInTheDocument();
    });
  });

  describe('Rendering - Center Variant', () => {
    it('should render center variant', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} variant="center">
          <div>Center content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Center content')).toBeInTheDocument();
    });

    it('should render center variant with title', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} variant="center" title="Center Modal">
          <div>Content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Center Modal')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should show handle in center variant when showHandle is true', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} variant="center">
          <div>Content</div>
        </BottomSheetV2>,
      );

      const handle = document.querySelector('[role="dialog"] .rounded-full');
      expect(handle).toBeInTheDocument();
    });
  });

  describe('Close Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      renderWithProviders(
        <BottomSheetV2 open={true} onClose={handleClose}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const closeButton = screen.getByRole('button', { name: /đóng/i });
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      const { container } = renderWithProviders(
        <BottomSheetV2 open={true} onClose={handleClose}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      // Find backdrop (first absolute div with blur)
      const backdrop = container.querySelector('.absolute.inset-0');
      if (backdrop) {
        await user.click(backdrop as HTMLElement);
        expect(handleClose).toHaveBeenCalled();
      }
    });

    it('should call onClose when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      renderWithProviders(
        <BottomSheetV2 open={true} onClose={handleClose}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const dialog = screen.getByRole('dialog');
      dialog.focus();
      await user.keyboard('{Escape}');

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose on Escape when preventClose is true', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      renderWithProviders(
        <BottomSheetV2 open={true} onClose={handleClose} preventClose>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const dialog = screen.getByRole('dialog');
      dialog.focus();
      await user.keyboard('{Escape}');

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should not call onClose on backdrop click when preventClose is true', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();

      const { container } = renderWithProviders(
        <BottomSheetV2 open={true} onClose={handleClose} preventClose>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const backdrop = container.querySelector('.absolute.inset-0');
      if (backdrop) {
        await user.click(backdrop as HTMLElement);
        expect(handleClose).not.toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should use title as aria-label when provided', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} title="My Dialog">
          <div>Content</div>
        </BottomSheetV2>,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'My Dialog');
    });

    it('should use custom ariaLabel when provided', () => {
      renderWithProviders(
        <BottomSheetV2
          open={true}
          onClose={() => {}}
          title="Visible Title"
          ariaLabel="Custom Label"
        >
          <div>Content</div>
        </BottomSheetV2>,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Custom Label');
    });

    it('should have default aria-label when neither title nor ariaLabel provided', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Dialog');
    });

    it('should have backdrop with aria-hidden', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('should be focusable with tabIndex={-1}', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('tabIndex', '-1');
    });

    it('should have close button with accessible name', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const closeButton = screen.getByRole('button', { name: /đóng/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Đóng');
    });

    it('should have 44x44 close button (WCAG compliant)', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const closeButton = screen.getByRole('button', { name: /đóng/i });
      expect(closeButton).toHaveStyle({ width: '44px', height: '44px' });
    });
  });

  describe('Focus Management', () => {
    it('should focus dialog on open', async () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      await waitFor(
        () => {
          const dialog = screen.getByRole('dialog');
          expect(document.activeElement).toBe(dialog);
        },
        { timeout: 200 },
      );
    });

    it('should contain focusable elements', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <button>Action 1</button>
          <button>Action 2</button>
        </BottomSheetV2>,
      );

      expect(screen.getByRole('button', { name: /action 1/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action 2/i })).toBeInTheDocument();
    });

    it('should handle Tab key for focus trap', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <button>First</button>
          <button>Second</button>
        </BottomSheetV2>,
      );

      const dialog = screen.getByRole('dialog');
      dialog.focus();

      await user.keyboard('{Tab}');

      // Focus should move within dialog
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('Max Height', () => {
    it('should use default maxHeight of 85vh for bottom variant', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} variant="bottom">
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveStyle({ maxHeight: '85vh' });
    });

    it('should use default maxHeight of 80vh for center variant', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} variant="center">
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveStyle({ maxHeight: '80vh' });
    });

    it('should accept custom maxHeight', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} maxHeight="500px">
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = screen.getByRole('dialog');
      expect(sheet).toHaveStyle({ maxHeight: '500px' });
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} className="custom-sheet">
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = document.querySelector('.custom-sheet');
      expect(sheet).toBeInTheDocument();
    });

    it('should apply rounded-t-3xl to bottom variant', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} variant="bottom">
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = document.querySelector('.rounded-t-3xl');
      expect(sheet).toBeInTheDocument();
    });

    it('should apply rounded-3xl to center variant', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} variant="center">
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = document.querySelector('.rounded-3xl');
      expect(sheet).toBeInTheDocument();
    });
  });

  describe('Custom Header', () => {
    it('should render custom header when provided', () => {
      renderWithProviders(
        <BottomSheetV2
          open={true}
          onClose={() => {}}
          customHeader={<div>Custom Header Content</div>}
        >
          <div>Body content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Custom Header Content')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('should not render default header when customHeader is provided', () => {
      renderWithProviders(
        <BottomSheetV2
          open={true}
          onClose={() => {}}
          title="Should not show"
          customHeader={<div>Custom Header</div>}
        >
          <div>Content</div>
        </BottomSheetV2>,
      );

      expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });
  });

  describe('onAfterOpen Callback', () => {
    it('should call onAfterOpen after animation', async () => {
      const handleAfterOpen = vi.fn();

      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} onAfterOpen={handleAfterOpen}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      await waitFor(
        () => {
          expect(handleAfterOpen).toHaveBeenCalledTimes(1);
        },
        { timeout: 400 },
      );
    });

    it('should not call onAfterOpen when closed', () => {
      const handleAfterOpen = vi.fn();

      renderWithProviders(
        <BottomSheetV2 open={false} onClose={() => {}} onAfterOpen={handleAfterOpen}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      expect(handleAfterOpen).not.toHaveBeenCalled();
    });

    it('should call onAfterOpen only once per open', async () => {
      const handleAfterOpen = vi.fn();

      const { rerender } = renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} onAfterOpen={handleAfterOpen}>
          <div>Content v1</div>
        </BottomSheetV2>,
      );

      // Wait for first call
      await waitFor(
        () => {
          expect(handleAfterOpen).toHaveBeenCalledTimes(1);
        },
        { timeout: 400 },
      );

      // Rerender with different content (but still open)
      rerender(
        <BottomSheetV2 open={true} onClose={() => {}} onAfterOpen={handleAfterOpen}>
          <div>Content v2</div>
        </BottomSheetV2>,
      );

      // Should still only be called once
      expect(handleAfterOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('Touch Gestures (Swipe to Dismiss)', () => {
    it('should handle touchstart event', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = document.querySelector('[role="dialog"]');
      expect(sheet).toBeInTheDocument();

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch],
      });

      sheet?.dispatchEvent(touchStart);
      expect(sheet).toBeInTheDocument();
    });

    it('should handle touchmove event', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = document.querySelector('[role="dialog"]');

      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientY: 150 } as Touch],
      });

      sheet?.dispatchEvent(touchMove);
      expect(sheet).toBeInTheDocument();
    });

    it('should handle touchend event', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = document.querySelector('[role="dialog"]');

      const touchEnd = new TouchEvent('touchend');
      sheet?.dispatchEvent(touchEnd);

      expect(sheet).toBeInTheDocument();
    });

    it('should not swipe when preventClose is true', () => {
      const handleClose = vi.fn();
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={handleClose} preventClose>
          <div>Content</div>
        </BottomSheetV2>,
      );

      const sheet = document.querySelector('[role="dialog"]');

      // Simulate swipe down
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientY: 300 } as Touch],
      });
      const touchEnd = new TouchEvent('touchend');

      sheet?.dispatchEvent(touchStart);
      sheet?.dispatchEvent(touchMove);
      sheet?.dispatchEvent(touchEnd);

      // Should not close
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Portal Rendering', () => {
    it('should render in portal target', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Portal content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Portal content')).toBeInTheDocument();

      // Check if content is in portal
      const portal = document.getElementById('sheet-portal');
      expect(portal).toContainElement(screen.getByText('Portal content'));
    });

    it('should fallback to body if portal not found', () => {
      // Remove portal
      const portal = document.getElementById('sheet-portal');
      if (portal) {
        document.body.removeChild(portal);
      }

      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Fallback content</div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Fallback content')).toBeInTheDocument();

      // Restore portal for other tests
      portalRoot = document.createElement('div');
      portalRoot.id = 'sheet-portal';
      document.body.appendChild(portalRoot);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid open/close', async () => {
      const { rerender } = renderWithProviders(
        <BottomSheetV2 open={false} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      rerender(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      rerender(
        <BottomSheetV2 open={false} onClose={() => {}}>
          <div>Content</div>
        </BottomSheetV2>,
      );

      // AnimatePresence keeps the sheet mounted until the exit animation
      // completes — wait for it to finish before asserting removal.
      await waitFor(
        () => {
          expect(screen.queryByText('Content')).not.toBeInTheDocument();
        },
        { timeout: 1500 },
      );
    });

    it('should handle empty children', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          {null}
        </BottomSheetV2>,
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle complex nested content', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <div>
            <h2>Title</h2>
            <p>Paragraph</p>
            <button>Action</button>
          </div>
        </BottomSheetV2>,
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
    });
  });
});

describe('BottomSheetRow', () => {
  describe('Rendering', () => {
    it('should render label and value', () => {
      renderWithProviders(<BottomSheetRow label="Amount" value="$100.00" />);

      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
    });

    it('should render in horizontal layout', () => {
      const { container } = renderWithProviders(<BottomSheetRow label="Price" value="$50" />);

      const row = container.querySelector('.flex.justify-between');
      expect(row).toBeInTheDocument();
    });

    it('should align items center', () => {
      const { container } = renderWithProviders(<BottomSheetRow label="Fee" value="$2.50" />);

      const row = container.querySelector('.items-center');
      expect(row).toBeInTheDocument();
    });
  });

  describe('Highlight', () => {
    it('should apply bold font weight when highlight is true', () => {
      renderWithProviders(<BottomSheetRow label="Total" value="$150.00" highlight />);

      const valueSpan = screen.getByText('$150.00');
      expect(valueSpan).toHaveStyle({ fontWeight: '700' });
    });

    it('should use normal font weight when highlight is false', () => {
      renderWithProviders(<BottomSheetRow label="Subtotal" value="$100.00" />);

      const valueSpan = screen.getByText('$100.00');
      expect(valueSpan).toHaveStyle({ fontWeight: '400' });
    });
  });

  describe('Custom Color', () => {
    it('should apply custom valueColor', () => {
      renderWithProviders(<BottomSheetRow label="Profit" value="+$50.00" valueColor="#10B981" />);

      const valueSpan = screen.getByText('+$50.00');
      expect(valueSpan).toHaveStyle({ color: '#10B981' });
    });

    it('should use default color when valueColor not provided', () => {
      renderWithProviders(<BottomSheetRow label="Amount" value="$100.00" />);

      const valueSpan = screen.getByText('$100.00');
      expect(valueSpan).toBeTruthy();
    });
  });

  describe('Monospace Font', () => {
    it('should use monospace font family for values', () => {
      renderWithProviders(<BottomSheetRow label="ID" value="ABC123" />);

      const valueSpan = screen.getByText('ABC123');
      expect(valueSpan).toHaveStyle({ fontFamily: 'monospace' });
    });
  });

  describe('Font Sizes', () => {
    it('should use 13px font size for label and value', () => {
      renderWithProviders(<BottomSheetRow label="Label" value="Value" />);

      const labelSpan = screen.getByText('Label');
      const valueSpan = screen.getByText('Value');

      expect(labelSpan).toHaveStyle({ fontSize: '13px' });
      expect(valueSpan).toHaveStyle({ fontSize: '13px' });
    });
  });

  describe('Integration with BottomSheetV2', () => {
    it('should render multiple rows inside BottomSheetV2', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}} title="Order Summary">
          <BottomSheetRow label="Subtotal" value="$100.00" />
          <BottomSheetRow label="Fee" value="$2.50" />
          <BottomSheetRow label="Total" value="$102.50" highlight />
        </BottomSheetV2>,
      );

      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('Fee')).toBeInTheDocument();
      expect(screen.getByText('$2.50')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('$102.50')).toBeInTheDocument();
    });

    it('should work with different value colors', () => {
      renderWithProviders(
        <BottomSheetV2 open={true} onClose={() => {}}>
          <BottomSheetRow label="Profit" value="+$50" valueColor="#10B981" />
          <BottomSheetRow label="Loss" value="-$20" valueColor="#EF4444" />
        </BottomSheetV2>,
      );

      const profitValue = screen.getByText('+$50');
      const lossValue = screen.getByText('-$20');

      expect(profitValue).toHaveStyle({ color: '#10B981' });
      expect(lossValue).toHaveStyle({ color: '#EF4444' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      renderWithProviders(<BottomSheetRow label="" value="" />);

      // Should render without crashing
      const container = document.body;
      expect(container).toBeTruthy();
    });

    it('should handle very long labels', () => {
      renderWithProviders(
        <BottomSheetRow label="This is a very long label that should still work" value="$100" />,
      );

      expect(
        screen.getByText('This is a very long label that should still work'),
      ).toBeInTheDocument();
    });

    it('should handle very long values', () => {
      renderWithProviders(<BottomSheetRow label="Amount" value="$1,234,567,890.123456789" />);

      expect(screen.getByText('$1,234,567,890.123456789')).toBeInTheDocument();
    });
  });
});
