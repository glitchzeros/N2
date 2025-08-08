import type { World } from '@/engine/core/ecs/World';
import type { StateDeltaMessage } from '@/engine/net/protocol/Messages';

export function applyStateDelta(world: World, delta: StateDeltaMessage): void {
  for (const ent of delta.entities) {
    const id = ent.id;
    if (!world.isAlive(id as any)) continue;
    for (const [comp, value] of Object.entries(ent.comps)) {
      world.add(id as any, comp, value as any);
    }
  }
}