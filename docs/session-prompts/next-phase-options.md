# Next Phase Implementation - Session Prompt

**Feature**: 001-poker-platform-mvp
**Session Start Date**: [Fill in when starting]
**SpecKit Workflow**: `/speckit.implement` for selected phase

---

## Current Status Summary

**Completed**: ~150/342 tasks (44%)
**Tests Passing**: 230 backend tests (13 suites)
**Last Commit**: 546152b - refactor: standardize tasks.md to SpecKit format

### What's Complete

- ✅ Phase 2: Foundational services
- ✅ Phase 3: Authentication (33 tests, commit 6f89893)
- ✅ Phase 4: Wallet backend (39 tests, commit 9b76a07)
- ✅ Phase 5: Admin withdrawals backend
- ✅ Phase 6: Browse rooms backend
- ✅ Phase 7A: Poker game engine (200+ tests, commits a28b32c-e5732f1)
- ✅ T203: Localization (3 languages, commit 965d25b)
- ✅ Frontend: API integration (commit 25cfc08)

### What's Pending

**Priority Options**:

1. **Phase 7B: Production Hardening** (~90 hours)
   - Tasks: T177-T187
   - Critical for production deployment
   - Includes: burn cards, rake, rate limiting, logging

2. **Phase 1: Azure Deployment** (~50 hours)
   - Tasks: T008-T043
   - Required for production environment
   - Includes: infrastructure, CI/CD, database setup

3. **Phase 7C: Polish & Operations** (~130 hours)
   - Tasks: T188-T214
   - Includes: accessibility, comprehensive tests, docs
   - Note: T203 localization already complete

---

## Your Task: Choose Next Phase

**Read the options below, then decide which phase to implement.**

---

## Option 1: Phase 7B - Production Hardening

### Why Choose This

- Makes poker game production-ready
- Regulatory compliance (burn cards)
- Revenue generation (rake)
- Security hardening (rate limiting)
- Operational visibility (structured logging)

### SpecKit Workflow

```bash
# Step 1: Analyze current state
/speckit.analyze

# Step 2: Implement Phase 7B tasks
/speckit.implement --phase 7B

# Alternative: Manual implementation
# Follow tasks T177-T187 in tasks.md
```

### Key Tasks (11 main + ~70 sub-tasks)

**T177: Blind Posting System**
- Auto-post small/big blinds
- Heads-up special rules
- Big blind "option" logic
- All-in blind handling

**T178: Burn Cards & Dealer Button**
- Burn 1 card before flop/turn/river
- Dealer button rotation
- Position calculations

**T179: Buy-in/Cash-out/Rebuy**
- Buy-in validation (20-100 BB)
- Wallet integration (atomic transactions)
- Rebuy functionality

**T180: Rake & Platform Commission**
- 5% rake up to $3 cap
- Deduct before pot distribution
- Log to rake_history table

**T181: Betting Round Completion**
- Detect when round ends
- Big blind option logic
- Turn advancement

**T182: Showdown Logic**
- Card reveal order
- Mucking support
- All-in card reveal requirement

**T183: Side Pot Edge Cases**
- Odd chip distribution
- 4+ player all-ins
- Tied hand splits

**T184: State Persistence & Recovery**
- Save completed hands to PostgreSQL
- Action audit trail
- Shuffle seed logging
- State recovery from Redis

**T185: Reconnection & Disconnection**
- Full state restoration
- Action timer restoration
- 60-second grace period
- Auto-fold on timeout

**T186: Security & Anti-Cheating**
- Card visibility validation
- Action validation
- Action locking (prevent race conditions)
- Bot detection
- Multi-accounting detection

**T187: Performance & Optimization**
- <500ms action processing target
- 100 concurrent games load test
- WebSocket compression
- Database query optimization

### Success Criteria

- All T177-T187 tasks checked in tasks.md
- Tests passing for all new features
- Performance benchmarks met
- Security audit completed
- Documentation updated

---

## Option 2: Phase 1 - Azure Deployment

### Why Choose This

- Deploy to production environment
- Enable real user testing
- Validate infrastructure scaling
- Set up CI/CD pipelines

### SpecKit Workflow

```bash
# Step 1: Review deployment tasks
cat specs/001-poker-platform-mvp/tasks.md | grep -A 5 "Phase 1"

# Step 2: Implement deployment tasks
/speckit.implement --phase 1

# Manual implementation
# Follow tasks T008-T043 in tasks.md
```

### Key Tasks (36 tasks)

