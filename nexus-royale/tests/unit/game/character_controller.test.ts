import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';
import { CharacterControllerSystem } from '@/game/systems/CharacterControllerSystem';
import type { SystemContext } from '@/engine/core/ecs/System';


describe('CharacterControllerSystem', () => {
  test('input causes acceleration and friction', () => {
    const world = new World();
    const InputState = new MapComponentStore<{ moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean }>('InputState');
    const Velocity = new MapComponentStore<{ vx: number; vy: number; vz: number }>('Velocity');
    world.registerComponent('InputState', InputState);
    world.registerComponent('Velocity', Velocity);

    const e = world.createEntity();
    world.add(e, 'InputState', { moveX: 1, moveY: 0, lookX: 0, lookY: 0, fire: false });
    world.add(e, 'Velocity', { vx: 0, vy: 0, vz: 0 });

    const ctx: SystemContext = { world };
    CharacterControllerSystem.update(ctx, 1/60);
    expect(world.get(e, 'Velocity')!.vx).toBeGreaterThan(0);

    // No input => friction should reduce speed
    world.add(e, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: false });
    const vxPrev = world.get(e, 'Velocity')!.vx;
    CharacterControllerSystem.update(ctx, 1/60);
    expect(world.get(e, 'Velocity')!.vx).toBeLessThanOrEqual(vxPrev);
  });
});