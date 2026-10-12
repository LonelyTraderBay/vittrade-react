import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { useTradeSettings } from './useTradeSettings';

const settingsKey = 'trade_settings_v1';
const originalWindowLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');

beforeEach(() => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  } as unknown as Storage;
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalWindowLocalStorage) {
    Object.defineProperty(window, 'localStorage', originalWindowLocalStorage);
  }
});

describe('useTradeSettings', () => {
  it('starts with defaults, merges updates, persists them, and resets', () => {
    const { result } = renderHook(() => useTradeSettings());
    expect(result.current.settings).toMatchObject({
      defaultOrderType: 'limit',
      showTpsl: false,
      confirmOrders: true,
      smallOrderThreshold: '50',
      chartTimeframe: '1h',
      priceDecimals: 'auto',
    });

    act(() => result.current.updateSettings({ showTpsl: true, smallOrderThreshold: '125.5' }));
    expect(result.current.settings).toMatchObject({ showTpsl: true, smallOrderThreshold: '125.5' });
    expect(JSON.parse(window.localStorage.getItem(settingsKey) ?? '{}')).toMatchObject({
      showTpsl: true,
      smallOrderThreshold: '125.5',
    });

    act(() => result.current.resetSettings());
    expect(result.current.settings).toMatchObject({
      showTpsl: false,
      smallOrderThreshold: '50',
      defaultOrderType: 'limit',
    });
  });

  it('loads every supported stored preference and ignores invalid fields', () => {
    window.localStorage.setItem(
      settingsKey,
      JSON.stringify({
        defaultOrderType: 'stop',
        showTpsl: true,
        bracketMode: false,
        confirmOrders: false,
        skipConfirmSmall: true,
        smallOrderThreshold: '250.75',
        soundOnFill: false,
        hapticOnFill: true,
        showOrderBook: false,
        showRecentTrades: true,
        defaultPctButtons: false,
        chartTimeframe: '15m',
        priceDecimals: '4',
        ignored: 'field',
      }),
    );
    const { result } = renderHook(() => useTradeSettings());
    expect(result.current.settings).toMatchObject({
      defaultOrderType: 'stop',
      showTpsl: true,
      bracketMode: false,
      confirmOrders: false,
      skipConfirmSmall: true,
      smallOrderThreshold: '250.75',
      soundOnFill: false,
      hapticOnFill: true,
      showOrderBook: false,
      showRecentTrades: true,
      defaultPctButtons: false,
      chartTimeframe: '15m',
      priceDecimals: '4',
    });
  });

  it.each([
    ['not-a-number', '50'],
    ['0', '50'],
    ['1000000001', '50'],
    ['9'.repeat(400), '50'],
  ])('rejects unsafe small-order threshold %s', (threshold, expected) => {
    window.localStorage.setItem(settingsKey, JSON.stringify({ smallOrderThreshold: threshold }));
    const { result } = renderHook(() => useTradeSettings());
    expect(result.current.settings.smallOrderThreshold).toBe(expected);
  });

  it.each(['null', '[]', '42', '"settings"', '{invalid'])(
    'falls back for stored JSON %s',
    (raw) => {
      window.localStorage.setItem(settingsKey, raw);
      const { result } = renderHook(() => useTradeSettings());
      expect(result.current.settings).toMatchObject({ defaultOrderType: 'limit', showTpsl: false });
    },
  );

  it('ignores storage adapter read and write failures while retaining in-memory updates', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    const { result } = renderHook(() => useTradeSettings());
    expect(result.current.settings.defaultOrderType).toBe('limit');

    vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw new Error('storage quota exceeded');
    });
    act(() => result.current.updateSettings({ showTpsl: true }));
    expect(result.current.settings.showTpsl).toBe(true);
  });

  it('syncs valid settings across tabs, ignores unrelated or malformed events, and resets on removal', () => {
    const { result } = renderHook(() => useTradeSettings());

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'another_preference',
          newValue: JSON.stringify({ showTpsl: true }),
        }),
      );
    });
    expect(result.current.settings.showTpsl).toBe(false);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: settingsKey,
          newValue: JSON.stringify({ showTpsl: true, defaultOrderType: 'market' }),
        }),
      );
    });
    expect(result.current.settings).toMatchObject({ showTpsl: true, defaultOrderType: 'market' });

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: settingsKey, newValue: '{invalid' }));
    });
    expect(result.current.settings.showTpsl).toBe(true);

    act(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: settingsKey, newValue: null })),
    );
    expect(result.current.settings).toMatchObject({ showTpsl: false, defaultOrderType: 'limit' });
  });
});
