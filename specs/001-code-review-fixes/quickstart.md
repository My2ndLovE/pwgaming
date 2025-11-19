# Quickstart Guide: Code Review Critical Fixes

**Feature**: Code Review Critical Fixes and Improvements
**Branch**: `001-code-review-fixes`
**Target**: Developers implementing the 8 critical fixes
**Time**: 2-3 days for all fixes

## Overview

This guide walks through implementing all critical security fixes, performance improvements, and stability enhancements identified in the code review. Follow the priority order (P0 → P1 → P2) for production readiness.

---

## Prerequisites

### Required Tools
- Node.js 18+ LTS
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Required Access
- Backend repository write access
- Frontend repository write access
- Database migration permissions
- Access to Sentry account

### Check Current Setup

```bash
# Verify Node version
node --version  # Should be 18+

# Verify PostgreSQL
psql --version  # Should be 15+

# Verify Redis
redis-cli --version  # Should be 7+

# Check existing services
docker-compose ps  # PostgreSQL and Redis should be running
```

---

## Phase 1: Critical Fixes (P0) - Production Blockers

### Fix 1: CORS Configuration (1.5 hours)

**Goal**: Prevent authentication bypass via CORS misconfiguration

**Steps**:

1. **Install dependencies** (none needed - using built-in NestJS)

2. **Create CORS configuration module**:

```bash
# Create config file
touch backend/src/config/cors.config.ts
```

```typescript
// backend/src/config/cors.config.ts
import { ConfigService } from '@nestjs/config';

export function validateCorsConfig(configService: ConfigService): void {
  const nodeEnv = configService.get<string>('NODE_ENV');
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  if (nodeEnv === 'production') {
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL must be set in production');
    }
    if (frontendUrl.includes('localhost')) {
      throw new Error('FRONTEND_URL cannot contain localhost in production');
    }
  }
}

export function getCorsOptions(configService: ConfigService) {
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const nodeEnv = configService.get<string>('NODE_ENV');

  return {
    origin: nodeEnv === 'production' ? frontendUrl : [frontendUrl, 'http://localhost:4120'],
    credentials: true,
  };
}
```

3. **Update main.ts**:

```typescript
// backend/src/main.ts
import { validateCorsConfig, getCorsOptions } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Validate CORS before starting
  validateCorsConfig(configService);

  // Apply CORS
  app.enableCors(getCorsOptions(configService));

  await app.listen(3000);
}
```

4. **Update .env.example**:

```bash
# .env.example
FRONTEND_URL=http://localhost:4120  # Development
# Production: FRONTEND_URL=https://poker.pwgaming.com
```

5. **Write tests**:

```bash
touch backend/tests/integration/cors-security.spec.ts
```

```typescript
// backend/tests/integration/cors-security.spec.ts
describe('CORS Security', () => {
  it('should reject requests from unauthorized origins in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://poker.pwgaming.com';

    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://malicious.com')
      .expect(403);
  });

  it('should fail to start without FRONTEND_URL in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.FRONTEND_URL;

    expect(() => bootstrap()).toThrow('FRONTEND_URL must be set');
  });
});
```

6. **Test and verify**:

```bash
# Test in development
npm run test:integration -- cors-security.spec.ts

# Test production config
NODE_ENV=production FRONTEND_URL=https://poker.pwgaming.com npm start
```

---

### Fix 2: Chip Stack Race Condition (4 hours)

**Goal**: Ensure atomic chip stack updates with mutex locks

**Steps**:

1. **Install async-mutex**:

```bash
cd backend
npm install async-mutex
npm install -D @types/async-mutex
```

2. **Update game.gateway.ts**:

```typescript
// backend/src/modules/game/gateways/game.gateway.ts
import { Mutex } from 'async-mutex';

@WebSocketGateway()
export class GameGateway implements OnModuleDestroy {
  private chipUpdateLocks = new Map<string, Mutex>();

  private async updateChipStacks(roomId: string, updates: ChipUpdate[]) {
    // Get or create room-specific lock
    if (!this.chipUpdateLocks.has(roomId)) {
      this.chipUpdateLocks.set(roomId, new Mutex());
    }

    const lock = this.chipUpdateLocks.get(roomId)!;

    // Execute atomically
    await lock.runExclusive(async () => {
      for (const update of updates) {
        const player = this.getPlayer(roomId, update.userId);
        player.chipStack += update.amount;

        if (player.chipStack < 0) {
          throw new Error(`Invalid chip stack: ${player.chipStack}`);
        }
      }

      // Broadcast update
      this.server.to(roomId).emit('game:chip_stack_update', {
        roomId,
        updates,
        timestamp: new Date(),
      });
    });
  }

  onModuleDestroy() {
    this.chipUpdateLocks.clear();
  }
}
```

