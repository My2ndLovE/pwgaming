# Texas Hold'em Cash Game - Technical Implementation Reference

## Document Purpose
This document serves as a comprehensive technical reference for implementing a virtual Texas Hold'em cash game room. It will be used as a module specification for the spec-kit PRD generation process.

---

## Table of Contents
1. [Game Rules & Flow](#game-rules--flow)
2. [Hand Ranking System](#hand-ranking-system)
3. [Betting Structure](#betting-structure)
4. [Side Pot Calculation](#side-pot-calculation)
5. [Technical Architecture](#technical-architecture)
6. [Game State Management](#game-state-management)
7. [Real-Time Communication](#real-time-communication)
8. [Performance Optimization](#performance-optimization)
9. [Security & Anti-Cheating](#security--anti-cheating)
10. [Database Schema](#database-schema)
11. [Implementation Checklist](#implementation-checklist)

---

## 1. Game Rules & Flow

### 1.1 Basic Game Setup
- **Player Count**: 2-9 players per table (MVP: 2-6 recommended for performance)
- **Deck**: Standard 52-card deck (no jokers)
- **Positions**: Dealer button rotates clockwise after each hand
- **Forced Bets**: Small blind and big blind

### 1.2 Game Phases

#### Phase 1: Pre-Flop
1. Two players post blinds (small blind left of dealer, big blind next)
2. Each player dealt 2 hole cards (face down, private)
3. Betting round starts from player left of big blind (Under The Gun)
4. Players can: Fold, Call, Raise
5. Betting continues until all active players have matched the highest bet

#### Phase 2: Flop
1. Dealer "burns" top card (discards face down)
2. Three community cards dealt face up
3. Betting round starts from first active player left of dealer
4. Players can: Check, Bet, Call, Raise, Fold

#### Phase 3: Turn
1. Dealer burns one card
2. Fourth community card dealt face up
3. Betting round (same as flop)

#### Phase 4: River
1. Dealer burns one card
2. Fifth and final community card dealt face up
3. Final betting round

#### Phase 5: Showdown
1. If multiple players remain, they reveal hole cards
2. Best 5-card poker hand (from 7 available cards) wins
3. Pot distributed to winner(s)
4. If tie, pot split equally

### 1.3 Cash Game Specific Rules
- **Buy-in**: Minimum 20 big blinds, Maximum 100 big blinds (configurable)
- **Blinds**: Fixed throughout the session (e.g., $1/$2 remains $1/$2)
- **Leaving**: Players can leave anytime and cash out remaining chips
- **Joining**: Players can join anytime with valid buy-in
- **Rebuy**: Players can add chips between hands (up to max buy-in)
- **Minimum Players**: Game starts with 2+ players
- **Table Closure**: Game continues until only 1 or 0 players remain

---

## 2. Hand Ranking System

### 2.1 Standard Hand Rankings (High to Low)
1. **Royal Flush**: A-K-Q-J-10, all same suit
2. **Straight Flush**: Five consecutive cards, same suit
3. **Four of a Kind**: Four cards of same rank
4. **Full House**: Three of a kind + pair
5. **Flush**: Five cards of same suit (not consecutive)
6. **Straight**: Five consecutive cards (mixed suits)
7. **Three of a Kind**: Three cards of same rank
8. **Two Pair**: Two different pairs
9. **One Pair**: Two cards of same rank
10. **High Card**: Highest card when no other hand made

### 2.2 Hand Evaluation Algorithms

#### Option A: Perfect Hash Algorithm (Recommended)
- **Pros**: Fastest evaluation (~100kb memory, microseconds)
- **Cons**: Requires precomputed lookup tables
- **Use Case**: Production environments, high-concurrency games
- **Implementation**: 7-card evaluation using perfect hash functions
- **Resources**: PokerHandEvaluator library (supports Node.js/C++)

#### Option B: Prime Number Method (Cactus Kev)
- **Pros**: Fast, memory efficient, well-documented
- **Cons**: Requires understanding of prime number encoding
- **Use Case**: Custom implementations, educational purposes
- **Implementation**: Assign prime numbers to card ranks, use multiplication for unique hand IDs
- **Distinct Hands**: 7,462 unique hand values

#### Option C: Bit Math Approach
- **Pros**: Extremely fast bitwise operations
- **Cons**: Complex to implement and maintain
- **Use Case**: Performance-critical systems
- **Implementation**: Binary representation, mod 15 operations for hand type detection

### 2.3 MVP Recommendation
Use **Perfect Hash Algorithm** with pre-built library:
- NPM package: `pokersolver` or `phe` (Poker Hand Evaluator)
- Handles 5-7 card evaluation
- Battle-tested in production poker platforms
- TypeScript support available

```typescript
// Example usage
import { Hand } from 'pokersolver';

const player1 = Hand.solve(['As', 'Kd', 'Qh', 'Jc', 'Ts', '9h', '8d']);
const player2 = Hand.solve(['2c', '3d', '4h', '5s', '6c', '7h', '8s']);

const winner = Hand.winners([player1, player2]);
// Returns array of winning hands
```

---

## 3. Betting Structure

### 3.1 No-Limit Hold'em (Recommended for MVP)
- **Minimum Bet**: Must equal big blind
- **Minimum Raise**: Must equal or exceed previous bet/raise amount
- **Maximum Bet**: Player's entire chip stack (all-in)
- **Re-raising**: Unlimited number of raises allowed

### 3.2 Betting Round Logic

#### Initial Bet
- First bet in a round must be at least the big blind
- Example: In $1/$2 game, minimum bet is $2

#### Raise Requirements
- Raise must be at least 2x the previous bet
- Example: If player bets $10, next raise must be to at least $20
- Re-raise must increase by at least the previous raise amount
  - Player A bets $10
  - Player B raises to $30 (+$20)
  - Player C must raise to at least $50 (+$20 minimum)

#### All-In Rules
- Player can always go all-in with any amount
- If all-in is less than minimum raise, it doesn't reopen betting
- If all-in is equal to or exceeds minimum raise, it reopens betting for players who already acted

### 3.3 Pot Calculation
```typescript
interface PotState {
  mainPot: number;
  sidePots: SidePot[];
  totalPot: number;
}

interface SidePot {
  amount: number;
  eligiblePlayers: string[]; // Player IDs
}
```

### 3.4 Action Timer
- **Standard Time**: 30 seconds per decision (configurable)
- **Time Bank**: Optional 60-second reserve for difficult decisions
- **Auto-Fold**: If time expires and no action taken, player folds
- **Warning**: Visual/audio alert at 10 seconds remaining

---

## 4. Side Pot Calculation

### 4.1 Side Pot Algorithm

#### Scenario
- Player A: $25 (all-in)
- Player B: $75 (all-in)
- Player C: $100 (call)

#### Calculation Steps
1. **Sort players by bet amount** (ascending)
2. **Calculate main pot**:
   - Take $25 from each player (A's all-in amount)
   - Main pot = $25 × 3 = $75
   - Eligible: Players A, B, C

3. **Calculate first side pot**:
   - Take remaining from B and C: $50 each
   - Side pot 1 = $50 × 2 = $100
   - Eligible: Players B, C

4. **Calculate second side pot** (if needed):
   - Take remaining from C: $25
   - Side pot 2 = $25
   - Eligible: Player C only

### 4.2 Implementation Algorithm

```typescript
function calculateSidePots(players: Player[]): PotState {
  const activePlayers = players.filter(p => !p.folded && p.bet > 0);

  // Sort by bet amount
  activePlayers.sort((a, b) => a.bet - b.bet);

  const pots: SidePot[] = [];
  let previousBet = 0;

  for (let i = 0; i < activePlayers.length; i++) {
    const currentBet = activePlayers[i].bet;
    const potContribution = currentBet - previousBet;

    if (potContribution > 0) {
      const eligiblePlayers = activePlayers.slice(i);
      const potAmount = potContribution * eligiblePlayers.length;

      pots.push({
        amount: potAmount,
        eligiblePlayers: eligiblePlayers.map(p => p.id)
      });
    }

    previousBet = currentBet;
  }

  return {
    mainPot: pots[0]?.amount || 0,
    sidePots: pots.slice(1),
    totalPot: pots.reduce((sum, pot) => sum + pot.amount, 0)
  };
}
```

### 4.3 Distribution Logic
1. Evaluate hands for players eligible for each pot
2. Determine winner(s) for each pot (can be different winners)
3. If tie, split pot equally among tied players
4. Handle odd chips: Award to player closest to dealer button (clockwise)

---

## 5. Technical Architecture

### 5.1 Recommended Tech Stack

#### Backend
- **Framework**: NestJS (TypeScript)
- **Runtime**: Node.js 18+ (LTS)
- **Real-time**: Socket.io 4.x
- **Game Engine**: Custom NestJS module + pokersolver library
- **Testing**: Jest (unit), Supertest (integration), Cucumber (E2E)
- **Validation**: class-validator + class-transformer
- **Icons (Frontend)**: lucide-react (tree-shakeable, 1000+ icons)
- **Localization (Future)**: nestjs-i18n (backend), next-intl (frontend)

#### Database
- **Primary DB**: PostgreSQL 15+
  - User accounts
  - Transactions
  - Game history
  - Audit logs
- **Cache/State**: Redis 7+
  - Active game states
  - Player sessions
  - Real-time room lists
  - Pub/sub for scaling

#### NestJS Module Architecture
```
src/
├── modules/
│   ├── auth/              # FR-001 to FR-005: Telegram OAuth
│   │   ├── guards/        # TelegramAuthGuard
│   │   ├── strategies/    # JWT strategy
│   │   └── decorators/    # @CurrentUser()
│   ├── wallet/            # FR-006 to FR-015: Transactions
│   │   ├── services/      # TransactionService, BalanceService
│   │   ├── pipes/         # BalanceValidationPipe
│   │   └── interceptors/  # TransactionInterceptor (atomic updates)
│   ├── game/              # FR-025 to FR-041: Poker logic
│   │   ├── engine/        # Hand evaluation, pot calculation
│   │   ├── entities/      # GameState, Card, Deck
│   │   └── validators/    # BetAmountValidationPipe
│   ├── room/              # FR-016 to FR-024: Room management
│   │   ├── pipes/         # RoomSettingsValidationPipe
│   │   └── filters/       # Room query filters
│   ├── realtime/          # FR-042 to FR-049: WebSocket gateway
│   │   ├── gateways/      # GameGateway, LobbyGateway
│   │   ├── adapters/      # Redis adapter for scaling
│   │   └── guards/        # WsAuthGuard
│   ├── admin/             # FR-050 to FR-083: Admin operations
│   │   ├── guards/        # AdminRoleGuard (RBAC)
│   │   └── interceptors/  # AuditInterceptor (log all actions)
│   ├── audit/             # FR-092 to FR-097: Audit logging
│   │   └── services/      # AuditLogService
│   └── i18n/              # FR-104 to FR-108: Localization (future)
│       └── resources/     # Translation JSON files
├── common/
│   ├── filters/           # Global exception filter (FR-115)
│   ├── interceptors/      # Logging, error handling
│   ├── guards/            # Rate limiting (FR-088)
│   └── pipes/             # Global validation pipe
└── config/
    └── configuration.ts   # Environment-based config
```

#### Microservices Architecture (Optional for Scale)
- **API Gateway**: NestJS Gateway
- **Game Service**: Handles game logic and state
- **Wallet Service**: Manages balances and transactions
- **Auth Service**: Telegram OAuth and session management
- **Admin Service**: Administrative operations

### 5.2 System Architecture Diagram

```
┌─────────────────┐
│  Next.js Client │ (Telegram Mini App / Web)
└────────┬────────┘
         │ WebSocket + REST
         ▼
┌─────────────────────────────────────┐
│      NestJS API Gateway             │
│  - Socket.io Server                 │
│  - REST API Endpoints               │
│  - JWT Authentication               │
└────────┬────────────────────────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌────────┐ ┌──────┐ ┌─────────┐ ┌────────┐
│ Game   │ │Wallet│ │  User   │ │ Admin  │
│Service │ │Service│ │ Service │ │Service │
└───┬────┘ └──┬───┘ └────┬────┘ └───┬────┘
    │         │          │          │
    └─────────┴──────────┴──────────┘
              │
    ┌─────────┴──────────┐
    ▼                    ▼
┌──────────┐      ┌──────────┐
│PostgreSQL│      │  Redis   │
│  (ACID)  │      │(State)   │
└──────────┘      └──────────┘
```

### 5.3 Scalability Considerations

#### Horizontal Scaling
- **Stateless API servers**: Multiple NestJS instances behind load balancer
- **Redis Pub/Sub**: Synchronize game events across servers
- **Sticky Sessions**: Route players to same server during game (Socket.io adapter)

#### Vertical Optimization
- **Connection pooling**: PostgreSQL (max 100 connections per instance)
- **Redis pipelining**: Batch state updates
- **Lazy loading**: Load game history on demand

#### Performance Targets
- **Game action latency**: <500ms from action to all players updated
- **WebSocket message rate**: 100 messages/second per table
- **Concurrent tables**: 1,000 active tables per server instance
- **Player capacity**: 10,000 concurrent players (100 servers)

---

## 6. Game State Management

### 6.1 Game State Schema

```typescript
interface GameState {
  // Metadata
  gameId: string;
  roomId: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;

  // Table Configuration
  smallBlind: number;
  bigBlind: number;
  maxPlayers: number;
  minBuyIn: number;
  maxBuyIn: number;

  // Game Progress
  handNumber: number;
  dealerPosition: number; // Seat index
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

  // Cards
  deck: Card[]; // Remaining cards in deck
  communityCards: Card[]; // 0-5 cards
  burnedCards: Card[]; // Hidden cards

  // Players
  seats: Seat[]; // Array of 9 seats (null if empty)
  activePlayers: string[]; // Player IDs still in hand
  currentPlayer: string | null; // Player ID whose turn it is

  // Betting
  pot: PotState;
  currentBet: number;
  lastRaise: number;
  bettingRound: BettingAction[];

  // Timers
  actionDeadline: Date | null;
  handStartTime: Date;
}

interface Seat {
  position: number; // 0-8
  player: Player | null;
  cards: Card[]; // Hole cards (hidden from other players)
  stack: number; // Current chips
  bet: number; // Current bet in this round
  status: 'sitting' | 'active' | 'folded' | 'allin' | 'disconnected';
  hasActed: boolean;
}

interface Card {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
  suit: 'h' | 'd' | 'c' | 's'; // hearts, diamonds, clubs, spades
}

interface BettingAction {
  playerId: string;
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';
  amount: number;
  timestamp: Date;
  stack: number; // Stack after action
}
```

### 6.2 State Storage Strategy

#### Redis (Hot State)
Store active game states in Redis with TTL:
- Key: `game:{gameId}`
- TTL: 24 hours (reset on each action)
- Serialization: JSON
- Size: ~5-10KB per game state

#### PostgreSQL (Cold Storage)
Persist completed hands for history:
- Table: `game_hands`
- Indexes: `player_id`, `room_id`, `created_at`
- Compression: JSONB for efficiency

### 6.3 State Synchronization

#### Event-Driven Updates
```typescript
// Events emitted by game engine
enum GameEvent {
  HAND_STARTED = 'hand:started',
  CARDS_DEALT = 'cards:dealt',
  PLAYER_ACTION = 'player:action',
  BETTING_ROUND_COMPLETE = 'betting:complete',
  COMMUNITY_CARDS_DEALT = 'community:dealt',
  SHOWDOWN = 'showdown',
  HAND_COMPLETE = 'hand:complete',
  PLAYER_JOINED = 'player:joined',
  PLAYER_LEFT = 'player:left',
  PLAYER_DISCONNECTED = 'player:disconnected',
  PLAYER_RECONNECTED = 'player:reconnected'
}
```

#### Client State Updates
- **Full state**: Sent on initial connection (join room)
- **Incremental updates**: Sent via events during gameplay
- **State reconciliation**: Client requests full state if desync detected

---

## 7. Real-Time Communication

### 7.1 WebSocket Architecture

#### Socket.io Namespaces
```typescript
// Socket.io namespace structure
io.of('/game').on('connection', (socket) => {
  // Game-related events
});

io.of('/lobby').on('connection', (socket) => {
  // Room list, chat, notifications
});

io.of('/admin').on('connection', (socket) => {
  // Admin monitoring and controls
});
```

#### Room Management
```typescript
// Player joins game room
socket.join(`game:${gameId}`);

// Broadcast to all players in game
io.of('/game').to(`game:${gameId}`).emit('player:action', action);

// Send to specific player (private cards)
io.of('/game').to(socket.id).emit('cards:dealt', { cards: ['As', 'Kh'] });
```

### 7.2 Event Protocol

#### Client → Server Events
```typescript
// Player actions
socket.emit('game:action', {
  gameId: 'game-123',
  action: 'raise',
  amount: 50
});

socket.emit('game:join', {
  gameId: 'game-123',
  buyIn: 200
});

socket.emit('game:leave', {
  gameId: 'game-123'
});

socket.emit('chat:message', {
  gameId: 'game-123',
  message: 'Good game!'
});
```

#### Server → Client Events
```typescript
// Game state updates
socket.on('game:state', (state: GameState) => {
  // Full game state
});

socket.on('game:action', (action: BettingAction) => {
  // Another player's action
});

socket.on('cards:dealt', (data: { cards: Card[], phase: string }) => {
  // Community cards or hole cards
});

socket.on('game:winner', (data: { winners: Winner[], pots: Pot[] }) => {
  // Hand results
});

socket.on('player:turn', (data: { playerId: string, deadline: Date }) => {
  // Your turn to act
});

socket.on('error', (error: { code: string, message: string }) => {
  // Error handling
});
```

### 7.3 Connection Management

#### Heartbeat / Ping-Pong
```typescript
// Server sends ping every 25 seconds
socket.on('ping', () => {
  socket.emit('pong');
});

// Client timeout if no pong within 10 seconds
// Mark player as disconnected (not folded)
```

#### Reconnection Handling
```typescript
socket.on('disconnect', () => {
  // Mark player as disconnected
  // Start 60-second timer
  // Auto-fold after timer expires if not reconnected
});

socket.on('game:reconnect', ({ gameId, playerId, token }) => {
  // Verify session token
  // Restore player to game
  // Send current game state
  // Resume action timer if player's turn
});
```

#### Exponential Backoff (Client-side)
```typescript
const reconnectDelays = [1000, 2000, 5000, 10000, 30000]; // ms
let reconnectAttempt = 0;

socket.on('disconnect', () => {
  setTimeout(() => {
    socket.connect();
    reconnectAttempt++;
  }, reconnectDelays[Math.min(reconnectAttempt, reconnectDelays.length - 1)]);
});

socket.on('connect', () => {
  reconnectAttempt = 0; // Reset on successful connection
});
```

---

## 8. Performance Optimization

### 8.1 Database Optimization

#### Indexing Strategy
```sql
-- Users table
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username);

-- Rooms table
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);

-- Transactions table
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type_status ON transactions(type, status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Game hands table
CREATE INDEX idx_game_hands_room_id ON game_hands(room_id);
CREATE INDEX idx_game_hands_players ON game_hands USING GIN (players jsonb_path_ops);
```

#### Query Optimization
- Use `SELECT` with specific columns (avoid `SELECT *`)
- Implement pagination with `LIMIT` and `OFFSET`
- Use `EXPLAIN ANALYZE` to optimize slow queries
- Denormalize frequently accessed data (trade-off: storage vs speed)

#### Connection Pooling
```typescript
// NestJS TypeORM configuration
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'poker_game',
  extra: {
    max: 20, // Max connections in pool
    min: 5,  // Min idle connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  }
})
```

### 8.2 Redis Optimization

#### Caching Strategy
```typescript
// Cache user balance (TTL: 5 minutes)
await redis.setex(`balance:${userId}`, 300, balance.toString());

// Cache active game state (TTL: 1 hour, refresh on action)
await redis.setex(`game:${gameId}`, 3600, JSON.stringify(gameState));

// Cache room list (TTL: 10 seconds)
await redis.setex('rooms:active', 10, JSON.stringify(rooms));
```

#### Pub/Sub for Scaling
```typescript
// Publisher (Game Server 1)
redis.publish('game:actions', JSON.stringify({
  gameId: 'game-123',
  action: 'raise',
  playerId: 'user-456',
  amount: 50
}));

// Subscriber (Game Server 2)
redis.subscribe('game:actions');
redis.on('message', (channel, message) => {
  const action = JSON.parse(message);
  // Broadcast to connected clients
  io.of('/game').to(`game:${action.gameId}`).emit('player:action', action);
});
```

### 8.3 Frontend Optimization

#### Optimistic Updates
```typescript
// Update UI immediately (optimistic)
dispatch(playerAction({ action: 'raise', amount: 50 }));

// Send to server
socket.emit('game:action', { action: 'raise', amount: 50 });

// Rollback if error
socket.on('error', (error) => {
  dispatch(revertAction());
  showError(error.message);
});
```

#### Asset Optimization
- Use WebP images for cards (75% smaller than PNG)
- Implement sprite sheets for card assets (single HTTP request)
- Lazy load non-critical components
- Code splitting by route (Next.js automatic)

#### Animation Performance
- Use CSS transforms (GPU-accelerated)
- Implement `will-change` for animated elements
- Throttle non-critical updates (e.g., chip animations)
- Use `requestAnimationFrame` for smooth animations

---

## 9. Security & Anti-Cheating

### 9.1 Fair Shuffle Algorithm

#### Fisher-Yates Shuffle (Recommended)
```typescript
import crypto from 'crypto';

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use cryptographically secure random number generator
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0);
    const j = randomValue % (i + 1);

    // Swap
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
```

#### Key Requirements
- Use cryptographically secure RNG (`crypto.randomBytes`)
- Ensure true randomness (52! possible permutations)
- Avoid off-by-one errors in swap logic
- Log shuffle seed for audit trail (if disputes occur)

### 9.2 Anti-Cheating Mechanisms

#### Server-Side Validation
```typescript
// Validate every player action on server
function validateAction(
  gameState: GameState,
  playerId: string,
  action: PlayerAction
): boolean {
  // 1. Verify it's player's turn
  if (gameState.currentPlayer !== playerId) {
    throw new Error('Not your turn');
  }

  // 2. Verify player is active
  const seat = gameState.seats.find(s => s.player?.id === playerId);
  if (!seat || seat.status === 'folded') {
    throw new Error('Player not active');
  }

  // 3. Validate action amount
  if (action.action === 'raise') {
    const minRaise = gameState.currentBet + gameState.lastRaise;
    if (action.amount < minRaise && action.amount < seat.stack) {
      throw new Error('Raise amount too low');
    }
  }

  // 4. Verify sufficient funds
  if (action.amount > seat.stack) {
    throw new Error('Insufficient chips');
  }

  return true;
}
```

#### Collision Prevention
```typescript
// Verify no duplicate cards dealt
function verifyNoDuplicates(dealtCards: Card[]): boolean {
  const cardSet = new Set(dealtCards.map(c => `${c.rank}${c.suit}`));
  return cardSet.size === dealtCards.length;
}

// Checksum to verify deck integrity
function calculateDeckChecksum(deck: Card[]): string {
  const sortedDeck = [...deck].sort((a, b) =>
    `${a.rank}${a.suit}`.localeCompare(`${b.rank}${b.suit}`)
  );
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(sortedDeck))
    .digest('hex');
}
```

#### IP & Device Tracking
```typescript
// Track player connections
interface ConnectionLog {
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  gameId: string;
}

// Detect multiple accounts from same IP
async function detectCollusion(gameId: string): Promise<boolean> {
  const players = await getGamePlayers(gameId);
  const connections = await getRecentConnections(
    players.map(p => p.id),
    Date.now() - 3600000 // Last hour
  );

  // Group by IP address
  const ipGroups = groupBy(connections, 'ipAddress');

  // Flag if multiple players from same IP in same game
  return Object.values(ipGroups).some(group => group.length > 1);
}
```

#### Action Timing Analysis
```typescript
// Detect bot patterns (instant actions)
function detectBotBehavior(actions: BettingAction[]): boolean {
  const responseTimes = actions.map((action, i) => {
    if (i === 0) return null;
    return action.timestamp.getTime() - actions[i-1].timestamp.getTime();
  }).filter(Boolean);

  // Flag if average response time < 500ms
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  return avgResponseTime < 500;
}
```

### 9.3 Audit Trail

#### Log All Game Events
```typescript
interface AuditLog {
  eventId: string;
  gameId: string;
  eventType: string;
  playerId: string | null;
  data: any;
  timestamp: Date;
  serverNode: string; // Which server processed this
}

// Log format (JSON for easy parsing)
{
  "eventId": "evt-12345",
  "gameId": "game-123",
  "eventType": "player:action",
  "playerId": "user-456",
  "data": {
    "action": "raise",
    "amount": 50,
    "stackBefore": 200,
    "stackAfter": 150
  },
  "timestamp": "2025-01-15T10:30:45.123Z",
  "serverNode": "game-server-01"
}
```

#### Retention Policy
- **Active games**: Keep all logs (Redis + PostgreSQL)
- **Completed games**: Archive to PostgreSQL (7 days hot, 90 days cold)
- **Disputed hands**: Permanent retention with extended details

---

## 10. Database Schema

### 10.1 Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  balance DECIMAL(15, 2) DEFAULT 0 NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  -- Constraints
  CONSTRAINT balance_non_negative CHECK (balance >= 0)
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_status ON users(status);
```

#### Rooms Table
```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  small_blind DECIMAL(10, 2) NOT NULL,
  big_blind DECIMAL(10, 2) NOT NULL,
  min_buy_in DECIMAL(10, 2) NOT NULL,
  max_buy_in DECIMAL(10, 2) NOT NULL,
  max_players INTEGER DEFAULT 9,
  current_players INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, paused, closed
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_blinds CHECK (big_blind >= small_blind),
  CONSTRAINT valid_buy_in CHECK (max_buy_in >= min_buy_in),
  CONSTRAINT valid_player_count CHECK (current_players <= max_players)
);

CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL, -- deposit, withdrawal, game_win, game_loss
  amount DECIMAL(15, 2) NOT NULL,
  balance_before DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, rejected
  reference_id VARCHAR(255), -- External payment gateway reference
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  processed_by UUID REFERENCES users(id), -- Admin who processed
  processed_at TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type_status ON transactions(type, status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

#### Game Hands Table
```sql
CREATE TABLE game_hands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) NOT NULL,
  hand_number INTEGER NOT NULL,
  small_blind DECIMAL(10, 2) NOT NULL,
  big_blind DECIMAL(10, 2) NOT NULL,
  dealer_position INTEGER NOT NULL,
  community_cards JSONB, -- Array of cards
  pot_amount DECIMAL(15, 2) NOT NULL,
  winners JSONB, -- Array of { playerId, amount, hand }
  players JSONB NOT NULL, -- Array of player states
  actions JSONB NOT NULL, -- Array of all actions
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL,
  duration_seconds INTEGER,

  -- Indexes for JSONB fields
  CONSTRAINT unique_room_hand UNIQUE (room_id, hand_number)
);

CREATE INDEX idx_game_hands_room_id ON game_hands(room_id);
CREATE INDEX idx_game_hands_started_at ON game_hands(started_at DESC);
CREATE INDEX idx_game_hands_players ON game_hands USING GIN (players jsonb_path_ops);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- user, room, transaction, game
  entity_id UUID,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  server_node VARCHAR(100)
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### 10.2 Redis Data Structures

#### Active Game State
```
Key: game:{gameId}
Type: String (JSON)
TTL: 3600 seconds (1 hour, refresh on action)
Value: {
  gameId: "game-123",
  roomId: "room-456",
  phase: "flop",
  seats: [...],
  pot: {...},
  communityCards: [...]
}
```

#### Player Session
```
Key: session:{userId}
Type: Hash
TTL: 86400 seconds (24 hours)
Fields:
  - socketId: "socket-abc123"
  - currentGame: "game-123"
  - connectedAt: "2025-01-15T10:00:00Z"
  - lastActivity: "2025-01-15T10:30:45Z"
```

#### Room List
```
Key: rooms:active
Type: String (JSON array)
TTL: 10 seconds
Value: [
  { roomId: "room-1", players: 5, status: "active" },
  { roomId: "room-2", players: 2, status: "waiting" }
]
```

#### User Balance Cache
```
Key: balance:{userId}
Type: String
TTL: 300 seconds (5 minutes)
Value: "1500.50"
```

---

## 11. Implementation Checklist

### 11.1 Phase 1: Core Game Engine (Week 1-2)

#### Backend Tasks
- [ ] Initialize NestJS project with TypeScript (`nest new poker-platform`)
- [ ] Set up PostgreSQL and Redis connections (TypeORM + ioredis)
- [ ] **TDD: Write failing test** for Card and Deck models
- [ ] **TDD: Implement** Card and Deck entities to pass tests
- [ ] **TDD: Write failing test** for Fisher-Yates shuffle algorithm
- [ ] **TDD: Implement** Fisher-Yates shuffle to pass tests
- [ ] Integrate poker hand evaluator library (pokersolver)
- [ ] **TDD: Write failing test** for GameState validation
- [ ] **TDD: Implement** GameState model with class-validator decorators
- [ ] **TDD: Write failing tests** for game phase transitions
- [ ] **TDD: Implement** phase transitions (preflop → flop → turn → river → showdown)
- [ ] **TDD: Write failing tests** for betting logic validation
- [ ] **TDD: Implement** betting logic (fold, check, call, bet, raise, all-in)
- [ ] **TDD: Write failing tests** for side pot calculation
- [ ] **TDD: Implement** side pot calculation algorithm
- [ ] Set up Jest test configuration with 70% coverage threshold
- [ ] Configure Supertest for API integration tests
- [ ] **Refactor** all implemented code while keeping tests green

#### Testing Scenarios
- [ ] 2-player heads-up game
- [ ] 6-player full table
- [ ] Multiple all-in scenarios
- [ ] Side pot calculations with 3+ all-ins
- [ ] Hand evaluation for all hand types
- [ ] Edge cases (split pots, tie breakers)

### 11.2 Phase 2: Real-Time Communication (Week 2-3)

#### Backend Tasks
- [ ] Set up Socket.io server in NestJS
- [ ] Create game namespace (`/game`)
- [ ] Implement room join/leave logic
- [ ] Build event handlers for player actions
- [ ] Implement broadcast system for game updates
- [ ] Add heartbeat/ping-pong mechanism
- [ ] Implement reconnection handling
- [ ] Add action timer with auto-fold

#### Frontend Tasks (Next.js)
- [ ] Set up Socket.io client
- [ ] Implement WebSocket connection manager
- [ ] Build reconnection logic with exponential backoff
- [ ] Create event listeners for game updates
- [ ] Implement optimistic UI updates
- [ ] Add error handling and rollback

#### Testing Scenarios
- [ ] Player disconnects mid-hand
- [ ] Player reconnects before timeout
- [ ] Action timer expires (auto-fold)
- [ ] Multiple rapid actions
- [ ] Network latency simulation

### 11.3 Phase 3: User Interface (Week 3-4)

#### Frontend Tasks
- [ ] Design mobile-first poker table layout
- [ ] Implement card component with flip animations
- [ ] Build betting controls (slider, quick bet buttons)
- [ ] Create player avatar with status indicators
- [ ] Implement pot display and chip visualization
- [ ] Add action buttons with disabled states
- [ ] Build chat component
- [ ] Implement room list with filters
- [ ] Create join/create room modals
- [ ] Add sound effects (optional fold, call, win)

#### Design Requirements
- [ ] Portrait mode optimization (Telegram Mini App)
- [ ] Touch-friendly controls (minimum 44x44px targets)
- [ ] Smooth animations (<16ms frame time)
- [ ] Professional card assets (SVG or WebP)
- [ ] Responsive to different screen sizes
- [ ] Accessibility considerations (color contrast, labels)

### 11.4 Phase 4: Wallet & Transactions (Week 4-5)

#### Backend Tasks
- [ ] Create Transaction model and API
- [ ] Implement deposit request flow
- [ ] Implement withdrawal request flow
- [ ] Build balance update mechanism (atomic operations)
- [ ] Add transaction history endpoint
- [ ] Implement admin approval workflow
- [ ] Integrate payment gateway (mock for MVP)
- [ ] Add transaction audit logging

#### Frontend Tasks
- [ ] Build wallet page (balance, pending transactions)
- [ ] Create deposit modal
- [ ] Create withdrawal modal
- [ ] Implement transaction history list
- [ ] Add transaction detail view

#### Database Tasks
- [ ] Set up database triggers for balance updates
- [ ] Implement transaction locking (prevent double-spend)
- [ ] Add reconciliation checks

### 11.5 Phase 5: Admin Dashboard (Week 5-6)

#### Backend Tasks
- [ ] Create admin authentication (JWT)
- [ ] Build admin API endpoints
- [ ] Implement room monitoring
- [ ] Build withdrawal approval system
- [ ] Create user suspension mechanism
- [ ] Add transaction export functionality
- [ ] Implement settings management

#### Frontend Tasks
- [ ] Build admin login page
- [ ] Create dashboard overview with metrics
- [ ] Implement room management page
- [ ] Build withdrawal queue with approve/reject
- [ ] Create user management page
- [ ] Implement transaction log with filters
- [ ] Add settings page

### 11.6 Phase 6: Testing & Optimization (Week 6-7)

#### Testing Tasks
- [ ] Write integration tests for game flow
- [ ] Perform load testing (100+ concurrent games)
- [ ] Test reconnection scenarios
- [ ] Security penetration testing
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Telegram Mini App testing
- [ ] Mobile device testing (iOS, Android)

#### Optimization Tasks
- [ ] Profile and optimize slow queries
- [ ] Implement database indexing
- [ ] Add Redis caching for hot data
- [ ] Optimize WebSocket message payloads
- [ ] Implement lazy loading for game history
- [ ] Compress assets (images, fonts)
- [ ] Set up CDN for static assets

#### Security Tasks
- [ ] Audit input validation
- [ ] Test for SQL injection
- [ ] Test for XSS vulnerabilities
- [ ] Review authentication flow
- [ ] Test rate limiting
- [ ] Review audit logging completeness

### 11.7 Phase 7: Deployment (Week 7-8)

#### Infrastructure Tasks
- [ ] Set up production PostgreSQL cluster
- [ ] Set up Redis cluster (master-replica)
- [ ] Configure load balancer
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring (New Relic, Datadog, or similar)
- [ ] Configure logging aggregation
- [ ] Set up backup strategy

#### Deployment Tasks
- [ ] Deploy backend to production
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Configure Telegram Mini App
- [ ] Set up CI/CD pipeline
- [ ] Create deployment documentation
- [ ] Set up error tracking (Sentry)

#### Launch Tasks
- [ ] Soft launch with beta users
- [ ] Monitor performance metrics
- [ ] Fix critical bugs
- [ ] Gather user feedback
- [ ] Full launch

---

## 12. NestJS Implementation Patterns

### 12.1 Guards & Authorization

#### Telegram Auth Guard (FR-001)
```typescript
// modules/auth/guards/telegram-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### Admin Role Guard (FR-054, RBAC)
```typescript
// modules/admin/guards/admin-role.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage in controller
@Controller('admin/withdrawals')
@UseGuards(TelegramAuthGuard, AdminRoleGuard)
@Roles(Role.Admin)
export class WithdrawalManagementController { /* ... */ }
```

### 12.2 Pipes & Validation

#### Balance Validation Pipe (FR-009, FR-021)
```typescript
// modules/wallet/pipes/balance-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { WalletService } from '../services/wallet.service';

@Injectable()
export class BalanceValidationPipe implements PipeTransform {
  constructor(private walletService: WalletService) {}

  async transform(value: { userId: string; amount: number }) {
    const balance = await this.walletService.getBalance(value.userId);

    if (balance < value.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return value;
  }
}
```

#### Room Settings Validation Pipe (FR-019)
```typescript
// modules/room/pipes/room-settings-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { CreateRoomDto } from '../dto/create-room.dto';

@Injectable()
export class RoomSettingsValidationPipe implements PipeTransform {
  transform(value: CreateRoomDto) {
    if (value.maxBuyIn < value.minBuyIn) {
      throw new BadRequestException('Max buy-in must be >= min buy-in');
    }

    if (value.bigBlind < value.smallBlind) {
      throw new BadRequestException('Big blind must be >= small blind');
    }

    return value;
  }
}
```

### 12.3 Interceptors

#### Transaction Interceptor (FR-013, FR-096)
```typescript
// modules/wallet/interceptors/transaction.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await next.handle().toPromise();
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
```

#### Audit Interceptor (FR-062, FR-069, FR-075)
```typescript
// modules/admin/interceptors/audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from '../../audit/services/audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, body } = request;

    return next.handle().pipe(
      tap(() => {
        this.auditService.log({
          userId: user.id,
          action: `${method} ${url}`,
          details: body,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          timestamp: new Date(),
        });
      }),
    );
  }
}
```

### 12.4 Exception Filters (FR-115)

#### Global Exception Filter
```typescript
// common/filters/global-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log error with context (FR-118)
    console.error({
      userId: request['user']?.id,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      error: exception,
    });

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}

// Register in main.ts
app.useGlobalFilters(new GlobalExceptionFilter());
```

#### WebSocket Exception Filter
```typescript
// modules/realtime/filters/ws-exception.filter.ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const error = exception.getError();

    client.emit('error', {
      status: 'error',
      message: error,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 12.5 Circuit Breaker Pattern (FR-116)

```typescript
// modules/wallet/services/payment-gateway.service.ts
import { Injectable } from '@nestjs/common';
import CircuitBreaker from 'opossum';

@Injectable()
export class PaymentGatewayService {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    const options = {
      timeout: 5000, // 5 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30 seconds
    };

    this.circuitBreaker = new CircuitBreaker(
      this.submitWithdrawal.bind(this),
      options
    );

    this.circuitBreaker.on('open', () => {
      console.error('Circuit breaker opened - payment gateway down');
    });

    this.circuitBreaker.on('halfOpen', () => {
      console.log('Circuit breaker half-open - testing gateway');
    });
  }

  async processWithdrawal(amount: number, userId: string) {
    try {
      return await this.circuitBreaker.fire(amount, userId);
    } catch (error) {
      // Fallback: Queue for manual processing
      throw new ServiceUnavailableException('Payment gateway unavailable');
    }
  }

  private async submitWithdrawal(amount: number, userId: string) {
    // Actual HTTP call to third-party payment gateway
    // ...
  }
}
```

### 12.6 WebSocket Gateway with Redis Adapter (FR-042 to FR-049)

```typescript
// modules/realtime/gateways/game.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '../guards/ws-auth.guard';

@WebSocketGateway({ namespace: '/game', cors: true })
@UseGuards(WsAuthGuard)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private gameService: GameService) {}

  async handleConnection(client: Socket) {
    const user = client.data.user;
    console.log(`User ${user.id} connected`);

    // Restore player to game if reconnecting (FR-048)
    const activeGame = await this.gameService.getActiveGame(user.id);
    if (activeGame) {
      client.join(`game:${activeGame.id}`);
      client.emit('game:state', activeGame);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    console.log(`User ${user.id} disconnected`);

    // Hold seat for 60 seconds (FR-047)
    setTimeout(async () => {
      const stillDisconnected = !this.isClientConnected(user.id);
      if (stillDisconnected) {
        await this.gameService.autoFoldPlayer(user.id);
      }
    }, 60000);
  }

  @SubscribeMessage('game:action')
  async handleGameAction(
    client: Socket,
    payload: { gameId: string; action: string; amount?: number }
  ) {
    const user = client.data.user;

    // Process action and broadcast to all players (FR-043)
    const result = await this.gameService.processAction(
      payload.gameId,
      user.id,
      payload.action,
      payload.amount
    );

    this.server.to(`game:${payload.gameId}`).emit('player:action', result);
  }

  private isClientConnected(userId: string): boolean {
    // Check if user has active socket connection
    // ...
  }
}
```

### 12.7 Localization Setup (FR-104 to FR-108)

```typescript
// modules/i18n/i18n.module.ts
import { Module } from '@nestjs/common';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/resources/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
  ],
})
export class LocalizationModule {}

// Usage in service/controller
constructor(@I18nLang() lang: string, private i18n: I18nService) {}

async getMessage() {
  return this.i18n.t('game.INSUFFICIENT_BALANCE', { lang: this.lang });
}
```

```json
// modules/i18n/resources/en/game.json
{
  "INSUFFICIENT_BALANCE": "Insufficient balance to join room",
  "INVALID_BET_AMOUNT": "Bet amount must meet minimum raise",
  "ROOM_FULL": "This room is full",
  "HAND_WON": "You won {amount} chips!"
}
```

### 12.8 TDD Workflow Example

```typescript
// modules/game/services/side-pot.service.spec.ts
describe('SidePotService', () => {
  let service: SidePotService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SidePotService],
    }).compile();

    service = module.get<SidePotService>(SidePotService);
  });

  // RED: Write failing test first
  it('should calculate side pots correctly with multiple all-ins', () => {
    const players = [
      { id: 'A', bet: 25, stack: 0 },  // All-in $25
      { id: 'B', bet: 75, stack: 0 },  // All-in $75
      { id: 'C', bet: 100, stack: 25 }, // Call $100
    ];

    const result = service.calculateSidePots(players);

    // Expected: Main pot $75 (3 players), Side pot 1 $100 (B,C), Side pot 2 $25 (C only)
    expect(result.mainPot).toBe(75);
    expect(result.sidePots).toHaveLength(2);
    expect(result.sidePots[0].amount).toBe(100);
    expect(result.sidePots[0].eligiblePlayers).toEqual(['B', 'C']);
    expect(result.sidePots[1].amount).toBe(25);
    expect(result.sidePots[1].eligiblePlayers).toEqual(['C']);
  });

  // GREEN: Implement minimum code to pass
  // REFACTOR: Clean up while keeping tests green
});
```

---

## 13. Key Technical Decisions

### 12.1 MVP Simplifications
- **Single table only**: No multi-tabling support
- **Manual withdrawals**: Admin approval required (no automation)
- **Basic statistics**: Win/loss record only (no advanced analytics)
- **Standard blinds**: Predefined blind levels (no custom)
- **English only**: Single language support
- **Platform credits**: No cryptocurrency integration

### 12.2 Post-MVP Enhancements
- Multi-table support
- Tournament mode
- Advanced hand history analysis
- Player statistics (VPIP, PFR, aggression factor)
- Friend system and private tables
- Automated withdrawal processing
- Mobile native apps (React Native)
- Cryptocurrency support
- Multi-language support
- Rakeback and loyalty programs
- Table chat moderation
- Advanced anti-bot detection

---

## 13. Performance Benchmarks

### 13.1 Target Metrics
- **API Response Time**: <100ms (p95)
- **WebSocket Latency**: <500ms (action to all players)
- **Database Query Time**: <50ms (p95)
- **Redis Operations**: <10ms (p95)
- **Page Load Time**: <2 seconds (First Contentful Paint)
- **Time to Interactive**: <3 seconds

### 13.2 Capacity Planning
- **Players per table**: 2-9
- **Tables per server**: 1,000 concurrent
- **Players per server**: 9,000 concurrent
- **Messages per second**: 10,000 (per server)
- **Database connections**: 100 (pooled)
- **Redis connections**: 50 (pooled)

### 13.3 Monitoring & Alerts
- Alert if API response time >500ms
- Alert if WebSocket connections >80% capacity
- Alert if database CPU >80%
- Alert if Redis memory >80%
- Alert if error rate >1%
- Alert if player complaints about lag

---

## 14. Testing Strategy

### 14.1 Unit Tests (70% coverage minimum)
- Game logic (hand evaluation, pot calculation)
- Betting validation
- Side pot algorithm
- Shuffle algorithm (statistical distribution)
- Player action validation

### 14.2 Integration Tests
- Full game flow (preflop → showdown)
- WebSocket connection and reconnection
- Database transactions (ACID compliance)
- API endpoints (REST + WebSocket)
- Admin workflows

### 14.3 End-to-End Tests
- User registration and authentication
- Join room and play full hand
- Deposit and withdrawal flow
- Admin approval workflow
- Multi-player scenarios

### 14.4 Load Testing
- 1,000 concurrent players
- 100 simultaneous games
- 10,000 actions per second
- Database stress test
- Redis stress test

---

## 15. Security Checklist

### 15.1 Authentication & Authorization
- [ ] Secure Telegram OAuth implementation
- [ ] JWT token expiration and refresh
- [ ] Session management and timeout
- [ ] Admin role-based access control
- [ ] API endpoint authorization

### 15.2 Data Protection
- [ ] HTTPS/TLS for all communications
- [ ] WebSocket secure connections (wss://)
- [ ] Encrypt sensitive data at rest
- [ ] Hash user credentials (bcrypt)
- [ ] Secure environment variables

### 15.3 Input Validation
- [ ] Server-side validation for all actions
- [ ] Sanitize user input (XSS prevention)
- [ ] Validate transaction amounts
- [ ] Check for SQL injection vulnerabilities
- [ ] Rate limiting on API endpoints

### 15.4 Game Integrity
- [ ] Cryptographically secure RNG
- [ ] Server-authoritative game state
- [ ] Validate all player actions
- [ ] Detect and prevent collusion
- [ ] Audit trail for all game events

---

## Conclusion

This technical reference document provides comprehensive guidance for implementing a production-ready Texas Hold'em cash game virtual room. The architecture prioritizes:

1. **Correctness**: Accurate poker rules and hand evaluation
2. **Performance**: Real-time gameplay with <1 second latency
3. **Scalability**: Support for thousands of concurrent players
4. **Security**: Fair shuffle, anti-cheating, secure transactions
5. **User Experience**: Mobile-first design, smooth animations

Use this document as a module specification when generating the spec-kit PRD. Each section can be expanded into detailed technical specifications, API contracts, and implementation tasks.

---

## References & Resources

### Libraries & Tools
- **pokersolver**: Hand evaluation library for Node.js
- **Socket.io**: WebSocket library for real-time communication
- **Redis**: In-memory data store for game state
- **PostgreSQL**: Relational database for persistence
- **NestJS**: TypeScript backend framework
- **Next.js**: React framework for frontend

### Algorithms
- Fisher-Yates shuffle
- Perfect hash hand evaluation
- Side pot calculation algorithm

### Industry Standards
- 52-card deck standard
- Texas Hold'em official rules
- No-Limit betting structure
- Cash game best practices

### Learning Resources
- PokerNews.com (rules and strategy)
- GitHub implementations (casino-server, web-poker)
- Stack Overflow discussions (algorithms and architecture)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-15
**Author**: AI Technical Architect
**Purpose**: Spec-Kit Module Specification Reference
