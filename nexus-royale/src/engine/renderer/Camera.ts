import * as THREE from 'three';
import { Vector3 } from '@/engine/core/math/Vector3';
import { Quaternion } from '@/engine/core/math/Quaternion';

export enum CameraMode {
  FIRST_PERSON = 'first_person',
  THIRD_PERSON = 'third_person',
  FREE_CAM = 'free_cam',
  ORBIT = 'orbit'
}

export interface CameraSettings {
  fov: number;
  near: number;
  far: number;
  aspect: number;
  sensitivity: number;
  smoothness: number;
}

/**
 * Camera system with multiple modes and smooth following
 */
export class Camera {
  private camera: THREE.PerspectiveCamera;
  private mode: CameraMode;
  private settings: CameraSettings;
  
  // Target tracking
  private target: Vector3 | null = null;
  private targetOffset: Vector3 = new Vector3(0, 2, 5);
  private followDistance: number = 5;
  private followHeight: number = 2;
  
  // Smoothing
  private currentPosition: Vector3 = new Vector3();
  private targetPosition: Vector3 = new Vector3();
  private currentRotation: Quaternion = new Quaternion();
  private targetRotation: Quaternion = new Quaternion();
  
  // Input
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMouseLocked: boolean = false;
  
  // Orbit mode
  private orbitRadius: number = 10;
  private orbitAngle: number = 0;
  private orbitHeight: number = 5;

  constructor(settings: Partial<CameraSettings> = {}) {
    this.settings = {
      fov: 75,
      near: 0.1,
      far: 1000,
      aspect: 16 / 9,
      sensitivity: 0.002,
      smoothness: 0.1,
      ...settings
    };

    this.mode = CameraMode.THIRD_PERSON;
    this.camera = new THREE.PerspectiveCamera(
      this.settings.fov,
      this.settings.aspect,
      this.settings.near,
      this.settings.far
    );

    this.setupEventListeners();
  }

