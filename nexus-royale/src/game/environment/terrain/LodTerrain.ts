import * as THREE from 'three';

export type TerrainChunk = {
  mesh: THREE.Object3D;
  center: THREE.Vector3;
  radius: number;
  lod: number;
};

export function createSingleChunk(mesh: THREE.Object3D, width: number, depth: number, scale: number): TerrainChunk {
  const center = new THREE.Vector3((width * scale) / 2, 0, (depth * scale) / 2);
  const radius = Math.hypot(center.x, center.z);
  return { mesh, center, radius, lod: 0 };
}