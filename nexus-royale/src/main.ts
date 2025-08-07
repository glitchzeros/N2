import { Game } from '@/game/Game';

export function bootstrap(): void {
  const app = document.getElementById('app');
  if (app) {
    const p = document.createElement('p');
    p.textContent = 'Booting Nexus Royale...';
    app.appendChild(p);
  }
  const game = new Game();
  game.start();
}

if (typeof window !== 'undefined') {
  bootstrap();
}
