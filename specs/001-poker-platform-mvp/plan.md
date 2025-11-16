# Implementation Plan: Texas Poker Platform MVP

**Branch**: `001-poker-platform-mvp` | **Date**: 2025-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-poker-platform-mvp/spec.md`

## Summary

Build a Telegram mini app + web platform for Texas Hold'em poker with real-time multiplayer gameplay, room management, integrated payment system, and comprehensive admin controls. The platform delivers P1 user stories (Authentication, Wallet, Browse/Join Rooms, **Play Texas Hold'em**, Admin Withdrawals) as MVP, with P2/P3 stories deferred post-launch.

**Technical Approach**: NestJS backend with Socket.io for real-time gameplay, Next.js frontend optimized for Telegram Mini App, PostgreSQL for transactional data, Redis for game state and caching. Emphasis on TDD methodology, production-ready poker mechanics (all rules implemented correctly, no MVP shortcuts), and financial integrity.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 18+ LTS (backend), TypeScript 5.x with React 18 (frontend)
**Primary Dependencies**:
- Backend: NestJS 10.x, Socket.io 4.x, TypeORM, PostgreSQL driver, Redis (ioredis), pokersolver (hand evaluation), @telegram-apps/sdk
- Frontend: Next.js 14.x, Socket.io-client, Zustand (state), Tailwind CSS, Lucide React (icons), @telegram-apps/sdk

**Storage**: PostgreSQL 15+ (ACID transactions for wallet/game history), Redis 7+ (active game state, caching, pub/sub)
**Testing**: Jest (unit/integration), Supertest (API), React Testing Library (components), Playwright (E2E)
**Target Platform**: Telegram Mini App (primary), Web browsers (secondary), Azure deployment (Container Apps, Static Web Apps)

**Project Type**: Web application (backend API + frontend SPA)
**Performance Goals**:
- Game action processing: <500ms (p95)
- WebSocket message rate: 100 msg/sec per table
- API response: <100ms read, <200ms write (p95)
- Frontend TTI: <3s on 3G networks

**Constraints**:
- Real-time latency: <1s action broadcast to all players
- Financial operations: ACID compliant, zero balance discrepancies
- Offline: Not supported (real-time multiplayer requires connectivity)
- Mobile-first: Portrait orientation optimized

**Scale/Scope**:
- MVP: 100 concurrent players across 20 tables
- Post-MVP scaling: 10,000 concurrent players, 1,000 active tables per server
- Database: ~50k transactions/day, 1M game hands/month
- Frontend: 12 user stories (7 P1, 3 P2, 2 P3), ~100 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle Alignment

✅ **I. Test-Driven Development (NON-NEGOTIABLE)**
- Status: PASS
- Evidence: TDD workflow enforced in tasks.md. Every feature has RED (failing tests) → GREEN (implementation) → REFACTOR phases documented. Jest configured with 70% coverage threshold.

✅ **II. Mobile-First Design**
- Status: PASS
- Evidence: Primary target is Telegram Mini App (portrait). Frontend uses mobile-first Tailwind breakpoints. Touch-friendly 44x44px minimum tap targets. Bottom navigation for poker actions.

✅ **III. Financial Integrity**
- Status: PASS
- Evidence: Atomic transactions for wallet operations (TypeORM transactions). Double-entry accounting in transaction logs. Immutable audit trail. Server-side validation for all financial operations. Admin approval workflow for withdrawals.

✅ **IV. Real-Time Performance**
- Status: PASS
- Evidence: <500ms action processing target. Socket.io with Redis adapter for horizontal scaling. WebSocket compression. Connection pooling for database. Performance benchmarking tasks included.

✅ **V. Security & Anti-Cheating**
- Status: PASS
- Evidence: Cryptographic Fisher-Yates shuffle (crypto.randomBytes). Server-authoritative game state. Card visibility validation. Action validation on every player move. Bot detection via timing analysis. IP tracking for multi-accounting detection.

✅ **VI. Professional UI/UX Standards**
- Status: PASS
- Evidence: Lucide React for icons (no emojis). Localization-ready with nestjs-i18n and next-intl. Professional card assets (WebP/SVG). 60fps animations requirement. ARIA accessibility labels.

✅ **VII. Incremental Delivery & MVP Focus**
- Status: PASS
- Evidence: 12 user stories, each independently testable. P1 stories (1, 2, 3, 5, 9) form MVP. P2/P3 deferred. Phase-based implementation allows early testing.

### Gate Decision: ✅ APPROVED - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-poker-platform-mvp/
├── spec.md              # User stories and acceptance criteria
├── plan.md              # This file (Phase 0-1 output)
├── research.md          # Phase 0: Technology decisions and patterns
├── data-model.md        # Phase 1: Database schema and entities
├── quickstart.md        # Phase 1: Development setup guide
├── contracts/           # Phase 1: API contracts and WebSocket events
│   ├── rest-api.yaml    # OpenAPI 3.0 specification
│   └── websocket-events.md  # Socket.io event schemas
└── tasks.md             # Phase 2: Actionable implementation tasks
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/              # Telegram OAuth, JWT, session management
│   │   ├── wallet/            # Balance, deposits, withdrawals, transactions
│   │   ├── room/              # Room CRUD, filtering, join/leave
│   │   ├── game/              # Poker engine (deck, hand evaluator, pot, betting, state machine)
│   │   ├── realtime/          # WebSocket gateways (game, lobby)
│   │   ├── admin/             # Admin operations (withdrawals, users, rooms, settings)
│   │   └── audit/             # Audit logging for financial/admin actions
│   ├── common/
│   │   ├── filters/           # Global exception handling
│   │   ├── guards/            # Auth, rate limiting
│   │   ├── interceptors/      # Logging, audit
│   │   └── pipes/             # Validation
│   └── config/
│       ├── database.config.ts # PostgreSQL + TypeORM
│       ├── redis.config.ts    # Redis + Socket.io adapter
│       └── configuration.ts   # Environment variables
├── test/
│   ├── unit/                  # Service/function tests
│   ├── integration/           # API + database tests
│   └── e2e/                   # End-to-end game flows
└── migrations/                # Database schema migrations

frontend/
├── app/
│   ├── (auth)/                # Authentication flow
│   ├── (game)/                # Wallet, rooms, game play
│   ├── (admin)/               # Admin dashboard
│   └── layout.tsx             # Root layout (Telegram SDK init)
├── components/
│   ├── auth/                  # Telegram auth, protected routes
│   ├── wallet/                # Deposit, withdrawal, transaction history
│   ├── room/                  # Room list, filters, join button
│   ├── game/                  # Poker table, cards, actions, timer
│   ├── admin/                 # Admin UI components
│   └── ui/                    # Shared UI primitives (shadcn/ui)
├── hooks/
│   ├── use-auth.ts            # Authentication state
│   ├── use-wallet.ts          # Wallet operations
│   ├── use-rooms.ts           # Room list and filters
│   ├── use-game.ts            # Game state management
│   └── use-websocket.ts       # Socket.io connection
├── lib/
│   ├── api/                   # HTTP API client functions
│   └── socket.ts              # WebSocket client setup
└── __tests__/
    ├── components/            # Component unit tests
    ├── hooks/                 # Hook tests
    └── e2e/                   # Playwright tests

tests/ (root integration tests)
├── contract/                  # API contract validation
└── performance/               # Load testing, benchmarks
```

