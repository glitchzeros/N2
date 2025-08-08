import { Vector3 } from '@/engine/core/math/Vector3';
import { Quaternion } from '@/engine/core/math/Quaternion';

/**
 * 3D audio listener for spatial audio
 */
export class AudioListener {
  private context: AudioContext;
  private listener: AudioListener;
  private position: Vector3;
  private velocity: Vector3;
  private orientation: Quaternion;
  private forward: Vector3;
  private up: Vector3;

  constructor(context: AudioContext) {
    this.context = context;
    this.listener = context.listener;
    
    // Initialize position and orientation
    this.position = new Vector3();
    this.velocity = new Vector3();
    this.orientation = new Quaternion();
    this.forward = new Vector3(0, 0, -1);
    this.up = new Vector3(0, 1, 0);

    this.updateListener();
  }

  /**
   * Set listener position
   */
  setPosition(position: Vector3): void {
    this.position.copy(position);
    this.updateListener();
  }

  /**
   * Set listener velocity
   */
  setVelocity(velocity: Vector3): void {
    this.velocity.copy(velocity);
    this.updateListener();
  }

  /**
   * Set listener orientation
   */
  setOrientation(orientation: Quaternion): void {
    this.orientation.copy(orientation);
    
    // Update forward and up vectors
    this.forward = new Vector3(0, 0, -1).applyQuaternion(orientation);
    this.up = new Vector3(0, 1, 0).applyQuaternion(orientation);
    
    this.updateListener();
  }

  /**
   * Set listener forward direction
   */
  setForward(forward: Vector3): void {
    this.forward.copy(forward).normalize();
    this.updateListener();
  }

  /**
   * Set listener up direction
   */
  setUp(up: Vector3): void {
    this.up.copy(up).normalize();
    this.updateListener();
  }

  /**
   * Update Web Audio API listener
   */
  private updateListener(): void {
    // Set position
    this.listener.positionX.value = this.position.x;
    this.listener.positionY.value = this.position.y;
    this.listener.positionZ.value = this.position.z;

    // Set velocity
    this.listener.velocityX.value = this.velocity.x;
    this.listener.velocityY.value = this.velocity.y;
    this.listener.velocityZ.value = this.velocity.z;

    // Set orientation (forward and up vectors)
    this.listener.forwardX.value = this.forward.x;
    this.listener.forwardY.value = this.forward.y;
    this.listener.forwardZ.value = this.forward.z;
    
    this.listener.upX.value = this.up.x;
    this.listener.upY.value = this.up.y;
    this.listener.upZ.value = this.up.z;
  }

  /**
   * Get listener position
   */
  getPosition(): Vector3 {
    return this.position.clone();
  }

  /**
   * Get listener velocity
   */
  getVelocity(): Vector3 {
    return this.velocity.clone();
  }

  /**
   * Get listener orientation
   */
  getOrientation(): Quaternion {
    return this.orientation.clone();
  }

  /**
   * Get forward direction
   */
  getForward(): Vector3 {
    return this.forward.clone();
  }

  /**
   * Get up direction
   */
  getUp(): Vector3 {
    return this.up.clone();
  }

  /**
   * Get right direction
   */
  getRight(): Vector3 {
    return this.forward.clone().cross(this.up).normalize();
  }

  /**
   * Get distance to a point
   */
  getDistanceTo(point: Vector3): number {
    return this.position.distanceTo(point);
  }

  /**
   * Get direction to a point
   */
  getDirectionTo(point: Vector3): Vector3 {
    return point.clone().sub(this.position).normalize();
  }

  /**
   * Check if a point is in front of the listener
   */
  isInFront(point: Vector3): boolean {
    const direction = this.getDirectionTo(point);
    return direction.dot(this.forward) > 0;
  }

  /**
   * Get angle to a point (0 = front, 180 = back)
   */
  getAngleTo(point: Vector3): number {
    const direction = this.getDirectionTo(point);
    const angle = Math.acos(direction.dot(this.forward));
    return angle * (180 / Math.PI);
  }

  /**
   * Get listener statistics
   */
  getStats(): any {
    return {
      position: this.position,
      velocity: this.velocity,
      forward: this.forward,
      up: this.up,
      right: this.getRight()
    };
  }
}