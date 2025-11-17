import { useEffect, useCallback } from 'react';

export interface KeyboardShortcuts {
  onFold?: () => void;
  onCheck?: () => void;
  onCall?: () => void;
  onRaise?: () => void;
  onBet?: () => void;
  onAllIn?: () => void;
  onShowSettings?: () => void;
  onShowHistory?: () => void;
  onToggleSound?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const { enabled = true } = shortcuts;

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Convert to uppercase for case-insensitive matching
      const key = event.key.toUpperCase();

      switch (key) {
        case 'F':
          event.preventDefault();
          shortcuts.onFold?.();
          break;

        case 'C':
          event.preventDefault();
          shortcuts.onCheck?.();
          break;

        case 'K':
          event.preventDefault();
          shortcuts.onCall?.();
          break;

        case 'R':
          event.preventDefault();
          shortcuts.onRaise?.();
          break;

        case 'B':
          event.preventDefault();
          shortcuts.onBet?.();
          break;

        case 'A':
          event.preventDefault();
          shortcuts.onAllIn?.();
          break;

        case 'S':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            shortcuts.onShowSettings?.();
          }
          break;

        case 'H':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            shortcuts.onShowHistory?.();
          }
          break;

        case 'M':
          event.preventDefault();
          shortcuts.onToggleSound?.();
          break;

        case '?':
          event.preventDefault();
          // Show shortcuts help
          showShortcutsHelp();
          break;

        default:
          break;
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [handleKeyPress, enabled]);
}

function showShortcutsHelp() {
  // This could be enhanced to show a modal with all shortcuts
  console.log(`
Keyboard Shortcuts:
------------------
F - Fold
C - Check
K - Call (K for "kall")
R - Raise
B - Bet
A - All-In
M - Mute/Unmute Sound
Ctrl+S - Settings
Ctrl+H - History
? - Show this help
  `);
}

export const KEYBOARD_SHORTCUTS_HELP = [
  { key: 'F', description: 'Fold your hand', category: 'Actions' },
  { key: 'C', description: 'Check', category: 'Actions' },
  { key: 'K', description: 'Call the current bet', category: 'Actions' },
  { key: 'R', description: 'Raise the bet', category: 'Actions' },
  { key: 'B', description: 'Place a bet', category: 'Actions' },
  { key: 'A', description: 'Go all-in', category: 'Actions' },
  { key: 'M', description: 'Mute/Unmute sound', category: 'Settings' },
  { key: 'Ctrl+S', description: 'Open settings', category: 'Settings' },
  { key: 'Ctrl+H', description: 'Show history', category: 'Settings' },
  { key: '?', description: 'Show keyboard shortcuts', category: 'Help' },
];
