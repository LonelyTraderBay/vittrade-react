import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { useTradeSettings } from './useTradeSettings';

const STORAGE_KEY = 'trade_settings_v1';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useTradeSettings', () => {
  it('starts with defaults, applies partial updates and persists the merged settings', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const setItem = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const { result } = renderHook(() => useTradeSettings());

    expect(result.current.settings).toMatchObject({
      defaultOrderType: 'limit',
      confirmOrders: true,
      chartTimeframe: '1h',
    });

    act(() => result.current.updateSettings({ defaultOrderType: 'market', showTpsl: true }));

    expect(result.current.settings).toMatchObject({ defaultOrderType: 'market', showTpsl: true });
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    expect(JSON.parse(setItem.mock.calls[0][1])).toMatchObject({
      defaultOrderType: 'market',
      showTpsl: true,
      confirmOrders: true,
    });
  });

  it('merges saved values with defaults and drops the removed defaultSlippage field', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(
      JSON.stringify({ defaultOrderType: 'market', defaultSlippage: '0.5' }),
    );
    const { result } = renderHook(() => useTradeSettings());

    expect(result.current.settings).toMatchObject({
      defaultOrderType: 'market',
      confirmOrders: true,
      chartTimeframe: '1h',
    });
    expect(result.current.settings).not.toHaveProperty('defaultSlippage');
  });

  it.each(['{malformed', 'null', '[]'])('uses defaults for invalid saved payload %s', (payload) => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(payload);
    const { result } = renderHook(() => useTradeSettings());

    expect(result.current.settings.defaultOrderType).toBe('limit');
    expect(result.current.settings.confirmOrders).toBe(true);
  });

  it('normalizes invalid persisted values instead of passing them to the trading UI', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(
      JSON.stringify({
        defaultOrderType: 'admin',
        skipConfirmSmall: 'true',
        smallOrderThreshold: 'Infinity',
        chartTimeframe: '10m',
        priceDecimals: '18',
      }),
    );
    const { result } = renderHook(() => useTradeSettings());

    expect(result.current.settings).toMatchObject({
      defaultOrderType: 'limit',
      skipConfirmSmall: false,
      smallOrderThreshold: '50',
      chartTimeframe: '1h',
      priceDecimals: 'auto',
    });
  });

  it('syncs valid cross-tab updates, ignores malformed payloads and resets after removal', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const { result } = renderHook(() => useTradeSettings());

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify({ defaultOrderType: 'market', showOrderBook: false }),
        }),
      );
    });
    expect(result.current.settings).toMatchObject({
      defaultOrderType: 'market',
      showOrderBook: false,
      confirmOrders: true,
    });

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: '{bad' }));
    });
    expect(result.current.settings.defaultOrderType).toBe('market');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify({ defaultOrderType: 'invalid', skipConfirmSmall: 'yes' }),
        }),
      );
    });
    expect(result.current.settings).toMatchObject({
      defaultOrderType: 'limit',
      skipConfirmSmall: false,
    });

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', newValue: null }));
    });
    expect(result.current.settings.defaultOrderType).toBe('limit');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: null }));
    });
    expect(result.current.settings.defaultOrderType).toBe('limit');
    expect(result.current.settings.showOrderBook).toBe(true);
  });

  it('resets and persists defaults without failing when storage writes throw', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const setItem = vi.spyOn(browserStorage.local, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });
    const { result } = renderHook(() => useTradeSettings());

    act(() => result.current.updateSettings({ defaultOrderType: 'market' }));
    act(() => result.current.resetSettings());

    expect(result.current.settings.defaultOrderType).toBe('limit');
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(JSON.parse(setItem.mock.calls[1][1])).toMatchObject({
      defaultOrderType: 'limit',
      confirmOrders: true,
    });
  });
});
