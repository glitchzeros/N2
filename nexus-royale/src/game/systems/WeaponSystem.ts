import { System } from '@/engine/core/ecs/System';
import { ComponentType } from '@/engine/core/ecs/ComponentType';
import { Entity } from '@/engine/core/ecs/Entity';
import { Weapon, WeaponType, AmmoType, WeaponStats } from '@/game/components/Weapon';
import { Transform } from '@/game/components/Transform';
import { Player } from '@/game/components/Player';
import { Vector3 } from '@/engine/core/math/Vector3';

/**
 * System for managing weapon logic and firing
 */
export class WeaponSystem extends System {
  private weaponQuery: any;
  private currentTime = 0;

  constructor() {
    super();
    this.priority = 90; // High priority for weapon systems
  }

  getRequiredComponents(): ComponentType[] {
    return [Weapon.getType(), Transform.getType()];
  }

  onAdded(): void {
    if (this.world) {
      this.weaponQuery = this.world.createQuery(Weapon.getType(), Transform.getType());
    }
  }

  update(deltaTime: number): void {
    this.currentTime += deltaTime;

    const entities = this.weaponQuery.getEntities();
    
    for (const entity of entities) {
      const weapon = this.world!.getComponent<Weapon>(entity, Weapon.getType());
      const transform = this.world!.getComponent<Transform>(entity, Transform.getType());
      
      if (weapon && transform) {
        this.updateWeapon(weapon, transform, deltaTime);
      }
    }
  }

  private updateWeapon(weapon: Weapon, transform: Transform, deltaTime: number): void {
    // Update recoil recovery
    weapon.updateRecoil(deltaTime);
    
    // Update heat decay
    weapon.updateHeat(deltaTime);
    
    // Check if reload is complete
    if (weapon.isReloadComplete(this.currentTime)) {
      weapon.completeReload();
    }
    
    // Update muzzle position and direction
    this.updateMuzzlePosition(weapon, transform);
  }

  private updateMuzzlePosition(weapon: Weapon, transform: Transform): void {
    // Calculate muzzle position based on weapon type and transform
    const muzzleOffset = new Vector3(0, 1.6, -0.5); // Approximate player height and forward offset
    const muzzlePosition = transform.position.clone().add(muzzleOffset);
    
    // Get firing direction from transform
    const muzzleDirection = transform.getForward();
    
    weapon.setMuzzle(muzzlePosition, muzzleDirection);
  }

  /**
   * Fire a weapon
   */
  fireWeapon(weapon: Weapon, transform: Transform, playerId?: string): boolean {
    if (!weapon.canFire(this.currentTime)) {
      return false;
    }

    if (!weapon.fire(this.currentTime)) {
      return false;
    }

    // Create projectiles
    this.createProjectiles(weapon, transform, playerId);
    
    // Handle firing effects
    this.handleFiringEffects(weapon, transform);
    
    return true;
  }

  private createProjectiles(weapon: Weapon, transform: Transform, playerId?: string): void {
    const projectileCount = weapon.stats.projectileCount;
    
    for (let i = 0; i < projectileCount; i++) {
      const direction = weapon.getSpreadDirection();
      const damage = weapon.getDamageWithAccuracy();
      
      // Create projectile entity
      this.createProjectileEntity(
        weapon.muzzlePosition.clone(),
        direction,
        damage,
        weapon.stats.projectileSpeed,
        weapon.stats.range,
        playerId
      );
    }
  }

  private createProjectileEntity(
    position: Vector3,
    direction: Vector3,
    damage: number,
    speed: number,
    range: number,
    ownerId?: string
  ): void {
    // Create projectile entity with components
    const entity = this.world!.createEntity();
    
    // Add transform component
    const transform = new Transform(position);
    this.world!.addComponent(entity, Transform.getType(), transform);
    
    // Add projectile component (to be created)
    // const projectile = new Projectile(damage, speed, range, ownerId);
    // this.world!.addComponent(entity, Projectile.getType(), projectile);
    
    console.log(`Created projectile at ${position.toString()} with damage ${damage}`);
  }

