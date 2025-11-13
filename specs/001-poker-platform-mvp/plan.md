# Implementation Plan: Texas Poker Platform MVP

**Branch**: `001-poker-platform-mvp` | **Date**: 2025-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-poker-platform-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a Telegram mini app + web platform for Texas Hold'em poker with real-time multiplayer gameplay, room management, integrated payment system, and comprehensive admin controls. The MVP focuses on delivering core poker gameplay (authentication, wallet, game rooms, Texas Hold'em cash games) with manual admin withdrawal approval, mobile-first design, and professional UI/UX standards.

**Technical Approach**: NestJS backend with modular architecture (Auth, Game, Wallet, Room, Admin modules), PostgreSQL for transactional data, Redis for real-time game state, Socket.io for WebSocket communication, Next.js frontend with mobile-first responsive design, TDD methodology with Jest/Supertest, and comprehensive error handling with exception filters and circuit breakers.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 18+ LTS (backend), TypeScript 5.x with React 18 (frontend)
**Primary Dependencies**:
- Backend: NestJS 10.x, Socket.io 4.x, TypeORM 0.3.x, class-validator, class-transformer, bcrypt, pokersolver, opossum (circuit breaker)
- Frontend: Next.js 14.x, React 18, Tailwind CSS, lucide-react (icons), Socket.io-client, Telegram Mini App SDK
- Testing: Jest, Supertest, @nestjs/testing, React Testing Library

**Storage**:
- PostgreSQL 15+ (ACID transactions, user accounts, transactions, game history, audit logs)
- Redis 7+ (active game state, player sessions, room lists, pub/sub for scaling)

**Testing**: Jest (unit tests, 70% coverage), Supertest (integration tests), Cucumber (E2E tests), TDD methodology (Red-Green-Refactor)

**Target Platform**:
- Primary: Telegram Mini App (mobile-first, portrait orientation)
- Secondary: Web application (responsive desktop fallback)
- Server: Azure Container Apps (Southeast Asia region, auto-scaling)

**Project Type**: Web application (separate backend and frontend)

**Performance Goals**:
- Game actions processed in <500ms (p95)
- WebSocket latency <1 second for state updates
- API response time <100ms read, <200ms write (p95)
- Database queries <50ms (p95)
- Redis operations <10ms (p95)
- Frontend: <2s First Contentful Paint, <3s Time to Interactive on 3G
- Concurrent capacity: 10 game rooms with 6 players each (60 concurrent players MVP)

**Constraints**:
- Mobile-first design (portrait-optimized, 44x44px minimum touch targets)
- Real-time gameplay requirement (<1s latency)
- Financial integrity (atomic transactions, zero discrepancies)
- Security: cryptographic RNG, server-authoritative state, rate limiting (100 req/min per user)
- TDD mandatory (no production code without failing test first)
- NO hardcoded strings (localization-ready)
- NO emojis in production UI (use lucide-react icons)
- Manual admin withdrawal approval (no automation in MVP)
- English language only (MVP constraint, i18n infrastructure ready)

**Scale/Scope**:
- MVP: 100 concurrent players across multiple tables
- 12 user stories (7 P1, 3 P2, 2 P3)
- 120 functional requirements (including TDD, localization, error handling)
- 20 success criteria with measurable KPIs
- 8-week development timeline (7 phases)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase 0 - Pre-Development Gates

- [x] **TDD approach documented**: TDD methodology enforced across all phases with RED-GREEN-REFACTOR workflow (FR-099, SC-016)
- [x] **Mobile-first design considerations**: Portrait-optimized layouts, bottom navigation, touch-friendly controls (44x44px), Telegram Mini App priority (FR-113)
- [x] **Financial integrity measures**: Atomic transactions (FR-013, FR-096), audit logs (FR-092 to FR-097), pessimistic locking for concurrent updates, double-entry accounting
- [x] **Performance requirements defined**: <500ms game actions (SC-006), <1s real-time updates (SC-004), database/Redis query targets, frontend load time budgets
- [x] **Security requirements identified**: Cryptographic RNG (FR-084), server-side validation (FR-085), rate limiting (FR-088), JWT auth, WebSocket security
- [x] **UI/UX standards referenced**: lucide-react icons (FR-109), NO emojis (FR-110), professional animations, consistent design system (FR-111)
- [x] **User story independence verified**: 12 stories with independent acceptance criteria, P1 stories form complete MVP, stories can be developed/tested independently

**Status**: ✅ PASSED - All constitutional gates satisfied

