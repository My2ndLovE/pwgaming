# Technical Debt Register
# Project: PWGaming Texas Hold'em Poker Platform MVP
# Last Updated: 2025-11-16

> **Purpose**: Track deliberately deferred technical work, shortcuts taken for MVP speed, and items requiring future refinement. All items listed here MUST be addressed before production launch or as specified in "When to Address" column.

## 📋 Tracking Format

Each item includes:
- **ID**: Unique identifier (TD-XXX)
- **Category**: Type of debt (Performance, Security, UX, Infrastructure, etc.)
- **Description**: What was deferred and why
- **Impact**: Risk level (Low/Medium/High/Critical)
- **When to Address**: Phase or milestone trigger
- **Related Tasks**: Link to tasks.md entries
- **Estimated Effort**: Time to resolve

---

## 🔴 Critical Priority (Must fix before production)

### TD-001: Rate Limiting Implementation
- **Category**: Security
- **Description**: No rate limiting on API endpoints or WebSocket events. Vulnerable to DoS attacks.
- **Impact**: Critical
- **When to Address**: Phase 7B (before MVP launch)
- **Related Tasks**: NEW - T186.5 needed
- **Estimated Effort**: 4h
- **Resolution**: Implement Redis-based rate limiter (express-rate-limit + rate-limit-redis)

### TD-002: Localization Infrastructure Setup
- **Category**: UX / Architecture
- **Description**: Constitution mandates "NO hardcoded strings" but no i18n setup exists. Currently ALL strings are hardcoded.
- **Impact**: High
- **When to Address**: Phase 7C or before multi-language launch
- **Related Tasks**: NEW - T203 needed (Phase 7C)
- **Estimated Effort**: 12h
- **Resolution**:
  - Install next-i18next / i18next
  - Create locales structure (en/vi/th)
  - Extract all hardcoded strings
  - Add translation helpers
  - Update all components to use t() function

### TD-003: Database Migration System
- **Category**: Infrastructure
- **Description**: No migration framework setup. Schema changes require manual SQL.
- **Impact**: High
- **When to Address**: Phase 7B (before T184 state persistence)
- **Related Tasks**: NEW - T184.0 (prerequisite for T184)
- **Estimated Effort**: 4h
- **Resolution**:
  - Configure TypeORM migrations
  - Create initial migration for all entities
  - Add migration scripts to package.json
  - Document migration workflow

### TD-004: Structured Logging System
- **Category**: Operations / Debugging
- **Description**: Using console.log for all logging. No structured logs, no log levels, no external aggregation.
- **Impact**: High
- **When to Address**: Phase 7B
- **Related Tasks**: NEW - T187.5 needed
- **Estimated Effort**: 6h
- **Resolution**:
  - Install winston or pino
  - Configure log levels (debug/info/warn/error)
  - Add request ID tracking
  - Set up log rotation
  - Add correlation IDs for distributed tracing

### TD-005: Error Tracking and Monitoring
- **Category**: Operations
- **Description**: No error tracking service (Sentry, Rollbar, etc.). Errors only visible in server logs.
- **Impact**: High
- **When to Address**: Phase 7C
- **Related Tasks**: NEW - T204 needed (Phase 7C)
- **Estimated Effort**: 4h
- **Resolution**:
  - Install @sentry/node and @sentry/nextjs
  - Configure error reporting
  - Add source map upload
  - Set up alert rules

---

## 🟡 High Priority (Should fix before beta)

### TD-006: PHE TypeScript Type Definitions
- **Category**: Developer Experience
- **Description**: Using PHE library without comprehensive TypeScript types. Only minimal types created for MVP.
- **Impact**: Medium
- **When to Address**: Phase 7C
- **Related Tasks**: NEW - T205 needed
- **Estimated Effort**: 4h
- **Resolution**:
  - Create comprehensive @types/phe declaration file
  - Document all PHE functions
  - Consider contributing types upstream to DefinitelyTyped

### TD-007: React Error Boundaries
- **Category**: UX / Reliability
- **Description**: No error boundaries in React components. Any component error crashes entire app.
- **Impact**: High
- **When to Address**: Phase 7A or 7C
- **Related Tasks**: NEW - T165.5 needed (add to Phase 7A)
- **Estimated Effort**: 3h
- **Resolution**:
  - Create ErrorBoundary component
  - Wrap game page and key components
  - Add fallback UI with retry button
  - Report errors to error tracking service

### TD-008: WebSocket Connection Limits
- **Category**: Performance / Security
- **Description**: No limit on WebSocket connections per user. Could be exploited for resource exhaustion.
- **Impact**: Medium
- **When to Address**: Phase 7B
- **Related Tasks**: NEW - T187.6 needed
- **Estimated Effort**: 2h
- **Resolution**:
  - Implement connection limit per user (max 3-5)
  - Add connection pooling
  - Add graceful connection rejection

