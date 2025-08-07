export class Vector3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }

  set(x: number, y: number, z: number): this {
    this.x = x; this.y = y; this.z = z; return this;
  }

  clone(): Vector3 { return new Vector3(this.x, this.y, this.z); }
  copy(v: Vector3): this { this.x = v.x; this.y = v.y; this.z = v.z; return this; }

  add(v: Vector3): this { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  addScalar(s: number): this { this.x += s; this.y += s; this.z += s; return this; }
  sub(v: Vector3): this { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
  multiplyScalar(s: number): this { this.x *= s; this.y *= s; this.z *= s; return this; }

  lengthSq(): number { return this.x * this.x + this.y * this.y + this.z * this.z; }
  length(): number { return Math.sqrt(this.lengthSq()); }
  normalize(): this {
    const len = this.length();
    if (len > 0) { this.multiplyScalar(1 / len); } else { this.set(0, 0, 0); }
    return this;
  }

  dot(v: Vector3): number { return this.x * v.x + this.y * v.y + this.z * v.z; }
  cross(v: Vector3): this {
    const x = this.y * v.z - this.z * v.y;
    const y = this.z * v.x - this.x * v.z;
    const z = this.x * v.y - this.y * v.x;
    this.x = x; this.y = y; this.z = z; return this;
  }

  equals(v: Vector3, epsilon = 1e-6): boolean {
    return (
      Math.abs(this.x - v.x) <= epsilon &&
      Math.abs(this.y - v.y) <= epsilon &&
      Math.abs(this.z - v.z) <= epsilon
    );
  }
}
