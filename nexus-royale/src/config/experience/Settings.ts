type Settings = {
  reduceMotion: boolean;
  showTracers: boolean;
};

const state: Settings = {
  reduceMotion: false,
  showTracers: true,
};

export function setReduceMotion(value: boolean): void { state.reduceMotion = value; }
export function getReduceMotion(): boolean { return state.reduceMotion; }

export function setShowTracers(value: boolean): void { state.showTracers = value; }
export function getShowTracers(): boolean { return state.showTracers; }