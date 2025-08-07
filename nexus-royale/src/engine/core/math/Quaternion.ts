import { Vector3 } from './Vector3';

export class Quaternion {
  x: number; y: number; z: number; w: number;

  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x; this.y = y; this.z = z; this.w = w;
  }

  set(x: number, y: number, z: number, w: number): this {
    this.x = x; this.y = y; this.z = z; this.w = w; return this;
  }

  clone(): Quaternion { return new Quaternion(this.x, this.y, this.z, this.w); }
  copy(q: Quaternion): this { this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w; return this; }

  identity(): this { this.set(0, 0, 0, 1); return this; }

  normalize(): this {
    const len = Math.hypot(this.x, this.y, this.z, this.w);
    if (len === 0) { this.x = 0; this.y = 0; this.z = 0; this.w = 1; }
    else { const inv = 1 / len; this.x *= inv; this.y *= inv; this.z *= inv; this.w *= inv; }
    return this;
  }

  multiply(q: Quaternion): this { return this.multiplyQuaternions(this, q); }

  multiplyQuaternions(a: Quaternion, b: Quaternion): this {
    const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
    return this;
  }

  setFromAxisAngle(axis: Vector3, angle: number): this {
    const half = angle * 0.5; const s = Math.sin(half);
    const ax = axis.clone().normalize();
    this.x = ax.x * s; this.y = ax.y * s; this.z = ax.z * s; this.w = Math.cos(half);
    return this;
  }

  setFromEuler(x: number, y: number, z: number, order: 'XYZ' | 'YXZ' | 'ZXY' | 'ZYX' | 'YZX' | 'XZY' = 'XYZ'): this {
    const c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2);

    switch (order) {
      case 'XYZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'YXZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      default:
        return this.setFromEuler(x, y, z, 'XYZ');
    }
    return this.normalize();
  }

  conjugate(): this { this.x *= -1; this.y *= -1; this.z *= -1; return this; }
}
