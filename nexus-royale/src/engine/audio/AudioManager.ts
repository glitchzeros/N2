import { AudioListener } from './AudioListener';
import { AudioSource } from './AudioSource';
import { AudioMixer } from './AudioMixer';
import { MusicSystem } from './MusicSystem';
import { SoundEffectManager } from './SoundEffectManager';
import { Vector3 } from '@/engine/core/math/Vector3';

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  spatialAudio: boolean;
  maxDistance: number;
  rolloffFactor: number;
  dopplerFactor: number;
  speedOfSound: number;
}

/**
 * Main audio manager for the game
 */
export class AudioManager {
  private context: AudioContext;
  private listener: AudioListener;
  private mixer: AudioMixer;
  private musicSystem: MusicSystem;
  private soundEffectManager: SoundEffectManager;
  
  private settings: AudioSettings;
  private isInitialized: boolean = false;
  private isMuted: boolean = false;
  private sources: Map<string, AudioSource> = new Map();

  constructor(settings: Partial<AudioSettings> = {}) {
    this.settings = {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      voiceVolume: 0.9,
      spatialAudio: true,
      maxDistance: 100,
      rolloffFactor: 1,
      dopplerFactor: 1,
      speedOfSound: 343,
      ...settings
    };

    this.initializeAudio();
  }

  /**
   * Initialize Web Audio API
   */
  private async initializeAudio(): Promise<void> {
    try {
      // Create audio context
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      // Create audio systems
      this.listener = new AudioListener(this.context);
      this.mixer = new AudioMixer(this.context, this.settings);
      this.musicSystem = new MusicSystem(this.context, this.mixer);
      this.soundEffectManager = new SoundEffectManager(this.context, this.mixer);

      this.isInitialized = true;
      console.log('Audio system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  }

  /**
   * Update audio system
   */
  update(deltaTime: number, listenerPosition: Vector3, listenerVelocity: Vector3): void {
    if (!this.isInitialized) return;

    // Update listener
    this.listener.setPosition(listenerPosition);
    this.listener.setVelocity(listenerVelocity);

    // Update spatial audio sources
    for (const source of this.sources.values()) {
      source.update(deltaTime);
    }

    // Update music system
    this.musicSystem.update(deltaTime);

    // Update sound effects
    this.soundEffectManager.update(deltaTime);
  }

  /**
   * Create spatial audio source
   */
  createSpatialSource(id: string, position: Vector3, audioBuffer: AudioBuffer): AudioSource {
    if (!this.isInitialized) {
      throw new Error('Audio system not initialized');
    }

    const source = new AudioSource(
      this.context,
      this.listener,
      audioBuffer,
      position,
      this.settings
    );

    this.sources.set(id, source);
    return source;
  }

  /**
   * Play sound effect
   */
  playSoundEffect(soundId: string, position?: Vector3, volume: number = 1.0): void {
    if (!this.isInitialized) return;

    if (position && this.settings.spatialAudio) {
      // Play spatial sound
      this.soundEffectManager.playSpatial(soundId, position, volume);
    } else {
      // Play non-spatial sound
      this.soundEffectManager.play(soundId, volume);
    }
  }

  /**
   * Play music track
   */
  playMusic(trackId: string, fadeIn: number = 1.0): void {
    if (!this.isInitialized) return;
    this.musicSystem.playTrack(trackId, fadeIn);
  }

  /**
   * Stop music
   */
  stopMusic(fadeOut: number = 1.0): void {
    if (!this.isInitialized) return;
    this.musicSystem.stop(fadeOut);
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.mixer.setMusicVolume(this.settings.musicVolume);
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.mixer.setSFXVolume(this.settings.sfxVolume);
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.mixer.setMasterVolume(this.settings.masterVolume);
  }

  /**
   * Mute/unmute audio
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.mixer.setMuted(muted);
  }

  /**
   * Enable/disable spatial audio
   */
  setSpatialAudio(enabled: boolean): void {
    this.settings.spatialAudio = enabled;
  }

  /**
   * Set audio settings
   */
  setSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    // Update systems with new settings
    this.mixer.setMasterVolume(this.settings.masterVolume);
    this.mixer.setMusicVolume(this.settings.musicVolume);
    this.mixer.setSFXVolume(this.settings.sfxVolume);
    
    // Update spatial audio sources
    for (const source of this.sources.values()) {
      source.updateSettings(this.settings);
    }
  }

  /**
   * Load audio file
   */
  async loadAudio(url: string): Promise<AudioBuffer> {
    if (!this.isInitialized) {
      throw new Error('Audio system not initialized');
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.context.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Failed to load audio:', url, error);
      throw error;
    }
  }

  /**
   * Get audio context
   */
  getContext(): AudioContext {
    return this.context;
  }

  /**
   * Get audio listener
   */
  getListener(): AudioListener {
    return this.listener;
  }

  /**
   * Get audio mixer
   */
  getMixer(): AudioMixer {
    return this.mixer;
  }

  /**
   * Get music system
   */
  getMusicSystem(): MusicSystem {
    return this.musicSystem;
  }

  /**
   * Get sound effect manager
   */
  getSoundEffectManager(): SoundEffectManager {
    return this.soundEffectManager;
  }

  /**
   * Get audio settings
   */
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Check if audio is initialized
   */
  isAudioInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if audio is muted
   */
  isAudioMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Get audio statistics
   */
  getStats(): any {
    return {
      initialized: this.isInitialized,
      muted: this.isMuted,
      spatialSources: this.sources.size,
      settings: this.settings,
      contextState: this.context?.state,
      musicStats: this.musicSystem.getStats(),
      sfxStats: this.soundEffectManager.getStats()
    };
  }

  /**
   * Dispose of audio resources
   */
  dispose(): void {
    // Stop all sources
    for (const source of this.sources.values()) {
      source.dispose();
    }
    this.sources.clear();

    // Dispose systems
    this.musicSystem.dispose();
    this.soundEffectManager.dispose();
    this.mixer.dispose();

    // Close audio context
    if (this.context) {
      this.context.close();
    }

    this.isInitialized = false;
  }
}