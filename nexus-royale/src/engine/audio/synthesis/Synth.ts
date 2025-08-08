import { AudioContextManager } from '@/engine/audio/mixer/AudioContextManager';

export function playPulseRifle(): void {
  const mgr = AudioContextManager.instance;
  const ctx = mgr.ctx; const bus = mgr.sfx;
  if (!ctx || !bus) return;

  const t0 = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(560, t0);
  osc1.frequency.exponentialRampToValueAtTime(220, t0 + 0.08);
  gain1.gain.setValueAtTime(0.0001, t0);
  gain1.gain.exponentialRampToValueAtTime(0.7, t0 + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
  osc1.connect(gain1).connect(bus);
  osc1.start(t0); osc1.stop(t0 + 0.12);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(90, t0);
  gain2.gain.setValueAtTime(0.0001, t0);
  gain2.gain.exponentialRampToValueAtTime(0.3, t0 + 0.005);
  gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
  osc2.connect(gain2).connect(bus);
  osc2.start(t0); osc2.stop(t0 + 0.14);
}