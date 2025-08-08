import type { System, SystemContext } from '@/engine/core/ecs/System';
import { Renderer } from '@/engine/renderer/Renderer';
import * as THREE from 'three';
import { FrustumCuller } from '@/engine/renderer/culling/FrustumCuller';

export function createVisibilitySystem(renderer: Renderer, targets: Array<{ mesh: THREE.Object3D; center: THREE.Vector3; radius: number }>): System {
  const culler = new FrustumCuller();
  return {
    name: 'VisibilitySystem',
    priority: 40,
    update() {
      const cam = renderer.getCamera();
      culler.update(cam);
      for (const t of targets) {
        const visible = culler.isSphereVisible(t.center, t.radius);
        t.mesh.visible = visible;
      }
    }
  };
}