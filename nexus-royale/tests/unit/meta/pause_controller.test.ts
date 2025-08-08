import { PauseController } from '@/game/meta/PauseController';

describe('PauseController', () => {
  test('initial state and toggle', () => {
    const p = new PauseController();
    expect(p.isPaused()).toBe(false);
    p.toggle();
    expect(p.isPaused()).toBe(true);
    p.toggle();
    expect(p.isPaused()).toBe(false);
  });

  test('pause and resume', () => {
    const p = new PauseController();
    p.pause();
    expect(p.isPaused()).toBe(true);
    p.resume();
    expect(p.isPaused()).toBe(false);
  });
});