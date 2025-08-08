import { World } from '@/engine/core/ecs/World';
import { MainLoop } from '@/engine/MainLoop';
import { PlayerSystem } from '@/game/systems/PlayerSystem';
import { WeaponSystem } from '@/game/systems/WeaponSystem';
import { InputSystem } from '@/game/systems/InputSystem';
import { PhysicsSystem } from '@/game/systems/PhysicsSystem';
import { AISystem } from '@/game/systems/AISystem';
import { Renderer } from '@/engine/renderer/Renderer';
import { AudioManager } from '@/engine/audio/AudioManager';
import { NetworkManager } from '@/engine/net/NetworkManager';
import { AnalyticsManager } from '@/engine/analytics/AnalyticsManager';
import { AccessibilityManager } from '@/engine/accessibility/AccessibilityManager';
import { ProgressionManager } from '@/game/progression/ProgressionManager';
import { Player } from '@/game/components/Player';
import { Transform } from '@/game/components/Transform';
import { Weapon } from '@/game/components/Weapon';
import { Input } from '@/game/components/Input';
import { InputManager } from '@/engine/core/input/InputManager';
import { PhysicsWorld } from '@/engine/physics/PhysicsWorld';
import { Vector3 } from '@/engine/core/math/Vector3';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main game class for Nexus Royale
 */
export class Game {
  public world: World;
  public mainLoop: MainLoop;
  public playerId: string;
  public isRunning = false;
  public gameTime = 0;

  // Systems
  private playerSystem: PlayerSystem;
  private weaponSystem: WeaponSystem;
  private inputSystem: InputSystem;
  private physicsSystem: PhysicsSystem;
  private aiSystem: AISystem;
  private renderer: Renderer | null = null;
  private audioManager: AudioManager | null = null;
  private networkManager: NetworkManager | null = null;
  private analyticsManager: AnalyticsManager | null = null;
  private accessibilityManager: AccessibilityManager | null = null;
  private progressionManager: ProgressionManager | null = null;
  private inputManager: InputManager;
  private physicsWorld: PhysicsWorld;

  // Game state
  private playerCount = 0;
  private maxPlayers = 100;
  private gameState: 'lobby' | 'playing' | 'ended' = 'lobby';

  constructor() {
    this.world = new World();
    this.mainLoop = new MainLoop();
    this.playerId = uuidv4();
    
    // Initialize systems
    this.inputManager = new InputManager();
    this.physicsWorld = new PhysicsWorld();
    this.playerSystem = new PlayerSystem();
    this.weaponSystem = new WeaponSystem();
    this.inputSystem = new InputSystem(this.inputManager);
    this.physicsSystem = new PhysicsSystem(this.physicsWorld);
    this.aiSystem = new AISystem(this.physicsWorld);
    
    // Initialize managers
    this.analyticsManager = new AnalyticsManager();
    this.accessibilityManager = new AccessibilityManager();
    this.progressionManager = new ProgressionManager(this.playerId);
    
    this.setupSystems();
    this.setupGameLoop();
  }

  /**
   * Start the game
   */
  start(): void {
    if (this.isRunning) return;

    console.log('Starting Nexus Royale...');
    this.isRunning = true;
    this.gameState = 'lobby';
    
    // Track session start
    if (this.analyticsManager) {
      this.analyticsManager.trackSessionStart();
      this.analyticsManager.setPlayerId(this.playerId);
    }
    
    // Start the main loop
    this.mainLoop.start();
    
    // Create initial game world
    this.createInitialWorld();
    
    console.log('Nexus Royale started successfully');
  }

  /**
   * Stop the game
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('Stopping Nexus Royale...');
    this.isRunning = false;
    this.mainLoop.stop();
    
    // Track session end
    if (this.analyticsManager) {
      this.analyticsManager.trackSessionEnd();
    }
    
    // Clean up
    this.world.clear();
    
    console.log('Nexus Royale stopped');
  }

  /**
   * Setup all game systems
   */
  private setupSystems(): void {
    // Add systems to world
    this.world.addSystem(this.inputSystem);
    this.world.addSystem(this.physicsSystem);
    this.world.addSystem(this.aiSystem);
    this.world.addSystem(this.playerSystem);
    this.world.addSystem(this.weaponSystem);
    
    console.log('Game systems initialized');
  }

  /**
   * Setup the main game loop
   */
  private setupGameLoop(): void {
    this.mainLoop.setUpdateCallback((deltaTime: number) => {
      this.update(deltaTime);
    });
    
    this.mainLoop.setRenderCallback(() => {
      this.render();
    });
  }

  /**
   * Update game logic
   */
  private update(deltaTime: number): void {
    if (!this.isRunning) return;

    this.gameTime += deltaTime;

    // Update world (ECS systems)
    this.world.update(deltaTime);

    // Update game state
    this.updateGameState(deltaTime);

    // Handle game events
    this.handleGameEvents();
  }

  /**
   * Render the game
   */
  private render(): void {
    if (!this.isRunning) return;

    // Render logic will be handled by the renderer system
    // This is just a placeholder for now
  }

