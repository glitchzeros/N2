import { PhysicsBody } from './PhysicsBody';
import { Vector3 } from '@/engine/core/math/Vector3';

/**
 * Spatial hash for efficient broad-phase collision detection
 */
export class SpatialHash {
  private cellSize: number;
  private cells: Map<string, PhysicsBody[]>;

  constructor(cellSize: number = 10) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  /**
   * Get cell key for a position
   */
  private getCellKey(position: Vector3): string {
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    const z = Math.floor(position.z / this.cellSize);
    return `${x},${y},${z}`;
  }

  /**
   * Get cell keys for an AABB
   */
  private getCellKeysForAABB(body: PhysicsBody): string[] {
    const keys: string[] = [];
    const aabb = body.aabb;

    const minX = Math.floor(aabb.min.x / this.cellSize);
    const maxX = Math.floor(aabb.max.x / this.cellSize);
    const minY = Math.floor(aabb.min.y / this.cellSize);
    const maxY = Math.floor(aabb.max.y / this.cellSize);
    const minZ = Math.floor(aabb.min.z / this.cellSize);
    const maxZ = Math.floor(aabb.max.z / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          keys.push(`${x},${y},${z}`);
        }
      }
    }

    return keys;
  }

  /**
   * Add a body to the spatial hash
   */
  addBody(body: PhysicsBody): void {
    const keys = this.getCellKeysForAABB(body);

    for (const key of keys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, []);
      }
      this.cells.get(key)!.push(body);
    }
  }

  /**
   * Remove a body from the spatial hash
   */
  removeBody(body: PhysicsBody): void {
    const keys = this.getCellKeysForAABB(body);

    for (const key of keys) {
      const cell = this.cells.get(key);
      if (cell) {
        const index = cell.indexOf(body);
        if (index !== -1) {
          cell.splice(index, 1);
          if (cell.length === 0) {
            this.cells.delete(key);
          }
        }
      }
    }
  }

  /**
   * Get nearby bodies for a given body
   */
  getNearbyBodies(body: PhysicsBody): PhysicsBody[] {
    const nearbyBodies = new Set<PhysicsBody>();
    const keys = this.getCellKeysForAABB(body);

    for (const key of keys) {
      const cell = this.cells.get(key);
      if (cell) {
        for (const otherBody of cell) {
          if (otherBody !== body) {
            nearbyBodies.add(otherBody);
          }
        }
      }
    }

    return Array.from(nearbyBodies);
  }

  /**
   * Get bodies in a specific cell
   */
  getBodiesInCell(position: Vector3): PhysicsBody[] {
    const key = this.getCellKey(position);
    return this.cells.get(key) || [];
  }

  /**
   * Get bodies in a radius around a position
   */
  getBodiesInRadius(position: Vector3, radius: number): PhysicsBody[] {
    const nearbyBodies = new Set<PhysicsBody>();
    const cellRadius = Math.ceil(radius / this.cellSize);

    const centerX = Math.floor(position.x / this.cellSize);
    const centerY = Math.floor(position.y / this.cellSize);
    const centerZ = Math.floor(position.z / this.cellSize);

    for (let x = centerX - cellRadius; x <= centerX + cellRadius; x++) {
      for (let y = centerY - cellRadius; y <= centerY + cellRadius; y++) {
        for (let z = centerZ - cellRadius; z <= centerZ + cellRadius; z++) {
          const key = `${x},${y},${z}`;
          const cell = this.cells.get(key);
          if (cell) {
            for (const body of cell) {
              if (body.position.distanceTo(position) <= radius) {
                nearbyBodies.add(body);
              }
            }
          }
        }
      }
    }

    return Array.from(nearbyBodies);
  }

  /**
   * Clear all cells
   */
  clear(): void {
    this.cells.clear();
  }

  /**
   * Get cell size
   */
  getCellSize(): number {
    return this.cellSize;
  }

  /**
   * Set cell size (requires rebuilding the hash)
   */
  setCellSize(cellSize: number): void {
    this.cellSize = cellSize;
    this.clear();
  }

  /**
   * Get statistics about the spatial hash
   */
  getStats(): SpatialHashStats {
    let totalBodies = 0;
    let maxBodiesInCell = 0;
    let emptyCells = 0;

    for (const cell of this.cells.values()) {
      totalBodies += cell.length;
      maxBodiesInCell = Math.max(maxBodiesInCell, cell.length);
    }

    emptyCells = this.cells.size;

    return {
      totalCells: this.cells.size,
      totalBodies,
      maxBodiesInCell,
      averageBodiesPerCell: totalBodies / Math.max(1, this.cells.size),
      cellSize: this.cellSize
    };
  }

  /**
   * Optimize the spatial hash (remove empty cells, etc.)
   */
  optimize(): void {
    // Remove empty cells
    for (const [key, cell] of this.cells.entries()) {
      if (cell.length === 0) {
        this.cells.delete(key);
      }
    }
  }
}

export interface SpatialHashStats {
  totalCells: number;
  totalBodies: number;
  maxBodiesInCell: number;
  averageBodiesPerCell: number;
  cellSize: number;
}