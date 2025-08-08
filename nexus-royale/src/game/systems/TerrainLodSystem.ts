import type { System, SystemContext } from '@/engine/core/ecs/System';
import { Renderer } from '@/engine/renderer/Renderer';
import type { TerrainChunk } from '@/game/environment/terrain/LodTerrain';
import { LodController } from '@/engine/renderer/lod/LodController';

export function createTerrainLodSystem(renderer: Renderer, chunks: TerrainChunk[], getLastFrameMs: () => number): System {
  const lodCtrl = new LodController();
  return {
    name: 'TerrainLodSystem',
    priority: 41,
    update() {
      const cam = renderer.getCamera();
      const camPos = cam.position;
      const lastMs = getLastFrameMs();
      for (const c of chunks) {
        const dx = c.center.x - camPos.x; const dz = c.center.z - camPos.z;
        const dist = Math.hypot(dx, dz);
        const lod = lodCtrl.computeLod(dist, lastMs);
        if (lod !== c.lod) {
          c.lod = lod;
          // Placeholder: adjust mesh detail flags; real impl would swap geometry/materials
          c.mesh.userData.lod = lod;
        }
      }
    }
  };
}