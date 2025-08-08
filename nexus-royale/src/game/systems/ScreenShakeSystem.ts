import type { System, SystemContext } from '@/engine/core/ecs/System';
import { Renderer } from '@/engine/renderer/Renderer';
import { eventBus } from '@/engine/core/events/EventBus';
import { getReduceMotion } from '@/config/experience/Settings';

export function createScreenShakeSystem(renderer: Renderer): System {
  let timeLeft = 0;
  let intensity = 0;

  const unsubShake = eventBus.on<{ mag: number; duration: number }>('shake', (p) => {
    if (getReduceMotion()) return;
    intensity = Math.max(intensity, p.mag);
    timeLeft = Math.max(timeLeft, p.duration);
  });
  const unsubHit = eventBus.on<{ target: number; amount: number }>('hit', () => {
    if (getReduceMotion()) return;
    intensity = Math.max(intensity, 0.05);
    timeLeft = Math.max(timeLeft, 0.08);
  });

  return {
    name: 'ScreenShakeSystem',
    priority: 31,
    update(_ctx: SystemContext, dt: number) {
      if (timeLeft <= 0) return;
      timeLeft = Math.max(0, timeLeft - dt);
      intensity *= Math.exp(-6 * dt);
      const cam = renderer.getCamera();
      const ox = (Math.random() * 2 - 1) * intensity;
      const oy = (Math.random() * 2 - 1) * intensity;
      const oz = (Math.random() * 2 - 1) * intensity;
      cam.position.x += ox;
      cam.position.y += oy;
      cam.position.z += oz;
    },
    dispose() {
      unsubShake();
      unsubHit();
    }
  };
}