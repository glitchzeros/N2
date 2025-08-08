import { Vector3 } from '@/engine/core/math/Vector3';
import { Matrix4 } from '@/engine/core/math/Matrix4';

describe('Vector3', () => {
  test('constructs and sets values', () => {
    const v = new Vector3(1, 2, 3);
    expect(v.x).toBe(1); expect(v.y).toBe(2); expect(v.z).toBe(3);
    v.set(4,5,6);
    expect(v.x).toBe(4); expect(v.y).toBe(5); expect(v.z).toBe(6);
  });

  test('clone and copy', () => {
    const v = new Vector3(1,2,3);
    const c = v.clone();
    expect(c).not.toBe(v);
    expect(c.x).toBe(1); expect(c.y).toBe(2); expect(c.z).toBe(3);
    const d = new Vector3().copy(v);
    expect(d.x).toBe(1); expect(d.y).toBe(2); expect(d.z).toBe(3);
  });

  test('add, sub, scalar ops', () => {
    const a = new Vector3(1,2,3);
    const b = new Vector3(4,5,6);
    a.add(b);
    expect(a.equals(new Vector3(5,7,9))).toBe(true);
    a.sub(b);
    expect(a.equals(new Vector3(1,2,3))).toBe(true);
    a.addScalar(2);
    expect(a.equals(new Vector3(3,4,5))).toBe(true);
    a.multiplyScalar(2);
    expect(a.equals(new Vector3(6,8,10))).toBe(true);
  });

  test('length, normalize, dot, cross', () => {
    const v = new Vector3(3,0,4);
    expect(v.lengthSq()).toBe(25);
    expect(v.length()).toBe(5);
    v.normalize();
    expect(Math.abs(v.length() - 1)).toBeLessThanOrEqual(1e-6);

    const a = new Vector3(1,0,0);
    const b = new Vector3(0,1,0);
    expect(a.dot(b)).toBe(0);
    a.cross(b);
    expect(a.equals(new Vector3(0,0,1))).toBe(true);
  });

  test('apply matrix translation and rotation', () => {
    const v = new Vector3(1,0,0);
    const m = new Matrix4().makeRotationZ(Math.PI/2).multiply(new Matrix4().makeTranslation(0, 2, 0));
    const r = v.clone();
    const e = m.elements;
    const x = v.x, y = v.y, z = v.z;
    const rx = e[0]*x + e[4]*y + e[8]*z + e[12];
    const ry = e[1]*x + e[5]*y + e[9]*z + e[13];
    const rz = e[2]*x + e[6]*y + e[10]*z + e[14];
    r.set(rx, ry, rz);
    expect(r.equals(new Vector3(0,3,0))).toBe(true);
  });

  test('equals with epsilon', () => {
    const a = new Vector3(1,1,1);
    const b = new Vector3(1+1e-7, 1-1e-7, 1+5e-7);
    expect(a.equals(b, 1e-6)).toBe(true);
    expect(a.equals(new Vector3(1.001,1,1))).toBe(false);
  });
});
