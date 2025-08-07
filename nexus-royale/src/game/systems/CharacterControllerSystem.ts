import type { System, SystemContext } from '@/engine/core/ecs/System';
import type { InputState, Velocity } from '@/game/components';

const ACCEL = 20;
const FRICTION = 12;
const MAX_SPEED = 6;

export const CharacterControllerSystem: System = {
  name: 'CharacterControllerSystem',
  priority: 10,
  update(ctx: SystemContext, dt: number) {
    const entities = ctx.world.query(['InputState', 'Velocity']);
    for (const e of entities) {
      const input = ctx.world.get<InputState>(e, 'InputState')!;
      const vel = ctx.world.get<Velocity>(e, 'Velocity')!;

      const targetX = input.moveX;
      const targetZ = input.moveY; // forward/back on Z

      // Accelerate towards target
      vel.vx += targetX * ACCEL * dt;
      vel.vz += targetZ * ACCEL * dt;

      // Apply friction when no input
      if (targetX === 0) vel.vx -= Math.sign(vel.vx) * Math.min(Math.abs(vel.vx), FRICTION * dt);
      if (targetZ === 0) vel.vz -= Math.sign(vel.vz) * Math.min(Math.abs(vel.vz), FRICTION * dt);

      // Clamp speed
      const speedSq = vel.vx * vel.vx + vel.vz * vel.vz;
      const maxSq = MAX_SPEED * MAX_SPEED;
      if (speedSq > maxSq) {
        const s = Math.sqrt(speedSq);
        vel.vx = (vel.vx / s) * MAX_SPEED;
        vel.vz = (vel.vz / s) * MAX_SPEED;
      }

      ctx.world.add(e, 'Velocity', vel);
    }
  }
};