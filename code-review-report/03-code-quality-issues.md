# Code Quality Issues & Best Practices

**Review Date:** 2025-11-17
**Total Issues:** 24 items

---

## Code Smells

### CS-001: TODO Comments in Production Code
**Severity:** 🟡 MEDIUM
**Count:** 4 instances

**Locations:**
```typescript
// game.gateway.ts:86
smallBlind: 50, // TODO: Load from room config

// game.gateway.ts:604
chipStack: 1000, // TODO: Track chip stacks

// game.gateway.ts:374
// TODO: Remove player from active hand if mid-hand

// game.gateway.ts:478
// TODO: Track action history in HandState for full replay
```

**Impact:**
- Incomplete features in production
- Technical debt accumulation
- Missing critical functionality

**Recommendation:**
Convert all TODOs to tracked issues in GitHub Projects, then remove comments.

---

### CS-002: Magic Numbers
**Severity:** 🟡 MEDIUM
**File:** Multiple files

**Examples:**
```typescript
// game.gateway.ts:137
}, 60000); // Magic number: 60 seconds

// game.gateway.ts:591
setTimeout(() => {
  this.startNewHand(roomId);
}, 5000); // Magic number: 5 seconds

// game-wallet.service.ts:44-45
private readonly MIN_BB_BUYIN = 20; // Not configurable
private readonly MAX_BB_BUYIN = 100;
```

**Recommendation:**
```typescript
// Create constants file
export const GAME_CONSTANTS = {
  RECONNECTION_GRACE_PERIOD_MS: 60000,
  NEW_HAND_DELAY_MS: 5000,
  ACTION_TIMEOUT_SECONDS: 30,
  MIN_BUYIN_BB: 20,
  MAX_BUYIN_BB: 100,
} as const;
```

---

### CS-003: Incomplete Error Messages
**Severity:** 🟡 MEDIUM
**File:** Multiple

**Examples:**
```typescript
// betting.service.ts:98
return { isValid: false, error: 'Fold action must have zero amount' };
// ✅ Good

// game-engine.service.ts:111
return { success: false, state: handState.state, error: 'Player not found' };
// ⚠️ Should include userId for debugging

// balance.service.ts:16-17
if (!user) {
  throw new BadRequestException('User not found');
  // ⚠️ Should include userId
}
```

**Recommendation:**
```typescript
// Always include context in errors
if (!user) {
  throw new BadRequestException(`User not found: ${userId}`);
}

if (!player) {
  return {
    success: false,
    state: handState.state,
    error: `Player not found: ${userId}`,
  };
}
```

---

## Architecture Issues

### ARCH-001: Circular Dependency Risk
**Severity:** 🟡 MEDIUM
**File:** Module structure

**Issue:**
```
GameModule → WalletModule (GameWalletService)
WalletModule → AuthModule (User entity)
AuthModule → (potential circular if it needs game data)
```

**Current Status:** ✅ No actual circular dependencies detected

**Recommendation:**
- Keep monitoring with `madge` tool
- Consider splitting shared entities into a `common` module

```bash
npm install --save-dev madge
madge --circular --extensions ts src/
```

---

### ARCH-002: Missing Repository Pattern Consistency
**Severity:** 🟢 LOW
**File:** Multiple services

**Issue:**
Some services use custom repositories (UserRepository), others don't (most entities).

**Inconsistency:**
```typescript
// auth module: Has custom repository
@InjectRepository(User)
private readonly userRepository: UserRepository  // ✅ Custom

// wallet module: Uses generic repository
@InjectRepository(Transaction)
private readonly transactionRepository: Repository<Transaction>  // ⚠️ Generic
```

**Recommendation:**
Create custom repositories for all complex entities or remove UserRepository and use only generic Repository.

---

### ARCH-003: Mixed Responsibility in Game Gateway
**Severity:** 🟡 MEDIUM
**File:** `game.gateway.ts`

**Issue:**
GameGateway handles too many responsibilities:
- WebSocket connection management
- Game state management
- Wallet integration
- Timeout management
- Crash recovery
- Player reconnection

**Lines of Code:** 789 lines (too large)

