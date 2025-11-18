'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/hooks/use-sound';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface SoundSettingsProps {
  className?: string;
}

/**
 * Sound Settings Component
 * Controls for enabling/disabling sounds and adjusting volume
 */
export function SoundSettings({ className }: SoundSettingsProps) {
  const { volume, setVolume, enabled, setEnabled } = useSound();

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0] / 100); // Convert 0-100 to 0-1
  };

  const toggleMute = () => {
    setEnabled(!enabled);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-4">
        {/* Enable/Disable Switch */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            aria-label={enabled ? 'Mute sounds' : 'Unmute sounds'}
          >
            {enabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
          <Label htmlFor="sound-enabled" className="text-sm">
            Sound Effects
          </Label>
        </div>

        <Switch
          id="sound-enabled"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {/* Volume Slider */}
      {enabled && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="volume-slider" className="text-sm">
              Volume
            </Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <Slider
            id="volume-slider"
            min={0}
            max={100}
            step={5}
            value={[volume * 100]}
            onValueChange={handleVolumeChange}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
