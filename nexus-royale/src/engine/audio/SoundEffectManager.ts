import { Vector3 } from '@/engine/core/math/Vector3';
import { AudioMixer } from './AudioMixer';

export interface SoundEffect {
  id: string;
  buffer: AudioBuffer;
  category: string;
  volume: number;
  spatial: boolean;
  maxDistance: number;
  rolloffFactor: number;
}

export interface ActiveSound {
  id: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: PannerNode | null;
  position: Vector3 | null;
  startTime: number;
  duration: number;
}

/**
 * Sound effect manager with pooling and spatial audio
 */
export class SoundEffectManager {
  private context: AudioContext;
  private mixer: AudioMixer;
  private effects: Map<string, SoundEffect> = new Map();
  private activeSounds: Map<string, ActiveSound> = new Map();
  private soundPool: ActiveSound[] = [];
  private maxPoolSize: number = 50;
  private maxConcurrentSounds: number = 20;

  constructor(context: AudioContext, mixer: AudioMixer) {
    this.context = context;
    this.mixer = mixer;
  }

  /**
   * Add sound effect
   */
  addEffect(effect: SoundEffect): void {
    this.effects.set(effect.id, effect);
  }

  /**
   * Play sound effect
   */
  play(soundId: string, volume: number = 1.0): void {
    const effect = this.effects.get(soundId);
    if (!effect) {
      console.warn(`Sound effect not found: ${soundId}`);
      return;
    }

    // Check concurrent sound limit
    if (this.activeSounds.size >= this.maxConcurrentSounds) {
      this.stopOldestSound();
    }

    // Create sound source
    const source = this.context.createBufferSource();
    source.buffer = effect.buffer;

    const gain = this.context.createGain();
    gain.gain.value = volume * effect.volume;

    // Connect to appropriate bus
    const busInput = this.getBusInput(effect.category);
    source.connect(gain);
    gain.connect(busInput);

    // Start playback
    source.start();
    
    const activeSound: ActiveSound = {
      id: soundId,
      source,
      gain,
      panner: null,
      position: null,
      startTime: this.context.currentTime,
      duration: effect.buffer.duration
    };

    this.activeSounds.set(soundId + '_' + Date.now(), activeSound);

    // Clean up when finished
    source.onended = () => {
      this.cleanupSound(activeSound);
    };
  }

  /**
   * Play spatial sound effect
   */
  playSpatial(soundId: string, position: Vector3, volume: number = 1.0): void {
    const effect = this.effects.get(soundId);
    if (!effect) {
      console.warn(`Sound effect not found: ${soundId}`);
      return;
    }

    if (!effect.spatial) {
      this.play(soundId, volume);
      return;
    }

    // Check concurrent sound limit
    if (this.activeSounds.size >= this.maxConcurrentSounds) {
      this.stopOldestSound();
    }

    // Create sound source
    const source = this.context.createBufferSource();
    source.buffer = effect.buffer;

    const gain = this.context.createGain();
    gain.gain.value = volume * effect.volume;

    const panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = effect.maxDistance;
    panner.rolloffFactor = effect.rolloffFactor;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 360;
    panner.coneOuterGain = 0;

    // Set position
    panner.positionX.value = position.x;
    panner.positionY.value = position.y;
    panner.positionZ.value = position.z;

    // Connect to appropriate bus
    const busInput = this.getBusInput(effect.category);
    source.connect(gain);
    gain.connect(panner);
    panner.connect(busInput);

    // Start playback
    source.start();
    
    const activeSound: ActiveSound = {
      id: soundId,
      source,
      gain,
      panner,
      position: position.clone(),
      startTime: this.context.currentTime,
      duration: effect.buffer.duration
    };

    this.activeSounds.set(soundId + '_' + Date.now(), activeSound);

    // Clean up when finished
    source.onended = () => {
      this.cleanupSound(activeSound);
    };
  }

