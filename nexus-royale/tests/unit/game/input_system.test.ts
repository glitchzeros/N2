import { World } from '@/engine/core/ecs/World';
import { MapComponentStore } from '@/engine/core/ecs/Component';
import { createInputSystem } from '@/game/systems/InputSystem';
import type { SystemContext } from '@/engine/core/ecs/System';

describe('InputSystem', () => {
  test('provider snapshot is written to InputState', () => {
    const world = new World();
    const InputState = new MapComponentStore<{ moveX: number; moveY: number; lookX: number; lookY: number; fire: boolean }>('InputState');
    world.registerComponent('InputState', InputState);

    const player = world.createEntity();
    world.add(player, 'InputState', { moveX: 0, moveY: 0, lookX: 0, lookY: 0, fire: false });

    const system = createInputSystem(player, () => ({ moveX: 1, moveY: -1, lookDeltaX: 0.2, lookDeltaY: -0.1, fire: true }));
    const ctx: SystemContext = { world };
    system.update(ctx, 1/60);

    const st = world.get(player, 'InputState')!;
    expect(st.moveX).toBe(1);
    expect(st.moveY).toBe(-1);
    expect(st.lookX).toBeCloseTo(0.2);
    expect(st.lookY).toBeCloseTo(-0.1);
    expect(st.fire).toBe(true);
  });
});