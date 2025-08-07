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
          // Face target roughly and fire
          input.fire = true;
          input.moveX = 0; input.moveY = 0;
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