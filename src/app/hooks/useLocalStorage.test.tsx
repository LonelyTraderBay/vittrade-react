import { act, cleanup, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { useLocalStorage } from './useLocalStorage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useLocalStorage', () => {
  it('renders its fallback on the server without browser globals', () => {
    function Probe() {
      const [value] = useLocalStorage('layout', 'compact');
      return <output>{value}</output>;
    }
    vi.stubGlobal('window', undefined);
    try {
      expect(renderToString(<Probe />)).toBe('<output>compact</output>');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('uses the fallback when absent and serializes direct values', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(null);
    const persist = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    vi.spyOn(browserStorage.local, 'removeItem').mockReturnValue(true);
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    const update = result.current[1];
    expect(result.current[0]).toBe(0);
    act(() => update(5));
    expect(result.current[0]).toBe(5);
    act(() => {
      result.current[2]();
      update((value) => value + 1);
    });
    expect(result.current[0]).toBe(1);
    expect(persist).toHaveBeenLastCalledWith('counter', '1');
  });

  it('contains an updater failure without persisting a partial value', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('5');
    const persist = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    act(() =>
      result.current[1](() => {
        throw new Error('cannot update');
      }),
    );
    expect(result.current[0]).toBe(5);
    expect(persist).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('applies consecutive functional updates to the latest value before a render', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('0');
    const persist = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    const update = result.current[1];

    act(() => {
      update((current) => current + 1);
      update((current) => current + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(persist).toHaveBeenLastCalledWith('counter', '2');
  });

  it.each([
    { key: 'layout', newValue: null },
    { key: null, newValue: null },
  ])('resets after another tab removes the value or clears storage: $key', (event) => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('"comfortable"');
    vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const { result } = renderHook(() => useLocalStorage('layout', 'compact'));
    const update = result.current[1];

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', event));
      update((current) => `${current}-updated`);
    });

    expect(result.current[0]).toBe('compact-updated');
  });

  it('ignores events for unrelated keys and session storage', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('"comfortable"');
    const { result } = renderHook(() => useLocalStorage('layout', 'compact'));

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: '"changed"' }));
      const sessionEvent = new StorageEvent('storage', {
        key: 'layout',
        newValue: '"session-only"',
      });
      // The shared harness replaces Storage with a plain object; preserve its area identity.
      Object.defineProperty(sessionEvent, 'storageArea', { value: window.sessionStorage });
      window.dispatchEvent(sessionEvent);
    });

    expect(result.current[0]).toBe('comfortable');
  });

  it('loads a stored value, supports functional updates and resets to its initial value', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue(JSON.stringify('saved'));
    const setItem = vi.spyOn(browserStorage.local, 'setItem').mockReturnValue(true);
    const removeItem = vi.spyOn(browserStorage.local, 'removeItem').mockReturnValue(true);
    const { result } = renderHook(() => useLocalStorage('theme', 'light'));

    expect(result.current[0]).toBe('saved');
    expect(browserStorage.local.getItem).toHaveBeenCalledWith('theme');

    act(() => result.current[1]((current) => `${current}-updated`));
    expect(result.current[0]).toBe('saved-updated');
    expect(setItem).toHaveBeenCalledWith('theme', JSON.stringify('saved-updated'));

    act(() => result.current[2]());
    expect(result.current[0]).toBe('light');
    expect(removeItem).toHaveBeenCalledWith('theme');
  });

  it('uses the initial value for malformed data and responds to cross-tab storage events', () => {
    vi.spyOn(browserStorage.local, 'getItem').mockReturnValue('{malformed');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useLocalStorage('layout', 'compact'));

    expect(result.current[0]).toBe('compact');
    expect(warn).toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'layout', newValue: JSON.stringify('comfortable') }),
      );
    });
    expect(result.current[0]).toBe('comfortable');

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'layout', newValue: '{invalid' }));
    });
    expect(result.current[0]).toBe('compact');
  });
});
