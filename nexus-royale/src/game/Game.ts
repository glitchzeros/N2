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
import { createScreenShakeSystem } from '@/game/systems/ScreenShakeSystem';
import { HitMarker } from '@/ui/components/HitMarker';
import { createHealthRegenSystem } from '@/game/systems/HealthRegenSystem';
import { initTelemetry } from '@/game/meta/analytics/Telemetry';
import { createVisibilitySystem } from '@/game/systems/VisibilitySystem';
import * as THREE from 'three';
import { createSingleChunk } from '@/game/environment/terrain/LodTerrain';
import { createTerrainLodSystem } from '@/game/systems/TerrainLodSystem';
import { createMuzzleFlashSystem } from '@/game/systems/MuzzleFlashSystem';
import { getFlag, getString } from '@/config/build/featureFlags';
import { PauseController } from '@/game/meta/PauseController';
import { MainMenu } from '@/ui/screens/MainMenu';
import { createSpawnPhaseSystem } from '@/game/systems/SpawnPhaseSystem';
import { DropIndicator } from '@/ui/screens/DropIndicator';
import { getTerrainSeed } from '@/config/experience/Settings';
import { createGravitySystem } from '@/engine/physics/dynamics/GravitySystem';

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
  private readonly hitMarker = new HitMarker();
  private readonly pause = new PauseController();
  private readonly menu = new MainMenu(this.pause);
  private lastRenderMs = 16.67;
  private readonly dropIndicator = new DropIndicator(this.world, this.playerEntity);

  private keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (this.pause.isPaused()) { this.pause.resume(); this.menu.hide(); }
      else { this.pause.pause(); this.menu.show(); }
    }
  };

  constructor() {
    const noVfx = getFlag('noVFX', false);
    const noHud = getFlag('noHUD', false);
    const botCount = Number.parseInt(getString('bots', '5')) || 5;

    registerGameComponents(this.world);
    this.scheduler = new Scheduler({ world: this.world });

    // Entities and systems
    this.playerEntity = createPlayer(this.world);
    this.scheduler.add(createSpawnSystem(botCount));
    const inputSystem = createInputSystem(this.playerEntity, () => input.snapshot());
    this.scheduler.add(inputSystem);
    this.scheduler.add(createWeaponSystem(this.playerEntity));
    this.scheduler.add(createPerceptionSystem());
    this.scheduler.add(createAISystem());
    this.scheduler.add(CharacterControllerSystem);
    this.scheduler.add(MovementSystem);
    this.scheduler.add(createGravitySystem());
    this.scheduler.add(createHealthRegenSystem());
    this.scheduler.add(createSpawnPhaseSystem());

    // Renderer
    this.renderer.init();

    // Terrain mesh
    const data = generateFlatShadedGrid(64, 64, 1, getTerrainSeed());
    const mesh = buildTerrainMesh(data);
    this.renderer.getScene().add(mesh);

    // Visibility and LOD for terrain
    const center = new THREE.Vector3((data.width * data.scale) / 2, 0, (data.depth * data.scale) / 2);
    const radius = Math.hypot(center.x, center.z);
    this.scheduler.add(createVisibilitySystem(this.renderer, [{ mesh, center, radius }]));
    const chunk = createSingleChunk(mesh, data.width, data.depth, data.scale);
    this.scheduler.add(createTerrainLodSystem(this.renderer, [chunk], () => this.lastRenderMs));

    // Camera + optional VFX
    this.scheduler.add(createCameraSystem(this.playerEntity, this.renderer));
    if (!noVfx) {
      this.scheduler.add(createScreenShakeSystem(this.renderer));
      this.scheduler.add(createMuzzleFlashSystem(this.renderer));
    }

    // Loop
    this.loop = new MainLoop({
      update: (dt) => { if (!this.pause.isPaused()) this.scheduler.update(dt); },
      render: () => {
        const t0 = performance.now();
        const fps = this.profiler.tick();
        const health = this.world.get<{ hp: number; max: number }>(this.playerEntity, 'Health');
        if (health && !noHud) this.hud.state.set({ health: Math.round(health.hp), maxHealth: health.max, fps });
        this.dropIndicator.update();
        this.renderer.render();
        const t1 = performance.now();
        this.lastRenderMs = Math.max(1, t1 - t0);
      },
      fixedDeltaSeconds: 1 / 60
    });

    // Mount UI conditionally
    if (typeof window !== 'undefined' && !noHud) {
      this.hud.mount(document.body);
      this.profiler.mount(document.body);
      this.killFeed.mount(document.body);
      this.damageNumbers.mount(document.body);
      this.hitMarker.mount(document.body);
      this.dropIndicator.mount(document.body);
    }

    // Menu starts visible (paused)
    this.pause.pause();
    if (typeof window !== 'undefined') this.menu.mount(document.body);
  }

  start(): void {
    if (typeof window !== 'undefined') {
      input.attach(window);
      initErrorTracking();
      initRUM();
      initTelemetry();
      window.addEventListener('keydown', this.keyHandler);
    }
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    if (typeof window !== 'undefined') {
      input.detach(window);
      window.removeEventListener('keydown', this.keyHandler);
      this.hud.unmount();
      this.profiler.unmount();
      this.killFeed.unmount();
      this.damageNumbers.unmount();
      this.hitMarker.unmount();
      this.dropIndicator.unmount();
      this.menu.unmount();
    }
    this.renderer.dispose();
  }

  get playerId(): number { return this.playerEntity; }
}