'use client';

import React from 'react';
import { PlayingCard } from './playing-card';
import { HandPhase } from '../../types/game';

interface CommunityCardsProps {
  cards: string[];
  phase: HandPhase;
}

export function CommunityCards({ cards, phase }: CommunityCardsProps) {
  const expectedCards = {
    [HandPhase.PREFLOP]: 0,
    [HandPhase.FLOP]: 3,
    [HandPhase.TURN]: 4,
    [HandPhase.RIVER]: 5,
    [HandPhase.SHOWDOWN]: 5,
  };

  const expected = expectedCards[phase] || 0;

  // Fill with placeholders if needed
  const displayCards = [...cards];
  while (displayCards.length < expected) {
    displayCards.push('');
  }

  if (displayCards.length === 0) {
    return (
      <div className="text-white text-sm italic">
        Waiting for flop...
      </div>
    );
  }

  return (
    <div className="flex gap-2 justify-center">
      {displayCards.slice(0, expected).map((card, idx) => (
        <PlayingCard
          key={idx}
          card={card}
          faceUp={card !== ''}
          size="md"
        />
      ))}
    </div>
  );
}
