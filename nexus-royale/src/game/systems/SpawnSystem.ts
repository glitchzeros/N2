import type { System, SystemContext } from '@/engine/core/ecs/System';
import { createBot } from '@/game/prefabs/Bot';

export function createSpawnSystem(count: number): System {
  return {
    name: 'SpawnSystem',
    priority: 5,
    init(ctx: SystemContext) {
      const existing = ctx.world.query(['Health', 'Bounds']);
      for (let i = existing.length; i < count; i++) {
        createBot(ctx.world, 5 + i * 2, 8 + (i % 3) * 2);
      }
    },
    update() {}
  };
}