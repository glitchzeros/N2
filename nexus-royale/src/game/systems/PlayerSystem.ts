import { System } from '@/engine/core/ecs/System';
import { ComponentType } from '@/engine/core/ecs/ComponentType';
import { Entity } from '@/engine/core/ecs/Entity';
import { Player } from '@/game/components/Player';
import { Transform } from '@/game/components/Transform';
import { Vector3 } from '@/engine/core/math/Vector3';

/**
 * System for managing player logic and state
 */
export class PlayerSystem extends System {
  private playerQuery: any;
  private currentTime = 0;

  constructor() {
    super();
    this.priority = 100; // High priority for player systems
  }

  getRequiredComponents(): ComponentType[] {
    return [Player.getType(), Transform.getType()];
  }

  onAdded(): void {
    if (this.world) {
      this.playerQuery = this.world.createQuery(Player.getType(), Transform.getType());
    }
  }

  update(deltaTime: number): void {
    this.currentTime += deltaTime;

    const entities = this.playerQuery.getEntities();
    
    for (const entity of entities) {
      const player = this.world!.getComponent<Player>(entity, Player.getType());
      const transform = this.world!.getComponent<Transform>(entity, Transform.getType());
      
      if (player && transform) {
        this.updatePlayer(player, transform, deltaTime);
      }
    }
  }

  private updatePlayer(player: Player, transform: Transform, deltaTime: number): void {
    // Update last seen position and time
    player.updateLastSeen(transform.position, this.currentTime);

    // Handle respawn logic
    if (!player.isAlive && this.currentTime >= player.respawnTime) {
      this.handleRespawn(player, transform);
    }

    // Update player statistics
    this.updatePlayerStats(player, deltaTime);

    // Handle player death effects
    if (!player.isAlive) {
      this.handleDeathEffects(player, transform);
    }
  }

  private handleRespawn(player: Player, transform: Transform): void {
    // Find a safe spawn position
    const spawnPosition = this.findSafeSpawnPosition();
    
    // Respawn the player
    player.respawn(spawnPosition, this.currentTime);
    transform.setPosition(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    
    // Reset player state
    player.reset();
    
    console.log(`Player ${player.name} respawned at ${spawnPosition.toString()}`);
  }

  private findSafeSpawnPosition(): Vector3 {
    // Simple spawn logic - in a real game, you'd have spawn points
    const mapSize = 1000;
    const x = (Math.random() - 0.5) * mapSize;
    const z = (Math.random() - 0.5) * mapSize;
    const y = 100; // Spawn in the air
    
    return new Vector3(x, y, z);
  }

  private updatePlayerStats(player: Player, deltaTime: number): void {
    // Update player statistics over time
    // This could include things like:
    // - Time alive
    // - Distance traveled
    // - Accuracy statistics
    // - etc.
  }

  private handleDeathEffects(player: Player, transform: Transform): void {
    // Handle death effects like:
    // - Drop loot
    // - Play death animation
    // - Show death message
    // - Update scoreboard
  }

  /**
   * Damage a player
   */
  damagePlayer(player: Player, damage: number, attackerId?: string): void {
    if (!player.isAlive) return;

    const actualDamage = player.takeDamage(damage, this.currentTime);
    
    if (actualDamage > 0) {
      console.log(`Player ${player.name} took ${actualDamage} damage`);
      
      // Handle damage effects
      this.handleDamageEffects(player, actualDamage);
      
      // If player died, handle death
      if (!player.isAlive) {
        this.handlePlayerDeath(player, attackerId);
      }
    }
  }

  private handleDamageEffects(player: Player, damage: number): void {
    // Handle damage effects like:
    // - Screen shake
    // - Damage numbers
    // - Sound effects
    // - Visual feedback
  }

  private handlePlayerDeath(player: Player, attackerId?: string): void {
    console.log(`Player ${player.name} died`);
    
    // Set respawn time
    player.respawnTime = this.currentTime + 5; // 5 second respawn
    
    // Handle death rewards
    if (attackerId) {
      this.handleKillReward(attackerId, player);
    }
    
    // Drop player's loot
    this.dropPlayerLoot(player);
  }

  private handleKillReward(attackerId: string, victim: Player): void {
    // Find the attacker
    const entities = this.playerQuery.getEntities();
    for (const entity of entities) {
      const player = this.world!.getComponent<Player>(entity, Player.getType());
      if (player && player.id === attackerId) {
        player.addKill();
        player.addDamageDealt(victim.getEffectiveHealth());
        console.log(`Player ${player.name} killed ${victim.name}`);
        break;
      }
    }
  }

  private dropPlayerLoot(player: Player): void {
    // Drop player's inventory items
    // This would be handled by the inventory system
    console.log(`Dropping loot for ${player.name}`);
  }

  /**
   * Heal a player
   */
  healPlayer(player: Player, amount: number): number {
    if (!player.isAlive) return 0;
    
    const healed = player.heal(amount);
    if (healed > 0) {
      console.log(`Player ${player.name} healed for ${healed}`);
    }
    
    return healed;
  }

  /**
   * Add shield to a player
   */
  addShieldToPlayer(player: Player, amount: number): number {
    if (!player.isAlive) return 0;
    
    const added = player.addShield(amount);
    if (added > 0) {
      console.log(`Player ${player.name} gained ${added} shield`);
    }
    
    return added;
  }

  /**
   * Get player by ID
   */
  getPlayerById(id: string): Player | null {
    const entities = this.playerQuery.getEntities();
    for (const entity of entities) {
      const player = this.world!.getComponent<Player>(entity, Player.getType());
      if (player && player.id === id) {
        return player;
      }
    }
    return null;
  }

  /**
   * Get all alive players
   */
  getAlivePlayers(): Player[] {
    const entities = this.playerQuery.getEntities();
    const alivePlayers: Player[] = [];
    
    for (const entity of entities) {
      const player = this.world!.getComponent<Player>(entity, Player.getType());
      if (player && player.isAlive) {
        alivePlayers.push(player);
      }
    }
    
    return alivePlayers;
  }

  /**
   * Get player count
   */
  getPlayerCount(): number {
    return this.playerQuery.getCount();
  }

  /**
   * Get alive player count
   */
  getAlivePlayerCount(): number {
    return this.getAlivePlayers().length;
  }
}