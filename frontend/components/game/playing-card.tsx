'use client';

import React from 'react';

interface PlayingCardProps {
  card: string; // e.g., "Ah" (Ace of hearts) or "" for face down
  faceUp: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PlayingCard({ card, faceUp, size = 'md' }: PlayingCardProps) {
  const sizeClasses = {
    sm: 'w-12 h-16 text-xs',
    md: 'w-16 h-24 text-sm',
    lg: 'w-20 h-28 text-base',
  };

  if (!faceUp) {
    return (
      <div className={`
        ${sizeClasses[size]}
        bg-gradient-to-br from-blue-700 to-blue-900
        rounded-lg border-2 border-blue-400
        shadow-lg
        flex items-center justify-center
        relative overflow-hidden
      `}>
        {/* Card back pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            )`
          }} />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className={`
        ${sizeClasses[size]}
        bg-white/10
        rounded-lg border-2 border-dashed border-white/30
        shadow-lg
      `} />
    );
  }

  // Parse card (e.g., "Ah" -> rank: A, suit: h)
  const rank = card.slice(0, -1);
  const suit = card.slice(-1);

  const suitSymbols: Record<string, string> = {
    h: '♥',
    d: '♦',
    c: '♣',
    s: '♠',
  };

  const suitColors: Record<string, string> = {
    h: 'text-red-600',
    d: 'text-red-600',
    c: 'text-black',
    s: 'text-black',
  };

  const symbol = suitSymbols[suit] || '?';
  const color = suitColors[suit] || 'text-gray-600';

  return (
    <div className={`
      ${sizeClasses[size]}
      bg-white
      rounded-lg border-2 border-gray-300
      shadow-lg
      flex flex-col items-center justify-between
      p-1
      transition-transform hover:scale-105
    `}>
      {/* Top rank and suit */}
      <div className={`${color} font-bold leading-none`}>
        <div>{rank}</div>
        <div className="text-lg">{symbol}</div>
      </div>

      {/* Center suit symbol */}
      <div className={`${color} text-2xl`}>
        {symbol}
      </div>

      {/* Bottom rank and suit (upside down) */}
      <div className={`${color} font-bold leading-none transform rotate-180`}>
        <div>{rank}</div>
        <div className="text-lg">{symbol}</div>
      </div>
    </div>
  );
}
