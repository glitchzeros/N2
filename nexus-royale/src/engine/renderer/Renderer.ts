import * as THREE from 'three';

export class Renderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;

  init(canvas?: HTMLCanvasElement): void {
    const width = typeof window !== 'undefined' ? window.innerWidth : 800;
    const height = typeof window !== 'undefined' ? window.innerHeight : 600;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(width, height, false);
    this.renderer.setClearColor('#0a0a10');

    const aspect = width / height;
    const frustumSize = 20; // simple world units
    const halfW = (frustumSize * aspect) / 2;
    const halfH = frustumSize / 2;
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 1000);
    this.camera.position.set(0, 10, 10);
    this.camera.lookAt(0, 0, 0);

    this.scene = new THREE.Scene();
  }

  getScene(): THREE.Scene {
    if (!this.scene) throw new Error('Renderer not initialized');
    return this.scene;
  }

  getCamera(): THREE.OrthographicCamera {
    if (!this.camera) throw new Error('Renderer not initialized');
    return this.camera;
  }

  render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    if (!this.renderer || !this.camera) return;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const frustumSize = 20;
    const halfW = (frustumSize * aspect) / 2;
    const halfH = frustumSize / 2;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}