import { SpatialHash } from '@/engine/physics/broadphase/SpatialHash';

describe('SpatialHash', () => {
  test('insert and query returns expected entities', () => {
    const h = new SpatialHash(1);
    h.insert(1, { minX: 0, minY: 0, minZ: 0, maxX: 0.5, maxY: 0.5, maxZ: 0.5 });
    h.insert(2, { minX: 2, minY: 0, minZ: 0, maxX: 2.5, maxY: 0.5, maxZ: 0.5 });

    const near = h.query({ minX: -0.1, minY: -0.1, minZ: -0.1, maxX: 1, maxY: 1, maxZ: 1 });
    expect(near.sort()).toEqual([1].sort());

    const far = h.query({ minX: 2, minY: -1, minZ: -1, maxX: 3, maxY: 1, maxZ: 1 });
    expect(far.sort()).toEqual([2].sort());
  });

  test('remove cleans up entity keys', () => {
    const h = new SpatialHash(1);
    h.insert(1, { minX: 0, minY: 0, minZ: 0, maxX: 0.5, maxY: 0.5, maxZ: 0.5 });
    expect(h.query({ minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 })).toContain(1);
    h.remove(1);
    expect(h.query({ minX: 0, minY: 0, minZ: 0, maxX: 1, maxY: 1, maxZ: 1 })).not.toContain(1);
  });
});