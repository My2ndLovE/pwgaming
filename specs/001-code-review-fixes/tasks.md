# Tasks: Code Review Critical Fixes and Improvements

**Input**: Design documents from `/specs/001-code-review-fixes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks included per TDD requirement from constitution

**Organization**: Tasks grouped by user story (8 stories) to enable independent implementation and testing. Priority order: P0 (Critical) → P1 (High) → P2 (Medium)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US8)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Backend: NestJS with TypeScript
- Frontend: Next.js 16 with React 19

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency updates

- [ ] T001 Install async-mutex dependency in backend: `cd backend && npm install async-mutex`
- [ ] T002 [P] Verify PostgreSQL 15+ and Redis 7+ are running: `docker-compose ps`
- [ ] T003 [P] Update .env.example with FRONTEND_URL requirement and documentation
- [ ] T004 [P] Create backend/src/config/cors.config.ts for CORS validation utilities
- [ ] T005 [P] Create backend/src/common/dto/pagination.dto.ts for pagination DTOs
- [ ] T006 [P] Create backend/src/common/guards/websocket-rate-limit.guard.ts stub
- [ ] T007 [P] Create frontend/src/components/error/ directory structure
- [ ] T008 [P] Create frontend/src/hooks/ directory for custom hooks
- [ ] T009 [P] Create database/migrations/ directory if not exists

**Checkpoint**: Project structure prepared, all dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Configure Sentry for error tracking (backend and frontend integration)
- [ ] T011 [P] Setup Redis connection for rate limiting in backend config
- [ ] T012 [P] Verify TypeORM migrations framework is configured
- [ ] T013 [P] Create test infrastructure for integration tests in backend/tests/integration/
- [ ] T014 [P] Create test infrastructure for load tests in backend/tests/load/
- [ ] T015 [P] Setup Jest + React Testing Library for frontend component tests

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Secure Cross-Origin Access (Priority: P0 - Critical) 🎯

**Goal**: Prevent authentication bypass by enforcing CORS validation with FRONTEND_URL requirement

**Independent Test**: Start backend in production mode without FRONTEND_URL - should fail with clear error. Make API request from unauthorized origin - should reject with CORS error.

### Tests for User Story 1 (TDD Required)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T016 [P] [US1] Write CORS security test in backend/tests/integration/cors-security.spec.ts - test rejection of unauthorized origins
- [ ] T017 [P] [US1] Write CORS startup validation test in backend/tests/integration/cors-security.spec.ts - test production startup failure without FRONTEND_URL
- [ ] T018 [P] [US1] Write WebSocket origin validation test in backend/tests/integration/cors-security.spec.ts - test WS connection rejection

### Implementation for User Story 1

- [ ] T019 [US1] Implement validateCorsConfig function in backend/src/config/cors.config.ts - validate FRONTEND_URL in production
- [ ] T020 [US1] Implement getCorsOptions function in backend/src/config/cors.config.ts - return environment-specific CORS config
- [ ] T021 [US1] Update bootstrap function in backend/src/main.ts - add validateCorsConfig call before app.enableCors
- [ ] T022 [US1] Apply CORS configuration in backend/src/main.ts - call app.enableCors(getCorsOptions(configService))
- [ ] T023 [US1] Update WebSocket gateway CORS in backend/src/modules/game/gateways/game.gateway.ts - add origin validation callback
- [ ] T024 [US1] Run tests and verify all pass: `npm run test:integration -- cors-security.spec.ts`

**Checkpoint**: CORS security hardened, production deployment blocks without proper configuration

---

## Phase 4: User Story 2 - Accurate Player Chip Balances (Priority: P0 - Critical) 🎯

**Goal**: Eliminate race conditions in chip stack updates using atomic mutex locks

**Independent Test**: Run concurrency test with 100 simultaneous chip updates - verify all final balances are correct with zero discrepancies

### Tests for User Story 2 (TDD Required)

- [ ] T025 [P] [US2] Write chip stack concurrency test in backend/tests/integration/chip-stack-concurrency.spec.ts - test 100 concurrent updates maintain correct totals
- [ ] T026 [P] [US2] Write atomic update test in backend/tests/integration/chip-stack-concurrency.spec.ts - test partial update rollback on error
- [ ] T027 [P] [US2] Write lock timeout test in backend/tests/integration/chip-stack-concurrency.spec.ts - test deadlock detection

### Implementation for User Story 2

- [ ] T028 [US2] Import Mutex from async-mutex in backend/src/modules/game/gateways/game.gateway.ts
- [ ] T029 [US2] Add chipUpdateLocks Map property in backend/src/modules/game/gateways/game.gateway.ts - Map<string, Mutex>
- [ ] T030 [US2] Refactor updateChipStacks method in backend/src/modules/game/gateways/game.gateway.ts - wrap in mutex.runExclusive
- [ ] T031 [US2] Add chip stack validation in backend/src/modules/game/gateways/game.gateway.ts - check for negative balances
- [ ] T032 [US2] Add audit logging for chip updates in backend/src/modules/game/gateways/game.gateway.ts - log before/after values
- [ ] T033 [US2] Implement onModuleDestroy in backend/src/modules/game/gateways/game.gateway.ts - clear chipUpdateLocks Map
- [ ] T034 [US2] Run tests and verify all pass: `npm run test:integration -- chip-stack-concurrency.spec.ts`

**Checkpoint**: Chip stack updates are atomic, race conditions eliminated, financial integrity guaranteed

---

## Phase 5: User Story 3 - Verified Cash-Out Amounts (Priority: P0 - Critical) 🎯

**Goal**: Prevent fraudulent cash-outs by verifying chip amounts against authoritative game state

**Independent Test**: Attempt cash-out with mismatched chip stack values - verify system uses game state value and triggers admin alert

### Tests for User Story 3 (TDD Required)

- [ ] T035 [P] [US3] Write cash-out verification test in backend/tests/integration/cash-out-verification.spec.ts - test normal cash-out flow
- [ ] T036 [P] [US3] Write mismatch detection test in backend/tests/integration/cash-out-verification.spec.ts - test admin alert on discrepancy
- [ ] T037 [P] [US3] Write timeout fallback test in backend/tests/integration/cash-out-verification.spec.ts - test graceful degradation on Redis failure

### Implementation for User Story 3

- [ ] T038 [US3] Add verifyChipStack method in backend/src/modules/wallet/services/game-wallet.service.ts - query game state from Redis with 3s timeout
- [ ] T039 [US3] Implement mismatch detection logic in backend/src/modules/wallet/services/game-wallet.service.ts - compare requested vs authoritative amounts
- [ ] T040 [US3] Implement sendAdminAlert method in backend/src/modules/wallet/services/game-wallet.service.ts - send to Sentry with full context
- [ ] T041 [US3] Update processCashOut method in backend/src/modules/wallet/services/game-wallet.service.ts - call verifyChipStack before creating transaction
- [ ] T042 [US3] Add timeout helper method in backend/src/modules/wallet/services/game-wallet.service.ts - Promise.race wrapper
- [ ] T043 [US3] Add fallback logic for verification failures in backend/src/modules/wallet/services/game-wallet.service.ts - flag for manual review
- [ ] T044 [US3] Run tests and verify all pass: `npm run test:integration -- cash-out-verification.spec.ts`

**Checkpoint**: Cash-out verification prevents fraud, admin alerts functional, graceful degradation works

---

## Phase 6: User Story 4 - Efficient Transaction History Browsing (Priority: P1 - High)

**Goal**: Enable fast transaction history loading with pagination for users with thousands of transactions

**Independent Test**: Create user with 10,000 transactions, verify history loads in <1 second showing first 20 results with pagination metadata

### Tests for User Story 4 (TDD Required)

- [ ] T045 [P] [US4] Write pagination DTO validation test in backend/tests/unit/pagination.dto.spec.ts - test valid and invalid parameters
- [ ] T046 [P] [US4] Write transaction pagination test in backend/tests/integration/transaction-pagination.spec.ts - test with 10K records
- [ ] T047 [P] [US4] Write pagination metadata test in backend/tests/integration/transaction-pagination.spec.ts - test hasNextPage/hasPrevPage

### Implementation for User Story 4

- [ ] T048 [US4] Implement PaginationDto class in backend/src/common/dto/pagination.dto.ts - add validation decorators
- [ ] T049 [US4] Implement PaginatedResponse interface in backend/src/common/dto/pagination.dto.ts - define response structure
- [ ] T050 [US4] Implement createPaginatedResponse helper in backend/src/common/dto/pagination.dto.ts - calculate pagination metadata
- [ ] T051 [US4] Update getTransactions endpoint in backend/src/modules/wallet/controllers/wallet.controller.ts - add PaginationDto parameter
- [ ] T052 [US4] Implement pagination logic in backend/src/modules/wallet/controllers/wallet.controller.ts - use skip/take with TypeORM
- [ ] T053 [US4] Update frontend API client in frontend/src/lib/api-client.ts - add pagination parameters to transaction requests
- [ ] T054 [US4] Create usePagination hook in frontend/src/hooks/use-pagination.ts - manage page state and navigation
- [ ] T055 [US4] Update transaction history UI in frontend - add pagination controls
- [ ] T056 [US4] Run tests and verify all pass: `npm run test:integration -- transaction-pagination.spec.ts`

**Checkpoint**: Transaction history paginated, loads fast with 10K+ records, smooth navigation

---

## Phase 7: User Story 5 - Fast Transaction Queries (Priority: P1 - High)

**Goal**: Optimize transaction queries with composite database indexes for <200ms response times

**Independent Test**: Run transaction queries with various filters on 100K+ records, verify all complete in <200ms using indexes

### Tests for User Story 5 (TDD Required)

- [ ] T057 [P] [US5] Write migration test in backend/tests/integration/transaction-indexes.spec.ts - test index creation succeeds
- [ ] T058 [P] [US5] Write query performance test in backend/tests/integration/transaction-indexes.spec.ts - test EXPLAIN ANALYZE shows Index Scan
- [ ] T059 [P] [US5] Write filtered query test in backend/tests/integration/transaction-indexes.spec.ts - test userId + type + date filtering

### Implementation for User Story 5

- [ ] T060 [US5] Create migration file: `npm run migration:create -- AddTransactionIndexes` in backend
- [ ] T061 [US5] Write up migration in database/migrations/xxx-AddTransactionIndexes.ts - CREATE INDEX CONCURRENTLY for (userId, type, createdAt)
- [ ] T062 [US5] Write up migration in database/migrations/xxx-AddTransactionIndexes.ts - CREATE INDEX CONCURRENTLY for (referenceId, createdAt)
- [ ] T063 [US5] Write down migration in database/migrations/xxx-AddTransactionIndexes.ts - DROP INDEX statements
- [ ] T064 [US5] Update Transaction entity in backend/src/modules/wallet/entities/transaction.entity.ts - add @Index decorators
- [ ] T065 [US5] Test migration on staging database: `npm run migration:run`
- [ ] T066 [US5] Verify index performance with EXPLAIN ANALYZE queries
- [ ] T067 [US5] Run tests and verify all pass: `npm run test:integration -- transaction-indexes.spec.ts`

**Checkpoint**: Database indexes created, queries optimized to <200ms, no table locking during migration

---

## Phase 8: User Story 6 - Graceful Error Recovery (Priority: P1 - High)

**Goal**: Prevent full app crashes with React error boundaries that catch and recover from game errors

**Independent Test**: Inject error into game state hooks, verify error boundary catches it, displays friendly message, allows recovery without losing session

### Tests for User Story 6 (TDD Required)

- [ ] T068 [P] [US6] Write error boundary test in frontend/tests/components/error-boundary.spec.tsx - test catches component errors
- [ ] T069 [P] [US6] Write recovery test in frontend/tests/components/error-boundary.spec.tsx - test reset functionality
- [ ] T070 [P] [US6] Write Sentry integration test in frontend/tests/components/error-boundary.spec.tsx - test errors logged

### Implementation for User Story 6

- [ ] T071 [US6] Create ErrorBoundary class component in frontend/src/components/error/error-boundary.tsx - implement componentDidCatch
- [ ] T072 [US6] Add Sentry error logging in frontend/src/components/error/error-boundary.tsx - captureException with context
- [ ] T073 [US6] Implement error UI in frontend/src/components/error/error-boundary.tsx - friendly message with retry button
- [ ] T074 [US6] Create GameErrorFallback component in frontend/src/components/error/game-error-fallback.tsx - game-specific fallback UI
- [ ] T075 [US6] Add ErrorBoundary to layout in frontend/src/app/layout.tsx - wrap children
- [ ] T076 [US6] Add ErrorBoundary to game page in frontend/src/app/game/[roomId]/page.tsx - wrap game components
- [ ] T077 [US6] Run tests and verify all pass: `npm run test -- error-boundary.spec.tsx`

**Checkpoint**: Error boundaries catch errors, no full app crashes, users can recover without session loss

---

## Phase 9: User Story 7 - Protected WebSocket Connections (Priority: P1 - High)

**Goal**: Prevent DoS attacks with WebSocket rate limiting (max 10 connections per IP per minute)

**Independent Test**: Simulate 15 rapid connection attempts from single IP, verify first 10 succeed, 11th rejected with rate limit error

### Tests for User Story 7 (TDD Required)

- [ ] T078 [P] [US7] Write rate limit enforcement test in backend/tests/load/websocket-rate-limit.spec.ts - test 15 rapid connections
- [ ] T079 [P] [US7] Write Redis fallback test in backend/tests/load/websocket-rate-limit.spec.ts - test in-memory fallback on Redis failure
- [ ] T080 [P] [US7] Write rate limit reset test in backend/tests/load/websocket-rate-limit.spec.ts - test window expiry

### Implementation for User Story 7

- [ ] T081 [US7] Implement WebSocketRateLimitGuard class in backend/src/common/guards/websocket-rate-limit.guard.ts - canActivate method
- [ ] T082 [US7] Add Redis rate limiting logic in backend/src/common/guards/websocket-rate-limit.guard.ts - INCR with TTL
- [ ] T083 [US7] Add in-memory fallback in backend/src/common/guards/websocket-rate-limit.guard.ts - Map with expiry tracking
- [ ] T084 [US7] Implement getClientIp helper in backend/src/common/guards/websocket-rate-limit.guard.ts - extract IP from handshake
- [ ] T085 [US7] Apply guard to WebSocket gateway in backend/src/modules/game/gateways/game.gateway.ts - @UseGuards decorator
- [ ] T086 [US7] Add rate limit error handling in backend/src/modules/game/gateways/game.gateway.ts - emit error with retry time
- [ ] T087 [US7] Run tests and verify all pass: `npm run test:load -- websocket-rate-limit.spec.ts`

**Checkpoint**: WebSocket rate limiting active, DoS attacks blocked, graceful fallback on Redis failure

---

## Phase 10: User Story 8 - Mobile-Optimized Poker Interface (Priority: P2 - Medium)

**Goal**: Provide mobile-friendly poker table layout with portrait support and 44x44px touch targets

**Independent Test**: Test on actual mobile devices (iOS/Android) in portrait mode, verify table fits viewport, all controls accessible, buttons meet touch target minimums

### Tests for User Story 8 (TDD Required)

- [ ] T088 [P] [US8] Write media query hook test in frontend/tests/hooks/use-media-query.spec.ts - test breakpoint detection
- [ ] T089 [P] [US8] Write mobile layout test in frontend/tests/integration/mobile-layout.spec.ts - test component switching at breakpoints
- [ ] T090 [P] [US8] Write touch target test in frontend/tests/integration/mobile-layout.spec.ts - test button sizes meet 44x44px minimum

### Implementation for User Story 8

- [ ] T091 [US8] Create useMediaQuery hook in frontend/src/hooks/use-media-query.ts - implement matchMedia listener
- [ ] T092 [US8] Create MobilePokerTable component in frontend/src/components/game/mobile-poker-table.tsx - vertical layout
- [ ] T093 [US8] Create TabletPokerTable component (optional) in frontend/src/components/game/tablet-poker-table.tsx - tablet-optimized layout
- [ ] T094 [US8] Update PokerTable component in frontend/src/components/game/poker-table.tsx - add responsive switching logic
- [ ] T095 [US8] Update action buttons in frontend/src/components/game/action-buttons.tsx - ensure 44x44px minimum size on mobile
- [ ] T096 [US8] Add loading states to action buttons in frontend/src/components/game/action-buttons.tsx - show spinner during actions
- [ ] T097 [US8] Test on real devices (iOS and Android) - verify UX meets requirements
- [ ] T098 [US8] Run tests and verify all pass: `npm run test -- mobile-layout.spec.ts`

**Checkpoint**: Mobile layout works on 95%+ devices, touch targets accessible, smooth portrait/landscape transitions

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements and validation across all user stories

- [ ] T099 [P] Add request size limiting middleware in backend/src/common/middleware/request-size-limit.middleware.ts - 100KB limit
- [ ] T100 [P] Update TimeoutService in backend/src/modules/game/services/timeout.service.ts - add onModuleDestroy to prevent memory leaks
- [ ] T101 [P] Run full test suite: `npm run test` in backend and frontend
- [ ] T102 [P] Run linting: `npm run lint` in backend and frontend
- [ ] T103 [P] Update quickstart.md validation - verify all steps work
- [ ] T104 [P] Run security scan: `npm run security:scan` (if available)
- [ ] T105 [P] Performance testing with 1000 concurrent users
- [ ] T106 Code review all changes - verify TDD followed, no hardcoded strings
- [ ] T107 Create deployment checklist based on quickstart.md
- [ ] T108 Update documentation in docs/ with implementation notes
- [ ] T109 Tag release: `git tag v1.1.0-code-review-fixes`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - **P0 Stories (US1-US3)**: MUST complete before production deployment
  - **P1 Stories (US4-US7)**: Should complete in Week 1 post-launch
  - **P2 Stories (US8)**: Can complete after P0/P1 validated
- **Polish (Phase 11)**: Depends on all P0 stories minimum

### User Story Dependencies

**Critical Path (P0 - Must Deploy Together)**:
- **US1 (CORS)**: Independent - no dependencies on other stories
- **US2 (Chip Locking)**: Independent - no dependencies on other stories
- **US3 (Cash-Out Verification)**: Independent - no dependencies on other stories

**High Priority (P1 - Week 1)**:
- **US4 (Pagination)**: Independent - can deploy without other stories
- **US5 (Indexes)**: Independent - database-only change
- **US6 (Error Boundaries)**: Independent - frontend-only change
- **US7 (Rate Limiting)**: Independent - no dependencies on other stories

**Medium Priority (P2)**:
- **US8 (Mobile Layout)**: Independent - frontend-only change

### Within Each User Story

1. **Tests FIRST** (TDD requirement) - must FAIL before implementation
2. **Models/Entities** - data layer
3. **Services/Logic** - business layer
4. **Controllers/UI** - presentation layer
5. **Verify tests PASS** - validate implementation

### Parallel Opportunities

**Setup Phase**: All T001-T009 can run in parallel

**Foundational Phase**: T010-T015 can run in parallel

**After Foundational Complete**:
- All 8 user stories can start in parallel (if team capacity allows)
- Within each story:
  - All test tasks marked [P] can run in parallel
  - Independent components marked [P] can run in parallel

**Example Multi-Developer Split**:
- Developer A: US1 (CORS) + US4 (Pagination)
- Developer B: US2 (Chip Locking) + US5 (Indexes)
- Developer C: US3 (Cash-Out) + US6 (Error Boundaries)
- Developer D: US7 (Rate Limiting) + US8 (Mobile Layout)

---

## Parallel Example: User Story 2 (Chip Stack Locking)

```bash
# Launch all tests for US2 together (write these FIRST):
Task T025: "Write chip stack concurrency test in backend/tests/integration/chip-stack-concurrency.spec.ts"
Task T026: "Write atomic update test in backend/tests/integration/chip-stack-concurrency.spec.ts"
Task T027: "Write lock timeout test in backend/tests/integration/chip-stack-concurrency.spec.ts"

