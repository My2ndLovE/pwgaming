import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { GameEngine } from '../../../src/modules/game/services/game-engine.service';
import { DeckService } from '../../../src/modules/game/services/deck.service';
import { HandEvaluatorService } from '../../../src/modules/game/services/hand-evaluator.service';
import { PotService } from '../../../src/modules/game/services/pot.service';
import { BettingService } from '../../../src/modules/game/services/betting.service';
import { GameStateMachine } from '../../../src/modules/game/services/game-state-machine.service';
import { TimeoutService } from '../../../src/modules/game/services/timeout.service';
import { GameGateway } from '../../../src/modules/game/gateways/game.gateway';

describe('Reconnection Scenarios E2E', () => {
  let app: INestApplication;
  const ROOM_ID = 'test-room-reconnection';
  const WS_URL = 'http://localhost:3003';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        GameEngine,
        DeckService,
        HandEvaluatorService,
        PotService,
        BettingService,
        GameStateMachine,
        TimeoutService,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3003);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Immediate Reconnection', () => {
    it('should handle player reconnecting with same userId', (done) => {
      const userId = 'reconnect-test-player';

      // First connection
      const socket1 = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'mock-token-1' },
      });
      socket1.data = { user: { userId } };

      socket1.on('connect', () => {
        socket1.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, (response: any) => {
          expect(response.success).toBe(true);

          // Disconnect
          socket1.disconnect();

          // Reconnect with same userId
          setTimeout(() => {
            const socket2 = io(WS_URL, {
              transports: ['websocket'],
              auth: { token: 'mock-token-2' },
            });
            socket2.data = { user: { userId } };

            socket2.on('game:player_reconnected', (data: any) => {
              expect(data.userId).toBe(userId);
              socket2.disconnect();
              done();
            });

            socket2.on('game:state', (state: any) => {
              // Should receive current game state
              expect(state).toBeDefined();
            });
          }, 100);
        });
      });
    }, 10000);
  });

  describe('Reconnection During Hand', () => {
    it('should restore player state when reconnecting mid-hand', (done) => {
      const player1Id = 'player1';
      const player2Id = 'player2';

      let player1Socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'token-p1' },
      });
      player1Socket.data = { user: { userId: player1Id } };

      const player2Socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'token-p2' },
      });
      player2Socket.data = { user: { userId: player2Id } };

      let originalCards: string[] = [];

      player1Socket.on('connect', () => {
        player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
            // Wait for hand to start
            setTimeout(() => {
              player1Socket.on('game:your_cards', (data: any) => {
                originalCards = data.cards;

                // Disconnect player 1
                player1Socket.disconnect();

                // Reconnect after 1 second
                setTimeout(() => {
                  player1Socket = io(WS_URL, {
                    transports: ['websocket'],
                    auth: { token: 'token-p1-reconnect' },
                  });
                  player1Socket.data = { user: { userId: player1Id } };

                  player1Socket.on('game:your_cards', (reconnectData: any) => {
                    // Should receive same cards
                    expect(reconnectData.cards).toEqual(originalCards);

                    player1Socket.disconnect();
                    player2Socket.disconnect();
                    done();
                  });
                }, 1000);
              });
            }, 500);
          });
        });
      });
    }, 15000);
  });

  describe('Timeout After Disconnect', () => {
    it('should auto-fold player after 60-second grace period', (done) => {
      const player1Id = 'timeout-player1';
      const player2Id = 'timeout-player2';

      const player1Socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'token-timeout-p1' },
      });
      player1Socket.data = { user: { userId: player1Id } };

      const player2Socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'token-timeout-p2' },
      });
      player2Socket.data = { user: { userId: player2Id } };

      player2Socket.on('game:player_timeout', (data: any) => {
        expect(data.userId).toBe(player1Id);

        player1Socket.disconnect();
        player2Socket.disconnect();
        done();
      });

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          // Wait for hand to start
          setTimeout(() => {
            // Player 1 disconnects without acting
            player1Socket.disconnect();

            // Note: In real test, would need to wait 60 seconds or mock timer
            // For this test, we'll verify the timeout event is emitted
          }, 500);
        });
      });
    }, 70000); // 70 second timeout
  });

  describe('Multiple Disconnections', () => {
    it('should handle multiple players disconnecting and reconnecting', (done) => {
      const players = [
        { id: 'multi-p1', socket: null as Socket | null },
        { id: 'multi-p2', socket: null as Socket | null },
        { id: 'multi-p3', socket: null as Socket | null },
      ];

      const createSocket = (userId: string) => {
        const socket = io(WS_URL, {
          transports: ['websocket'],
          auth: { token: `token-${userId}` },
        });
        socket.data = { user: { userId } };
        return socket;
      };

      // Create all sockets
      players.forEach(player => {
        player.socket = createSocket(player.id);
      });

      let reconnectCount = 0;

      players.forEach(player => {
        player.socket!.on('game:player_reconnected', (data: any) => {
          reconnectCount++;

          if (reconnectCount === 2) {
            // All players reconnected
            players.forEach(p => p.socket?.disconnect());
            done();
          }
        });
      });

      // Join all players
      Promise.all(
        players.map(player =>
          new Promise<void>(resolve => {
            player.socket!.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => resolve());
          })
        )
      ).then(() => {
        setTimeout(() => {
          // Disconnect player 1 and 2
          players[0].socket!.disconnect();
          players[1].socket!.disconnect();

          // Reconnect after delay
          setTimeout(() => {
            players[0].socket = createSocket(players[0].id);
            players[1].socket = createSocket(players[1].id);
          }, 1000);
        }, 500);
      });
    }, 15000);
  });

  describe('Reconnection with Pending Action', () => {
    it('should allow player to continue turn after reconnection', (done) => {
      const player1Id = 'pending-action-p1';
      const player2Id = 'pending-action-p2';

      let player1Socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'token-pending-p1' },
      });
      player1Socket.data = { user: { userId: player1Id } };

      const player2Socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'token-pending-p2' },
      });
      player2Socket.data = { user: { userId: player2Id } };

      let itWasPlayer1Turn = false;

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          player1Socket.on('game:state', (state: any) => {
            // Check if it's player 1's turn
            if (state.currentPosition === 0) { // Assuming player1 is at position 0
              itWasPlayer1Turn = true;

              // Disconnect
              player1Socket.disconnect();

              // Reconnect immediately
              setTimeout(() => {
                player1Socket = io(WS_URL, {
                  transports: ['websocket'],
                  auth: { token: 'token-pending-p1-reconnect' },
                });
                player1Socket.data = { user: { userId: player1Id } };

                player1Socket.on('connect', () => {
                  // Try to act after reconnection
                  player1Socket.emit('game:action', {
                    roomId: ROOM_ID,
                    action: 'call',
                    amount: 50,
                  }, (response: any) => {
                    // Should be allowed to act
                    expect(response.success).toBe(true);

                    player1Socket.disconnect();
                    player2Socket.disconnect();
                    done();
                  });
                });
              }, 500);
            }
          });
        });
      });
    }, 15000);
  });

  describe('Connection Stability', () => {
    it('should handle intermittent connection drops', (done) => {
      const player1Id = 'stable-p1';
      const player2Id = 'stable-p2';

      let player1Socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'token-stable-p1' },
        reconnection: true,
        reconnectionDelay: 100,
        reconnectionAttempts: 5,
      });
      player1Socket.data = { user: { userId: player1Id } };

      const player2Socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: 'token-stable-p2' },
      });
      player2Socket.data = { user: { userId: player2Id } };

      let disconnectCount = 0;
      let reconnectSuccessful = false;

      player1Socket.on('disconnect', () => {
        disconnectCount++;
      });

      player1Socket.on('reconnect', () => {
        reconnectSuccessful = true;

        if (disconnectCount > 0 && reconnectSuccessful) {
          player1Socket.disconnect();
          player2Socket.disconnect();
          done();
        }
      });

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          // Simulate connection drop
          setTimeout(() => {
            player1Socket.disconnect();

            // Socket.IO will auto-reconnect
          }, 1000);
        });
      });
    }, 15000);
  });
});
