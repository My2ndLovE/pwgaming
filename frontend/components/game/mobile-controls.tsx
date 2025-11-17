'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Menu,
  X,
  Settings,
  History,
  Users,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileControlsProps {
  onShowHistory?: () => void;
  onShowPlayers?: () => void;
  onShowSettings?: () => void;
  isSoundEnabled?: boolean;
  onToggleSound?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function MobileControls({
  onShowHistory,
  onShowPlayers,
  onShowSettings,
  isSoundEnabled = true,
  onToggleSound,
  isFullscreen = false,
  onToggleFullscreen,
}: MobileControlsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { icon: History, label: 'History', onClick: onShowHistory },
    { icon: Users, label: 'Players', onClick: onShowPlayers },
    { icon: Settings, label: 'Settings', onClick: onShowSettings },
    {
      icon: isSoundEnabled ? Volume2 : VolumeX,
      label: isSoundEnabled ? 'Sound On' : 'Sound Off',
      onClick: onToggleSound,
    },
    {
      icon: isFullscreen ? Minimize2 : Maximize2,
      label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
      onClick: onToggleFullscreen,
    },
  ];

  return (
    <>
      {/* Menu Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-4 right-4 z-50 bg-gray-900/90 backdrop-blur p-3 rounded-full border border-gray-700 shadow-lg"
      >
        {isMenuOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </motion.button>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-64 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white">Menu</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={index}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        item.onClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-800 rounded-lg transition-colors mb-2"
                    >
                      <Icon className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function SwipeableActionButtons({
  onFold,
  onCheck,
  onCall,
  onRaise,
  canCheck,
  canCall,
  canRaise,
  callAmount,
  minRaise,
  maxRaise,
}: {
  onFold?: () => void;
  onCheck?: () => void;
  onCall?: () => void;
  onRaise?: (amount: number) => void;
  canCheck?: boolean;
  canCall?: boolean;
  canRaise?: boolean;
  callAmount?: number;
  minRaise?: number;
  maxRaise?: number;
}) {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);

  const handleSwipe = (direction: string) => {
    setSwipeDirection(direction);
    setTimeout(() => setSwipeDirection(null), 300);

    switch (direction) {
      case 'left':
        onFold?.();
        break;
      case 'up':
        if (canRaise && minRaise) {
          onRaise?.(minRaise);
        }
        break;
      case 'right':
        if (canCall) {
          onCall?.();
        } else if (canCheck) {
          onCheck?.();
        }
        break;
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.offset.y) > threshold) {
      if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
        // Horizontal swipe
        if (info.offset.x < -threshold) {
          handleSwipe('left');
        } else if (info.offset.x > threshold) {
          handleSwipe('right');
        }
      } else {
        // Vertical swipe
        if (info.offset.y < -threshold) {
          handleSwipe('up');
        }
      }
    }
  };

  return (
    <div className="relative w-full h-32 bg-gray-900/80 rounded-lg border border-gray-700 overflow-hidden">
      {/* Swipe Indicators */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-gray-500 text-sm">
          <div className="mb-1">Swipe to act</div>
          <div className="flex gap-2 text-xs">
            <span>← Fold</span>
            <span>↑ Raise</span>
            <span>→ {canCall ? 'Call' : 'Check'}</span>
          </div>
        </div>
      </div>

      {/* Draggable Area */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
      >
        <motion.div
          animate={
            swipeDirection === 'left'
              ? { x: -100, opacity: 0 }
              : swipeDirection === 'right'
              ? { x: 100, opacity: 0 }
              : swipeDirection === 'up'
              ? { y: -100, opacity: 0 }
              : { x: 0, y: 0, opacity: 1 }
          }
          transition={{ duration: 0.3 }}
          className="w-16 h-16 bg-white/10 backdrop-blur rounded-full border-2 border-white/30 flex items-center justify-center"
        >
          <div className="text-white text-2xl">👆</div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function MobileTableLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:hidden">
      {/* Portrait mode optimized layout */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

export function useHapticFeedback() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(30),
    success: () => vibrate([10, 50, 10]),
    error: () => vibrate([50, 100, 50]),
    tap: () => vibrate(5),
  };
}
