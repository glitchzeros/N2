export class LodController {
  private targetFrameMs = 16.67;
  setTargetFrameMs(ms: number): void { this.targetFrameMs = ms; }

  computeLod(distance: number, lastFrameMs: number): number {
    const perfFactor = Math.min(2, Math.max(0.5, this.targetFrameMs / Math.max(1, lastFrameMs)));
    const base = distance < 20 ? 0 : distance < 50 ? 1 : 2;
    let lod = base + (perfFactor < 1 ? 1 : 0);
    return Math.max(0, Math.min(3, Math.round(lod)));
  }
}