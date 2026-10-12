import { createElement } from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import {
  detectPlatformFromPath,
  detectPlatformFromViewport,
  getPlatformPrefix,
  PlatformProvider,
  usePlatform,
  usePlatformFromRoute,
  usePlatformPrefix,
  type Platform,
  type PlatformInfo,
} from './usePlatform';

const originalWidth = window.innerWidth;

afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth });
});

describe('platform detection', () => {
  it.each<[string, Platform]>([
    ['/w', 'web'],
    ['/w/markets', 'web'],
    ['/t', 'tablet'],
    ['/t/markets', 'tablet'],
    ['/wallet', 'phone'],
    ['/trade', 'phone'],
    ['/home', 'phone'],
  ])('classifies route %s as %s', (path, expected) => {
    expect(detectPlatformFromPath(path)).toBe(expected);
  });

  it.each<[number, Platform]>([
    [767, 'phone'],
    [768, 'tablet'],
    [1023, 'tablet'],
    [1024, 'web'],
  ])('classifies a %i-pixel viewport as %s', (width, expected) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    expect(detectPlatformFromViewport()).toBe(expected);
  });

  it('returns the shell route prefix', () => {
    expect(getPlatformPrefix('phone')).toBe('');
    expect(getPlatformPrefix('tablet')).toBe('/t');
    expect(getPlatformPrefix('web')).toBe('/w');
  });

  it('provides the phone shell by default and honors an explicit platform provider', () => {
    const { result: defaultResult } = renderHook(() => usePlatform());
    expect(defaultResult.current).toMatchObject({
      platform: 'phone',
      prefix: '',
      isPhone: true,
      isTablet: false,
      isWeb: false,
      hasBottomNav: true,
      modalStyle: 'sheet',
    });

    const webPlatform: PlatformInfo = {
      platform: 'web',
      prefix: '/w',
      isPhone: false,
      isTablet: false,
      isWeb: true,
      contentMaxWidth: 1600,
      contentPadding: 32,
      gridColumns: 3,
      hasBottomNav: false,
      hasSidebar: true,
      modalStyle: 'dialog',
      minTouchTarget: 32,
      sidebarWidth: 260,
      commandBarHeight: 64,
    };
    const { result } = renderHook(() => usePlatform(), {
      wrapper: ({ children }) => createElement(PlatformProvider, { value: webPlatform }, children),
    });
    expect(result.current).toEqual(webPlatform);
  });

  it.each<[string, Platform, string]>([
    ['/home', 'phone', ''],
    ['/t/markets', 'tablet', '/t'],
    ['/w', 'web', '/w'],
  ])('builds platform information for route %s', (path, platform, prefix) => {
    const { result } = renderHook(() => usePlatformFromRoute(), {
      wrapper: ({ children }) => createElement(MemoryRouter, { initialEntries: [path] }, children),
    });
    expect(result.current).toMatchObject({
      platform,
      prefix,
      isPhone: platform === 'phone',
      isTablet: platform === 'tablet',
      isWeb: platform === 'web',
    });
  });

  it.each<[string, string]>([
    ['/w', '/w'],
    ['/w/markets', '/w'],
    ['/t', '/t'],
    ['/t/markets', '/t'],
    ['/r', '/r'],
    ['/r/markets', '/r'],
    ['/markets', ''],
  ])('returns the route prefix %s', (path, prefix) => {
    const { result } = renderHook(() => usePlatformPrefix(), {
      wrapper: ({ children }) => createElement(MemoryRouter, { initialEntries: [path] }, children),
    });
    expect(result.current).toBe(prefix);
  });
});
