import type { System, SystemContext } from '@/engine/core/ecs/System';

export function createHealthRegenSystem(ratePerSecond = 2): System {
  return {
    name: 'HealthRegenSystem',
    priority: 25,
    update(ctx: SystemContext, dt: number) {
      const entities = ctx.world.query(['Health']);
      for (const e of entities) {
        const h = ctx.world.get<{ hp: number; max: number; alive: boolean }>(e, 'Health')!;
        if (!h.alive || h.hp >= h.max) continue;
        h.hp = Math.min(h.max, h.hp + ratePerSecond * dt);
        ctx.world.add(e, 'Health', h);
      }
    }
  };
}