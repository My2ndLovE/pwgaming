'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type ConnectionState =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

interface ConnectionStatusProps {
  status: ConnectionState;
  latency?: number; // in milliseconds
  reconnectAttempt?: number;
  maxReconnectAttempts?: number;
  compact?: boolean;
  showLatency?: boolean;
}

const statusConfig: Record<
  ConnectionState,
  {
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
    pulse?: boolean;
  }
> = {
  connected: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    label: 'Connected',
    pulse: false,
  },
  connecting: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    label: 'Connecting...',
    pulse: true,
  },
  disconnected: {
    icon: WifiOff,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    label: 'Disconnected',
    pulse: false,
  },
  reconnecting: {
    icon: Wifi,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    label: 'Reconnecting...',
    pulse: true,
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'Connection Error',
    pulse: false,
  },
};

export function ConnectionStatus({
  status,
  latency,
  reconnectAttempt,
  maxReconnectAttempts = 5,
  compact = false,
  showLatency = true,
}: ConnectionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const getLatencyColor = (ms?: number): string => {
    if (!ms) return 'text-gray-500';
    if (ms < 50) return 'text-green-500';
    if (ms < 150) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getLatencyLabel = (ms?: number): string => {
    if (!ms) return 'N/A';
    if (ms < 50) return 'Excellent';
    if (ms < 150) return 'Good';
    if (ms < 300) return 'Fair';
    return 'Poor';
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md border
          ${config.bgColor} ${config.borderColor}
        `}
      >
        <div className="relative">
          <Icon
            className={`w-4 h-4 ${config.color} ${config.pulse ? 'animate-spin' : ''}`}
          />
          {config.pulse && (
            <motion.div
              className={`absolute inset-0 rounded-full ${config.color}`}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
        {showLatency && latency !== undefined && status === 'connected' && (
          <Badge variant="info" className="text-xs">
            {latency}ms
          </Badge>
        )}
      </motion.div>
    );
  }

  return (
    <div className="bg-gray-900/90 rounded-lg border border-gray-700 overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200">Connection Status</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${config.bgColor} border-2 ${config.borderColor}
              `}
            >
              <Icon
                className={`w-6 h-6 ${config.color} ${config.pulse ? 'animate-spin' : ''}`}
              />
            </div>
            {config.pulse && (
              <motion.div
                className={`absolute inset-0 rounded-full border-2 ${config.borderColor}`}
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>

          <div>
            <div className={`text-sm font-semibold ${config.color}`}>{config.label}</div>
            {status === 'reconnecting' && reconnectAttempt !== undefined && (
              <div className="text-xs text-gray-400 mt-0.5">
                Attempt {reconnectAttempt} of {maxReconnectAttempts}
              </div>
            )}
            {status === 'connected' && (
              <div className="text-xs text-gray-400 mt-0.5">
                Real-time updates active
              </div>
            )}
          </div>
        </div>

        {/* Latency Info */}
        {showLatency && latency !== undefined && status === 'connected' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Latency</span>
              <span className={`text-sm font-semibold ${getLatencyColor(latency)}`}>
                {latency}ms
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  latency < 50
                    ? 'bg-green-500'
                    : latency < 150
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((300 - latency) / 3, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{getLatencyLabel(latency)}</span>
              <span className="text-xs text-gray-500">&lt; 300ms ideal</span>
            </div>
          </div>
        )}

        {/* Connection Quality Indicators */}
        {status === 'connected' && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-800 rounded-md p-2 text-center">
              <div className="text-xs text-gray-400">Stability</div>
              <div className="text-sm font-semibold text-green-500">Excellent</div>
            </div>
            <div className="bg-gray-800 rounded-md p-2 text-center">
              <div className="text-xs text-gray-400">Protocol</div>
              <div className="text-sm font-semibold text-blue-400">WebSocket</div>
            </div>
            <div className="bg-gray-800 rounded-md p-2 text-center">
              <div className="text-xs text-gray-400">Compression</div>
              <div className="text-sm font-semibold text-purple-400">Enabled</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ConnectionStatusIndicator({ status }: { status: ConnectionState }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="relative">
      <div
        className={`
          w-2 h-2 rounded-full
          ${status === 'connected' ? 'bg-green-500' : ''}
          ${status === 'connecting' ? 'bg-blue-500' : ''}
          ${status === 'disconnected' ? 'bg-gray-500' : ''}
          ${status === 'reconnecting' ? 'bg-yellow-500' : ''}
          ${status === 'error' ? 'bg-red-500' : ''}
        `}
      />
      {config.pulse && (
        <motion.div
          className={`absolute inset-0 rounded-full ${config.color.replace('text', 'bg')}`}
          animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
