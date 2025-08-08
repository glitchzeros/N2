import { Vector3 } from '@/engine/core/math/Vector3';

export interface NetworkPlayer {
  id: string;
  position: Vector3;
  rotation: any;
  velocity: Vector3;
  health: number;
  shield: number;
  alive: boolean;
  lastUpdate: number;
  inputBuffer: any[];
}

export interface NetworkProjectile {
  id: string;
  ownerId: string;
  position: Vector3;
  velocity: Vector3;
  type: string;
  timestamp: number;
}

export interface NetworkGameState {
  players: Map<string, NetworkPlayer>;
  projectiles: NetworkProjectile[];
  gameTime: number;
  gameState: string;
  timestamp: number;
}

/**
 * Network state management with prediction and rollback
 */
export class NetworkState {
  private players: Map<string, NetworkPlayer> = new Map();
  private projectiles: NetworkProjectile[] = [];
  private gameTime: number = 0;
  private gameState: string = 'lobby';
  
  private inputBuffer: any[] = [];
  private stateHistory: NetworkGameState[] = [];
  private maxHistorySize: number = 60; // 1 second at 60 FPS
  
  private predictionEnabled: boolean = true;
  private rollbackEnabled: boolean = true;
  private interpolationEnabled: boolean = true;

  constructor() {
    // Initialize state history
    for (let i = 0; i < this.maxHistorySize; i++) {
      this.stateHistory.push(this.createEmptyState());
    }
  }

  /**
   * Update network state
   */
  update(deltaTime: number): void {
    this.gameTime += deltaTime;

    // Update player predictions
    if (this.predictionEnabled) {
      this.updatePlayerPredictions(deltaTime);
    }

    // Clean up old projectiles
    this.cleanupProjectiles();

    // Add current state to history
    this.addStateToHistory();
  }

  /**
   * Update from network data
   */
  updateFromNetwork(data: any): void {
    if (data.players) {
      this.updatePlayersFromNetwork(data.players);
    }

    if (data.projectiles) {
      this.updateProjectilesFromNetwork(data.projectiles);
    }

    if (data.gameTime !== undefined) {
      this.gameTime = data.gameTime;
    }

    if (data.gameState) {
      this.gameState = data.gameState;
    }

    // Check for rollback
    if (this.rollbackEnabled && data.timestamp) {
      this.checkForRollback(data.timestamp);
    }
  }

  /**
   * Update player input
   */
  updatePlayerInput(playerId: string, input: any): void {
    const player = this.players.get(playerId);
    if (!player) {
      // Create new player
      this.players.set(playerId, {
        id: playerId,
        position: new Vector3(),
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        velocity: new Vector3(),
        health: 100,
        shield: 0,
        alive: true,
        lastUpdate: Date.now(),
        inputBuffer: []
      });
    }

    // Add input to buffer
    const playerData = this.players.get(playerId)!;
    playerData.inputBuffer.push({
      ...input,
      timestamp: Date.now()
    });

    // Keep only recent inputs
    const maxBufferSize = 10;
    if (playerData.inputBuffer.length > maxBufferSize) {
      playerData.inputBuffer = playerData.inputBuffer.slice(-maxBufferSize);
    }
  }

  /**
   * Update player position
   */
  updatePlayerPosition(playerId: string, position: Vector3, rotation: any): void {
    const player = this.players.get(playerId);
    if (player) {
      player.position.copy(position);
      player.rotation = rotation;
      player.lastUpdate = Date.now();
    }
  }

  /**
   * Add weapon fire
   */
  addWeaponFire(playerId: string, weaponId: string, position: Vector3, direction: Vector3): void {
    const projectile: NetworkProjectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      ownerId: playerId,
      position: position.clone(),
      velocity: direction.clone().multiplyScalar(300), // Default projectile speed
      type: weaponId,
      timestamp: Date.now()
    };

