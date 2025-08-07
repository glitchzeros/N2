import { MapComponentStore } from '@/engine/core/ecs/Component';
import type { World } from '@/engine/core/ecs/World';

export type Transform = { x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number };
export type Velocity = { vx: number; vy: number; vz: number };
export type InputState = { moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean };
export type Health = { hp: number; max: number; alive: boolean };
export type WeaponState = { cooldown: number; fireRate: number; ammo: number };

export function registerGameComponents(world: World) {
  const TransformStore = new MapComponentStore<Transform>('Transform');
  const VelocityStore = new MapComponentStore<Velocity>('Velocity');
  const InputStateStore = new MapComponentStore<InputState>('InputState');
  const HealthStore = new MapComponentStore<Health>('Health');
  const WeaponStateStore = new MapComponentStore<WeaponState>('WeaponState');

  world.registerComponent('Transform', TransformStore);
  world.registerComponent('Velocity', VelocityStore);
  world.registerComponent('InputState', InputStateStore);
  world.registerComponent('Health', HealthStore);
  world.registerComponent('WeaponState', WeaponStateStore);

  return { TransformStore, VelocityStore, InputStateStore, HealthStore, WeaponStateStore };
}