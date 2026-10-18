import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { browserStorage } from './browser-storage';

const localStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'sessionStorage');

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
});

afterEach(() => {
  if (localStorageDescriptor) {
    Object.defineProperty(window, 'localStorage', localStorageDescriptor);
  }
  if (sessionStorageDescriptor) {
    Object.defineProperty(window, 'sessionStorage', sessionStorageDescriptor);
  }
});

describe('browserStorage', () => {
  it('reads, writes and removes non-sensitive local preferences', () => {
    expect(browserStorage.local.setItem('preference', 'compact')).toBe(true);
    expect(browserStorage.local.getItem('preference')).toBe('compact');
    expect(browserStorage.local.removeItem('preference')).toBe(true);
    expect(browserStorage.local.getItem('preference')).toBeNull();
  });

  it('keeps session-scoped values separate from local preferences', () => {
    browserStorage.session.setItem('tour_seen', '1');

    expect(browserStorage.session.getItem('tour_seen')).toBe('1');
    expect(browserStorage.local.getItem('tour_seen')).toBeNull();
    expect(browserStorage.local.isStorageArea(window.localStorage)).toBe(true);
    expect(browserStorage.local.isStorageArea(window.sessionStorage)).toBe(false);
  });

  it('returns safe fallbacks when browser storage access is denied', () => {
    const previousStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Storage access denied');
      },
    });

    expect(browserStorage.local.getItem('preference')).toBeNull();
    expect(browserStorage.local.setItem('preference', 'compact')).toBe(false);
    expect(browserStorage.local.removeItem('preference')).toBe(false);
    expect(browserStorage.local.isStorageArea(previousStorage)).toBe(false);
  });

  it('isolates failures from storage methods after browser storage has been resolved', () => {
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        ...createMemoryStorage(),
        getItem() {
          throw new DOMException('Read denied', 'SecurityError');
        },
        setItem() {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        },
        removeItem() {
          throw new DOMException('Removal denied', 'SecurityError');
        },
      },
    });

    expect(browserStorage.session.getItem('tour_seen')).toBeNull();
    expect(browserStorage.session.setItem('tour_seen', '1')).toBe(false);
    expect(browserStorage.session.removeItem('tour_seen')).toBe(false);
    expect(browserStorage.local.setItem('preference', 'compact')).toBe(true);
    expect(browserStorage.local.getItem('preference')).toBe('compact');
  });
});
