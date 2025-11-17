'use client';

import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins } from 'lucide-react';

interface BetSliderProps {
  minBet: number;
  maxBet: number;
  currentBet: number;
  potSize: number;
  chipStack: number;
  bigBlind: number;
  onBetChange: (amount: number) => void;
  disabled?: boolean;
}

export function BetSlider({
  minBet,
  maxBet,
  currentBet,
  potSize,
  chipStack,
  bigBlind,
  onBetChange,
  disabled = false,
}: BetSliderProps) {
  const [betAmount, setBetAmount] = useState(minBet);
  const [sliderValue, setSliderValue] = useState([minBet]);

  useEffect(() => {
    setBetAmount(minBet);
    setSliderValue([minBet]);
  }, [minBet]);

  const handleSliderChange = (value: number[]) => {
    const amount = value[0];
    setSliderValue(value);
    setBetAmount(amount);
    onBetChange(amount);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(minBet, Math.min(maxBet, value));
    setBetAmount(clampedValue);
    setSliderValue([clampedValue]);
    onBetChange(clampedValue);
  };

  const setQuickBet = (amount: number) => {
    const clampedValue = Math.max(minBet, Math.min(maxBet, amount));
    setBetAmount(clampedValue);
    setSliderValue([clampedValue]);
    onBetChange(clampedValue);
  };

  const quickButtons = [
    { label: 'Min', value: minBet },
    { label: '2x BB', value: bigBlind * 2 },
    { label: '3x BB', value: bigBlind * 3 },
    { label: '1/2 Pot', value: Math.floor(potSize / 2) },
    { label: 'Pot', value: potSize },
    { label: 'All-In', value: chipStack },
  ];

  return (
    <div className="w-full space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium text-gray-300">Bet Amount</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={betAmount}
            onChange={handleInputChange}
            disabled={disabled}
            min={minBet}
            max={maxBet}
            className="w-24 text-right bg-gray-900 border-gray-600 text-white"
          />
        </div>
      </div>

      <Slider
        value={sliderValue}
        onValueChange={handleSliderChange}
        min={minBet}
        max={maxBet}
        step={bigBlind}
        disabled={disabled}
        className="w-full"
      />

      <div className="flex flex-wrap gap-2">
        {quickButtons.map((btn) => {
          const isDisabled = btn.value < minBet || btn.value > maxBet || disabled;
          return (
            <Button
              key={btn.label}
              onClick={() => setQuickBet(btn.value)}
              disabled={isDisabled}
              variant="outline"
              size="sm"
              className="flex-1 min-w-[80px] bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200 disabled:opacity-30"
            >
              {btn.label}
            </Button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>Min: {minBet.toLocaleString()}</span>
        <span>Max: {maxBet.toLocaleString()}</span>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex justify-between">
          <span>Current Bet:</span>
          <span className="text-gray-300">{currentBet.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Pot Size:</span>
          <span className="text-gray-300">{potSize.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Your Stack:</span>
          <span className="text-yellow-400 font-medium">{chipStack.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