# Then implement (tests should FAIL):
Task T028: "Import Mutex from async-mutex in game.gateway.ts"
Task T029: "Add chipUpdateLocks Map property in game.gateway.ts"
# ... continue implementation

# Finally verify (tests should PASS):
Task T034: "Run tests: npm run test:integration -- chip-stack-concurrency.spec.ts"
```

---

## Implementation Strategy

### MVP First (P0 Critical Fixes Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T015) - **CRITICAL CHECKPOINT**
3. Complete Phase 3: User Story 1 - CORS (T016-T024)
4. Complete Phase 4: User Story 2 - Chip Locking (T025-T034)
5. Complete Phase 5: User Story 3 - Cash-Out Verification (T035-T044)
6. **STOP and VALIDATE**: Test all P0 fixes independently
7. Deploy to production (critical security fixes complete)

**Estimated Effort**: 8 hours (P0 fixes only)

### Incremental Delivery (P0 → P1)

1. Complete MVP (P0 fixes)
2. Add US4: Pagination (T045-T056) - 2 hours
3. Add US5: Database Indexes (T057-T067) - 1 hour
4. Add US6: Error Boundaries (T068-T077) - 1 hour
5. Add US7: Rate Limiting (T078-T087) - 1 hour
6. **Deploy Week 1 improvements** (P1 complete)

**Estimated Total Effort**: 14 hours (P0 + P1)

### Full Feature (P0 → P1 → P2)

1. Complete P0 + P1 (14 hours)
2. Add US8: Mobile Layout (T088-T098) - 2 hours
3. Polish & Cross-Cutting (T099-T109) - 2 hours
4. **Deploy complete feature**

**Estimated Total Effort**: 18 hours (all fixes)

### Parallel Team Strategy (Fastest Path)

With 4 developers after Foundational phase completes:

**Week 1** (P0 Critical):
- Dev A: US1 (CORS) - 1.5 hours
- Dev B: US2 (Chip Locking) - 4 hours
- Dev C: US3 (Cash-Out) - 2.5 hours
- Dev D: Setup + Testing infrastructure
- **Result**: P0 complete in ~1 day (parallelized from 8 hours)

**Week 1** (P1 High Priority):
- Dev A: US4 (Pagination) + US5 (Indexes) - 3 hours
- Dev B: US6 (Error Boundaries) - 1 hour
- Dev C: US7 (Rate Limiting) - 1 hour
- Dev D: US8 (Mobile Layout) - 2 hours
- **Result**: P0 + P1 complete in ~2 days total

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story (US1-US8)
- Each user story is independently completable and testable
- **TDD Required**: Verify tests FAIL before implementing, PASS after
- Commit after each logical task group
- Stop at any checkpoint to validate story independently
- P0 fixes MUST deploy together (security package)
- P1 fixes can deploy incrementally (performance/stability)
- Total tasks: 109 (including tests, setup, polish)
- Parallel opportunities: ~40% of tasks can run concurrently
- MVP scope: P0 only (US1-US3) = 29 tasks = ~8 hours sequential

---

**Task Generation Complete**
**Total Tasks**: 109
**Critical Path**: 8 hours (P0 only)
**Full Feature**: 18 hours (all priorities)
**Test Coverage**: 24 test tasks (TDD enforced)
**Independent Stories**: 8 (all can be tested independently)
