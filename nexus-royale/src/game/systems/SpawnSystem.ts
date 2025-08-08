import type { System, SystemContext } from '@/engine/core/ecs/System';
import { createBot } from '@/game/prefabs/Bot';

export function createSpawnSystem(count: number, radius = 20): System {
  return {
    name: 'SpawnSystem',
    priority: 5,
    init(ctx: SystemContext) {
      const existing = ctx.world.query(['Health', 'Bounds']);
      for (let i = existing.length; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * radius;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        createBot(ctx.world, x, z);
      }
    },
    update() {}
  };
}