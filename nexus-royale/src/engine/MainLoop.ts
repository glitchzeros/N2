type RafFunc = (cb: (t: number) => void) => number;

type UpdateFunc = (fixedDeltaSeconds: number) => void;

type RenderFunc = (interpolationAlpha: number) => void;

export class MainLoop {
  private readonly raf: RafFunc;
  private readonly update: UpdateFunc;
  private readonly render: RenderFunc;
  private readonly fixedDeltaSeconds: number;

  private accumulator = 0;
  private running = false;
  private lastTime = 0;

  constructor(params: { raf?: RafFunc; update: UpdateFunc; render: RenderFunc; fixedDeltaSeconds?: number }) {
    this.raf = params.raf ?? ((cb) => (typeof window !== 'undefined' ? window.requestAnimationFrame(cb) : setTimeout(() => cb(performance.now()), 16) as unknown as number));
    this.update = params.update;
    this.render = params.render;
    this.fixedDeltaSeconds = params.fixedDeltaSeconds ?? 1 / 60;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    this.raf(this.tick);
  }

  stop(): void { this.running = false; }

  private tick = (nowMs: number): void => {
    if (!this.running) return;
    if (this.lastTime === 0) this.lastTime = nowMs;
    const dt = Math.min((nowMs - this.lastTime) / 1000, this.fixedDeltaSeconds * 5);
    this.lastTime = nowMs;

    this.accumulator += dt;
    while (this.accumulator >= this.fixedDeltaSeconds) {
      this.update(this.fixedDeltaSeconds);
      this.accumulator -= this.fixedDeltaSeconds;
    }
    const alpha = this.accumulator / this.fixedDeltaSeconds;
    this.render(alpha);

    this.raf(this.tick);
  };

  // For tests: manually advance time with a given dt
  frame(dtSeconds: number): void {
    this.accumulator += dtSeconds;
    while (this.accumulator >= this.fixedDeltaSeconds) {
      this.update(this.fixedDeltaSeconds);
      this.accumulator -= this.fixedDeltaSeconds;
    }
    const alpha = this.accumulator / this.fixedDeltaSeconds;
    this.render(alpha);
  }
}