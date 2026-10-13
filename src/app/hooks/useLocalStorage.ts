import { useState, useEffect, useCallback, useRef } from 'react';
import { browserStorage } from '@/shared/lib/browser-storage';

/**
 * useLocalStorage — Type-safe localStorage hook with SSR support
 * @param key - localStorage key
 * @param initialValue - fallback value if key doesn't exist
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = browserStorage.local.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  // Callbacks can run repeatedly before React commits the next render.
  const currentValue = useRef(storedValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for same API as useState
        const valueToStore = value instanceof Function ? value(currentValue.current) : value;
        currentValue.current = valueToStore;
        setStoredValue(valueToStore);
        browserStorage.local.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key],
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      currentValue.current = initialValue;
      setStoredValue(initialValue);
      browserStorage.local.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen to storage events from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.storageArea && !browserStorage.local.isStorageArea(e.storageArea)) return;
      if (e.key === key || e.key === null) {
        try {
          const nextValue = e.newValue === null ? initialValue : JSON.parse(e.newValue);
          currentValue.current = nextValue;
          setStoredValue(nextValue);
        } catch {
          currentValue.current = initialValue;
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
