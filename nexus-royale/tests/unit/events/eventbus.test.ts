import { EventBus } from '@/engine/core/events/EventBus';

describe('EventBus', () => {
  test('on/emit/off works', () => {
    const bus = new EventBus();
    const calls: number[] = [];
    const off = bus.on<number>('tick', (n) => calls.push(n));
    bus.emit('tick', 1);
    bus.emit('tick', 2);
    expect(calls).toEqual([1,2]);
    off();
    bus.emit('tick', 3);
    expect(calls).toEqual([1,2]);
  });
});