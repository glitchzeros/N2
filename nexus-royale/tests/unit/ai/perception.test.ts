import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';
import { createPerceptionSystem } from '@/game/ai/perception/Perception';
import type { SystemContext } from '@/engine/core/ecs/System';


describe('PerceptionSystem', () => {
  test('selects nearest target within range', () => {
    const world = new World();
    const AIState = new MapComponentStore<{ targetEntity: number|null; mode: 'patrol'|'combat'; perceptionRange: number }>('AIState');
    const Transform = new MapComponentStore<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number }>('Transform');
    const InputState = new MapComponentStore<{ moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean }>('InputState');
    world.registerComponent('AIState', AIState);
    world.registerComponent('Transform', Transform);
    world.registerComponent('InputState', InputState);

    const bot = world.createEntity();
    world.add(bot, 'AIState', { targetEntity: null, mode: 'patrol', perceptionRange: 10 });
    world.add(bot, 'Transform', { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });

    const p1 = world.createEntity();
    world.add(p1, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: false });
    world.add(p1, 'Transform', { x: 5, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });

    const p2 = world.createEntity();
    world.add(p2, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: false });
    world.add(p2, 'Transform', { x: 8, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });

    const sys = createPerceptionSystem();
    const ctx: SystemContext = { world };
    sys.update(ctx, 1/60);

    const ai = world.get(bot, 'AIState')!;
    expect(ai.mode).toBe('combat');
    expect([p1, p2]).toContain(ai.targetEntity);
    // nearest is p1
    expect(ai.targetEntity).toBe(p1);
  });
});