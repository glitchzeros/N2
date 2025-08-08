import * as THREE from 'three';
import { Vector3 } from '@/engine/core/math/Vector3';
import { Quaternion } from '@/engine/core/math/Quaternion';
import { Camera } from './Camera';
import { Scene } from './Scene';
import { EntityRenderer } from './EntityRenderer';
import { TerrainRenderer } from './TerrainRenderer';
import { ParticleSystem } from './ParticleSystem';
import { PostProcessing } from './PostProcessing';

export interface RendererOptions {
  antialias: boolean;
  shadowMap: boolean;
  shadowMapType: THREE.ShadowMapType;
  pixelRatio: number;
  maxFPS: number;
  enablePostProcessing: boolean;
}

/**
 * Main renderer for the game
 */
export class Renderer {
  private renderer: THREE.WebGLRenderer;
  private scene: Scene;
  private camera: Camera;
  private entityRenderer: EntityRenderer;
  private terrainRenderer: TerrainRenderer;
  private particleSystem: ParticleSystem;
  private postProcessing: PostProcessing;
  
  private options: RendererOptions;
  private isInitialized: boolean = false;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;

  constructor(container: HTMLElement, options: Partial<RendererOptions> = {}) {
    this.options = {
      antialias: true,
      shadowMap: true,
      shadowMapType: THREE.PCFSoftShadowMap,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      maxFPS: 60,
      enablePostProcessing: true,
      ...options
    };

    this.initializeRenderer(container);
    this.initializeScene();
    this.initializeCamera();
    this.initializeSystems();
  }

