import { Scheduler } from '@/engine/core/ecs/Scheduler';
import { World } from '@/engine/core/ecs/World';

function makeSystem(name: string, priority: number, calls: string[]) {
  return {
    name,
    priority,
    update: () => { calls.push(name); }
  };
}

describe('Scheduler', () => {
  test('runs systems in priority order', () => {
    const world = new World();
    const calls: string[] = [];
    const sched = new Scheduler({ world });
    sched.add(makeSystem('C', 3, calls));
    sched.add(makeSystem('A', 1, calls));
    sched.add(makeSystem('B', 2, calls));
    sched.update(1 / 60);
    expect(calls).toEqual(['A', 'B', 'C']);
  });
});