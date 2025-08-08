import * as THREE from 'three';
import { Vector3 } from '@/engine/core/math/Vector3';
import { Quaternion } from '@/engine/core/math/Quaternion';
import { Scene } from './Scene';
import { Camera } from './Camera';

export interface EntityVisual {
  mesh: THREE.Object3D;
  type: string;
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  visible: boolean;
  lod: number;
}

export interface EntityType {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  scale: Vector3;
  castShadow: boolean;
  receiveShadow: boolean;
}

/**
 * Entity renderer for game objects
 */
export class EntityRenderer {
  private scene: Scene;
  private camera: Camera;
  private entities: Map<string, EntityVisual> = new Map();
  private entityTypes: Map<string, EntityType> = new Map();
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();

  constructor(scene: Scene, camera: Camera) {
    this.scene = scene;
    this.camera = camera;
    this.initializeEntityTypes();
  }

  /**
   * Initialize default entity types
   */
  private initializeEntityTypes(): void {
    // Player entity type
    this.createEntityType('player', {
      geometry: new THREE.CapsuleGeometry(0.5, 1, 4, 8),
      material: new THREE.MeshLambertMaterial({ color: 0x00ff00 }),
      scale: new Vector3(1, 1, 1),
      castShadow: true,
      receiveShadow: true
    });

    // AI entity type
    this.createEntityType('ai', {
      geometry: new THREE.CapsuleGeometry(0.5, 1, 4, 8),
      material: new THREE.MeshLambertMaterial({ color: 0xff0000 }),
      scale: new Vector3(1, 1, 1),
      castShadow: true,
      receiveShadow: true
    });

    // Projectile entity type
    this.createEntityType('projectile', {
      geometry: new THREE.SphereGeometry(0.1, 8, 8),
      material: new THREE.MeshBasicMaterial({ color: 0xffff00 }),
      scale: new Vector3(1, 1, 1),
      castShadow: false,
      receiveShadow: false
    });

    // Weapon entity type
    this.createEntityType('weapon', {
      geometry: new THREE.BoxGeometry(0.1, 0.1, 0.8),
      material: new THREE.MeshLambertMaterial({ color: 0x333333 }),
      scale: new Vector3(1, 1, 1),
      castShadow: true,
      receiveShadow: true
    });
  }

  /**
   * Create entity type
   */
  createEntityType(type: string, config: EntityType): void {
    this.entityTypes.set(type, config);
  }

  /**
   * Add entity to render
   */
  addEntity(entityId: string, entityType: string, position: Vector3, rotation: Quaternion = new Quaternion()): void {
    const typeConfig = this.entityTypes.get(entityType);
    if (!typeConfig) {
      console.warn(`Unknown entity type: ${entityType}`);
      return;
    }

    const mesh = new THREE.Mesh(typeConfig.geometry, typeConfig.material);
    mesh.position.copy(position);
    mesh.quaternion.copy(rotation);
    mesh.scale.copy(typeConfig.scale);
    mesh.castShadow = typeConfig.castShadow;
    mesh.receiveShadow = typeConfig.receiveShadow;

    const visual: EntityVisual = {
      mesh,
      type: entityType,
      position: position.clone(),
      rotation: rotation.clone(),
      scale: typeConfig.scale.clone(),
      visible: true,
      lod: 0
    };

    this.entities.set(entityId, visual);
    this.scene.add(mesh);
  }

  /**
   * Update entity
   */
  updateEntity(entityId: string, position: Vector3, rotation: Quaternion): void {
    const visual = this.entities.get(entityId);
    if (!visual) return;

    visual.position.copy(position);
    visual.rotation.copy(rotation);
    
    visual.mesh.position.copy(position);
    visual.mesh.quaternion.copy(rotation);
  }

  /**
   * Remove entity
   */
  removeEntity(entityId: string): void {
    const visual = this.entities.get(entityId);
    if (!visual) return;

    this.scene.remove(visual.mesh);
    this.entities.delete(entityId);
  }

  /**
   * Update renderer
   */
  update(deltaTime: number): void {
    this.updateLOD();
    this.updateVisibility();
  }

  /**
   * Update level of detail
   */
  private updateLOD(): void {
    const cameraPosition = this.camera.getPosition();

    for (const [entityId, visual] of this.entities) {
      const distance = cameraPosition.distanceTo(visual.position);
      const newLOD = this.getOptimalLOD(distance, visual.type);
      
      if (newLOD !== visual.lod) {
        this.updateEntityLOD(visual, newLOD);
      }
    }
  }

  /**
   * Get optimal LOD level
   */
  private getOptimalLOD(distance: number, entityType: string): number {
    // Different LOD thresholds for different entity types
    const thresholds = {
      player: [50, 100, 200],
      ai: [50, 100, 200],
      projectile: [20, 50, 100],
      weapon: [30, 80, 150]
    };

    const entityThresholds = thresholds[entityType as keyof typeof thresholds] || [50, 100, 200];

    for (let lod = 0; lod < entityThresholds.length; lod++) {
      if (distance <= entityThresholds[lod]) {
        return lod;
      }
    }

    return entityThresholds.length;
  }

