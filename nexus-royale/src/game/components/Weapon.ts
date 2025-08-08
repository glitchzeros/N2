import { Component } from '@/engine/core/ecs/Component';
import { Vector3 } from '@/engine/core/math/Vector3';

export enum WeaponType {
  PISTOL = 'pistol',
  RIFLE = 'rifle',
  SHOTGUN = 'shotgun',
  SNIPER = 'sniper',
  SMG = 'smg',
  LMG = 'lmg',
  GRENADE = 'grenade',
  MELEE = 'melee'
}

export enum AmmoType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  ENERGY = 'energy',
  EXPLOSIVE = 'explosive'
}

export interface WeaponStats {
  damage: number;
  fireRate: number; // rounds per second
  range: number;
  accuracy: number; // 0-1
  recoil: number;
  reloadTime: number;
  magazineSize: number;
  projectileSpeed: number;
  projectileCount: number; // for shotguns
  spread: number; // in radians
}

/**
 * Weapon component for battle royale weapons
 */
export class Weapon extends Component {
  public type: WeaponType;
  public ammoType: AmmoType;
  public stats: WeaponStats;
  public currentAmmo: number;
  public totalAmmo: number;
  public isReloading: boolean;
  public reloadStartTime: number;
  public lastFireTime: number;
  public isAutomatic: boolean;
  public isEquipped: boolean;
  public muzzlePosition: Vector3;
  public muzzleDirection: Vector3;
  public recoilOffset: Vector3;
  public recoilRecovery: number;
  public heat: number; // for overheating weapons
  public maxHeat: number;
  public heatDecayRate: number;

  constructor(
    type: WeaponType,
    ammoType: AmmoType,
    stats: WeaponStats,
    isAutomatic: boolean = false
  ) {
    super();
    this.type = type;
    this.ammoType = ammoType;
    this.stats = stats;
    this.currentAmmo = stats.magazineSize;
    this.totalAmmo = stats.magazineSize * 3; // Start with 3 magazines
    this.isReloading = false;
    this.reloadStartTime = 0;
    this.lastFireTime = 0;
    this.isAutomatic = isAutomatic;
    this.isEquipped = false;
    this.muzzlePosition = new Vector3();
    this.muzzleDirection = new Vector3(0, 0, -1);
    this.recoilOffset = new Vector3();
    this.recoilRecovery = 0;
    this.heat = 0;
    this.maxHeat = 100;
    this.heatDecayRate = 10; // heat per second
  }

  /**
   * Check if weapon can fire
   */
  canFire(currentTime: number): boolean {
    if (this.isReloading) return false;
    if (this.currentAmmo <= 0) return false;
    if (this.heat >= this.maxHeat) return false;
    
    const timeSinceLastFire = currentTime - this.lastFireTime;
    const fireInterval = 1 / this.stats.fireRate;
    
    return timeSinceLastFire >= fireInterval;
  }

  /**
   * Fire the weapon
   */
  fire(currentTime: number): boolean {
    if (!this.canFire(currentTime)) return false;

    this.currentAmmo--;
    this.lastFireTime = currentTime;
    
    // Add heat
    this.heat += 10; // Heat per shot
    
    // Add recoil
    this.addRecoil();
    
    return true;
  }

  /**
   * Start reloading
   */
  startReload(currentTime: number): boolean {
    if (this.isReloading) return false;
    if (this.currentAmmo >= this.stats.magazineSize) return false;
    if (this.totalAmmo <= 0) return false;

    this.isReloading = true;
    this.reloadStartTime = currentTime;
    return true;
  }

  /**
   * Complete reload
   */
  completeReload(): void {
    if (!this.isReloading) return;

    const ammoNeeded = this.stats.magazineSize - this.currentAmmo;
    const ammoToAdd = Math.min(ammoNeeded, this.totalAmmo);
    
    this.currentAmmo += ammoToAdd;
    this.totalAmmo -= ammoToAdd;
    this.isReloading = false;
  }

  /**
   * Check if reload is complete
   */
  isReloadComplete(currentTime: number): boolean {
    if (!this.isReloading) return false;
    return currentTime - this.reloadStartTime >= this.stats.reloadTime;
  }

