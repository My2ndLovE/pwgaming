import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGameSocket } from './use-game-socket';
import { ActionType, Player, WinnerInfo, Pot } from '../types/game';
import { SoundManager } from '../lib/sound-manager';

interface UseGameStateOptions {
  roomId: string;
  userId: string;
  token?: string;
}

interface ActionTimer {
  userId: string;
  remainingSeconds: number;
}

export interface UseGameStateReturn {
  // Connection
  isConnected: boolean;

  // Game state
  gameState: ReturnType<typeof useGameSocket>['gameState'];
  yourCards: string[];

  // Computed state
  isYourTurn: boolean;
  canCheck: boolean;
  canCall: boolean;
  canBet: boolean;
  canRaise: boolean;
  callAmount: number;
  minBetAmount: number;
  minRaiseAmount: number;
  yourPlayer: Player | null;

  // Timer
  actionTimer: ActionTimer | null;

  // Recent events
  recentActions: Array<{ userId: string; action: string; amount: number; timestamp: Date }>;
  lastWinners: WinnerInfo[] | null;
  lastPots: Pot[] | null;

  // Actions
  joinGame: (buyIn: number) => Promise<void>;
  fold: () => Promise<void>;
  check: () => Promise<void>;
  call: () => Promise<void>;
  bet: (amount: number) => Promise<void>;
  raise: (amount: number) => Promise<void>;
  allIn: () => Promise<void>;
  leaveGame: () => Promise<void>;
}

