import { WebSocketClient } from '@/engine/net/transport/WebSocketClient';

type Listener = (ev: any) => void;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public binaryType: string = 'blob';
  private listeners: Record<string, Listener[]> = {};

  constructor(public url: string) {}

  addEventListener(type: string, cb: Listener) {
    (this.listeners[type] ||= []).push(cb);
  }

  removeEventListener(type: string, cb: Listener) {
    const arr = this.listeners[type];
    if (!arr) return;
    this.listeners[type] = arr.filter((l) => l !== cb);
  }

  send(_data: any) {
    if (this.readyState !== MockWebSocket.OPEN) throw new Error('not open');
  }

  close(_code?: number, _reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatch('close', { code: 1000, reason: 'closed' });
  }

  // Helpers to simulate events
  open() { this.readyState = MockWebSocket.OPEN; this.dispatch('open', {}); }
  message(data: any) { this.dispatch('message', { data }); }
  error(err: any) { this.dispatch('error', err); }

  private dispatch(type: string, ev: any) { (this.listeners[type] || []).forEach((l) => l(ev)); }
}

describe('WebSocketClient', () => {
  const realWS = (global as any).WebSocket;
  beforeEach(() => { (global as any).WebSocket = MockWebSocket as any; });
  afterEach(() => { (global as any).WebSocket = realWS; });

  test('connect triggers open and send works when open', () => {
    const client = new WebSocketClient('ws://test');
    let opened = false;
    client.on({ open: () => { opened = true; } });
    client.connect();
    // simulate server open
    const ws = (client as any).ws as MockWebSocket;
    ws.open();
    expect(opened).toBe(true);

    // send should not throw when open and return true
    expect(client.send('hello')).toBe(true);
    client.close();
  });

  test('message handler receives data', () => {
    const client = new WebSocketClient('ws://test');
    const received: any[] = [];
    client.on({ message: (d) => received.push(d) });
    client.connect();
    const ws = (client as any).ws as MockWebSocket;
    ws.open();
    ws.message('payload');
    expect(received).toEqual(['payload']);
  });
});