**Azure Infrastructure (T008-T017)**
- Install Azure CLI
- Create resource group
- Set up Key Vault
- Create Container Registry
- PostgreSQL Flexible Server
- Redis Cache
- Store connection strings

**Database Setup (T018-T021)**
- Docker Compose for local dev
- TypeORM configuration
- Redis connection with TLS
- Migration scripts

**Testing Infrastructure (T022-T026)**
- Jest configuration
- Test database setup
- Coverage thresholds
- TDD helper scripts

**Environment & Configuration (T027-T030)**
- .env files
- Azure Key Vault integration
- Environment validation

**Azure Deployment (T031-T036)**
- Container Apps for backend
- Static Web Apps for frontend
- Application Insights
- Container registry push
- Environment variables
- Custom domains

**CI/CD Pipelines (T037-T043)**
- GitHub Actions workflows
- Test automation
- Backend deploy pipeline
- Frontend deploy pipeline
- Database migrations
- Rollback procedures

### Success Criteria

- Application deployed to Azure
- CI/CD pipelines working
- Database migrations automated
- Monitoring and logging active
- Production environment accessible

---

## Option 3: Phase 7C - Polish & Operations

### Why Choose This

- Improve user experience
- Ensure accessibility compliance
- Complete comprehensive testing
- Full documentation
- Admin operational tools

### SpecKit Workflow

```bash
# Step 1: Review polish tasks
/speckit.tasks --phase 7C

# Step 2: Implement polish tasks
/speckit.implement --phase 7C
```

### Key Tasks (27 main + ~50 sub-tasks)

**T188: Frontend Polish** (12h)
- Advanced UI components
- Animations and transitions
- Loading states
- Error boundaries

**T189: Accessibility** (8h)
- WCAG AA compliance
- Screen reader support
- Keyboard navigation
- Focus management

**T190-T197: Comprehensive Testing** (36h)
- Unit test suites
- Integration test suites
- E2E test scenarios
- Performance benchmarks
- Security test suite
- Accessibility tests
- Load tests
- Chaos engineering tests

**T198-T201: Documentation** (18h)
- User guide
- Admin guide
- API documentation
- Deployment guide

**T202: Admin Tools** (12h)
- Monitoring dashboard
- Game controls
- User management enhancements

**T204-T213: Infrastructure** (varies)
- Error tracking (Sentry)
- Health checks
- Token refresh
- Connection pooling
- Session cleanup
- Response compression
- Backup automation
- Disaster recovery

**T214: Final Integration** (8h)
- Cross-browser testing
- Mobile device testing
- Production readiness checklist
- Launch preparation

### Success Criteria

- WCAG AA compliance achieved
- 90%+ test coverage
- Complete documentation
- Admin tools operational
- Production checklist complete

---

## Recommended Next Steps

Based on current state and SpecKit workflow:

### **Recommended: Option 1 (Phase 7B)**

**Rationale**:
1. Poker game is core value proposition
2. Production hardening needed before real users
3. Regulatory compliance (burn cards) required
4. Revenue generation (rake) needed
5. Builds on completed Phase 7A

**Estimated Time**: ~90 hours (2-3 weeks)

**Starting Point**:
```bash
# Review tasks
cat specs/001-poker-platform-mvp/tasks.md | grep -A 200 "Phase 7B"

# Start implementation
/speckit.implement --tasks T177-T187
```

---

## How to Proceed

**Step 1**: Choose your option (1, 2, or 3)

**Step 2**: Use SpecKit workflow

```bash
# Option A: Let SpecKit guide you
/speckit.implement --phase [7B|1|7C]

# Option B: Manual implementation
# Open tasks.md
# Review task list for chosen phase
# Follow TDD workflow (RED-GREEN-REFACTOR)
# Check off tasks as you complete them
```

**Step 3**: Follow TDD Methodology

1. **RED**: Write failing test first
2. **GREEN**: Implement minimum code to pass
3. **REFACTOR**: Clean up while keeping tests green
4. **COMMIT**: After each logical unit of work

**Step 4**: Track Progress

- Use `/speckit.analyze` to validate consistency
- Update tasks.md with `[x]` checkboxes
- Commit regularly with descriptive messages
- Document completion in docs/progress/

---

## Project Context

### Tech Stack

**Backend**:
- NestJS 10.x (Node.js 18+)
- PostgreSQL 15 (TypeORM)
- Redis 7 (game state, caching)
- Socket.io 4.x (WebSocket)
- Jest (testing)

