import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBreakpoint } from './useBreakpoint';

const originalWidth = window.innerWidth;

function resizeTo(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  window.dispatchEvent(new Event('resize'));
}

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
});

describe('useBreakpoint', () => {
  it('updates shell breakpoints at the mobile, tablet and desktop boundaries', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    const { result } = renderHook(() => useBreakpoint());

    expect(result.current).toMatchObject({
      bp: 'mobile-s',
      width: 375,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    act(() => resizeTo(376));
    expect(result.current).toMatchObject({ bp: 'mobile-l', isMobile: true, width: 376 });

    act(() => resizeTo(767));
    expect(result.current).toMatchObject({ bp: 'mobile-l', isMobile: true, width: 767 });

    act(() => resizeTo(768));
    expect(result.current).toMatchObject({ bp: 'tablet', isTablet: true, width: 768 });

    act(() => resizeTo(1023));
    expect(result.current).toMatchObject({ bp: 'tablet', isTablet: true, width: 1023 });

    act(() => resizeTo(1024));
    expect(result.current).toMatchObject({ bp: 'desktop', isDesktop: true, width: 1024 });
  });
});
