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
    this.scheduler.add(createHealthRegenSystem());

    // Renderer
    this.renderer.init();

    // Terrain mesh
    const data = generateFlatShadedGrid(64, 64, 1);
    const mesh = buildTerrainMesh(data);
    this.renderer.getScene().add(mesh);

    // Visibility for terrain (approx bounding sphere)
    const center = new THREE.Vector3((data.width * data.scale) / 2, 0, (data.depth * data.scale) / 2);
    const radius = Math.hypot(center.x, center.z);
    this.scheduler.add(createVisibilitySystem(this.renderer, [{ mesh, center, radius }]));

    // Camera + shake
    this.scheduler.add(createCameraSystem(this.playerEntity, this.renderer));
    this.scheduler.add(createScreenShakeSystem(this.renderer));

    // Loop
    this.loop = new MainLoop({
      update: (dt) => this.scheduler.update(dt),
      render: () => {
        const fps = this.profiler.tick();
        const health = this.world.get<{ hp: number; max: number }>(this.playerEntity, 'Health');
        if (health) this.hud.state.set({ health: Math.round(health.hp), maxHealth: health.max, fps });
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
      this.hitMarker.mount(document.body);
      initErrorTracking();
      initRUM();
      initTelemetry();
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
      this.hitMarker.unmount();
    }
    this.renderer.dispose();
  }
}