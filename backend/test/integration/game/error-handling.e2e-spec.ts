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

describe('Error Handling E2E', () => {
  let app: INestApplication;
  const ROOM_ID = 'test-room-errors';
  const WS_URL = 'http://localhost:3004';

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
    await app.listen(3004);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Invalid Action Errors', () => {
    it('should reject check when bet exists', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'invalid-p1' } };
      player2Socket.data = { user: { userId: 'invalid-p2' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          setTimeout(() => {
            // Player 1 tries to check when BB exists
            player1Socket.emit('game:action', {
              roomId: ROOM_ID,
              action: 'check',
              amount: 0,
            }, (response: any) => {
              expect(response.success).toBe(false);
              expect(response.error).toContain('bet');

              player1Socket.disconnect();
              player2Socket.disconnect();
              done();
            });
          }, 500);
        });
      });
    }, 10000);

    it('should reject call with incorrect amount', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'call-error-p1' } };
      player2Socket.data = { user: { userId: 'call-error-p2' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          setTimeout(() => {
            // Player 1 tries to call with wrong amount
            player1Socket.emit('game:action', {
              roomId: ROOM_ID,
              action: 'call',
              amount: 50, // Should be 100
            }, (response: any) => {
              expect(response.success).toBe(false);
              expect(response.error).toBeDefined();

              player1Socket.disconnect();
              player2Socket.disconnect();
              done();
            });
          }, 500);
        });
      });
    }, 10000);

    it('should reject bet below big blind', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'bet-error-p1' } };
      player2Socket.data = { user: { userId: 'bet-error-p2' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          setTimeout(() => {
            // First, all players check to flop
            player1Socket.emit('game:action', { roomId: ROOM_ID, action: 'call', amount: 100 });
            setTimeout(() => {
              player2Socket.emit('game:action', { roomId: ROOM_ID, action: 'check', amount: 0 });

              // On flop, try to bet below BB
              setTimeout(() => {
                player1Socket.emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'bet',
                  amount: 50, // Below BB of 100
                }, (response: any) => {
                  expect(response.success).toBe(false);
                  expect(response.error).toContain('big blind');

                  player1Socket.disconnect();
                  player2Socket.disconnect();
                  done();
                });
              }, 200);
            }, 100);
          }, 500);
        });
      });
    }, 10000);
  });

  describe('Insufficient Chips Errors', () => {
    it('should reject bet exceeding chip stack', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'chips-error-p1' } };
      player2Socket.data = { user: { userId: 'chips-error-p2' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 500 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          setTimeout(() => {
            player1Socket.emit('game:action', {
              roomId: ROOM_ID,
              action: 'raise',
              amount: 600, // More than 500 chip stack
            }, (response: any) => {
              expect(response.success).toBe(false);
              expect(response.error).toContain('chip stack');

              player1Socket.disconnect();
              player2Socket.disconnect();
              done();
            });
          }, 500);
        });
      });
    }, 10000);

    it('should suggest all-in when insufficient chips to call', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'allin-suggest-p1' } };
      player2Socket.data = { user: { userId: 'allin-suggest-p2' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 50 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          setTimeout(() => {
            player1Socket.emit('game:action', {
              roomId: ROOM_ID,
              action: 'call',
              amount: 100, // Only has 50 chips
            }, (response: any) => {
              expect(response.success).toBe(false);
              expect(response.suggestedAction).toBe('all_in');

              player1Socket.disconnect();
              player2Socket.disconnect();
              done();
            });
          }, 500);
        });
      });
    }, 10000);
  });

  describe('Turn Enforcement Errors', () => {
    it('should reject action from player not in turn', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'turn-error-p1' } };
      player2Socket.data = { user: { userId: 'turn-error-p2' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          setTimeout(() => {
            // Player 2 tries to act when it's player 1's turn
            player2Socket.emit('game:action', {
              roomId: ROOM_ID,
              action: 'call',
              amount: 50,
            }, (response: any) => {
              expect(response.success).toBe(false);
              expect(response.error).toContain('turn');

              player1Socket.disconnect();
              player2Socket.disconnect();
              done();
            });
          }, 500);
        });
      });
    }, 10000);

    it('should reject action from folded player', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      const player3Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'fold-error-p1' } };
      player2Socket.data = { user: { userId: 'fold-error-p2' } };
      player3Socket.data = { user: { userId: 'fold-error-p3' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          player3Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
            setTimeout(() => {
              // Player 1 folds
              player1Socket.emit('game:action', { roomId: ROOM_ID, action: 'fold', amount: 0 });

              setTimeout(() => {
                // Player 1 tries to act again
                player1Socket.emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'call',
                  amount: 100,
                }, (response: any) => {
                  expect(response.success).toBe(false);
                  expect(response.error).toContain('folded');

                  player1Socket.disconnect();
                  player2Socket.disconnect();
                  player3Socket.disconnect();
                  done();
                });
              }, 200);
            }, 500);
          });
        });
      });
    }, 10000);
  });

  describe('Invalid Game State Errors', () => {
    it('should reject action in non-existent room', (done) => {
      const playerSocket = io(WS_URL, { transports: ['websocket'] });
      playerSocket.data = { user: { userId: 'nonexistent-room-player' } };

      playerSocket.on('connect', () => {
        playerSocket.emit('game:action', {
          roomId: 'non-existent-room-999',
          action: 'call',
          amount: 100,
        }, (response: any) => {
          expect(response.success).toBe(false);
          expect(response.error).toContain('not found');

          playerSocket.disconnect();
          done();
        });
      });
    }, 10000);

    it('should handle missing player data gracefully', (done) => {
      const playerSocket = io(WS_URL, { transports: ['websocket'] });
      // Intentionally not setting user data

      playerSocket.on('connect', () => {
        playerSocket.emit('game:join', {
          roomId: ROOM_ID,
          buyIn: 1000,
        }, (response: any) => {
          expect(response.success).toBe(false);
          expect(response.error).toBeDefined();

          playerSocket.disconnect();
          done();
        });
      });
    }, 10000);
  });

  describe('Timeout Errors', () => {
    it('should auto-fold on action timeout', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'timeout-error-p1' } };
      player2Socket.data = { user: { userId: 'timeout-error-p2' } };

      player2Socket.on('game:player_timeout', (data: any) => {
        expect(data.userId).toBe('timeout-error-p1');

        player1Socket.disconnect();
        player2Socket.disconnect();
        done();
      });

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          // Player 1 doesn't act, should timeout after 30 seconds
          // For testing, we'd need to mock the timeout or wait
        });
      });
    }, 35000); // 35 second timeout for 30s timer
  });

  describe('Edge Case Errors', () => {
    it('should reject negative bet amounts', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'negative-p1' } };
      player2Socket.data = { user: { userId: 'negative-p2' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          setTimeout(() => {
            player1Socket.emit('game:action', {
              roomId: ROOM_ID,
              action: 'bet',
              amount: -100,
            }, (response: any) => {
              expect(response.success).toBe(false);

              player1Socket.disconnect();
              player2Socket.disconnect();
              done();
            });
          }, 500);
        });
      });
    }, 10000);

    it('should handle malformed action data', (done) => {
      const playerSocket = io(WS_URL, { transports: ['websocket'] });
      playerSocket.data = { user: { userId: 'malformed-player' } };

      playerSocket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        setTimeout(() => {
          // Send malformed data
          playerSocket.emit('game:action', {
            roomId: ROOM_ID,
            // Missing action
            amount: 'invalid',
          }, (response: any) => {
            expect(response.success).toBe(false);

            playerSocket.disconnect();
            done();
          });
        }, 500);
      });
    }, 10000);
  });

  describe('Graceful Error Recovery', () => {
    it('should continue game after error from one player', (done) => {
      const player1Socket = io(WS_URL, { transports: ['websocket'] });
      const player2Socket = io(WS_URL, { transports: ['websocket'] });
      player1Socket.data = { user: { userId: 'recovery-p1' } };
      player2Socket.data = { user: { userId: 'recovery-p2' } };

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          setTimeout(() => {
            // Player 1 makes invalid action
            player1Socket.emit('game:action', {
              roomId: ROOM_ID,
              action: 'invalid_action',
              amount: 0,
            }, (response: any) => {
              expect(response.success).toBe(false);

              // Player 1 should still be able to make valid action
              player1Socket.emit('game:action', {
                roomId: ROOM_ID,
                action: 'call',
                amount: 100,
              }, (response2: any) => {
                expect(response2.success).toBe(true);

                player1Socket.disconnect();
                player2Socket.disconnect();
                done();
              });
            });
          }, 500);
        });
      });
    }, 10000);
  });
});
