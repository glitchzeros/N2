import { Vector3 } from './Vector3';

/**
 * Quaternion for 3D rotations
 */
export class Quaternion {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public z: number = 0,
    public w: number = 1
  ) {}

  /**
   * Set quaternion components
   */
  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * Copy from another quaternion
   */
  copy(q: Quaternion): this {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  /**
   * Clone this quaternion
   */
  clone(): Quaternion {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * Set from Euler angles (in radians)
   */
  setFromEuler(x: number, y: number, z: number): this {
    const cx = Math.cos(x * 0.5);
    const sx = Math.sin(x * 0.5);
    const cy = Math.cos(y * 0.5);
    const sy = Math.sin(y * 0.5);
    const cz = Math.cos(z * 0.5);
    const sz = Math.sin(z * 0.5);

    this.x = sx * cy * cz - cx * sy * sz;
    this.y = cx * sy * cz + sx * cy * sz;
    this.z = cx * cy * sz - sx * sy * cz;
    this.w = cx * cy * cz + sx * sy * sz;

    return this;
  }

  /**
   * Set from axis-angle rotation
   */
  setFromAxisAngle(axis: Vector3, angle: number): this {
    const halfAngle = angle * 0.5;
    const s = Math.sin(halfAngle);

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(halfAngle);

    return this;
  }

  /**
   * Set from unit vectors (from -> to)
   */
  setFromUnitVectors(from: Vector3, to: Vector3): this {
    const epsilon = 0.000001;
    let r = from.dot(to) + 1;

    if (r < epsilon) {
      r = 0;
      if (Math.abs(from.x) > Math.abs(from.z)) {
        this.x = -from.y;
        this.y = from.x;
        this.z = 0;
        this.w = r;
      } else {
        this.x = 0;
        this.y = -from.z;
        this.z = from.y;
        this.w = r;
      }
    } else {
      this.x = from.y * to.z - from.z * to.y;
      this.y = from.z * to.x - from.x * to.z;
      this.z = from.x * to.y - from.y * to.x;
      this.w = r;
    }

    return this.normalize();
  }

  /**
   * Multiply by another quaternion
   */
  multiply(q: Quaternion): this {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const w = this.w;

    const qx = q.x;
    const qy = q.y;
    const qz = q.z;
    const qw = q.w;

    this.x = x * qw + w * qx + y * qz - z * qy;
    this.y = y * qw + w * qy + z * qx - x * qz;
    this.z = z * qw + w * qz + x * qy - y * qx;
    this.w = w * qw - x * qx - y * qy - z * qz;

    return this;
  }

  /**
   * Normalize this quaternion
   */
  normalize(): this {
    const length = Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );

    if (length > 0) {
      const invLength = 1 / length;
      this.x *= invLength;
      this.y *= invLength;
      this.z *= invLength;
      this.w *= invLength;
    }

    return this;
  }

  /**
   * Get conjugate (inverse rotation)
   */
  conjugate(): this {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }

  /**
   * Get inverse quaternion
   */
  inverse(): this {
    return this.conjugate().normalize();
  }

  /**
   * Spherical linear interpolation with another quaternion
   */
  slerp(q: Quaternion, t: number): this {
    let x = this.x;
    let y = this.y;
    let z = this.z;
    let w = this.w;

    let cosHalfTheta = w * q.w + x * q.x + y * q.y + z * q.z;

    if (cosHalfTheta < 0) {
      this.w = -q.w;
      this.x = -q.x;
      this.y = -q.y;
      this.z = -q.z;
      cosHalfTheta = -cosHalfTheta;
    } else {
      this.copy(q);
    }

    if (cosHalfTheta >= 1.0) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
      return this;
    }

    const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    if (Math.abs(sinHalfTheta) < 0.001) {
      this.x = x * 0.5 + this.x * 0.5;
      this.y = y * 0.5 + this.y * 0.5;
      this.z = z * 0.5 + this.z * 0.5;
      this.w = w * 0.5 + this.w * 0.5;
      return this;
    }

    const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    this.x = x * ratioA + this.x * ratioB;
    this.y = y * ratioA + this.y * ratioB;
    this.z = z * ratioA + this.z * ratioB;
    this.w = w * ratioA + this.w * ratioB;

    return this;
  }

  /**
   * Check if quaternion equals another
   */
  equals(q: Quaternion): boolean {
    return this.x === q.x && this.y === q.y && this.z === q.z && this.w === q.w;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `Quaternion(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
  }

  /**
   * Static methods for common operations
   */
  static multiply(a: Quaternion, b: Quaternion): Quaternion {
    return new Quaternion(
      a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
      a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
      a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
      a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
    );
  }

  static slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    return a.clone().slerp(b, t);
  }

  static fromEuler(x: number, y: number, z: number): Quaternion {
    return new Quaternion().setFromEuler(x, y, z);
  }

  static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    return new Quaternion().setFromAxisAngle(axis, angle);
  }
}