**Recommendation:**
Split into smaller, focused services:
```
GameGateway (WebSocket only)
├── GameSessionManager (player connections, reconnection)
├── GameStateOrchestrator (hand lifecycle, state transitions)
├── GameWalletIntegration (buy-in, cash-out)
└── CrashRecoveryService (recovery logic)
```

---

## Type Safety Issues

### TS-001: Missing Strict Null Checks
**Severity:** 🟡 MEDIUM
**File:** `tsconfig.json`

**Issue:**
```json
{
  "compilerOptions": {
    "strict": true,
    // Missing specific strictness flags
  }
}
```

**Recommendation:**
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "noImplicitAny": true,
    "alwaysStrict": true
  }
}
```

---

### TS-002: Any Types in Critical Code
**Severity:** 🟡 MEDIUM
**Count:** 12 instances

**Examples:**
```typescript
// game.gateway.ts:337
return { success: true, state: this.sanitizeState(room.handState!, userId) };
// Return type is 'any' instead of defined interface

// game.gateway.ts:769
private sanitizeState(handState: HandState, viewerUserId: string): any {
// Should return specific interface
```

**Recommendation:**
```typescript
interface SanitizedGameState {
  phase: HandPhase;
  dealerPosition: number;
  currentPosition: number;
  currentBet: number;
  minRaise: number;
  communityCards: string[];
  players: SanitizedPlayerState[];
}

private sanitizeState(
  handState: HandState,
  viewerUserId: string
): SanitizedGameState {
  // ...
}
```

---

## Performance Issues

### PERF-001: N+1 Query in Hand Completion
**Severity:** 🟡 MEDIUM
**File:** `game.gateway.ts:548-594`

**Issue:**
```typescript
// Saves to DB in a loop
await this.gameStateStore.saveCompletedHand(...);
await this.gameStateStore.deleteGameState(...);
// Could be batched
```

**Recommendation:**
Use batch operations or a single transaction.

---

### PERF-002: Excessive State Broadcasting
**Severity:** 🟢 LOW
**File:** `game.gateway.ts:683-706`

**Issue:**
Broadcasting full game state after every action, even for minor changes.

**Recommendation:**
Implement delta updates:
```typescript
// Instead of full state
this.server.to(roomId).emit('game:state', fullState);

// Send only changes
this.server.to(roomId).emit('game:state_delta', {
  type: 'PLAYER_ACTION',
  changes: { currentPosition: newPosition, currentBet: newBet }
});
```

---

### PERF-003: Missing Database Indexes
**Severity:** 🟡 MEDIUM
**File:** Entity definitions

**Missing Indexes:**
```typescript
// transaction.entity.ts
@Index(['userId', 'createdAt'])  // ✅ Has this

// game-hand.entity.ts
@Index(['roomId', 'completedAt'])  // ❌ MISSING
// Queries like "get completed hands for room" would be slow

// betting-action.entity.ts
@Index(['gameHandId', 'sequenceNumber'])  // ✅ Has this
```

**Recommendation:**
Add composite indexes for common query patterns.

---

## Testing Issues

### TEST-001: Missing Edge Case Tests
**Severity:** 🟡 MEDIUM

**Missing Test Scenarios:**
1. **Concurrent Actions:**
   - Two players acting simultaneously (race condition)
   - Multiple buy-ins from same user

2. **Network Issues:**
   - WebSocket disconnection mid-action
   - Reconnection with stale state

3. **Edge Cases:**
   - Player disconnects during showdown
   - Last player leaves table
   - Negative balance scenarios

4. **Security:**
   - SQL injection attempts in notes field
   - XSS payload in user inputs
   - Forged WebSocket messages

**Recommendation:**
Create `test/edge-cases/` directory with comprehensive edge case coverage.

---

### TEST-002: No Integration Tests
**Severity:** 🟠 HIGH

**Current:**
- ✅ Unit tests exist
- ❌ No integration tests
- ❌ No E2E tests

**Recommendation:**
Add integration tests for:
1. Complete poker hand flow
2. Wallet operations with DB
3. WebSocket game session

```bash
# Add to package.json
"test:integration": "jest --config ./test/jest-integration.json"
```

---

## Error Handling Issues

### ERR-001: Inconsistent Error Types
**Severity:** 🟡 MEDIUM

**Issue:**
Some methods throw exceptions, others return error objects:
```typescript
// Pattern 1: Throw
throw new BadRequestException('User not found');

// Pattern 2: Return error object
return { success: false, error: 'Player not found' };
```

**Recommendation:**
Standardize:
- **HTTP controllers:** Throw exceptions
- **Service/business logic:** Return Result<T, Error> objects
- **Internal methods:** Throw exceptions

---

### ERR-002: Missing Global Error Handling for WebSockets
**Severity:** 🟡 MEDIUM
**File:** WebSocket gateway

**Issue:**
If an error occurs in a WebSocket handler, it's not properly caught:
```typescript
@SubscribeMessage('game:action')
async handlePlayerAction(...) {
  // If error occurs here, socket connection might break
  const result = this.gameEngine.processAction(...);
}
```

**Recommendation:**
```typescript
@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    client.emit('game:error', {
      message: exception instanceof Error ? exception.message : 'Unknown error',
      timestamp: new Date(),
    });
  }
}

