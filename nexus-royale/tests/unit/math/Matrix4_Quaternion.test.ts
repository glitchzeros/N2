import { Matrix4 } from '@/engine/core/math/Matrix4';
import { Quaternion } from '@/engine/core/math/Quaternion';
import { Vector3 } from '@/engine/core/math/Vector3';

describe('Matrix4 & Quaternion', () => {
  test('identity and clone/copy/set', () => {
    const m = new Matrix4();
    const c = m.clone();
    expect(c.elements).not.toBe(m.elements);
    const d = new Matrix4().set(
      1,2,3,4,
      5,6,7,8,
      9,10,11,12,
      13,14,15,16
    );
    const e = new Matrix4().copy(d);
    expect(e.elements).toEqual(d.elements);
    expect(new Matrix4().identity().elements).toEqual(new Matrix4().elements);
  });

  test('multiply matrices', () => {
    const a = new Matrix4().makeTranslation(1,2,3);
    const b = new Matrix4().makeScale(2,2,2);
    const ab = a.clone().multiply(b);
    expect(ab.elements[12]).toBe(1);
    expect(ab.elements[13]).toBe(2);
    expect(ab.elements[14]).toBe(3);
    expect(ab.elements[0]).toBe(2);
    expect(ab.elements[5]).toBe(2);
    expect(ab.elements[10]).toBe(2);
  });

  test('compose from TRS', () => {
    const t = new Vector3(1,2,3);
    const r = new Quaternion().setFromAxisAngle(new Vector3(0,0,1), Math.PI/2);
    const s = new Vector3(2,2,2);
    const m = new Matrix4().compose(t, r, s);

    const ex = [m.elements[0], m.elements[1], m.elements[2]];
    const ey = [m.elements[4], m.elements[5], m.elements[6]];

    expect(Math.abs(ex[0]) < 1e-6 && Math.abs(ex[1] - 2) < 1e-6).toBe(true);
    expect(Math.abs(ey[0] + 2) < 1e-6 && Math.abs(ey[1]) < 1e-6).toBe(true);

    expect(m.elements[12]).toBeCloseTo(1);
    expect(m.elements[13]).toBeCloseTo(2);
    expect(m.elements[14]).toBeCloseTo(3);
  });

  test('quaternion multiply, normalize, euler and conjugate', () => {
    const q1 = new Quaternion().setFromAxisAngle(new Vector3(1,0,0), Math.PI/2);
    const q2 = new Quaternion().setFromEuler(0, Math.PI/2, 0, 'XYZ');
    const qm = q1.clone().multiply(q2);
    expect(Math.hypot(qm.x, qm.y, qm.z, qm.w)).toBeCloseTo(1, 6);

    const qn = new Quaternion(0,0,0,0).normalize();
    expect(qn.w).toBe(1);

    const qc = q1.clone().conjugate();
    expect(qc.x).toBeCloseTo(-q1.x);
    expect(qc.y).toBeCloseTo(-q1.y);
    expect(qc.z).toBeCloseTo(-q1.z);
  });
});
