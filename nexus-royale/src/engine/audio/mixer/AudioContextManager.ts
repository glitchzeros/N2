export class AudioContextManager {
  private static _instance: AudioContextManager | null = null;
  static get instance(): AudioContextManager {
    if (!this._instance) this._instance = new AudioContextManager();
    return this._instance;
  }

  readonly ctx: AudioContext | null;
  readonly master: GainNode | null;
  readonly sfx: GainNode | null;

  private constructor() {
    if (typeof window === 'undefined' || !(window as any).AudioContext) {
      this.ctx = null; this.master = null; this.sfx = null; return;
    }
    const ctx = new AudioContext();
    const master = ctx.createGain();
    const sfx = ctx.createGain();
    sfx.connect(master);
    master.connect(ctx.destination);
    master.gain.value = 0.8;
    sfx.gain.value = 1.0;
    this.ctx = ctx; this.master = master; this.sfx = sfx;
  }

  setMasterVolume(v: number): void { if (this.master) this.master.gain.value = v; }
  setSfxVolume(v: number): void { if (this.sfx) this.sfx.gain.value = v; }
}