  /**
   * Initialize WebGL renderer
   */
  private initializeRenderer(container: HTMLElement): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options.antialias,
      alpha: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.options.pixelRatio);
    this.renderer.shadowMap.enabled = this.options.shadowMap;
    this.renderer.shadowMap.type = this.options.shadowMapType;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    container.appendChild(this.renderer.domElement);

    // Handle resize
    window.addEventListener('resize', () => {
      this.onWindowResize(container);
    });

    this.isInitialized = true;
  }

  /**
   * Initialize scene
   */
  private initializeScene(): void {
    this.scene = new Scene();
  }

  /**
   * Initialize camera
   */
  private initializeCamera(): void {
    this.camera = new Camera();
    this.camera.setPosition(new Vector3(0, 10, 10));
    this.camera.lookAt(new Vector3(0, 0, 0));
  }

  /**
   * Initialize rendering systems
   */
  private initializeSystems(): void {
    this.entityRenderer = new EntityRenderer(this.scene, this.camera);
    this.terrainRenderer = new TerrainRenderer(this.scene);
    this.particleSystem = new ParticleSystem(this.scene);
    
    if (this.options.enablePostProcessing) {
      this.postProcessing = new PostProcessing(this.renderer, this.camera);
    }
  }

  /**
   * Handle window resize
   */
  private onWindowResize(container: HTMLElement): void {
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.setAspect(width / height);
    this.renderer.setSize(width, height);
    
    if (this.postProcessing) {
      this.postProcessing.resize(width, height);
    }
  }

  /**
   * Update renderer
   */
  update(deltaTime: number): void {
    if (!this.isInitialized) return;

    // Update camera
    this.camera.update(deltaTime);

    // Update entity renderer
    this.entityRenderer.update(deltaTime);

    // Update terrain
    this.terrainRenderer.update(deltaTime);

    // Update particles
    this.particleSystem.update(deltaTime);

    // Render scene
    this.render();
  }

  /**
   * Render the scene
   */
  private render(): void {
    if (this.postProcessing) {
      this.postProcessing.render(this.scene, this.camera);
    } else {
      this.renderer.render(this.scene.getThreeScene(), this.camera.getThreeCamera());
    }

    this.frameCount++;
  }

  /**
   * Get Three.js renderer
   */
  getThreeRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get scene
   */
  getScene(): Scene {
    return this.scene;
  }

  /**
   * Get camera
   */
  getCamera(): Camera {
    return this.camera;
  }

  /**
   * Get entity renderer
   */
  getEntityRenderer(): EntityRenderer {
    return this.entityRenderer;
  }

  /**
   * Get terrain renderer
   */
  getTerrainRenderer(): TerrainRenderer {
    return this.terrainRenderer;
  }

  /**
   * Get particle system
   */
  getParticleSystem(): ParticleSystem {
    return this.particleSystem;
  }

  /**
   * Set camera target
   */
  setCameraTarget(target: Vector3): void {
    this.camera.setTarget(target);
  }

  /**
   * Set camera position
   */
  setCameraPosition(position: Vector3): void {
    this.camera.setPosition(position);
  }

  /**
   * Set camera mode
   */
  setCameraMode(mode: string): void {
    this.camera.setMode(mode);
  }

  /**
   * Add entity to render
   */
  addEntity(entityId: string, entityType: string, position: Vector3, rotation: Quaternion = new Quaternion()): void {
    this.entityRenderer.addEntity(entityId, entityType, position, rotation);
  }

  /**
   * Update entity
   */
  updateEntity(entityId: string, position: Vector3, rotation: Quaternion): void {
    this.entityRenderer.updateEntity(entityId, position, rotation);
  }

  /**
   * Remove entity
   */
  removeEntity(entityId: string): void {
    this.entityRenderer.removeEntity(entityId);
  }

  /**
   * Create explosion effect
   */
  createExplosion(position: Vector3, radius: number, intensity: number = 1): void {
    this.particleSystem.createExplosion(position, radius, intensity);
  }

  /**
   * Create muzzle flash
   */
  createMuzzleFlash(position: Vector3, direction: Vector3): void {
    this.particleSystem.createMuzzleFlash(position, direction);
  }

  /**
   * Create impact effect
   */
  createImpact(position: Vector3, normal: Vector3, material: string = 'default'): void {
    this.particleSystem.createImpact(position, normal, material);
  }

  /**
   * Set time of day
   */
  setTimeOfDay(time: number): void {
    this.scene.setTimeOfDay(time);
  }

  /**
   * Set weather
   */
  setWeather(weather: string): void {
    this.scene.setWeather(weather);
  }

  /**
   * Get renderer statistics
   */
  getStats(): any {
    const info = this.renderer.info;
    
    return {
      frameCount: this.frameCount,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      calls: info.render.calls,
      memory: {
        geometries: info.memory.geometries,
        textures: info.memory.textures
      },
      programs: info.programs?.length || 0
    };
  }

  /**
   * Enable/disable post processing
   */
  setPostProcessingEnabled(enabled: boolean): void {
    if (enabled && !this.postProcessing) {
      this.postProcessing = new PostProcessing(this.renderer, this.camera);
    } else if (!enabled && this.postProcessing) {
      this.postProcessing.dispose();
      this.postProcessing = null;
    }
  }

  /**
   * Set render quality
   */
  setQuality(quality: 'low' | 'medium' | 'high' | 'ultra'): void {
    switch (quality) {
      case 'low':
        this.renderer.setPixelRatio(0.5);
        this.options.enablePostProcessing = false;
        break;
      case 'medium':
        this.renderer.setPixelRatio(1);
        this.options.enablePostProcessing = false;
        break;
      case 'high':
        this.renderer.setPixelRatio(1.5);
        this.options.enablePostProcessing = true;
        break;
      case 'ultra':
        this.renderer.setPixelRatio(2);
        this.options.enablePostProcessing = true;
        break;
    }

    this.setPostProcessingEnabled(this.options.enablePostProcessing);
  }

  /**
   * Dispose of renderer resources
   */
  dispose(): void {
    this.entityRenderer.dispose();
    this.terrainRenderer.dispose();
    this.particleSystem.dispose();
    
    if (this.postProcessing) {
      this.postProcessing.dispose();
    }

    this.renderer.dispose();
    this.isInitialized = false;
  }
}