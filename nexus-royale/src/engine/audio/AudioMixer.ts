import { AudioSettings } from './AudioManager';

/**
 * Audio mixer with multiple buses and effects
 */
export class AudioMixer {
  private context: AudioContext;
  private settings: AudioSettings;
  
  // Master bus
  private masterGain: GainNode;
  private masterMuted: boolean = false;
  
  // Music bus
  private musicGain: GainNode;
  private musicCompressor: DynamicsCompressorNode;
  private musicFilter: BiquadFilterNode;
  
  // SFX bus
  private sfxGain: GainNode;
  private sfxCompressor: DynamicsCompressorNode;
  private sfxReverb: ConvolverNode | null = null;
  
  // Voice bus
  private voiceGain: GainNode;
  private voiceCompressor: DynamicsCompressorNode;
  private voiceFilter: BiquadFilterNode;

  constructor(context: AudioContext, settings: AudioSettings) {
    this.context = context;
    this.settings = settings;

    this.setupBuses();
  }

  /**
   * Setup audio buses
   */
  private setupBuses(): void {
    // Master bus
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.settings.masterVolume;
    this.masterGain.connect(this.context.destination);

    // Music bus
    this.musicGain = this.context.createGain();
    this.musicGain.gain.value = this.settings.musicVolume;
    
    this.musicCompressor = this.context.createDynamicsCompressor();
    this.musicCompressor.threshold.value = -24;
    this.musicCompressor.knee.value = 30;
    this.musicCompressor.ratio.value = 12;
    this.musicCompressor.attack.value = 0.003;
    this.musicCompressor.release.value = 0.25;
    
    this.musicFilter = this.context.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 20000;
    this.musicFilter.Q.value = 1;

    // Connect music bus
    this.musicGain.connect(this.musicCompressor);
    this.musicCompressor.connect(this.musicFilter);
    this.musicFilter.connect(this.masterGain);

    // SFX bus
    this.sfxGain = this.context.createGain();
    this.sfxGain.gain.value = this.settings.sfxVolume;
    
    this.sfxCompressor = this.context.createDynamicsCompressor();
    this.sfxCompressor.threshold.value = -20;
    this.sfxCompressor.knee.value = 25;
    this.sfxCompressor.ratio.value = 8;
    this.sfxCompressor.attack.value = 0.001;
    this.sfxCompressor.release.value = 0.1;

    // Connect SFX bus
    this.sfxGain.connect(this.sfxCompressor);
    this.sfxCompressor.connect(this.masterGain);

    // Voice bus
    this.voiceGain = this.context.createGain();
    this.voiceGain.gain.value = this.settings.voiceVolume;
    
    this.voiceCompressor = this.context.createDynamicsCompressor();
    this.voiceCompressor.threshold.value = -16;
    this.voiceCompressor.knee.value = 20;
    this.voiceCompressor.ratio.value = 6;
    this.voiceCompressor.attack.value = 0.002;
    this.voiceCompressor.release.value = 0.15;
    
    this.voiceFilter = this.context.createBiquadFilter();
    this.voiceFilter.type = 'highpass';
    this.voiceFilter.frequency.value = 80;
    this.voiceFilter.Q.value = 1;

    // Connect voice bus
    this.voiceGain.connect(this.voiceCompressor);
    this.voiceCompressor.connect(this.voiceFilter);
    this.voiceFilter.connect(this.masterGain);
  }

  /**
   * Get music bus input
   */
  getMusicInput(): GainNode {
    return this.musicGain;
  }

  /**
   * Get SFX bus input
   */
  getSFXInput(): GainNode {
    return this.sfxGain;
  }

  /**
   * Get voice bus input
   */
  getVoiceInput(): GainNode {
    return this.voiceGain;
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    if (!this.masterMuted) {
      this.masterGain.gain.value = this.settings.masterVolume;
    }
  }

  /**
   * Set music volume
   */
  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.musicGain.gain.value = this.settings.musicVolume;
  }

  /**
   * Set SFX volume
   */
  setSFXVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sfxGain.gain.value = this.settings.sfxVolume;
  }

  /**
   * Set voice volume
   */
  setVoiceVolume(volume: number): void {
    this.settings.voiceVolume = Math.max(0, Math.min(1, volume));
    this.voiceGain.gain.value = this.settings.voiceVolume;
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this.masterMuted = muted;
    this.masterGain.gain.value = muted ? 0 : this.settings.masterVolume;
  }

  /**
   * Set music filter frequency
   */
  setMusicFilterFrequency(frequency: number): void {
    this.musicFilter.frequency.value = Math.max(20, Math.min(20000, frequency));
  }

  /**
   * Set voice filter frequency
   */
  setVoiceFilterFrequency(frequency: number): void {
    this.voiceFilter.frequency.value = Math.max(20, Math.min(20000, frequency));
  }

  /**
   * Set music compression
   */
  setMusicCompression(threshold: number, ratio: number): void {
    this.musicCompressor.threshold.value = threshold;
    this.musicCompressor.ratio.value = ratio;
  }

  /**
   * Set SFX compression
   */
  setSFXCompression(threshold: number, ratio: number): void {
    this.sfxCompressor.threshold.value = threshold;
    this.sfxCompressor.ratio.value = ratio;
  }

  /**
   * Set voice compression
   */
  setVoiceCompression(threshold: number, ratio: number): void {
    this.voiceCompressor.threshold.value = threshold;
    this.voiceCompressor.ratio.value = ratio;
  }

  /**
   * Enable/disable SFX reverb
   */
  async setSFXReverb(enabled: boolean, roomSize: number = 0.5): Promise<void> {
    if (enabled && !this.sfxReverb) {
      // Create impulse response for reverb
      const sampleRate = this.context.sampleRate;
      const length = sampleRate * roomSize;
      const impulse = this.context.createBuffer(2, length, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.1));
        }
      }
      
      this.sfxReverb = this.context.createConvolver();
      this.sfxReverb.buffer = impulse;
      
      // Reconnect SFX bus with reverb
      this.sfxGain.disconnect();
      this.sfxGain.connect(this.sfxReverb);
      this.sfxReverb.connect(this.sfxCompressor);
    } else if (!enabled && this.sfxReverb) {
      // Remove reverb
      this.sfxGain.disconnect();
      this.sfxGain.connect(this.sfxCompressor);
      this.sfxReverb = null;
    }
  }

  /**
   * Get mixer statistics
   */
  getStats(): any {
    return {
      masterVolume: this.settings.masterVolume,
      musicVolume: this.settings.musicVolume,
      sfxVolume: this.settings.sfxVolume,
      voiceVolume: this.settings.voiceVolume,
      muted: this.masterMuted,
      musicFilterFreq: this.musicFilter.frequency.value,
      voiceFilterFreq: this.voiceFilter.frequency.value,
      sfxReverbEnabled: this.sfxReverb !== null
    };
  }

  /**
   * Dispose of mixer resources
   */
  dispose(): void {
    // Disconnect all nodes
    this.masterGain.disconnect();
    this.musicGain.disconnect();
    this.sfxGain.disconnect();
    this.voiceGain.disconnect();
    
    if (this.sfxReverb) {
      this.sfxReverb.disconnect();
    }
  }
}