export function useGameState(options: UseGameStateOptions): UseGameStateReturn {
  const { roomId, userId, token } = options;

  const socket = useGameSocket({ token });

  const [actionTimer, setActionTimer] = useState<ActionTimer | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recentActions, setRecentActions] = useState<Array<{ userId: string; action: string; amount: number; timestamp: Date }>>([]);
  const [lastWinners, setLastWinners] = useState<WinnerInfo[] | null>(null);
  const [lastPots, setLastPots] = useState<Pot[] | null>(null);

  // Subscribe to events
  useEffect(() => {
    const unsubActions = socket.onPlayerAction((data) => {
      setRecentActions(prev => [...prev.slice(-9), { ...data, timestamp: new Date() }]);

      // Play sound for actions
      const actionMap: Record<string, string> = {
        [ActionType.BET]: 'bet',
        [ActionType.CALL]: 'call',
        [ActionType.RAISE]: 'raise',
        [ActionType.FOLD]: 'fold',
        [ActionType.CHECK]: 'check',
        [ActionType.ALL_IN]: 'raise', // Use raise sound for all-in
      };

      const soundType = actionMap[data.action];
      if (soundType) {
        SoundManager.play(soundType as any);
      }
    });

    const unsubTimer = socket.onTimerStarted((data) => {
      setActionTimer({ userId: data.userId, remainingSeconds: data.seconds });

      // Clear existing interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Start countdown
      const interval = setInterval(() => {
        setActionTimer(prev => {
          if (!prev || prev.remainingSeconds <= 1) {
            clearInterval(interval);
            return null;
          }

          // Play warning sound when 5 seconds or less
          if (prev.remainingSeconds === 5 && prev.userId === userId) {
            SoundManager.play('timer-warning');
          }

          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);

      timerIntervalRef.current = interval;
    });

    const unsubTimeout = socket.onPlayerTimeout(() => {
      setActionTimer(null);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    });

    const unsubHandComplete = socket.onHandComplete((data) => {
      setLastWinners(data.winners);
      setLastPots(data.pots);

      // Play win/lose sound
      const youWon = data.winners.some(w => w.userId === userId);
      if (youWon) {
        SoundManager.play('win');
      } else {
        const youInHand = socket.gameState?.players.some(p => p.userId === userId && !p.folded);
        if (youInHand) {
          SoundManager.play('lose');
        }
      }
    });

    const unsubHandStarted = socket.onHandStarted(() => {
      setLastWinners(null);
      setLastPots(null);
      setRecentActions([]);

      // Play card deal sound
      SoundManager.play('card-deal');
    });

    return () => {
      unsubActions();
      unsubTimer();
      unsubTimeout();
      unsubHandComplete();
      unsubHandStarted();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [socket, userId]);

  // Computed state
  const yourPlayer = useMemo(() => {
    if (!socket.gameState) return null;
    return socket.gameState.players.find(p => p.userId === userId) || null;
  }, [socket.gameState, userId]);

  const isYourTurn = useMemo(() => {
    if (!socket.gameState || !yourPlayer) return false;
    return socket.gameState.currentPosition === yourPlayer.position;
  }, [socket.gameState, yourPlayer]);

  const callAmount = useMemo(() => {
    if (!socket.gameState || !yourPlayer) return 0;
    return socket.gameState.currentBet - yourPlayer.currentBet;
  }, [socket.gameState, yourPlayer]);

  const canCheck = useMemo(() => {
    if (!isYourTurn || !socket.gameState) return false;
    return callAmount === 0;
  }, [isYourTurn, callAmount, socket.gameState]);

  const canCall = useMemo(() => {
    if (!isYourTurn || !socket.gameState || !yourPlayer) return false;
    return callAmount > 0 && yourPlayer.chipStack >= callAmount;
  }, [isYourTurn, callAmount, socket.gameState, yourPlayer]);

  const minBetAmount = useMemo(() => {
    if (!socket.gameState) return 0;
    return socket.gameState.currentBet === 0 ? socket.gameState.minRaise : 0;
  }, [socket.gameState]);

  const canBet = useMemo(() => {
    if (!isYourTurn || !socket.gameState || !yourPlayer) return false;
    return socket.gameState.currentBet === 0 && yourPlayer.chipStack >= minBetAmount;
  }, [isYourTurn, socket.gameState, yourPlayer, minBetAmount]);

  const minRaiseAmount = useMemo(() => {
    if (!socket.gameState) return 0;
    return socket.gameState.currentBet + socket.gameState.minRaise;
  }, [socket.gameState]);

  const canRaise = useMemo(() => {
    if (!isYourTurn || !socket.gameState || !yourPlayer) return false;
    return socket.gameState.currentBet > 0 && yourPlayer.chipStack >= minRaiseAmount;
  }, [isYourTurn, socket.gameState, yourPlayer, minRaiseAmount]);

  // Actions
  const joinGame = useCallback(async (buyIn: number) => {
    await socket.joinGame(roomId, buyIn);
  }, [socket, roomId]);

  const fold = useCallback(async () => {
    if (!isYourTurn) throw new Error('Not your turn');
    await socket.performAction(roomId, ActionType.FOLD, 0);
  }, [socket, roomId, isYourTurn]);

  const check = useCallback(async () => {
    if (!canCheck) throw new Error('Cannot check');
    await socket.performAction(roomId, ActionType.CHECK, 0);
  }, [socket, roomId, canCheck]);

  const call = useCallback(async () => {
    if (!canCall) throw new Error('Cannot call');
    await socket.performAction(roomId, ActionType.CALL, callAmount);
  }, [socket, roomId, canCall, callAmount]);

  const bet = useCallback(async (amount: number) => {
    if (!canBet) throw new Error('Cannot bet');
    if (amount < minBetAmount) throw new Error(`Minimum bet is ${minBetAmount}`);
    await socket.performAction(roomId, ActionType.BET, amount);
  }, [socket, roomId, canBet, minBetAmount]);

  const raise = useCallback(async (amount: number) => {
    if (!canRaise) throw new Error('Cannot raise');
    if (amount < minRaiseAmount) throw new Error(`Minimum raise is ${minRaiseAmount}`);
    await socket.performAction(roomId, ActionType.RAISE, amount);
  }, [socket, roomId, canRaise, minRaiseAmount]);

  const allIn = useCallback(async () => {
    if (!isYourTurn || !yourPlayer) throw new Error('Not your turn');
    await socket.performAction(roomId, ActionType.ALL_IN, yourPlayer.chipStack);
  }, [socket, roomId, isYourTurn, yourPlayer]);

  const leaveGame = useCallback(async () => {
    await socket.leaveGame(roomId);
  }, [socket, roomId]);

  return {
    isConnected: socket.isConnected,
    gameState: socket.gameState,
    yourCards: socket.yourCards,
    isYourTurn,
    canCheck,
    canCall,
    canBet,
    canRaise,
    callAmount,
    minBetAmount,
    minRaiseAmount,
    yourPlayer,
    actionTimer,
    recentActions,
    lastWinners,
    lastPots,
    joinGame,
    fold,
    check,
    call,
    bet,
    raise,
    allIn,
    leaveGame,
  };
}
