export interface MarketStreamMessage {
  type: string;
  data: unknown;
}

interface MarketStreamHandlers {
  onMessage: (message: MarketStreamMessage) => void;
  onStatus: (connected: boolean) => void;
}

/**
 * Production market stream transport. The server owns event semantics; this
 * adapter only handles lifecycle, JSON decoding and bounded reconnect backoff.
 */
export function connectMarketStream(url: string, handlers: MarketStreamHandlers): () => void {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | undefined;
  let reconnectAttempt = 0;
  let active = true;

  const connect = () => {
    if (!active) return;
    const currentSocket = new WebSocket(url);
    socket = currentSocket;

    currentSocket.addEventListener('open', () => {
      if (!active || socket !== currentSocket) return;
      reconnectAttempt = 0;
      handlers.onStatus(true);
    });

    currentSocket.addEventListener('message', (event) => {
      if (!active || socket !== currentSocket) return;
      try {
        const payload: unknown = JSON.parse(String(event.data));
        if (!isRecord(payload) || typeof payload.type !== 'string') return;
        handlers.onMessage({ type: payload.type, data: payload.data });
      } catch {
        // Invalid stream frames are ignored; the transport remains available.
      }
    });

    currentSocket.addEventListener('error', () => {
      if (!active || socket !== currentSocket) return;
      handlers.onStatus(false);
    });
    currentSocket.addEventListener('close', () => {
      if (!active || socket !== currentSocket) return;
      handlers.onStatus(false);
      const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempt);
      reconnectAttempt += 1;
      reconnectTimer = window.setTimeout(connect, delay);
    });
  };

  connect();

  return () => {
    if (!active) return;
    active = false;
    if (reconnectTimer !== undefined) window.clearTimeout(reconnectTimer);
    socket?.close();
    socket = null;
    handlers.onStatus(false);
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}
