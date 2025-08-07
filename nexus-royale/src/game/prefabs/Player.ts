import type { World } from '@/engine/core/ecs/World';
import type { Transform, Velocity, InputState, Health, WeaponState } from '@/game/components';

export function createPlayer(world: World): number {
  const e = world.createEntity();
  world.add<Transform>(e, 'Transform', { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });
  world.add<Velocity>(e, 'Velocity', { vx: 0, vy: 0, vz: 0 });
  world.add<InputState>(e, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: false });
  world.add<Health>(e, 'Health', { hp: 100, max: 100, alive: true });
  world.add<WeaponState>(e, 'WeaponState', { cooldown: 0, fireRate: 8, ammo: 100 });
  return e;
}