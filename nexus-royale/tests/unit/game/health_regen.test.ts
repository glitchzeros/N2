import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';
import { createHealthRegenSystem } from '@/game/systems/HealthRegenSystem';
import type { SystemContext } from '@/engine/core/ecs/System';

describe('HealthRegenSystem', () => {
  test('regens health and clamps to max', () => {
    const world = new World();
    const Health = new MapComponentStore<{ hp: number; max: number; alive: boolean }>('Health');
    world.registerComponent('Health', Health);

    const e = world.createEntity();
    world.add(e, 'Health', { hp: 50, max: 100, alive: true });

    const sys = createHealthRegenSystem(10); // 10 hp/s
    const ctx: SystemContext = { world };
    sys.update(ctx, 1); // +10
    expect(world.get(e, 'Health')!.hp).toBeCloseTo(60);

    sys.update(ctx, 10); // +100 => clamp to 100
    expect(world.get(e, 'Health')!.hp).toBeCloseTo(100);
  });
});