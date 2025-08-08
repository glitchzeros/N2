import * as THREE from 'three';
import type { System, SystemContext } from '@/engine/core/ecs/System';
import { Renderer } from '@/engine/renderer/Renderer';
import { eventBus } from '@/engine/core/events/EventBus';

export function createMuzzleFlashSystem(renderer: Renderer): System {
  type Flash = { light: THREE.PointLight; ttl: number };
  type Tracer = { line: THREE.Line; ttl: number };

  const flashes: Flash[] = [];
  const tracers: Tracer[] = [];

  const scene = () => renderer.getScene();

  const unsubMuzzle = eventBus.on<{ origin: { x: number; y: number; z: number }; dir: { x: number; y: number; z: number } }>('muzzle', (p) => {
    const light = new THREE.PointLight(0xe94560, 2, 8, 2);
    light.position.set(p.origin.x, p.origin.y, p.origin.z);
    scene().add(light);
    flashes.push({ light, ttl: 0.06 });

    const geom = new THREE.BufferGeometry();
    const len = 5;
    const start = new THREE.Vector3(p.origin.x, p.origin.y, p.origin.z);
    const end = new THREE.Vector3(p.origin.x + p.dir.x * len, p.origin.y + p.dir.y * len, p.origin.z + p.dir.z * len);
    const positions = new Float32Array([...start.toArray(), ...end.toArray()]);
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x00f5d4 });
    const line = new THREE.Line(geom, mat);
    scene().add(line);
    tracers.push({ line, ttl: 0.06 });
  });

  return {
    name: 'MuzzleFlashSystem',
    priority: 32,
    update(_ctx: SystemContext, dt: number) {
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.ttl -= dt;
        f.light.intensity *= 0.5;
        if (f.ttl <= 0) {
          scene().remove(f.light);
          f.light.dispose?.();
          flashes.splice(i, 1);
        }
      }
      for (let i = tracers.length - 1; i >= 0; i--) {
        const t = tracers[i];
        t.ttl -= dt;
        (t.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, t.ttl / 0.06);
        (t.line.material as THREE.LineBasicMaterial).transparent = true;
        if (t.ttl <= 0) {
          scene().remove(t.line);
          (t.line.geometry as THREE.BufferGeometry).dispose();
          (t.line.material as THREE.LineBasicMaterial).dispose();
          tracers.splice(i, 1);
        }
      }
    },
    dispose() { unsubMuzzle(); }
  };
}