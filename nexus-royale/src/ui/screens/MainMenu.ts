import { PauseController } from '@/game/meta/PauseController';

export class MainMenu {
  private container: HTMLElement | null = null;

  constructor(private pause: PauseController) {}

  mount(parent: HTMLElement = document.body): void {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.display = 'grid';
    el.style.placeItems = 'center';
    el.style.background = 'rgba(10,10,16,0.7)';
    el.style.color = '#f0f0f0';
    el.style.fontFamily = "'Rajdhani', sans-serif";

    const card = document.createElement('div');
    card.style.padding = '20px 28px';
    card.style.border = '1px solid #00f5d4';
    card.style.borderRadius = '8px';
    card.style.background = '#1a1a2e';

    const title = document.createElement('div');
    title.textContent = 'Nexus Royale';
    title.style.fontSize = '28px';
    title.style.marginBottom = '12px';

    const play = document.createElement('button');
    play.textContent = 'Play';
    play.style.marginRight = '8px';

    const pause = document.createElement('button');
    pause.textContent = 'Pause';

    card.append(title, play, pause);
    el.appendChild(card);
    parent.appendChild(el);
    this.container = el;

    play.onclick = () => { this.pause.resume(); this.hide(); };
    pause.onclick = () => { this.pause.pause(); this.show(); };
  }

  show(): void { if (this.container) this.container.style.display = 'grid'; }
  hide(): void { if (this.container) this.container.style.display = 'none'; }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}