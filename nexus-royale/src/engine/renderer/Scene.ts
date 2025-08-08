import * as THREE from 'three';
import { Vector3 } from '@/engine/core/math/Vector3';

export interface LightingSettings {
  ambientIntensity: number;
  directionalIntensity: number;
  shadowMapSize: number;
  shadowBias: number;
  shadowRadius: number;
}

export interface EnvironmentSettings {
  skyColor: THREE.Color;
  groundColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  fogNear: number;
  fogFar: number;
}

/**
 * Scene management with lighting and environment
 */
export class Scene {
  private scene: THREE.Scene;
  private lighting: LightingSettings;
  private environment: EnvironmentSettings;
  
  // Lighting
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private hemisphereLight: THREE.HemisphereLight;
  
  // Environment
  private skybox: THREE.Mesh | null = null;
  private fog: THREE.Fog | null = null;
  
  // Time of day
  private timeOfDay: number = 0.5; // 0-1 (0 = midnight, 0.5 = noon)
  private weather: string = 'clear';

  constructor(lighting: Partial<LightingSettings> = {}, environment: Partial<EnvironmentSettings> = {}) {
    this.lighting = {
      ambientIntensity: 0.3,
      directionalIntensity: 1.0,
      shadowMapSize: 2048,
      shadowBias: -0.0001,
      shadowRadius: 1,
      ...lighting
    };

    this.environment = {
      skyColor: new THREE.Color(0x87CEEB),
      groundColor: new THREE.Color(0x8B4513),
      fogColor: new THREE.Color(0xCCCCCC),
      fogDensity: 0.01,
      fogNear: 10,
      fogFar: 1000,
      ...environment
    };

    this.scene = new THREE.Scene();
    this.setupLighting();
    this.setupEnvironment();
  }

  /**
   * Setup scene lighting
   */
  private setupLighting(): void {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x404040, this.lighting.ambientIntensity);
    this.scene.add(this.ambientLight);

    // Directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, this.lighting.directionalIntensity);
    this.directionalLight.position.set(50, 50, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = this.lighting.shadowMapSize;
    this.directionalLight.shadow.mapSize.height = this.lighting.shadowMapSize;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.bias = this.lighting.shadowBias;
    this.directionalLight.shadow.radius = this.lighting.shadowRadius;
    this.scene.add(this.directionalLight);

    // Hemisphere light for better ambient lighting
    this.hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x404040, 0.2);
    this.scene.add(this.hemisphereLight);
  }

  /**
   * Setup scene environment
   */
  private setupEnvironment(): void {
    // Set background
    this.scene.background = this.environment.skyColor;

    // Setup fog
    this.fog = new THREE.Fog(
      this.environment.fogColor,
      this.environment.fogNear,
      this.environment.fogFar
    );
    this.scene.fog = this.fog;

    // Create skybox
    this.createSkybox();
  }

  /**
   * Create skybox
   */
  private createSkybox(): void {
    const geometry = new THREE.SphereGeometry(500, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        weather: { value: 0 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float weather;
        varying vec3 vWorldPosition;
        
        void main() {
          vec3 pos = normalize(vWorldPosition);
          float y = pos.y;
          
          // Sky gradient
          vec3 skyColor = mix(vec3(0.1, 0.2, 0.4), vec3(0.5, 0.7, 1.0), y * 0.5 + 0.5);
          
          // Sun
          float sun = pow(max(0.0, dot(pos, vec3(0.0, 1.0, 0.0))), 32.0);
          skyColor += vec3(1.0, 0.8, 0.6) * sun * 0.5;
          
          // Clouds (simple noise)
          float clouds = sin(pos.x * 10.0 + time) * sin(pos.z * 10.0 + time) * 0.1;
          clouds = max(0.0, clouds);
          skyColor = mix(skyColor, vec3(1.0), clouds * weather);
          
          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
      side: THREE.BackSide
    });

    this.skybox = new THREE.Mesh(geometry, material);
    this.scene.add(this.skybox);
  }

  /**
   * Update scene
   */
  update(deltaTime: number): void {
    // Update skybox
    if (this.skybox && this.skybox.material instanceof THREE.ShaderMaterial) {
      this.skybox.material.uniforms.time.value += deltaTime;
      this.skybox.material.uniforms.weather.value = this.getWeatherIntensity();
    }

    // Update lighting based on time of day
    this.updateLighting();
  }

  /**
   * Update lighting based on time of day
   */
  private updateLighting(): void {
    const time = this.timeOfDay;
    
    // Calculate sun position
    const sunAngle = (time - 0.5) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const sunDistance = 100;
    
    this.directionalLight.position.set(
      Math.cos(sunAngle) * sunDistance,
      Math.max(0, sunHeight * sunDistance),
      Math.sin(sunAngle) * sunDistance
    );

    // Adjust light intensity based on time
    const dayIntensity = Math.max(0, sunHeight);
    this.directionalLight.intensity = this.lighting.directionalIntensity * dayIntensity;
    this.ambientLight.intensity = this.lighting.ambientIntensity * (0.3 + dayIntensity * 0.7);

    // Adjust light color based on time
    if (time < 0.25 || time > 0.75) {
      // Night time - blue tint
      this.directionalLight.color.setHex(0x1a1a2e);
      this.ambientLight.color.setHex(0x16213e);
    } else if (time < 0.4 || time > 0.6) {
      // Sunrise/sunset - orange tint
      this.directionalLight.color.setHex(0xff6b35);
      this.ambientLight.color.setHex(0xff8c42);
    } else {
      // Day time - white light
      this.directionalLight.color.setHex(0xffffff);
      this.ambientLight.color.setHex(0x404040);
    }
  }

  /**
   * Set time of day (0-1)
   */
  setTimeOfDay(time: number): void {
    this.timeOfDay = Math.max(0, Math.min(1, time));
  }

  /**
   * Set weather
   */
  setWeather(weather: string): void {
    this.weather = weather;
  }

  /**
   * Get weather intensity for shaders
   */
  private getWeatherIntensity(): number {
    switch (this.weather) {
      case 'clear': return 0.0;
      case 'cloudy': return 0.3;
      case 'rainy': return 0.6;
      case 'stormy': return 0.8;
      default: return 0.0;
    }
  }

  /**
   * Add object to scene
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Get Three.js scene
   */
  getThreeScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Set lighting settings
   */
  setLightingSettings(settings: Partial<LightingSettings>): void {
    this.lighting = { ...this.lighting, ...settings };
    
    // Update lights
    this.ambientLight.intensity = this.lighting.ambientIntensity;
    this.directionalLight.intensity = this.lighting.directionalIntensity;
    this.directionalLight.shadow.mapSize.width = this.lighting.shadowMapSize;
    this.directionalLight.shadow.mapSize.height = this.lighting.shadowMapSize;
    this.directionalLight.shadow.bias = this.lighting.shadowBias;
    this.directionalLight.shadow.radius = this.lighting.shadowRadius;
  }

  /**
   * Set environment settings
   */
  setEnvironmentSettings(settings: Partial<EnvironmentSettings>): void {
    this.environment = { ...this.environment, ...settings };
    
    // Update scene
    this.scene.background = this.environment.skyColor;
    
    if (this.fog) {
      this.fog.color = this.environment.fogColor;
      this.fog.near = this.environment.fogNear;
      this.fog.far = this.environment.fogFar;
    }
  }

  /**
   * Enable/disable shadows
   */
  setShadowsEnabled(enabled: boolean): void {
    this.directionalLight.castShadow = enabled;
  }

  /**
   * Set shadow quality
   */
  setShadowQuality(quality: 'low' | 'medium' | 'high'): void {
    let mapSize: number;
    let bias: number;
    let radius: number;

    switch (quality) {
      case 'low':
        mapSize = 1024;
        bias = -0.0001;
        radius = 2;
        break;
      case 'medium':
        mapSize = 2048;
        bias = -0.0001;
        radius = 1;
        break;
      case 'high':
        mapSize = 4096;
        bias = -0.00005;
        radius = 0.5;
        break;
    }

    this.directionalLight.shadow.mapSize.width = mapSize;
    this.directionalLight.shadow.mapSize.height = mapSize;
    this.directionalLight.shadow.bias = bias;
    this.directionalLight.shadow.radius = radius;
  }

  /**
   * Get scene statistics
   */
  getStats(): any {
    return {
      objects: this.scene.children.length,
      timeOfDay: this.timeOfDay,
      weather: this.weather,
      lighting: this.lighting,
      environment: this.environment
    };
  }

  /**
   * Dispose of scene resources
   */
  dispose(): void {
    // Dispose of geometries and materials
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    // Clear scene
    this.scene.clear();
  }
}