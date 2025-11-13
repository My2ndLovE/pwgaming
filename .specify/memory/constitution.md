<!--
Sync Impact Report:
Version Change: N/A → 1.0.0
Modified Principles: N/A (initial creation)
Added Sections:
  - Core Principles (7 principles)
  - Development Standards
  - Quality Gates
  - Governance
Templates Status:
  ✅ spec-template.md - reviewed, aligned with constitution
  ✅ plan-template.md - reviewed, Constitution Check section ready
  ✅ tasks-template.md - reviewed, TDD approach enforced
Follow-up TODOs: None
-->

# PWGaming Texas Poker Platform Constitution

## Core Principles

### I. Test-Driven Development (NON-NEGOTIABLE)

TDD is mandatory for all production code. The Red-Green-Refactor cycle MUST be strictly enforced:

- **Red**: Write a failing test first that defines the desired behavior
- **Green**: Write minimum code to make the test pass
- **Refactor**: Improve code quality while keeping tests passing
- **NO exceptions**: Production code MUST NOT be written without a failing test first

**Rationale**: Financial transactions and real-time gameplay require absolute correctness. TDD ensures reliability, prevents regressions, and serves as living documentation for critical poker game logic, wallet operations, and anti-cheating mechanisms.

### II. Mobile-First Design

All client-facing features MUST prioritize mobile user experience:

- Portrait-optimized layouts for Telegram Mini App
- Touch-friendly controls (minimum 44x44px tap targets)
- Bottom navigation for primary actions
- Swipe gestures for game interactions
- Responsive design that gracefully adapts to web version
- Performance budget: <3s Time to Interactive on 3G networks

**Rationale**: Primary delivery platform is Telegram Mini App. Users will play poker on mobile devices, requiring seamless mobile experience. Desktop web version is secondary.

### III. Financial Integrity

All financial operations MUST ensure data integrity and audit compliance:

- Atomic database transactions for balance updates (no partial updates)
- Double-entry accounting principles for all wallet operations
- Immutable audit logs for deposits, withdrawals, bets, and winnings
- Server-side validation of all financial transactions (never trust client)
- Transaction reconciliation checks on every balance update
- Admin approval workflow for withdrawals with full audit trail

**Rationale**: Platform handles real money. Any financial bug erodes user trust and creates legal liability. Zero tolerance for balance discrepancies or lost transactions.

### IV. Real-Time Performance

Game state updates MUST be delivered with minimal latency:

- Player actions propagate to all table participants in <500ms (p95)
- WebSocket message rate: 100 messages/second per table minimum
- Database queries complete in <50ms (p95)
- Redis operations complete in <10ms (p95)
- No blocking operations during active gameplay
- Graceful degradation under load (queue actions, not drop them)

**Rationale**: Poker requires real-time decision-making. Lag destroys user experience and creates unfair advantages. Competitive with established online poker platforms requires professional-grade performance.

### V. Security & Anti-Cheating

Platform MUST actively prevent cheating and ensure fair play:

- Cryptographically secure random number generation for card shuffles
- Server-authoritative game state (client cannot manipulate cards/pots)
- Action validation on server for every player decision
- Collision detection for duplicate cards
- IP and device tracking to detect multi-accounting
- Rate limiting on all API endpoints to prevent abuse
- Action timing analysis to detect bot patterns

**Rationale**: Fair play is foundational to gambling platforms. Single cheating incident can destroy platform reputation. Security measures must be proactive, not reactive.

### VI. Professional UI/UX Standards

User interface MUST meet professional gambling platform standards:

- Smooth animations (<16ms frame time, 60fps)
- Professional card assets (vector or high-res WebP)
- Clear visual feedback for all game actions
- Consistent design system across all screens
- Accessibility considerations (color contrast, screen reader labels)
- NO hardcoded strings (localization-ready from day one)
- NO emojis in production UI (use icon libraries: Lucide, Heroicons, etc.)

**Rationale**: Platform competes with established online poker sites. Unprofessional UI signals unreliability, especially for financial applications. Professional design builds user confidence.

### VII. Incremental Delivery & MVP Focus

Feature development MUST prioritize independently testable user stories:

- Each user story delivers standalone value
- P1 stories form minimum viable product
- Stories can be developed, tested, and deployed independently
- Avoid scope creep: "nice to have" features deferred post-MVP
- Working software over comprehensive documentation
- Simplest solution that meets requirements (YAGNI principle)

**Rationale**: MVP launch deadline is critical. Incremental delivery allows early user feedback and revenue generation. Complex features can be added after market validation.

## Development Standards

### Code Organization