### Complexity Tracking

No violations requiring justification. Project structure aligns with constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/001-poker-platform-mvp/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   ├── openapi.yaml     # REST API spec
│   └── websocket.yaml   # WebSocket event spec
├── checklists/          # Existing requirements checklist
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/                 # NestJS API server
├── src/
│   ├── modules/
│   │   ├── auth/        # FR-001 to FR-005: Telegram OAuth, JWT
│   │   │   ├── guards/  # TelegramAuthGuard, AdminRoleGuard
│   │   │   ├── strategies/ # JWT strategy
│   │   │   └── decorators/ # @CurrentUser()
│   │   ├── wallet/      # FR-006 to FR-015: Transactions, balance
│   │   │   ├── services/    # TransactionService, BalanceService
│   │   │   ├── pipes/       # BalanceValidationPipe
│   │   │   └── interceptors/ # TransactionInterceptor (atomic)
│   │   ├── game/        # FR-025 to FR-041: Poker logic
│   │   │   ├── engine/      # Hand evaluation, pot calculation
│   │   │   ├── entities/    # GameState, Card, Deck
│   │   │   └── validators/  # BetAmountValidationPipe
│   │   ├── room/        # FR-016 to FR-024: Room management
│   │   │   ├── pipes/       # RoomSettingsValidationPipe
│   │   │   └── filters/     # Room query filters
│   │   ├── realtime/    # FR-042 to FR-049: WebSocket gateway
│   │   │   ├── gateways/    # GameGateway, LobbyGateway
│   │   │   ├── adapters/    # Redis adapter for scaling
│   │   │   └── guards/      # WsAuthGuard
│   │   ├── admin/       # FR-050 to FR-083: Admin operations
│   │   │   ├── guards/      # AdminRoleGuard (RBAC)
│   │   │   └── interceptors/ # AuditInterceptor
│   │   ├── audit/       # FR-092 to FR-097: Audit logging
│   │   │   └── services/    # AuditLogService
│   │   └── i18n/        # FR-104 to FR-108: Localization (future)
│   │       └── resources/   # en/game.json, en/wallet.json
│   ├── common/
│   │   ├── filters/         # Global exception filter (FR-115)
│   │   ├── interceptors/    # Logging, error handling
│   │   ├── guards/          # Rate limiting (FR-088)
│   │   └── pipes/           # Global validation pipe
│   ├── config/
│   │   └── configuration.ts # Environment-based config
│   └── main.ts              # Bootstrap application
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── migrations/              # TypeORM database migrations
└── package.json

frontend/                # Next.js web app + Telegram Mini App
├── app/                 # Next.js 14 App Router
│   ├── (auth)/          # Authentication routes
│   ├── (game)/          # Game routes (rooms, play)
│   ├── (wallet)/        # Wallet routes (deposit, withdraw)
│   ├── (profile)/       # Profile routes
│   └── (admin)/         # Admin dashboard routes
├── components/
│   ├── game/            # Card, Table, BettingControls, Pot
│   ├── room/            # RoomList, RoomCard, CreateRoomModal
│   ├── wallet/          # DepositModal, WithdrawModal, TransactionHistory
│   ├── ui/              # shadcn/ui components, lucide-react icons
│   └── layout/          # Header, BottomNav, Sidebar
├── lib/
│   ├── socket/          # Socket.io client wrapper
│   ├── api/             # REST API client (fetch wrappers)
│   └── i18n/            # Localization utilities (future)
├── hooks/               # useWebSocket, useAuth, useWallet, useGame
├── public/
│   └── assets/          # Card images (WebP), favicon
├── __tests__/
│   ├── components/
│   └── integration/
└── package.json

docs/                    # Project documentation (existing)
├── intro.md             # Project overview (deleted, moved to specs/)
├── specify-prompt.md    # Feature description
└── texas-holdem-technical-reference.md # 1365-line technical guide

.specify/                # Specify tooling (existing)
├── memory/
│   └── constitution.md  # Project constitution (v1.0.0)
└── scripts/
    └── powershell/      # Setup and update scripts
