import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WEB_AUTH_BRAND_MARK } from '@/shared/theme/webTokens';
import { AuthBrandMark } from './AuthBrandMark';

describe('AuthBrandMark', () => {
  it.each([
    ['sm', 44, 24, 12],
    ['md', 52, 28, 14],
    ['lg', 64, 36, 16],
  ] as const)('preserves the %s Auth mark variant', (size, containerSize, iconSize, radius) => {
    const { container } = render(<AuthBrandMark size={size} />);
    const mark = container.firstElementChild;
    const icon = container.querySelector('svg');

    expect(mark).toHaveAttribute('aria-hidden', 'true');
    expect(mark).toHaveStyle({
      width: `${containerSize}px`,
      height: `${containerSize}px`,
      borderRadius: `${radius}px`,
      background: WEB_AUTH_BRAND_MARK.gradient,
    });
    expect(icon).toHaveAttribute('width', String(iconSize));
    expect(icon).toHaveAttribute('height', String(iconSize));
    expect(icon?.querySelectorAll('path')).toHaveLength(2);
  });

  it('keeps the existing Auth identity in shared web theme tokens', () => {
    expect(WEB_AUTH_BRAND_MARK).toEqual({
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)',
      primaryStroke: '#fff',
      secondaryStroke: 'rgba(255,255,255,0.5)',
    });
  });
});