  /**
   * Update game state
   */
  private updateGameState(deltaTime: number): void {
    switch (this.gameState) {
      case 'lobby':
        this.updateLobby(deltaTime);
        break;
      case 'playing':
        this.updatePlaying(deltaTime);
        break;
      case 'ended':
        this.updateEnded(deltaTime);
        break;
    }
  }

  /**
   * Update lobby state
   */
  private updateLobby(deltaTime: number): void {
    // Check if enough players to start
    const alivePlayers = this.playerSystem.getAlivePlayerCount();
    
    if (alivePlayers >= 2) {
      // Start the game after a short delay
      if (this.gameTime > 5) { // 5 second lobby
        this.startGame();
      }
    }
  }

  /**
   * Update playing state
   */
  private updatePlaying(deltaTime: number): void {
    // Check win conditions
    const alivePlayers = this.playerSystem.getAlivePlayerCount();
    
    if (alivePlayers <= 1) {
      this.endGame();
    }
  }

  /**
   * Update ended state
   */
  private updateEnded(deltaTime: number): void {
    // Handle game end state
    // Could restart after a delay, show results, etc.
  }

  /**
   * Handle game events
   */
  private handleGameEvents(): void {
    // Handle various game events
    // This will be expanded as we add more systems
  }

  /**
   * Start the actual game
   */
  private startGame(): void {
    console.log('Starting battle royale match...');
    this.gameState = 'playing';
    
    // Spawn all players
    this.spawnAllPlayers();
    
    // Start the battle royale mechanics
    this.startBattleRoyaleMechanics();
  }

  /**
   * End the game
   */
  private endGame(): void {
    console.log('Battle royale match ended');
    this.gameState = 'ended';
    
    // Handle end game logic
    this.handleEndGame();
  }

  /**
   * Create initial game world
   */
  private createInitialWorld(): void {
    // Create terrain
    this.createTerrain();
    
    // Create initial players (bots for now)
    this.createInitialPlayers();
    
    // Create initial weapons and items
    this.createInitialItems();
  }

  /**
   * Create terrain
   */
  private createTerrain(): void {
    // Create basic terrain
    // This will be expanded with proper terrain generation
    console.log('Creating terrain...');
  }

  /**
   * Create initial players
   */
  private createInitialPlayers(): void {
    // Create local player
    this.createPlayer(this.playerId, 'Player', false);
    
    // Create AI bots
    for (let i = 0; i < 23; i++) { // 24 total players (1 human + 23 bots)
      const botId = uuidv4();
      const botName = `Bot_${i + 1}`;
      this.createPlayer(botId, botName, true);
    }
    
    this.playerCount = 24;
    console.log(`Created ${this.playerCount} players`);
  }

  /**
   * Create a player entity
   */
  createPlayer(id: string, name: string, isBot: boolean): Entity {
    const entity = this.world.createEntity();
    
    // Add player component
    const player = new Player(id, name, isBot);
    if (id === this.playerId) {
      player.isLocalPlayer = true;
    }
    this.world.addComponent(entity, Player.getType(), player);
    
    // Add transform component
    const spawnPosition = this.getRandomSpawnPosition();
    const transform = new Transform(spawnPosition);
    this.world.addComponent(entity, Transform.getType(), transform);
    
    // Add input component
    const input = new Input(id === this.playerId);
    this.world.addComponent(entity, Input.getType(), input);
    
    // Add weapon
    this.givePlayerWeapon(entity, 'pistol');
    
    console.log(`Created player: ${name} (${isBot ? 'Bot' : 'Human'}) at ${spawnPosition.toString()}`);
    
    return entity;
  }

  /**
   * Get random spawn position
   */
  private getRandomSpawnPosition(): Vector3 {
    const mapSize = 1000;
    const x = (Math.random() - 0.5) * mapSize;
    const z = (Math.random() - 0.5) * mapSize;
    const y = 100; // Spawn in the air
    
    return new Vector3(x, y, z);
  }

  /**
   * Give a player a weapon
   */
  givePlayerWeapon(playerEntity: Entity, weaponPreset: string): void {
    const weaponEntity = this.weaponSystem.createWeaponFromPreset(weaponPreset);
    
    if (weaponEntity) {
      const weapon = this.weaponSystem.getWeapon(weaponEntity);
      if (weapon) {
        weapon.isEquipped = true;
        
        // Position weapon relative to player
        const playerTransform = this.world.getComponent<Transform>(playerEntity, Transform.getType());
        const weaponTransform = this.world.getComponent<Transform>(weaponEntity, Transform.getType());
        
        if (playerTransform && weaponTransform) {
          weaponTransform.position.copy(playerTransform.position);
        }
      }
    }
  }

  /**
   * Create initial items
   */
  private createInitialItems(): void {
    // Create weapons, ammo, health packs, etc. scattered around the map
    console.log('Creating initial items...');
  }