    this.projectiles.push(projectile);
  }

  /**
   * Get current state
   */
  getCurrentState(): NetworkGameState {
    return {
      players: new Map(this.players),
      projectiles: [...this.projectiles],
      gameTime: this.gameTime,
      gameState: this.gameState,
      timestamp: Date.now()
    };
  }

  /**
   * Get interpolated state for rendering
   */
  getInterpolatedState(alpha: number = 0.5): NetworkGameState {
    if (!this.interpolationEnabled || this.stateHistory.length < 2) {
      return this.getCurrentState();
    }

    const currentIndex = this.stateHistory.length - 1;
    const previousIndex = this.stateHistory.length - 2;

    const current = this.stateHistory[currentIndex];
    const previous = this.stateHistory[previousIndex];

    return this.interpolateStates(previous, current, alpha);
  }

  /**
   * Update player predictions
   */
  private updatePlayerPredictions(deltaTime: number): void {
    for (const player of this.players.values()) {
      if (player.inputBuffer.length > 0) {
        const latestInput = player.inputBuffer[player.inputBuffer.length - 1];
        
        // Apply movement based on input
        if (latestInput.movement) {
          const movement = new Vector3(
            latestInput.movement.x || 0,
            latestInput.movement.y || 0,
            latestInput.movement.z || 0
          );
          
          player.velocity.copy(movement.multiplyScalar(5)); // Default movement speed
          player.position.add(player.velocity.clone().multiplyScalar(deltaTime));
        }

        // Apply rotation based on input
        if (latestInput.look) {
          // Simple rotation update (would be more complex in practice)
          player.rotation.y += (latestInput.look.x || 0) * deltaTime;
        }
      }
    }
  }

  /**
   * Update players from network data
   */
  private updatePlayersFromNetwork(playersData: any[]): void {
    for (const playerData of playersData) {
      const player: NetworkPlayer = {
        id: playerData.id,
        position: new Vector3(playerData.position.x, playerData.position.y, playerData.position.z),
        rotation: playerData.rotation || { x: 0, y: 0, z: 0, w: 1 },
        velocity: new Vector3(),
        health: playerData.health || 100,
        shield: playerData.shield || 0,
        alive: playerData.alive !== false,
        lastUpdate: Date.now(),
        inputBuffer: []
      };

      this.players.set(playerData.id, player);
    }
  }

  /**
   * Update projectiles from network data
   */
  private updateProjectilesFromNetwork(projectilesData: any[]): void {
    this.projectiles = projectilesData.map(projData => ({
      id: projData.id,
      ownerId: projData.ownerId,
      position: new Vector3(projData.position.x, projData.position.y, projData.position.z),
      velocity: new Vector3(projData.velocity.x, projData.velocity.y, projData.velocity.z),
      type: projData.type,
      timestamp: projData.timestamp
    }));
  }

  /**
   * Check for rollback
   */
  private checkForRollback(timestamp: number): void {
    // Find the closest state in history
    let closestIndex = -1;
    let closestTime = Infinity;

    for (let i = 0; i < this.stateHistory.length; i++) {
      const timeDiff = Math.abs(this.stateHistory[i].timestamp - timestamp);
      if (timeDiff < closestTime) {
        closestTime = timeDiff;
        closestIndex = i;
      }
    }

    // If we found a close state and it's significantly different, rollback
    if (closestIndex >= 0 && closestTime < 100) { // 100ms threshold
      const rollbackState = this.stateHistory[closestIndex];
      this.rollbackToState(rollbackState);
    }
  }

  /**
   * Rollback to specific state
   */
  private rollbackToState(state: NetworkGameState): void {
    console.log('Rolling back to state:', state.timestamp);
    
    this.players = new Map(state.players);
    this.projectiles = [...state.projectiles];
    this.gameTime = state.gameTime;
    this.gameState = state.gameState;
  }

  /**
   * Interpolate between two states
   */
  private interpolateStates(stateA: NetworkGameState, stateB: NetworkGameState, alpha: number): NetworkGameState {
    const interpolatedPlayers = new Map<string, NetworkPlayer>();

    // Interpolate players
    for (const [playerId, playerA] of stateA.players) {
      const playerB = stateB.players.get(playerId);
      if (playerB) {
        const interpolatedPlayer: NetworkPlayer = {
          ...playerA,
          position: playerA.position.clone().lerp(playerB.position, alpha),
          rotation: this.interpolateRotation(playerA.rotation, playerB.rotation, alpha),
          velocity: playerA.velocity.clone().lerp(playerB.velocity, alpha)
        };
        interpolatedPlayers.set(playerId, interpolatedPlayer);
      }
    }

    // Interpolate projectiles
    const interpolatedProjectiles = this.projectiles.map(proj => ({
      ...proj,
      position: proj.position.clone(),
      velocity: proj.velocity.clone()
    }));

    return {
      players: interpolatedPlayers,
      projectiles: interpolatedProjectiles,
      gameTime: stateA.gameTime + (stateB.gameTime - stateA.gameTime) * alpha,
      gameState: stateB.gameState,
      timestamp: stateA.timestamp + (stateB.timestamp - stateA.timestamp) * alpha
    };
  }

  /**
   * Interpolate rotation
   */
  private interpolateRotation(rotA: any, rotB: any, alpha: number): any {
    if (rotA.w !== undefined && rotB.w !== undefined) {
      // Quaternion interpolation
      return {
        x: rotA.x + (rotB.x - rotA.x) * alpha,
        y: rotA.y + (rotB.y - rotA.y) * alpha,
        z: rotA.z + (rotB.z - rotA.z) * alpha,
        w: rotA.w + (rotB.w - rotA.w) * alpha
      };
    } else {
      // Euler interpolation
      return {
        x: rotA.x + (rotB.x - rotA.x) * alpha,
        y: rotA.y + (rotB.y - rotA.y) * alpha,
        z: rotA.z + (rotB.z - rotA.z) * alpha
      };
    }
  }

  /**
   * Add current state to history
   */
  private addStateToHistory(): void {
    this.stateHistory.push(this.getCurrentState());
    
    // Remove oldest state if history is too large
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  /**
   * Create empty state
   */
  private createEmptyState(): NetworkGameState {
    return {
      players: new Map(),
      projectiles: [],
      gameTime: 0,
      gameState: 'lobby',
      timestamp: Date.now()
    };
  }

  /**
   * Clean up old projectiles
   */
  private cleanupProjectiles(): void {
    const currentTime = Date.now();
    const maxAge = 5000; // 5 seconds

    this.projectiles = this.projectiles.filter(proj => 
      currentTime - proj.timestamp < maxAge
    );
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId: string): NetworkPlayer | null {
    return this.players.get(playerId) || null;
  }

  /**
   * Get all players
   */
  getPlayers(): Map<string, NetworkPlayer> {
    return new Map(this.players);
  }

  /**
   * Get projectiles
   */
  getProjectiles(): NetworkProjectile[] {
    return [...this.projectiles];
  }

  /**
   * Get game time
   */
  getGameTime(): number {
    return this.gameTime;
  }

  /**
   * Get game state
   */
  getGameState(): string {
    return this.gameState;
  }

  /**
   * Set prediction enabled
   */
  setPredictionEnabled(enabled: boolean): void {
    this.predictionEnabled = enabled;
  }

  /**
   * Set rollback enabled
   */
  setRollbackEnabled(enabled: boolean): void {
    this.rollbackEnabled = enabled;
  }

  /**
   * Set interpolation enabled
   */
  setInterpolationEnabled(enabled: boolean): void {
    this.interpolationEnabled = enabled;
  }

  /**
   * Get network state statistics
   */
  getStats(): any {
    return {
      players: this.players.size,
      projectiles: this.projectiles.length,
      gameTime: this.gameTime,
      gameState: this.gameState,
      historySize: this.stateHistory.length,
      predictionEnabled: this.predictionEnabled,
      rollbackEnabled: this.rollbackEnabled,
      interpolationEnabled: this.interpolationEnabled
    };
  }
}