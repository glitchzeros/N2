export class ErrorBoundary {
  private container: HTMLElement | null = null;

  wrapRender(render: () => void): void {
    try { render(); }
    catch (e) { this.showError(e as Error); }
  }

  showError(err: Error): void {
    if (this.container) return;
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.bottom = '12px';
    el.style.right = '12px';
    el.style.padding = '8px 10px';
    el.style.background = 'rgba(233,69,96,0.2)';
    el.style.border = '1px solid #e94560';
    el.style.borderRadius = '6px';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Roboto Mono', monospace";
    el.style.fontSize = '12px';
    el.textContent = `UI Error: ${err.message}`;
    document.body.appendChild(el);
    this.container = el;
  }

  clear(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}