import { Component } from '@/engine/core/ecs/Component';
import { Vector3 } from '@/engine/core/math/Vector3';

/**
 * Player component for battle royale players
 */
export class Player extends Component {
  public id: string;
  public name: string;
  public health: number;
  public maxHealth: number;
  public shield: number;
  public maxShield: number;
  public isAlive: boolean;
  public kills: number;
  public damageDealt: number;
  public damageTaken: number;
  public lastDamageTime: number;
  public respawnTime: number;
  public teamId: number | null;
  public isBot: boolean;
  public botDifficulty: number; // 0-1
  public lastSeenPosition: Vector3;
  public lastSeenTime: number;
  public ping: number;
  public isLocalPlayer: boolean;

  constructor(
    id: string,
    name: string,
    isBot: boolean = false,
    teamId: number | null = null
  ) {
    super();
    this.id = id;
    this.name = name;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.maxShield = 100;
    this.shield = 0;
    this.isAlive = true;
    this.kills = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.lastDamageTime = 0;
    this.respawnTime = 0;
    this.teamId = teamId;
    this.isBot = isBot;
    this.botDifficulty = isBot ? 0.5 : 0;
    this.lastSeenPosition = new Vector3();
    this.lastSeenTime = 0;
    this.ping = 0;
    this.isLocalPlayer = false;
  }

  /**
   * Take damage
   */
  takeDamage(amount: number, currentTime: number): number {
    if (!this.isAlive) return 0;

    this.lastDamageTime = currentTime;
    this.damageTaken += amount;

    // Apply damage to shield first
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, amount);
      this.shield -= shieldDamage;
      amount -= shieldDamage;
    }

    // Apply remaining damage to health
    if (amount > 0) {
      this.health = Math.max(0, this.health - amount);
    }

    // Check if player died
    if (this.health <= 0) {
      this.die();
    }

    return amount;
  }

  /**
   * Heal the player
   */
  heal(amount: number): number {
    if (!this.isAlive) return 0;

    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health - oldHealth;
  }

  /**
   * Add shield
   */
  addShield(amount: number): number {
    if (!this.isAlive) return 0;

    const oldShield = this.shield;
    this.shield = Math.min(this.maxShield, this.shield + amount);
    return this.shield - oldShield;
  }

  /**
   * Handle player death
   */
  die(): void {
    this.isAlive = false;
    this.health = 0;
    this.shield = 0;
  }

  /**
   * Respawn the player
   */
  respawn(position: Vector3, currentTime: number): void {
    this.isAlive = true;
    this.health = this.maxHealth;
    this.shield = 0;
    this.lastSeenPosition.copy(position);
    this.lastSeenTime = currentTime;
  }

  /**
   * Get total effective health (health + shield)
   */
  getEffectiveHealth(): number {
    return this.health + this.shield;
  }

  /**
   * Get health percentage
   */
  getHealthPercentage(): number {
    return this.health / this.maxHealth;
  }

  /**
   * Get shield percentage
   */
  getShieldPercentage(): number {
    return this.shield / this.maxShield;
  }

  /**
   * Check if player is at full health
   */
  isAtFullHealth(): boolean {
    return this.health >= this.maxHealth;
  }

  /**
   * Check if player has full shield
   */
  hasFullShield(): boolean {
    return this.shield >= this.maxShield;
  }

  /**
   * Update last seen position and time
   */
  updateLastSeen(position: Vector3, time: number): void {
    this.lastSeenPosition.copy(position);
    this.lastSeenTime = time;
  }

  /**
   * Add a kill
   */
  addKill(): void {
    this.kills++;
  }

  /**
   * Add damage dealt
   */
  addDamageDealt(amount: number): void {
    this.damageDealt += amount;
  }

  /**
   * Clone this player component
   */
  clone(): Player {
    const player = new Player(this.id, this.name, this.isBot, this.teamId);
    player.health = this.health;
    player.maxHealth = this.maxHealth;
    player.shield = this.shield;
    player.maxShield = this.maxShield;
    player.isAlive = this.isAlive;
    player.kills = this.kills;
    player.damageDealt = this.damageDealt;
    player.damageTaken = this.damageTaken;
    player.lastDamageTime = this.lastDamageTime;
    player.respawnTime = this.respawnTime;
    player.botDifficulty = this.botDifficulty;
    player.lastSeenPosition.copy(this.lastSeenPosition);
    player.lastSeenTime = this.lastSeenTime;
    player.ping = this.ping;
    player.isLocalPlayer = this.isLocalPlayer;
    return player;
  }

  /**
   * Reset to default values
   */
  reset(): void {
    this.health = this.maxHealth;
    this.shield = 0;
    this.isAlive = true;
    this.kills = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.lastDamageTime = 0;
    this.respawnTime = 0;
    this.lastSeenPosition.set(0, 0, 0);
    this.lastSeenTime = 0;
    this.ping = 0;
    this.isLocalPlayer = false;
  }
}