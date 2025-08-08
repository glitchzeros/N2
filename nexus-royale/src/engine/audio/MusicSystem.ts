import { AudioMixer } from './AudioMixer';

export interface MusicTrack {
  id: string;
  buffer: AudioBuffer;
  intensity: number; // 0-1
  bpm: number;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
}

export interface MusicLayer {
  id: string;
  buffer: AudioBuffer;
  volume: number;
  enabled: boolean;
}

/**
 * Dynamic music system with adaptive intensity
 */
export class MusicSystem {
  private context: AudioContext;
  private mixer: AudioMixer;
  private tracks: Map<string, MusicTrack> = new Map();
  private layers: Map<string, MusicLayer> = new Map();
  
  private currentTrack: MusicTrack | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentGain: GainNode | null = null;
  private activeLayers: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();
  
  private intensity: number = 0;
  private targetIntensity: number = 0;
  private transitionTime: number = 2.0;
  private isPlaying: boolean = false;

  constructor(context: AudioContext, mixer: AudioMixer) {
    this.context = context;
    this.mixer = mixer;
  }

  /**
   * Add music track
   */
  addTrack(track: MusicTrack): void {
    this.tracks.set(track.id, track);
  }

  /**
   * Add music layer
   */
  addLayer(layer: MusicLayer): void {
    this.layers.set(layer.id, layer);
  }

