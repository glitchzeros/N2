import * as THREE from 'three';
import { Camera } from './Camera';

/**
 * Post-processing effects
 */
export class PostProcessing {
  private renderer: THREE.WebGLRenderer;
  private camera: Camera;
  private scene: THREE.Scene;
  private renderTarget: THREE.WebGLRenderTarget;
  private postProcessScene: THREE.Scene;
  private postProcessCamera: THREE.OrthographicCamera;
  private postProcessMaterial: THREE.ShaderMaterial;

  constructor(renderer: THREE.WebGLRenderer, camera: Camera) {
    this.renderer = renderer;
    this.camera = camera;
    
    // Create render target
    this.renderTarget = new THREE.WebGLRenderTarget(
      renderer.domElement.width,
      renderer.domElement.height,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat
      }
    );

    // Create post-process scene
    this.postProcessScene = new THREE.Scene();
    this.postProcessCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create post-process material
    this.postProcessMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        intensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;
        
        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          
          // Simple color grading
          color.rgb = pow(color.rgb, vec3(1.0 / 2.2)); // Gamma correction
          
          // Slight vignette
          vec2 center = vUv - 0.5;
          float vignette = 1.0 - dot(center, center) * 0.5;
          color.rgb *= vignette;
          
          gl_FragColor = color;
        }
      `
    });

    // Create full-screen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, this.postProcessMaterial);
    this.postProcessScene.add(mesh);
  }

  /**
   * Render with post-processing
   */
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    // Render scene to render target
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);

    // Apply post-processing
    this.postProcessMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.postProcessMaterial.uniforms.time.value += 0.016; // Assuming 60 FPS

    this.renderer.render(this.postProcessScene, this.postProcessCamera);
  }

  /**
   * Resize post-processing
   */
  resize(width: number, height: number): void {
    this.renderTarget.setSize(width, height);
  }

  /**
   * Set post-processing intensity
   */
  setIntensity(intensity: number): void {
    this.postProcessMaterial.uniforms.intensity.value = intensity;
  }

  /**
   * Dispose of post-processing resources
   */
  dispose(): void {
    this.renderTarget.dispose();
    this.postProcessMaterial.dispose();
  }
}