import { FrustumCuller } from '@/engine/renderer/culling/FrustumCuller';
import * as THREE from 'three';

test.skip('frustum culling throughput (placeholder)', () => {
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  cam.position.set(0, 10, 10); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const culler = new FrustumCuller();
  culler.update(cam);

  const centers = Array.from({ length: 10000 }, (_, i) => new THREE.Vector3((i%100)-50, 0, Math.floor(i/100)-50));
  const t0 = performance.now();
  let visibleCount = 0;
  for (const c of centers) { if (culler.isSphereVisible(c, 1)) visibleCount++; }
  const t1 = performance.now();
  // eslint-disable-next-line no-console
  console.log('Culling 10k spheres took', Math.round(t1 - t0), 'ms; visible', visibleCount);
});