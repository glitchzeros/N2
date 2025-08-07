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

export class Game {
  readonly world = new World();
  readonly renderer = new Renderer();
  readonly scheduler: Scheduler;
  private readonly loop: MainLoop;
  private playerEntity: number = -1;

  constructor() {
    registerGameComponents(this.world);
    this.scheduler = new Scheduler({ world: this.world });

    // Systems order: Input -> Character -> Movement
    this.playerEntity = createPlayer(this.world);
    const inputSystem = createInputSystem(this.playerEntity, () => input.snapshot());
    this.scheduler.add(inputSystem);
    this.scheduler.add(CharacterControllerSystem);
    this.scheduler.add(MovementSystem);

    // Renderer
    this.renderer.init();

    // Terrain stub (positions only) — actual mesh added later
    generateFlatShadedGrid(64, 64, 1);

    // Loop
    this.loop = new MainLoop({
      update: (dt) => this.scheduler.update(dt),
      render: () => this.renderer.render(),
      fixedDeltaSeconds: 1 / 60
    });
  }

  start(): void {
    if (typeof window !== 'undefined') input.attach(window);
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    if (typeof window !== 'undefined') input.detach(window);
    this.renderer.dispose();
  }
}