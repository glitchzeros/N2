import type { System, SystemContext } from '@/engine/core/ecs/System';
import type { Transform, Velocity } from '@/game/components';

export const MovementSystem: System = {
  name: 'MovementSystem',
  priority: 20,
  update(ctx: SystemContext, dt: number) {
    const entities = ctx.world.query(['Transform', 'Velocity']);
    for (const e of entities) {
      const t = ctx.world.get<Transform>(e, 'Transform')!;
      const v = ctx.world.get<Velocity>(e, 'Velocity')!;
      t.x += v.vx * dt; t.y += v.vy * dt; t.z += v.vz * dt;
      ctx.world.add(e, 'Transform', t);
    }
  }
};