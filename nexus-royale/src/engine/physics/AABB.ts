import { Vector3 } from '@/engine/core/math/Vector3';

/**
 * Axis-Aligned Bounding Box for efficient collision detection
 */
export class AABB {
  public min: Vector3;
  public max: Vector3;
  public center: Vector3;
  public size: Vector3;

  constructor(min: Vector3, max: Vector3) {
    this.min = min.clone();
    this.max = max.clone();
    this.center = this.calculateCenter();
    this.size = this.calculateSize();
  }

  /**
   * Create AABB from center and size
   */
  static fromCenterSize(center: Vector3, size: Vector3): AABB {
    const halfSize = size.clone().multiplyScalar(0.5);
    const min = center.clone().sub(halfSize);
    const max = center.clone().add(halfSize);
    return new AABB(min, max);
  }

  /**
   * Create AABB from points
   */
  static fromPoints(points: Vector3[]): AABB {
    if (points.length === 0) {
      return new AABB(new Vector3(), new Vector3());
    }

    let minX = points[0].x, minY = points[0].y, minZ = points[0].z;
    let maxX = points[0].x, maxY = points[0].y, maxZ = points[0].z;

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      minZ = Math.min(minZ, point.z);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
      maxZ = Math.max(maxZ, point.z);
    }

    return new AABB(new Vector3(minX, minY, minZ), new Vector3(maxX, maxY, maxZ));
  }

  /**
   * Calculate center point
   */
  private calculateCenter(): Vector3 {
    return new Vector3(
      (this.min.x + this.max.x) * 0.5,
      (this.min.y + this.max.y) * 0.5,
      (this.min.z + this.max.z) * 0.5
    );
  }

  /**
   * Calculate size
   */
  private calculateSize(): Vector3 {
    return new Vector3(
      this.max.x - this.min.x,
      this.max.y - this.min.y,
      this.max.z - this.min.z
    );
  }

  /**
   * Update AABB from center and size
   */
  updateFromCenterSize(center: Vector3, size: Vector3): void {
    const halfSize = size.clone().multiplyScalar(0.5);
    this.min.copy(center).sub(halfSize);
    this.max.copy(center).add(halfSize);
    this.center.copy(center);
    this.size.copy(size);
  }

  /**
   * Expand AABB to include a point
   */
  expandToInclude(point: Vector3): void {
    this.min.x = Math.min(this.min.x, point.x);
    this.min.y = Math.min(this.min.y, point.y);
    this.min.z = Math.min(this.min.z, point.z);
    this.max.x = Math.max(this.max.x, point.x);
    this.max.y = Math.max(this.max.y, point.y);
    this.max.z = Math.max(this.max.z, point.z);
    this.center = this.calculateCenter();
    this.size = this.calculateSize();
  }

  /**
   * Expand AABB by a margin
   */
  expand(margin: number): void {
    this.min.sub(new Vector3(margin, margin, margin));
    this.max.add(new Vector3(margin, margin, margin));
    this.center = this.calculateCenter();
    this.size = this.calculateSize();
  }

  /**
   * Check if AABB contains a point
   */
  contains(point: Vector3): boolean {
    return point.x >= this.min.x && point.x <= this.max.x &&
           point.y >= this.min.y && point.y <= this.max.y &&
           point.z >= this.min.z && point.z <= this.max.z;
  }

  /**
   * Check if AABB intersects with another AABB
   */
  intersects(other: AABB): boolean {
    return this.min.x <= other.max.x && this.max.x >= other.min.x &&
           this.min.y <= other.max.y && this.max.y >= other.min.y &&
           this.min.z <= other.max.z && this.max.z >= other.min.z;
  }

  /**
   * Get intersection with another AABB
   */
  getIntersection(other: AABB): AABB | null {
    if (!this.intersects(other)) return null;

    const minX = Math.max(this.min.x, other.min.x);
    const minY = Math.max(this.min.y, other.min.y);
    const minZ = Math.max(this.min.z, other.min.z);
    const maxX = Math.min(this.max.x, other.max.x);
    const maxY = Math.min(this.max.y, other.max.y);
    const maxZ = Math.min(this.max.z, other.max.z);

    return new AABB(
      new Vector3(minX, minY, minZ),
      new Vector3(maxX, maxY, maxZ)
    );
  }

  /**
   * Get volume
   */
  getVolume(): number {
    return this.size.x * this.size.y * this.size.z;
  }

  /**
   * Get surface area
   */
  getSurfaceArea(): number {
    return 2 * (this.size.x * this.size.y + this.size.y * this.size.z + this.size.z * this.size.x);
  }

  /**
   * Clone this AABB
   */
  clone(): AABB {
    return new AABB(this.min.clone(), this.max.clone());
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `AABB(min: ${this.min.toString()}, max: ${this.max.toString()})`;
  }
}