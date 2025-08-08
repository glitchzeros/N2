import { Vector3 } from '@/engine/core/math/Vector3';
import { PhysicsWorld } from '@/engine/physics/PhysicsWorld';

export interface PathNode {
  position: Vector3;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent: PathNode | null;
  walkable: boolean;
}

export interface PathfindingGrid {
  nodes: PathNode[][][];
  nodeSize: number;
  worldBounds: { min: Vector3; max: Vector3 };
  width: number;
  height: number;
  depth: number;
}

export interface PathfindingResult {
  path: Vector3[];
  success: boolean;
  cost: number;
  nodesExplored: number;
}

/**
 * A* Pathfinding system for AI navigation
 */
export class Pathfinding {
  private grid: PathfindingGrid;
  private physicsWorld: PhysicsWorld;
  private nodeSize: number;
  private maxSearchTime: number;

  constructor(physicsWorld: PhysicsWorld, nodeSize: number = 2, maxSearchTime: number = 0.016) {
    this.physicsWorld = physicsWorld;
    this.nodeSize = nodeSize;
    this.maxSearchTime = maxSearchTime;
    this.grid = this.createGrid();
  }

  /**
   * Create pathfinding grid
   */
  private createGrid(): PathfindingGrid {
    const worldBounds = this.getWorldBounds();
    const width = Math.ceil((worldBounds.max.x - worldBounds.min.x) / this.nodeSize);
    const height = Math.ceil((worldBounds.max.y - worldBounds.min.y) / this.nodeSize);
    const depth = Math.ceil((worldBounds.max.z - worldBounds.min.z) / this.nodeSize);

    const nodes: PathNode[][][] = [];
    
    for (let x = 0; x < width; x++) {
      nodes[x] = [];
      for (let y = 0; y < height; y++) {
        nodes[x][y] = [];
        for (let z = 0; z < depth; z++) {
          const worldPos = new Vector3(
            worldBounds.min.x + x * this.nodeSize,
            worldBounds.min.y + y * this.nodeSize,
            worldBounds.min.z + z * this.nodeSize
          );
          
          nodes[x][y][z] = {
            position: worldPos,
            g: 0,
            h: 0,
            f: 0,
            parent: null,
            walkable: this.isWalkable(worldPos)
          };
        }
      }
    }

    return {
      nodes,
      nodeSize: this.nodeSize,
      worldBounds,
      width,
      height,
      depth
    };
  }

  /**
   * Get world bounds from physics world
   */
  private getWorldBounds(): { min: Vector3; max: Vector3 } {
    const bodies = this.physicsWorld.getBodies();
    if (bodies.length === 0) {
      return {
        min: new Vector3(-100, 0, -100),
        max: new Vector3(100, 50, 100)
      };
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const body of bodies) {
      const aabb = body.aabb;
      minX = Math.min(minX, aabb.min.x);
      minY = Math.min(minY, aabb.min.y);
      minZ = Math.min(minZ, aabb.min.z);
      maxX = Math.max(maxX, aabb.max.x);
      maxY = Math.max(maxY, aabb.max.y);
      maxZ = Math.max(maxZ, aabb.max.z);
    }

    return {
      min: new Vector3(minX, minY, minZ),
      max: new Vector3(maxX, maxY, maxZ)
    };
  }

  /**
   * Check if position is walkable
   */
  private isWalkable(position: Vector3): boolean {
    // Check for obstacles at this position
    const raycastResult = this.physicsWorld.raycast(
      position.clone().add(new Vector3(0, 1, 0)),
      new Vector3(0, -1, 0),
      2
    );

    if (raycastResult) {
      // Check if there's enough clearance above
      const clearanceResult = this.physicsWorld.raycast(
        position,
        new Vector3(0, 1, 0),
        2
      );
      return !clearanceResult; // Walkable if no obstacle above
    }

    return false; // No ground below
  }

  /**
   * Find path using A* algorithm
   */
  findPath(start: Vector3, end: Vector3): PathfindingResult {
    const startTime = performance.now();
    const startNode = this.worldToGrid(start);
    const endNode = this.worldToGrid(end);

    if (!startNode || !endNode) {
      return { path: [], success: false, cost: 0, nodesExplored: 0 };
    }

    if (!startNode.walkable || !endNode.walkable) {
      return { path: [], success: false, cost: 0, nodesExplored: 0 };
    }

    const openSet: PathNode[] = [startNode];
    const closedSet: Set<PathNode> = new Set();
    let nodesExplored = 0;

    // Initialize start node
    startNode.g = 0;
    startNode.h = this.heuristic(startNode, endNode);
    startNode.f = startNode.h;

    while (openSet.length > 0) {
      // Check time limit
      if (performance.now() - startTime > this.maxSearchTime * 1000) {
        return { path: [], success: false, cost: 0, nodesExplored };
      }

      // Find node with lowest f cost
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet[currentIndex];
      nodesExplored++;

      // Check if we reached the goal
      if (current === endNode) {
        const path = this.reconstructPath(current);
        return {
          path: path.map(node => node.position),
          success: true,
          cost: current.g,
          nodesExplored
        };
      }

      // Move current node from open to closed set
      openSet.splice(currentIndex, 1);
      closedSet.add(current);

      // Check neighbors
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        if (closedSet.has(neighbor) || !neighbor.walkable) {
          continue;
        }

        const tentativeG = current.g + this.distance(current, neighbor);

        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;
        }

        // This path is better
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = this.heuristic(neighbor, endNode);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    // No path found
    return { path: [], success: false, cost: 0, nodesExplored };
  }

