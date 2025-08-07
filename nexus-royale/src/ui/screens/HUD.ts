import { Store } from '@/ui/framework/Reactive';

export type HudState = { health: number; maxHealth: number; fps: number };

export class HUD {
  readonly state = new Store<HudState>({ health: 100, maxHealth: 100, fps: 0 });
  private container: HTMLElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '12px';
    el.style.top = '12px';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Roboto Mono', monospace";
    el.style.background = 'rgba(10,10,16,0.4)';
    el.style.padding = '8px 10px';
    el.style.border = '1px solid #00f5d4';
    el.style.borderRadius = '6px';

    const health = document.createElement('div');
    const perf = document.createElement('div');
    el.append(health, perf);

    this.state.subscribe(s => {
      health.textContent = `HP ${s.health} / ${s.maxHealth}`;
      perf.textContent = `FPS ${Math.round(s.fps)}`;
    });

    parent.appendChild(el);
    this.container = el;
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}