import type { World } from '@/engine/core/ecs/World';
import type { Health } from '@/game/components';

export function applyDamage(world: World, target: number, amount: number): boolean {
  const h = world.get<Health>(target, 'Health');
  if (!h || !h.alive) return false;
  h.hp = Math.max(0, h.hp - amount);
  if (h.hp <= 0) h.alive = false;
  world.add(target, 'Health', h);
  return true;
}