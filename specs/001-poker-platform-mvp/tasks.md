# Implementation Tasks: Texas Poker Platform MVP

**Feature Branch**: `001-poker-platform-mvp`
**Created**: 2025-01-15
**Status**: Ready for Implementation
**Methodology**: TDD (Test-Driven Development - RED-GREEN-REFACTOR)

---

## Summary

**Total Tasks**: 247
**User Stories**: 12 (7 P1, 3 P2, 2 P3)
**Estimated Timeline**: 8 weeks
**MVP Scope**: User Stories 1, 2, 3, 5, 9 (P1 stories)

### Task Breakdown by Phase

| Phase | Name | Task Count | Story |
|-------|------|------------|-------|
| 1 | Setup & Infrastructure | 25 | N/A |
| 2 | Foundational Services | 18 | N/A |
| 3 | User Story 1 - Authentication | 22 | P1 |
| 4 | User Story 2 - Wallet Management | 24 | P1 |
| 5 | User Story 9 - Admin Withdrawal Mgmt | 20 | P1 |
| 6 | User Story 3 - Browse & Join Rooms | 18 | P1 |
| 7 | User Story 5 - Play Texas Hold'em | 35 | P1 |
| 8 | User Story 4 - Create Custom Room | 12 | P2 |
| 9 | User Story 8 - Admin Dashboard | 16 | P2 |
| 10 | User Story 10 - Admin User Mgmt | 14 | P2 |
| 11 | User Story 11 - Admin Room Mgmt | 12 | P2 |
| 12 | User Story 6 - Game History | 10 | P3 |
| 13 | User Story 7 - Live Chat | 8 | P3 |
| 14 | User Story 12 - Platform Settings | 8 | P3 |
| 15 | Polish & Integration | 15 | N/A |

---

## Execution Strategy

### TDD Workflow (MANDATORY)

Every feature MUST follow the RED-GREEN-REFACTOR cycle:

1. **RED**: Write failing test first
   ```bash
   npm run test -- <test-file>.spec.ts
   # Test should FAIL - verify expected behavior
   ```

2. **GREEN**: Write minimum code to pass test
   ```bash
   npm run test -- <test-file>.spec.ts
   # Test should PASS
   ```

3. **REFACTOR**: Improve code while keeping tests passing
   ```bash
   npm run test:cov
   # Coverage should maintain/improve
   ```

### Parallelization Opportunities

Tasks marked with `[P]` can be executed in parallel:
- Different modules (no shared dependencies)
- Independent components (frontend components, utility functions)
- Test files for different features

### MVP First Approach

**Recommended MVP**: Complete Phases 1-7 (User Stories 1, 2, 3, 5, 9)
- Delivers: Authentication, Wallet, Room browsing, Gameplay, Admin withdrawals
- Testable: End-to-end poker gameplay with real money
- Launchable: Minimum viable product for early adopters

**Post-MVP**: Phases 8-15 (remaining user stories + polish)

---

## Dependencies

### Story Dependency Graph

```
Phase 1 (Setup) → Phase 2 (Foundational) → All User Stories

User Story Dependencies:
US1 (Auth) ────────┬─────→ US2 (Wallet) ───→ US3 (Browse Rooms) ───→ US5 (Gameplay)
                   │                                                      ↓
                   └─────→ US9 (Admin Withdrawals) ←──────────────────────┘

US4 (Create Room) depends on: US1, US3
US6 (History) depends on: US5
US7 (Chat) depends on: US5
US8 (Admin Dashboard) depends on: US1, US2, US5, US9
US10 (Admin Users) depends on: US1
US11 (Admin Rooms) depends on: US3, US5
US12 (Settings) depends on: US1
```

### Critical Path (MVP)

```
Setup → Foundational → US1 → US2 → US9 → US3 → US5
```

---

## Phase 1: Setup & Infrastructure

**Goal**: Initialize project structure, configure tools, set up CI/CD

### Project Initialization

- [ ] T001 Initialize NestJS backend project using @nestjs/cli in backend/ directory
- [ ] T002 Initialize Next.js frontend project using create-next-app in frontend/ directory
- [ ] T003 [P] Configure TypeScript strict mode in backend/tsconfig.json
- [ ] T004 [P] Configure TypeScript strict mode in frontend/tsconfig.json
- [ ] T005 Set up ESLint and Prettier with shared config in both projects
- [ ] T006 [P] Install backend dependencies: @nestjs/typeorm, typeorm, pg, redis, socket.io, class-validator, class-transformer, bcrypt, @nestjs/jwt, @nestjs/passport
- [ ] T007 [P] Install frontend dependencies: socket.io-client, @telegram-apps/sdk, lucide-react, tailwindcss, zustand

### Database & Cache Setup

- [ ] T008 Create Docker Compose file with PostgreSQL 15, Redis 7, and pgAdmin services
- [ ] T009 Configure TypeORM data source in backend/src/config/database.config.ts
- [ ] T010 Configure Redis connection in backend/src/config/redis.config.ts
- [ ] T011 Create database migration script structure in backend/migrations/

