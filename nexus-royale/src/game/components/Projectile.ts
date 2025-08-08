import { Component } from '@/engine/core/ecs/Component';
import { Vector3 } from '@/engine/core/math/Vector3';

export enum ProjectileType {
  BULLET = 'bullet',
  GRENADE = 'grenade',
  ROCKET = 'rocket',
  SHOTGUN_PELLET = 'shotgun_pellet',
  SNIPER_BULLET = 'sniper_bullet'
}

export interface ProjectileStats {
  damage: number;
  speed: number;
  range: number;
  gravity: number;
  airResistance: number;
  bounceCount: number;
  explosionRadius: number;
  lifetime: number;
}

/**
 * Projectile component for bullets, grenades, etc.
 */
export class Projectile extends Component {
  public type: ProjectileType;
  public stats: ProjectileStats;
  public ownerId: string | null;
  public damage: number;
  public speed: number;
  public range: number;
  public gravity: number;
  public airResistance: number;
  public bounceCount: number;
  public maxBounces: number;
  public explosionRadius: number;
  public lifetime: number;
  public age: number;
  public distanceTraveled: number;
  public hasExploded: boolean;
  public trail: Vector3[];

  constructor(
    type: ProjectileType,
    stats: ProjectileStats,
    ownerId: string | null = null
  ) {
    super();
    this.type = type;
    this.stats = stats;
    this.ownerId = ownerId;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.range = stats.range;
    this.gravity = stats.gravity;
    this.airResistance = stats.airResistance;
    this.bounceCount = 0;
    this.maxBounces = stats.bounceCount;
    this.explosionRadius = stats.explosionRadius;
    this.lifetime = stats.lifetime;
    this.age = 0;
    this.distanceTraveled = 0;
    this.hasExploded = false;
    this.trail = [];
  }

  /**
   * Update projectile age and check lifetime
   */
  update(deltaTime: number): boolean {
    this.age += deltaTime;
    
    // Check if projectile has expired
    if (this.age >= this.lifetime) {
      return false; // Should be destroyed
    }
    
    return true; // Still alive
  }

  /**
   * Add trail point
   */
  addTrailPoint(position: Vector3): void {
    this.trail.push(position.clone());
    
    // Limit trail length
    if (this.trail.length > 20) {
      this.trail.shift();
    }
  }

  /**
   * Handle bounce
   */
  bounce(): boolean {
    this.bounceCount++;
    return this.bounceCount < this.maxBounces;
  }

  /**
   * Check if projectile should explode
   */
  shouldExplode(): boolean {
    return this.hasExploded || this.bounceCount >= this.maxBounces;
  }

  /**
   * Mark projectile as exploded
   */
  explode(): void {
    this.hasExploded = true;
  }

  /**
   * Get remaining lifetime
   */
  getRemainingLifetime(): number {
    return Math.max(0, this.lifetime - this.age);
  }

  /**
   * Get lifetime percentage
   */
  getLifetimePercentage(): number {
    return this.age / this.lifetime;
  }

  /**
   * Get range percentage
   */
  getRangePercentage(): number {
    return this.distanceTraveled / this.range;
  }

  /**
   * Check if projectile is at max range
   */
  isAtMaxRange(): boolean {
    return this.distanceTraveled >= this.range;
  }

  /**
   * Clone this projectile
   */
  clone(): Projectile {
    const projectile = new Projectile(this.type, this.stats, this.ownerId);
    projectile.damage = this.damage;
    projectile.speed = this.speed;
    projectile.range = this.range;
    projectile.gravity = this.gravity;
    projectile.airResistance = this.airResistance;
    projectile.bounceCount = this.bounceCount;
    projectile.maxBounces = this.maxBounces;
    projectile.explosionRadius = this.explosionRadius;
    projectile.lifetime = this.lifetime;
    projectile.age = this.age;
    projectile.distanceTraveled = this.distanceTraveled;
    projectile.hasExploded = this.hasExploded;
    projectile.trail = this.trail.map(point => point.clone());
    return projectile;
  }

  /**
   * Reset to default values
   */
  reset(): void {
    this.age = 0;
    this.distanceTraveled = 0;
    this.bounceCount = 0;
    this.hasExploded = false;
    this.trail.length = 0;
  }
}

/**
 * Factory for creating projectile presets
 */
export class ProjectilePresets {
  static bullet(damage: number = 25, speed: number = 300, range: number = 100): ProjectileStats {
    return {
      damage,
      speed,
      range,
      gravity: 0,
      airResistance: 0.01,
      bounceCount: 0,
      explosionRadius: 0,
      lifetime: range / speed + 1
    };
  }

  static sniperBullet(damage: number = 100, speed: number = 600, range: number = 300): ProjectileStats {
    return {
      damage,
      speed,
      range,
      gravity: 0,
      airResistance: 0.005,
      bounceCount: 0,
      explosionRadius: 0,
      lifetime: range / speed + 1
    };
  }

  static shotgunPellet(damage: number = 15, speed: number = 200, range: number = 20): ProjectileStats {
    return {
      damage,
      speed,
      range,
      gravity: 0,
      airResistance: 0.02,
      bounceCount: 0,
      explosionRadius: 0,
      lifetime: range / speed + 1
    };
  }

  static grenade(damage: number = 80, speed: number = 150, range: number = 50): ProjectileStats {
    return {
      damage,
      speed,
      range,
      gravity: 9.81,
      airResistance: 0.05,
      bounceCount: 3,
      explosionRadius: 5,
      lifetime: 5
    };
  }

  static rocket(damage: number = 120, speed: number = 250, range: number = 100): ProjectileStats {
    return {
      damage,
      speed,
      range,
      gravity: 0,
      airResistance: 0.01,
      bounceCount: 0,
      explosionRadius: 8,
      lifetime: range / speed + 2
    };
  }
}