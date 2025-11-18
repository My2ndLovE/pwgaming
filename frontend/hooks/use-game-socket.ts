import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ActionType } from '../types/game';

interface GameState {
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  dealerPosition: number;
  currentPosition: number;
  currentBet: number;
  minRaise: number;
  communityCards: string[];
  players: Array<{
    userId: string;
    position: number;
    chipStack: number;
    currentBet: number;
    status: 'active' | 'folded' | 'all_in' | 'sitting_out';
    hasActed: boolean;
    cards: string[];
  }>;
}

interface WinnerInfo {
  userId: string;
  handName: string;
  handCards: string[];
}

interface Pot {
  amount: number;
  eligiblePlayers: string[];
}

interface SocketResponse {
  success: boolean;
  error?: string;
}

interface PlayerActionData {
  userId: string;
  action: string;
  amount: number;
}

interface PhaseAdvancedData {
  phase: string;
  communityCards: string[];
}

interface HandStartedData {
  dealerPosition: number;
}

interface HandCompleteData {
  winners: WinnerInfo[];
  pots: Pot[];
}

interface TimerStartedData {
  userId: string;
  seconds: number;
}

interface PlayerEventData {
  userId: string;
}

type EventCallback<T = unknown> = (data: T) => void;

interface UseGameSocketOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
}

interface UseGameSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  gameState: GameState | null;
  yourCards: string[];

  // Actions
  joinGame: (roomId: string, buyIn: number) => Promise<void>;
  performAction: (roomId: string, action: ActionType, amount: number) => Promise<void>;
  leaveGame: (roomId: string) => Promise<void>;

  // Event listeners
  onPlayerAction: (callback: EventCallback<PlayerActionData>) => () => void;
  onPhaseAdvanced: (callback: EventCallback<PhaseAdvancedData>) => () => void;
  onHandStarted: (callback: EventCallback<HandStartedData>) => () => void;
  onHandComplete: (callback: EventCallback<HandCompleteData>) => () => void;
  onTimerStarted: (callback: EventCallback<TimerStartedData>) => () => void;
  onPlayerTimeout: (callback: EventCallback<PlayerEventData>) => () => void;
  onPlayerReconnected: (callback: EventCallback<PlayerEventData>) => () => void;
}

export function useGameSocket(options: UseGameSocketOptions = {}): UseGameSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
    token,
    autoConnect = true,
  } = options;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [yourCards, setYourCards] = useState<string[]>([]);
  const listenersRef = useRef<Map<string, Set<EventCallback>>>(new Map());

  // Initialize socket
  useEffect(() => {
    if (!autoConnect) return;

    const socketInstance = io(url, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });

    socketInstance.on('game:state', (state: GameState) => {
      setGameState(state);
      emit('game:state', state);
    });

    socketInstance.on('game:your_cards', (data: { cards: string[] }) => {
      setYourCards(data.cards);
    });

    socketInstance.on('game:player_action', (data) => {
      emit('game:player_action', data);
    });

    socketInstance.on('game:phase_advanced', (data) => {
      emit('game:phase_advanced', data);
    });

    socketInstance.on('game:hand_started', (data) => {
      emit('game:hand_started', data);
    });

    socketInstance.on('game:hand_complete', (data) => {
      emit('game:hand_complete', data);
    });

    socketInstance.on('game:timer_started', (data) => {
      emit('game:timer_started', data);
    });

    socketInstance.on('game:player_timeout', (data) => {
      emit('game:player_timeout', data);
    });

    socketInstance.on('game:player_reconnected', (data) => {
      emit('game:player_reconnected', data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [url, token, autoConnect]);

  // Helper to emit events to listeners
  const emit = useCallback(<T = unknown>(event: string, data: T) => {
    const listeners = listenersRef.current.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }, []);

  // Helper to register listeners
  const on = useCallback(<T = unknown>(event: string, callback: EventCallback<T>) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback as EventCallback);

    return () => {
      listenersRef.current.get(event)?.delete(callback as EventCallback);
    };
  }, []);

  // Actions
  const joinGame = useCallback(async (roomId: string, buyIn: number) => {
    if (!socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      socket.emit('game:join', { roomId, buyIn }, (response: SocketResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to join game'));
        }
      });
    });
  }, [socket]);

  const performAction = useCallback(async (roomId: string, action: ActionType, amount: number) => {
    if (!socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      socket.emit('game:action', { roomId, action, amount }, (response: SocketResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Action failed'));
        }
      });
    });
  }, [socket]);

  const leaveGame = useCallback(async (roomId: string) => {
    if (!socket) throw new Error('Socket not connected');

    return new Promise<void>((resolve, reject) => {
      socket.emit('game:leave', { roomId }, (response: SocketResponse) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to leave game'));
        }
      });
    });
  }, [socket]);

  // Event listener registrations
  const onPlayerAction = useCallback((callback: EventCallback<PlayerActionData>) =>
    on<PlayerActionData>('game:player_action', callback), [on]);

  const onPhaseAdvanced = useCallback((callback: EventCallback<PhaseAdvancedData>) =>
    on<PhaseAdvancedData>('game:phase_advanced', callback), [on]);

  const onHandStarted = useCallback((callback: EventCallback<HandStartedData>) =>
    on<HandStartedData>('game:hand_started', callback), [on]);

  const onHandComplete = useCallback((callback: EventCallback<HandCompleteData>) =>
    on<HandCompleteData>('game:hand_complete', callback), [on]);

  const onTimerStarted = useCallback((callback: EventCallback<TimerStartedData>) =>
    on<TimerStartedData>('game:timer_started', callback), [on]);

  const onPlayerTimeout = useCallback((callback: EventCallback<PlayerEventData>) =>
    on<PlayerEventData>('game:player_timeout', callback), [on]);

  const onPlayerReconnected = useCallback((callback: EventCallback<PlayerEventData>) =>
    on<PlayerEventData>('game:player_reconnected', callback), [on]);

  return {
    socket,
    isConnected,
    gameState,
    yourCards,
    joinGame,
    performAction,
    leaveGame,
    onPlayerAction,
    onPhaseAdvanced,
    onHandStarted,
    onHandComplete,
    onTimerStarted,
    onPlayerTimeout,
    onPlayerReconnected,
  };
}