### TD-009: Session Management and Cleanup
- **Category**: Performance / Security
- **Description**: No automatic cleanup of expired sessions. Redis could accumulate stale data.
- **Impact**: Medium
- **When to Address**: Phase 7B
- **Related Tasks**: NEW - T187.7 needed
- **Estimated Effort**: 3h
- **Resolution**:
  - Implement TTL on all Redis keys
  - Add session cleanup cron job
  - Monitor Redis memory usage

### TD-010: CORS Configuration
- **Category**: Security
- **Description**: CORS currently set to '*' (allow all origins). Production requires strict origin control.
- **Impact**: High
- **When to Address**: Phase 7B
- **Related Tasks**: NEW - T186.6 needed
- **Estimated Effort**: 1h
- **Resolution**:
  - Configure allowed origins from environment variables
  - Set proper CORS headers for credentials
  - Test cross-origin requests

### TD-011: Security Headers (Helmet.js)
- **Category**: Security
- **Description**: No security headers configured (CSP, X-Frame-Options, etc.)
- **Impact**: Medium
- **When to Address**: Phase 7B
- **Related Tasks**: NEW - T186.7 needed
- **Estimated Effort**: 2h
- **Resolution**:
  - Install helmet.js
  - Configure CSP policy
  - Add HSTS headers
  - Configure X-Frame-Options

### TD-012: Request Validation Middleware
- **Category**: Security
- **Description**: Limited input validation on API endpoints. Using basic TypeScript types only.
- **Impact**: Medium
- **When to Address**: Phase 7B
- **Related Tasks**: NEW - T186.8 needed
- **Estimated Effort**: 4h
- **Resolution**:
  - Install class-validator and class-transformer
  - Create DTO classes for all endpoints
  - Add validation pipes
  - Add sanitization for XSS prevention

---

## 🟢 Medium Priority (Nice to have before production)

### TD-013: HTTP Response Compression
- **Category**: Performance
- **Description**: WebSocket compression implemented (T173) but HTTP responses not compressed.
- **Impact**: Low
- **When to Address**: Phase 7C
- **Related Tasks**: NEW - T187.8 needed
- **Estimated Effort**: 1h
- **Resolution**: Install compression middleware

### TD-014: Health Check Endpoints
- **Category**: Operations
- **Description**: Basic /health endpoint exists but doesn't check dependencies (DB, Redis, etc.)
- **Impact**: Medium
- **When to Address**: Phase 7C
- **Related Tasks**: NEW - T206 needed
- **Estimated Effort**: 3h
- **Resolution**:
  - Implement /health/liveness (server up)
  - Implement /health/readiness (dependencies healthy)
  - Check PostgreSQL connection
  - Check Redis connection
  - Return detailed health status

### TD-015: Graceful Shutdown Handling
- **Category**: Reliability
- **Description**: No graceful shutdown logic. Server restart could interrupt active games.
- **Impact**: Medium
- **When to Address**: Phase 7B
- **Related Tasks**: NEW - T184.5 needed
- **Estimated Effort**: 4h
- **Resolution**:
  - Listen for SIGTERM/SIGINT
  - Stop accepting new connections
  - Wait for active games to complete (with timeout)
  - Save all state to Redis/PostgreSQL
  - Close database connections

### TD-016: Environment Configuration Management
- **Category**: Operations
- **Description**: .env file handling is basic. No validation, no type safety, no documentation.
- **Impact**: Medium
- **When to Address**: Phase 7C
- **Related Tasks**: NEW - T207 needed
- **Estimated Effort**: 3h
- **Resolution**:
  - Create config module with validation
  - Document all required env vars
  - Add .env.example with descriptions
  - Validate on startup (fail fast if misconfigured)

### TD-017: Database Connection Pooling Configuration
- **Category**: Performance
- **Description**: T187.4 mentions connection pooling but no explicit configuration task.
- **Impact**: Medium
- **When to Address**: Phase 7B
- **Related Tasks**: Add to T187.4 acceptance criteria
- **Estimated Effort**: 2h (included in T187.4)
- **Resolution**:
  - Configure TypeORM pooling (max 20, min 5)
  - Add connection timeout settings
  - Monitor pool utilization

### TD-018: Redis Clustering for Production
- **Category**: Scalability
- **Description**: Single Redis instance. Production needs clustering for high availability.
- **Impact**: Low (MVP), High (Production)
- **When to Address**: Phase 8 or before production
- **Related Tasks**: NEW - Phase 8 Infrastructure task
- **Estimated Effort**: 8h
- **Resolution**:
  - Set up Redis Sentinel or Redis Cluster
  - Update adapter for cluster mode
  - Test failover scenarios

### TD-019: Redis State Backup Strategy
- **Category**: Reliability / Operations
- **Description**: T200 mentions PostgreSQL backup but no Redis backup strategy for active game state.
- **Impact**: Medium
- **When to Address**: Phase 7C (T200)
- **Related Tasks**: Add to T200 deliverables
- **Estimated Effort**: 2h (included in T200)
- **Resolution**:
  - Configure Redis RDB snapshots
  - Set up AOF (Append Only File)
  - Document restore procedures

