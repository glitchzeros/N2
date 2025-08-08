import type { AnalyticsSink } from '@/config/monitoring/analytics';

export class BufferedSink implements AnalyticsSink {
  private buffer: Array<{ event: string; payload: unknown; t: number }> = [];
  private timer: any = null;
  private readonly intervalMs: number;
  private readonly target: AnalyticsSink;

  constructor(target: AnalyticsSink, intervalMs = 5000) {
    this.target = target;
    this.intervalMs = intervalMs;
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => this.flush(), this.intervalMs);
    }
  }

  record(event: string, payload: unknown): void {
    this.buffer.push({ event, payload, t: Date.now() });
  }

  flush(): void {
    for (const item of this.buffer) this.target.record(item.event, item.payload);
    this.buffer.length = 0;
  }

  dispose(): void { if (this.timer) clearInterval(this.timer); this.timer = null; }
}