### Testing Infrastructure (TDD Setup)

- [ ] T012 [P] Configure Jest for backend with coverage threshold 70% in backend/jest.config.js
- [ ] T013 [P] Configure Jest for frontend with React Testing Library in frontend/jest.config.js
- [ ] T014 Set up Supertest for integration tests in backend/test/setup.ts
- [ ] T015 Create test database configuration for isolated test runs
- [ ] T016 [P] Add TDD helper scripts to backend/package.json (test:watch, test:cov, test:tdd)

### Environment & Configuration

- [ ] T017 Create .env.example for backend with all required variables (DATABASE_URL, REDIS_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN)
- [ ] T018 Create .env.local.example for frontend with NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
- [ ] T019 [P] Implement configuration service in backend/src/config/configuration.ts using @nestjs/config
- [ ] T020 [P] Set up environment validation using class-validator in backend/src/config/env.validation.ts

### CI/CD & DevOps

- [ ] T021 Create GitHub Actions workflow for backend tests (.github/workflows/backend-test.yml)
- [ ] T022 Create GitHub Actions workflow for frontend tests (.github/workflows/frontend-test.yml)
- [ ] T023 [P] Add pre-commit hooks with Husky for linting and formatting
- [ ] T024 Create Dockerfile for backend production build
- [ ] T025 Create Dockerfile for frontend production build

---

## Phase 2: Foundational Services

**Goal**: Build shared services used across multiple user stories

### Core Entities (Common Models)

- [ ] T026 [P] Create User entity in backend/src/modules/auth/entities/user.entity.ts with TypeORM decorators
- [ ] T027 [P] Create Transaction entity in backend/src/modules/wallet/entities/transaction.entity.ts
- [ ] T028 [P] Create Room entity in backend/src/modules/room/entities/room.entity.ts
- [ ] T029 [P] Create GameHand entity in backend/src/modules/game/entities/game-hand.entity.ts
- [ ] T030 [P] Create PlayerSeat entity in backend/src/modules/game/entities/player-seat.entity.ts
- [ ] T031 [P] Create BettingAction entity in backend/src/modules/game/entities/betting-action.entity.ts
- [ ] T032 [P] Create AuditLog entity in backend/src/modules/audit/entities/audit-log.entity.ts
- [ ] T033 [P] Create PlatformSettings entity in backend/src/modules/admin/entities/platform-settings.entity.ts

### Database Migrations

- [ ] T034 Generate initial migration for all entities using TypeORM CLI
- [ ] T035 Create seed data migration for PlatformSettings default values
- [ ] T036 Create database indexes migration for performance optimization
- [ ] T037 Test migration rollback and re-run procedures

### Global Middleware & Filters

- [ ] T038 [P] Create global exception filter in backend/src/common/filters/global-exception.filter.ts
- [ ] T039 [P] Create global validation pipe configuration in backend/src/main.ts
- [ ] T040 [P] Create rate limiting guard in backend/src/common/guards/rate-limit.guard.ts
- [ ] T041 [P] Create audit interceptor in backend/src/common/interceptors/audit.interceptor.ts

### Localization Infrastructure

- [ ] T042 [P] Set up nestjs-i18n in backend with English resource files in backend/src/i18n/resources/en/
- [ ] T043 [P] Set up next-intl in frontend with English resource files in frontend/i18n/en.json

---

## Phase 3: User Story 1 - Player Authentication and Onboarding (P1)

**Story Goal**: Seamlessly authenticate users via Telegram and create poker profiles
**Independent Test**: Open Telegram mini app, authenticate, verify profile creation
**Priority**: P1 (MVP Critical)

### Tests (RED Phase)

- [ ] T044 [P] [US1] Write failing test for Telegram initData validation in backend/test/unit/auth/telegram-auth.service.spec.ts
- [ ] T045 [P] [US1] Write failing test for user creation on first login in backend/test/unit/auth/auth.service.spec.ts
- [ ] T046 [P] [US1] Write failing test for JWT token generation in backend/test/unit/auth/jwt.service.spec.ts
- [ ] T047 [P] [US1] Write failing test for session persistence in backend/test/integration/auth/session.e2e-spec.ts
- [ ] T048 [P] [US1] Write failing test for user profile retrieval in backend/test/integration/auth/profile.e2e-spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T049 [US1] Implement TelegramAuthService in backend/src/modules/auth/services/telegram-auth.service.ts using @telegram-apps/init-data-node
- [ ] T050 [US1] Implement AuthService with user creation logic in backend/src/modules/auth/services/auth.service.ts
- [ ] T051 [US1] Implement JwtService for token generation in backend/src/modules/auth/services/jwt.service.ts
- [ ] T052 [US1] Create TelegramAuthGuard in backend/src/modules/auth/guards/telegram-auth.guard.ts
- [ ] T053 [US1] Create AuthController with /auth/telegram and /auth/me endpoints in backend/src/modules/auth/controllers/auth.controller.ts
- [ ] T054 [US1] Create UserRepository for database operations in backend/src/modules/auth/repositories/user.repository.ts
- [ ] T055 [US1] Register AuthModule in backend/src/app.module.ts

