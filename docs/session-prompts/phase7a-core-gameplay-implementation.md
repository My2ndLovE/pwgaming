# Session Prompt: Phase 7A - Core Gameplay Implementation

**Session Type**: Implementation (TDD)
**Phase**: Phase 7A - User Story 5 (Play Texas Hold'em Cash Game)
**Duration**: 2-3 weeks
**Branch**: `001-poker-platform-mvp`
**Status**: Ready to Start

---

## Session Objective

Implement **Phase 7A: Core Gameplay** - a playable Texas Hold'em poker game with basic features following TDD methodology.

**Deliverable**: Players can join a game, play complete hands from preflop to showdown, and receive winnings.

**Acceptance Criteria**:
- [ ] 2-player games work end-to-end
- [ ] 6-player games work end-to-end
- [ ] ~60 tests passing
- [ ] No critical bugs
- [ ] Basic buy-in and cash-out functional

---

## Context & Background

### Project Overview
PW Gaming is a Texas Hold'em poker platform built as a Telegram Mini App with web version. This session implements the **core game engine** - the heart of the entire platform.

### Previous Sessions Completed
- ✅ Phase 1: Setup & Infrastructure (Azure)
- ✅ Phase 2: Foundational Services
- ✅ Phase 3: User Story 1 - Authentication
- ✅ Phase 4: User Story 2 - Wallet Management
- ✅ Phase 5: User Story 9 - Admin Withdrawal Management
- ✅ Phase 6: User Story 3 - Browse & Join Game Rooms

### What This Session Builds
Phase 7 is divided into three sub-phases:
- **7A: Core Gameplay (THIS SESSION)** - Basic playable game
- **7B: Production Hardening (NEXT SESSION)** - All poker rules, edge cases, security
- **7C: Polish & Operations (LATER SESSION)** - Testing, docs, admin tools

---

## Tasks to Complete (T128-T176)

**Total**: 49 tasks in Phase 7A
**Location**: See `specs/001-poker-platform-mvp/tasks.md` lines 381-467

### Task Groups:

1. **Core Game Logic Tests (T128-T134)** - 7 tests
   - Deck shuffle, hand evaluation, pot calculation, side pots, betting validation, state transitions, timeout

2. **Core Services Implementation (T135-T141)** - 7 services
   - DeckService, HandEvaluatorService, PotService, BettingService, GameStateMachine, TimeoutService, GameEngine

3. **WebSocket Tests (T142-T145)** - 4 tests
   - WS authentication, game:join, game:action broadcast, reconnection

4. **WebSocket Implementation (T146-T154)** - 9 implementations
   - Redis adapter, WsAuthGuard, GameGateway, event handlers (join, action, leave, reconnect), LobbyGateway

5. **Frontend Core Components (T155-T165)** - 11 components
   - useWebSocket, useGame, Card, PokerTable, PlayerSeat, CommunityCards, PotDisplay, BettingControls, ActionTimer, WinnerAnnouncement, game page

6. **Basic Integration Tests (T166-T172)** - 7 E2E tests
   - 2-player hand, 6-player hand, all-in, timeout, disconnect, latency, tied hands

7. **Performance Baseline (T173-T176)** - 4 optimizations
   - WebSocket compression, Redis caching, connection pooling, performance monitoring

---

## Implementation Strategy

### TDD Workflow (MANDATORY)

**EVERY task must follow RED-GREEN-REFACTOR**:

```bash
# 1. RED - Write failing test
npm run test -- <test-file>.spec.ts
# Verify test FAILS

# 2. GREEN - Write minimum code to pass
npm run test -- <test-file>.spec.ts
# Verify test PASSES

# 3. REFACTOR - Improve code
npm run test:cov
# Verify coverage maintained/improved
```

### Recommended Implementation Order

**Week 1: Backend Core Services**
1. Start with T128-T134 (tests) - All in parallel
2. Then T135-T141 (services) - Sequential per service, services in parallel
3. Run tests continuously, keep them green

**Week 2: Real-time & WebSocket**
1. T142-T145 (WS tests)
2. T146-T154 (WS implementation)
3. Manual testing with multiple browser tabs

**Week 3: Frontend & Integration**
1. T155-T165 (frontend components)
2. T166-T172 (E2E tests)
3. T173-T176 (performance baseline)
4. Full manual testing

---

## Key Technical Requirements

### Technologies Used

**Backend**:
- NestJS 10.x
- Socket.io 4.x (real-time)
- TypeORM (PostgreSQL)
- ioredis (Redis)
- **pokersolver** library (hand evaluation) - See plan.md for decision rationale

**Frontend**:
- Next.js 14.x
- Socket.io-client
- Zustand (state management)
- Tailwind CSS
- Lucide React (icons - NO EMOJIS)

### Critical Architecture Decisions

**From `plan.md` Phase 7 Architecture Deep Dive**:

1. **Hand Evaluator**: Use `pokersolver` npm package
   ```bash
   cd backend && npm install pokersolver @types/pokersolver
   ```

2. **Shuffle Algorithm**: Fisher-Yates with `crypto.randomBytes()`
   - See DeckService implementation in plan.md section 0.2

3. **State Management**: Server-authoritative with Redis storage
   - Active games in Redis (fast read/write)
   - Completed hands in PostgreSQL (audit trail)
   - See plan.md section 0.3

4. **Side Pot Algorithm**: Sort players by bet, calculate iteratively
   - See plan.md section 0.4 for pseudocode

5. **WebSocket Events**: Structured naming `<domain>:<action>`
   - See plan.md section 0.5 for complete event schema

### File Locations

**Backend**:
```
backend/src/modules/game/
├── services/
│   ├── deck.service.ts              # T135
│   ├── hand-evaluator.service.ts    # T136
│   ├── pot.service.ts               # T137
│   ├── betting.service.ts           # T138
│   ├── game-state-machine.service.ts # T139
│   ├── timeout.service.ts           # T140
│   └── game-engine.service.ts       # T141
├── entities/
│   ├── game-hand.entity.ts
│   ├── player-seat.entity.ts
│   └── betting-action.entity.ts
└── gateways/
    └── game.gateway.ts              # T148

backend/src/modules/realtime/
├── adapters/
│   └── redis.adapter.ts             # T146
├── guards/
│   └── ws-auth.guard.ts             # T147
└── gateways/
    └── lobby.gateway.ts             # T153
```

**Frontend**:
```
frontend/
├── hooks/
│   ├── use-websocket.ts             # T155
│   └── use-game.ts                  # T156
├── components/game/
│   ├── card.tsx                     # T157
│   ├── poker-table.tsx              # T158
│   ├── player-seat.tsx              # T159
│   ├── community-cards.tsx          # T160
│   ├── pot-display.tsx              # T161
│   ├── betting-controls.tsx         # T162
│   ├── action-timer.tsx             # T163
│   └── winner-announcement.tsx      # T164
└── app/(game)/game/[id]/page.tsx    # T165
```

---

## Development Environment

### Ports
- Frontend: http://localhost:4120
- Backend: http://localhost:4110
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- pgAdmin: http://localhost:4130

### Quick Start
```bash
# Start all services
scripts\start-all.bat

# Or manual startup
scripts\start-dev.bat           # Docker services
cd backend && npm run start:dev  # Terminal 1
cd frontend && npm run dev       # Terminal 2
```

### Verify Services
```bash
# Backend health
curl http://localhost:4110/health

# Frontend
# Open browser: http://localhost:4120
```

---

## Constitutional Compliance

**From `.specify/memory/constitution.md`**:

### I. Test-Driven Development (NON-NEGOTIABLE) ✅
- Write failing test FIRST
- No production code without failing test
- RED → GREEN → REFACTOR cycle

### II. Mobile-First Design ✅
- Portrait-optimized layouts
- Touch-friendly controls (44x44px minimum)
- Bottom navigation for actions
- Mobile gestures (swipe, double-tap)

### III. Financial Integrity ✅
- Atomic transactions for buy-in/cash-out
- Server-side validation (never trust client)
- Audit trail for all chip movements

### IV. Real-Time Performance ✅
- Action processing: <500ms (p95)
- WebSocket: 100 msg/sec per table
- No blocking operations during gameplay

### V. Security & Anti-Cheating ✅
- Server-authoritative game state
- Card visibility validation
- Action validation on every move
- Cryptographic shuffle (crypto.randomBytes)

### VI. Professional UI/UX Standards ✅
- Lucide React for icons (NO EMOJIS)
- No hardcoded strings (localization-ready)
- 60fps animations
- ARIA accessibility labels

### VII. Incremental Delivery & MVP Focus ✅
- Phase 7A delivers standalone playable game
- Can be tested independently
- Simplest solution that works (YAGNI)

---

## Phase 7A Scope (What to Include)

### ✅ DO Implement:
- Basic card dealing (2 hole cards, 5 community cards)
- Betting actions (fold, check, call, bet, raise, all-in)
- Pot calculation (main pot, basic side pots)
- Hand evaluation (using pokersolver)
- Game state transitions (preflop → flop → turn → river → showdown)
- Winner determination and pot distribution
- Basic buy-in validation
- Simple cash-out when leaving
- WebSocket real-time updates
- Basic reconnection (restore state)
- Core UI components (table, cards, actions)

### ❌ DO NOT Implement Yet (Defer to 7B):
- Blind posting system (T177 - Phase 7B)
- Burn cards (T178 - Phase 7B)
- Dealer button rotation (T178 - Phase 7B)
- Advanced buy-in validation (20-100 BB range) (T179 - Phase 7B)
- Rebuy functionality (T179 - Phase 7B)
- Rake calculation (T180 - Phase 7B)
- Big blind option (T177 - Phase 7B)
- Heads-up special rules (T178 - Phase 7B)
- Complex side pot edge cases (T183 - Phase 7B)
- State persistence to database (T184 - Phase 7B)
- Advanced security (bot detection, multi-accounting) (T186 - Phase 7B)

### ⚠️ Simplified for 7A (Full version in 7B):
- **Blinds**: Hardcode small blind and big blind amounts (no auto-posting yet)
- **Dealer button**: Start at position 0, don't rotate between hands
- **Side pots**: Basic implementation (works for most cases, edge cases in 7B)
- **Buy-in**: Simple validation (has enough balance), detailed range check in 7B
- **Reconnection**: Basic state restoration, advanced features in 7B

---

## Testing Strategy

### Test Coverage Goals
- Unit tests: 70%+ coverage
- Integration tests: All critical paths
- E2E tests: 2-player and 6-player complete hands

### Test Files to Create

**Backend Unit Tests**:
```
backend/test/unit/game/
├── deck.service.spec.ts             # T128
├── hand-evaluator.service.spec.ts   # T129
├── pot.service.spec.ts              # T130
├── side-pot.service.spec.ts         # T131
├── betting.service.spec.ts          # T132
├── game-state-machine.spec.ts       # T133
└── timeout.service.spec.ts          # T134

backend/test/unit/realtime/
└── ws-auth.guard.spec.ts            # T142

backend/test/unit/realtime/
└── game.gateway.spec.ts             # T143
```

**Backend Integration Tests**:
```
backend/test/integration/realtime/
├── game-actions.e2e-spec.ts         # T144
└── reconnection.e2e-spec.ts         # T145
```

**Frontend Component Tests**:
```
frontend/__tests__/components/game/
├── card.test.tsx                    # T157
├── poker-table.test.tsx             # T158
├── player-seat.test.tsx             # T159
├── community-cards.test.tsx         # T160
├── pot-display.test.tsx             # T161
├── betting-controls.test.tsx        # T162
├── action-timer.test.tsx            # T163
└── winner-announcement.test.tsx     # T164

frontend/__tests__/hooks/
├── use-websocket.test.ts            # T155
└── use-game.test.ts                 # T156
```

**E2E Tests**:
```
frontend/__tests__/e2e/
├── 2-player-hand.e2e.ts             # T166
├── 6-player-hand.e2e.ts             # T167
├── all-in-scenario.e2e.ts           # T168
├── player-timeout.e2e.ts            # T169
├── player-reconnect.e2e.ts          # T170
├── action-latency.e2e.ts            # T171
└── tied-hands.e2e.ts                # T172
```

### Running Tests
```bash
# Backend unit tests
cd backend
npm test

# Frontend component tests
cd frontend
npm test

# E2E tests
cd frontend
npm run test:e2e

# Coverage report
npm run test:cov
```

---

## Common Pitfalls & How to Avoid

### 1. **Breaking TDD** ❌
**Pitfall**: Writing production code before tests
**Solution**: Always write test first, see it fail (RED), then implement

### 2. **Client-Side Game Logic** ❌
**Pitfall**: Implementing poker logic in frontend
**Solution**: ALL game logic on server, frontend only displays state

### 3. **Hardcoded Strings** ❌
**Pitfall**: Button text like "Fold", "Call", "Raise" hardcoded
**Solution**: Use localization from day one (even if English only now)

### 4. **Using Emojis** ❌
**Pitfall**: Card suits as emojis (♠️♥️♦️♣️)
**Solution**: Use Lucide React icons or Unicode text (♠♥♦♣)

### 5. **Insecure Card Handling** ❌
**Pitfall**: Sending all players' cards to all clients
**Solution**: Send only player's own cards privately, others hidden

### 6. **Race Conditions** ❌
**Pitfall**: Two players acting simultaneously causes state corruption
**Solution**: Implement action locking (one action at a time per game)

### 7. **Not Validating Actions** ❌
**Pitfall**: Accepting any action from client
**Solution**: Validate every action server-side (is it player's turn? valid action? valid amount?)

### 8. **Memory Leaks** ❌
**Pitfall**: Not cleaning up WebSocket listeners
**Solution**: Always clean up on component unmount (useEffect cleanup)

### 9. **Large Payloads** ❌
**Pitfall**: Sending entire game state on every action
**Solution**: Send only changed data, compress with perMessageDeflate

### 10. **No Error Handling** ❌
**Pitfall**: Crashes on invalid input
**Solution**: Try-catch all async operations, return error messages to client

---

## Debugging Tips

### Backend Debugging
```bash
# Enable debug logging
DEBUG=nestjs:* npm run start:dev

# Watch logs in real-time
npm run start:dev | grep "GameGateway"

# Inspect Redis state
redis-cli
> KEYS game:*
> GET game:some-game-id
```

### Frontend Debugging
```javascript
// Add to useWebSocket hook
useEffect(() => {
  console.log('WebSocket state:', socket.connected);
  socket.onAny((event, ...args) => {
    console.log(`WS Event: ${event}`, args);
  });
}, [socket]);
```

### Common Issues

**Issue**: WebSocket not connecting
**Fix**: Check CORS settings in GameGateway, verify Redis is running

**Issue**: Tests failing with "Cannot find module 'pokersolver'"
**Fix**: Run `npm install pokersolver @types/pokersolver` in backend

**Issue**: Game state not updating in UI
**Fix**: Check if WebSocket events are being received (use browser DevTools Network tab)

**Issue**: Players see each other's cards
**Fix**: Review GameGateway.sanitizeGameState() - must remove hole cards for other players

---

## Progress Tracking

### Daily Standup Template
```markdown
## Daily Progress: [Date]

### Completed Yesterday:
- [ ] Task TX: Description
- [ ] Task TY: Description

### Working Today:
- [ ] Task TZ: Description

### Blockers:
- None / [Describe blocker]

### Tests Status:
- Passing: XX/60
- Coverage: XX%
```

### Use TodoWrite Tool
```typescript
// Update todo list regularly
TodoWrite({
  todos: [
    { content: "T128: Deck shuffle test", status: "completed", activeForm: "Completed deck shuffle test" },
    { content: "T129: Hand evaluator test", status: "in_progress", activeForm: "Writing hand evaluator test" },
    { content: "T130: Pot calculation test", status: "pending", activeForm: "Pending pot calculation test" }
  ]
});
```

### Weekly Milestones

**End of Week 1**:
- [ ] All T128-T141 complete (core services)
- [ ] ~20 tests passing
- [ ] DeckService, HandEvaluatorService, PotService working

**End of Week 2**:
- [ ] All T142-T154 complete (WebSocket)
- [ ] ~35 tests passing
- [ ] Can join game, send actions, see updates in real-time

**End of Week 3**:
- [ ] All T155-T176 complete (frontend + integration)
- [ ] ~60 tests passing
- [ ] Can play complete 2-player and 6-player hands
- [ ] Phase 7A COMPLETE ✅

---

## Reference Documentation

### Must Read Before Starting
1. **`specs/001-poker-platform-mvp/plan.md`** - Phase 7 Architecture Deep Dive (lines 431-577)
2. **`specs/001-poker-platform-mvp/tasks.md`** - Phase 7A tasks (lines 381-467)
3. **`specs/001-poker-platform-mvp/spec.md`** - User Story 5 acceptance criteria (lines 80-98)
4. **`docs/technical/texas-holdem-technical-reference.md`** - Poker rules reference

### Quick Reference
- **Constitution**: `.specify/memory/constitution.md`
- **Data Model**: `specs/001-poker-platform-mvp/data-model.md`
- **API Contracts**: `specs/001-poker-platform-mvp/contracts/`
- **WebSocket Events**: `specs/001-poker-platform-mvp/plan.md` (lines 276-305)

---

## Session Commands

### Start Implementation
```bash
# Option 1: Use SpecKit
/speckit.implement

# Option 2: Manual start
# Begin with T128 (first test)
```

### Useful Commands During Session
```bash
# Run specific test
npm test -- deck.service.spec.ts

# Run all tests with coverage
npm run test:cov

# Build backend
npm run build

# Build frontend
npm run build

# Check types
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

---

## Success Criteria

### Phase 7A is COMPLETE when:

**Functional**:
- [X] Players can join a game with buy-in
- [X] Cards are dealt (2 hole + 5 community)
- [X] Players can take all actions (fold, check, call, raise, bet, all-in)
- [X] Pot updates correctly
- [X] Game progresses through all phases (preflop → flop → turn → river → showdown)
- [X] Winner determined correctly
- [X] Pot distributed to winner
- [X] Players can cash out when leaving
- [X] Real-time updates work (<500ms latency)
- [X] Basic reconnection works

**Technical**:
- [X] 60+ tests passing
- [X] TypeScript: no errors in strict mode
- [X] Build: successful for backend and frontend
- [X] Coverage: 70%+ for game services
- [X] No critical bugs

**Quality**:
- [X] TDD followed for all implementations
- [X] Code reviewed (self-review minimum)
- [X] No hardcoded strings
- [X] No emojis in UI
- [X] Mobile-responsive (portrait mode)
- [X] All constitutional principles followed

---

## Next Session: Phase 7B

After completing Phase 7A, the next session will implement **Phase 7B: Production Hardening**:
- All 15 critical poker mechanics (blinds, burn cards, dealer rotation, etc.)
- Edge case handling (side pots, all-in rules, tied hands)
- Security & anti-cheating
- Performance optimization
- 120+ tests total

**Session Prompt**: `phase7b-production-hardening.md` (to be created)

---

## Questions & Support

### If You Get Stuck
1. **Read the plan.md** - Architecture decisions documented there
2. **Check tasks.md** - Detailed task descriptions with acceptance criteria
3. **Review constitution.md** - Ensure compliance with principles
4. **Search existing code** - Phases 1-6 have patterns to follow

### If You Find Errors in Existing Code
**CRITICAL**: Per CLAUDE.md constitution:
> When working on current changes, if I encounter ANY errors caused by other/previous work (not related to my current changes), I must ASK the user first before taking any action

**DO NOT FIX** errors from Phases 1-6 without asking. Focus only on Phase 7A implementation.

---

## Final Checklist Before Starting

- [ ] Read this entire session prompt
- [ ] Review `plan.md` Phase 7 Architecture Deep Dive
- [ ] Review `tasks.md` Phase 7A tasks (T128-T176)
- [ ] Understand TDD workflow (RED-GREEN-REFACTOR)
- [ ] Services running (backend, frontend, PostgreSQL, Redis)
- [ ] Can access frontend (http://localhost:4120)
- [ ] Can access backend (http://localhost:4110/health)
- [ ] Git branch is `001-poker-platform-mvp`
- [ ] Ready to write first failing test (T128)

---

**Status**: ✅ READY TO BEGIN PHASE 7A

**Start with**: T128 - Write failing test for deck shuffle

**Remember**: Test FIRST, code SECOND. RED → GREEN → REFACTOR. Always.

**Good luck building the poker game!** 🃏♠♥♦♣
