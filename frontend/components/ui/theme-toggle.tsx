'use client';

import { useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  variant?: 'icon' | 'full' | 'cycle';
  className?: string;
}

/**
 * Theme Toggle Component
 * Allows switching between light, dark, and system themes
 */
export function ThemeToggle({ variant = 'cycle', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  // Cycle through themes
  const cycleTheme = () => {
    const next: Record<Theme, Theme> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    };
    setTheme(next[theme]);
  };

  if (variant === 'full') {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
            className="gap-2"
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
            className="gap-2"
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('system')}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            System
          </Button>
        </div>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className={className}
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Toggle theme"
        >
          {theme === 'system' ? (
            <Monitor className="h-5 w-5" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              <button
                onClick={() => {
                  setTheme('light');
                  setShowMenu(false);
                }}
                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => {
                  setTheme('dark');
                  setShowMenu(false);
                }}
                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </button>
              <button
                onClick={() => {
                  setTheme('system');
                  setShowMenu(false);
                }}
                className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Cycle variant - simple click to cycle
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={cycleTheme}
      aria-label="Toggle theme"
      title={`Current: ${theme}`}
    >
      {theme === 'system' ? (
        <Monitor className="h-5 w-5" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