### Frontend Implementation

- [ ] T056 [P] [US1] Create AuthContext using React Context API in frontend/lib/contexts/auth-context.tsx
- [ ] T057 [P] [US1] Create useAuth hook in frontend/hooks/use-auth.ts
- [ ] T058 [P] [US1] Create TelegramAuthButton component in frontend/components/auth/telegram-auth-button.tsx
- [ ] T059 [P] [US1] Create WelcomeScreen component in frontend/app/(auth)/welcome/page.tsx
- [ ] T060 [P] [US1] Create ProfileView component in frontend/components/profile/profile-view.tsx
- [ ] T061 [P] [US1] Create OnboardingTutorial component in frontend/components/onboarding/tutorial.tsx

### Integration Tests

- [ ] T062 [US1] Write E2E test for complete authentication flow in frontend/__tests__/e2e/auth-flow.test.tsx
- [ ] T063 [US1] Test Telegram WebApp integration with mock initData
- [ ] T064 [US1] Verify JWT token storage and retrieval in browser
- [ ] T065 [US1] Test automatic login for returning users

---

## Phase 4: User Story 2 - Wallet Management and Transactions (P1)

**Story Goal**: Enable players to deposit credits and withdraw winnings
**Independent Test**: Submit deposit, admin approval, verify balance update, request withdrawal
**Priority**: P1 (MVP Critical)

### Tests (RED Phase)

- [ ] T066 [P] [US2] Write failing test for deposit request creation in backend/test/unit/wallet/transaction.service.spec.ts
- [ ] T067 [P] [US2] Write failing test for balance validation (prevent negative) in backend/test/unit/wallet/balance.service.spec.ts
- [ ] T068 [P] [US2] Write failing test for withdrawal request with insufficient balance in backend/test/unit/wallet/withdrawal.service.spec.ts
- [ ] T069 [P] [US2] Write failing test for transaction history pagination in backend/test/integration/wallet/transactions.e2e-spec.ts
- [ ] T070 [P] [US2] Write failing test for atomic balance updates in backend/test/unit/wallet/transaction-interceptor.spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T071 [US2] Create TransactionService with deposit/withdrawal logic in backend/src/modules/wallet/services/transaction.service.ts
- [ ] T072 [US2] Create BalanceService with validation in backend/src/modules/wallet/services/balance.service.ts
- [ ] T073 [US2] Create BalanceValidationPipe in backend/src/modules/wallet/pipes/balance-validation.pipe.ts
- [ ] T074 [US2] Create TransactionInterceptor for atomic operations in backend/src/modules/wallet/interceptors/transaction.interceptor.ts
- [ ] T075 [US2] Create WalletController with /wallet/deposit, /wallet/withdraw, /wallet/balance, /wallet/transactions endpoints in backend/src/modules/wallet/controllers/wallet.controller.ts
- [ ] T076 [US2] Create TransactionRepository in backend/src/modules/wallet/repositories/transaction.repository.ts
- [ ] T077 [US2] Implement pessimistic locking for concurrent balance updates using TypeORM SELECT FOR UPDATE
- [ ] T078 [US2] Register WalletModule in backend/src/app.module.ts

### Frontend Implementation

- [ ] T079 [P] [US2] Create useWallet hook in frontend/hooks/use-wallet.ts
- [ ] T080 [P] [US2] Create DepositModal component with amount input in frontend/components/wallet/deposit-modal.tsx
- [ ] T081 [P] [US2] Create WithdrawModal component in frontend/components/wallet/withdraw-modal.tsx
- [ ] T082 [P] [US2] Create TransactionHistory component with pagination in frontend/components/wallet/transaction-history.tsx
- [ ] T083 [P] [US2] Create BalanceDisplay component in frontend/components/wallet/balance-display.tsx
- [ ] T084 [P] [US2] Create wallet page in frontend/app/(wallet)/wallet/page.tsx

### Integration Tests

- [ ] T085 [US2] Write E2E test for deposit flow (request → pending → approved → balance update)
- [ ] T086 [US2] Write E2E test for withdrawal flow with balance restoration on rejection
- [ ] T087 [US2] Test concurrent balance updates with multiple transactions
- [ ] T088 [US2] Verify transaction immutability (cannot modify completed transactions)
- [ ] T089 [US2] Test transaction history filtering and sorting

---

## Phase 5: User Story 9 - Admin Withdrawal Management (P1)

**Story Goal**: Enable admins to review and approve withdrawal requests
**Independent Test**: Player submits withdrawal, admin reviews, approves/rejects
**Priority**: P1 (MVP Critical - Financial Security)

### Tests (RED Phase)

