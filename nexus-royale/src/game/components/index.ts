import { MapComponentStore } from '@/engine/core/ecs/Component';
import type { World } from '@/engine/core/ecs/World';

export type Transform = { x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number };
export type Velocity = { vx: number; vy: number; vz: number };
export type InputState = { moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean };
export type Health = { hp: number; max: number; alive: boolean };
export type WeaponState = { cooldown: number; fireRate: number; ammo: number };
export type Bounds = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number };
export type AIState = { targetEntity: number | null; mode: 'patrol' | 'combat'; perceptionRange: number };
export type SpawnState = { phase: 'queued' | 'dropping' | 'active'; timer: number; spawnX: number; spawnY: number; spawnZ: number };

export function registerGameComponents(world: World) {
  const TransformStore = new MapComponentStore<Transform>('Transform');
  const VelocityStore = new MapComponentStore<Velocity>('Velocity');
  const InputStateStore = new MapComponentStore<InputState>('InputState');
  const HealthStore = new MapComponentStore<Health>('Health');
  const WeaponStateStore = new MapComponentStore<WeaponState>('WeaponState');
  const BoundsStore = new MapComponentStore<Bounds>('Bounds');
  const AIStateStore = new MapComponentStore<AIState>('AIState');
  const SpawnStateStore = new MapComponentStore<SpawnState>('SpawnState');

  world.registerComponent('Transform', TransformStore);
  world.registerComponent('Velocity', VelocityStore);
  world.registerComponent('InputState', InputStateStore);
  world.registerComponent('Health', HealthStore);
  world.registerComponent('WeaponState', WeaponStateStore);
  world.registerComponent('Bounds', BoundsStore);
  world.registerComponent('AIState', AIStateStore);
  world.registerComponent('SpawnState', SpawnStateStore);

  return { TransformStore, VelocityStore, InputStateStore, HealthStore, WeaponStateStore, BoundsStore, AIStateStore, SpawnStateStore };
}