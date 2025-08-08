export class CreditsOverlay {
  private container: HTMLElement | null = null;

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.display = 'grid';
    el.style.placeItems = 'center';
    el.style.background = 'rgba(10,10,16,0.85)';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Rajdhani', sans-serif";

    const card = document.createElement('div');
    card.style.padding = '20px 28px';
    card.style.border = '1px solid #00f5d4';
    card.style.borderRadius = '8px';
    card.style.background = '#1a1a2e';
    card.style.maxWidth = '520px';

    const title = document.createElement('div');
    title.textContent = 'Credits';
    title.style.fontSize = '24px';
    title.style.marginBottom = '8px';

    const body = document.createElement('div');
    body.style.fontFamily = "'Roboto Mono', monospace";
    body.style.fontSize = '12px';
    body.style.lineHeight = '1.5';
    body.innerHTML = `Design & Engineering: Autonomous AI Agent<br/>Tech: TypeScript, Three.js, ECS, WebAudio, WebSocket stubs`;

    const close = document.createElement('button');
    close.textContent = 'Close';
    close.style.marginTop = '12px';

    card.append(title, body, close);
    el.appendChild(card);
    parent.appendChild(el);
    this.container = el;

    close.onclick = () => this.unmount();
  }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}