- [ ] T090 [P] [US9] Write failing test for admin withdrawal queue retrieval in backend/test/unit/admin/withdrawal-management.service.spec.ts
- [ ] T091 [P] [US9] Write failing test for withdrawal approval with payment gateway integration in backend/test/unit/admin/payment-gateway.service.spec.ts
- [ ] T092 [P] [US9] Write failing test for withdrawal rejection with balance restoration in backend/test/integration/admin/withdrawal-rejection.e2e-spec.ts
- [ ] T093 [P] [US9] Write failing test for audit logging of admin actions in backend/test/unit/audit/audit-log.service.spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T094 [US9] Create WithdrawalManagementService in backend/src/modules/admin/services/withdrawal-management.service.ts
- [ ] T095 [US9] Create PaymentGatewayService with circuit breaker (Opossum) in backend/src/modules/wallet/services/payment-gateway.service.ts
- [ ] T096 [US9] Create AuditLogService in backend/src/modules/audit/services/audit-log.service.ts
- [ ] T097 [US9] Create AuditInterceptor in backend/src/modules/admin/interceptors/audit.interceptor.ts
- [ ] T098 [US9] Create AdminRoleGuard with RBAC in backend/src/modules/admin/guards/admin-role.guard.ts
- [ ] T099 [US9] Create AdminWithdrawalController with /admin/withdrawals endpoints in backend/src/modules/admin/controllers/withdrawal.controller.ts
- [ ] T100 [US9] Implement webhook handler for payment gateway callbacks in backend/src/modules/wallet/controllers/webhook.controller.ts
- [ ] T101 [US9] Register AdminModule in backend/src/app.module.ts

### Frontend Implementation

- [ ] T102 [P] [US9] Create useAdminWithdrawals hook in frontend/hooks/use-admin-withdrawals.ts
- [ ] T103 [P] [US9] Create WithdrawalQueue component in frontend/components/admin/withdrawal-queue.tsx
- [ ] T104 [P] [US9] Create WithdrawalDetailsModal component in frontend/components/admin/withdrawal-details-modal.tsx
- [ ] T105 [P] [US9] Create ApprovalActionButtons component in frontend/components/admin/approval-action-buttons.tsx
- [ ] T106 [P] [US9] Create admin withdrawal management page in frontend/app/(admin)/admin/withdrawals/page.tsx

### Integration Tests

- [ ] T107 [US9] Write E2E test for admin approval flow with payment gateway mock
- [ ] T108 [US9] Write E2E test for admin rejection with balance restoration
- [ ] T109 [US9] Test circuit breaker behavior when payment gateway fails

---

## Phase 6: User Story 3 - Browse and Join Game Rooms (P1)

**Story Goal**: Allow players to discover and join poker rooms
**Independent Test**: View room list, filter by stakes, join room with sufficient balance
**Priority**: P1 (MVP Critical)

### Tests (RED Phase)

- [ ] T110 [P] [US3] Write failing test for room list retrieval in backend/test/unit/room/room.service.spec.ts
- [ ] T111 [P] [US3] Write failing test for room filtering by stakes in backend/test/integration/room/room-filter.e2e-spec.ts
- [ ] T112 [P] [US3] Write failing test for join room with balance validation in backend/test/unit/room/join-room.service.spec.ts
- [ ] T113 [P] [US3] Write failing test for room full scenario in backend/test/unit/room/room-capacity.spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T114 [US3] Create RoomService with list, filter, join logic in backend/src/modules/room/services/room.service.ts
- [ ] T115 [US3] Create JoinRoomService with buy-in validation in backend/src/modules/room/services/join-room.service.ts
- [ ] T116 [US3] Create RoomSettingsValidationPipe in backend/src/modules/room/pipes/room-settings-validation.pipe.ts
- [ ] T117 [US3] Create RoomController with /rooms, /rooms/:id, /rooms/:id/join endpoints in backend/src/modules/room/controllers/room.controller.ts
- [ ] T118 [US3] Create RoomRepository with filtering logic in backend/src/modules/room/repositories/room.repository.ts
- [ ] T119 [US3] Register RoomModule in backend/src/app.module.ts

### Frontend Implementation

- [ ] T120 [P] [US3] Create useRooms hook with filtering in frontend/hooks/use-rooms.ts
- [ ] T121 [P] [US3] Create RoomList component in frontend/components/room/room-list.tsx
- [ ] T122 [P] [US3] Create RoomCard component in frontend/components/room/room-card.tsx
- [ ] T123 [P] [US3] Create RoomFilters component in frontend/components/room/room-filters.tsx
- [ ] T124 [P] [US3] Create JoinRoomButton component with balance check in frontend/components/room/join-room-button.tsx
- [ ] T125 [P] [US3] Create rooms browse page in frontend/app/(game)/rooms/page.tsx

### Integration Tests

- [ ] T126 [US3] Write E2E test for browsing and filtering rooms
- [ ] T127 [US3] Test joining room with sufficient balance and balance deduction

---

## Phase 7: User Story 5 - Play Texas Hold'em Cash Game (P1)

**Story Goal**: Enable real-time Texas Hold'em gameplay with all poker mechanics
**Independent Test**: Play complete hand from preflop to showdown with pot distribution
**Priority**: P1 (MVP Critical - Core Value)

