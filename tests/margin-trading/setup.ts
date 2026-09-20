/**
 * ══════════════════════════════════════════════════════════════════
 *  TEST SETUP & GLOBAL MOCKS
 * ══════════════════════════════════════════════════════════════════
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (for responsive tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${min} - ${max}`
          : `expected ${received} to be within range ${min} - ${max}`,
    };
  },
  toBeValidPrice(received: number) {
    const pass = received > 0 && Number.isFinite(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid price`
          : `expected ${received} to be a valid price (positive finite number)`,
    };
  },
  toBeValidPercentage(received: number) {
    const pass = received >= 0 && received <= 100;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid percentage`
          : `expected ${received} to be between 0-100`,
    };
  },
});

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion {
    toBeWithinRange(min: number, max: number): void;
    toBeValidPrice(): void;
    toBeValidPercentage(): void;
  }
}

// Console error suppression for expected errors
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});