**Backend (NestJS)**:
- Modular architecture: Auth, Game, Wallet, User, Admin modules
- Service layer for business logic
- Repository pattern for data access
- DTO validation with class-validator
- Clear separation: Controllers → Services → Repositories

**Frontend (Next.js)**:
- Component-driven architecture (shadcn/ui or similar)
- Server components where possible (performance)
- Client components only when interactivity required
- Custom hooks for shared logic
- Context/Zustand for state management

**Database**:
- PostgreSQL for transactional data (ACID compliance)
- Redis for game state and caching (performance)
- Proper indexing on all query columns
- Migration scripts for schema changes

### Testing Requirements

**Minimum Coverage**: 70% code coverage for business logic

**Test Types**:
1. **Unit Tests**: Pure functions, business logic, algorithms
2. **Integration Tests**: API endpoints, database operations, WebSocket events
3. **Contract Tests**: API contracts, WebSocket message formats
4. **End-to-End Tests**: Critical user journeys (registration, deposit, play hand, withdrawal)

**TDD Workflow**:
1. Write test describing expected behavior
2. Run test - verify it FAILS (RED)
3. Implement minimum code to pass test (GREEN)
4. Refactor code while keeping tests passing (REFACTOR)
5. Commit with passing tests

### Performance Standards

**API Response Times** (p95):
- Read operations: <100ms
- Write operations: <200ms
- Game actions: <500ms end-to-end

**Database**:
- Query time: <50ms (p95)
- Connection pool: 20-100 connections
- Indexed queries only for production

**Frontend**:
- First Contentful Paint: <2s
- Time to Interactive: <3s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1

### Security Standards

**Authentication**:
- Telegram OAuth for client authentication
- JWT tokens with 1-hour expiration
- Refresh token rotation on use
- Admin authentication with separate credentials

**Authorization**:
- Role-based access control (Player, Admin, SuperAdmin)
- Resource-level permissions
- API endpoint authorization middleware

**Data Protection**:
- HTTPS/TLS for all communications
- WebSocket Secure (wss://) for real-time data
- Environment variables for secrets (never commit)
- Encrypted database backups

**Input Validation**:
- Server-side validation for ALL inputs
- Sanitization to prevent XSS
- Parameterized queries to prevent SQL injection
- Rate limiting: 100 requests/minute per user

## Quality Gates

### Phase 0: Constitution Check (Before Development)

Every feature MUST pass constitutional alignment check:

- [ ] TDD approach documented in implementation plan
- [ ] Mobile-first design considerations addressed
- [ ] Financial integrity measures identified (if applicable)
- [ ] Performance requirements defined
- [ ] Security requirements identified
- [ ] UI/UX standards referenced
- [ ] User story independence verified

### Phase 1: Design Review (Before Implementation)

Design artifacts MUST be approved:

- [ ] API contracts define all endpoints
- [ ] Data models document all entities
- [ ] Integration points identified
- [ ] Error handling strategy defined
- [ ] Quickstart documentation created

### Phase 2: Implementation (During Development)

TDD cycle enforced:

- [ ] Test written and failing before implementation
- [ ] Implementation makes test pass
- [ ] Code refactored for clarity
- [ ] All tests passing before commit

### Phase 3: Code Review (Before Merge)

Pull requests MUST pass review gates:

- [ ] All tests passing (CI/CD)
- [ ] Code coverage meets 70% minimum
- [ ] No hardcoded strings (localization check)
- [ ] No emojis in production UI
- [ ] Performance benchmarks met
- [ ] Security checklist completed
- [ ] Documentation updated

### Phase 4: Deployment (Before Production)

Production readiness verified:

- [ ] Integration tests pass on staging
- [ ] Performance tests meet SLA targets
- [ ] Security audit completed
- [ ] Database migrations tested
- [ ] Rollback plan documented
- [ ] Monitoring and alerts configured

## Governance

### Amendment Process

Constitution changes require:

1. **Proposal**: Document proposed change with rationale
2. **Review**: Team review of implications
3. **Approval**: Technical lead or project owner approval
4. **Documentation**: Update constitution with new version
5. **Propagation**: Update all dependent templates and documentation
6. **Communication**: Notify all team members of changes

### Version Semantics

- **MAJOR**: Backward-incompatible changes (principle removal/redefinition)
- **MINOR**: New principle added or materially expanded guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance

- All code reviews MUST verify constitutional compliance
- Non-compliance requires explicit justification and approval
- Complexity violations tracked in plan.md Complexity Tracking table
- Audit reviews conducted before major releases

### Living Document

This constitution evolves with the project:

- Principles reflect current project needs and lessons learned
- Amendments welcomed when justified by experience
- Simplicity preferred over comprehensive rules
- Team consensus guides constitutional decisions

---

**Version**: 1.0.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-01-15