### Tests (RED Phase - Game Logic)

- [ ] T128 [P] [US5] Write failing test for card deck shuffle using Fisher-Yates in backend/test/unit/game/deck.service.spec.ts
- [ ] T129 [P] [US5] Write failing test for hand evaluation using poker-evaluator in backend/test/unit/game/hand-evaluator.service.spec.ts
- [ ] T130 [P] [US5] Write failing test for pot calculation in backend/test/unit/game/pot.service.spec.ts
- [ ] T131 [P] [US5] Write failing test for side pot calculation with multiple all-ins in backend/test/unit/game/side-pot.service.spec.ts
- [ ] T132 [P] [US5] Write failing test for betting validation (minimum raise) in backend/test/unit/game/betting.service.spec.ts
- [ ] T133 [P] [US5] Write failing test for game state transitions (preflop → flop → turn → river → showdown) in backend/test/unit/game/game-state-machine.spec.ts
- [ ] T134 [P] [US5] Write failing test for player timeout and auto-fold in backend/test/unit/game/timeout.service.spec.ts

### Backend Implementation (GREEN Phase - Game Engine)

- [ ] T135 [US5] Create DeckService with cryptographic shuffle in backend/src/modules/game/services/deck.service.ts
- [ ] T136 [US5] Create HandEvaluatorService wrapping poker-evaluator library in backend/src/modules/game/services/hand-evaluator.service.ts
- [ ] T137 [US5] Create PotService with main pot and side pot calculation in backend/src/modules/game/services/pot.service.ts
- [ ] T138 [US5] Create BettingService with validation in backend/src/modules/game/services/betting.service.ts
- [ ] T139 [US5] Create GameStateMachine with phase transitions in backend/src/modules/game/services/game-state-machine.service.ts
- [ ] T140 [US5] Create TimeoutService for player action timers in backend/src/modules/game/services/timeout.service.ts
- [ ] T141 [US5] Create GameEngine orchestrating all game services in backend/src/modules/game/services/game-engine.service.ts

### Tests (RED Phase - WebSocket)

- [ ] T142 [P] [US5] Write failing test for WebSocket authentication in backend/test/unit/realtime/ws-auth.guard.spec.ts
- [ ] T143 [P] [US5] Write failing test for game:join event in backend/test/unit/realtime/game.gateway.spec.ts
- [ ] T144 [P] [US5] Write failing test for game:action event broadcast in backend/test/integration/realtime/game-actions.e2e-spec.ts
- [ ] T145 [P] [US5] Write failing test for player reconnection with state restoration in backend/test/integration/realtime/reconnection.e2e-spec.ts

### Backend Implementation (GREEN Phase - Real-time)

- [ ] T146 [US5] Set up Redis adapter for Socket.io in backend/src/modules/realtime/adapters/redis.adapter.ts
- [ ] T147 [US5] Create WsAuthGuard for WebSocket authentication in backend/src/modules/realtime/guards/ws-auth.guard.ts
- [ ] T148 [US5] Create GameGateway with event handlers in backend/src/modules/realtime/gateways/game.gateway.ts
- [ ] T149 [US5] Implement game:join event handler with seat assignment
- [ ] T150 [US5] Implement game:action event handler (fold, check, call, bet, raise, all-in)
- [ ] T151 [US5] Implement game:leave event handler with balance return
- [ ] T152 [US5] Implement player reconnection logic with 60-second grace period
- [ ] T153 [US5] Create LobbyGateway for room updates in backend/src/modules/realtime/gateways/lobby.gateway.ts
- [ ] T154 [US5] Register RealtimeModule in backend/src/app.module.ts

### Frontend Implementation (Game UI)

- [ ] T155 [P] [US5] Create useWebSocket hook with reconnection logic in frontend/hooks/use-websocket.ts
- [ ] T156 [P] [US5] Create useGame hook for game state management in frontend/hooks/use-game.ts
- [ ] T157 [P] [US5] Create Card component with lucide-react icons in frontend/components/game/card.tsx
- [ ] T158 [P] [US5] Create PokerTable component in frontend/components/game/poker-table.tsx
- [ ] T159 [P] [US5] Create PlayerSeat component in frontend/components/game/player-seat.tsx
- [ ] T160 [P] [US5] Create CommunityCards component in frontend/components/game/community-cards.tsx
- [ ] T161 [P] [US5] Create PotDisplay component in frontend/components/game/pot-display.tsx
- [ ] T162 [P] [US5] Create BettingControls component (Fold, Check, Call, Bet, Raise) in frontend/components/game/betting-controls.tsx
- [ ] T163 [P] [US5] Create ActionTimer component with countdown in frontend/components/game/action-timer.tsx
- [ ] T164 [P] [US5] Create WinnerAnnouncement component with animation in frontend/components/game/winner-announcement.tsx
- [ ] T165 [P] [US5] Create game play page in frontend/app/(game)/game/[id]/page.tsx

### Integration Tests (E2E Gameplay)

