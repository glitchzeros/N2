export interface AccessibilitySettings {
  // Visual
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  uiScale: number; // 0.5 to 2.0
  highContrast: boolean;
  motionReduction: boolean;
  subtitles: boolean;
  subtitleSize: 'small' | 'medium' | 'large';
  
  // Audio
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
  spatialAudio: boolean;
  visualSoundIndicators: boolean;
  
  // Motor
  buttonRemapping: Map<string, string>;
  holdToToggle: boolean;
  aimAssistance: boolean;
  autoRun: boolean;
  simplifiedControls: boolean;
  
  // Cognitive
  difficultyLevel: 'easy' | 'normal' | 'hard';
  tutorialSkip: boolean;
  objectiveMarkers: boolean;
  pingSystem: boolean;
  smartCompass: boolean;
}

export interface ColorblindFilter {
  name: string;
  matrix: number[][];
}

/**
 * Comprehensive accessibility system
 */
export class AccessibilityManager {
  private settings: AccessibilitySettings;
  private colorblindFilters: Map<string, ColorblindFilter>;
  private audioContext: AudioContext | null = null;
  private visualSoundCanvas: HTMLCanvasElement | null = null;
  
  private onSettingsChanged: ((settings: AccessibilitySettings) => void) | null = null;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.colorblindFilters = this.createColorblindFilters();
    this.loadSettings();
    this.applySettings();
  }

  /**
   * Get default accessibility settings
   */
  private getDefaultSettings(): AccessibilitySettings {
    return {
      // Visual
      colorblindMode: 'none',
      uiScale: 1.0,
      highContrast: false,
      motionReduction: false,
      subtitles: true,
      subtitleSize: 'medium',
      
      // Audio
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 1.0,
      voiceVolume: 1.0,
      spatialAudio: true,
      visualSoundIndicators: false,
      
      // Motor
      buttonRemapping: new Map(),
      holdToToggle: false,
      aimAssistance: false,
      autoRun: false,
      simplifiedControls: false,
      
      // Cognitive
      difficultyLevel: 'normal',
      tutorialSkip: false,
      objectiveMarkers: true,
      pingSystem: true,
      smartCompass: true
    };
  }

  /**
   * Create colorblind filters
   */
  private createColorblindFilters(): Map<string, ColorblindFilter> {
    const filters = new Map<string, ColorblindFilter>();
    
    // Protanopia (red-green colorblindness)
    filters.set('protanopia', {
      name: 'Protanopia',
      matrix: [
        [0.567, 0.433, 0.000],
        [0.558, 0.442, 0.000],
        [0.000, 0.242, 0.758]
      ]
    });
    
    // Deuteranopia (red-green colorblindness)
    filters.set('deuteranopia', {
      name: 'Deuteranopia',
      matrix: [
        [0.625, 0.375, 0.000],
        [0.700, 0.300, 0.000],
        [0.000, 0.300, 0.700]
      ]
    });
    
    // Tritanopia (blue-yellow colorblindness)
    filters.set('tritanopia', {
      name: 'Tritanopia',
      matrix: [
        [0.950, 0.050, 0.000],
        [0.000, 0.433, 0.567],
        [0.000, 0.475, 0.525]
      ]
    });
    
    return filters;
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('nexus-royale-accessibility');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
        
        // Restore button remapping
        if (parsed.buttonRemapping) {
          this.settings.buttonRemapping = new Map(Object.entries(parsed.buttonRemapping));
        }
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      const toSave = { ...this.settings };
      toSave.buttonRemapping = Object.fromEntries(this.settings.buttonRemapping);
      localStorage.setItem('nexus-royale-accessibility', JSON.stringify(toSave));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }

  /**
   * Apply current settings
   */
  private applySettings(): void {
    this.applyVisualSettings();
    this.applyAudioSettings();
    this.applyMotorSettings();
    this.applyCognitiveSettings();
    this.saveSettings();
    
    if (this.onSettingsChanged) {
      this.onSettingsChanged(this.settings);
    }
  }

  /**
   * Apply visual accessibility settings
   */
  private applyVisualSettings(): void {
    // Apply UI scaling
    document.documentElement.style.setProperty('--ui-scale', this.settings.uiScale.toString());
    
    // Apply high contrast
    if (this.settings.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    // Apply motion reduction
    if (this.settings.motionReduction) {
      document.body.classList.add('motion-reduced');
    } else {
      document.body.classList.remove('motion-reduced');
    }
    
    // Apply colorblind filter
    this.applyColorblindFilter();
  }

  /**
   * Apply colorblind filter
   */
  private applyColorblindFilter(): void {
    if (this.settings.colorblindMode === 'none') {
      document.body.style.filter = '';
      return;
    }
    
    const filter = this.colorblindFilters.get(this.settings.colorblindMode);
    if (filter) {
      const matrix = filter.matrix;
      const filterString = `matrix(${matrix[0].join(', ')}, ${matrix[1].join(', ')}, ${matrix[2].join(', ')})`;
      document.body.style.filter = filterString;
    }
  }

  /**
   * Apply audio accessibility settings
   */
  private applyAudioSettings(): void {
    // Audio settings are applied through the AudioManager
    // This method can be called to notify the audio system
  }

  /**
   * Apply motor accessibility settings
   */
  private applyMotorSettings(): void {
    // Motor settings are applied through the InputManager
    // This method can be called to notify the input system
  }

  /**
   * Apply cognitive accessibility settings
   */
  private applyCognitiveSettings(): void {
    // Cognitive settings are applied through the game systems
    // This method can be called to notify the game systems
  }

  /**
   * Update accessibility settings
   */
  updateSettings(updates: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.applySettings();
  }

  /**
   * Get current settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.applySettings();
  }

  /**
   * Set callback for settings changes
   */
  onSettingsChange(callback: (settings: AccessibilitySettings) => void): void {
    this.onSettingsChanged = callback;
  }

  /**
   * Get remapped key for a given action
   */
  getRemappedKey(action: string): string {
    return this.settings.buttonRemapping.get(action) || action;
  }

  /**
   * Set key remapping
   */
  setKeyRemapping(action: string, key: string): void {
    this.settings.buttonRemapping.set(action, key);
    this.applySettings();
  }

  /**
   * Get colorblind filter
   */
  getColorblindFilter(): ColorblindFilter | null {
    if (this.settings.colorblindMode === 'none') {
      return null;
    }
    return this.colorblindFilters.get(this.settings.colorblindMode) || null;
  }

  /**
   * Get available colorblind modes
   */
  getColorblindModes(): string[] {
    return Array.from(this.colorblindFilters.keys());
  }

  /**
   * Check if aim assistance is enabled
   */
  isAimAssistanceEnabled(): boolean {
    return this.settings.aimAssistance;
  }

  /**
   * Check if simplified controls are enabled
   */
  isSimplifiedControlsEnabled(): boolean {
    return this.settings.simplifiedControls;
  }

  /**
   * Get difficulty multiplier
   */
  getDifficultyMultiplier(): number {
    switch (this.settings.difficultyLevel) {
      case 'easy': return 0.7;
      case 'normal': return 1.0;
      case 'hard': return 1.3;
      default: return 1.0;
    }
  }

  /**
   * Get audio volume for a specific category
   */
  getAudioVolume(category: 'master' | 'music' | 'sfx' | 'voice'): number {
    switch (category) {
      case 'master': return this.settings.masterVolume;
      case 'music': return this.settings.masterVolume * this.settings.musicVolume;
      case 'sfx': return this.settings.masterVolume * this.settings.sfxVolume;
      case 'voice': return this.settings.masterVolume * this.settings.voiceVolume;
      default: return this.settings.masterVolume;
    }
  }

  /**
   * Create visual sound indicators
   */
  createVisualSoundIndicators(): void {
    if (!this.settings.visualSoundIndicators) return;
    
    if (!this.visualSoundCanvas) {
      this.visualSoundCanvas = document.createElement('canvas');
      this.visualSoundCanvas.style.position = 'fixed';
      this.visualSoundCanvas.style.top = '0';
      this.visualSoundCanvas.style.left = '0';
      this.visualSoundCanvas.style.pointerEvents = 'none';
      this.visualSoundCanvas.style.zIndex = '1000';
      document.body.appendChild(this.visualSoundCanvas);
    }
  }

  /**
   * Update visual sound indicators
   */
  updateVisualSoundIndicators(sounds: Array<{ position: any; volume: number; type: string }>): void {
    if (!this.settings.visualSoundIndicators || !this.visualSoundCanvas) return;
    
    const ctx = this.visualSoundCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.visualSoundCanvas.width, this.visualSoundCanvas.height);
    
    // Draw sound indicators
    for (const sound of sounds) {
      const alpha = Math.min(sound.volume, 1.0);
      const radius = 20 + sound.volume * 30;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.getSoundColor(sound.type);
      ctx.beginPath();
      ctx.arc(sound.position.x, sound.position.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Get color for sound type
   */
  private getSoundColor(type: string): string {
    switch (type) {
      case 'gunshot': return '#ff0000';
      case 'explosion': return '#ff6600';
      case 'footstep': return '#00ff00';
      case 'voice': return '#0066ff';
      default: return '#ffffff';
    }
  }

  /**
   * Get accessibility statistics
   */
  getStats(): any {
    return {
      settings: this.settings,
      colorblindMode: this.settings.colorblindMode,
      uiScale: this.settings.uiScale,
      audioEnabled: this.settings.masterVolume > 0,
      aimAssistance: this.settings.aimAssistance,
      difficulty: this.settings.difficultyLevel,
      remappedKeys: this.settings.buttonRemapping.size
    };
  }
}