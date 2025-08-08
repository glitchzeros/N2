export type WebSocketEvents = {
  open?: () => void;
  message?: (data: ArrayBuffer | string) => void;
  close?: (code: number, reason: string) => void;
  error?: (err: Event) => void;
};

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private events: WebSocketEvents = {};

  constructor(private url: string) {}

  on(events: WebSocketEvents): void { this.events = { ...this.events, ...events }; }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';
      this.ws.addEventListener('open', () => this.events.open?.());
      this.ws.addEventListener('message', (ev) => this.events.message?.(ev.data as any));
      this.ws.addEventListener('close', (ev) => this.events.close?.(ev.code, ev.reason));
      this.ws.addEventListener('error', (ev) => this.events.error?.(ev));
    } catch (e) {
      // surface error via callback if available
      this.events.error?.(e as any);
    }
  }

  send(data: ArrayBuffer | string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(data);
    return true;
  }

  close(code?: number, reason?: string): void { this.ws?.close(code, reason); this.ws = null; }
}