### TD-020: WebSocket Token Refresh
- **Category**: Security / UX
- **Description**: No token refresh mechanism for long-running WebSocket connections.
- **Impact**: Medium
- **When to Address**: Phase 7B
- **Related Tasks**: NEW - T185.5 needed
- **Estimated Effort**: 4h
- **Resolution**:
  - Implement token refresh WebSocket event
  - Add client-side refresh logic
  - Handle token expiration gracefully

### TD-021: Session Token Expiration Handling
- **Category**: Security / UX
- **Description**: No clear handling of expired JWT tokens in frontend.
- **Impact**: Medium
- **When to Address**: Phase 7B or 7C
- **Related Tasks**: NEW - T208 needed
- **Estimated Effort**: 3h
- **Resolution**:
  - Add axios interceptor for 401 responses
  - Implement token refresh flow
  - Redirect to login on unrecoverable expiration

---

## 🔵 Low Priority (Post-MVP enhancements)

### TD-022: Tablet-Specific Layouts
- **Category**: UX
- **Description**: T193 mentions tablet testing but no tablet-optimized UI implementation.
- **Impact**: Low
- **When to Address**: Phase 7C or Phase 8
- **Related Tasks**: NEW - T209 needed
- **Estimated Effort**: 8h
- **Resolution**:
  - Design tablet layout (landscape poker table)
  - Implement responsive breakpoints
  - Test on iPad and Android tablets

### TD-023: Landscape Orientation Support
- **Category**: UX
- **Description**: T193 tests landscape but no implementation task for landscape-optimized UI.
- **Impact**: Low
- **When to Address**: Phase 7C or Phase 8
- **Related Tasks**: NEW - T210 needed
- **Estimated Effort**: 6h
- **Resolution**:
  - Design landscape poker table layout
  - Implement orientation detection
  - Add landscape-specific styles

### TD-024: Vibration Feedback Implementation
- **Category**: UX
- **Description**: T188 mentions vibration feedback but not as explicit implementation task.
- **Impact**: Low
- **When to Address**: Phase 7C (included in T188)
- **Related Tasks**: Add to T188 acceptance criteria
- **Estimated Effort**: 2h (included in T188)
- **Resolution**:
  - Use Vibration API
  - Add vibration on actions (bet, win, fold)
  - Add settings toggle

### TD-025: Sound Effects System
- **Category**: UX
- **Description**: T189 mentions sound toggle but no sound implementation task.
- **Impact**: Low
- **When to Address**: Phase 7C or Phase 8
- **Related Tasks**: NEW - T211 needed
- **Estimated Effort**: 8h
- **Resolution**:
  - Select/create sound assets (cards dealing, chips, win)
  - Implement audio player service
  - Add sound effects to all game events
  - Implement volume control

### TD-026: Dark Mode Implementation
- **Category**: UX
- **Description**: T189 mentions dark mode but needs explicit implementation task.
- **Impact**: Low
- **When to Address**: Phase 7C or Phase 8
- **Related Tasks**: NEW - T212 needed
- **Estimated Effort**: 6h
- **Resolution**:
  - Design dark theme color palette
  - Implement theme switching (Tailwind dark mode)
  - Persist theme preference
  - Test readability and contrast

### TD-027: Keyboard Shortcuts Implementation
- **Category**: UX / Accessibility
- **Description**: T189 lists keyboard shortcuts (F/C/R) but no implementation task.
- **Impact**: Low
- **When to Address**: Phase 7C (included in T189)
- **Related Tasks**: Add to T189 acceptance criteria
- **Estimated Effort**: 3h (included in T189)
- **Resolution**:
  - Implement keyboard event listeners
  - Add visual shortcut hints
  - Disable during text input

### TD-028: Hand Replay Backend Implementation
- **Category**: Operations / Admin
- **Description**: T202 mentions hand replay viewer but needs backend shuffle seed storage.
- **Impact**: Low
- **When to Address**: Phase 7C
- **Related Tasks**: NEW - T213 needed (prerequisite for T202)
- **Estimated Effort**: 4h
- **Resolution**:
  - Store shuffle seed in game_hands table
  - Create replay reconstruction endpoint
  - Generate action-by-action replay data

### TD-029: Shuffle Seed Storage System
- **Category**: Audit / Compliance
- **Description**: Required for hand replay and dispute resolution. Not explicitly tracked.
- **Impact**: Medium
- **When to Address**: Phase 7B (T184)
- **Related Tasks**: Add to T184.2 deliverables
- **Estimated Effort**: 1h (included in T184.2)
- **Resolution**:
  - Add shuffle_seed column to game_hands
  - Store crypto.randomBytes seed
  - Document seed-based replay algorithm

---

## 📊 Summary Statistics

- **Total Items**: 29
- **Critical**: 5 items (17%)
- **High**: 7 items (24%)
- **Medium**: 10 items (35%)
- **Low**: 7 items (24%)

**Estimated Total Effort**: ~130 hours

---

## 🔄 Review Process

This document should be reviewed:
- At the end of each Phase (7A, 7B, 7C)
- Before production deployment
- During sprint planning for prioritization
- When new technical decisions are made

**Last Review**: 2025-11-16 (Initial creation)
**Next Review**: End of Phase 7A
