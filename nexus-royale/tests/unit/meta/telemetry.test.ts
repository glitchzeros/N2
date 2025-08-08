import { initTelemetry, disposeTelemetry } from '@/game/meta/analytics/Telemetry';
import { eventBus } from '@/engine/core/events/EventBus';

class MockSink {
  events: Array<{e: string, p: any}> = [];
  record(e: string, p: any) { this.events.push({ e, p }); }
}

describe('Telemetry', () => {
  test('forwards events to sink', () => {
    const sink = new MockSink();
    initTelemetry(sink as any);
    eventBus.emit('hit', { target: 1, amount: 12 });
    eventBus.emit('kill', { killer: 1, victim: 2 });
    expect(sink.events.some(x => x.e === 'hit')).toBe(true);
    expect(sink.events.some(x => x.e === 'kill')).toBe(true);
    disposeTelemetry();
  });
});