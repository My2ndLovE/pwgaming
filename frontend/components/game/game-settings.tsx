'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Zap,
  ZapOff,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export interface GameSettingsData {
  sound: {
    enabled: boolean;
    volume: number;
    cardDealing: boolean;
    chipMovement: boolean;
    playerActions: boolean;
    notifications: boolean;
  };
  display: {
    darkMode: boolean;
    animations: boolean;
    cardAnimationSpeed: number; // 1-10
    showPlayerStats: boolean;
    showHandHistory: boolean;
  };
  gameplay: {
    autoMuck: boolean;
    autoTopup: boolean;
    timebank: boolean;
    confirmActions: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    screenReaderMode: boolean;
    reducedMotion: boolean;
  };
}

const DEFAULT_SETTINGS: GameSettingsData = {
  sound: {
    enabled: true,
    volume: 70,
    cardDealing: true,
    chipMovement: true,
    playerActions: true,
    notifications: true,
  },
  display: {
    darkMode: true,
    animations: true,
    cardAnimationSpeed: 5,
    showPlayerStats: true,
    showHandHistory: true,
  },
  gameplay: {
    autoMuck: false,
    autoTopup: false,
    timebank: true,
    confirmActions: true,
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    screenReaderMode: false,
    reducedMotion: false,
  },
};

interface GameSettingsProps {
  initialSettings?: Partial<GameSettingsData>;
  onSave?: (settings: GameSettingsData) => void;
  trigger?: React.ReactNode;
}

