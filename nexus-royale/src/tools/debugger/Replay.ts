export type ReplayFrame = {
  dt: number;
  moveX: number;
  moveY: number;
  lookDeltaX: number;
  lookDeltaY: number;
  fire: boolean;
};

export class ReplayRecorder {
  private frames: ReplayFrame[] = [];

  record(snap: Omit<ReplayFrame, 'dt'>, dt: number): void {
    this.frames.push({ dt, ...snap });
  }

  clear(): void { this.frames = []; }

  export(): ReplayFrame[] { return this.frames.slice(); }
}

export function createReplayer(frames: ReplayFrame[]) {
  let idx = 0;
  let leftover = frames[0]?.dt ?? 0;

  return function provide(): Omit<ReplayFrame, 'dt'> {
    if (frames.length === 0) return { moveX: 0, moveY: 0, lookDeltaX: 0, lookDeltaY: 0, fire: false };
    const frame = frames[idx];
    leftover -= (1 / 60); // assume fixed step provider cadence
    if (leftover <= 0) {
      idx = Math.min(frames.length - 1, idx + 1);
      leftover = frames[idx].dt;
    }
    return {
      moveX: frame.moveX,
      moveY: frame.moveY,
      lookDeltaX: frame.lookDeltaX,
      lookDeltaY: frame.lookDeltaY,
      fire: frame.fire,
    };
  };
}