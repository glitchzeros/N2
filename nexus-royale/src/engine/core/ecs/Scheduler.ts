import { System, SystemContext } from './System';

export class Scheduler {
  private systems: System[] = [];
  private readonly ctx: SystemContext;

  constructor(ctx: SystemContext) {
    this.ctx = ctx;
  }

  add(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
    if (system.init) system.init(this.ctx);
  }

  remove(name: string): void {
    const idx = this.systems.findIndex(s => s.name === name);
    if (idx >= 0) {
      const [sys] = this.systems.splice(idx, 1);
      sys.dispose?.(this.ctx);
    }
  }

  update(fixedDeltaSeconds: number): void {
    for (const s of this.systems) {
      s.update(this.ctx, fixedDeltaSeconds);
    }
  }
}