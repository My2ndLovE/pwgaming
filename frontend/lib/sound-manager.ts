/**
 * Sound Manager for Game Audio
 * Manages sound effects and background music
 */

export type SoundType =
  | 'bet'
  | 'call'
  | 'raise'
  | 'fold'
  | 'check'
  | 'win'
  | 'lose'
  | 'chip'
  | 'card-deal'
  | 'timer-warning'
  | 'player-join'
  | 'player-leave';

interface SoundSettings {
  volume: number; // 0-1
  enabled: boolean;
}

class SoundManagerClass {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private settings: SoundSettings = {
    volume: 0.7,
    enabled: true,
  };

  /**
   * Initialize sound manager
   * Preload sound files for better performance
   */
  async initialize(soundPaths: Partial<Record<SoundType, string>> = {}) {
    // Default sound paths (can be overridden)
    const defaults: Record<SoundType, string> = {
      bet: '/sounds/bet.mp3',
      call: '/sounds/call.mp3',
      raise: '/sounds/raise.mp3',
      fold: '/sounds/fold.mp3',
      check: '/sounds/check.mp3',
      win: '/sounds/win.mp3',
      lose: '/sounds/lose.mp3',
      chip: '/sounds/chip.mp3',
      'card-deal': '/sounds/card-deal.mp3',
      'timer-warning': '/sounds/timer-warning.mp3',
      'player-join': '/sounds/player-join.mp3',
      'player-leave': '/sounds/player-leave.mp3',
    };

    const paths = { ...defaults, ...soundPaths };

    // Preload sounds
    for (const [type, path] of Object.entries(paths)) {
      try {
        const audio = new Audio(path);
        audio.volume = this.settings.volume;
        audio.preload = 'auto';
        this.sounds.set(type as SoundType, audio);
      } catch (error) {
        console.warn(`Failed to load sound: ${type}`, error);
      }
    }
  }

  /**
   * Play a sound effect
   */
  play(type: SoundType): void {
    if (!this.settings.enabled) return;

    const sound = this.sounds.get(type);
    if (!sound) {
      console.warn(`Sound not found: ${type}`);
      return;
    }

    // Clone the audio to allow overlapping sounds
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.volume = this.settings.volume;
    clone.play().catch((error) => {
      console.warn(`Failed to play sound: ${type}`, error);
    });
  }

  /**
   * Set volume for all sounds
   */
  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach((sound) => {
      sound.volume = this.settings.volume;
    });
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.settings.volume;
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): void {
    try {
      const saved = localStorage.getItem('sound-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.settings = { ...this.settings, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load sound settings', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(): void {
    try {
      localStorage.setItem('sound-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save sound settings', error);
    }
  }
}

// Singleton instance
export const SoundManager = new SoundManagerClass();
