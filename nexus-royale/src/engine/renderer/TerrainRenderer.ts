import * as THREE from 'three';
import { Vector3 } from '@/engine/core/math/Vector3';
import { Scene } from './Scene';

export interface TerrainSettings {
  size: number;
  resolution: number;
  heightScale: number;
  textureScale: number;
  lodLevels: number;
  seed: number;
}

export interface TerrainChunk {
  mesh: THREE.Mesh;
  position: Vector3;
  size: number;
  lod: number;
  visible: boolean;
}

/**
 * Procedural terrain renderer with LOD system
 */
export class TerrainRenderer {
  private scene: Scene;
  private settings: TerrainSettings;
  private chunks: Map<string, TerrainChunk> = new Map();
  private camera: THREE.Camera | null = null;
  private noise: any; // Simplex noise instance

  constructor(scene: Scene, settings: Partial<TerrainSettings> = {}) {
    this.scene = scene;
    this.settings = {
      size: 1000,
      resolution: 256,
      heightScale: 50,
      textureScale: 1,
      lodLevels: 4,
      seed: Math.random() * 1000,
      ...settings
    };

    this.initializeNoise();
    this.generateTerrain();
  }

  /**
   * Initialize noise generator
   */
  private initializeNoise(): void {
    // Simple noise implementation (would use a proper noise library in production)
    this.noise = {
      noise2D: (x: number, y: number) => {
        return (Math.sin(x * 0.1) + Math.sin(y * 0.1)) * 0.5;
      }
    };
  }

  /**
   * Generate terrain
   */
  private generateTerrain(): void {
    const chunkSize = this.settings.size / Math.pow(2, this.settings.lodLevels - 1);
    const chunksPerSide = Math.pow(2, this.settings.lodLevels - 1);

    for (let x = 0; x < chunksPerSide; x++) {
      for (let z = 0; z < chunksPerSide; z++) {
        const position = new Vector3(
          (x - chunksPerSide / 2) * chunkSize,
          0,
          (z - chunksPerSide / 2) * chunkSize
        );

        this.createChunk(position, chunkSize, this.settings.lodLevels - 1);
      }
    }
  }

  /**
   * Create terrain chunk
   */
  private createChunk(position: Vector3, size: number, lod: number): void {
    const resolution = Math.max(2, this.settings.resolution / Math.pow(2, this.settings.lodLevels - 1 - lod));
    const geometry = this.generateChunkGeometry(position, size, resolution);
    const material = this.createTerrainMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const chunk: TerrainChunk = {
      mesh,
      position: position.clone(),
      size,
      lod,
      visible: true
    };

    const key = `${position.x}_${position.z}_${lod}`;
    this.chunks.set(key, chunk);
    this.scene.add(mesh);
  }

  /**
   * Generate chunk geometry
   */
  private generateChunkGeometry(position: Vector3, size: number, resolution: number): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    const positions = geometry.attributes.position.array as Float32Array;

    // Generate height map
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      
      const worldX = position.x + x + size / 2;
      const worldZ = position.z + z + size / 2;
      
