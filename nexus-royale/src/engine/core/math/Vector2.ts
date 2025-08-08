/**
 * High-performance 2D vector class
 */
export class Vector2 {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {}

  /**
   * Set vector components
   */
  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Copy from another vector
   */
  copy(v: Vector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  /**
   * Clone this vector
   */
  clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  /**
   * Add another vector
   */
  add(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * Subtract another vector
   */
  sub(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /**
   * Multiply by scalar
   */
  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Divide by scalar
   */
  divideScalar(scalar: number): this {
    return this.multiplyScalar(1 / scalar);
  }

  /**
   * Dot product with another vector
   */
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Cross product with another vector
   */
  cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }

  /**
   * Get length (magnitude)
   */
  length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  /**
   * Get squared length (faster than length)
   */
  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Normalize this vector
   */
  normalize(): this {
    return this.divideScalar(this.length());
  }

  /**
   * Get distance to another vector
   */
  distanceTo(v: Vector2): number {
    return Math.sqrt(this.distanceSquaredTo(v));
  }

  /**
   * Get squared distance to another vector (faster than distanceTo)
   */
  distanceSquaredTo(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  /**
   * Linear interpolation with another vector
   */
  lerp(v: Vector2, alpha: number): this {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    return this;
  }

  /**
   * Check if vector equals another
   */
  equals(v: Vector2): boolean {
    return this.x === v.x && this.y === v.y;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `Vector2(${this.x}, ${this.y})`;
  }

  /**
   * Static methods for common operations
   */
  static add(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x + b.x, a.y + b.y);
  }

  static sub(a: Vector2, b: Vector2): Vector2 {
    return new Vector2(a.x - b.x, a.y - b.y);
  }

  static multiplyScalar(v: Vector2, scalar: number): Vector2 {
    return new Vector2(v.x * scalar, v.y * scalar);
  }

  static dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  }

  static distance(a: Vector2, b: Vector2): number {
    return Math.sqrt(a.distanceSquaredTo(b));
  }

  static lerp(a: Vector2, b: Vector2, alpha: number): Vector2 {
    return new Vector2(
      a.x + (b.x - a.x) * alpha,
      a.y + (b.y - a.y) * alpha
    );
  }
}