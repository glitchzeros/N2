import { Game } from '@/game/Game';
import { registerServiceWorker } from '@/platform/web/ServiceWorkerRegistration';
import { OptionsPanel } from '@/ui/screens/Options';
import { InputOptionsPanel } from '@/ui/screens/InputOptions';
import { AudioOptionsPanel } from '@/ui/screens/AudioOptions';
import { AIDifficultyPanel } from '@/ui/screens/AIDifficulty';

export function bootstrap(): void {
  const app = document.getElementById('app');
  if (app) {
    const p = document.createElement('p');
    p.textContent = 'Booting Nexus Royale...';
    app.appendChild(p);
  }
  const game = new Game();
  game.start();
  registerServiceWorker();
  const options = new OptionsPanel();
  options.mount(document.body);
  const inputOptions = new InputOptionsPanel();
  inputOptions.mount(document.body);
  const audioOptions = new AudioOptionsPanel();
  audioOptions.mount(document.body);
  const aiPanel = new AIDifficultyPanel(game.world, game.playerId);
  aiPanel.mount(document.body);
}

if (typeof window !== 'undefined') {
  bootstrap();
}
