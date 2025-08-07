import { Game } from '@/game/Game';
import { registerServiceWorker } from '@/platform/web/ServiceWorkerRegistration';
import { OptionsPanel } from '@/ui/screens/Options';

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
}

if (typeof window !== 'undefined') {
  bootstrap();
}
