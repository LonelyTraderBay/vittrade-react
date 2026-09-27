import { afterEach, describe, expect, it } from 'vitest';
import {
  detectPlatformFromPath,
  detectPlatformFromViewport,
  getPlatformPrefix,
  type Platform,
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
});