```

**Structure Decision**: Web application structure with separate `backend/` and `frontend/` directories. Backend follows NestJS modular architecture with clear separation of concerns (controllers → services → repositories). Frontend uses Next.js App Router with feature-based organization. Testing infrastructure mirrors source structure for easy navigation.

## Phase 0: Research & Technology Decisions

### Research Topics

1. **Telegram Mini App Integration**
   - Topic: Telegram Mini App SDK authentication flow
   - Rationale: Primary delivery platform requires seamless Telegram OAuth
   - Research: Best practices for Telegram WebApp API, session management, user data handling
   - Output: Authentication strategy in research.md

2. **Texas Hold'em Hand Evaluation Library**
   - Topic: Production-ready poker hand evaluator for Node.js
   - Rationale: Core game logic requires battle-tested algorithm (7-card evaluation, tie-breaking)
   - Research: pokersolver vs phe vs custom implementation (performance, accuracy, maintainability)
   - Output: Library recommendation with benchmarks in research.md

3. **WebSocket Scaling with Redis**
   - Topic: Socket.io Redis adapter for horizontal scaling
   - Rationale: Real-time gameplay requires pub/sub for multi-server deployment
   - Research: @socket.io/redis-adapter configuration, sticky sessions, connection pooling
   - Output: Scaling architecture in research.md

4. **Payment Gateway Integration**
   - Topic: Third-party payment gateway API patterns
   - Rationale: Deposit/withdrawal flow requires external integration
   - Research: Circuit breaker pattern (opossum), retry logic, webhook handling, idempotency
   - Output: Payment gateway integration guide in research.md

5. **Database Transaction Patterns for Financial Integrity**
   - Topic: Pessimistic locking vs optimistic locking for concurrent balance updates
   - Rationale: Multiple players betting simultaneously requires conflict resolution
   - Research: TypeORM transaction isolation levels, SELECT FOR UPDATE, retry strategies
   - Output: Transaction pattern recommendations in research.md

6. **NestJS Testing Best Practices**
   - Topic: TDD workflow with NestJS, Jest, and Supertest
   - Rationale: 70% coverage requirement with TDD methodology
   - Research: Test module setup, dependency mocking, integration test patterns
   - Output: Testing guidelines in research.md

7. **Mobile-First UI Component Library**
   - Topic: Next.js component library with touch-optimized components
   - Rationale: Professional UI with 44x44px touch targets, responsive design
   - Research: shadcn/ui vs Ant Design vs Material-UI for mobile-first poker UI
   - Output: UI library recommendation in research.md

8. **Localization Infrastructure (i18n-ready)**
   - Topic: nestjs-i18n and next-intl setup for future multi-language support
   - Rationale: FR-104 to FR-108 require resource keys, no hardcoded strings
   - Research: Resource file structure, key naming conventions, fallback strategies
   - Output: i18n architecture in research.md

**Next Step**: Generate `research.md` using Task tool with general-purpose agent for comprehensive research on each topic.

## Azure Deployment Architecture

### Cloud Infrastructure (Microsoft Azure)

**Deployment Region**: Southeast Asia (Singapore) - `southeastasia`
- Primary market: Southeast Asia (Philippines, Thailand, Vietnam, Indonesia)
- Latency: 10-50ms to target markets
- Compliance: Singapore data residency for gambling licenses

**Core Services**:

| Component | Azure Service | SKU (MVP) | Monthly Cost | Rationale |
|-----------|---------------|-----------|--------------|-----------|
| **Backend API** | Azure Container Apps | 0.5 vCPU, 1GB RAM, 1 replica | $25 | Auto-scaling, WebSocket sticky sessions, serverless pricing |
| **Frontend** | Azure Static Web Apps | Free tier | $0 | CDN included, global edge caching, Telegram Mini App optimized |
| **Database** | PostgreSQL Flexible Server | B1ms (1 vCore, 2GB) | $25 | ACID transactions, TypeORM native, pessimistic locking |
| **Cache** | Azure Cache for Redis | Basic C1 (1GB) | $16 | Socket.io pub/sub, game state, session management |
| **Storage** | Blob Storage (Hot tier) | 1GB | <$1 | Card images (WebP), user avatars, CDN integration |
| **Secrets** | Key Vault | Standard | $0 (free tier) | JWT secrets, DB credentials, Telegram bot token |
| **Monitoring** | Application Insights | 5GB/month | $0 (free tier) | Custom metrics, alerts, financial event tracking |
| **Registry** | Container Registry | Basic | $5 | Docker image storage |
| **Total MVP** | | | **~$72/month** | **Scales to $323/month for 100+ concurrent players** |

**Architecture Decision: Express vs Fastify**

**RECOMMENDATION: NestJS with Express (Default)**

| Criterion | Express | Fastify | Winner |
|-----------|---------|---------|--------|
| Socket.io Maturity | Native, battle-tested | Adapter required | Express |
| Latency (p95) | 12.8ms | 6.3ms | Fastify |
| Throughput | 32k req/s | 68k req/s | Fastify |
| MVP Timeline Risk | Low | Medium | Express |
| Target (200ms p95) | ✅ Met (12.8ms) | ✅ Met (6.3ms) | Tie |

**Decision**: Start with **Express** for MVP (proven WebSocket support), evaluate Fastify migration when concurrent players exceed 300.

**WebSocket Configuration**:
```yaml
# Container Apps sticky sessions for Socket.io
sessionAffinity: sticky
transport: auto  # HTTP/1.1, HTTP/2, WebSocket
pingInterval: 10000ms
pingTimeout: 5000ms
```

**Database Configuration**:
```typescript
// Azure PostgreSQL with SSL
{
  type: 'postgres',
  host: 'poker-db.postgres.database.azure.com',
  ssl: { rejectUnauthorized: false },
  extra: {
    max: 20,  // Connection pool for 100 concurrent
    min: 2,
    idleTimeoutMillis: 30000,
  }
}
```

**Redis Configuration**:
```typescript
// Azure Redis with TLS
{
  host: 'poker-redis.redis.cache.windows.net',
  port: 6380,
  password: process.env.REDIS_KEY,
  tls: { servername: 'poker-redis.redis.cache.windows.net' },
  lazyConnect: true,
}
```

**Cost Optimization Strategies**:
1. **Auto-scaling**: Scale Container Apps to 1 replica during off-peak (save 50%)
2. **Reserved Capacity**: 1-year PostgreSQL reservation (save 32%)
3. **Blob Lifecycle**: Archive old game replays after 90 days
4. **Budget Alerts**: $80/month (MVP), $350/month (scale)

**Deployment Pipeline** (GitHub Actions + Azure):
```yaml
# Backend: Build → ACR → Container Apps
# Frontend: Build → Static Web Apps (automatic)
# Database: Migrations via TypeORM CLI
# Monitoring: Application Insights auto-instrumented
```

## Phase 1: Design & Contracts ✅ COMPLETED

**Generated Artifacts**:
1. ✅ `research.md`: 8 technology decisions with comprehensive research
2. ✅ `data-model.md`: 8 entity definitions with TypeORM decorators, validation, indexes
3. ✅ `contracts/openapi.yaml`: Complete REST API spec with 30+ endpoints (78KB)
4. ✅ `contracts/websocket.yaml`: Complete WebSocket event spec (45KB)
5. ✅ `quickstart.md`: Comprehensive developer onboarding guide with TDD workflow

**Design Deliverables**:
- ✅ 120 functional requirements mapped to concrete API endpoints
- ✅ DTOs defined with class-validator decorators
- ✅ WebSocket event payloads specified for game actions
- ✅ Database schema documented with relationships and 30+ indexes
- ✅ RFC 7807 Problem Details error format defined (aligned with FR-115)
- ✅ TDD workflow documented with Red-Green-Refactor examples
- ✅ Agent context updated (CLAUDE.md)

### Post-Design Constitution Re-evaluation

**Phase 1 - Post-Design Gates**:

- [x] **API contracts define all endpoints**: ✅ OpenAPI spec covers 30+ endpoints across 5 modules
- [x] **Data models document all entities**: ✅ 8 entities with complete TypeORM definitions, validation, relationships
- [x] **Integration points identified**: ✅ Telegram Mini App SDK, payment gateway, Redis pub/sub, Socket.io
- [x] **Error handling strategy defined**: ✅ Global exception filter, RFC 7807 format, WebSocket error events
- [x] **Quickstart documentation created**: ✅ Comprehensive developer onboarding guide with TDD workflow

**Status**: ✅ PASSED - All Phase 1 gates satisfied, ready for Phase 2 (Task Generation)

## Phase 2: Task Generation

**Next Command**: Run `/speckit.tasks` to generate dependency-ordered implementation tasks from:
- ✅ Phase 0 research decisions (8 topics resolved)
- ✅ Phase 1 design artifacts (data models, API contracts, quickstart)
- ✅ TDD workflow (test-first tasks for all features)
- ✅ 12 user stories with acceptance scenarios
- ✅ 120 functional requirements

---

**Status**: ✅ Phase 1 (Design & Contracts) COMPLETED
**Next Command**: `/speckit.tasks` to generate implementation tasks
**Branch**: `001-poker-platform-mvp`
**Artifacts Location**: `C:\WebDev\PWGaming_2\specs\001-poker-platform-mvp\`
