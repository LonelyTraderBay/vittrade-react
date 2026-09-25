import { useCallback, useState } from 'react';
import type { DetachedWindow } from './DetachablePanel';

let nextZIndex = 100;

export function useDetachableWindows() {
  const [windows, setWindows] = useState<DetachedWindow[]>([]);

  const addWindow = useCallback((config: Omit<DetachedWindow, 'zIndex'>) => {
    setWindows((prev) => {
      if (prev.some((window) => window.id === config.id)) return prev;
      return [...prev, { ...config, zIndex: ++nextZIndex }];
    });
  }, []);

  const updateWindow = useCallback((id: string, updates: Partial<DetachedWindow>) => {
    setWindows((prev) =>
      prev.map((window) => (window.id === id ? { ...window, ...updates } : window)),
    );
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((window) => window.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((window) => (window.id === id ? { ...window, zIndex: ++nextZIndex } : window)),
    );
  }, []);

  return { windows, addWindow, updateWindow, closeWindow, focusWindow };
}
