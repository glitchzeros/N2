import { Vector3 } from '@/engine/core/math/Vector3';

export type Ray = { origin: Vector3; direction: Vector3 };

export type AABB = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number };

// Returns distance t if hit, else Infinity
export function intersectRayAABB(ray: Ray, box: AABB): number {
  const invDirX = 1 / ray.direction.x;
  const invDirY = 1 / ray.direction.y;
  const invDirZ = 1 / ray.direction.z;

  let tmin = ((invDirX >= 0 ? box.minX : box.maxX) - ray.origin.x) * invDirX;
  let tmax = ((invDirX >= 0 ? box.maxX : box.minX) - ray.origin.x) * invDirX;

  const tymin = ((invDirY >= 0 ? box.minY : box.maxY) - ray.origin.y) * invDirY;
  const tymax = ((invDirY >= 0 ? box.maxY : box.minY) - ray.origin.y) * invDirY;

  if (tmin > tymax || tymin > tmax) return Infinity;
  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;

  const tzmin = ((invDirZ >= 0 ? box.minZ : box.maxZ) - ray.origin.z) * invDirZ;
  const tzmax = ((invDirZ >= 0 ? box.maxZ : box.minZ) - ray.origin.z) * invDirZ;

  if (tmin > tzmax || tzmin > tmax) return Infinity;
  if (tzmin > tmin) tmin = tzmin;
  if (tzmax < tmax) tmax = tzmax;

  if (tmax < 0) return Infinity; // box behind ray
  return tmin >= 0 ? tmin : tmax; // if inside box, return exit distance
}