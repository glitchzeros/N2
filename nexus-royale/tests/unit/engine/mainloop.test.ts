import { MainLoop } from '@/engine/MainLoop';

describe('MainLoop', () => {
  test('fixed update runs correct number of steps and render interpolates', () => {
    const updates: number[] = [];
    const renders: number[] = [];
    const loop = new MainLoop({
      update: (dt) => { updates.push(dt); },
      render: (alpha) => { renders.push(alpha); },
      fixedDeltaSeconds: 1 / 60
    });

    // simulate 1.5 fixed frames worth of time
    loop.frame(1 / 60);
    loop.frame(1 / 120);

    // Should have executed one full fixed update
    expect(updates.length).toBe(1);
    expect(updates[0]).toBeCloseTo(1 / 60);
    // Last render alpha should be ~0.5 (half leftover)
    expect(renders.at(-1)!).toBeCloseTo(0.5, 2);
  });
});