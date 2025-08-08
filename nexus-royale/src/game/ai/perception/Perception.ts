import type { System, SystemContext } from '@/engine/core/ecs/System';
import type { AIState, Transform } from '@/game/components';

export function createPerceptionSystem(): System {
  return {
    name: 'PerceptionSystem',
    priority: 12,
    update(ctx: SystemContext) {
      const bots = ctx.world.query(['AIState', 'Transform']);
      const players = ctx.world.query(['InputState', 'Transform']);

      for (const b of bots) {
        const ai = ctx.world.get<AIState>(b, 'AIState')!;
        const bt = ctx.world.get<Transform>(b, 'Transform')!;
        let closest: { e: number; d2: number } | null = null;
        for (const p of players) {
          const pt = ctx.world.get<Transform>(p, 'Transform')!;
          const dx = pt.x - bt.x; const dz = pt.z - bt.z; const d2 = dx*dx + dz*dz;
          if (d2 <= ai.perceptionRange * ai.perceptionRange) {
            if (!closest || d2 < closest.d2) closest = { e: p, d2 };
          }
        }
        ai.targetEntity = closest ? closest.e : null;
        ai.mode = ai.targetEntity ? 'combat' : 'patrol';
        ctx.world.add(b, 'AIState', ai);
      }
    }
  };
}