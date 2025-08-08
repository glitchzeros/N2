import type { World } from '@/engine/core/ecs/World';

export class AIDifficultyPanel {
  private container: HTMLElement | null = null;

  constructor(private world: World, private player: number) {}

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '12px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.padding = '8px 10px';
    el.style.background = 'rgba(10,10,16,0.4)';
    el.style.border = '1px solid #00f5d4';
    el.style.borderRadius = '6px';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Roboto Mono', monospace";
    el.style.fontSize = '12px';

    const mkSlider = (label: string, value: number, on: (v: number) => void) => {
      const wrap = document.createElement('label');
      wrap.style.marginRight = '12px';
      wrap.textContent = label + ' ';
      const input = document.createElement('input');
      input.type = 'range'; input.min = '1'; input.max = '60'; input.step = '1'; input.value = String(value);
      input.oninput = () => on(parseFloat(input.value));
      wrap.appendChild(input);
      return wrap;
    };

    const perception = mkSlider('AI Perception(m)', 25, (v) => {
      const bots = this.world.query(['AIState']);
      for (const e of bots) {
        const ai = this.world.get<{ perceptionRange: number }>(e, 'AIState');
        if (ai) { ai.perceptionRange = v; this.world.add(e, 'AIState', ai); }
      }
    });

    const firerate = mkSlider('FireRate', 8, (v) => {
      const ws = this.world.get<{ fireRate: number }>(this.player, 'WeaponState');
      if (ws) { ws.fireRate = v; this.world.add(this.player, 'WeaponState', ws); }
    });

    el.append(perception, firerate);
    parent.appendChild(el);
    this.container = el;
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}