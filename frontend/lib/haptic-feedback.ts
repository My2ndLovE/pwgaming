/**
 * Haptic Feedback Manager
 * Provides vibration feedback for mobile devices
 */

export type HapticPattern =
  | 'light' // Single short vibration (10ms)
  | 'medium' // Single medium vibration (20ms)
  | 'heavy' // Single heavy vibration (50ms)
  | 'double' // Double tap pattern
  | 'success' // Success pattern (short-pause-short)
  | 'error' // Error pattern (heavy vibration)
  | 'notification'; // Notification pattern

interface HapticSettings {
  enabled: boolean;
}

class HapticFeedbackClass {
  private settings: HapticSettings = {
    enabled: true,
  };

  private patterns: Record<HapticPattern, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 50,
    double: [20, 50, 20],
    success: [20, 100, 20],
    error: 50,
    notification: [10, 50, 10, 50, 10],
  };

  /**
   * Check if haptic feedback is supported
   */
  isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Trigger haptic feedback
   */
  trigger(pattern: HapticPattern): void {
    if (!this.settings.enabled || !this.isSupported()) {
      return;
    }

    const vibrationPattern = this.patterns[pattern];

    try {
      navigator.vibrate(vibrationPattern);
    } catch (error) {
      console.warn('Haptic feedback failed', error);
    }
  }

  /**
   * Trigger custom vibration pattern
   */
  custom(duration: number | number[]): void {
    if (!this.settings.enabled || !this.isSupported()) {
      return;
    }

    try {
      navigator.vibrate(duration);
    } catch (error) {
      console.warn('Custom haptic feedback failed', error);
    }
  }

  /**
   * Stop all vibrations
   */
  stop(): void {
    if (!this.isSupported()) return;

    try {
      navigator.vibrate(0);
    } catch (error) {
      console.warn('Failed to stop haptic feedback', error);
    }
  }

  /**
   * Enable/disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  /**
   * Check if haptic feedback is enabled
   */
  isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): void {
    try {
      const saved = localStorage.getItem('haptic-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.settings = { ...this.settings, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load haptic settings', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(): void {
    try {
      localStorage.setItem('haptic-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save haptic settings', error);
    }
  }
}

// Singleton instance
export const HapticFeedback = new HapticFeedbackClass();

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  const trigger = (pattern: HapticPattern) => HapticFeedback.trigger(pattern);
  const custom = (duration: number | number[]) => HapticFeedback.custom(duration);
  const stop = () => HapticFeedback.stop();
  const isSupported = () => HapticFeedback.isSupported();

  return {
    trigger,
    custom,
    stop,
    isSupported,
  };
}
