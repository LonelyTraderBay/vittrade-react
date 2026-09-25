type StorageArea = 'local' | 'session';

function resolveStorage(area: StorageArea): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return area === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function getItem(area: StorageArea, key: string): string | null {
  try {
    return resolveStorage(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function setItem(area: StorageArea, key: string, value: string): boolean {
  try {
    const storage = resolveStorage(area);
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeItem(area: StorageArea, key: string): boolean {
  try {
    const storage = resolveStorage(area);
    if (!storage) return false;
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Safe, non-credential browser persistence for UI preferences and drafts. */
export const browserStorage = {
  local: {
    getItem: (key: string) => getItem('local', key),
    setItem: (key: string, value: string) => setItem('local', key, value),
    removeItem: (key: string) => removeItem('local', key),
  },
  session: {
    getItem: (key: string) => getItem('session', key),
    setItem: (key: string, value: string) => setItem('session', key, value),
    removeItem: (key: string) => removeItem('session', key),
  },
} as const;
