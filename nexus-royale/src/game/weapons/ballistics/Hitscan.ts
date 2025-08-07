import { Vector3 } from '@/engine/core/math/Vector3';
import type { World } from '@/engine/core/ecs/World';
import { intersectRayAABB, Ray } from '@/engine/physics/queries/Raycast';

export type Bounds = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number };

export type HitResult = { entity: number; distance: number } | null;

export function hitscan(world: World, origin: Vector3, direction: Vector3, maxDistance = 100): HitResult {
  const ray: Ray = { origin, direction: direction.clone().normalize() };
  // naive: iterate all with Bounds
  const entities = world.query(['Bounds']);
  let closest: HitResult = null;
  for (const e of entities) {
    const b = world.get<Bounds>(e, 'Bounds');
    if (!b) continue;
    const t = intersectRayAABB(ray, b);
    if (t !== Infinity && t <= maxDistance) {
      if (!closest || t < closest.distance) closest = { entity: e, distance: t };
    }
  }
  return closest;
}