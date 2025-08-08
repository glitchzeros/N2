import { System } from '@/engine/core/ecs/System';
import { ComponentType } from '@/engine/core/ecs/ComponentType';
import { Entity } from '@/engine/core/ecs/Entity';
import { Transform } from '@/game/components/Transform';
import { Projectile, ProjectileType, ProjectileStats } from '@/game/components/Projectile';
import { Player } from '@/game/components/Player';
import { PhysicsWorld, RaycastResult } from '@/engine/physics/PhysicsWorld';
import { PhysicsBody } from '@/engine/physics/PhysicsBody';
import { CollisionShapes } from '@/engine/physics/CollisionShape';
import { CollisionGroup } from '@/engine/physics/CollisionGroup';
import { Vector3 } from '@/engine/core/math/Vector3';

/**
 * System for managing physics simulation and collision detection
 */
export class PhysicsSystem extends System {
  private physicsWorld: PhysicsWorld;
  private projectileQuery: any;
  private playerQuery: any;
  private bodies: Map<Entity, PhysicsBody> = new Map();

  constructor(physicsWorld: PhysicsWorld) {
    super();
    this.priority = 80; // High priority for physics
    this.physicsWorld = physicsWorld;
  }

  getRequiredComponents(): ComponentType[] {
    return [Transform.getType()];
  }

  onAdded(): void {
    if (this.world) {
      this.projectileQuery = this.world.createQuery(Projectile.getType(), Transform.getType());
      this.playerQuery = this.world.createQuery(Player.getType(), Transform.getType());
    }
  }

  update(deltaTime: number): void {
    // Update physics world
    this.physicsWorld.update(deltaTime);

    // Update projectile physics
    this.updateProjectiles(deltaTime);

    // Handle collisions
    this.handleCollisions();

    // Clean up expired projectiles
    this.cleanupExpiredProjectiles();
  }

  /**
   * Update projectile physics
   */
  private updateProjectiles(deltaTime: number): void {
    const entities = this.projectileQuery.getEntities();
    
    for (const entity of entities) {
      const projectile = this.world!.getComponent<Projectile>(entity, Projectile.getType());
      const transform = this.world!.getComponent<Transform>(entity, Transform.getType());
      
      if (projectile && transform) {
        this.updateProjectile(entity, projectile, transform, deltaTime);
      }
    }
  }

  /**
   * Update individual projectile
   */
  private updateProjectile(entity: Entity, projectile: Projectile, transform: Transform, deltaTime: number): void {
    // Update projectile age
    if (!projectile.update(deltaTime)) {
      // Projectile has expired
      this.destroyProjectile(entity);
      return;
    }

    // Add trail point
    projectile.addTrailPoint(transform.position);

    // Update distance traveled
    const oldPosition = transform.position.clone();
    
    // Apply physics (gravity, air resistance)
    if (projectile.gravity > 0) {
      transform.position.y -= projectile.gravity * deltaTime * deltaTime * 0.5;
    }

    // Calculate new position based on speed and direction
    const direction = transform.getForward();
    const velocity = direction.clone().multiplyScalar(projectile.speed);
    
    // Apply air resistance
    if (projectile.airResistance > 0) {
      const speed = velocity.length();
      if (speed > 0) {
        const dragFactor = 1 - projectile.airResistance * deltaTime;
        velocity.multiplyScalar(Math.max(0, dragFactor));
      }
    }

    // Update position
    transform.position.add(velocity.clone().multiplyScalar(deltaTime));

    // Calculate distance traveled
    const distance = transform.position.distanceTo(oldPosition);
    projectile.distanceTraveled += distance;

    // Check if projectile is at max range
    if (projectile.isAtMaxRange()) {
      this.destroyProjectile(entity);
      return;
    }

    // Update physics body if it exists
    const body = this.bodies.get(entity);
    if (body) {
      body.setPosition(transform.position);
      body.setVelocity(velocity);
    }
  }

  /**
   * Handle collisions
   */
  private handleCollisions(): void {
    const projectileEntities = this.projectileQuery.getEntities();
    
    for (const entity of projectileEntities) {
      const projectile = this.world!.getComponent<Projectile>(entity, Projectile.getType());
      const transform = this.world!.getComponent<Transform>(entity, Transform.getType());
      
      if (projectile && transform) {
        this.checkProjectileCollisions(entity, projectile, transform);
      }
    }
  }

  /**
   * Check collisions for a projectile
   */
  private checkProjectileCollisions(entity: Entity, projectile: Projectile, transform: Transform): void {
    // Raycast from previous position to current position
    const direction = transform.getForward();
    const raycastResult = this.physicsWorld.raycast(transform.position, direction, 1);

    if (raycastResult) {
      // Handle collision
      this.handleProjectileHit(entity, projectile, transform, raycastResult);
    }
  }

  /**
   * Handle projectile hit
   */
  private handleProjectileHit(
    entity: Entity, 
    projectile: Projectile, 
    transform: Transform, 
    hit: RaycastResult
  ): void {
    // Check if hit a player
    const hitEntity = this.getEntityFromPhysicsBody(hit.body);
    if (hitEntity) {
      const player = this.world!.getComponent<Player>(hitEntity, Player.getType());
      if (player && player.id !== projectile.ownerId) {
        // Damage the player
        this.damagePlayer(player, projectile.damage, projectile.ownerId);
        
        // Create hit effect
        this.createHitEffect(transform.position, hit.normal);
        
        // Destroy projectile
        this.destroyProjectile(entity);
        return;
      }
    }

    // Handle bounce or explosion
    if (projectile.shouldExplode()) {
      this.explodeProjectile(entity, projectile, transform.position);
    } else if (projectile.bounce()) {
      this.bounceProjectile(entity, projectile, transform, hit.normal);
    } else {
      this.destroyProjectile(entity);
    }
  }

