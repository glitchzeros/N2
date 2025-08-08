import { Vector3 } from '@/engine/core/math/Vector3';
import { AABB } from './AABB';
import { CollisionShape } from './CollisionShape';
import { PhysicsBody } from './PhysicsBody';
import { SpatialHash } from './SpatialHash';

/**
 * High-performance physics world for collision detection and simulation
 */
export class PhysicsWorld {
  private bodies: PhysicsBody[] = [];
  private spatialHash: SpatialHash;
  private gravity: Vector3;
  private airResistance: number;
  private maxSteps: number;
  private timeStep: number;

  constructor() {
    this.spatialHash = new SpatialHash(10); // 10 unit cell size
    this.gravity = new Vector3(0, -9.81, 0); // Earth gravity
    this.airResistance = 0.02; // Air resistance coefficient
    this.maxSteps = 10; // Maximum physics steps per frame
    this.timeStep = 1 / 60; // 60 FPS physics
  }

  /**
   * Add a physics body to the world
   */
  addBody(body: PhysicsBody): void {
    this.bodies.push(body);
    this.spatialHash.addBody(body);
  }

  /**
   * Remove a physics body from the world
   */
  removeBody(body: PhysicsBody): void {
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
      this.spatialHash.removeBody(body);
    }
  }

  /**
   * Update physics simulation
   */
  update(deltaTime: number): void {
    // Calculate number of physics steps
    const steps = Math.min(Math.ceil(deltaTime / this.timeStep), this.maxSteps);
    const stepTime = deltaTime / steps;

    for (let i = 0; i < steps; i++) {
      this.step(stepTime);
    }
  }

  /**
   * Single physics step
   */
  private step(deltaTime: number): void {
    // Update spatial hash
    this.spatialHash.clear();
    for (const body of this.bodies) {
      this.spatialHash.addBody(body);
    }

    // Apply forces and update velocities
    for (const body of this.bodies) {
      if (body.isStatic) continue;

      // Apply gravity
      if (body.affectedByGravity) {
        body.velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
      }

      // Apply air resistance
      if (body.affectedByAirResistance) {
        const speed = body.velocity.length();
        if (speed > 0) {
          const dragForce = body.velocity.clone().normalize().multiplyScalar(-speed * speed * this.airResistance);
          body.velocity.add(dragForce.clone().multiplyScalar(deltaTime));
        }
      }

      // Update position
      body.position.add(body.velocity.clone().multiplyScalar(deltaTime));
      body.updateAABB();
    }

    // Detect and resolve collisions
    this.detectCollisions();
  }

  /**
   * Detect collisions using spatial hashing
   */
  private detectCollisions(): void {
    const collisionPairs: [PhysicsBody, PhysicsBody][] = [];

    // Broad phase - find potential collision pairs
    for (const body of this.bodies) {
      const nearbyBodies = this.spatialHash.getNearbyBodies(body);
      
      for (const other of nearbyBodies) {
        if (body === other) continue;
        if (!body.collisionGroup.canCollideWith(other.collisionGroup)) continue;
        
        // Check AABB overlap
        if (body.aabb.intersects(other.aabb)) {
          collisionPairs.push([body, other]);
        }
      }
    }

    // Narrow phase - detailed collision detection
    for (const [bodyA, bodyB] of collisionPairs) {
      const collision = this.checkCollision(bodyA, bodyB);
      if (collision) {
        this.resolveCollision(bodyA, bodyB, collision);
      }
    }
  }

  /**
   * Check collision between two bodies
   */
  private checkCollision(bodyA: PhysicsBody, bodyB: PhysicsBody): CollisionInfo | null {
    const shapeA = bodyA.shape;
    const shapeB = bodyB.shape;

    // Sphere vs Sphere
    if (shapeA.type === 'sphere' && shapeB.type === 'sphere') {
      return this.checkSphereSphere(bodyA, bodyB);
    }

    // Sphere vs Box
    if (shapeA.type === 'sphere' && shapeB.type === 'box') {
      return this.checkSphereBox(bodyA, bodyB);
    }

    // Box vs Sphere
    if (shapeA.type === 'box' && shapeB.type === 'sphere') {
      const collision = this.checkSphereBox(bodyB, bodyA);
      if (collision) {
        collision.normal.multiplyScalar(-1);
        [collision.bodyA, collision.bodyB] = [collision.bodyB, collision.bodyA];
      }
      return collision;
    }

    // Box vs Box
    if (shapeA.type === 'box' && shapeB.type === 'box') {
      return this.checkBoxBox(bodyA, bodyB);
    }

    return null;
  }

  /**
   * Check collision between two spheres
   */
  private checkSphereSphere(bodyA: PhysicsBody, bodyB: PhysicsBody): CollisionInfo | null {
    const distance = bodyA.position.distanceTo(bodyB.position);
    const radiusSum = bodyA.shape.radius + bodyB.shape.radius;

    if (distance < radiusSum) {
      const normal = bodyB.position.clone().sub(bodyA.position).normalize();
      const penetration = radiusSum - distance;
      
      return {
        bodyA,
        bodyB,
        normal,
        penetration,
        point: bodyA.position.clone().add(normal.clone().multiplyScalar(bodyA.shape.radius))
      };
    }

    return null;
  }

  /**
   * Check collision between sphere and box
   */
  private checkSphereBox(sphere: PhysicsBody, box: PhysicsBody): CollisionInfo | null {
    // Find closest point on box to sphere center
    const closestPoint = this.getClosestPointOnBox(sphere.position, box);
    const distance = sphere.position.distanceTo(closestPoint);

    if (distance < sphere.shape.radius) {
      const normal = sphere.position.clone().sub(closestPoint).normalize();
      const penetration = sphere.shape.radius - distance;

      return {
        bodyA: sphere,
        bodyB: box,
        normal,
        penetration,
        point: closestPoint
      };
    }

    return null;
  }

  /**
   * Check collision between two boxes
   */
  private checkBoxBox(bodyA: PhysicsBody, bodyB: PhysicsBody): CollisionInfo | null {
    const aabbA = bodyA.aabb;
    const aabbB = bodyB.aabb;

    // Check overlap on all axes
    const overlapX = Math.min(aabbA.max.x - aabbB.min.x, aabbB.max.x - aabbA.min.x);
    const overlapY = Math.min(aabbA.max.y - aabbB.min.y, aabbB.max.y - aabbA.min.y);
    const overlapZ = Math.min(aabbA.max.z - aabbB.min.z, aabbB.max.z - aabbA.min.z);

    if (overlapX > 0 && overlapY > 0 && overlapZ > 0) {
      // Find minimum overlap axis
      const overlaps = [overlapX, overlapY, overlapZ];
      const minOverlap = Math.min(...overlaps);
      const axisIndex = overlaps.indexOf(minOverlap);

      const normal = new Vector3();
      normal.setComponent(axisIndex, aabbA.center.getComponent(axisIndex) < aabbB.center.getComponent(axisIndex) ? -1 : 1);

      return {
        bodyA,
        bodyB,
        normal,
        penetration: minOverlap,
        point: aabbA.center.clone()
      };
    }

    return null;
  }

  /**
   * Get closest point on box to a given point
   */
  private getClosestPointOnBox(point: Vector3, box: PhysicsBody): Vector3 {
    const aabb = box.aabb;
    const closest = new Vector3();

    closest.x = Math.max(aabb.min.x, Math.min(point.x, aabb.max.x));
    closest.y = Math.max(aabb.min.y, Math.min(point.y, aabb.max.y));
    closest.z = Math.max(aabb.min.z, Math.min(point.z, aabb.max.z));

    return closest;
  }

  /**
   * Resolve collision between two bodies
   */
  private resolveCollision(bodyA: PhysicsBody, bodyB: PhysicsBody, collision: CollisionInfo): void {
    // Don't resolve collision if both bodies are static
    if (bodyA.isStatic && bodyB.isStatic) return;

    // Separate bodies
    const separation = collision.normal.clone().multiplyScalar(collision.penetration);
    
    if (!bodyA.isStatic && !bodyB.isStatic) {
      // Both bodies are dynamic - separate equally
      const halfSeparation = separation.clone().multiplyScalar(0.5);
      bodyA.position.sub(halfSeparation);
      bodyB.position.add(halfSeparation);
    } else if (!bodyA.isStatic) {
      // Only bodyA is dynamic
      bodyA.position.sub(separation);
    } else if (!bodyB.isStatic) {
      // Only bodyB is dynamic
      bodyB.position.add(separation);
    }

    // Update AABBs
    bodyA.updateAABB();
    bodyB.updateAABB();

    // Resolve velocity (simple elastic collision)
    if (!bodyA.isStatic && !bodyB.isStatic) {
      const relativeVelocity = bodyB.velocity.clone().sub(bodyA.velocity);
      const velocityAlongNormal = relativeVelocity.dot(collision.normal);

      // Don't resolve if bodies are moving apart
      if (velocityAlongNormal > 0) return;

      const restitution = Math.min(bodyA.restitution, bodyB.restitution);
      const j = -(1 + restitution) * velocityAlongNormal;
      const impulse = collision.normal.clone().multiplyScalar(j);

      if (!bodyA.isStatic) {
        bodyA.velocity.sub(impulse.clone().multiplyScalar(1 / bodyA.mass));
      }
      if (!bodyB.isStatic) {
        bodyB.velocity.add(impulse.clone().multiplyScalar(1 / bodyB.mass));
      }
    }
  }

  /**
   * Raycast from origin in direction
   */
  raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult | null {
    const normalizedDirection = direction.clone().normalize();
    const end = origin.clone().add(normalizedDirection.clone().multiplyScalar(maxDistance));

    let closestResult: RaycastResult | null = null;
    let closestDistance = maxDistance;

    for (const body of this.bodies) {
      const result = this.raycastAgainstBody(origin, end, body);
      if (result && result.distance < closestDistance) {
        closestResult = result;
        closestDistance = result.distance;
      }
    }

    return closestResult;
  }

  /**
   * Raycast against a specific body
   */
  private raycastAgainstBody(origin: Vector3, end: Vector3, body: PhysicsBody): RaycastResult | null {
    const shape = body.shape;

    if (shape.type === 'sphere') {
      return this.raycastSphere(origin, end, body);
    } else if (shape.type === 'box') {
      return this.raycastBox(origin, end, body);
    }

    return null;
  }

  /**
   * Raycast against sphere
   */
  private raycastSphere(origin: Vector3, end: Vector3, body: PhysicsBody): RaycastResult | null {
    const sphereCenter = body.position;
    const sphereRadius = body.shape.radius;

    const rayDirection = end.clone().sub(origin);
    const rayLength = rayDirection.length();
    rayDirection.normalize();

    const toSphere = sphereCenter.clone().sub(origin);
    const projectionLength = toSphere.dot(rayDirection);

    if (projectionLength < 0) return null;

    const closestPoint = origin.clone().add(rayDirection.clone().multiplyScalar(projectionLength));
    const distanceToSphere = closestPoint.distanceTo(sphereCenter);

    if (distanceToSphere > sphereRadius) return null;

    const halfChord = Math.sqrt(sphereRadius * sphereRadius - distanceToSphere * distanceToSphere);
    const distance = projectionLength - halfChord;

    if (distance < 0 || distance > rayLength) return null;

    const hitPoint = origin.clone().add(rayDirection.clone().multiplyScalar(distance));
    const normal = hitPoint.clone().sub(sphereCenter).normalize();

    return {
      body,
      point: hitPoint,
      normal,
      distance
    };
  }

  /**
   * Raycast against box
   */
  private raycastBox(origin: Vector3, end: Vector3, body: PhysicsBody): RaycastResult | null {
    const aabb = body.aabb;
    const rayDirection = end.clone().sub(origin);
    const rayLength = rayDirection.length();
    rayDirection.normalize();

    const tMin = (aabb.min.x - origin.x) / rayDirection.x;
    const tMax = (aabb.max.x - origin.x) / rayDirection.x;
    const t1 = Math.min(tMin, tMax);
    const t2 = Math.max(tMin, tMax);

    let tNear = t1;
    let tFar = t2;

    // Y axis
    const tMinY = (aabb.min.y - origin.y) / rayDirection.y;
    const tMaxY = (aabb.max.y - origin.y) / rayDirection.y;
    const t1Y = Math.min(tMinY, tMaxY);
    const t2Y = Math.max(tMinY, tMaxY);

    tNear = Math.max(tNear, t1Y);
    tFar = Math.min(tFar, t2Y);

    // Z axis
    const tMinZ = (aabb.min.z - origin.z) / rayDirection.z;
    const tMaxZ = (aabb.max.z - origin.z) / rayDirection.z;
    const t1Z = Math.min(tMinZ, tMaxZ);
    const t2Z = Math.max(tMinZ, tMaxZ);

    tNear = Math.max(tNear, t1Z);
    tFar = Math.min(tFar, t2Z);

    if (tNear > tFar || tFar < 0 || tNear > rayLength) return null;

    const distance = Math.max(0, tNear);
    const hitPoint = origin.clone().add(rayDirection.clone().multiplyScalar(distance));

    // Calculate normal
    const normal = new Vector3();
    const epsilon = 0.001;
    
    if (Math.abs(hitPoint.x - aabb.min.x) < epsilon) normal.x = -1;
    else if (Math.abs(hitPoint.x - aabb.max.x) < epsilon) normal.x = 1;
    else if (Math.abs(hitPoint.y - aabb.min.y) < epsilon) normal.y = -1;
    else if (Math.abs(hitPoint.y - aabb.max.y) < epsilon) normal.y = 1;
    else if (Math.abs(hitPoint.z - aabb.min.z) < epsilon) normal.z = -1;
    else if (Math.abs(hitPoint.z - aabb.max.z) < epsilon) normal.z = 1;

    return {
      body,
      point: hitPoint,
      normal,
      distance
    };
  }

  /**
   * Set gravity
   */
  setGravity(gravity: Vector3): void {
    this.gravity.copy(gravity);
  }

  /**
   * Get gravity
   */
  getGravity(): Vector3 {
    return this.gravity.clone();
  }

  /**
   * Set air resistance
   */
  setAirResistance(resistance: number): void {
    this.airResistance = resistance;
  }

  /**
   * Get air resistance
   */
  getAirResistance(): number {
    return this.airResistance;
  }

  /**
   * Get all bodies
   */
  getBodies(): PhysicsBody[] {
    return [...this.bodies];
  }

  /**
   * Clear all bodies
   */
  clear(): void {
    this.bodies.length = 0;
    this.spatialHash.clear();
  }
}

export interface CollisionInfo {
  bodyA: PhysicsBody;
  bodyB: PhysicsBody;
  normal: Vector3;
  penetration: number;
  point: Vector3;
}

export interface RaycastResult {
  body: PhysicsBody;
  point: Vector3;
  normal: Vector3;
  distance: number;
}