      const height = this.getHeight(worldX, worldZ);
      positions[i + 1] = height;
    }

    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    return geometry;
  }

  /**
   * Get height at world position
   */
  private getHeight(x: number, z: number): number {
    const scale = 0.01;
    const octaves = 4;
    const persistence = 0.5;
    const lacunarity = 2.0;

    let amplitude = 1.0;
    let frequency = 1.0;
    let height = 0.0;

    for (let i = 0; i < octaves; i++) {
      const sampleX = x * scale * frequency;
      const sampleZ = z * scale * frequency;
      
      height += this.noise.noise2D(sampleX, sampleZ) * amplitude;
      
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return height * this.settings.heightScale;
  }

  /**
   * Create terrain material
   */
  private createTerrainMaterial(): THREE.Material {
    return new THREE.ShaderMaterial({
      uniforms: {
        grassColor: { value: new THREE.Color(0x3a5f3a) },
        rockColor: { value: new THREE.Color(0x696969) },
        snowColor: { value: new THREE.Color(0xffffff) },
        textureScale: { value: this.settings.textureScale }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          vHeight = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 grassColor;
        uniform vec3 rockColor;
        uniform vec3 snowColor;
        uniform float textureScale;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vHeight;
        
        void main() {
          // Height-based texturing
          float grassBlend = smoothstep(0.0, 20.0, vHeight);
          float rockBlend = smoothstep(10.0, 40.0, vHeight);
          float snowBlend = smoothstep(30.0, 50.0, vHeight);
          
          vec3 color = mix(grassColor, rockColor, rockBlend);
          color = mix(color, snowColor, snowBlend);
          
          // Slope-based texturing
          float slope = 1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0));
          float rockSlope = smoothstep(0.3, 0.7, slope);
          color = mix(color, rockColor, rockSlope);
          
          // Simple noise for variation
          float noise = sin(vPosition.x * 0.1) * sin(vPosition.z * 0.1) * 0.1;
          color += vec3(noise);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
  }

  /**
   * Update terrain LOD based on camera position
   */
  update(camera: THREE.Camera): void {
    this.camera = camera;
    this.updateLOD();
  }

  /**
   * Update level of detail
   */
  private updateLOD(): void {
    if (!this.camera) return;

    const cameraPosition = new Vector3(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z
    );

    for (const [key, chunk] of this.chunks) {
      const distance = cameraPosition.distanceTo(chunk.position);
      const optimalLOD = this.getOptimalLOD(distance, chunk.size);
      
      if (optimalLOD !== chunk.lod) {
        this.updateChunkLOD(chunk, optimalLOD);
      }

      // Frustum culling
      chunk.visible = this.isChunkVisible(chunk);
      chunk.mesh.visible = chunk.visible;
    }
  }

  /**
   * Get optimal LOD level based on distance
   */
  private getOptimalLOD(distance: number, chunkSize: number): number {
    const maxDistance = this.settings.size * 0.5;
    const normalizedDistance = distance / maxDistance;
    
    for (let lod = 0; lod < this.settings.lodLevels; lod++) {
      const threshold = Math.pow(0.5, lod);
      if (normalizedDistance <= threshold) {
        return lod;
      }
    }
    
    return this.settings.lodLevels - 1;
  }

  /**
   * Update chunk LOD
   */
  private updateChunkLOD(chunk: TerrainChunk, newLOD: number): void {
    if (chunk.lod === newLOD) return;

    // Remove old mesh
    this.scene.remove(chunk.mesh);
    chunk.mesh.geometry.dispose();
    (chunk.mesh.material as THREE.Material).dispose();

    // Create new mesh with different LOD
    const newSize = chunk.size * Math.pow(2, newLOD - chunk.lod);
    const newResolution = Math.max(2, this.settings.resolution / Math.pow(2, this.settings.lodLevels - 1 - newLOD));
    
    const geometry = this.generateChunkGeometry(chunk.position, newSize, newResolution);
    const material = this.createTerrainMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    chunk.mesh = mesh;
    chunk.size = newSize;
    chunk.lod = newLOD;

    this.scene.add(mesh);
  }

  /**
   * Check if chunk is visible in camera frustum
   */
  private isChunkVisible(chunk: TerrainChunk): boolean {
    if (!this.camera) return true;

    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);

    const boundingSphere = new THREE.Sphere(
      new THREE.Vector3(chunk.position.x, chunk.position.y, chunk.position.z),
      chunk.size * 0.7
    );

    return frustum.intersectsSphere(boundingSphere);
  }

  /**
   * Get height at world position (for physics)
   */
  getHeightAt(x: number, z: number): number {
    return this.getHeight(x, z);
  }

  /**
   * Get normal at world position
   */
  getNormalAt(x: number, z: number): Vector3 {
    const delta = 1.0;
    const h1 = this.getHeight(x - delta, z);
    const h2 = this.getHeight(x + delta, z);
    const h3 = this.getHeight(x, z - delta);
    const h4 = this.getHeight(x, z + delta);

    const normal = new Vector3(
      h1 - h2,
      2 * delta,
      h3 - h4
    ).normalize();

    return normal;
  }

  /**
   * Set terrain settings
   */
  setSettings(settings: Partial<TerrainSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.regenerateTerrain();
  }

  /**
   * Regenerate terrain
   */
  private regenerateTerrain(): void {
    // Remove existing chunks
    for (const chunk of this.chunks.values()) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      (chunk.mesh.material as THREE.Material).dispose();
    }
    this.chunks.clear();

    // Generate new terrain
    this.generateTerrain();
  }

  /**
   * Get terrain statistics
   */
  getStats(): any {
    let totalTriangles = 0;
    let visibleChunks = 0;

    for (const chunk of this.chunks.values()) {
      if (chunk.visible) {
        visibleChunks++;
        const geometry = chunk.mesh.geometry;
        if (geometry.index) {
          totalTriangles += geometry.index.count / 3;
        } else {
          totalTriangles += geometry.attributes.position.count / 3;
        }
      }
    }

    return {
      totalChunks: this.chunks.size,
      visibleChunks,
      totalTriangles,
      settings: this.settings
    };
  }

  /**
   * Dispose of terrain resources
   */
  dispose(): void {
    for (const chunk of this.chunks.values()) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      (chunk.mesh.material as THREE.Material).dispose();
    }
    this.chunks.clear();
  }
}