import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';
import { applyStateDelta } from '@/engine/net/sync/DeltaApplier';


describe('applyStateDelta', () => {
  test('updates existing entities with provided component values', () => {
    const world = new World();
    const Position = new MapComponentStore<{ x: number; y: number }>('Position');
    const Health = new MapComponentStore<{ hp: number }>('Health');
    world.registerComponent('Position', Position);
    world.registerComponent('Health', Health);

    const e = world.createEntity();
    world.add(e, 'Position', { x: 0, y: 0 });

    applyStateDelta(world, {
      type: 'state_delta',
      tick: 1,
      entities: [
        { id: e as any, comps: { Position: { x: 5, y: 6 }, Health: { hp: 99 } } }
      ]
    });

    expect(world.get(e, 'Position')).toEqual({ x: 5, y: 6 });
    expect(world.get(e, 'Health')).toEqual({ hp: 99 });
  });
});