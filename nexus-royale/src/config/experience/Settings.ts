type Settings = {
  reduceMotion: boolean;
  showTracers: boolean;
  terrainSeed: number;
};

const state: Settings = {
  reduceMotion: false,
  showTracers: true,
  terrainSeed: 1,
};

export function setReduceMotion(value: boolean): void { state.reduceMotion = value; }
export function getReduceMotion(): boolean { return state.reduceMotion; }

export function setShowTracers(value: boolean): void { state.showTracers = value; }
export function getShowTracers(): boolean { return state.showTracers; }

export function setTerrainSeed(value: number): void { state.terrainSeed = value || 1; }
export function getTerrainSeed(): number { return state.terrainSeed; }