  /**
   * Update entity LOD
   */
  private updateEntityLOD(visual: EntityVisual, newLOD: number): void {
    if (visual.lod === newLOD) return;

    // For now, we'll just update the material quality
    // In a full implementation, you'd swap geometries
    const material = visual.mesh.material as THREE.Material;
    
    if (newLOD === 0) {
      // High quality
      if (material instanceof THREE.MeshLambertMaterial) {
        material.wireframe = false;
      }
    } else if (newLOD === 1) {
      // Medium quality
      if (material instanceof THREE.MeshLambertMaterial) {
        material.wireframe = false;
      }
    } else {
      // Low quality - wireframe
      if (material instanceof THREE.MeshLambertMaterial) {
        material.wireframe = true;
      }
    }

    visual.lod = newLOD;
  }

  /**
   * Update entity visibility
   */
  private updateVisibility(): void {
    const frustum = this.camera.getFrustum();

    for (const [entityId, visual] of this.entities) {
      const isVisible = this.camera.isInFrustum(visual.mesh);
      visual.visible = isVisible;
      visual.mesh.visible = isVisible;
    }
  }

  /**
   * Create explosion effect for entity
   */
  createExplosionEffect(entityId: string, radius: number = 5): void {
    const visual = this.entities.get(entityId);
    if (!visual) return;

    // Create explosion geometry
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.8
    });

    const explosion = new THREE.Mesh(geometry, material);
    explosion.position.copy(visual.position);
    this.scene.add(explosion);

    // Animate explosion
    let scale = 0.1;
    const animate = () => {
      scale += 0.1;
      explosion.scale.setScalar(scale);
      material.opacity = Math.max(0, 0.8 - scale * 0.1);

      if (scale < 2) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(explosion);
        geometry.dispose();
        material.dispose();
      }
    };

    animate();
  }

  /**
   * Create muzzle flash effect
   */
  createMuzzleFlash(entityId: string, direction: Vector3): void {
    const visual = this.entities.get(entityId);
    if (!visual) return;

    // Create muzzle flash geometry
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 1.0
    });

    const flash = new THREE.Mesh(geometry, material);
    flash.position.copy(visual.position);
    flash.position.add(direction.clone().multiplyScalar(1.5));
    this.scene.add(flash);

    // Animate flash
    let time = 0;
    const animate = () => {
      time += 0.1;
      flash.scale.setScalar(1 + time);
      material.opacity = Math.max(0, 1 - time);

      if (time < 1) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(flash);
        geometry.dispose();
        material.dispose();
      }
    };

    animate();
  }

  /**
   * Create trail effect for projectile
   */
  createTrailEffect(entityId: string, trailPoints: Vector3[]): void {
    const visual = this.entities.get(entityId);
    if (!visual || visual.type !== 'projectile') return;

    if (trailPoints.length < 2) return;

    // Create trail geometry
    const positions: number[] = [];
    for (const point of trailPoints) {
      positions.push(point.x, point.y, point.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.5
    });

    const trail = new THREE.Line(geometry, material);
    this.scene.add(trail);

    // Fade out trail
    setTimeout(() => {
      this.scene.remove(trail);
      geometry.dispose();
      material.dispose();
    }, 1000);
  }

  /**
   * Set entity color
   */
  setEntityColor(entityId: string, color: THREE.Color): void {
    const visual = this.entities.get(entityId);
    if (!visual) return;

    const material = visual.mesh.material as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial;
    if (material) {
      material.color = color;
    }
  }

  /**
   * Set entity scale
   */
  setEntityScale(entityId: string, scale: Vector3): void {
    const visual = this.entities.get(entityId);
    if (!visual) return;

    visual.scale.copy(scale);
    visual.mesh.scale.copy(scale);
  }

  /**
   * Get entity visual
   */
  getEntityVisual(entityId: string): EntityVisual | null {
    return this.entities.get(entityId) || null;
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type: string): EntityVisual[] {
    const entities: EntityVisual[] = [];
    for (const visual of this.entities.values()) {
      if (visual.type === type) {
        entities.push(visual);
      }
    }
    return entities;
  }

  /**
   * Get entity statistics
   */
  getStats(): any {
    const stats = {
      totalEntities: this.entities.size,
      byType: {} as Record<string, number>,
      visible: 0,
      totalTriangles: 0
    };

    for (const visual of this.entities.values()) {
      // Count by type
      stats.byType[visual.type] = (stats.byType[visual.type] || 0) + 1;
      
      // Count visible
      if (visual.visible) {
        stats.visible++;
      }

      // Count triangles
      const geometry = (visual.mesh as THREE.Mesh).geometry;
      if (geometry) {
        if (geometry.index) {
          stats.totalTriangles += geometry.index.count / 3;
        } else {
          stats.totalTriangles += geometry.attributes.position.count / 3;
        }
      }
    }

    return stats;
  }

  /**
   * Dispose of renderer resources
   */
  dispose(): void {
    for (const visual of this.entities.values()) {
      this.scene.remove(visual.mesh);
      const geometry = (visual.mesh as THREE.Mesh).geometry;
      const material = visual.mesh.material;
      
      if (geometry) {
        geometry.dispose();
      }
      if (material) {
        if (Array.isArray(material)) {
          material.forEach(m => m.dispose());
        } else {
          material.dispose();
        }
      }
    }

    this.entities.clear();
  }
}