  /**
   * Spawn all players
   */
  private spawnAllPlayers(): void {
    // Spawn all players in the game world
    console.log('Spawning all players...');
  }

  /**
   * Start battle royale mechanics
   */
  private startBattleRoyaleMechanics(): void {
    // Start shrinking play area
    // Start spawning items
    // Start AI behavior
    console.log('Battle royale mechanics started');
  }

  /**
   * Handle end game
   */
  private handleEndGame(): void {
    // Show results
    // Calculate scores
    // Handle rewards
    console.log('Handling end game...');
  }

  /**
   * Get game statistics
   */
  getGameStats(): any {
    return {
      playerCount: this.playerCount,
      alivePlayers: this.playerSystem.getAlivePlayerCount(),
      gameTime: this.gameTime,
      gameState: this.gameState,
      entityCount: this.world.getEntityCount()
    };
  }

  /**
   * Get player by ID
   */
  getPlayer(id: string): Player | null {
    return this.playerSystem.getPlayerById(id);
  }

  /**
   * Get local player
   */
  getLocalPlayer(): Player | null {
    return this.getPlayer(this.playerId);
  }

  /**
   * Fire weapon for local player
   */
  fireWeapon(): boolean {
    const localPlayer = this.getLocalPlayer();
    if (!localPlayer || !localPlayer.isAlive) return false;

    // Find player's weapon and fire it
    // This is a simplified version - in a real game you'd have inventory management
    const equippedWeapons = this.weaponSystem.getEquippedWeapons();
    
    for (const weapon of equippedWeapons) {
      if (weapon.isEquipped) {
        // Get player transform
        const entities = this.world.getEntities();
        for (const entity of entities) {
          const player = this.world.getComponent<Player>(entity, Player.getType());
          const transform = this.world.getComponent<Transform>(entity, Transform.getType());
          
          if (player && player.id === this.playerId && transform) {
            return this.weaponSystem.fireWeapon(weapon, transform, this.playerId);
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Get input system
   */
  getInputSystem(): InputSystem {
    return this.inputSystem;
  }

  /**
   * Get input manager
   */
  getInputManager(): InputManager {
    return this.inputManager;
  }

  /**
   * Get input debug info
   */
  getInputDebugInfo(): any {
    return this.inputSystem.getDebugInfo();
  }

  /**
   * Get physics system
   */
  getPhysicsSystem(): PhysicsSystem {
    return this.physicsSystem;
  }

  /**
   * Get physics world
   */
  getPhysicsWorld(): PhysicsWorld {
    return this.physicsWorld;
  }

  /**
   * Get physics debug info
   */
  getPhysicsDebugInfo(): any {
    return this.physicsSystem.getStats();
  }

  /**
   * Get AI system
   */
  getAISystem(): AISystem {
    return this.aiSystem;
  }

  /**
   * Get AI debug info
   */
  getAIDebugInfo(): any {
    return this.aiSystem.getDebugInfo();
  }

  /**
   * Initialize renderer
   */
  initializeRenderer(container: HTMLElement): void {
    this.renderer = new Renderer(container);
  }

  /**
   * Get renderer
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }

  /**
   * Get renderer debug info
   */
  getRendererDebugInfo(): any {
    if (!this.renderer) return null;
    return this.renderer.getStats();
  }

  /**
   * Initialize audio manager
   */
  initializeAudioManager(): void {
    this.audioManager = new AudioManager();
  }

  /**
   * Get audio manager
   */
  getAudioManager(): AudioManager | null {
    return this.audioManager;
  }

  /**
   * Get audio debug info
   */
  getAudioDebugInfo(): any {
    if (!this.audioManager) return null;
    return this.audioManager.getStats();
  }

  /**
   * Initialize network manager
   */
  async initializeNetworkManager(): Promise<void> {
    this.networkManager = new NetworkManager();
    await this.networkManager.initialize();
  }

  /**
   * Get network manager
   */
  getNetworkManager(): NetworkManager | null {
    return this.networkManager;
  }

  /**
   * Get network debug info
   */
  getNetworkDebugInfo(): any {
    if (!this.networkManager) return null;
    return this.networkManager.getStats();
  }

  // Analytics Manager
  getAnalyticsManager(): AnalyticsManager | null {
    return this.analyticsManager;
  }

  getAnalyticsDebugInfo(): any {
    if (!this.analyticsManager) return { error: 'Analytics manager not initialized' };
    return this.analyticsManager.getStats();
  }

  // Accessibility Manager
  getAccessibilityManager(): AccessibilityManager | null {
    return this.accessibilityManager;
  }

  getAccessibilityDebugInfo(): any {
    if (!this.accessibilityManager) return { error: 'Accessibility manager not initialized' };
    return this.accessibilityManager.getStats();
  }

  // Progression Manager
  getProgressionManager(): ProgressionManager | null {
    return this.progressionManager;
  }

  getProgressionDebugInfo(): any {
    if (!this.progressionManager) return { error: 'Progression manager not initialized' };
    return this.progressionManager.getStats();
  }
}