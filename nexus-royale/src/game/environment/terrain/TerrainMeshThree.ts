import * as THREE from 'three';
import { createFlatShadedMaterial } from '@/engine/renderer/pipelines/FlatShadedMaterial';
import type { TerrainMesh } from '@/game/environment/terrain/TerrainGenerator';

export function buildTerrainMesh(data: TerrainMesh): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
  geometry.computeBoundingSphere();
  const material = createFlatShadedMaterial({ color: '#1a1a2e', accent: '#e94560' });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = true;
  return mesh;
}