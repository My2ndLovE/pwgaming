import { useEffect, useState, useCallback } from 'react';
import { SoundManager, SoundType } from '../lib/sound-manager';

interface UseSoundReturn {
  play: (type: SoundType) => void;
  volume: number;
  setVolume: (volume: number) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

/**
 * React hook for managing game sounds
 */
export function useSound(): UseSoundReturn {
  const [volume, setVolumeState] = useState(SoundManager.getVolume());
  const [enabled, setEnabledState] = useState(SoundManager.isEnabled());

  // Initialize sound manager on mount
  useEffect(() => {
    SoundManager.loadSettings();
    SoundManager.initialize().catch((error) => {
      console.warn('Failed to initialize sound manager', error);
    });

    setVolumeState(SoundManager.getVolume());
    setEnabledState(SoundManager.isEnabled());
  }, []);

  const play = useCallback((type: SoundType) => {
    SoundManager.play(type);
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    SoundManager.setVolume(newVolume);
    SoundManager.saveSettings();
    setVolumeState(newVolume);
  }, []);

  const setEnabled = useCallback((newEnabled: boolean) => {
    SoundManager.setEnabled(newEnabled);
    SoundManager.saveSettings();
    setEnabledState(newEnabled);
  }, []);

  return {
    play,
    volume,
    setVolume,
    enabled,
    setEnabled,
  };
}
