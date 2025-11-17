'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DealerButtonProps {
  position: number; // 0-8 (seat position)
  totalSeats?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function DealerButton({
  position,
  totalSeats = 9,
  size = 'md',
  animated = true,
}: DealerButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  // Calculate position on the table (circular layout)
  const angle = (position / totalSeats) * 2 * Math.PI - Math.PI / 2;
  const radius = 180; // Distance from center
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  const buttonContent = (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-gradient-to-br from-white via-gray-200 to-gray-300
        border-4 border-gray-800
        flex items-center justify-center
        font-bold text-gray-900
        shadow-lg
        relative
        overflow-hidden
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent" />
      <span className="relative z-10">D</span>
    </div>
  );

  if (!animated) {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {buttonContent}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`dealer-${position}`}
        className="absolute pointer-events-none z-20"
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{
          scale: 1,
          rotate: 0,
          opacity: 1,
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
        }}
        exit={{ scale: 0, rotate: 180, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 20,
          duration: 0.6,
        }}
        style={{
          transform: 'translate(-50%, -50%)',
        }}
      >
        {buttonContent}
      </motion.div>
    </AnimatePresence>
  );
}

export function DealerButtonStatic({
  size = 'md',
}: {
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-gradient-to-br from-white via-gray-200 to-gray-300
        border-4 border-gray-800
        flex items-center justify-center
        font-bold text-gray-900
        shadow-lg
        relative
        overflow-hidden
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent" />
      <span className="relative z-10">D</span>
    </div>
  );
}
