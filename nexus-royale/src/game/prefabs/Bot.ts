import type { World } from '@/engine/core/ecs/World';
import type { Transform, Velocity, Health, AIState } from '@/game/components';

export function createBot(world: World, x = 5, z = 8): number {
  const e = world.createEntity();
  world.add<Transform>(e, 'Transform', { x, y: 0, z, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 });
  world.add<Velocity>(e, 'Velocity', { vx: 0, vy: 0, vz: 0 });
  world.add<Health>(e, 'Health', { hp: 60, max: 60, alive: true });
  world.add(e, 'Bounds', { minX: x - 0.5, minY: 0, minZ: z - 0.5, maxX: x + 0.5, maxY: 2, maxZ: z + 0.5 });
  world.add<AIState>(e, 'AIState', { targetEntity: null, mode: 'patrol', perceptionRange: 25 });
  world.add(e, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: false });
  return e;
}