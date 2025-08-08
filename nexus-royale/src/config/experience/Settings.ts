type Settings = {
  reduceMotion: boolean;
};

const state: Settings = {
  reduceMotion: false,
};

export function setReduceMotion(value: boolean): void { state.reduceMotion = value; }
export function getReduceMotion(): boolean { return state.reduceMotion; }