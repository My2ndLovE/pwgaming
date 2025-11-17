'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Check,
  XCircle,
  ArrowUp,
  ArrowUpRight,
  Users,
  Trophy,
  AlertCircle,
} from 'lucide-react';

export type GameAction =
  | 'fold'
  | 'check'
  | 'call'
  | 'bet'
  | 'raise'
  | 'all-in'
  | 'join'
  | 'leave'
  | 'win'
  | 'small-blind'
  | 'big-blind'
  | 'new-hand';

export interface ActionHistoryItem {
  id: string;
  timestamp: number;
  playerName: string;
  action: GameAction;
  amount?: number;
  metadata?: Record<string, any>;
}

interface ActionHistoryProps {
  actions: ActionHistoryItem[];
  maxItems?: number;
  compact?: boolean;
  autoScroll?: boolean;
}

const actionConfig: Record<
  GameAction,
  { icon: React.ComponentType<any>; color: string; label: string }
> = {
  fold: { icon: XCircle, color: 'text-red-400', label: 'Fold' },
  check: { icon: Check, color: 'text-green-400', label: 'Check' },
  call: { icon: Check, color: 'text-blue-400', label: 'Call' },
  bet: { icon: ArrowUp, color: 'text-yellow-400', label: 'Bet' },
  raise: { icon: ArrowUpRight, color: 'text-orange-400', label: 'Raise' },
  'all-in': { icon: AlertCircle, color: 'text-red-500', label: 'All-In' },
  join: { icon: Users, color: 'text-purple-400', label: 'Joined' },
  leave: { icon: Users, color: 'text-gray-400', label: 'Left' },
  win: { icon: Trophy, color: 'text-yellow-500', label: 'Won' },
  'small-blind': { icon: ArrowUp, color: 'text-gray-400', label: 'SB' },
  'big-blind': { icon: ArrowUp, color: 'text-gray-400', label: 'BB' },
  'new-hand': { icon: Users, color: 'text-blue-400', label: 'New Hand' },
};

export function ActionHistory({
  actions,
  maxItems = 20,
  compact = false,
  autoScroll = true,
}: ActionHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const recentActions = actions.slice(-maxItems);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions, autoScroll]);

  const formatAction = (item: ActionHistoryItem): string => {
    const config = actionConfig[item.action];

    switch (item.action) {
      case 'fold':
        return `${item.playerName} folded`;
      case 'check':
        return `${item.playerName} checked`;
      case 'call':
        return `${item.playerName} called ${item.amount?.toLocaleString() || ''}`;
      case 'bet':
        return `${item.playerName} bet ${item.amount?.toLocaleString() || ''}`;
      case 'raise':
        return `${item.playerName} raised to ${item.amount?.toLocaleString() || ''}`;
      case 'all-in':
        return `${item.playerName} went all-in for ${item.amount?.toLocaleString() || ''}`;
      case 'join':
        return `${item.playerName} joined the table`;
      case 'leave':
        return `${item.playerName} left the table`;
      case 'win':
        return `${item.playerName} won ${item.amount?.toLocaleString() || ''}`;
      case 'small-blind':
        return `${item.playerName} posted small blind ${item.amount?.toLocaleString() || ''}`;
      case 'big-blind':
        return `${item.playerName} posted big blind ${item.amount?.toLocaleString() || ''}`;
      case 'new-hand':
        return `New hand started`;
      default:
        return `${item.playerName} ${config.label}`;
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (compact) {
    return (
      <div className="bg-gray-900/50 rounded-lg border border-gray-700 p-2">
        <div className="text-xs font-semibold text-gray-400 mb-2">Recent Actions</div>
        <ScrollArea className="h-32" ref={scrollRef}>
          <AnimatePresence mode="popLayout">
            {recentActions.map((item) => {
              const config = actionConfig[item.action];
              const Icon = config.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2 py-1 text-xs"
                >
                  <Icon className={`w-3 h-3 ${config.color} flex-shrink-0`} />
                  <span className="text-gray-300 truncate">{formatAction(item)}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200">Action History</h3>
      </div>

      <ScrollArea className="h-64 p-2" ref={scrollRef}>
        <AnimatePresence mode="popLayout">
          {recentActions.map((item) => {
            const config = actionConfig[item.action];
            const Icon = config.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 py-2 px-3 hover:bg-gray-800/50 rounded-md mb-1"
              >
                <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">{formatAction(item)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTime(item.timestamp)}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}

export function ActionHistoryCompact({ actions }: { actions: ActionHistoryItem[] }) {
  const lastAction = actions[actions.length - 1];

  if (!lastAction) {
    return null;
  }

  const config = actionConfig[lastAction.action];
  const Icon = config.icon;

  const formatAction = (): string => {
    switch (lastAction.action) {
      case 'call':
      case 'bet':
      case 'raise':
      case 'all-in':
        return `${lastAction.playerName} ${config.label.toLowerCase()} ${lastAction.amount?.toLocaleString() || ''}`;
      default:
        return `${lastAction.playerName} ${config.label.toLowerCase()}`;
    }
  };

  return (
    <motion.div
      key={lastAction.id}
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 bg-gray-900/90 px-3 py-1.5 rounded-md border border-gray-700"
    >
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className="text-xs text-gray-200">{formatAction()}</span>
    </motion.div>
  );
}
