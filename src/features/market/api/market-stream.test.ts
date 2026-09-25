import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectMarketStream } from './market-stream';

type SocketHandler = (event: Event) => void;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  readonly url: string;
  closed = false;
  private readonly handlers = new Map<string, Set<SocketHandler>>();

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type: string, handler: SocketHandler): void {
    const handlers = this.handlers.get(type) ?? new Set<SocketHandler>();
    handlers.add(handler);
    this.handlers.set(type, handlers);
  }

  emit(type: string, event: Event = new Event(type)): void {
    this.handlers.get(type)?.forEach((handler) => handler(event));
  }

  close(): void {
    this.closed = true;
  }
}

describe('market stream transport', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.useFakeTimers();
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('decodes valid frames, ignores malformed frames and reconnects with backoff', () => {
    const onMessage = vi.fn();
    const onStatus = vi.fn();
    const dispose = connectMarketStream('wss://stream.example.test/market', {
      onMessage,
      onStatus,
    });
    const socket = FakeWebSocket.instances[0];

    expect(socket.url).toBe('wss://stream.example.test/market');
    socket.emit('open');
    expect(onStatus).toHaveBeenLastCalledWith(true);

    const message = { type: 'funding_rate', data: { rate: 0.01 } };
    socket.emit('message', new MessageEvent('message', { data: JSON.stringify(message) }));
    socket.emit('message', new MessageEvent('message', { data: '{invalid-json' }));
    socket.emit('message', new MessageEvent('message', { data: JSON.stringify({ data: 1 }) }));

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(message);

    socket.emit('close');
    expect(onStatus).toHaveBeenLastCalledWith(false);
    vi.advanceTimersByTime(999);
    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(2);

    dispose();
    expect(FakeWebSocket.instances[1].closed).toBe(true);
  });

  it('cancels pending reconnects during cleanup', () => {
    const dispose = connectMarketStream('wss://stream.example.test/market', {
      onMessage: vi.fn(),
      onStatus: vi.fn(),
    });

    FakeWebSocket.instances[0].emit('close');
    dispose();
    vi.runAllTimers();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].closed).toBe(true);
  });
});
