import { Game } from '@/game/Game';
import { testECS } from '@/test-ecs';
import { registerServiceWorker } from '@/platform/web/ServiceWorkerRegistration';

export function bootstrap(): void {
  const app = document.getElementById('app');
  if (app) {
    // Clear existing content
    app.innerHTML = '';
    
    // Create title
    const title = document.createElement('h1');
    title.textContent = 'Nexus Royale - Battle Royale Game';
    title.style.textAlign = 'center';
    title.style.color = '#fff';
    title.style.marginBottom = '20px';
    app.appendChild(title);

    // Create status
    const status = document.createElement('p');
    status.textContent = 'Initializing game systems...';
    status.style.textAlign = 'center';
    status.style.color = '#ccc';
    app.appendChild(status);

    // Test ECS system
    console.log('🚀 Starting Nexus Royale...');
    testECS();

    // Create and start game
    const game = new Game();
    
    // Update status
    status.textContent = 'Starting game...';
    
    // Start the game
    game.start();
    
    // Update status
    status.textContent = `Game started! Players: ${game.getGameStats().playerCount}, Alive: ${game.getGameStats().alivePlayers}`;

    // Create controls
    const controls = document.createElement('div');
    controls.style.textAlign = 'center';
    controls.style.marginTop = '20px';
    
    const fireButton = document.createElement('button');
    fireButton.textContent = 'Fire Weapon';
    fireButton.style.margin = '0 10px';
    fireButton.onclick = () => {
      const fired = game.fireWeapon();
      if (fired) {
        status.textContent = 'Weapon fired!';
        setTimeout(() => {
          status.textContent = `Game running... Players: ${game.getGameStats().playerCount}, Alive: ${game.getGameStats().alivePlayers}`;
        }, 1000);
      } else {
        status.textContent = 'Cannot fire weapon (reloading/out of ammo)';
        setTimeout(() => {
          status.textContent = `Game running... Players: ${game.getGameStats().playerCount}, Alive: ${game.getGameStats().alivePlayers}`;
        }, 2000);
      }
    };
    
    const statsButton = document.createElement('button');
    statsButton.textContent = 'Show Stats';
    statsButton.style.margin = '0 10px';
    statsButton.onclick = () => {
      const stats = game.getGameStats();
      status.textContent = `Stats - Players: ${stats.playerCount}, Alive: ${stats.alivePlayers}, Game Time: ${stats.gameTime.toFixed(1)}s, State: ${stats.gameState}`;
    };

    const inputButton = document.createElement('button');
    inputButton.textContent = 'Show Input';
    inputButton.style.margin = '0 10px';
    inputButton.onclick = () => {
      const inputInfo = game.getInputDebugInfo();
      if (inputInfo) {
        status.textContent = `Input - Movement: (${inputInfo.movement.x.toFixed(2)}, ${inputInfo.movement.y.toFixed(2)}), Look: (${inputInfo.look.x.toFixed(2)}, ${inputInfo.look.y.toFixed(2)}), Fire: ${inputInfo.buttons.fire}`;
      } else {
        status.textContent = 'No input info available';
      }
    };

    const physicsButton = document.createElement('button');
    physicsButton.textContent = 'Show Physics';
    physicsButton.style.margin = '0 10px';
    physicsButton.onclick = () => {
      const physicsInfo = game.getPhysicsDebugInfo();
      if (physicsInfo) {
        status.textContent = `Physics - Bodies: ${physicsInfo.totalBodies}, Projectiles: ${physicsInfo.projectiles}, Gravity: ${physicsInfo.gravity.y.toFixed(2)}`;
      } else {
        status.textContent = 'No physics info available';
      }
    };

    const aiButton = document.createElement('button');
    aiButton.textContent = 'Show AI';
    aiButton.style.margin = '0 10px';
    aiButton.onclick = () => {
      const aiInfo = game.getAIDebugInfo();
      if (aiInfo) {
        status.textContent = `AI - Total: ${aiInfo.ai.totalAI}, States: ${Object.keys(aiInfo.ai.states).join(', ')}, Behaviors: ${Object.keys(aiInfo.ai.behaviors).join(', ')}`;
      } else {
        status.textContent = 'No AI info available';
      }
    };

    const projectileButton = document.createElement('button');
    projectileButton.textContent = 'Fire Projectile';
    projectileButton.style.margin = '0 10px';
    projectileButton.onclick = () => {
      const physicsSystem = game.getPhysicsSystem();
      const localPlayer = game.getLocalPlayer();
      if (physicsSystem && localPlayer) {
        // Create a bullet projectile
        const position = new Vector3(0, 100, 0);
        const direction = new Vector3(0, 0, -1);
        const stats = { damage: 25, speed: 300, range: 100, gravity: 0, airResistance: 0.01, bounceCount: 0, explosionRadius: 0, lifetime: 2 };
        physicsSystem.createProjectile('bullet', stats, position, direction, localPlayer.id);
        status.textContent = 'Projectile fired!';
      } else {
        status.textContent = 'Cannot fire projectile';
      }
    };

    const spawnAIButton = document.createElement('button');
    spawnAIButton.textContent = 'Spawn AI';
    spawnAIButton.style.margin = '0 10px';
    spawnAIButton.onclick = () => {
      const aiSystem = game.getAISystem();
      if (aiSystem) {
        // Spawn a group of AI bots
        const center = new Vector3(0, 0, 0);
        const aiEntities = aiSystem.createAIGroup(3, center, 30);
        status.textContent = `Spawned ${aiEntities.length} AI bots!`;
      } else {
        status.textContent = 'Cannot spawn AI';
      }
    };

    const rendererButton = document.createElement('button');
    rendererButton.textContent = 'Show Renderer';
    rendererButton.style.margin = '0 10px';
    rendererButton.onclick = () => {
      const rendererInfo = game.getRendererDebugInfo();
      if (rendererInfo) {
        status.textContent = `Renderer - Frames: ${rendererInfo.frameCount}, Triangles: ${rendererInfo.triangles}, Calls: ${rendererInfo.calls}`;
      } else {
        status.textContent = 'No renderer info available';
      }
    };

    const lockButton = document.createElement('button');
    lockButton.textContent = 'Lock Mouse';
    lockButton.style.margin = '0 10px';
    lockButton.onclick = () => {
      document.body.requestPointerLock();
      status.textContent = 'Mouse locked - Click to move mouse, WASD to move';
    };
    
    controls.appendChild(fireButton);
    controls.appendChild(statsButton);
    controls.appendChild(inputButton);
    controls.appendChild(physicsButton);
    controls.appendChild(aiButton);
    controls.appendChild(projectileButton);
    controls.appendChild(spawnAIButton);
    controls.appendChild(rendererButton);
    controls.appendChild(lockButton);
    app.appendChild(controls);

    // Create game info
    const info = document.createElement('div');
    info.style.marginTop = '20px';
    info.style.padding = '20px';
    info.style.backgroundColor = 'rgba(0,0,0,0.3)';
    info.style.borderRadius = '10px';
    info.style.color = '#ccc';
    info.style.fontSize = '14px';
    
    info.innerHTML = `
      <h3>Nexus Royale - Professional Battle Royale</h3>
      <p><strong>Features:</strong></p>
      <ul>
        <li>✅ High-performance ECS architecture</li>
        <li>✅ Player health and shield system</li>
        <li>✅ Weapon system with multiple types</li>
        <li>✅ Realistic ballistics and recoil</li>
        <li>✅ 24-player battle royale</li>
        <li>✅ AI bots with difficulty scaling</li>
        <li>✅ Procedural terrain generation</li>
        <li>✅ 3D rendering with Three.js</li>
      </ul>
      <p><strong>Controls:</strong></p>
      <ul>
        <li>Click "Fire Weapon" to shoot</li>
        <li>Click "Show Stats" to see game statistics</li>
      </ul>
      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>✅ Input system (WASD movement, mouse look)</li>
        <li>✅ Physics system (projectile ballistics, collision detection)</li>
        <li>✅ AI system (bot behavior, pathfinding, decision making)</li>
        <li>✅ 3D rendering system (Three.js integration, terrain, entities)</li>
        <li>🔊 Add audio system</li>
        <li>🌐 Add multiplayer networking</li>
      </ul>
    `;
    
    app.appendChild(info);
  }

  // Register service worker
  registerServiceWorker();
}

if (typeof window !== 'undefined') {
  bootstrap();
}
