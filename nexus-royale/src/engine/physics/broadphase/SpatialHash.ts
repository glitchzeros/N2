export type AABB = { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number };

export class SpatialHash {
  private readonly cellSize: number;
  private readonly map: Map<string, Set<number>> = new Map();
  private readonly entityToKeys: Map<number, string[]> = new Map();

  constructor(cellSize = 2) {
    this.cellSize = cellSize;
  }

  private key(ix: number, iy: number, iz: number): string { return `${ix},${iy},${iz}`; }

  private cellCoord(v: number): number { return Math.floor(v / this.cellSize); }

  insert(entityId: number, box: AABB): void {
    this.remove(entityId);
    const keys: string[] = [];
    const minX = this.cellCoord(box.minX), minY = this.cellCoord(box.minY), minZ = this.cellCoord(box.minZ);
    const maxX = this.cellCoord(box.maxX), maxY = this.cellCoord(box.maxY), maxZ = this.cellCoord(box.maxZ);
    for (let ix = minX; ix <= maxX; ix++) {
      for (let iy = minY; iy <= maxY; iy++) {
        for (let iz = minZ; iz <= maxZ; iz++) {
          const k = this.key(ix, iy, iz);
          let set = this.map.get(k);
          if (!set) { set = new Set(); this.map.set(k, set); }
          set.add(entityId);
          keys.push(k);
        }
      }
    }
    this.entityToKeys.set(entityId, keys);
  }

  remove(entityId: number): void {
    const keys = this.entityToKeys.get(entityId);
    if (!keys) return;
    for (const k of keys) {
      const set = this.map.get(k);
      if (!set) continue;
      set.delete(entityId);
      if (set.size === 0) this.map.delete(k);
    }
    this.entityToKeys.delete(entityId);
  }

  query(box: AABB): number[] {
    const result = new Set<number>();
    const minX = this.cellCoord(box.minX), minY = this.cellCoord(box.minY), minZ = this.cellCoord(box.minZ);
    const maxX = this.cellCoord(box.maxX), maxY = this.cellCoord(box.maxY), maxZ = this.cellCoord(box.maxZ);
    for (let ix = minX; ix <= maxX; ix++) {
      for (let iy = minY; iy <= maxY; iy++) {
        for (let iz = minZ; iz <= maxZ; iz++) {
          const k = this.key(ix, iy, iz);
          const set = this.map.get(k);
          if (!set) continue;
          for (const e of set) result.add(e);
        }
      }
    }
    return Array.from(result);
  }
}