**Frontend**:
- Next.js 14 (App Router)
- React 18
- TypeScript 5.x
- Tailwind CSS
- Zustand (state)
- react-i18next (localization)

### Ports & Services

- Backend: http://localhost:4110
- Frontend: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Running Locally

```bash
# Start backend
cd backend && npm run start:dev

# Start frontend
cd frontend && npm run dev

# Run tests
cd backend && npm test

# Run with coverage
cd backend && npm run test:cov
```

### Git Workflow

```bash
# Current branch
git branch
# Should show: 001-poker-platform-mvp

# Recent commits
git log --oneline -10

# Stage and commit
git add .
git commit -m "feat(phase7b): implement burn cards functionality

- Add burn card logic to GameEngine
- Update tests for burn card scenarios
- 15 tests passing
- TDD compliance: RED-GREEN-REFACTOR"
```

---

## Constitution Compliance

**Must Follow**:

1. **TDD (Principle I)**: RED-GREEN-REFACTOR always
2. **Mobile-First (Principle II)**: Portrait orientation, 44px tap targets
3. **Financial Integrity (Principle III)**: Atomic transactions, audit trail
4. **Real-Time Performance (Principle IV)**: <500ms action processing
5. **Security (Principle V)**: Server-authoritative, validation, no card leaks
6. **Professional UI (Principle VI)**: No emoji in code, use icon libraries, localization
7. **Incremental Delivery (Principle VII)**: Small commits, testable units

**Reference**: `.specify/memory/constitution.md`

---

## Success Metrics

### Phase 7B Success

- [ ] All T177-T187 tasks checked
- [ ] 50+ new tests passing
- [ ] Burn cards implemented and tested
- [ ] Rake calculation working
- [ ] Performance targets met (<500ms p95)
- [ ] Security audit passed
- [ ] Documentation updated

### Phase 1 Success

- [ ] All T008-T043 tasks checked
- [ ] Application deployed to Azure
- [ ] CI/CD pipelines working
- [ ] Production database running
- [ ] Monitoring active
- [ ] Rollback tested

### Phase 7C Success

- [ ] All T188-T214 tasks checked
- [ ] WCAG AA compliant
- [ ] 90%+ test coverage
- [ ] Complete documentation
- [ ] Admin tools operational

---

## Quick Start Commands

### If Choosing Phase 7B

```bash
# 1. Review current poker game implementation
cd backend/src/modules/game
ls -la services/

# 2. Start with burn cards (T177)
# Read tasks.md for exact requirements

# 3. Write test first (RED)
# Create backend/test/unit/game/burn-cards.spec.ts

# 4. Implement (GREEN)
# Update backend/src/modules/game/services/game-engine.service.ts

# 5. Run tests
cd backend && npm test

# 6. Commit
git add . && git commit -m "feat(game): implement burn card functionality"
```

### If Choosing Phase 1

```bash
# 1. Install Azure CLI
az --version

# 2. Login to Azure
az login

# 3. Create resource group (T009)
az group create --name poker-platform-rg --location southeastasia

# 4. Follow tasks T010-T017 for infrastructure setup
```

### If Choosing Phase 7C

```bash
# 1. Review accessibility requirements
# Read WCAG AA guidelines

# 2. Start with frontend polish (T188)
cd frontend/components

# 3. Add accessibility attributes
# aria-labels, semantic HTML, keyboard nav

# 4. Test with screen reader
# Install NVDA or VoiceOver
```

---

## File References

**Key Files**:
- `specs/001-poker-platform-mvp/spec.md` - Feature specification
- `specs/001-poker-platform-mvp/plan.md` - Implementation plan
- `specs/001-poker-platform-mvp/tasks.md` - Task list (use this!)
- `.specify/memory/constitution.md` - Project principles
- `docs/progress/` - Implementation notes

**Latest Documentation**:
- `docs/progress/20-option1-and-3-complete.md` - Most recent completion summary
- `docs/progress/18-autonomous-backend-completion.md` - Backend implementation details
- `docs/progress/15-phase7a-final-complete.md` - Phase 7A details

---

## Your Next Message

After choosing a phase, start with:

```
I choose Option [1/2/3]: [Phase Name]

Please help me implement this phase following SpecKit workflow.
Use /speckit.implement or guide me through the task list.
```

**Example**:
```
I choose Option 1: Phase 7B - Production Hardening

Please help me implement this phase following SpecKit workflow.
Start with T177 (Blind Posting System) and follow TDD.
```

---

**End of Session Prompt**

Copy this entire file and paste it as your first message in a new Claude Code session.
