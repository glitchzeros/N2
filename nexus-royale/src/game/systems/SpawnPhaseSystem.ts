import type { System, SystemContext } from '@/engine/core/ecs/System';
import type { SpawnState, InputState, Transform } from '@/game/components';

export function createSpawnPhaseSystem(): System {
  return {
    name: 'SpawnPhaseSystem',
    priority: 9,
    update(ctx: SystemContext, dt: number) {
      const entities = ctx.world.query(['SpawnState', 'InputState', 'Transform']);
      for (const e of entities) {
        const s = ctx.world.get<SpawnState>(e, 'SpawnState')!;
        const input = ctx.world.get<InputState>(e, 'InputState')!;
        const t = ctx.world.get<Transform>(e, 'Transform')!;

        if (s.phase === 'queued') {
          s.phase = 'dropping'; s.timer = 1.5; // 1.5s drop
          // Move above spawn point visually
          t.x = s.spawnX; t.y = s.spawnY + 10; t.z = s.spawnZ;
          ctx.world.add(e, 'Transform', t);
          ctx.world.add(e, 'SpawnState', s);
        } else if (s.phase === 'dropping') {
          s.timer -= dt;
          // Ease down
          t.y = Math.max(s.spawnY, t.y - 10 * dt);
          ctx.world.add(e, 'Transform', t);
          if (s.timer <= 0) {
            s.phase = 'active';
            ctx.world.add(e, 'SpawnState', s);
          }
        } else if (s.phase === 'active') {
          // normal control; nothing to do
        }

        // Gate controls if not active
        if (s.phase !== 'active') {
          input.moveX = 0; input.moveY = 0; input.fire = false; ctx.world.add(e, 'InputState', input);
        }
      }
    }
  };
}