import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserStorage } from '@/shared/lib/browser-storage';
import { useLocalStorage } from './useLocalStorage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useLocalStorage', () => {
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
