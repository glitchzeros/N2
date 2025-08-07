import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';
import { MovementSystem } from '@/game/systems/MovementSystem';
import type { SystemContext } from '@/engine/core/ecs/System';

describe('MovementSystem', () => {
  test('applies velocity to transform', () => {
    const world = new World();
    const Transform = new MapComponentStore<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number }>('Transform');
    const Velocity = new MapComponentStore<{ vx: number; vy: number; vz: number }>('Velocity');
    world.registerComponent('Transform', Transform);
    world.registerComponent('Velocity', Velocity);

    const e = world.createEntity();
    world.add(e, 'Transform', { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });
    world.add(e, 'Velocity', { vx: 1, vy: 0, vz: 0 });

    const ctx: SystemContext = { world };
    MovementSystem.update(ctx, 1);

    expect(world.get(e, 'Transform')!.x).toBeCloseTo(1);
  });
});