  /**
   * Damage a player
   */
  private damagePlayer(player: Player, damage: number, attackerId?: string): void {
    // Find player system to handle damage
    const playerSystem = this.world!.systems.find(system => 
      system.constructor.name === 'PlayerSystem'
    ) as any;
    
    if (playerSystem) {
      playerSystem.damagePlayer(player, damage, attackerId);
    }
  }

  /**
   * Create hit effect
   */
  private createHitEffect(position: Vector3, normal: Vector3): void {
    // TODO: Create particle effects, sound, etc.
    console.log(`Hit effect at ${position.toString()} with normal ${normal.toString()}`);
  }

  /**
   * Explode projectile
   */
  private explodeProjectile(entity: Entity, projectile: Projectile, position: Vector3): void {
    if (projectile.explosionRadius > 0) {
      // Find players in explosion radius
      const playerEntities = this.playerQuery.getEntities();
      
      for (const playerEntity of playerEntities) {
        const player = this.world!.getComponent<Player>(playerEntity, Player.getType());
        const playerTransform = this.world!.getComponent<Transform>(playerEntity, Transform.getType());
        
        if (player && playerTransform) {
          const distance = position.distanceTo(playerTransform.position);
          if (distance <= projectile.explosionRadius) {
            // Calculate damage based on distance
            const damageFalloff = 1 - (distance / projectile.explosionRadius);
            const damage = projectile.damage * damageFalloff;
            
            this.damagePlayer(player, damage, projectile.ownerId);
          }
        }
      }
    }

    // Create explosion effect
    this.createExplosionEffect(position, projectile.explosionRadius);
    
    // Destroy projectile
    this.destroyProjectile(entity);
  }

  /**
   * Bounce projectile
   */
  private bounceProjectile(entity: Entity, projectile: Projectile, transform: Transform, normal: Vector3): void {
    // Calculate reflection direction
    const direction = transform.getForward();
    const reflection = direction.clone().sub(normal.clone().multiplyScalar(2 * direction.dot(normal)));
    
    // Update transform rotation to face reflection direction
    transform.lookAt(transform.position.clone().add(reflection));
    
    // Reduce speed on bounce
    projectile.speed *= 0.8;
  }

  /**
   * Destroy projectile
   */
  private destroyProjectile(entity: Entity): void {
    // Remove physics body
    const body = this.bodies.get(entity);
    if (body) {
      this.physicsWorld.removeBody(body);
      this.bodies.delete(entity);
    }

    // Destroy entity
    this.world!.destroyEntity(entity);
  }

  /**
   * Clean up expired projectiles
   */
  private cleanupExpiredProjectiles(): void {
    const entities = this.projectileQuery.getEntities();
    
    for (const entity of entities) {
      const projectile = this.world!.getComponent<Projectile>(entity, Projectile.getType());
      if (projectile && projectile.age >= projectile.lifetime) {
        this.destroyProjectile(entity);
      }
    }
  }

  /**
   * Create a projectile entity
   */
  createProjectile(
    type: ProjectileType,
    stats: ProjectileStats,
    position: Vector3,
    direction: Vector3,
    ownerId?: string
  ): Entity {
    const entity = this.world!.createEntity();
    
    // Add transform component
    const transform = new Transform(position);
    transform.lookAt(position.clone().add(direction));
    this.world!.addComponent(entity, Transform.getType(), transform);
    
    // Add projectile component
    const projectile = new Projectile(type, stats, ownerId || null);
    this.world!.addComponent(entity, Projectile.getType(), projectile);
    
    // Create physics body
    const shape = CollisionShapes.sphere(0.1); // Small sphere for bullets
    const body = new PhysicsBody(position, shape, {
      mass: 0.1,
      restitution: 0.3,
      friction: 0.5,
      isStatic: false,
      affectedByGravity: stats.gravity > 0,
      affectedByAirResistance: stats.airResistance > 0,
      collisionGroup: CollisionGroup.PROJECTILE,
      userData: { entity, type: 'projectile' }
    });
    
    // Set initial velocity
    body.setVelocity(direction.clone().multiplyScalar(stats.speed));
    
    // Add to physics world
    this.physicsWorld.addBody(body);
    this.bodies.set(entity, body);
    
    return entity;
  }

  /**
   * Get entity from physics body
   */
  private getEntityFromPhysicsBody(body: PhysicsBody): Entity | null {
    if (body.userData && body.userData.entity) {
      return body.userData.entity;
    }
    return null;
  }

  /**
   * Create explosion effect
   */
  private createExplosionEffect(position: Vector3, radius: number): void {
    // TODO: Create explosion particles, sound, screen shake, etc.
    console.log(`Explosion at ${position.toString()} with radius ${radius}`);
  }

  /**
   * Get physics world
   */
  getPhysicsWorld(): PhysicsWorld {
    return this.physicsWorld;
  }

  /**
   * Get physics body for entity
   */
  getPhysicsBody(entity: Entity): PhysicsBody | null {
    return this.bodies.get(entity) || null;
  }

  /**
   * Raycast from entity position
   */
  raycastFromEntity(entity: Entity, direction: Vector3, maxDistance: number): RaycastResult | null {
    const transform = this.world!.getComponent<Transform>(entity, Transform.getType());
    if (!transform) return null;

    return this.physicsWorld.raycast(transform.position, direction, maxDistance);
  }

  /**
   * Get physics statistics
   */
  getStats(): any {
    const bodies = this.physicsWorld.getBodies();
    const projectiles = this.projectileQuery.getCount();
    
    return {
      totalBodies: bodies.length,
      projectiles,
      gravity: this.physicsWorld.getGravity(),
      airResistance: this.physicsWorld.getAirResistance()
    };
  }
}