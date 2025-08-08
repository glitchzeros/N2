import type { System, SystemContext } from '@/engine/core/ecs/System';

export function createGravitySystem(gravity = -9.81, groundY = 0): System {
  return {
    name: 'GravitySystem',
    priority: 22,
    update(ctx: SystemContext, dt: number) {
      const entities = ctx.world.query(['Transform', 'Velocity']);
      for (const e of entities) {
        const t = ctx.world.get<{ x: number; y: number; z: number }>(e, 'Transform')!;
        const v = ctx.world.get<{ vx: number; vy: number; vz: number }>(e, 'Velocity')!;

        // Integrate vertical motion
        v.vy += gravity * dt;
        t.y += v.vy * dt;

        // Ground clamp
        if (t.y <= groundY) {
          t.y = groundY;
          if (v.vy < 0) v.vy = 0;
        }

        ctx.world.add(e, 'Transform', t);
        ctx.world.add(e, 'Velocity', v);
      }
    }
  };
}