export function GameSettings({ initialSettings, onSave, trigger }: GameSettingsProps) {
  const [settings, setSettings] = useState<GameSettingsData>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('gameSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse game settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    onSave?.(settings);
    setIsOpen(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const updateSetting = (category: keyof GameSettingsData, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Game Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sound Settings */}
          <SettingsSection title="Sound" icon={settings.sound.enabled ? Volume2 : VolumeX}>
            <SettingRow label="Enable Sound">
              <Switch
                checked={settings.sound.enabled}
                onCheckedChange={(checked) => updateSetting('sound', 'enabled', checked)}
              />
            </SettingRow>

            {settings.sound.enabled && (
              <>
                <SettingRow label={`Volume: ${settings.sound.volume}%`}>
                  <Slider
                    value={[settings.sound.volume]}
                    onValueChange={(value) => updateSetting('sound', 'volume', value[0])}
                    max={100}
                    step={1}
                    className="w-48"
                  />
                </SettingRow>

                <SettingRow label="Card Dealing Sounds">
                  <Switch
                    checked={settings.sound.cardDealing}
                    onCheckedChange={(checked) => updateSetting('sound', 'cardDealing', checked)}
                  />
                </SettingRow>

                <SettingRow label="Chip Movement Sounds">
                  <Switch
                    checked={settings.sound.chipMovement}
                    onCheckedChange={(checked) =>
                      updateSetting('sound', 'chipMovement', checked)
                    }
                  />
                </SettingRow>

                <SettingRow label="Player Action Sounds">
                  <Switch
                    checked={settings.sound.playerActions}
                    onCheckedChange={(checked) =>
                      updateSetting('sound', 'playerActions', checked)
                    }
                  />
                </SettingRow>

                <SettingRow label="Notification Sounds">
                  <Switch
                    checked={settings.sound.notifications}
                    onCheckedChange={(checked) =>
                      updateSetting('sound', 'notifications', checked)
                    }
                  />
                </SettingRow>
              </>
            )}
          </SettingsSection>

          {/* Display Settings */}
          <SettingsSection
            title="Display"
            icon={settings.display.darkMode ? Moon : Sun}
          >
            <SettingRow label="Dark Mode">
              <Switch
                checked={settings.display.darkMode}
                onCheckedChange={(checked) => updateSetting('display', 'darkMode', checked)}
              />
            </SettingRow>

            <SettingRow label="Enable Animations">
              <Switch
                checked={settings.display.animations}
                onCheckedChange={(checked) => updateSetting('display', 'animations', checked)}
              />
            </SettingRow>

            {settings.display.animations && (
              <SettingRow label={`Animation Speed: ${settings.display.cardAnimationSpeed}/10`}>
                <Slider
                  value={[settings.display.cardAnimationSpeed]}
                  onValueChange={(value) =>
                    updateSetting('display', 'cardAnimationSpeed', value[0])
                  }
                  min={1}
                  max={10}
                  step={1}
                  className="w-48"
                />
              </SettingRow>
            )}

            <SettingRow label="Show Player Stats">
              <Switch
                checked={settings.display.showPlayerStats}
                onCheckedChange={(checked) =>
                  updateSetting('display', 'showPlayerStats', checked)
                }
              />
            </SettingRow>

            <SettingRow label="Show Hand History">
              <Switch
                checked={settings.display.showHandHistory}
                onCheckedChange={(checked) =>
                  updateSetting('display', 'showHandHistory', checked)
                }
              />
            </SettingRow>
          </SettingsSection>

          {/* Gameplay Settings */}
          <SettingsSection title="Gameplay" icon={Zap}>
            <SettingRow
              label="Auto Muck Losing Hands"
              description="Automatically fold losing hands at showdown"
            >
              <Switch
                checked={settings.gameplay.autoMuck}
                onCheckedChange={(checked) => updateSetting('gameplay', 'autoMuck', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Auto Top-up"
              description="Automatically rebuy to max when stack is low"
            >
              <Switch
                checked={settings.gameplay.autoTopup}
                onCheckedChange={(checked) => updateSetting('gameplay', 'autoTopup', checked)}
              />
            </SettingRow>

            <SettingRow label="Time Bank" description="Enable extra time for difficult decisions">
              <Switch
                checked={settings.gameplay.timebank}
                onCheckedChange={(checked) => updateSetting('gameplay', 'timebank', checked)}
              />
            </SettingRow>

            <SettingRow
              label="Confirm Actions"
              description="Require confirmation for fold/all-in"
            >
              <Switch
                checked={settings.gameplay.confirmActions}
                onCheckedChange={(checked) =>
                  updateSetting('gameplay', 'confirmActions', checked)
                }
              />
            </SettingRow>
          </SettingsSection>

          {/* Accessibility Settings */}
          <SettingsSection title="Accessibility" icon={Settings}>
            <SettingRow label="High Contrast Mode">
              <Switch
                checked={settings.accessibility.highContrast}
                onCheckedChange={(checked) =>
                  updateSetting('accessibility', 'highContrast', checked)
                }
              />
            </SettingRow>

            <SettingRow label="Large Text">
              <Switch
                checked={settings.accessibility.largeText}
                onCheckedChange={(checked) =>
                  updateSetting('accessibility', 'largeText', checked)
                }
              />
            </SettingRow>

            <SettingRow label="Screen Reader Mode">
              <Switch
                checked={settings.accessibility.screenReaderMode}
                onCheckedChange={(checked) =>
                  updateSetting('accessibility', 'screenReaderMode', checked)
                }
              />
            </SettingRow>

            <SettingRow label="Reduced Motion">
              <Switch
                checked={settings.accessibility.reducedMotion}
                onCheckedChange={(checked) =>
                  updateSetting('accessibility', 'reducedMotion', checked)
                }
              />
            </SettingRow>
          </SettingsSection>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset} className="border-gray-600 text-gray-300">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-200 font-semibold">
        <Icon className="w-4 h-4" />
        <h3>{title}</h3>
      </div>
      <div className="space-y-3 pl-6 border-l-2 border-gray-700">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <Label className="text-gray-300 font-medium">{label}</Label>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function useGameSettings() {
  const [settings, setSettings] = useState<GameSettingsData>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = localStorage.getItem('gameSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error('Failed to parse game settings:', e);
      }
    }
  }, []);

  return settings;
}