  /**
   * Play music track
   */
  playTrack(trackId: string, fadeIn: number = 1.0): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.warn(`Music track not found: ${trackId}`);
      return;
    }

    // Stop current track
    this.stop();

    // Create new source
    this.currentTrack = track;
    this.currentSource = this.context.createBufferSource();
    this.currentSource.buffer = track.buffer;
    this.currentSource.loop = track.loop;

    // Create gain node for fade
    this.currentGain = this.context.createGain();
    this.currentGain.gain.value = 0;

    // Connect to music bus
    this.currentSource.connect(this.currentGain);
    this.currentGain.connect(this.mixer.getMusicInput());

    // Start playback
    this.currentSource.start();
    this.isPlaying = true;

    // Fade in
    this.currentGain.gain.linearRampToValueAtTime(1, this.context.currentTime + fadeIn);
  }

  /**
   * Stop music
   */
  stop(fadeOut: number = 1.0): void {
    if (!this.isPlaying || !this.currentGain) return;

    // Fade out
    this.currentGain.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOut);

    // Stop source after fade
    setTimeout(() => {
      if (this.currentSource) {
        this.currentSource.stop();
        this.currentSource = null;
      }
      this.currentGain = null;
      this.currentTrack = null;
      this.isPlaying = false;
    }, fadeOut * 1000);

    // Stop all layers
    this.stopAllLayers();
  }

  /**
   * Set music intensity (0-1)
   */
  setIntensity(intensity: number): void {
    this.targetIntensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Enable/disable music layer
   */
  setLayerEnabled(layerId: string, enabled: boolean): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    layer.enabled = enabled;

    if (enabled && this.isPlaying) {
      this.playLayer(layerId);
    } else {
      this.stopLayer(layerId);
    }
  }

  /**
   * Set layer volume
   */
  setLayerVolume(layerId: string, volume: number): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    layer.volume = Math.max(0, Math.min(1, volume));

    const activeLayer = this.activeLayers.get(layerId);
    if (activeLayer) {
      activeLayer.gain.gain.value = layer.volume;
    }
  }

  /**
   * Play music layer
   */
  private playLayer(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer || !layer.enabled) return;

    // Stop existing layer
    this.stopLayer(layerId);

    // Create new layer source
    const source = this.context.createBufferSource();
    source.buffer = layer.buffer;
    source.loop = true;

    const gain = this.context.createGain();
    gain.gain.value = layer.volume;

    // Connect to music bus
    source.connect(gain);
    gain.connect(this.mixer.getMusicInput());

    // Start playback
    source.start();
    this.activeLayers.set(layerId, { source, gain });
  }

  /**
   * Stop music layer
   */
  private stopLayer(layerId: string): void {
    const activeLayer = this.activeLayers.get(layerId);
    if (activeLayer) {
      activeLayer.source.stop();
      this.activeLayers.delete(layerId);
    }
  }

  /**
   * Stop all layers
   */
  private stopAllLayers(): void {
    for (const [layerId, activeLayer] of this.activeLayers) {
      activeLayer.source.stop();
    }
    this.activeLayers.clear();
  }

  /**
   * Update music system
   */
  update(deltaTime: number): void {
    if (!this.isPlaying) return;

    // Smooth intensity transition
    const intensityDiff = this.targetIntensity - this.intensity;
    if (Math.abs(intensityDiff) > 0.01) {
      this.intensity += intensityDiff * (deltaTime / this.transitionTime);
      this.intensity = Math.max(0, Math.min(1, this.intensity));
    }

    // Update layer volumes based on intensity
    this.updateLayerVolumes();

    // Check if current track finished
    if (this.currentSource && this.currentSource.playbackState === 'finished') {
      this.isPlaying = false;
      this.currentSource = null;
      this.currentGain = null;
      this.currentTrack = null;
    }
  }

  /**
   * Update layer volumes based on intensity
   */
  private updateLayerVolumes(): void {
    for (const [layerId, layer] of this.layers) {
      if (!layer.enabled) continue;

      const activeLayer = this.activeLayers.get(layerId);
      if (!activeLayer) continue;

      // Calculate target volume based on intensity
      let targetVolume = layer.volume;
      
      // Example: intensity-based volume modulation
      if (this.intensity > 0.5) {
        targetVolume *= 1 + (this.intensity - 0.5) * 0.5;
      } else {
        targetVolume *= this.intensity * 1.5;
      }

      // Smooth volume transition
      activeLayer.gain.gain.linearRampToValueAtTime(
        targetVolume,
        this.context.currentTime + 0.1
      );
    }
  }

  /**
   * Create procedural music track
   */
  createProceduralTrack(id: string, bpm: number, duration: number): MusicTrack {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(2, length, sampleRate);

    // Generate procedural music
    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const beat = (time * bpm) / 60;
        
        // Simple procedural music generation
        let sample = 0;
        
        // Bass drum
        if (Math.floor(beat) % 4 === 0) {
          sample += Math.sin(2 * Math.PI * 60 * time) * Math.exp(-time * 10) * 0.3;
        }
        
        // Hi-hat
        if (Math.floor(beat * 2) % 2 === 0) {
          sample += (Math.random() * 2 - 1) * Math.exp(-time * 50) * 0.1;
        }
        
        // Melody
        const melodyFreq = 440 * Math.pow(2, Math.floor(beat / 4) % 12 / 12);
        sample += Math.sin(2 * Math.PI * melodyFreq * time) * 0.1;
        
        channelData[i] = Math.max(-1, Math.min(1, sample));
      }
    }

    const track: MusicTrack = {
      id,
      buffer,
      intensity: 0.5,
      bpm,
      loop: true,
      fadeIn: 1.0,
      fadeOut: 1.0
    };

    this.addTrack(track);
    return track;
  }

  /**
   * Get current track
   */
  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  /**
   * Get current intensity
   */
  getIntensity(): number {
    return this.intensity;
  }

  /**
   * Check if music is playing
   */
  isMusicPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get music statistics
   */
  getStats(): any {
    return {
      currentTrack: this.currentTrack?.id || null,
      intensity: this.intensity,
      targetIntensity: this.targetIntensity,
      isPlaying: this.isPlaying,
      activeLayers: this.activeLayers.size,
      totalTracks: this.tracks.size,
      totalLayers: this.layers.size
    };
  }

  /**
   * Dispose of music system
   */
  dispose(): void {
    this.stop();
    
    // Clear tracks and layers
    this.tracks.clear();
    this.layers.clear();
    this.activeLayers.clear();
  }
}