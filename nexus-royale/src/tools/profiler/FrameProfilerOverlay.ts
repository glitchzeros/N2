export class FrameProfilerOverlay {
  private el: HTMLElement | null = null;
  private last = performance.now();
  private frames = 0;
  private fps = 0;

  mount(parent: HTMLElement = document.body): void {
    const d = document.createElement('div');
    d.style.position = 'fixed';
    d.style.right = '12px';
    d.style.top = '12px';
    d.style.color = '#00f5d4';
    d.style.fontFamily = "'Roboto Mono', monospace";
    d.style.fontSize = '12px';
    d.style.background = 'rgba(10,10,16,0.3)';
    d.style.padding = '6px 8px';
    d.style.border = '1px solid #00f5d4';
    d.style.borderRadius = '6px';
    parent.appendChild(d);
    this.el = d;
  }

  tick(): number {
    const now = performance.now();
    this.frames++;
    if (now - this.last >= 1000) {
      this.fps = this.frames * 1000 / (now - this.last);
      this.frames = 0;
      this.last = now;
      if (this.el) this.el.textContent = `FPS ${Math.round(this.fps)}`;
    }
    return this.fps;
  }

  unmount(): void {
    if (this.el?.parentElement) this.el.parentElement.removeChild(this.el);
    this.el = null;
  }
}