/* ═══════════════════════════════════════════════════════════
   Sheet Analytics — lightweight event tracker for BottomSheetV2
   ═══════════════════════════════════════════════════════════
   Tracks every sheet open with name + timestamp.
   In production, replace console.info with your analytics SDK
   (e.g. Amplitude, Mixpanel, PostHog).
   ═══════════════════════════════════════════════════════════ */

export interface SheetEvent {
  /** Unique sheet identifier, e.g. "p2p-order-pin-confirm" */
  sheetName: string;
  /** Unix timestamp (ms) */
  timestamp: number;
  /** ISO 8601 string */
  isoDate: string;
}

/** In-memory event log — useful for debugging & tests */
const _eventLog: SheetEvent[] = [];

/**
 * Record a sheet-open event.
 * Returns the created event object (handy for chaining / testing).
 */
export function trackSheetOpen(sheetName: string): SheetEvent {
  const now = Date.now();
  const event: SheetEvent = {
    sheetName,
    timestamp: now,
    isoDate: new Date(now).toISOString(),
  };
  _eventLog.push(event);

  // In a real app, fire to analytics SDK here:
  // analytics.track('sheet_opened', { sheet: sheetName });
  if (typeof process === 'undefined' || (process.env && process.env.NODE_ENV !== 'test')) {
    console.info(`[SheetAnalytics] Opened: "${sheetName}" at ${event.isoDate}`);
  }

  return event;
}

/** Read-only access to full event log */
export function getSheetEventLog(): readonly SheetEvent[] {
  return _eventLog;
}

/** Clear event log (for tests or session reset) */
export function clearSheetEventLog(): void {
  _eventLog.length = 0;
}
