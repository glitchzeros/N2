import type { System, SystemContext } from '@/engine/core/ecs/System';
import type { InputState, WeaponState } from '@/game/components';
import { Vector3 } from '@/engine/core/math/Vector3';
import { hitscan } from '@/game/weapons/ballistics/Hitscan';
import { applyDamage } from '@/game/weapons/damage/DamageModel';
import { eventBus } from '@/engine/core/events/EventBus';
import { playPulseRifle } from '@/engine/audio/synthesis/Synth';

const DAMAGE = 12; // Pulse Rifle

export function createWeaponSystem(playerEntity: number): System {
  return {
    name: 'WeaponSystem',
    priority: 15,
    update(ctx: SystemContext, dt: number) {
      const w = ctx.world.get<WeaponState>(playerEntity, 'WeaponState');
      const i = ctx.world.get<InputState>(playerEntity, 'InputState');
      if (!w || !i) return;

      if (w.cooldown > 0) { w.cooldown = Math.max(0, w.cooldown - dt); ctx.world.add(playerEntity, 'WeaponState', w); return; }
      if (!i.fire || w.ammo <= 0) return;

      // Fire
      w.cooldown = 1 / w.fireRate;
      w.ammo -= 1;
      ctx.world.add(playerEntity, 'WeaponState', w);
      playPulseRifle();

      const origin = new Vector3(0, 1.5, 0);
      const dir = new Vector3(0, 0, 1);
      const hit = hitscan(ctx.world, origin, dir, 100);
      if (hit) {
        const target = hit.entity;
        const before = ctx.world.get<{ hp: number; alive: boolean }>(target, 'Health');
        eventBus.emit('hit', { target, amount: DAMAGE });
        applyDamage(ctx.world, target, DAMAGE);
        const after = ctx.world.get<{ hp: number; alive: boolean }>(target, 'Health');
        if (before && after && before.alive && !after.alive) {
          eventBus.emit('kill', { killer: playerEntity, victim: target });
        }
      }
    }
  };
}