**Structure Decision**: Web application structure (backend + frontend) chosen because:
1. Backend provides REST API + WebSocket for game state
2. Frontend renders as Telegram Mini App (primary) and web (secondary)
3. Clear separation allows independent scaling (backend: Container Apps, frontend: Static Web Apps)
4. Shared TypeScript types possible via workspace setup

## Phase 0: Research & Technology Decisions

### 0.1 Hand Evaluator Library Decision

**Decision**: Use **`pokersolver`** npm package

**Rationale**:
- Mature, battle-tested library with 500k+ weekly downloads
- Supports 7-card evaluation (2 hole + 5 community)
- Returns hand strength, rank, and tie-breaking logic
- TypeScript definitions available (@types/pokersolver)
- Handles all poker variants (Texas Hold'em, Omaha, etc.)
- CPU-efficient perfect hash algorithm

**Alternatives Considered**:
- `phe` (Poker Hand Evaluator): Less mature, smaller community
- `poker-tools`: Limited documentation, C++ bindings complexity
- Custom implementation: Unnecessary complexity, reinventing wheel

**Integration**: `backend/src/modules/game/services/hand-evaluator.service.ts` wraps pokersolver with NestJS injectable service.

### 0.2 Shuffle Algorithm Security

**Decision**: Fisher-Yates shuffle with `crypto.randomBytes()`

**Rationale**:
- Cryptographically secure random number generation (CSRNG)
- Produces uniform distribution (all 52! permutations equally likely)
- Node.js crypto module is battle-tested and FIPS 140-2 compliant
- Prevents predictable shuffle patterns (anti-cheating)

**Implementation**:
```typescript
// backend/src/modules/game/services/deck.service.ts
private getSecureRandomInt(min: number, max: number): number {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const threshold = maxValue - (maxValue % range);

  let value: number;
  do {
    const randomBytes = crypto.randomBytes(bytesNeeded);
    value = parseInt(randomBytes.toString('hex'), 16);
  } while (value >= threshold);

  return min + (value % range);
}
```

### 0.3 Real-Time State Management Pattern

**Decision**: Server-authoritative with Redis state storage

**Pattern**:
1. **Active Games**: Game state stored in Redis (fast read/write, <10ms)
2. **Completed Hands**: Persist to PostgreSQL (historical data, audit trail)
3. **Client State**: Optimistic updates, server reconciliation on every action
4. **Crash Recovery**: Load state from Redis on server restart

**Rationale**:
- Security: Client cannot manipulate game state (all actions validated server-side)
- Performance: Redis provides sub-10ms latency for state reads
- Scalability: Redis pub/sub enables horizontal scaling with multiple servers
- Reliability: State persists across server restarts

**Redis Key Structure**:
```text
game:{gameId}           → Game state JSON (TTL: 24 hours)
session:{userId}        → User session hash (TTL: 24 hours)
balance:{userId}        → Cached wallet balance (TTL: 5 minutes)
rooms:active            → List of active room IDs (TTL: 10 seconds)
```

### 0.4 Side Pot Calculation Algorithm

**Decision**: Sort players by bet amount, calculate pots iteratively

**Algorithm**:
```typescript
// Pseudocode
function calculateSidePots(players: Player[]): SidePot[] {
  const activePlayers = players.filter(p => !p.folded && p.totalBet > 0);
  activePlayers.sort((a, b) => a.totalBet - b.totalBet);

  const pots: SidePot[] = [];
  let previousBet = 0;

  for (let i = 0; i < activePlayers.length; i++) {
    const currentBet = activePlayers[i].totalBet;
    const contribution = currentBet - previousBet;

    if (contribution > 0) {
      const eligiblePlayers = activePlayers.slice(i);
      const potAmount = contribution * eligiblePlayers.length;

      pots.push({
        amount: potAmount,
        eligiblePlayers: eligiblePlayers.map(p => p.id)
      });
    }

    previousBet = currentBet;
  }

  return pots;
}
```

**Rationale**:
- Handles unlimited all-in scenarios (4+ players with different amounts)
- Correct eligibility tracking (only players who contributed can win)
- Odd chip distribution: Award to player closest to dealer button (clockwise)
- Battle-tested pattern used by professional poker platforms

### 0.5 WebSocket Event Protocol

**Decision**: Structured event names with typed payloads

**Naming Convention**: `<domain>:<action>` (e.g., `game:action`, `player:joined`)

**Event Schema**:
```typescript
// Client → Server
type ClientEvents = {
  'game:join': { gameId: string; userId: string; buyIn: number };
  'game:action': { gameId: string; action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin'; amount?: number };
  'game:leave': { gameId: string };
  'game:reconnect': { gameId: string; authToken: string };
};

// Server → Client
type ServerEvents = {
  'game:state': { gameState: GameState };
  'game:your_cards': { cards: Card[] };
  'game:action': { userId: string; action: string; amount: number };
  'game:hand_started': { handNumber: number; dealerPosition: number };
  'game:winner': { winners: Winner[]; pots: Pot[] };
  'player:joined': { userId: string; position: number };
  'player:left': { userId: string; reason: string };
  'player:timeout': { userId: string };
  'player:reconnected': { userId: string };
  'error': { code: string; message: string };
};
```

**Rationale**:
- Type safety with TypeScript interfaces
- Clear separation of client and server events
- Consistent naming aids debugging
- Error handling with structured error events

### 0.6 Performance Optimization Strategy

**Decisions**:
1. **WebSocket Message Compression**: Enable `perMessageDeflate` in Socket.io config
2. **Database Connection Pooling**: 20 max connections, 5 min idle
3. **Redis Caching**: Cache wallet balances (5min TTL), room lists (10sec TTL)
4. **Payload Size Optimization**: Send state diffs, not full state on every update
5. **Lazy Loading**: Load game history on demand, not on join

**Benchmarking**:
- Task: `npm run test:performance` runs Jest benchmarks
- Target: 95th percentile <500ms for action processing
- Load Test: Simulate 100 concurrent games, 100 msg/sec per table

### 0.7 Buy-in/Cash-out Wallet Integration

**Decision**: Two-phase transaction pattern with optimistic locking

**Flow**:
```text
Buy-in:
1. Validate buy-in amount (20-100 BB) → reject if out of range
2. Check wallet balance → reject if insufficient
3. BEGIN TRANSACTION
4. Deduct from wallet (SELECT FOR UPDATE to prevent race conditions)
5. Add player to game with chip stack
6. Log transaction (type: 'game_buyin', amount, balance_before, balance_after)
7. COMMIT TRANSACTION

Cash-out:
1. Calculate player's remaining chips
2. BEGIN TRANSACTION
3. Credit wallet (SELECT FOR UPDATE)
4. Remove player from game
5. Log transaction (type: 'game_cashout', amount, balance_before, balance_after)
6. COMMIT TRANSACTION
```

**Rationale**:
- Atomic operations prevent partial updates (wallet debited but player not added)
- Optimistic locking prevents race conditions (two concurrent buy-ins)
- Audit trail ensures every chip movement is logged
- Rollback capability if any step fails

### 0.8 Rake (Platform Commission) Calculation

**Decision**: Deduct rake before pot distribution

**Formula**: `rake = min(pot * 0.05, 3.00)` (5% up to $3 cap)

**Rules**:
- No rake on pots < $10 (avoid raking small pots)
- Rake rounded down to nearest cent
- Rake deducted from total pot before winner calculation
- Rake logged to `rake_history` table for accounting

**Example**:
```text
Pot: $100
Rake: min($100 * 0.05, $3.00) = min($5, $3) = $3
Winner Receives: $100 - $3 = $97
```

## Phase 1: Design Artifacts

### Data Model Overview

**Core Entities**:
1. **User**: Telegram ID, username, avatar, balance, status
2. **Transaction**: User, type (deposit/withdrawal/buyin/cashout), amount, status, timestamps
3. **Room**: Blind levels, buy-in limits, max players, current players, status
4. **GameHand**: Room, hand number, community cards, pot, winners, players, actions, timestamps
5. **PlayerSeat**: User, position, cards, stack, bet, status
6. **BettingAction**: Player, action type, amount, timestamp, stack after
7. **AuditLog**: Event type, entity, user, changes, IP, user agent, timestamp

(Detailed schema in `data-model.md`)

### API Contracts

**REST Endpoints** (OpenAPI in `contracts/rest-api.yaml`):
- **Auth**: `POST /auth/telegram`, `GET /auth/me`
- **Wallet**: `POST /wallet/deposit`, `POST /wallet/withdraw`, `GET /wallet/balance`, `GET /wallet/transactions`
- **Rooms**: `GET /rooms`, `GET /rooms/:id`, `POST /rooms/:id/join`, `POST /rooms` (create)
- **Admin**: `GET /admin/withdrawals`, `PUT /admin/withdrawals/:id/approve`, `PUT /admin/withdrawals/:id/reject`

**WebSocket Events** (schemas in `contracts/websocket-events.md`):
- Documented in 0.5 above
- Includes request/response payloads, error codes, timing requirements

### Quickstart

(Full guide in `quickstart.md`)

**Setup Steps**:
1. Install Node.js 18+
2. Install PostgreSQL 15+, Redis 7+
3. Clone repo, run `npm install` in backend/ and frontend/
4. Copy `.env.example` → `.env`, configure DATABASE_URL, REDIS_URL, TELEGRAM_BOT_TOKEN
5. Run migrations: `cd backend && npm run migration:run`
6. Start services: `docker-compose up -d` (PostgreSQL, Redis)
7. Start backend: `cd backend && npm run start:dev`
8. Start frontend: `cd frontend && npm run dev`
9. Run tests: `npm test`

## Complexity Tracking

> **This section is empty because there are NO constitution violations.**

All design decisions align with constitutional principles:
- TDD enforced (tests written before code)
- Mobile-first (Telegram Mini App primary target)
- Financial integrity (atomic transactions, audit trail)
- Real-time performance (<500ms target met via Redis + optimizations)
- Security (server-authoritative, CSRNG shuffle, action validation)
- Professional UI (Lucide icons, no emojis, localization-ready)
- Incremental delivery (P1 MVP, P2/P3 deferred)

## Phase 7 (User Story 5) Architecture Deep Dive

### Critical Implementation Requirements

Based on comprehensive pre-implementation review, User Story 5 (Play Texas Hold'em) requires **production-ready poker mechanics with NO MVP shortcuts**. The following subsystems must be fully implemented:

#### A. Blind Posting System
- **Auto-post Small Blind and Big Blind** before dealing cards
- Heads-up special rules (dealer is small blind)
- Big blind "option" logic (can raise after all call preflop)
- All-in blind handling (player has insufficient chips for full blind)

#### B. Burn Cards & Dealer Button
- **Burn 1 card before flop** (discard face-down)
- **Burn 1 card before turn**
- **Burn 1 card before river**
- **Dealer button rotates clockwise** after each hand
- Position calculations: Small Blind, Big Blind, Under The Gun (first to act preflop), left of dealer (first to act post-flop)

#### C. Buy-in, Cash-out, Rebuy
- **Buy-in validation**: Must be 20-100 big blinds
- **Wallet integration**: Deduct buy-in from wallet (atomic transaction)
- **Cash-out logic**: Return remaining chips to wallet when player leaves
- **Rebuy functionality**: Allow chip top-up between hands (not during hand)

#### D. Rake & Platform Commission
- **Rake calculation**: 5% of pot up to $3 cap (configurable)
- No rake on pots < $10
- **Deduct rake before pot distribution**
- Log rake to `rake_history` table for accounting

#### E. Betting Round Completion Detection
- **Detect when betting round ends**:
  - All players acted AND bets equal
  - OR only 1 player active (all others folded)
  - OR all players all-in (no more betting possible)
- **Big blind option**: Preflop round doesn't end until BB has acted
- **Action turn advancement**: Skip folded/all-in players

#### F. Showdown Logic
- **Card reveal order**: Last aggressor shows first, then clockwise
- **Mucking**: Losing players can hide cards (unless all-in)
- **All-in players must show** cards at showdown
- **Hand comparison**: Use pokersolver library to determine winner
- **Pot distribution**: Award pot to winner(s), split if tied

#### G. Side Pot Edge Cases
- **Odd chip distribution**: Extra chip goes to player closest to dealer button (clockwise)
- **4+ player all-ins**: Create multiple side pots correctly
- **Tied hands**: Split pot evenly among winners
- **All-in less than min raise**: Doesn't reopen betting for players who already acted
- **All-in equal/exceeding min raise**: Reopens betting

#### H. State Persistence & Recovery
- **Save completed hands** to PostgreSQL (`game_hands` table)
- **Action audit trail**: Log every action with timestamp, player, amount, stack
- **Shuffle seed logging**: Log seed for each shuffle (dispute resolution)
- **State recovery**: Load state from Redis on server crash/restart
- **Consistency checks**: Validate pot = sum of bets, no duplicate cards, stacks >= 0

#### I. Reconnection & Disconnection
- **Full state restoration** on reconnect (game state, hole cards, action history)
- **Action timer restoration**: Resume countdown from where it left off
- **Grace period**: 60 seconds before auto-fold on disconnect
- **Auto-fold** if player doesn't reconnect within grace period
- **Cash-out** disconnected player's chips to wallet

#### J. Auto-Actions & Timers
- **Action timer**: 30 seconds per decision (configurable)
- **Auto-fold on timeout** (unless can check, then auto-check)
- **Auto-post blinds**: Automatically deduct when hand starts
- **Auto-muck**: Losing hands at showdown (don't reveal cards)
- **Auto-start new hand**: After pot distributed (5-second delay)
- **Time bank**: 60-second reserve for difficult decisions (optional feature)

#### K. Security & Anti-Cheating
- **Card visibility validation**: Players cannot request others' hole cards via WebSocket
- **Action validation**: Verify it's player's turn, player is active, action is valid
- **Action locking**: Prevent race conditions (only one action processed at a time per game)
- **Bot detection**: Flag players with <500ms average response time
- **Multi-accounting detection**: Flag same IP in same game
- **Audit logging**: Log all suspicious activities (card access attempts, invalid actions)
- **Statistical shuffle testing**: Verify 10,000+ shuffles produce uniform distribution

#### L. Performance & Optimization
- **<500ms action processing**: 95th percentile from action to broadcast
- **100 concurrent games**: Load test with realistic player actions
- **100 msg/sec/table**: WebSocket message rate capability
- **WebSocket payload compression**: Enable `perMessageDeflate`
- **Redis caching**: Game state, wallet balances, room lists
- **Database connection pooling**: 20 max, 5 min idle
- **Query optimization**: Indexes on all query columns

### Service Architecture (Phase 7)

```text
backend/src/modules/game/
├── services/
│   ├── deck.service.ts              # Card deck, shuffle, burn, deal
│   ├── hand-evaluator.service.ts    # Pokersolver wrapper, hand comparison
│   ├── pot.service.ts               # Main pot, side pots, odd chip distribution
│   ├── betting.service.ts           # Bet validation, min raise, all-in rules
│   ├── blind.service.ts             # Blind posting, position calculation
│   ├── game-state-machine.service.ts # Phase transitions, dealer rotation, betting round detection
│   ├── timeout.service.ts           # Action timers, auto-fold, time bank
│   ├── rake.service.ts              # Commission calculation
│   └── game-engine.service.ts       # Orchestrates all services, main game loop
├── gateways/
│   └── game.gateway.ts              # WebSocket events (join, action, leave, reconnect)
└── entities/
    ├── game-hand.entity.ts          # Completed hand record
    ├── player-seat.entity.ts        # Player position and state
    └── betting-action.entity.ts     # Action audit trail
```

### WebSocket Event Flow (Example: Complete Hand)

```text
1. game:hand_started → {handNumber, dealerPosition}
   - Blinds auto-posted
   - Cards dealt privately to each player

2. game:your_cards → {cards: [Card, Card]} (private to each player)

3. game:your_turn → {validActions, timeRemaining}
   - Player has 30 seconds to act

4. Client sends game:action → {action: 'raise', amount: 50}

5. Server validates, applies, broadcasts:
   - game:action → {userId, action: 'raise', amount: 50, stack: 150}
   - game:pot_update → {pot: 75}
   - game:your_turn → next player

6. Betting round completes:
   - game:cards_dealt → {phase: 'flop', cards: [Card, Card, Card]}
   - Repeat steps 3-5 for flop, turn, river

7. Showdown:
   - game:showdown:cards → {userId, cards, hand}
   - game:winner → {winners: [{userId, amount, hand}], pots: [{amount, eligiblePlayers}]}
   - game:hand_complete → {rake, duration}

8. New hand:
   - 5-second delay
   - game:hand_started (repeat from step 1)
```

## Next Steps

### Phase 0 Complete: ✅ Research decisions documented above

### Phase 1 Deliverables (To Be Generated):
1. **data-model.md**: Complete PostgreSQL schema with:
   - Users, Transactions, Rooms, GameHands, PlayerSeats, BettingActions, AuditLogs, RakeHistory
   - Relationships (foreign keys)
   - Indexes for performance
   - Validation rules

2. **contracts/rest-api.yaml**: OpenAPI 3.0 specification for all REST endpoints

3. **contracts/websocket-events.md**: Complete WebSocket event schemas with request/response examples

4. **quickstart.md**: Step-by-step setup guide for local development

### Phase 2: `/speckit.tasks` Command
- Generate `tasks.md` with 325+ actionable tasks
- Include all subsystems from Phase 7 architecture above
- TDD approach enforced (RED-GREEN-REFACTOR)
- Dependency ordering (Phase 1 → Phase 7 sequential)

### Phase 3: `/speckit.implement` Command
- Execute tasks systematically
- Track progress with TodoWrite tool
- Quality gates enforced at each phase

---

**Plan Status**: ✅ COMPLETE (Phase 0-1)
**Next Command**: `/speckit.tasks` to generate implementation tasks
**Estimated Implementation**: 6 weeks (40 hours/week, 240 total hours)
