import { Component } from '@/engine/core/ecs/Component';
import { Vector3 } from '@/engine/core/math/Vector3';
import { Quaternion } from '@/engine/core/math/Quaternion';

/**
 * Transform component for position, rotation, and scale
 */
export class Transform extends Component {
  public position: Vector3;
  public rotation: Quaternion;
  public scale: Vector3;
  public parent: number | null = null;
  public children: number[] = [];

  constructor(
    position: Vector3 = new Vector3(0, 0, 0),
    rotation: Quaternion = new Quaternion(),
    scale: Vector3 = new Vector3(1, 1, 1)
  ) {
    super();
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }

  /**
   * Set position
   */
  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
  }

  /**
   * Set rotation from Euler angles (in radians)
   */
  setRotation(x: number, y: number, z: number): void {
    this.rotation.setFromEuler(x, y, z);
  }

  /**
   * Set scale
   */
  setScale(x: number, y: number, z: number): void {
    this.scale.set(x, y, z);
  }

  /**
   * Translate by the given vector
   */
  translate(vector: Vector3): void {
    this.position.add(vector);
  }

  /**
   * Rotate by the given quaternion
   */
  rotate(quaternion: Quaternion): void {
    this.rotation.multiply(quaternion);
  }

  /**
   * Get forward direction vector
   */
  getForward(): Vector3 {
    return new Vector3(0, 0, -1).applyQuaternion(this.rotation);
  }

  /**
   * Get right direction vector
   */
  getRight(): Vector3 {
    return new Vector3(1, 0, 0).applyQuaternion(this.rotation);
  }

  /**
   * Get up direction vector
   */
  getUp(): Vector3 {
    return new Vector3(0, 1, 0).applyQuaternion(this.rotation);
  }

  /**
   * Look at a target position
   */
  lookAt(target: Vector3): void {
    const direction = target.clone().sub(this.position).normalize();
    this.rotation.setFromUnitVectors(new Vector3(0, 0, -1), direction);
  }

  /**
   * Get distance to another transform
   */
  distanceTo(other: Transform): number {
    return this.position.distanceTo(other.position);
  }

  /**
   * Get squared distance to another transform (faster than distanceTo)
   */
  distanceSquaredTo(other: Transform): number {
    return this.position.distanceSquaredTo(other.position);
  }

  /**
   * Clone this transform
   */
  clone(): Transform {
    return new Transform(
      this.position.clone(),
      this.rotation.clone(),
      this.scale.clone()
    );
  }

  /**
   * Reset to default values
   */
  reset(): void {
    this.position.set(0, 0, 0);
    this.rotation.set(0, 0, 0, 1);
    this.scale.set(1, 1, 1);
    this.parent = null;
    this.children.length = 0;
  }
}