3. **Write concurrency tests**:

```bash
touch backend/tests/integration/chip-stack-concurrency.spec.ts
```

```typescript
// backend/tests/integration/chip-stack-concurrency.spec.ts
describe('Chip Stack Concurrency', () => {
  it('should handle 100 concurrent updates without race conditions', async () => {
    const roomId = 'test-room';
    const initialStack = 1000;

    // Setup players
    const players = createPlayers(10, initialStack);

    // Simulate 100 concurrent chip updates
    const updates = Array(100).fill(null).map(() => ({
      userId: randomPlayer(players),
      amount: randomAmount(-100, 100),
    }));

    await Promise.all(
      updates.map(update => gateway.updateChipStacks(roomId, [update]))
    );

    // Verify total chips conserved
    const totalFinal = players.reduce((sum, p) => sum + p.chipStack, 0);
    const totalInitial = players.length * initialStack;

    expect(totalFinal).toBe(totalInitial);
  });
});
```

4. **Test and verify**:

```bash
npm run test:integration -- chip-stack-concurrency.spec.ts
```

---

### Fix 3: Cash-Out Verification (2.5 hours)

**Goal**: Verify cash-out amounts against game state

**Steps**:

1. **Update game-wallet.service.ts**:

```typescript
// backend/src/modules/wallet/services/game-wallet.service.ts
@Injectable()
export class GameWalletService {
  async processCashOut(dto: CashOutDto): Promise<Transaction> {
    // Verify chip stack
    const verifiedAmount = await this.verifyChipStack(
      dto.userId,
      dto.roomId,
      dto.chipStack
    );

    // Process with verified amount
    return this.createTransaction({
      userId: dto.userId,
      amount: verifiedAmount,
      type: TransactionType.GAME_CASHOUT,
    });
  }

  private async verifyChipStack(
    userId: string,
    roomId: string,
    requestedAmount: number
  ): Promise<number> {
    try {
      const gameState = await Promise.race([
        this.gameStateStore.getGameState(roomId),
        this.timeout(3000),
      ]);

      const playerState = gameState?.activePlayers.find(p => p.userId === userId);
      const authoritative = playerState?.chipStack ?? requestedAmount;

      if (Math.abs(authoritative - requestedAmount) > 0.01) {
        await this.sendAdminAlert({
          type: 'CHIP_STACK_MISMATCH',
          userId,
          expected: authoritative,
          requested: requestedAmount,
        });

        return authoritative; // Use game state value
      }

      return requestedAmount;
    } catch (error) {
      this.logger.error(`Verification failed: ${error.message}`);
      return requestedAmount; // Fallback
    }
  }
}
```

2. **Write tests**:

```bash
touch backend/tests/integration/cash-out-verification.spec.ts
```

3. **Test and verify**:

```bash
npm run test:integration -- cash-out-verification.spec.ts
```

---

## Phase 2: High Priority Fixes (P1) - Week 1

### Fix 4: Transaction Pagination (2 hours)

**Steps**:

1. **Create pagination DTO**:

```bash
touch backend/src/common/dto/pagination.dto.ts
```

2. **Update wallet controller**:

```typescript
@Get('transactions')
async getTransactions(
  @GetUser() user: User,
  @Query() paginationDto: PaginationDto
): Promise<PaginatedResponse<Transaction>> {
  const { page, limit } = paginationDto;
  const skip = (page - 1) * limit;

  const [transactions, total] = await this.repository.findAndCount({
    where: { userId: user.id },
    order: { createdAt: 'DESC' },
    skip,
    take: limit,
  });

  return createPaginatedResponse(transactions, total, page, limit);
}
```

3. **Test**:

```bash
npm run test:integration -- transaction-pagination.spec.ts
```

---

