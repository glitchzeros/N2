export class Time {
  readonly fixedDeltaSeconds: number;
  accumulatorSeconds = 0;
  lastTimestampMs = 0;
  maxSubSteps = 5;

  constructor(fixedDeltaSeconds = 1 / 60) {
    this.fixedDeltaSeconds = fixedDeltaSeconds;
  }

  beginFrame(nowMs: number): number {
    const dt = this.lastTimestampMs ? (nowMs - this.lastTimestampMs) / 1000 : 0;
    this.lastTimestampMs = nowMs;
    // clamp very large dt (tab switch)
    return Math.min(dt, this.fixedDeltaSeconds * this.maxSubSteps);
  }
}