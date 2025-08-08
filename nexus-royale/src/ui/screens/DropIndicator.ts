import type { World } from '@/engine/core/ecs/World';

export class DropIndicator {
  private container: HTMLElement | null = null;

  constructor(private world: World, private player: number) {}

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '20%';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.padding = '10px 14px';
    el.style.background = 'rgba(26,26,46,0.7)';
    el.style.border = '1px solid #00f5d4';
    el.style.borderRadius = '6px';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Rajdhani', sans-serif";
    el.style.fontSize = '18px';
    el.style.display = 'none';
    parent.appendChild(el);
    this.container = el;
  }

  update(): void {
    if (!this.container) return;
    const s = this.world.get<{ phase: string; timer: number }>(this.player, 'SpawnState');
    if (!s || s.phase === 'active') { this.container.style.display = 'none'; return; }
    this.container.style.display = 'block';
    const label = s.phase === 'queued' ? 'Queued' : `Dropping: ${Math.max(0, s.timer).toFixed(1)}s`;
    this.container.textContent = label;
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}