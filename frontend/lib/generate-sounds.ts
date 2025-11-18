/**
 * Sound Generation Utility
 *
 * Generates simple beep sounds using Web Audio API for development.
 * Replace with professional sound assets in production.
 */

export interface SoundConfig {
  frequency: number; // Hz
  duration: number; // seconds
  type: OscillatorType; // sine, square, sawtooth, triangle
  volume: number; // 0-1
}

const soundConfigs: Record<string, SoundConfig> = {
  // Game actions - different pitches
  bet: { frequency: 440, duration: 0.15, type: 'sine', volume: 0.3 },
  call: { frequency: 523, duration: 0.15, type: 'sine', volume: 0.3 },
  raise: { frequency: 659, duration: 0.2, type: 'sine', volume: 0.4 },
  fold: { frequency: 330, duration: 0.2, type: 'sine', volume: 0.25 },
  check: { frequency: 392, duration: 0.1, type: 'sine', volume: 0.25 },

  // Game events
  'card-deal': { frequency: 880, duration: 0.08, type: 'sine', volume: 0.2 },
  chip: { frequency: 1047, duration: 0.05, type: 'triangle', volume: 0.3 },
  win: { frequency: 523, duration: 0.5, type: 'sine', volume: 0.5 }, // C major chord
  lose: { frequency: 277, duration: 0.4, type: 'sine', volume: 0.3 }, // C# minor

  // Player events
  'player-join': { frequency: 587, duration: 0.15, type: 'sine', volume: 0.3 },
  'player-leave': { frequency: 440, duration: 0.15, type: 'sine', volume: 0.25 },
  'timer-warning': { frequency: 987, duration: 0.1, type: 'square', volume: 0.4 },
};

/**
 * Generate a simple beep sound using Web Audio API
 */
export function generateBeep(config: SoundConfig): AudioBuffer | null {
  try {
    // Create offline audio context
    const audioContext = new OfflineAudioContext(
      1, // mono
      config.duration * 44100, // sample rate 44.1kHz
      44100
    );

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = config.type;
    oscillator.frequency.value = config.frequency;

    // Envelope (fade in/out)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      config.volume,
      audioContext.currentTime + 0.01
    );
    gainNode.gain.linearRampToValueAtTime(
      config.volume,
      audioContext.currentTime + config.duration - 0.05
    );
    gainNode.gain.linearRampToValueAtTime(
      0,
      audioContext.currentTime + config.duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(config.duration);

    // This is async but we handle it in the calling code
    return null; // Will be replaced by actual rendering
  } catch (error) {
    console.error('Failed to generate sound:', error);
    return null;
  }
}

/**
 * Generate all sound files and save as MP3
 * This is a development utility - in production, use real sound files
 */
export async function generateAllSounds(): Promise<Map<string, Blob>> {
  const sounds = new Map<string, Blob>();

  for (const [name, config] of Object.entries(soundConfigs)) {
    try {
      const audioContext = new OfflineAudioContext(
        1,
        config.duration * 44100,
        44100
      );

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = config.type;
      oscillator.frequency.value = config.frequency;

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        config.volume,
        audioContext.currentTime + 0.01
      );
      gainNode.gain.linearRampToValueAtTime(
        config.volume,
        audioContext.currentTime + config.duration - 0.05
      );
      gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + config.duration
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(config.duration);

      const audioBuffer = await audioContext.startRendering();

      // Convert to WAV blob (browsers don't support direct MP3 encoding)
      const wavBlob = audioBufferToWav(audioBuffer);
      sounds.set(name, wavBlob);
    } catch (error) {
      console.error(`Failed to generate sound: ${name}`, error);
    }
  }

  return sounds;
}

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(36 + length); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(buffer.numberOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
  setUint16(buffer.numberOfChannels * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length); // chunk length

  // Write audio data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // convert to 16-bit
      view.setInt16(offset, sample, true); // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

/**
 * Get sound configuration for a specific sound type
 */
export function getSoundConfig(soundType: string): SoundConfig | undefined {
  return soundConfigs[soundType];
}