  /**
   * Stop sound effect
   */
  stop(soundId: string): void {
    for (const [key, sound] of this.activeSounds) {
      if (sound.id === soundId) {
        sound.source.stop();
        this.cleanupSound(sound);
        this.activeSounds.delete(key);
      }
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    for (const sound of this.activeSounds.values()) {
      sound.source.stop();
      this.cleanupSound(sound);
    }
    this.activeSounds.clear();
  }

  /**
   * Stop sounds by category
   */
  stopCategory(category: string): void {
    for (const [key, sound] of this.activeSounds) {
      const effect = this.effects.get(sound.id);
      if (effect && effect.category === category) {
        sound.source.stop();
        this.cleanupSound(sound);
        this.activeSounds.delete(key);
      }
    }
  }

  /**
   * Update sound effect manager
   */
  update(deltaTime: number): void {
    // Clean up finished sounds
    const currentTime = this.context.currentTime;
    for (const [key, sound] of this.activeSounds) {
      if (currentTime - sound.startTime > sound.duration) {
        this.cleanupSound(sound);
        this.activeSounds.delete(key);
      }
    }
  }

  /**
   * Get bus input for category
   */
  private getBusInput(category: string): GainNode {
    switch (category) {
      case 'voice':
        return this.mixer.getVoiceInput();
      case 'music':
        return this.mixer.getMusicInput();
      default:
        return this.mixer.getSFXInput();
    }
  }

  /**
   * Stop oldest sound
   */
  private stopOldestSound(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, sound] of this.activeSounds) {
      if (sound.startTime < oldestTime) {
        oldestTime = sound.startTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const sound = this.activeSounds.get(oldestKey)!;
      sound.source.stop();
      this.cleanupSound(sound);
      this.activeSounds.delete(oldestKey);
    }
  }

  /**
   * Clean up sound resources
   */
  private cleanupSound(sound: ActiveSound): void {
    // Disconnect nodes
    if (sound.gain) {
      sound.gain.disconnect();
    }
    if (sound.panner) {
      sound.panner.disconnect();
    }

    // Add to pool if not full
    if (this.soundPool.length < this.maxPoolSize) {
      this.soundPool.push(sound);
    }
  }

  /**
   * Create procedural sound effect
   */
  createProceduralEffect(id: string, category: string, duration: number, frequency: number): SoundEffect {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate procedural sound
    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      
      // Simple sine wave with envelope
      const envelope = Math.exp(-time * 2);
      const sample = Math.sin(2 * Math.PI * frequency * time) * envelope * 0.3;
      
      channelData[i] = Math.max(-1, Math.min(1, sample));
    }

    const effect: SoundEffect = {
      id,
      buffer,
      category,
      volume: 1.0,
      spatial: true,
      maxDistance: 50,
      rolloffFactor: 1
    };

    this.addEffect(effect);
    return effect;
  }

  /**
   * Set effect volume
   */
  setEffectVolume(soundId: string, volume: number): void {
    const effect = this.effects.get(soundId);
    if (effect) {
      effect.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Set effect spatial properties
   */
  setEffectSpatial(soundId: string, spatial: boolean, maxDistance: number, rolloffFactor: number): void {
    const effect = this.effects.get(soundId);
    if (effect) {
      effect.spatial = spatial;
      effect.maxDistance = maxDistance;
      effect.rolloffFactor = rolloffFactor;
    }
  }

  /**
   * Get active sounds count
   */
  getActiveSoundsCount(): number {
    return this.activeSounds.size;
  }

  /**
   * Get active sounds by category
   */
  getActiveSoundsByCategory(category: string): ActiveSound[] {
    const sounds: ActiveSound[] = [];
    for (const sound of this.activeSounds.values()) {
      const effect = this.effects.get(sound.id);
      if (effect && effect.category === category) {
        sounds.push(sound);
      }
    }
    return sounds;
  }

  /**
   * Get sound effect
   */
  getEffect(soundId: string): SoundEffect | null {
    return this.effects.get(soundId) || null;
  }

  /**
   * Get sound effect statistics
   */
  getStats(): any {
    const stats = {
      totalEffects: this.effects.size,
      activeSounds: this.activeSounds.size,
      poolSize: this.soundPool.length,
      byCategory: {} as Record<string, number>
    };

    // Count by category
    for (const effect of this.effects.values()) {
      stats.byCategory[effect.category] = (stats.byCategory[effect.category] || 0) + 1;
    }

    return stats;
  }

  /**
   * Dispose of sound effect manager
   */
  dispose(): void {
    this.stopAll();
    
    // Clear effects and pool
    this.effects.clear();
    this.soundPool.length = 0;
  }
}