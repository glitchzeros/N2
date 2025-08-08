import { Vector3 } from '@/engine/core/math/Vector3';
import { AABB } from './AABB';
import { CollisionShape, CollisionShapes } from './CollisionShape';
import { CollisionGroup } from './CollisionGroup';

/**
 * Physics body representing a physical object in the world
 */
export class PhysicsBody {
  public position: Vector3;
  public velocity: Vector3;
  public shape: CollisionShape;
  public aabb: AABB;
  public mass: number;
  public restitution: number; // Bounciness (0-1)
  public friction: number; // Friction coefficient
  public isStatic: boolean;
  public affectedByGravity: boolean;
  public affectedByAirResistance: boolean;
  public collisionGroup: CollisionGroup;
  public userData: any; // Custom data attached to the body

  constructor(
    position: Vector3,
    shape: CollisionShape,
    options: Partial<PhysicsBodyOptions> = {}
  ) {
    this.position = position.clone();
    this.velocity = new Vector3();
    this.shape = shape;
    this.mass = options.mass ?? 1.0;
    this.restitution = Math.max(0, Math.min(1, options.restitution ?? 0.3));
    this.friction = Math.max(0, options.friction ?? 0.5);
    this.isStatic = options.isStatic ?? false;
    this.affectedByGravity = options.affectedByGravity ?? true;
    this.affectedByAirResistance = options.affectedByAirResistance ?? true;
    this.collisionGroup = options.collisionGroup ?? CollisionGroup.DEFAULT;
    this.userData = options.userData ?? null;

    // Initialize AABB
    const boundingBox = CollisionShapes.getBoundingBox(shape, position);
    this.aabb = new AABB(boundingBox.min, boundingBox.max);
  }

  /**
   * Update AABB based on current position
   */
  updateAABB(): void {
    const boundingBox = CollisionShapes.getBoundingBox(this.shape, this.position);
    this.aabb.min.copy(boundingBox.min);
    this.aabb.max.copy(boundingBox.max);
    this.aabb.center = this.aabb.calculateCenter();
    this.aabb.size = this.aabb.calculateSize();
  }

  /**
   * Apply force to the body
   */
  applyForce(force: Vector3): void {
    if (this.isStatic) return;
    this.velocity.add(force.clone().multiplyScalar(1 / this.mass));
  }

  /**
   * Apply impulse to the body
   */
  applyImpulse(impulse: Vector3): void {
    if (this.isStatic) return;
    this.velocity.add(impulse.clone().multiplyScalar(1 / this.mass));
  }

  /**
   * Set velocity
   */
  setVelocity(velocity: Vector3): void {
    this.velocity.copy(velocity);
  }

  /**
   * Get velocity
   */
  getVelocity(): Vector3 {
    return this.velocity.clone();
  }

  /**
   * Set position
   */
  setPosition(position: Vector3): void {
    this.position.copy(position);
    this.updateAABB();
  }

  /**
   * Get position
   */
  getPosition(): Vector3 {
    return this.position.clone();
  }

  /**
   * Get kinetic energy
   */
  getKineticEnergy(): number {
    const speed = this.velocity.length();
    return 0.5 * this.mass * speed * speed;
  }

  /**
   * Get momentum
   */
  getMomentum(): Vector3 {
    return this.velocity.clone().multiplyScalar(this.mass);
  }

  /**
   * Check if body is moving
   */
  isMoving(): boolean {
    return this.velocity.lengthSquared() > 0.001; // Small threshold
  }

  /**
   * Get speed
   */
  getSpeed(): number {
    return this.velocity.length();
  }

  /**
   * Get speed squared (faster than getSpeed)
   */
  getSpeedSquared(): number {
    return this.velocity.lengthSquared();
  }

  /**
   * Clone this physics body
   */
  clone(): PhysicsBody {
    const body = new PhysicsBody(this.position, this.shape, {
      mass: this.mass,
      restitution: this.restitution,
      friction: this.friction,
      isStatic: this.isStatic,
      affectedByGravity: this.affectedByGravity,
      affectedByAirResistance: this.affectedByAirResistance,
      collisionGroup: this.collisionGroup,
      userData: this.userData
    });
    body.velocity.copy(this.velocity);
    return body;
  }

  /**
   * Get string representation
   */
  toString(): string {
    return `PhysicsBody(pos: ${this.position.toString()}, vel: ${this.velocity.toString()}, mass: ${this.mass})`;
  }
}

export interface PhysicsBodyOptions {
  mass: number;
  restitution: number;
  friction: number;
  isStatic: boolean;
  affectedByGravity: boolean;
  affectedByAirResistance: boolean;
  collisionGroup: CollisionGroup;
  userData: any;
}