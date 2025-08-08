import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';

describe('ECS World', () => {
  test('create/destroy entities and add/remove components', () => {
    const world = new World();
    const Position = new MapComponentStore<{ x: number; y: number; z: number }>('Position');
    const Health = new MapComponentStore<{ hp: number; max: number }>('Health');
    world.registerComponent('Position', Position);
    world.registerComponent('Health', Health);

    const e1 = world.createEntity();
    const e2 = world.createEntity();

    world.add(e1, 'Position', { x: 1, y: 2, z: 3 });
    world.add(e1, 'Health', { hp: 100, max: 100 });
    world.add(e2, 'Position', { x: 0, y: 0, z: 0 });

    expect(world.get(e1, 'Position')).toEqual({ x: 1, y: 2, z: 3 });
    expect(world.has(e1, 'Health')).toBe(true);
    expect(world.has(e2, 'Health')).toBe(false);

    world.remove(e1, 'Health');
    expect(world.has(e1, 'Health')).toBe(false);

    world.destroyEntity(e2);
    expect(world.isAlive(e2)).toBe(false);
    expect(Position.get(e2)).toBeUndefined();
  });

  test('query includes and excludes', () => {
    const world = new World();
    const A = new MapComponentStore<{ a: number }>('A');
    const B = new MapComponentStore<{ b: number }>('B');
    const C = new MapComponentStore<{ c: number }>('C');
    world.registerComponent('A', A);
    world.registerComponent('B', B);
    world.registerComponent('C', C);

    const e1 = world.createEntity(); // A, B
    const e2 = world.createEntity(); // A
    const e3 = world.createEntity(); // A, C
    world.add(e1, 'A', { a: 1 }); world.add(e1, 'B', { b: 1 });
    world.add(e2, 'A', { a: 2 });
    world.add(e3, 'A', { a: 3 }); world.add(e3, 'C', { c: 1 });

    const q1 = world.query(['A', 'B']);
    expect(q1).toEqual([e1]);

    const q2 = world.query(['A'], ['C']);
    expect(q2.sort()).toEqual([e1, e2].sort());
  });
});