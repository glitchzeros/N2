import { Vector3 } from '@/engine/core/math/Vector3';
import { AudioListener } from './AudioListener';
import { AudioSettings } from './AudioManager';

/**
 * 3D spatial audio source
 */
export class AudioSource {
  private context: AudioContext;
  private listener: AudioListener;
  private audioBuffer: AudioBuffer;
  private position: Vector3;
  private velocity: Vector3;
  private settings: AudioSettings;
  
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private pannerNode: PannerNode;
  private isPlaying: boolean = false;
  private volume: number = 1.0;
  private loop: boolean = false;

  constructor(
    context: AudioContext,
    listener: AudioListener,
    audioBuffer: AudioBuffer,
    position: Vector3,
    settings: AudioSettings
  ) {
    this.context = context;
    this.listener = listener;
    this.audioBuffer = audioBuffer;
    this.position = position.clone();
    this.velocity = new Vector3();
    this.settings = settings;

    // Create audio nodes
    this.gainNode = context.createGain();
    this.pannerNode = context.createPanner();
    
    // Configure panner
    this.pannerNode.panningModel = 'HRTF';
    this.pannerNode.distanceModel = 'inverse';
    this.pannerNode.refDistance = 1;
    this.pannerNode.maxDistance = this.settings.maxDistance;
    this.pannerNode.rolloffFactor = this.settings.rolloffFactor;
    this.pannerNode.coneInnerAngle = 360;
    this.pannerNode.coneOuterAngle = 360;
    this.pannerNode.coneOuterGain = 0;

    // Connect nodes
    this.pannerNode.connect(this.gainNode);
    this.gainNode.connect(context.destination);

    this.updatePosition();
  }

  /**
   * Play audio source
   */
  play(volume: number = 1.0, loop: boolean = false): void {
    if (this.isPlaying) {
      this.stop();
    }

    this.volume = volume;
    this.loop = loop;

    // Create source
    this.source = this.context.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.loop = loop;

    // Connect source to panner
    this.source.connect(this.pannerNode);

    // Set volume
    this.gainNode.gain.value = volume;

    // Start playback
    this.source.start();
    this.isPlaying = true;
  }

  /**
   * Stop audio source
   */
  stop(): void {
    if (this.source && this.isPlaying) {
      this.source.stop();
      this.source = null;
      this.isPlaying = false;
    }
  }

  /**
   * Pause audio source
   */
  pause(): void {
    if (this.source && this.isPlaying) {
      this.source.stop();
      this.isPlaying = false;
    }
  }

  /**
   * Resume audio source
   */
  resume(): void {
    if (!this.isPlaying && this.audioBuffer) {
      this.play(this.volume, this.loop);
    }
  }

  /**
   * Set position
   */
  setPosition(position: Vector3): void {
    this.position.copy(position);
    this.updatePosition();
  }

  /**
   * Set velocity
   */
  setVelocity(velocity: Vector3): void {
    this.velocity.copy(velocity);
    this.updatePosition();
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = this.volume;
  }

  /**
   * Set loop
   */
  setLoop(loop: boolean): void {
    this.loop = loop;
    if (this.source) {
      this.source.loop = loop;
    }
  }

  /**
   * Update audio source
   */
  update(deltaTime: number): void {
    if (!this.isPlaying) return;

    // Update position and velocity
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.updatePosition();

    // Check if source finished
    if (this.source && this.source.playbackState === 'finished') {
      this.isPlaying = false;
      this.source = null;
    }
  }

  /**
   * Update position in Web Audio API
   */
  private updatePosition(): void {
    this.pannerNode.positionX.value = this.position.x;
    this.pannerNode.positionY.value = this.position.y;
    this.pannerNode.positionZ.value = this.position.z;

    this.pannerNode.velocityX.value = this.velocity.x;
    this.pannerNode.velocityY.value = this.velocity.y;
    this.pannerNode.velocityZ.value = this.velocity.z;
  }

  /**
   * Update settings
   */
  updateSettings(settings: AudioSettings): void {
    this.settings = settings;
    this.pannerNode.maxDistance = settings.maxDistance;
    this.pannerNode.rolloffFactor = settings.rolloffFactor;
  }

  /**
   * Get distance to listener
   */
  getDistanceToListener(): number {
    return this.listener.getDistanceTo(this.position);
  }

  /**
   * Check if source is audible (within max distance)
   */
  isAudible(): boolean {
    return this.getDistanceToListener() <= this.settings.maxDistance;
  }

  /**
   * Get current volume (considering distance)
   */
  getCurrentVolume(): number {
    const distance = this.getDistanceToListener();
    if (distance >= this.settings.maxDistance) {
      return 0;
    }

    // Inverse distance falloff
    const volume = 1 / (1 + distance * this.settings.rolloffFactor);
    return Math.max(0, Math.min(1, volume * this.volume));
  }

  /**
   * Get position
   */
  getPosition(): Vector3 {
    return this.position.clone();
  }

  /**
   * Get velocity
   */
  getVelocity(): Vector3 {
    return this.velocity.clone();
  }

  /**
   * Get volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Check if playing
   */
  isSourcePlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get playback time
   */
  getPlaybackTime(): number {
    if (this.source && this.context.currentTime) {
      return this.context.currentTime;
    }
    return 0;
  }

  /**
   * Get duration
   */
  getDuration(): number {
    return this.audioBuffer.duration;
  }

  /**
   * Get source statistics
   */
  getStats(): any {
    return {
      position: this.position,
      velocity: this.velocity,
      volume: this.volume,
      currentVolume: this.getCurrentVolume(),
      distance: this.getDistanceToListener(),
      audible: this.isAudible(),
      playing: this.isPlaying,
      loop: this.loop,
      duration: this.getDuration(),
      playbackTime: this.getPlaybackTime()
    };
  }

  /**
   * Dispose of audio source
   */
  dispose(): void {
    this.stop();
    
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    
    if (this.pannerNode) {
      this.pannerNode.disconnect();
    }
  }
}