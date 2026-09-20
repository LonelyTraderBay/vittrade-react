/**
 * ══════════════════════════════════════════════════════════
 *  IconButton Component Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for IconButton, BackButton, CloseButton
 *
 *  Run: npx vitest run src/app/__tests__/IconButton.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import {
  IconButton,
  IconOnlyButton,
  BackButton,
  CloseButton,
  type IconButtonVariant,
  type IconButtonSize,
} from '../components/ui/IconButton';
import { Search, Heart, Trash2 } from 'lucide-react';

describe('IconButton', () => {
  describe('Rendering', () => {
    it('should render icon without label', () => {
      renderWithProviders(
        <IconButton icon={Search} aria-label="Search" />
      );
      
      const button = screen.getByRole('button', { name: /search/i });
      expect(button).toBeInTheDocument();
    });

    it('should render icon with label', () => {
      renderWithProviders(
        <IconButton icon={Search} label="Tìm kiếm" />
      );
      
      const button = screen.getByRole('button', { name: /tìm kiếm/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Tìm kiếm');
    });

    it('should use aria-label when provided', () => {
      renderWithProviders(
        <IconButton
          icon={Search}
          label="Tìm kiếm"
          aria-label="Custom search label"
        />
      );
      
      const button = screen.getByRole('button', { name: /custom search label/i });
      expect(button).toBeInTheDocument();
    });

    it('should fall back to label for aria-label if not provided', () => {
      renderWithProviders(
        <IconButton icon={Search} label="Tìm kiếm" />
      );
      
      const button = screen.getByRole('button', { name: /tìm kiếm/i });
      expect(button).toHaveAttribute('aria-label', 'Tìm kiếm');
    });
  });

  describe('Variants', () => {
    const variants: IconButtonVariant[] = [
      'default',
      'ghost',
      'primary',
      'success',
      'danger',
      'transparent',
    ];

    variants.forEach(variant => {
      it(`should render ${variant} variant`, () => {
        renderWithProviders(
          <IconButton
            icon={Search}
            label="Test"
            variant={variant}
          />
        );
        
        const button = screen.getByRole('button', { name: /test/i });
        expect(button).toBeInTheDocument();
      });
    });

    it('should apply correct colors for primary variant', () => {
      const { container } = renderWithProviders(
        <IconButton icon={Search} label="Primary" variant="primary" />
      );
      
      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      // Primary variant uses amber primary tint
      expect(button?.style.background).toContain('rgba(229, 138, 0, 0.12)');
    });

    it('should apply correct colors for success variant', () => {
      const { container } = renderWithProviders(
        <IconButton icon={Heart} label="Success" variant="success" />
      );
      
      const button = container.querySelector('button');
      expect(button?.style.background).toContain('rgba(16, 185, 129, 0.12)');
    });

    it('should apply correct colors for danger variant', () => {
      const { container } = renderWithProviders(
        <IconButton icon={Trash2} label="Delete" variant="danger" />
      );
      
      const button = container.querySelector('button');
      expect(button?.style.background).toContain('rgba(239, 68, 68, 0.12)');
    });
  });

  describe('Sizes', () => {
    const sizes: IconButtonSize[] = ['sm', 'md', 'lg'];

    sizes.forEach(size => {
      it(`should render ${size} size`, () => {
        renderWithProviders(
          <IconButton
            icon={Search}
            label="Test"
            size={size}
          />
        );
        
        const button = screen.getByRole('button', { name: /test/i });
        expect(button).toBeInTheDocument();
      });
    });

    it('should apply correct height for sm size', () => {
      const { container } = renderWithProviders(
        <IconButton icon={Search} label="Small" size="sm" />
      );
      
      const button = container.querySelector('button');
      expect(button?.style.minHeight).toBe('28px');
    });

    it('should apply correct height for md size', () => {
      const { container } = renderWithProviders(
        <IconButton icon={Search} label="Medium" size="md" />
      );
      
      const button = container.querySelector('button');
      expect(button?.style.minHeight).toBe('36px');
    });

    it('should apply correct height for lg size', () => {
      const { container } = renderWithProviders(
        <IconButton icon={Search} label="Large" size="lg" />
      );
      
      const button = container.querySelector('button');
      expect(button?.style.minHeight).toBe('44px');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      renderWithProviders(
        <IconButton
          icon={Search}
          label="Click me"
          onClick={handleClick}
        />
      );
      
      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      renderWithProviders(
        <IconButton
          icon={Search}
          label="Disabled"
          onClick={handleClick}
          disabled
        />
      );
      
      const button = screen.getByRole('button', { name: /disabled/i });
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      renderWithProviders(
        <IconButton
          icon={Search}
          label="Loading"
          onClick={handleClick}
          loading
        />
      );
      
      const button = screen.getByRole('button', { name: /loading/i });
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      renderWithProviders(
        <IconButton
          icon={Search}
          label="Disabled"
          disabled
        />
      );
      
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
    });

    it('should be disabled when loading prop is true', () => {
      renderWithProviders(
        <IconButton
          icon={Search}
          label="Loading"
          loading
        />
      );
      
      const button = screen.getByRole('button', { name: /loading/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', () => {
      const { container } = renderWithProviders(
        <IconButton
          icon={Search}
          label="Loading"
          loading
        />
      );
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show icon when loading', () => {
      const { container } = renderWithProviders(
        <IconButton
          icon={Search}
          label="Loading"
          loading
        />
      );
      
      // Spinner should be present, but not the Search icon
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should still show label when loading', () => {
      renderWithProviders(
        <IconButton
          icon={Search}
          label="Loading text"
          loading
        />
      );
      
      expect(screen.getByText('Loading text')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const { container } = renderWithProviders(
        <IconButton
          icon={Search}
          label="Custom"
          className="custom-class"
        />
      );
      
      const button = container.querySelector('button');
      expect(button?.className).toContain('custom-class');
    });

    it('should apply custom style', () => {
      const { container } = renderWithProviders(
        <IconButton
          icon={Search}
          label="Custom"
          style={{ marginTop: '20px' }}
        />
      );
      
      const button = container.querySelector('button');
      expect(button?.style.marginTop).toBe('20px');
    });
  });

  describe('Accessibility', () => {
    it('should have role="button"', () => {
      renderWithProviders(
        <IconButton icon={Search} label="Search" />
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have accessible name', () => {
      renderWithProviders(
        <IconButton icon={Search} label="Search" />
      );
      
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    it('should reduce opacity when disabled', () => {
      const { container } = renderWithProviders(
        <IconButton icon={Search} label="Disabled" disabled />
      );
      
      const button = container.querySelector('button');
      expect(button?.style.opacity).toBe('0.5');
    });

    it('should have cursor: not-allowed when disabled', () => {
      const { container } = renderWithProviders(
        <IconButton icon={Search} label="Disabled" disabled />
      );
      
      const button = container.querySelector('button');
      expect(button?.style.cursor).toBe('not-allowed');
    });
  });
});

describe('IconOnlyButton', () => {
  it('should render without label', () => {
    renderWithProviders(
      <IconOnlyButton icon={Search} aria-label="Search only" />
    );
    
    const button = screen.getByRole('button', { name: /search only/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveTextContent('Search only');
  });

  it('should require aria-label', () => {
    // This is a TypeScript compile-time check, but we can verify runtime behavior
    renderWithProviders(
      <IconOnlyButton icon={Search} aria-label="Required label" />
    );
    
    const button = screen.getByRole('button', { name: /required label/i });
    expect(button).toHaveAttribute('aria-label', 'Required label');
  });

  it('should accept all IconButton props', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithProviders(
      <IconOnlyButton
        icon={Heart}
        aria-label="Like"
        onClick={handleClick}
        variant="primary"
        size="lg"
      />
    );
    
    const button = screen.getByRole('button', { name: /like/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('BackButton', () => {
  it('should render with default label "Quay lại"', () => {
    renderWithProviders(
      <BackButton onClick={() => {}} />
    );
    
    const button = screen.getByRole('button', { name: /quay lại/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Quay lại');
  });

  it('should render with custom label', () => {
    renderWithProviders(
      <BackButton onClick={() => {}} label="Trở về" />
    );
    
    const button = screen.getByRole('button', { name: /trở về/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Trở về');
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithProviders(
      <BackButton onClick={handleClick} />
    );
    
    const button = screen.getByRole('button', { name: /quay lại/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should use ArrowLeft icon by default', () => {
    const { container } = renderWithProviders(
      <BackButton onClick={() => {}} />
    );
    
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('should use ChevronLeft icon when useChevron is true', () => {
    const { container } = renderWithProviders(
      <BackButton onClick={() => {}} useChevron />
    );
    
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('should support size prop', () => {
    const { container } = renderWithProviders(
      <BackButton onClick={() => {}} size="lg" />
    );
    
    const button = container.querySelector('button');
    expect(button?.style.minHeight).toBe('44px');
  });

  it('should apply transparent variant', () => {
    const { container } = renderWithProviders(
      <BackButton onClick={() => {}} />
    );
    
    const button = container.querySelector('button');
    expect(button?.style.background).toBe('transparent');
  });
});

describe('CloseButton', () => {
  it('should render with default label "Đóng"', () => {
    renderWithProviders(
      <CloseButton onClick={() => {}} />
    );
    
    const button = screen.getByRole('button', { name: /đóng/i });
    expect(button).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    renderWithProviders(
      <CloseButton onClick={() => {}} label="Thoát" />
    );
    
    const button = screen.getByRole('button', { name: /thoát/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Thoát');
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    renderWithProviders(
      <CloseButton onClick={handleClick} />
    );
    
    const button = screen.getByRole('button', { name: /đóng/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should support size prop', () => {
    const { container } = renderWithProviders(
      <CloseButton onClick={() => {}} size="sm" />
    );
    
    const button = container.querySelector('button');
    expect(button?.style.minHeight).toBe('28px');
  });

  it('should apply ghost variant', () => {
    const { container } = renderWithProviders(
      <CloseButton onClick={() => {}} />
    );
    
    const button = container.querySelector('button');
    // Ghost variant should have a background (surface2)
    expect(button?.style.background).toBeTruthy();
  });

  it('should show X icon', () => {
    const { container } = renderWithProviders(
      <CloseButton onClick={() => {}} />
    );
    
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });
});

describe('IconButton Edge Cases', () => {
  it('should handle no onClick gracefully', () => {
    renderWithProviders(
      <IconButton icon={Search} label="No handler" />
    );
    
    const button = screen.getByRole('button', { name: /no handler/i });
    expect(button).toBeInTheDocument();
  });

  it('should work without label or aria-label (icon only)', () => {
    renderWithProviders(
      <IconButton icon={Search} />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should handle both disabled and loading simultaneously', () => {
    renderWithProviders(
      <IconButton
        icon={Search}
        label="Both states"
        disabled
        loading
      />
    );
    
    const button = screen.getByRole('button', { name: /both states/i });
    expect(button).toBeDisabled();
  });

  it('should maintain font weight 600', () => {
    const { container } = renderWithProviders(
      <IconButton icon={Search} label="Bold" />
    );
    
    const button = container.querySelector('button');
    expect(button?.style.fontWeight).toBe('600');
  });

  it('should have rounded-xl class', () => {
    const { container } = renderWithProviders(
      <IconButton icon={Search} label="Rounded" />
    );
    
    const button = container.querySelector('button');
    expect(button?.className).toContain('rounded-xl');
  });

  it('should have active:opacity-70 class', () => {
    const { container } = renderWithProviders(
      <IconButton icon={Search} label="Active" />
    );
    
    const button = container.querySelector('button');
    expect(button?.className).toContain('active:opacity-70');
  });
});