  /**
   * Get grid coordinates from world position
   */
  private worldToGrid(worldPos: Vector3): PathNode | null {
    const x = Math.floor((worldPos.x - this.grid.worldBounds.min.x) / this.nodeSize);
    const y = Math.floor((worldPos.y - this.grid.worldBounds.min.y) / this.nodeSize);
    const z = Math.floor((worldPos.z - this.grid.worldBounds.min.z) / this.nodeSize);

    if (x < 0 || x >= this.grid.width || y < 0 || y >= this.grid.height || z < 0 || z >= this.grid.depth) {
      return null;
    }

    return this.grid.nodes[x][y][z];
  }

  /**
   * Get neighboring nodes
   */
  private getNeighbors(node: PathNode): PathNode[] {
    const neighbors: PathNode[] = [];
    const worldPos = node.position;
    const gridPos = this.worldToGrid(worldPos);
    
    if (!gridPos) return neighbors;

    const x = Math.floor((worldPos.x - this.grid.worldBounds.min.x) / this.nodeSize);
    const y = Math.floor((worldPos.y - this.grid.worldBounds.min.y) / this.nodeSize);
    const z = Math.floor((worldPos.z - this.grid.worldBounds.min.z) / this.nodeSize);

    // Check 26 neighbors (3x3x3 - 1)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;

          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;

          if (nx >= 0 && nx < this.grid.width &&
              ny >= 0 && ny < this.grid.height &&
              nz >= 0 && nz < this.grid.depth) {
            neighbors.push(this.grid.nodes[nx][ny][nz]);
          }
        }
      }
    }

    return neighbors;
  }

  /**
   * Calculate heuristic (Manhattan distance)
   */
  private heuristic(a: PathNode, b: PathNode): number {
    return a.position.distanceTo(b.position);
  }

  /**
   * Calculate distance between nodes
   */
  private distance(a: PathNode, b: PathNode): number {
    return a.position.distanceTo(b.position);
  }

  /**
   * Reconstruct path from end node
   */
  private reconstructPath(endNode: PathNode): PathNode[] {
    const path: PathNode[] = [];
    let current: PathNode | null = endNode;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  }

  /**
   * Find path with smoothing
   */
  findSmoothPath(start: Vector3, end: Vector3): PathfindingResult {
    const result = this.findPath(start, end);
    if (!result.success) return result;

    // Smooth the path by removing unnecessary waypoints
    const smoothedPath = this.smoothPath(result.path);
    
    return {
      path: smoothedPath,
      success: true,
      cost: result.cost,
      nodesExplored: result.nodesExplored
    };
  }

  /**
   * Smooth path by removing unnecessary waypoints
   */
  private smoothPath(path: Vector3[]): Vector3[] {
    if (path.length <= 2) return path;

    const smoothed: Vector3[] = [path[0]];
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const next = path[i + 1];

      // Check if we can skip this point
      if (this.hasLineOfSight(prev, next)) {
        continue; // Skip this point
      } else {
        smoothed.push(current);
      }
    }

    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  /**
   * Check if there's a clear line of sight between two points
   */
  private hasLineOfSight(start: Vector3, end: Vector3): boolean {
    const direction = end.clone().sub(start);
    const distance = direction.length();
    const raycastResult = this.physicsWorld.raycast(start, direction, distance);
    return !raycastResult;
  }

  /**
   * Find nearest walkable position
   */
  findNearestWalkable(position: Vector3): Vector3 | null {
    const node = this.worldToGrid(position);
    if (!node) return null;

    if (node.walkable) {
      return node.position.clone();
    }

    // Search in expanding radius
    const maxRadius = 10;
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dz = -radius; dz <= radius; dz++) {
            const testPos = position.clone().add(new Vector3(
              dx * this.nodeSize,
              dy * this.nodeSize,
              dz * this.nodeSize
            ));
            
            const testNode = this.worldToGrid(testPos);
            if (testNode && testNode.walkable) {
              return testNode.position.clone();
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Check if position is walkable
   */
  isPositionWalkable(position: Vector3): boolean {
    const node = this.worldToGrid(position);
    return node ? node.walkable : false;
  }

  /**
   * Update grid (call when world changes)
   */
  updateGrid(): void {
    this.grid = this.createGrid();
  }

  /**
   * Get grid statistics
   */
  getGridStats(): any {
    let walkableNodes = 0;
    let totalNodes = 0;

    for (let x = 0; x < this.grid.width; x++) {
      for (let y = 0; y < this.grid.height; y++) {
        for (let z = 0; z < this.grid.depth; z++) {
          totalNodes++;
          if (this.grid.nodes[x][y][z].walkable) {
            walkableNodes++;
          }
        }
      }
    }

    return {
      totalNodes,
      walkableNodes,
      walkablePercentage: (walkableNodes / totalNodes) * 100,
      nodeSize: this.nodeSize,
      gridSize: { width: this.grid.width, height: this.grid.height, depth: this.grid.depth }
    };
  }
}