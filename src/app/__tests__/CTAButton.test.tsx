/**
 * ══════════════════════════════════════════════════════════
 *  CTAButton Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for CTA button component
 *
 *  Run: npx vitest run src/app/__tests__/CTAButton.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CTAButton } from '../components/ui/CTAButton';

describe('CTAButton', () => {
  describe('Basic Rendering', () => {
    it('should render button with children', () => {
      render(<CTAButton>Click me</CTAButton>);

      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render as button element', () => {
      render(<CTAButton>Button</CTAButton>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be full width by default', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('w-full');
    });

    it('should not be full width when disabled', () => {
      const { container } = render(
        <CTAButton fullWidth={false}>Button</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Variants', () => {
    it('should render primary variant by default', () => {
      const { container } = render(<CTAButton>Primary</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toContain('linear-gradient');
      expect(button.style.background).toContain('rgb(229, 138, 0)');
    });

    it('should render success variant', () => {
      const { container } = render(
        <CTAButton variant="success">Success</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toContain('linear-gradient');
      expect(button.style.background).toContain('rgb(16, 185, 129)');
    });

    it('should render danger variant', () => {
      const { container } = render(
        <CTAButton variant="danger">Danger</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toContain('linear-gradient');
      expect(button.style.background).toContain('rgb(239, 68, 68)');
    });

    it('should render ghost variant', () => {
      const { container } = render(
        <CTAButton variant="ghost">Ghost</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toBe('transparent');
      expect(button.style.boxShadow).toBe('none');
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<CTAButton disabled>Disabled</CTAButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have aria-disabled when disabled', () => {
      render(<CTAButton disabled>Disabled</CTAButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should use disabled background color', () => {
      const { container } = render(<CTAButton disabled>Disabled</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toBe('var(--tr-surface-2)');
    });

    it('should use disabled text color', () => {
      const { container } = render(<CTAButton disabled>Disabled</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.color).toBe('var(--tr-text-3)');
    });

    it('should have no box shadow when disabled', () => {
      const { container } = render(<CTAButton disabled>Disabled</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.boxShadow).toBe('none');
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<CTAButton disabled onClick={onClick}>Disabled</CTAButton>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable button when loading', () => {
      render(<CTAButton loading>Loading</CTAButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have aria-busy when loading', () => {
      render(<CTAButton loading>Loading</CTAButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should show spinner when loading', () => {
      const { container } = render(<CTAButton loading>Processing</CTAButton>);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should show children text alongside spinner', () => {
      render(<CTAButton loading>Processing</CTAButton>);

      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<CTAButton loading onClick={onClick}>Loading</CTAButton>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should use disabled styles when loading', () => {
      const { container } = render(<CTAButton loading>Loading</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toBe('var(--tr-surface-2)');
      expect(button.style.color).toBe('var(--tr-text-3)');
    });
  });

  describe('Sizing', () => {
    it('should have height of 52px', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.height).toBe('52px');
    });

    it('should have border radius of 14px', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.borderRadius).toBe('14px');
    });

    it('should have font size of 16px', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.fontSize).toBe('16px');
    });

    it('should have rounded-2xl class', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('rounded-2xl');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom background', () => {
      const { container } = render(
        <CTAButton bg="linear-gradient(to right, red, blue)">Custom</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toBe('linear-gradient(to right, red, blue)');
    });

    it('should apply custom text color', () => {
      const { container } = render(
        <CTAButton textColor="#000000">Custom</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.color).toBe('rgb(0, 0, 0)');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <CTAButton className="custom-btn">Custom</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('custom-btn');
    });

    it('should preserve base classes with custom className', () => {
      const { container } = render(
        <CTAButton className="custom">Button</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
      expect(button).toHaveClass('custom');
    });

    it('should apply custom inline styles', () => {
      const { container } = render(
        <CTAButton style={{ margin: '10px', padding: '20px' }}>Button</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.margin).toBe('10px');
      expect(button.style.padding).toBe('20px');
    });
  });

  describe('Event Handlers', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<CTAButton onClick={onClick}>Click me</CTAButton>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should pass event to onClick handler', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<CTAButton onClick={onClick}>Click me</CTAButton>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle multiple clicks', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<CTAButton onClick={onClick}>Click me</CTAButton>);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Box Shadows', () => {
    it('should have primary shadow for primary variant', () => {
      const { container } = render(
        <CTAButton variant="primary">Primary</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.boxShadow).toContain('rgba(229,138,0,0.3)');
    });

    it('should have success shadow for success variant', () => {
      const { container } = render(
        <CTAButton variant="success">Success</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.boxShadow).toContain('rgba(16,185,129,0.3)');
    });

    it('should have danger shadow for danger variant', () => {
      const { container } = render(
        <CTAButton variant="danger">Danger</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.boxShadow).toContain('rgba(239,68,68,0.3)');
    });

    it('should have no shadow for ghost variant', () => {
      const { container } = render(
        <CTAButton variant="ghost">Ghost</CTAButton>
      );

      const button = container.firstChild as HTMLElement;
      expect(button.style.boxShadow).toBe('none');
    });
  });

  describe('Layout Classes', () => {
    it('should have flex layout', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('flex');
    });

    it('should center items vertically', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('items-center');
    });

    it('should center items horizontally', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('justify-center');
    });

    it('should have gap-2 between items', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('gap-2');
    });

    it('should have font-semibold class', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('font-semibold');
    });

    it('should have text-white class', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('text-white');
    });

    it('should have ripple class', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button).toHaveClass('ripple');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should render primary CTA for buy action', () => {
      const { container } = render(
        <CTAButton variant="primary">Mua BTC</CTAButton>
      );

      expect(screen.getByText('Mua BTC')).toBeInTheDocument();
      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toContain('rgb(229, 138, 0)');
    });

    it('should render success CTA for confirm action', () => {
      const { container } = render(
        <CTAButton variant="success">Xác nhận</CTAButton>
      );

      expect(screen.getByText('Xác nhận')).toBeInTheDocument();
      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toContain('rgb(16, 185, 129)');
    });

    it('should render danger CTA for sell action', () => {
      const { container } = render(
        <CTAButton variant="danger">Bán BTC</CTAButton>
      );

      expect(screen.getByText('Bán BTC')).toBeInTheDocument();
      const button = container.firstChild as HTMLElement;
      expect(button.style.background).toContain('rgb(239, 68, 68)');
    });

    it('should show loading state during submission', () => {
      render(<CTAButton loading>Đang xử lý...</CTAButton>);

      expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should handle form submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <form onSubmit={onSubmit}>
          <CTAButton type="submit">Gửi đơn</CTAButton>
        </form>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(onSubmit).toHaveBeenCalled();
    });
  });

  describe('Spinner Design', () => {
    it('should show spinner with correct size', () => {
      const { container } = render(<CTAButton loading>Loading</CTAButton>);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('w-5');
      expect(spinner).toHaveClass('h-5');
    });

    it('should have white spinner border', () => {
      const { container } = render(<CTAButton loading>Loading</CTAButton>);

      const spinner = container.querySelector('.animate-spin') as HTMLElement;
      expect(spinner).toHaveClass('border-t-white');
    });

    it('should have rounded spinner', () => {
      const { container } = render(<CTAButton loading>Loading</CTAButton>);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toHaveClass('rounded-full');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(<CTAButton>{''}</CTAButton>);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle very long text', () => {
      const longText = 'This is a very long button text that should still work properly';
      render(<CTAButton>{longText}</CTAButton>);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle Vietnamese text', () => {
      render(<CTAButton>Xác nhận giao dịch</CTAButton>);

      expect(screen.getByText('Xác nhận giao dịch')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<CTAButton>Buy & Sell</CTAButton>);

      expect(screen.getByText('Buy & Sell')).toBeInTheDocument();
    });

    it('should handle both disabled and loading', () => {
      render(<CTAButton disabled loading>Button</CTAButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<CTAButton onClick={onClick}>Button</CTAButton>);

      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onClick).toHaveBeenCalled();
    });

    it('should support type attribute', () => {
      render(<CTAButton type="submit">Submit</CTAButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support aria-label', () => {
      render(<CTAButton aria-label="Buy Bitcoin">Buy</CTAButton>);

      const button = screen.getByRole('button', { name: 'Buy Bitcoin' });
      expect(button).toBeInTheDocument();
    });

    it('should indicate loading state to screen readers', () => {
      render(<CTAButton loading>Processing</CTAButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should indicate disabled state to screen readers', () => {
      render(<CTAButton disabled>Disabled</CTAButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Transitions', () => {
    it('should have transition for all properties', () => {
      const { container } = render(<CTAButton>Button</CTAButton>);

      const button = container.firstChild as HTMLElement;
      expect(button.style.transition).toContain('all');
      expect(button.style.transition).toContain('var(--tr-duration-normal)');
      expect(button.style.transition).toContain('ease');
    });
  });
});
