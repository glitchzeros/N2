import { World } from '@/engine/core/ecs/World';
import { Scheduler } from '@/engine/core/ecs/Scheduler';
import { Renderer } from '@/engine/renderer/Renderer';
import { MainLoop } from '@/engine/MainLoop';
import { registerGameComponents } from '@/game/components';
import { createPlayer } from '@/game/prefabs/Player';
import { createInputSystem } from '@/game/systems/InputSystem';
import { CharacterControllerSystem } from '@/game/systems/CharacterControllerSystem';
import { MovementSystem } from '@/game/systems/MovementSystem';
import { input } from '@/platform/web/Input';
import { generateFlatShadedGrid } from '@/game/environment/terrain/TerrainGenerator';
import { buildTerrainMesh } from '@/game/environment/terrain/TerrainMeshThree';
import { createCameraSystem } from '@/game/systems/CameraSystem';
import { HUD } from '@/ui/screens/HUD';
import { FrameProfilerOverlay } from '@/tools/profiler/FrameProfilerOverlay';
import { createSpawnSystem } from '@/game/systems/SpawnSystem';
import { createWeaponSystem } from '@/game/systems/WeaponSystem';
import { KillFeed } from '@/ui/components/KillFeed';
import { DamageNumbers } from '@/ui/components/DamageNumbers';
import { createPerceptionSystem } from '@/game/ai/perception/Perception';
import { createAISystem } from '@/game/systems/AISystem';
import { initRUM } from '@/config/monitoring/rum-client';
import { initErrorTracking } from '@/config/monitoring/error-tracking';

export class Game {
  readonly world = new World();
  readonly renderer = new Renderer();
  readonly scheduler: Scheduler;
  private readonly loop: MainLoop;
  private playerEntity: number = -1;
  private readonly hud = new HUD();
  private readonly profiler = new FrameProfilerOverlay();
  private readonly killFeed = new KillFeed();
  private readonly damageNumbers = new DamageNumbers();

  constructor() {
    registerGameComponents(this.world);
    this.scheduler = new Scheduler({ world: this.world });

    // Entities and systems
    this.playerEntity = createPlayer(this.world);
    this.scheduler.add(createSpawnSystem(5));
    const inputSystem = createInputSystem(this.playerEntity, () => input.snapshot());
    this.scheduler.add(inputSystem);
    this.scheduler.add(createWeaponSystem(this.playerEntity));
    this.scheduler.add(createPerceptionSystem());
    this.scheduler.add(createAISystem());
    this.scheduler.add(CharacterControllerSystem);
    this.scheduler.add(MovementSystem);

    // Renderer
    this.renderer.init();

    // Terrain mesh
    const data = generateFlatShadedGrid(64, 64, 1);
    const mesh = buildTerrainMesh(data);
    this.renderer.getScene().add(mesh);

    // Camera follow
    this.scheduler.add(createCameraSystem(this.playerEntity, this.renderer));

    // Loop
    this.loop = new MainLoop({
      update: (dt) => this.scheduler.update(dt),
      render: () => {
        const fps = this.profiler.tick();
        const health = this.world.get<{ hp: number; max: number }>(this.playerEntity, 'Health');
        if (health) this.hud.state.set({ health: health.hp, maxHealth: health.max, fps });
        this.renderer.render();
      },
      fixedDeltaSeconds: 1 / 60
    });
  }

  start(): void {
    if (typeof window !== 'undefined') {
      input.attach(window);
      this.hud.mount(document.body);
      this.profiler.mount(document.body);
      this.killFeed.mount(document.body);
      this.damageNumbers.mount(document.body);
      initErrorTracking();
      initRUM();
    }
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    if (typeof window !== 'undefined') {
      input.detach(window);
      this.hud.unmount();
      this.profiler.unmount();
      this.killFeed.unmount();
      this.damageNumbers.unmount();
    }
    this.renderer.dispose();
  }
}