- [ ] T166 [US5] Write E2E test for complete hand (2 players, preflop to showdown)
- [ ] T167 [US5] Write E2E test for 6-player hand with multiple betting rounds
- [ ] T168 [US5] Write E2E test for all-in scenario with side pot calculation
- [ ] T169 [US5] Write E2E test for player timeout and auto-fold
- [ ] T170 [US5] Write E2E test for player disconnect and reconnect
- [ ] T171 [US5] Test real-time action broadcast to all players (<1s latency)
- [ ] T172 [US5] Verify pot distribution with multiple winners (tied hands)

### Refactor (Performance Optimization)

- [ ] T173 [US5] Optimize WebSocket message payload size (compress game state)
- [ ] T174 [US5] Add Redis caching for active game states
- [ ] T175 [US5] Implement connection pooling for database queries
- [ ] T176 [US5] Add performance monitoring for <500ms action processing

---

## Phase 8: User Story 4 - Create Custom Game Room (P2)

**Story Goal**: Allow players to create rooms with custom stakes
**Independent Test**: Create room with custom settings, verify it appears in room list
**Priority**: P2 (Enhances UX)

### Tests (RED Phase)

- [ ] T177 [P] [US4] Write failing test for room creation validation in backend/test/unit/room/create-room.service.spec.ts
- [ ] T178 [P] [US4] Write failing test for invalid settings (max buy-in < min buy-in) in backend/test/unit/room/room-validation.spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T179 [US4] Create CreateRoomService in backend/src/modules/room/services/create-room.service.ts
- [ ] T180 [US4] Add POST /rooms endpoint to RoomController
- [ ] T181 [US4] Implement auto-start game when 2+ players seated

### Frontend Implementation

- [ ] T182 [P] [US4] Create CreateRoomModal component in frontend/components/room/create-room-modal.tsx
- [ ] T183 [P] [US4] Create RoomSettingsForm component with validation in frontend/components/room/room-settings-form.tsx
- [ ] T184 [P] [US4] Add "Create Room" button to rooms page

### Integration Tests

- [ ] T185 [US4] Write E2E test for room creation with valid settings
- [ ] T186 [US4] Test validation errors for invalid room configuration
- [ ] T187 [US4] Verify auto-start when second player joins
- [ ] T188 [US4] Test room creator auto-seated as first player

---

## Phase 9: User Story 8 - Admin Dashboard Overview (P2)

**Story Goal**: Provide admins with real-time platform metrics
**Independent Test**: View dashboard, verify metrics update in real-time
**Priority**: P2 (Operational)

### Tests (RED Phase)

- [ ] T189 [P] [US8] Write failing test for dashboard metrics calculation in backend/test/unit/admin/dashboard.service.spec.ts
- [ ] T190 [P] [US8] Write failing test for real-time metric updates in backend/test/integration/admin/dashboard-updates.e2e-spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T191 [US8] Create DashboardService with metrics aggregation in backend/src/modules/admin/services/dashboard.service.ts
- [ ] T192 [US8] Create AdminDashboardController with /admin/dashboard endpoint in backend/src/modules/admin/controllers/dashboard.controller.ts
- [ ] T193 [US8] Implement WebSocket updates for real-time metrics

### Frontend Implementation

- [ ] T194 [P] [US8] Create useDashboard hook in frontend/hooks/use-dashboard.ts
- [ ] T195 [P] [US8] Create MetricCard component in frontend/components/admin/metric-card.tsx
- [ ] T196 [P] [US8] Create ActivityChart component using chart library in frontend/components/admin/activity-chart.tsx
- [ ] T197 [P] [US8] Create FinancialSummary component in frontend/components/admin/financial-summary.tsx
- [ ] T198 [P] [US8] Create admin dashboard page in frontend/app/(admin)/admin/dashboard/page.tsx

### Integration Tests

- [ ] T199 [US8] Write E2E test for dashboard metrics accuracy
- [ ] T200 [US8] Test real-time metric updates when transactions occur
- [ ] T201 [US8] Verify dashboard auto-refresh interval
- [ ] T202 [US8] Test admin-only access (unauthorized users blocked)

---

## Phase 10: User Story 10 - Admin User Management (P2)

**Story Goal**: Enable admins to manage user accounts and handle violations
**Independent Test**: Search for user, view details, suspend/ban account
**Priority**: P2 (Platform Safety)

### Tests (RED Phase)

- [ ] T203 [P] [US10] Write failing test for user search in backend/test/unit/admin/user-management.service.spec.ts
- [ ] T204 [P] [US10] Write failing test for user suspension with audit log in backend/test/integration/admin/user-suspension.e2e-spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T205 [US10] Create UserManagementService in backend/src/modules/admin/services/user-management.service.ts
- [ ] T206 [US10] Create AdminUserController with /admin/users endpoints in backend/src/modules/admin/controllers/user.controller.ts
- [ ] T207 [US10] Implement suspend, ban, and reactivate operations
- [ ] T208 [US10] Add audit logging for all user management actions

### Frontend Implementation

