import { eventBus } from '@/engine/core/events/EventBus';

export class KillFeed {
  private container: HTMLElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '12px';
    el.style.right = '12px';
    el.style.display = 'flex';
    el.style.flexDirection = 'column-reverse';
    el.style.gap = '6px';
    parent.appendChild(el);
    this.container = el;

    eventBus.on('kill', (msg: { killer: number; victim: number }) => {
      if (!this.container) return;
      const row = document.createElement('div');
      row.textContent = `E${msg.killer} eliminated E${msg.victim}`;
      row.style.color = '#f0f0f0';
      row.style.fontFamily = "'Roboto Mono', monospace";
      row.style.background = 'rgba(26,26,46,0.6)';
      row.style.padding = '4px 6px';
      row.style.border = '1px solid #e94560';
      row.style.borderRadius = '4px';
      this.container.appendChild(row);
      setTimeout(() => { if (row.parentElement) row.parentElement.removeChild(row); }, 4000);
    });
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}