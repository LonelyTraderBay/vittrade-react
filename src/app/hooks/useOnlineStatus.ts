/**
 * ══════════════════════════════════════════════════════════
 *  useOnlineStatus — Detect connection loss & recovery
 * ══════════════════════════════════════════════════════════
 *  Uses navigator.onLine + online/offline events.
 *  Returns isOnline + isReconnecting (brief flash after recovery).
 *  For prototype: simulated offline toggle via ?offline=1 param.
 */

import { useState, useEffect, useRef } from 'react';

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
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wasOfflineRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        setIsReconnecting(true);
        reconnectTimerRef.current = setTimeout(() => {
          setIsReconnecting(false);
        }, 3000);
      }
      wasOfflineRef.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  const simulateOffline = () => {
    setIsOnline(false);
    wasOfflineRef.current = true;
  };

  const simulateOnline = () => {
    setIsOnline(true);
    if (wasOfflineRef.current) {
      setIsReconnecting(true);
      reconnectTimerRef.current = setTimeout(() => setIsReconnecting(false), 3000);
    }
    wasOfflineRef.current = false;
  };

  return { isOnline, isReconnecting, simulateOffline, simulateOnline };
}
