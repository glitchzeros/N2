import { LodController } from '@/engine/renderer/lod/LodController';

describe('LodController', () => {
  test('returns higher LOD values with distance and slow frames', () => {
    const lod = new LodController();
    expect(lod.computeLod(5, 10)).toBeLessThanOrEqual(1);
    expect(lod.computeLod(60, 10)).toBeGreaterThanOrEqual(2);
    // slow frame -> bump LOD
    const nearSlow = lod.computeLod(5, 40);
    const farSlow = lod.computeLod(60, 40);
    expect(nearSlow).toBeGreaterThanOrEqual(0);
    expect(farSlow).toBeGreaterThanOrEqual(2);
  });
});