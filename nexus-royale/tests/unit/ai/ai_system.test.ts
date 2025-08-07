import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';
import { createAISystem } from '@/game/systems/AISystem';
import type { SystemContext } from '@/engine/core/ecs/System';

describe('AISystem', () => {
  test('combat mode sets fire', () => {
    const world = new World();
    const AIState = new MapComponentStore<{ targetEntity: number|null; mode: 'patrol'|'combat'; perceptionRange: number }>('AIState');
    const InputState = new MapComponentStore<{ moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean }>('InputState');
    const Transform = new MapComponentStore<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number }>('Transform');
    const Velocity = new MapComponentStore<{ vx: number; vy: number; vz: number }>('Velocity');
    world.registerComponent('AIState', AIState);
    world.registerComponent('InputState', InputState);
    world.registerComponent('Transform', Transform);
    world.registerComponent('Velocity', Velocity);

    const bot = world.createEntity();
    world.add(bot, 'AIState', { targetEntity: 999, mode: 'combat', perceptionRange: 10 });
    world.add(bot, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: false });
    world.add(bot, 'Transform', { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });
    world.add(bot, 'Velocity', { vx: 1, vy: 0, vz: 1 });

    const sys = createAISystem();
    const ctx: SystemContext = { world };
    sys.update(ctx, 1/60);

    expect(world.get(bot, 'InputState')!.fire).toBe(true);
  });

  test('patrol mode sets small movement', () => {
    const world = new World();
    const AIState = new MapComponentStore<{ targetEntity: number|null; mode: 'patrol'|'combat'; perceptionRange: number }>('AIState');
    const InputState = new MapComponentStore<{ moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean }>('InputState');
    const Transform = new MapComponentStore<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number }>('Transform');
    const Velocity = new MapComponentStore<{ vx: number; vy: number; vz: number }>('Velocity');
    world.registerComponent('AIState', AIState);
    world.registerComponent('InputState', InputState);
    world.registerComponent('Transform', Transform);
    world.registerComponent('Velocity', Velocity);

    const bot = world.createEntity();
    world.add(bot, 'AIState', { targetEntity: null, mode: 'patrol', perceptionRange: 10 });
    world.add(bot, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: true });
    world.add(bot, 'Transform', { x: 1, y: 0, z: 2, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });
    world.add(bot, 'Velocity', { vx: 1, vy: 0, vz: 1 });

    const sys = createAISystem();
    const ctx: SystemContext = { world };
    sys.update(ctx, 1/60);

    const st = world.get(bot, 'InputState')!;
    expect(st.fire).toBe(false);
    expect(Math.abs(st.moveX)).toBeLessThanOrEqual(0.2);
    expect(Math.abs(st.moveY)).toBeLessThanOrEqual(0.2);
  });
});