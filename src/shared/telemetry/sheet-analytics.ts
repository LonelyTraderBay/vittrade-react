import { captureEvent } from './telemetry';

export interface SheetEvent {
  /** Unique sheet identifier, e.g. "p2p-order-pin-confirm" */
  sheetName: string;
  /** Unix timestamp (ms) */
  timestamp: number;
  /** ISO 8601 string */
  isoDate: string;
}

/** Bounded in-memory history for local diagnostics and tests. */
const _eventLog: SheetEvent[] = [];
const MAX_RETAINED_SHEET_EVENTS = 100;

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
  if (_eventLog.length === MAX_RETAINED_SHEET_EVENTS) _eventLog.shift();
  _eventLog.push(event);
  captureEvent('sheet_opened', {
    sheetName: event.sheetName,
    timestamp: event.timestamp,
    isoDate: event.isoDate,
  });

  return event;
}

/** Read-only access to full event log */
export function getSheetEventLog(): readonly SheetEvent[] {
  return _eventLog.slice();
}

/** Clear event log (for tests or session reset) */
export function clearSheetEventLog(): void {
  _eventLog.length = 0;
}