- [ ] T209 [P] [US10] Create useUserManagement hook in frontend/hooks/use-user-management.ts
- [ ] T210 [P] [US10] Create UserList component with search in frontend/components/admin/user-list.tsx
- [ ] T211 [P] [US10] Create UserDetailsModal component in frontend/components/admin/user-details-modal.tsx
- [ ] T212 [P] [US10] Create user management page in frontend/app/(admin)/admin/users/page.tsx

### Integration Tests

- [ ] T213 [US10] Write E2E test for user search and filtering
- [ ] T214 [US10] Test user suspension flow (account disabled, sessions terminated)
- [ ] T215 [US10] Test permanent ban with active game removal
- [ ] T216 [US10] Verify audit log entries for admin actions

---

## Phase 11: User Story 11 - Admin Room Monitoring (P2)

**Story Goal**: Allow admins to monitor rooms and intervene when necessary
**Independent Test**: View room list, inspect game state, suspend room
**Priority**: P2 (Operational Control)

### Tests (RED Phase)

- [ ] T217 [P] [US11] Write failing test for room monitoring in backend/test/unit/admin/room-monitoring.service.spec.ts
- [ ] T218 [P] [US11] Write failing test for room suspension in backend/test/integration/admin/room-suspension.e2e-spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T219 [US11] Create RoomMonitoringService in backend/src/modules/admin/services/room-monitoring.service.ts
- [ ] T220 [US11] Create AdminRoomController with /admin/rooms endpoints in backend/src/modules/admin/controllers/room.controller.ts
- [ ] T221 [US11] Implement room suspension logic (pause hand, notify players)

### Frontend Implementation

- [ ] T222 [P] [US11] Create useRoomMonitoring hook in frontend/hooks/use-room-monitoring.ts
- [ ] T223 [P] [US11] Create ActiveRoomsList component in frontend/components/admin/active-rooms-list.tsx
- [ ] T224 [P] [US11] Create RoomDetailsPanel component with real-time game state in frontend/components/admin/room-details-panel.tsx
- [ ] T225 [P] [US11] Create room monitoring page in frontend/app/(admin)/admin/rooms/page.tsx

### Integration Tests

- [ ] T226 [US11] Write E2E test for viewing active room game state
- [ ] T227 [US11] Test room suspension (hand paused, players notified)
- [ ] T228 [US11] Verify real-time room updates in admin view

---

## Phase 12: User Story 6 - View Game History and Statistics (P3)

**Story Goal**: Allow players to review past games and track performance
**Independent Test**: Play several hands, view game history, check statistics
**Priority**: P3 (Engagement)

### Tests (RED Phase)

- [ ] T229 [P] [US6] Write failing test for game history retrieval in backend/test/unit/game/history.service.spec.ts
- [ ] T230 [P] [US6] Write failing test for statistics calculation in backend/test/unit/game/statistics.service.spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T231 [US6] Create GameHistoryService in backend/src/modules/game/services/game-history.service.ts
- [ ] T232 [US6] Create StatisticsService in backend/src/modules/game/services/statistics.service.ts
- [ ] T233 [US6] Create HistoryController with /game/history, /profile/statistics endpoints in backend/src/modules/game/controllers/history.controller.ts

### Frontend Implementation

- [ ] T234 [P] [US6] Create useGameHistory hook in frontend/hooks/use-game-history.ts
- [ ] T235 [P] [US6] Create GameHistoryList component in frontend/components/profile/game-history-list.tsx
- [ ] T236 [P] [US6] Create StatisticsPanel component in frontend/components/profile/statistics-panel.tsx
- [ ] T237 [P] [US6] Add history tab to profile page in frontend/app/(profile)/profile/page.tsx

### Integration Tests

- [ ] T238 [US6] Write E2E test for game history display

---

## Phase 13: User Story 7 - Live Chat in Game Room (P3)

**Story Goal**: Enable player communication during gameplay
**Independent Test**: Send message, verify all players receive it in real-time
**Priority**: P3 (Social)

### Tests (RED Phase)

- [ ] T239 [P] [US7] Write failing test for chat message broadcast in backend/test/unit/realtime/chat.gateway.spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T240 [US7] Add chat:message event handler to GameGateway in backend/src/modules/realtime/gateways/game.gateway.ts
- [ ] T241 [US7] Implement chat message validation and moderation

### Frontend Implementation

- [ ] T242 [P] [US7] Create ChatBox component in frontend/components/game/chat-box.tsx
- [ ] T243 [P] [US7] Create MessageInput component in frontend/components/game/message-input.tsx
- [ ] T244 [P] [US7] Integrate ChatBox into game play page

### Integration Tests

- [ ] T245 [US7] Write E2E test for real-time chat delivery
- [ ] T246 [US7] Test chat message persistence during game

---

## Phase 14: User Story 12 - Admin Platform Settings (P3)

**Story Goal**: Allow admins to configure global platform settings
**Independent Test**: Modify settings, verify changes apply to new operations
**Priority**: P3 (Operational Flexibility)

### Tests (RED Phase)

