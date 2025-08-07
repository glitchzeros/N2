import type { System, SystemContext } from '@/engine/core/ecs/System';
import type { InputState } from '@/game/components';

export type InputSnapshot = { moveX: number; moveY: number; lookDeltaX: number; lookDeltaY: number; fire: boolean };
export type InputProvider = () => InputSnapshot;

export function createInputSystem(playerEntity: number, provide: InputProvider): System {
  return {
    name: 'InputSystem',
    priority: 0,
    update(ctx: SystemContext) {
      const snap = provide();
      const st = ctx.world.get<InputState>(playerEntity, 'InputState');
      if (!st) return;
      st.moveX = snap.moveX;
      st.moveY = snap.moveY;
      st.lookX = snap.lookDeltaX;
      st.lookY = snap.lookDeltaY;
      st.fire = snap.fire;
      ctx.world.add(playerEntity, 'InputState', st);
    }
  };
}