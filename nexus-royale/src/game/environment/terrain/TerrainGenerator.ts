// Simple value noise for deterministic terrain height (not full Perlin for brevity)
function hash(n: number): number {
  const x = Math.sin(n) * 43758.5453123;
  return x - Math.floor(x);
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function smoothstep(t: number): number { return t * t * (3 - 2 * t); }

function noise2D(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const n00 = hash(xi * 15731 + yi * 789221);
  const n10 = hash((xi + 1) * 15731 + yi * 789221);
  const n01 = hash(xi * 15731 + (yi + 1) * 789221);
  const n11 = hash((xi + 1) * 15731 + (yi + 1) * 789221);
  const u = smoothstep(xf), v = smoothstep(yf);
  return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
}

export function terrainHeight(x: number, z: number, amplitude = 15, frequency = 0.05): number {
  return (noise2D(x * frequency, z * frequency) - 0.5) * 2 * amplitude;
}

export type TerrainMesh = {
  positions: Float32Array;
  indices: Uint32Array;
  width: number;
  depth: number;
  scale: number;
};

export function generateFlatShadedGrid(width = 128, depth = 128, scale = 1): TerrainMesh {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let z = 0; z < depth; z++) {
    for (let x = 0; x < width; x++) {
      const y = terrainHeight(x * scale, z * scale);
      positions.push(x * scale, y, z * scale);
    }
  }
  for (let z = 0; z < depth - 1; z++) {
    for (let x = 0; x < width - 1; x++) {
      const i = z * width + x;
      const a = i, b = i + 1, c = i + width, d = i + width + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return { positions: new Float32Array(positions), indices: new Uint32Array(indices), width, depth, scale };
}