- [ ] T247 [P] [US12] Write failing test for settings update in backend/test/unit/admin/settings.service.spec.ts

### Backend Implementation (GREEN Phase)

- [ ] T248 [US12] Create SettingsService in backend/src/modules/admin/services/settings.service.ts
- [ ] T249 [US12] Create SettingsController with /admin/settings endpoints in backend/src/modules/admin/controllers/settings.controller.ts

### Frontend Implementation

- [ ] T250 [P] [US12] Create SettingsForm component in frontend/components/admin/settings-form.tsx
- [ ] T251 [P] [US12] Create settings page in frontend/app/(admin)/admin/settings/page.tsx

### Integration Tests

- [ ] T252 [US12] Write E2E test for settings modification
- [ ] T253 [US12] Test maintenance mode activation (blocks new games)
- [ ] T254 [US12] Verify announcement banner display to all users

---

## Phase 15: Polish & Integration

**Goal**: Cross-cutting concerns, performance optimization, production readiness

### Error Handling & Resilience

- [ ] T255 [P] Implement global error boundary in frontend/components/error-boundary.tsx
- [ ] T256 [P] Add retry logic with exponential backoff for WebSocket reconnection in frontend/lib/socket.ts
- [ ] T257 [P] Create error notification toast system in frontend/components/ui/toast.tsx
- [ ] T258 Implement circuit breaker for all external API calls (payment gateway, Telegram API)

### Performance & Optimization

- [ ] T259 [P] Add Redis caching for room list queries (TTL: 10 seconds)
- [ ] T260 [P] Implement database query optimization with composite indexes
- [ ] T261 [P] Add lazy loading for frontend components (Next.js dynamic imports)
- [ ] T262 [P] Optimize WebSocket payload compression
- [ ] T263 Run performance benchmarks (verify <500ms action processing, <1s WebSocket latency)

### Security Hardening

- [ ] T264 [P] Add rate limiting to all API endpoints (100 req/min per user)
- [ ] T265 [P] Implement CSRF protection for state-changing operations
- [ ] T266 [P] Add input sanitization to prevent XSS attacks
- [ ] T267 Conduct security audit checklist review (OWASP Top 10)

### Documentation & Deployment

- [ ] T268 [P] Generate API documentation from OpenAPI spec using Swagger UI
- [ ] T269 [P] Create deployment guide in docs/deployment.md
- [ ] T270 [P] Set up production Docker Compose configuration
- [ ] T271 Create monitoring and alerting setup (health checks, error tracking)

---

## Parallel Execution Examples

### Phase 3 (User Story 1) - Parallel Tasks

**Iteration 1**: All test files can be written in parallel
```bash
# Terminal 1
npm run test:watch -- telegram-auth.service.spec.ts

# Terminal 2
npm run test:watch -- auth.service.spec.ts

# Terminal 3
npm run test:watch -- jwt.service.spec.ts
```

**Iteration 2**: Frontend components can be built in parallel
```bash
# Developer A
Work on T056, T057 (AuthContext + useAuth hook)

# Developer B
Work on T058, T059 (TelegramAuthButton + WelcomeScreen)

# Developer C
Work on T060, T061 (ProfileView + OnboardingTutorial)
```

### Phase 7 (User Story 5) - Parallel Tasks

**Game Logic Tests** (T128-T134): Can all be written simultaneously by different developers

**Frontend Components** (T157-T164): 8 components can be built in parallel

---

## MVP Completion Checklist

### Phase 1-7 Completion (MVP Ready)

✅ **Authentication**: Users can authenticate via Telegram
✅ **Wallet**: Deposit, withdraw, balance management working
✅ **Admin Withdrawals**: Manual approval workflow functional
✅ **Room Discovery**: Browse and join rooms operational
✅ **Gameplay**: Complete Texas Hold'em mechanics with real-time updates
✅ **Testing**: 70% code coverage achieved
✅ **Performance**: <500ms action processing, <1s WebSocket latency

### Launch Criteria

- [ ] All P1 user stories (1, 2, 3, 5, 9) implemented and tested
- [ ] E2E tests passing for critical user journeys
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Production deployment successful
- [ ] Monitoring and alerts configured
- [ ] User onboarding tutorial functional
- [ ] Admin controls operational

---

## Notes

**TDD Enforcement**: Every task MUST have corresponding tests written BEFORE implementation. Pull requests without tests will be rejected.

**Localization Readiness**: Use resource keys (e.g., `t('game.INSUFFICIENT_BALANCE')`) instead of hardcoded strings from Day 1.

**Icon Usage**: Use lucide-react icons only. No emojis in production UI.

**Commit Convention**: Follow conventional commits (feat, fix, test, refactor, docs) without AI attribution.

**Parallel Work**: Tasks marked [P] can be executed by different team members simultaneously to accelerate delivery.

**Independent Testing**: Each user story can be tested independently - no need to complete all stories before testing.

---

**Generated**: 2025-01-15
**Branch**: `001-poker-platform-mvp`
**Next Command**: Start Phase 1 (Setup & Infrastructure)
