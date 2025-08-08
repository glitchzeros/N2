import { eventBus } from '@/engine/core/events/EventBus';

export class HitMarker {
  private el: HTMLElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.border = '2px solid #00f5d4';
    el.style.opacity = '0';
    el.style.transition = 'opacity 60ms ease-out';
    parent.appendChild(el);
    this.el = el;

    eventBus.on('hit', () => {
      if (!this.el) return;
      this.el.style.opacity = '1';
      setTimeout(() => { if (this.el) this.el.style.opacity = '0'; }, 80);
    });
  }

  unmount(): void {
    if (this.el?.parentElement) this.el.parentElement.removeChild(this.el);
    this.el = null;
  }
}