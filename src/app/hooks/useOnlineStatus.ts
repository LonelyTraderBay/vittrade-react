/**
 * ══════════════════════════════════════════════════════════
 *  useOnlineStatus — Detect connection loss & recovery
 * ══════════════════════════════════════════════════════════
 *  Uses navigator.onLine + online/offline events.
 *  Returns isOnline + isReconnecting (brief flash after recovery).
 *  For prototype: simulated offline toggle via ?offline=1 param.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface OnlineStatus {
  /** Currently online */
  isOnline: boolean;
  /** Was offline, now reconnecting (true for ~3s after recovery) */
  isReconnecting: boolean;
  /** Manually toggle offline for demo */
  simulateOffline: () => void;
  /** Manually toggle back online for demo */
  simulateOnline: () => void;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wasOfflineRef = useRef(!isOnline);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOfflineRef.current) {
      setIsReconnecting(true);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = undefined;
        setIsReconnecting(false);
      }, 3000);
    }
    wasOfflineRef.current = false;
  }, []);

  const handleOffline = useCallback(() => {
    if (reconnectTimerRef.current !== undefined) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = undefined;
    }
    setIsOnline(false);
    setIsReconnecting(false);
    wasOfflineRef.current = true;
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimerRef.current !== undefined) clearTimeout(reconnectTimerRef.current);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, isReconnecting, simulateOffline: handleOffline, simulateOnline: handleOnline };
}
