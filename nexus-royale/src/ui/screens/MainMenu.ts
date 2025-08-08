import { PauseController } from '@/game/meta/PauseController';
import { setTerrainSeed, getTerrainSeed } from '@/config/experience/Settings';
import { CreditsOverlay } from '@/ui/screens/Credits';

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

    const seedWrap = document.createElement('label');
    seedWrap.style.display = 'block';
    seedWrap.style.marginBottom = '8px';
    seedWrap.textContent = 'Terrain Seed ';
    const seedInput = document.createElement('input');
    seedInput.type = 'number';
    seedInput.value = String(getTerrainSeed());
    seedInput.style.marginLeft = '6px';
    seedWrap.appendChild(seedInput);

    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '8px';

    const play = document.createElement('button');
    play.textContent = 'Play';

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause';

    const credits = document.createElement('button');
    credits.textContent = 'Credits';

    const quit = document.createElement('button');
    quit.textContent = 'Quit';

    buttons.append(play, pauseBtn, credits, quit);
    card.append(title, seedWrap, buttons);
    el.appendChild(card);
    parent.appendChild(el);
    this.container = el;

    play.onclick = () => { setTerrainSeed(parseInt(seedInput.value) || 1); this.pause.resume(); this.hide(); };
    pauseBtn.onclick = () => { this.pause.pause(); this.show(); };
    credits.onclick = () => { new CreditsOverlay().mount(document.body); };
    quit.onclick = () => { if (typeof window !== 'undefined') window.location.reload(); };
  }

  show(): void { if (this.container) this.container.style.display = 'grid'; }
  hide(): void { if (this.container) this.container.style.display = 'none'; }

  unmount(): void {
    if (this.container?.parentElement) this.container.parentElement.removeChild(this.container);
    this.container = null;
  }
}