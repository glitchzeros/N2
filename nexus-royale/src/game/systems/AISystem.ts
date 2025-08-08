import type { System, SystemContext } from '@/engine/core/ecs/System';
import type { AIState, InputState, Transform, Velocity } from '@/game/components';

export function createAISystem(): System {
  return {
    name: 'AISystem',
    priority: 14,
    update(ctx: SystemContext, dt: number) {
      const bots = ctx.world.query(['AIState', 'InputState', 'Transform', 'Velocity']);
      for (const e of bots) {
        const ai = ctx.world.get<AIState>(e, 'AIState')!;
        const input = ctx.world.get<InputState>(e, 'InputState')!;
        const t = ctx.world.get<Transform>(e, 'Transform')!;
        const v = ctx.world.get<Velocity>(e, 'Velocity')!;

        if (ai.mode === 'combat' && ai.targetEntity != null) {
          const targetT = ctx.world.get<Transform>(ai.targetEntity, 'Transform');
          const health = ctx.world.get<{ hp: number; max: number }>(e, 'Health');
          input.fire = true;
          if (targetT) {
            const dx = targetT.x - t.x;
            const dz = targetT.z - t.z;
            const d = Math.hypot(dx, dz) || 1;
            const nx = dx / d;
            const nz = dz / d;

            // Retreat if health < 25%
            const lowHealth = !!health && health.hp / Math.max(1, health.max) < 0.25;
            if (lowHealth) {
              input.moveX = -nx;
              input.moveY = -nz;
            } else {
              // Strafe perpendicular to target direction
              const side = (e % 2 === 0) ? 1 : -1; // deterministic per-entity
              const sx = -nz * side;
              const sz = nx * side;
              input.moveX = sx * 0.5;
              input.moveY = sz * 0.5;
            }
          } else {
            input.moveX = 0; input.moveY = 0;
          }
          ctx.world.add(e, 'InputState', input);
        } else {
          // Patrol: small wander
          input.fire = false;
          input.moveX = Math.sin((t.x + t.z) * 0.2) * 0.2;
          input.moveY = Math.cos((t.x - t.z) * 0.2) * 0.2;
          ctx.world.add(e, 'InputState', input);
          // slight damping
          v.vx *= 0.98; v.vz *= 0.98; ctx.world.add(e, 'Velocity', v);
        }
      }
    }
  };
}