import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameSocket } from '../../hooks/use-game-socket';
import { ActionType } from '../../types/game';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn((event, data, callback) => {
      if (callback) {
        callback({ success: true });
      }
    }),
    disconnect: jest.fn(),
    join: jest.fn(),
  };

  return {
    io: jest.fn(() => mockSocket),
  };
});

describe('useGameSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize socket connection', () => {
    const { result } = renderHook(() => useGameSocket({ autoConnect: true }));

    expect(result.current.socket).toBeTruthy();
    expect(result.current.isConnected).toBe(false); // Not connected until 'connect' event
  });

  it('should not connect when autoConnect is false', () => {
    const { result } = renderHook(() => useGameSocket({ autoConnect: false }));

    expect(result.current.socket).toBeNull();
  });

  it('should handle joinGame action', async () => {
    const { result } = renderHook(() => useGameSocket({ autoConnect: true }));

    await act(async () => {
      await result.current.joinGame('room-123', 1000);
    });

    expect(result.current.socket?.emit).toHaveBeenCalledWith(
      'game:join',
      { roomId: 'room-123', buyIn: 1000 },
      expect.any(Function)
    );
  });

  it('should handle performAction', async () => {
    const { result } = renderHook(() => useGameSocket({ autoConnect: true }));

    await act(async () => {
      await result.current.performAction('room-123', ActionType.CALL, 100);
    });

    expect(result.current.socket?.emit).toHaveBeenCalledWith(
      'game:action',
      { roomId: 'room-123', action: ActionType.CALL, amount: 100 },
      expect.any(Function)
    );
  });

  it('should handle leaveGame action', async () => {
    const { result } = renderHook(() => useGameSocket({ autoConnect: true }));

    await act(async () => {
      await result.current.leaveGame('room-123');
    });

    expect(result.current.socket?.emit).toHaveBeenCalledWith(
      'game:leave',
      { roomId: 'room-123' },
      expect.any(Function)
    );
  });

  it('should cleanup socket on unmount', () => {
    const { result, unmount } = renderHook(() => useGameSocket({ autoConnect: true }));
    const socket = result.current.socket;

    unmount();

    expect(socket?.disconnect).toHaveBeenCalled();
  });
});
