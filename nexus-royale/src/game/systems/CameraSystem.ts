import type { System, SystemContext } from '@/engine/core/ecs/System';
import type { Transform } from '@/game/components';
import { Renderer } from '@/engine/renderer/Renderer';

export function createCameraSystem(playerEntity: number, renderer: Renderer): System {
  const offset = { x: -6, y: 6, z: 6 };
  return {
    name: 'CameraSystem',
    priority: 30,
    update(ctx: SystemContext) {
      const t = ctx.world.get<Transform>(playerEntity, 'Transform');
      if (!t) return;
      const cam = renderer.getCamera();
      cam.position.set(t.x + offset.x, t.y + offset.y, t.z + offset.z);
      cam.lookAt(t.x, t.y, t.z);
    }
  };
}