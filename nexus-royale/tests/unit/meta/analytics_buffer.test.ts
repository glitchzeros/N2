import { BufferedSink } from '@/config/monitoring/analytics-buffer';

class MockSink {
  events: Array<{e: string, p: any}> = [];
  record(e: string, p: any) { this.events.push({ e, p }); }
}

describe('BufferedSink', () => {
  test('buffers and flushes events', () => {
    const target = new MockSink();
    const buf = new BufferedSink(target as any, 100000); // long interval to avoid auto flush
    (buf as any).record('test', { a: 1 });
    expect(target.events.length).toBe(0);
    buf.flush();
    expect(target.events.length).toBe(1);
  });
});