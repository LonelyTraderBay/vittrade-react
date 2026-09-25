/**
 * ══════════════════════════════════════════════════════════════════
 *  useTradeSettings — localStorage persistence for Trade Settings
 * ══════════════════════════════════════════════════════════════════
 *  Persists user preferences across sessions.
 *  Zero-dependency, SSR-safe.
 */

import { useState, useCallback, useEffect } from 'react';
import { browserStorage } from '@/shared/lib/browser-storage';

const STORAGE_KEY = 'trade_settings_v1';

export interface TradeSettings {
  // Order defaults
  defaultOrderType: 'market' | 'limit' | 'stop';
  showTpsl: boolean;
  bracketMode: boolean;

  // Confirmation
  confirmOrders: boolean;
  skipConfirmSmall: boolean;
  smallOrderThreshold: string;

  // Feedback
  soundOnFill: boolean;
  hapticOnFill: boolean;

  // Display
  showOrderBook: boolean;
  showRecentTrades: boolean;
  defaultPctButtons: boolean;
  chartTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
  priceDecimals: 'auto' | '2' | '4' | '6';
}

const DEFAULT_SETTINGS: TradeSettings = {
  defaultOrderType: 'limit',
  showTpsl: false,
  bracketMode: false,
  confirmOrders: true,
  skipConfirmSmall: false,
  smallOrderThreshold: '50',
  soundOnFill: true,
  hapticOnFill: true,
  showOrderBook: true,
  showRecentTrades: true,
  defaultPctButtons: true,
  chartTimeframe: '1h',
  priceDecimals: 'auto',
};

function loadSettings(): TradeSettings {
  try {
    return parseSettings(browserStorage.local.getItem(STORAGE_KEY));
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

function parseSettings(raw: string | null): TradeSettings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ...DEFAULT_SETTINGS };
  }

  const values = parsed as Record<string, unknown>;
  const settings = { ...DEFAULT_SETTINGS };
  if (['market', 'limit', 'stop'].includes(String(values.defaultOrderType))) {
    settings.defaultOrderType = values.defaultOrderType as TradeSettings['defaultOrderType'];
  }
  for (const key of [
    'showTpsl',
    'bracketMode',
    'confirmOrders',
    'skipConfirmSmall',
    'soundOnFill',
    'hapticOnFill',
    'showOrderBook',
    'showRecentTrades',
    'defaultPctButtons',
  ] as const) {
    if (typeof values[key] === 'boolean') settings[key] = values[key];
  }
  if (
    typeof values.smallOrderThreshold === 'string' &&
    /^\d+(?:\.\d+)?$/.test(values.smallOrderThreshold) &&
    Number.isFinite(Number(values.smallOrderThreshold)) &&
    Number(values.smallOrderThreshold) > 0 &&
    Number(values.smallOrderThreshold) <= 1_000_000_000
  ) {
    settings.smallOrderThreshold = values.smallOrderThreshold;
  }
  if (['1m', '5m', '15m', '1h', '4h', '1D'].includes(String(values.chartTimeframe))) {
    settings.chartTimeframe = values.chartTimeframe as TradeSettings['chartTimeframe'];
  }
  if (['auto', '2', '4', '6'].includes(String(values.priceDecimals))) {
    settings.priceDecimals = values.priceDecimals as TradeSettings['priceDecimals'];
  }
  return settings;
}

function saveSettings(settings: TradeSettings) {
  try {
    browserStorage.local.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors
  }
}

export function useTradeSettings() {
  const [settings, setSettingsState] = useState<TradeSettings>(loadSettings);

  // Sync across tabs via StorageEvent
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setSettingsState(parseSettings(e.newValue));
        } catch {
          // ignore parse errors from other tabs
        }
      } else if (e.key === STORAGE_KEY && !e.newValue) {
        // Key was removed in another tab — reset to defaults
        setSettingsState({ ...DEFAULT_SETTINGS });
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateSettings = useCallback((patch: Partial<TradeSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
    saveSettings({ ...DEFAULT_SETTINGS });
  }, []);

  return { settings, updateSettings, resetSettings };
}
