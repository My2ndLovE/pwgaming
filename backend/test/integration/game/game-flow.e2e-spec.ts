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

describe('Game Flow E2E', () => {
  let app: INestApplication;
  let gateway: GameGateway;
  let player1Socket: Socket;
  let player2Socket: Socket;
  let player3Socket: Socket;

  const ROOM_ID = 'test-room-123';
  const WS_URL = 'http://localhost:3001';

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
    gateway = moduleFixture.get<GameGateway>(GameGateway);

    await app.listen(3001);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach((done) => {
    // Create mock authenticated sockets
    player1Socket = io(WS_URL, {
      transports: ['websocket'],
      auth: { token: 'mock-token-player1' },
    });

    player2Socket = io(WS_URL, {
      transports: ['websocket'],
      auth: { token: 'mock-token-player2' },
    });

    player3Socket = io(WS_URL, {
      transports: ['websocket'],
      auth: { token: 'mock-token-player3' },
    });

    // Mock user data on sockets
    player1Socket.data = { user: { userId: 'player1' } };
    player2Socket.data = { user: { userId: 'player2' } };
    player3Socket.data = { user: { userId: 'player3' } };

    let connectedCount = 0;
    const checkAllConnected = () => {
      connectedCount++;
      if (connectedCount === 3) done();
    };

    player1Socket.on('connect', checkAllConnected);
    player2Socket.on('connect', checkAllConnected);
    player3Socket.on('connect', checkAllConnected);
  });

  afterEach(() => {
    player1Socket.disconnect();
    player2Socket.disconnect();
    player3Socket.disconnect();
  });

  describe('Complete 3-Player Hand', () => {
    it('should play a complete hand from start to finish', (done) => {
      const events: string[] = [];

      // Track all major events
      const trackEvent = (eventName: string) => {
        events.push(eventName);
      };

      player1Socket.on('game:hand_started', () => trackEvent('hand_started'));
      player1Socket.on('game:your_cards', () => trackEvent('your_cards'));
      player1Socket.on('game:state', () => trackEvent('state_update'));
      player1Socket.on('game:player_action', () => trackEvent('player_action'));
      player1Socket.on('game:phase_advanced', () => trackEvent('phase_advanced'));
      player1Socket.on('game:hand_complete', (data) => {
        trackEvent('hand_complete');

        // Validate hand completion
        expect(data.winners).toBeDefined();
        expect(data.winners.length).toBeGreaterThan(0);
        expect(data.pots).toBeDefined();

        // Verify all expected events occurred
        expect(events).toContain('hand_started');
        expect(events).toContain('your_cards');
        expect(events).toContain('state_update');
        expect(events).toContain('player_action');
        expect(events).toContain('hand_complete');

        done();
      });

      // Player 1 joins
      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, (response: any) => {
        expect(response.success).toBe(true);

        // Player 2 joins
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, (response2: any) => {
          expect(response2.success).toBe(true);

          // Player 3 joins (hand should start)
          player3Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, (response3: any) => {
            expect(response3.success).toBe(true);

            // Wait for hand to start, then simulate actions
            setTimeout(() => {
              // Player 1 (UTG) calls
              player1Socket.emit('game:action', {
                roomId: ROOM_ID,
                action: 'call',
                amount: 100,
              });

              setTimeout(() => {
                // Player 2 (dealer/SB) calls
                player2Socket.emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'call',
                  amount: 50,
                });

                setTimeout(() => {
                  // Player 3 (BB) checks
                  player3Socket.emit('game:action', {
                    roomId: ROOM_ID,
                    action: 'check',
                    amount: 0,
                  });
                }, 100);
              }, 100);
            }, 500);
          });
        });
      });
    }, 10000);
  });

  describe('Heads-Up Hand', () => {
    it('should handle heads-up blind posting correctly', (done) => {
      let handStarted = false;
      let stateReceived = false;

      player1Socket.on('game:state', (state: any) => {
        if (handStarted && !stateReceived) {
          stateReceived = true;

          // Verify heads-up blind positions
          expect(state.players).toHaveLength(2);

          // In heads-up: dealer posts SB, other player posts BB
          const dealer = state.players.find((p: any) => p.position === state.dealerPosition);
          const nonDealer = state.players.find((p: any) => p.position !== state.dealerPosition);

          expect(dealer.currentBet).toBe(50); // Small blind
          expect(nonDealer.currentBet).toBe(100); // Big blind

          done();
        }
      });

      player1Socket.on('game:hand_started', () => {
        handStarted = true;
      });

      // Join 2 players
      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, (response: any) => {
        expect(response.success).toBe(true);

        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, (response2: any) => {
          expect(response2.success).toBe(true);
        });
      });
    }, 5000);
  });

  describe('All Fold Scenario', () => {
    it('should end hand when all players fold except one', (done) => {
      player1Socket.on('game:hand_complete', (data: any) => {
        // Verify only one winner (the player who didn't fold)
        expect(data.winners).toHaveLength(1);
        expect(data.winners[0].userId).toBe('player3'); // BB didn't act

        done();
      });

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          player3Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
            // Wait for hand to start
            setTimeout(() => {
              // Player 1 folds
              player1Socket.emit('game:action', {
                roomId: ROOM_ID,
                action: 'fold',
                amount: 0,
              });

              setTimeout(() => {
                // Player 2 folds
                player2Socket.emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'fold',
                  amount: 0,
                });
              }, 100);
            }, 500);
          });
        });
      });
    }, 5000);
  });

  describe('Phase Transitions', () => {
    it('should advance through all phases (preflop -> flop -> turn -> river -> showdown)', (done) => {
      const phasesEncountered: string[] = [];

      player1Socket.on('game:phase_advanced', (data: any) => {
        phasesEncountered.push(data.phase);

        // Check if we've reached showdown
        if (data.phase === 'showdown') {
          expect(phasesEncountered).toContain('flop');
          expect(phasesEncountered).toContain('turn');
          expect(phasesEncountered).toContain('river');
          done();
        }
      });

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          player3Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
            // Simulate all players checking through all rounds
            setTimeout(() => {
              const checkAllPlayers = () => {
                player1Socket.emit('game:action', { roomId: ROOM_ID, action: 'check', amount: 0 });
                setTimeout(() => {
                  player2Socket.emit('game:action', { roomId: ROOM_ID, action: 'check', amount: 0 });
                  setTimeout(() => {
                    player3Socket.emit('game:action', { roomId: ROOM_ID, action: 'check', amount: 0 });
                  }, 100);
                }, 100);
              };

              // Check preflop
              player1Socket.emit('game:action', { roomId: ROOM_ID, action: 'call', amount: 100 });
              setTimeout(() => {
                player2Socket.emit('game:action', { roomId: ROOM_ID, action: 'call', amount: 50 });
                setTimeout(() => {
                  player3Socket.emit('game:action', { roomId: ROOM_ID, action: 'check', amount: 0 });

                  // Check flop, turn, river
                  setTimeout(checkAllPlayers, 200);
                  setTimeout(checkAllPlayers, 500);
                  setTimeout(checkAllPlayers, 800);
                }, 100);
              }, 100);
            }, 500);
          });
        });
      });
    }, 10000);
  });

  describe('All-In Scenario', () => {
    it('should handle all-in and create side pots correctly', (done) => {
      player1Socket.on('game:hand_complete', (data: any) => {
        // Verify pots were created correctly
        expect(data.pots).toBeDefined();
        expect(data.pots.length).toBeGreaterThan(0);

        // Main pot should exist
        expect(data.pots[0].amount).toBeGreaterThan(0);

        done();
      });

      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 500 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          player3Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1500 }, () => {
            setTimeout(() => {
              // Player 1 goes all-in (500)
              player1Socket.emit('game:action', {
                roomId: ROOM_ID,
                action: 'all_in',
                amount: 500,
              });

              setTimeout(() => {
                // Player 2 calls
                player2Socket.emit('game:action', {
                  roomId: ROOM_ID,
                  action: 'call',
                  amount: 500,
                });

                setTimeout(() => {
                  // Player 3 calls
                  player3Socket.emit('game:action', {
                    roomId: ROOM_ID,
                    action: 'call',
                    amount: 450,
                  });
                }, 100);
              }, 100);
            }, 500);
          });
        });
      });
    }, 10000);
  });

  describe('Turn Management', () => {
    it('should enforce turn order and reject out-of-turn actions', (done) => {
      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          player3Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
            setTimeout(() => {
              // Player 2 tries to act out of turn (player 1's turn)
              player2Socket.emit('game:action', {
                roomId: ROOM_ID,
                action: 'call',
                amount: 100,
              }, (response: any) => {
                // Should be rejected
                expect(response.success).toBe(false);
                expect(response.error).toContain('turn');

                done();
              });
            }, 500);
          });
        });
      });
    }, 5000);
  });

  describe('Minimum Raise Enforcement', () => {
    it('should reject raises below minimum amount', (done) => {
      player1Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
        player2Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
          player3Socket.emit('game:join', { roomId: ROOM_ID, buyIn: 1000 }, () => {
            setTimeout(() => {
              // Player 1 tries to raise to 150 (below minimum raise of 200)
              player1Socket.emit('game:action', {
                roomId: ROOM_ID,
                action: 'raise',
                amount: 150,
              }, (response: any) => {
                expect(response.success).toBe(false);
                expect(response.error).toContain('minimum');

                done();
              });
            }, 500);
          });
        });
      });
    }, 5000);
  });
});
