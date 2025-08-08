import { eventBus } from '@/engine/core/events/EventBus';

export class DamageNumbers {
  private container: HTMLElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.pointerEvents = 'none';
    parent.appendChild(el);
    this.container = el;

    eventBus.on('hit', (msg: { target: number; amount: number }) => {
      if (!this.container) return;
      const n = document.createElement('div');
      n.textContent = `${msg.amount}`;
      n.style.position = 'absolute';
      n.style.transform = `translate(${(Math.random()-0.5)*60}px, ${(Math.random()-0.5)*-40}px)`;
      n.style.color = '#e94560';
      n.style.fontFamily = "'Rajdhani', sans-serif";
      n.style.fontWeight = '700';
      n.style.textShadow = '0 0 6px rgba(233,69,96,0.7)';
      this.container.appendChild(n);
      setTimeout(() => { if (n.parentElement) n.parentElement.removeChild(n); }, 600);
    });
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}