  /**
   * Setup input event listeners
   */
  private setupEventListeners(): void {
    document.addEventListener('mousemove', (event) => {
      if (this.isMouseLocked) {
        this.mouseX += event.movementX * this.settings.sensitivity;
        this.mouseY += event.movementY * this.settings.sensitivity;
        
        // Clamp vertical rotation
        this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isMouseLocked = document.pointerLockElement !== null;
    });
  }

  /**
   * Update camera
   */
  update(deltaTime: number): void {
    const smoothFactor = Math.min(1, this.settings.smoothness / deltaTime);

    switch (this.mode) {
      case CameraMode.FIRST_PERSON:
        this.updateFirstPerson(smoothFactor);
        break;
      case CameraMode.THIRD_PERSON:
        this.updateThirdPerson(smoothFactor);
        break;
      case CameraMode.FREE_CAM:
        this.updateFreeCam(smoothFactor);
        break;
      case CameraMode.ORBIT:
        this.updateOrbit(smoothFactor);
        break;
    }

    // Apply smoothing
    this.currentPosition.lerp(this.targetPosition, smoothFactor);
    this.currentRotation.slerp(this.targetRotation, smoothFactor);

    // Update Three.js camera
    this.camera.position.copy(this.currentPosition);
    this.camera.quaternion.copy(this.currentRotation);
    this.camera.updateMatrixWorld();
  }

  /**
   * Update first-person camera
   */
  private updateFirstPerson(smoothFactor: number): void {
    if (!this.target) return;

    // Position camera at target position
    this.targetPosition.copy(this.target);
    this.targetPosition.y += 1.8; // Eye height

    // Calculate rotation from mouse input
    const rotationX = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), this.mouseX);
    const rotationY = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), this.mouseY);
    this.targetRotation.copy(rotationX).multiply(rotationY);
  }

  /**
   * Update third-person camera
   */
  private updateThirdPerson(smoothFactor: number): void {
    if (!this.target) return;

    // Calculate desired camera position
    const forward = new Vector3(0, 0, -1).applyQuaternion(this.targetRotation);
    const right = new Vector3(1, 0, 0).applyQuaternion(this.targetRotation);
    const up = new Vector3(0, 1, 0);

    // Position camera behind target
    this.targetPosition.copy(this.target);
    this.targetPosition.add(forward.clone().multiplyScalar(this.followDistance));
    this.targetPosition.add(up.clone().multiplyScalar(this.followHeight));

    // Look at target
    const lookDirection = this.target.clone().sub(this.targetPosition).normalize();
    this.targetRotation.setFromUnitVectors(new Vector3(0, 0, 1), lookDirection);
  }

  /**
   * Update free camera
   */
  private updateFreeCam(smoothFactor: number): void {
    // Free camera doesn't follow target
    // Rotation is controlled by mouse
    const rotationX = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), this.mouseX);
    const rotationY = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), this.mouseY);
    this.targetRotation.copy(rotationX).multiply(rotationY);
  }

  /**
   * Update orbit camera
   */
  private updateOrbit(smoothFactor: number): void {
    if (!this.target) return;

    // Calculate orbit position
    const x = this.target.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    const z = this.target.z + Math.sin(this.orbitAngle) * this.orbitRadius;
    const y = this.target.y + this.orbitHeight;

    this.targetPosition.set(x, y, z);

    // Look at target
    const lookDirection = this.target.clone().sub(this.targetPosition).normalize();
    this.targetRotation.setFromUnitVectors(new Vector3(0, 0, 1), lookDirection);
  }

  /**
   * Set camera position
   */
  setPosition(position: Vector3): void {
    this.currentPosition.copy(position);
    this.targetPosition.copy(position);
  }

  /**
   * Set camera target
   */
  setTarget(target: Vector3): void {
    this.target = target.clone();
  }

  /**
   * Set camera mode
   */
  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  /**
   * Set camera aspect ratio
   */
  setAspect(aspect: number): void {
    this.settings.aspect = aspect;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Set field of view
   */
  setFOV(fov: number): void {
    this.settings.fov = fov;
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Set mouse sensitivity
   */
  setSensitivity(sensitivity: number): void {
    this.settings.sensitivity = sensitivity;
  }

  /**
   * Set smoothing factor
   */
  setSmoothness(smoothness: number): void {
    this.settings.smoothness = smoothness;
  }

  /**
   * Set follow distance (third-person mode)
   */
  setFollowDistance(distance: number): void {
    this.followDistance = distance;
  }

  /**
   * Set follow height (third-person mode)
   */
  setFollowHeight(height: number): void {
    this.followHeight = height;
  }

  /**
   * Set orbit radius (orbit mode)
   */
  setOrbitRadius(radius: number): void {
    this.orbitRadius = radius;
  }

  /**
   * Set orbit angle (orbit mode)
   */
  setOrbitAngle(angle: number): void {
    this.orbitAngle = angle;
  }

  /**
   * Look at a point
   */
  lookAt(point: Vector3): void {
    const lookDirection = point.clone().sub(this.currentPosition).normalize();
    this.targetRotation.setFromUnitVectors(new Vector3(0, 0, 1), lookDirection);
  }

  /**
   * Get camera position
   */
  getPosition(): Vector3 {
    return this.currentPosition.clone();
  }

  /**
   * Get camera rotation
   */
  getRotation(): Quaternion {
    return this.currentRotation.clone();
  }

  /**
   * Get camera forward direction
   */
  getForward(): Vector3 {
    return new Vector3(0, 0, -1).applyQuaternion(this.currentRotation);
  }

  /**
   * Get camera right direction
   */
  getRight(): Vector3 {
    return new Vector3(1, 0, 0).applyQuaternion(this.currentRotation);
  }

  /**
   * Get camera up direction
   */
  getUp(): Vector3 {
    return new Vector3(0, 1, 0).applyQuaternion(this.currentRotation);
  }

  /**
   * Get Three.js camera
   */
  getThreeCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get camera mode
   */
  getMode(): CameraMode {
    return this.mode;
  }

  /**
   * Get camera settings
   */
  getSettings(): CameraSettings {
    return { ...this.settings };
  }

  /**
   * Check if mouse is locked
   */
  isMouseLocked(): boolean {
    return this.isMouseLocked;
  }

  /**
   * Request pointer lock
   */
  requestPointerLock(): void {
    document.body.requestPointerLock();
  }

  /**
   * Exit pointer lock
   */
  exitPointerLock(): void {
    document.exitPointerLock();
  }

  /**
   * Get camera frustum for culling
   */
  getFrustum(): THREE.Frustum {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);
    return frustum;
  }

  /**
   * Check if object is in view frustum
   */
  isInFrustum(object: THREE.Object3D): boolean {
    const frustum = this.getFrustum();
    const sphere = new THREE.Sphere();
    object.updateMatrixWorld();
    
    // Get bounding sphere
    const geometry = (object as any).geometry;
    if (geometry && geometry.boundingSphere) {
      sphere.copy(geometry.boundingSphere);
      sphere.applyMatrix4(object.matrixWorld);
    } else {
      // Fallback: create sphere from object position
      sphere.setFromObject(object);
    }
    
    return frustum.intersectsSphere(sphere);
  }

  /**
   * Get camera statistics
   */
  getStats(): any {
    return {
      mode: this.mode,
      position: this.currentPosition,
      target: this.target,
      mouseLocked: this.isMouseLocked,
      settings: this.settings
    };
  }
}