### Fix 5: Database Indexes (1 hour)

**Steps**:

1. **Create migration**:

```bash
npm run migration:create -- AddTransactionIndexes
```

2. **Write migration**:

```typescript
// database/migrations/xxx-AddTransactionIndexes.ts
export class AddTransactionIndexes implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY "idx_transaction_user_type_created"
      ON "transactions" ("userId", "type", "createdAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_transaction_user_type_created"`);
  }
}
```

3. **Test migration**:

```bash
# On staging database
npm run migration:run

# Verify performance
npm run migration:test
```

---

### Fix 6: Error Boundaries (1 hour)

**Steps**:

1. **Create error boundary component**:

```bash
mkdir -p frontend/src/components/error
touch frontend/src/components/error/error-boundary.tsx
```

2. **Add to layout**:

```typescript
// frontend/src/app/layout.tsx
import { ErrorBoundary } from '@/components/error/error-boundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

3. **Test**:

```bash
npm run test -- error-boundary.spec.tsx
```

---

### Fix 7: WebSocket Rate Limiting (1 hour)

**Steps**:

1. **Create rate limit guard**:

```bash
touch backend/src/common/guards/websocket-rate-limit.guard.ts
```

2. **Apply to gateway**:

```typescript
@UseGuards(WebSocketRateLimitGuard)
@WebSocketGateway()
export class GameGateway { }
```

3. **Test**:

```bash
npm run test:load -- websocket-rate-limit.spec.ts
```

---

### Fix 8: Mobile Layout (2 hours)

**Steps**:

1. **Create mobile hook**:

```bash
touch frontend/src/hooks/use-media-query.ts
```

2. **Create mobile component**:

```bash
touch frontend/src/components/game/mobile-poker-table.tsx
```

3. **Update poker table**:

```typescript
export function PokerTable() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return isMobile ? <MobilePokerTable /> : <DesktopPokerTable />;
}
```

4. **Test on devices**:

```bash
npm run test -- mobile-layout.spec.ts
```

---

## Testing

### Run All Tests

```bash
# Backend tests
cd backend
npm run test               # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e          # End-to-end tests

# Frontend tests
cd frontend
npm run test              # Component tests
```

### Load Tests

```bash
# WebSocket rate limiting
npm run test:load -- websocket-rate-limit

# Chip stack concurrency
npm run test:load -- chip-stack-concurrency
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] FRONTEND_URL configured in production
- [ ] Database migration tested on staging
- [ ] Sentry configured for error tracking
- [ ] Rate limiting monitored

### Deployment Steps

1. Deploy database migrations (low-traffic window)
2. Deploy backend with rolling restart
3. Deploy frontend
4. Verify health checks
5. Monitor error rates

### Post-Deployment Validation

```bash
# Verify CORS
curl -H "Origin: http://localhost" https://api.pwgaming.com/health
# Should return CORS error

# Verify pagination
curl https://api.pwgaming.com/api/v1/wallet/transactions?page=1&limit=20

# Verify indexes
psql -c "EXPLAIN ANALYZE SELECT * FROM transactions WHERE userId = 'xxx' LIMIT 20"
# Should show "Index Scan"
```

---

## Troubleshooting

### CORS Issues

```
Error: FRONTEND_URL must be set
→ Solution: Set FRONTEND_URL in environment variables
```

### Lock Timeout

```
Error: Lock acquisition timeout
→ Solution: Check for deadlocks, increase timeout to 10 seconds
```

### Migration Fails

```
Error: Index already exists
→ Solution: Use IF NOT EXISTS in CREATE INDEX
```

### Rate Limit Not Working

```
Error: Redis connection failed
→ Solution: Verify Redis is running, check in-memory fallback
```

---

## Next Steps

After completing all fixes:

1. **Run security scan**: `npm run security:scan`
2. **Performance test**: Load test with 1000 users
3. **Create production checklist**: Document deployment steps
4. **Monitor metrics**: Set up dashboards for critical paths

---

## Support

- **Documentation**: See `specs/001-code-review-fixes/`
- **Contracts**: See `contracts/` directory
- **Code Review Report**: See `code-review-report/` directory

---

**Quickstart Guide Version**: 1.0.0
**Last Updated**: 2025-01-19
**Maintainer**: Development Team
