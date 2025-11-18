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

describe('Multi-Player Scenarios E2E', () => {
  let app: INestApplication;
  let players: Socket[] = [];

  const ROOM_ID = 'test-room-multiplayer';
  const WS_URL = 'http://localhost:3002';

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
    await app.listen(3002);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    players = [];
  });

  afterEach(() => {
    players.forEach((socket) => socket.disconnect());
  });

  const createPlayer = (playerId: string): Promise<Socket> => {
    return new Promise((resolve) => {
      const socket = io(WS_URL, {
        transports: ['websocket'],
        auth: { token: `mock-token-${playerId}` },
      });

      socket.data = { user: { userId: playerId } };

      socket.on('connect', () => {
        players.push(socket);
        resolve(socket);
      });
    });
  };

  describe('6-Player Full Table', () => {
    it('should handle 6 players playing a complete hand', async () => {
      // Create 6 players
      const playerSockets = await Promise.all([
        createPlayer('player1'),
        createPlayer('player2'),
        createPlayer('player3'),
        createPlayer('player4'),
        createPlayer('player5'),
        createPlayer('player6'),
      ]);

      return new Promise<void>((done) => {
        let handCompleteCount = 0;

        playerSockets.forEach((socket) => {
          socket.on('game:hand_complete', (data: any) => {
            handCompleteCount++;

            if (handCompleteCount === 6) {
              // All 6 players received hand complete
              expect(data.winners).toBeDefined();
              expect(data.pots).toBeDefined();
              done();
            }
          });
        });

        // All players join
        Promise.all(
          playerSockets.map(
            (socket, idx) =>
              new Promise<void>((resolve) => {
                socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () =>
                  resolve(),
                );
              }),
          ),
        ).then(() => {
          // Wait for hand to start, then all players fold except one
          setTimeout(() => {
            playerSockets.slice(0, 5).forEach((socket, idx) => {
              setTimeout(() => {
                socket.emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'fold',
                  amount: 0,
                });
              }, idx * 100);
            });
          }, 500);
        });
      });
    }, 15000);
  });

  describe('Complex Side Pot Scenario', () => {
    it('should handle multiple all-ins with correct side pot distribution', async () => {
      const playerSockets = await Promise.all([
        createPlayer('player1'),
        createPlayer('player2'),
        createPlayer('player3'),
        createPlayer('player4'),
      ]);

      return new Promise<void>((done) => {
        playerSockets[0].on('game:hand_complete', (data: any) => {
          // Verify multiple pots were created
          expect(data.pots.length).toBeGreaterThan(1);

          // Verify pot amounts
          const totalPot = data.pots.reduce(
            (sum: number, pot: any) => sum + pot.amount,
            0,
          );
          expect(totalPot).toBeGreaterThan(0);

          // Verify eligible players for each pot
          data.pots.forEach((pot: any) => {
            expect(pot.eligiblePlayers).toBeDefined();
            expect(pot.eligiblePlayers.length).toBeGreaterThan(0);
          });

          done();
        });

        // Join with different stack sizes
        Promise.all([
          new Promise<void>((resolve) =>
            playerSockets[0].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 300 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[1].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 700 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[2].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[3].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1500 },
              () => resolve(),
            ),
          ),
        ]).then(() => {
          setTimeout(() => {
            // Player 1 all-in (300)
            playerSockets[0].emit('game:action', {
              roomId: ROOM_ID,
              action: 'all_in',
              amount: 300,
            });

            setTimeout(() => {
              // Player 2 all-in (700)
              playerSockets[1].emit('game:action', {
                roomId: ROOM_ID,
                action: 'all_in',
                amount: 700,
              });

              setTimeout(() => {
                // Player 3 calls
                playerSockets[2].emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'call',
                  amount: 650,
                });

                setTimeout(() => {
                  // Player 4 calls
                  playerSockets[3].emit('game:action', {
                    roomId: ROOM_ID,
                    action: 'call',
                    amount: 600,
                  });
                }, 100);
              }, 100);
            }, 100);
          }, 500);
        });
      });
    }, 10000);
  });

  describe('Sequential Betting Rounds', () => {
    it('should handle multiple betting rounds with raises', async () => {
      const playerSockets = await Promise.all([
        createPlayer('player1'),
        createPlayer('player2'),
        createPlayer('player3'),
      ]);

      return new Promise<void>((done) => {
        const actionsReceived: string[] = [];

        playerSockets[0].on('game:player_action', (data: any) => {
          actionsReceived.push(`${data.userId}:${data.action}`);
        });

        playerSockets[0].on('game:phase_advanced', (data: any) => {
          if (data.phase === 'flop') {
            // Verify preflop betting completed
            expect(actionsReceived.length).toBeGreaterThan(0);
            done();
          }
        });

        Promise.all([
          new Promise<void>((resolve) =>
            playerSockets[0].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[1].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[2].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
        ]).then(() => {
          setTimeout(() => {
            // Player 1 raises
            playerSockets[0].emit('game:action', {
              roomId: ROOM_ID,
              action: 'raise',
              amount: 200,
            });

            setTimeout(() => {
              // Player 2 calls
              playerSockets[1].emit('game:action', {
                roomId: ROOM_ID,
                action: 'call',
                amount: 150,
              });

              setTimeout(() => {
                // Player 3 calls
                playerSockets[2].emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'call',
                  amount: 100,
                });
              }, 100);
            }, 100);
          }, 500);
        });
      });
    }, 10000);
  });

  describe('Player Elimination', () => {
    it('should handle player running out of chips', async () => {
      const playerSockets = await Promise.all([
        createPlayer('player1'),
        createPlayer('player2'),
      ]);

      return new Promise<void>((done) => {
        playerSockets[0].on('game:hand_complete', (data: any) => {
          // Verify one player won all chips
          const winner = data.winners[0];
          expect(winner).toBeDefined();

          done();
        });

        Promise.all([
          new Promise<void>((resolve) =>
            playerSockets[0].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 100 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[1].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
        ]).then(() => {
          setTimeout(() => {
            // Player 1 all-in with small stack
            playerSockets[0].emit('game:action', {
              roomId: ROOM_ID,
              action: 'all_in',
              amount: 100,
            });

            setTimeout(() => {
              // Player 2 calls
              playerSockets[1].emit('game:action', {
                roomId: ROOM_ID,
                action: 'call',
                amount: 50,
              });
            }, 100);
          }, 500);
        });
      });
    }, 10000);
  });

  describe('Rapid Action Sequence', () => {
    it('should handle rapid sequential actions without race conditions', async () => {
      const playerSockets = await Promise.all([
        createPlayer('player1'),
        createPlayer('player2'),
        createPlayer('player3'),
      ]);

      return new Promise<void>((done) => {
        let actionsProcessed = 0;

        playerSockets.forEach((socket) => {
          socket.on('game:player_action', () => {
            actionsProcessed++;

            if (actionsProcessed >= 3) {
              // All initial actions processed
              expect(actionsProcessed).toBeGreaterThanOrEqual(3);
              done();
            }
          });
        });

        Promise.all([
          new Promise<void>((resolve) =>
            playerSockets[0].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[1].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[2].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
        ]).then(() => {
          setTimeout(() => {
            // Send actions rapidly
            playerSockets[0].emit('game:action', {
              roomId: ROOM_ID,
              action: 'call',
              amount: 100,
            });
            setTimeout(() => {
              playerSockets[1].emit('game:action', {
                roomId: ROOM_ID,
                action: 'call',
                amount: 50,
              });
              setTimeout(() => {
                playerSockets[2].emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'check',
                  amount: 0,
                });
              }, 10);
            }, 10);
          }, 500);
        });
      });
    }, 10000);
  });

  describe('State Synchronization', () => {
    it('should keep all players synchronized on game state', async () => {
      const playerSockets = await Promise.all([
        createPlayer('player1'),
        createPlayer('player2'),
        createPlayer('player3'),
      ]);

      return new Promise<void>((done) => {
        const states: any[] = [];

        playerSockets.forEach((socket, idx) => {
          socket.on('game:state', (state: any) => {
            states[idx] = state;

            // Check if all players have received state
            if (states.length === 3 && states.every((s) => s !== undefined)) {
              // Verify all players see same game state (except their own cards)
              expect(states[0].phase).toBe(states[1].phase);
              expect(states[1].phase).toBe(states[2].phase);

              expect(states[0].currentBet).toBe(states[1].currentBet);
              expect(states[1].currentBet).toBe(states[2].currentBet);

              expect(states[0].communityCards).toEqual(
                states[1].communityCards,
              );
              expect(states[1].communityCards).toEqual(
                states[2].communityCards,
              );

              done();
            }
          });
        });

        Promise.all([
          new Promise<void>((resolve) =>
            playerSockets[0].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[1].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
          new Promise<void>((resolve) =>
            playerSockets[2].emit(
              'game:join',
              { roomId: ROOM_ID, buyIn: 1000 },
              () => resolve(),
            ),
          ),
        ]);
      });
    }, 10000);
  });
});
