import * as THREE from 'three';

export class FrustumCuller {
  private frustum = new THREE.Frustum();
  private projView = new THREE.Matrix4();

  update(camera: THREE.Camera): void {
    this.projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projView);
  }

  isSphereVisible(center: THREE.Vector3, radius: number): boolean {
    return this.frustum.intersectsSphere(new THREE.Sphere(center, radius));
  }
}