import { Vector3 } from '@/engine/core/math/Vector3';

export type ShapeType = 'sphere' | 'box';

export interface SphereShape {
  type: 'sphere';
  radius: number;
}

export interface BoxShape {
  type: 'box';
  size: Vector3;
}

export type CollisionShape = SphereShape | BoxShape;

/**
 * Factory functions for creating collision shapes
 */
export class CollisionShapes {
  /**
   * Create a sphere shape
   */
  static sphere(radius: number): SphereShape {
    return {
      type: 'sphere',
      radius: Math.max(0, radius)
    };
  }

  /**
   * Create a box shape
   */
  static box(size: Vector3): BoxShape {
    return {
      type: 'box',
      size: size.clone()
    };
  }

  /**
   * Create a cube shape
   */
  static cube(size: number): BoxShape {
    return this.box(new Vector3(size, size, size));
  }

  /**
   * Get bounding box for a shape
   */
  static getBoundingBox(shape: CollisionShape, position: Vector3): { min: Vector3; max: Vector3 } {
    switch (shape.type) {
      case 'sphere':
        const radius = shape.radius;
        return {
          min: position.clone().sub(new Vector3(radius, radius, radius)),
          max: position.clone().add(new Vector3(radius, radius, radius))
        };

      case 'box':
        const halfSize = shape.size.clone().multiplyScalar(0.5);
        return {
          min: position.clone().sub(halfSize),
          max: position.clone().add(halfSize)
        };

      default:
        throw new Error(`Unknown shape type: ${(shape as any).type}`);
    }
  }

  /**
   * Get volume of a shape
   */
  static getVolume(shape: CollisionShape): number {
    switch (shape.type) {
      case 'sphere':
        return (4 / 3) * Math.PI * Math.pow(shape.radius, 3);

      case 'box':
        return shape.size.x * shape.size.y * shape.size.z;

      default:
        throw new Error(`Unknown shape type: ${(shape as any).type}`);
    }
  }

  /**
   * Get surface area of a shape
   */
  static getSurfaceArea(shape: CollisionShape): number {
    switch (shape.type) {
      case 'sphere':
        return 4 * Math.PI * Math.pow(shape.radius, 2);

      case 'box':
        const s = shape.size;
        return 2 * (s.x * s.y + s.y * s.z + s.z * s.x);

      default:
        throw new Error(`Unknown shape type: ${(shape as any).type}`);
    }
  }

  /**
   * Check if a point is inside a shape
   */
  static containsPoint(shape: CollisionShape, shapePosition: Vector3, point: Vector3): boolean {
    const localPoint = point.clone().sub(shapePosition);

    switch (shape.type) {
      case 'sphere':
        return localPoint.lengthSquared() <= shape.radius * shape.radius;

      case 'box':
        const halfSize = shape.size.clone().multiplyScalar(0.5);
        return Math.abs(localPoint.x) <= halfSize.x &&
               Math.abs(localPoint.y) <= halfSize.y &&
               Math.abs(localPoint.z) <= halfSize.z;

      default:
        throw new Error(`Unknown shape type: ${(shape as any).type}`);
    }
  }

  /**
   * Get closest point on shape surface to a given point
   */
  static getClosestPoint(shape: CollisionShape, shapePosition: Vector3, point: Vector3): Vector3 {
    const localPoint = point.clone().sub(shapePosition);

    switch (shape.type) {
      case 'sphere':
        const distance = localPoint.length();
        if (distance <= shape.radius) {
          return localPoint.normalize().multiplyScalar(shape.radius).add(shapePosition);
        } else {
          return localPoint.normalize().multiplyScalar(shape.radius).add(shapePosition);
        }

      case 'box':
        const halfSize = shape.size.clone().multiplyScalar(0.5);
        const closest = new Vector3(
          Math.max(-halfSize.x, Math.min(halfSize.x, localPoint.x)),
          Math.max(-halfSize.y, Math.min(halfSize.y, localPoint.y)),
          Math.max(-halfSize.z, Math.min(halfSize.z, localPoint.z))
        );
        return closest.add(shapePosition);

      default:
        throw new Error(`Unknown shape type: ${(shape as any).type}`);
    }
  }
}