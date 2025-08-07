import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';
import { createWeaponSystem } from '@/game/systems/WeaponSystem';
import type { SystemContext } from '@/engine/core/ecs/System';


describe('WeaponSystem', () => {
  test('fire rate and damage application', () => {
    const world = new World();
    const WeaponState = new MapComponentStore<{ cooldown: number; fireRate: number; ammo: number }>('WeaponState');
    const InputState = new MapComponentStore<{ moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean }>('InputState');
    const Health = new MapComponentStore<{ hp: number; max: number; alive: boolean }>('Health');
    const Bounds = new MapComponentStore<{ minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number }>('Bounds');
    world.registerComponent('WeaponState', WeaponState);
    world.registerComponent('InputState', InputState);
    world.registerComponent('Health', Health);
    world.registerComponent('Bounds', Bounds);

    // Player
    const p = world.createEntity();
    world.add(p, 'WeaponState', { cooldown: 0, fireRate: 8, ammo: 10 });
    world.add(p, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: true });

    // Target straight ahead along +Z from origin
    const t = world.createEntity();
    world.add(t, 'Health', { hp: 100, max: 100, alive: true });
    world.add(t, 'Bounds', { minX: -0.5, minY: 0, minZ: 5, maxX: 0.5, maxY: 2, maxZ: 5.5 });

    const sys = createWeaponSystem(p);
    const ctx: SystemContext = { world };

    sys.update(ctx, 1/60); // should fire once
    expect(world.get(p, 'WeaponState')!.cooldown).toBeGreaterThan(0);
    expect(world.get(t, 'Health')!.hp).toBeLessThan(100);

    const hpAfter = world.get(t, 'Health')!.hp;
    sys.update(ctx, 1/60); // still cooling down → no extra damage
    expect(world.get(t, 'Health')!.hp).toBe(hpAfter);
  });
});