/**
 * ══════════════════════════════════════════════════════════════════
 *  useTradeSettings — localStorage persistence for Trade Settings
 * ══════════════════════════════════════════════════════════════════
 *  Persists user preferences across sessions.
 *  Zero-dependency, SSR-safe.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'trade_settings_v1';

export interface TradeSettings {
  // Order defaults
  defaultOrderType: string;
  defaultSlippage: number;
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
  chartTimeframe: string;
  priceDecimals: string;
}

const DEFAULT_SETTINGS: TradeSettings = {
  defaultOrderType: 'limit',
  defaultSlippage: 0.5,
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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: TradeSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
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
          const parsed = JSON.parse(e.newValue);
          setSettingsState({ ...DEFAULT_SETTINGS, ...parsed });
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
    setSettingsState(prev => {
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