  private handleFiringEffects(weapon: Weapon, transform: Transform): void {
    // Handle firing effects like:
    // - Muzzle flash
    // - Sound effects
    // - Screen shake
    // - Recoil animation
    
    console.log(`Weapon ${weapon.type} fired`);
  }

  /**
   * Start reloading a weapon
   */
  startReload(weapon: Weapon): boolean {
    return weapon.startReload(this.currentTime);
  }

  /**
   * Add ammo to a weapon
   */
  addAmmo(weapon: Weapon, amount: number): number {
    return weapon.addAmmo(amount);
  }

  /**
   * Get weapon by entity
   */
  getWeapon(entity: Entity): Weapon | null {
    return this.world!.getComponent<Weapon>(entity, Weapon.getType());
  }

  /**
   * Get all equipped weapons
   */
  getEquippedWeapons(): Weapon[] {
    const entities = this.weaponQuery.getEntities();
    const equippedWeapons: Weapon[] = [];
    
    for (const entity of entities) {
      const weapon = this.world!.getComponent<Weapon>(entity, Weapon.getType());
      if (weapon && weapon.isEquipped) {
        equippedWeapons.push(weapon);
      }
    }
    
    return equippedWeapons;
  }

  /**
   * Create a weapon entity
   */
  createWeaponEntity(
    weaponType: WeaponType,
    ammoType: AmmoType,
    stats: WeaponStats,
    isAutomatic: boolean = false
  ): Entity {
    const entity = this.world!.createEntity();
    
    // Add weapon component
    const weapon = new Weapon(weaponType, ammoType, stats, isAutomatic);
    this.world!.addComponent(entity, Weapon.getType(), weapon);
    
    // Add transform component
    const transform = new Transform();
    this.world!.addComponent(entity, Transform.getType(), transform);
    
    return entity;
  }

  /**
   * Create weapon from preset
   */
  createWeaponFromPreset(preset: string): Entity | null {
    const weaponPresets = this.getWeaponPresets();
    const presetData = weaponPresets[preset];
    
    if (!presetData) {
      console.warn(`Weapon preset '${preset}' not found`);
      return null;
    }
    
    return this.createWeaponEntity(
      presetData.type,
      presetData.ammoType,
      presetData.stats,
      presetData.isAutomatic
    );
  }

  private getWeaponPresets(): Record<string, any> {
    return {
      pistol: {
        type: WeaponType.PISTOL,
        ammoType: AmmoType.LIGHT,
        stats: {
          damage: 25,
          fireRate: 2,
          range: 50,
          accuracy: 0.8,
          recoil: 0.1,
          reloadTime: 1.5,
          magazineSize: 12,
          projectileSpeed: 300,
          projectileCount: 1,
          spread: 0.05
        },
        isAutomatic: false
      },
      rifle: {
        type: WeaponType.RIFLE,
        ammoType: AmmoType.MEDIUM,
        stats: {
          damage: 35,
          fireRate: 8,
          range: 100,
          accuracy: 0.85,
          recoil: 0.3,
          reloadTime: 2.5,
          magazineSize: 30,
          projectileSpeed: 400,
          projectileCount: 1,
          spread: 0.03
        },
        isAutomatic: true
      },
      shotgun: {
        type: WeaponType.SHOTGUN,
        ammoType: AmmoType.HEAVY,
        stats: {
          damage: 15,
          fireRate: 1,
          range: 20,
          accuracy: 0.6,
          recoil: 0.8,
          reloadTime: 3.0,
          magazineSize: 8,
          projectileSpeed: 200,
          projectileCount: 8,
          spread: 0.2
        },
        isAutomatic: false
      },
      sniper: {
        type: WeaponType.SNIPER,
        ammoType: AmmoType.HEAVY,
        stats: {
          damage: 100,
          fireRate: 0.5,
          range: 300,
          accuracy: 0.95,
          recoil: 1.0,
          reloadTime: 4.0,
          magazineSize: 5,
          projectileSpeed: 600,
          projectileCount: 1,
          spread: 0.01
        },
        isAutomatic: false
      }
    };
  }
}