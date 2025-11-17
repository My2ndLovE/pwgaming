'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface ChipStackProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showAmount?: boolean;
  animated?: boolean;
}

interface ChipConfig {
  value: number;
  color: string;
  borderColor: string;
  label: string;
}

const chipConfigs: ChipConfig[] = [
  { value: 10000, color: 'bg-purple-600', borderColor: 'border-purple-800', label: '10K' },
  { value: 5000, color: 'bg-pink-600', borderColor: 'border-pink-800', label: '5K' },
  { value: 1000, color: 'bg-orange-600', borderColor: 'border-orange-800', label: '1K' },
  { value: 500, color: 'bg-red-600', borderColor: 'border-red-800', label: '500' },
  { value: 100, color: 'bg-blue-600', borderColor: 'border-blue-800', label: '100' },
  { value: 50, color: 'bg-green-600', borderColor: 'border-green-800', label: '50' },
  { value: 10, color: 'bg-yellow-500', borderColor: 'border-yellow-700', label: '10' },
  { value: 5, color: 'bg-gray-400', borderColor: 'border-gray-600', label: '5' },
  { value: 1, color: 'bg-white', borderColor: 'border-gray-400', label: '1' },
];

function calculateChipBreakdown(amount: number): { config: ChipConfig; count: number }[] {
  const breakdown: { config: ChipConfig; count: number }[] = [];
  let remaining = amount;

  for (const config of chipConfigs) {
    if (remaining >= config.value) {
      const count = Math.floor(remaining / config.value);
      breakdown.push({ config, count: Math.min(count, 10) }); // Max 10 chips per stack for visual
      remaining -= count * config.value;
    }
  }

  return breakdown;
}

export function ChipStack({
  amount,
  size = 'md',
  showAmount = true,
  animated = true,
}: ChipStackProps) {
  const chipBreakdown = calculateChipBreakdown(amount);

  const sizeConfig = {
    sm: { chipSize: 'w-8 h-3', fontSize: 'text-[8px]', spacing: 2 },
    md: { chipSize: 'w-10 h-4', fontSize: 'text-[10px]', spacing: 3 },
    lg: { chipSize: 'w-12 h-5', fontSize: 'text-xs', spacing: 4 },
  };

  const config = sizeConfig[size];

  if (amount === 0) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="text-gray-500 text-xs">No chips</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1 items-end">
        {chipBreakdown.map((stack, stackIndex) => (
          <div key={stackIndex} className="flex flex-col items-center relative">
            {/* Chip stack */}
            <div className="relative flex flex-col-reverse">
              {Array.from({ length: Math.min(stack.count, 5) }).map((_, chipIndex) => {
                const Component = animated ? motion.div : 'div';
                const animationProps = animated
                  ? {
                      initial: { y: -20, opacity: 0 },
                      animate: { y: 0, opacity: 1 },
                      transition: {
                        delay: stackIndex * 0.05 + chipIndex * 0.03,
                        duration: 0.2,
                      },
                    }
                  : {};

                return (
                  <Component
                    key={chipIndex}
                    className={`
                      ${config.chipSize}
                      ${stack.config.color}
                      border-2 ${stack.config.borderColor}
                      rounded-full
                      flex items-center justify-center
                      shadow-md
                      relative
                    `}
                    style={{
                      marginTop: chipIndex > 0 ? `-${config.spacing}px` : 0,
                      zIndex: chipIndex,
                    }}
                    {...animationProps}
                  >
                    {chipIndex === 0 && (
                      <span className={`${config.fontSize} font-bold text-white drop-shadow`}>
                        {stack.config.label}
                      </span>
                    )}
                  </Component>
                );
              })}
            </div>

            {/* Count indicator for stacks > 5 */}
            {stack.count > 5 && (
              <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center border border-gray-600">
                {stack.count}
              </div>
            )}
          </div>
        ))}
      </div>

      {showAmount && (
        <div className="flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded-md border border-gray-700">
          <Coins className="w-3 h-3 text-yellow-500" />
          <span className="text-xs font-bold text-yellow-400">
            {amount.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

export function ChipStackCompact({ amount }: { amount: number }) {
  return (
    <div className="flex items-center gap-1 bg-gray-900/80 px-2 py-0.5 rounded-md border border-gray-700">
      <Coins className="w-3 h-3 text-yellow-500" />
      <span className="text-xs font-medium text-yellow-400">
        {amount.toLocaleString()}
      </span>
    </div>
  );
}