// Apply in gateway
@UseFilters(new WsExceptionFilter())
export class GameGateway {
  // ...
}
```

---

## Documentation Issues

### DOC-001: Missing API Documentation
**Severity:** 🟡 MEDIUM

**Current:**
- ❌ No Swagger/OpenAPI spec
- ❌ No API documentation
- ✅ Code comments exist

**Recommendation:**
```bash
npm install @nestjs/swagger
```

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('PWGaming API')
  .setDescription('Texas Hold\'em Poker Platform API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

---

### DOC-002: Missing WebSocket Event Documentation
**Severity:** 🟡 MEDIUM

**Current:**
WebSocket events are not documented anywhere.

**Recommendation:**
Create `docs/websocket-events.md`:
```markdown
# WebSocket Events

## Client → Server

### `game:join`
Joins a poker room with buy-in.

**Payload:**
\`\`\`typescript
{
  roomId: string;
  buyIn: number;  // 20-100 BB
}
\`\`\`

**Response:**
\`\`\`typescript
{
  success: boolean;
  buyIn?: number;
  error?: string;
}
\`\`\`
```

---

## Code Style Issues

### STYLE-001: Inconsistent Naming Conventions
**Severity:** 🟢 LOW

**Examples:**
```typescript
// Some use camelCase for interfaces
interface ActionResult { }

// Others use PascalCase
export interface ShowdownPlayer { }

// Some DTOs have 'Dto' suffix
export interface CreateDepositDto { }

// Others don't
export interface BuyInValidation { }
```

**Recommendation:**
Standardize in style guide:
- Interfaces: PascalCase
- DTOs: Always `*Dto` suffix
- Types: PascalCase with `Type` suffix (if needed to differentiate)

---

### STYLE-002: Inconsistent Import Ordering
**Severity:** 🟢 LOW

**Recommendation:**
Use `eslint-plugin-import` to enforce:
1. External dependencies
2. NestJS imports
3. Internal project imports
4. Relative imports

---

## Summary

| Category | Count | Severity Breakdown |
|----------|-------|-------------------|
| Code Smells | 3 | 3 Medium |
| Architecture | 3 | 2 Medium, 1 Low |
| Type Safety | 2 | 2 Medium |
| Performance | 3 | 2 Medium, 1 Low |
| Testing | 2 | 1 High, 1 Medium |
| Error Handling | 2 | 2 Medium |
| Documentation | 2 | 2 Medium |
| Code Style | 2 | 2 Low |
| **Total** | **24** | **1 High, 16 Medium, 7 Low** |

---

## Recommended Actions

**Immediate (1 week):**
1. Fix TEST-002 (Add integration tests)
2. Fix CS-001 (Convert TODOs to issues)
3. Fix ERR-002 (WebSocket error handling)
4. Fix DOC-001 (Add Swagger docs)

**Short-term (1 month):**
1. Fix ARCH-003 (Refactor GameGateway)
2. Fix PERF-003 (Add missing indexes)
3. Fix TEST-001 (Add edge case tests)
4. Fix TS-002 (Remove 'any' types)

**Long-term (3 months):**
1. Improve PERF-002 (Delta updates)
2. Standardize STYLE-001 (Naming conventions)
3. Monitor ARCH-001 (Circular dependencies)

---

**Next:** Review `04-performance-analysis.md`