  /**
   * Add ammo to total ammo
   */
  addAmmo(amount: number): number {
    const oldTotal = this.totalAmmo;
    this.totalAmmo = Math.min(this.totalAmmo + amount, this.stats.magazineSize * 10);
    return this.totalAmmo - oldTotal;
  }

  /**
   * Get ammo percentage
   */
  getAmmoPercentage(): number {
    return this.currentAmmo / this.stats.magazineSize;
  }

  /**
   * Get total ammo percentage
   */
  getTotalAmmoPercentage(): number {
    return this.totalAmmo / (this.stats.magazineSize * 10);
  }

  /**
   * Add recoil
   */
  addRecoil(): void {
    const recoilX = (Math.random() - 0.5) * this.stats.recoil;
    const recoilY = (Math.random() - 0.5) * this.stats.recoil;
    const recoilZ = Math.random() * this.stats.recoil * 0.5;
    
    this.recoilOffset.add(new Vector3(recoilX, recoilY, recoilZ));
    this.recoilRecovery = 0;
  }

  /**
   * Update recoil recovery
   */
  updateRecoil(deltaTime: number): void {
    if (this.recoilRecovery < 1) {
      this.recoilRecovery += deltaTime * 2; // Recovery rate
      this.recoilRecovery = Math.min(this.recoilRecovery, 1);
      
      const recoveryFactor = 1 - this.recoilRecovery;
      this.recoilOffset.multiplyScalar(recoveryFactor);
    }
  }

  /**
   * Update heat decay
   */
  updateHeat(deltaTime: number): void {
    if (this.heat > 0) {
      this.heat = Math.max(0, this.heat - this.heatDecayRate * deltaTime);
    }
  }

  /**
   * Get heat percentage
   */
  getHeatPercentage(): number {
    return this.heat / this.maxHeat;
  }

  /**
   * Set muzzle position and direction
   */
  setMuzzle(position: Vector3, direction: Vector3): void {
    this.muzzlePosition.copy(position);
    this.muzzleDirection.copy(direction).normalize();
  }

  /**
   * Get spread direction for projectile
   */
  getSpreadDirection(): Vector3 {
    const spread = this.stats.spread;
    const angleX = (Math.random() - 0.5) * spread;
    const angleY = (Math.random() - 0.5) * spread;
    
    const direction = this.muzzleDirection.clone();
    
    // Apply spread
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    
    const newX = direction.x * cosY + direction.z * sinY;
    const newY = direction.y * cosX - (direction.x * sinY - direction.z * cosY) * sinX;
    const newZ = direction.z * cosY - direction.x * sinY;
    
    return new Vector3(newX, newY, newZ).normalize();
  }

  /**
   * Get weapon damage with accuracy
   */
  getDamageWithAccuracy(): number {
    const accuracy = this.stats.accuracy;
    const baseDamage = this.stats.damage;
    
    // Apply accuracy penalty
    const accuracyMultiplier = 0.5 + accuracy * 0.5; // 50-100% damage based on accuracy
    return baseDamage * accuracyMultiplier;
  }

  /**
   * Clone this weapon
   */
  clone(): Weapon {
    const weapon = new Weapon(this.type, this.ammoType, this.stats, this.isAutomatic);
    weapon.currentAmmo = this.currentAmmo;
    weapon.totalAmmo = this.totalAmmo;
    weapon.isReloading = this.isReloading;
    weapon.reloadStartTime = this.reloadStartTime;
    weapon.lastFireTime = this.lastFireTime;
    weapon.isEquipped = this.isEquipped;
    weapon.muzzlePosition.copy(this.muzzlePosition);
    weapon.muzzleDirection.copy(this.muzzleDirection);
    weapon.recoilOffset.copy(this.recoilOffset);
    weapon.recoilRecovery = this.recoilRecovery;
    weapon.heat = this.heat;
    return weapon;
  }

  /**
   * Reset to default values
   */
  reset(): void {
    this.currentAmmo = this.stats.magazineSize;
    this.totalAmmo = this.stats.magazineSize * 3;
    this.isReloading = false;
    this.reloadStartTime = 0;
    this.lastFireTime = 0;
    this.isEquipped = false;
    this.muzzlePosition.set(0, 0, 0);
    this.muzzleDirection.set(0, 0, -1);
    this.recoilOffset.set(0, 0, 0);
    this.recoilRecovery = 0;
    this.heat = 0;
  }
}