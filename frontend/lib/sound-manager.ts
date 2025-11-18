/**
 * Sound Manager for Game Audio
 * Manages sound effects and background music
 * Falls back to Web Audio API generated sounds if files are missing
 */

import { generateAllSounds } from './generate-sounds';

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
  private generatedSounds: Map<string, Blob> | null = null;
  private settings: SoundSettings = {
    volume: 0.7,
    enabled: true,
  };
  private initialized = false;

  /**
   * Initialize sound manager
   * Preload sound files for better performance
   * Falls back to generated sounds if files are missing
   */
  async initialize(soundPaths: Partial<Record<SoundType, string>> = {}) {
    if (this.initialized) return;

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
    let missingCount = 0;

    // Preload sounds
    for (const [type, path] of Object.entries(paths)) {
      try {
        const audio = new Audio(path);
        audio.volume = this.settings.volume;
        audio.preload = 'auto';

        // Test if sound file loads
        await new Promise<void>((resolve, reject) => {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.addEventListener('error', () => reject(), { once: true });

          // Timeout after 2 seconds
          setTimeout(() => reject(), 2000);
        });

        this.sounds.set(type as SoundType, audio);
      } catch (error) {
        console.warn(`Sound file not found: ${type}, will use generated sound`);
        missingCount++;
      }
    }

    // If any sounds are missing, generate them
    if (missingCount > 0) {
      console.log(`Generating ${missingCount} missing sound(s)...`);
      try {
        this.generatedSounds = await generateAllSounds();

        // Create audio elements from generated blobs
        for (const [type, blob] of this.generatedSounds.entries()) {
          if (!this.sounds.has(type as SoundType)) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = this.settings.volume;
            this.sounds.set(type as SoundType, audio);
          }
        }

        console.log('Generated sounds ready');
      } catch (error) {
        console.error('Failed to generate sounds:', error);
      }
    }

    this.initialized = true;
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
