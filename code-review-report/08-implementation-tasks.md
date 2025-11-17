# Implementation Tasks - Prioritized Action Plan

**Review Date:** 2025-11-17
**Total Tasks:** 47 tasks across 4 priorities

---

## Priority Levels

- 🔴 **P0 - CRITICAL:** Must fix before ANY deployment (blocks production)
- 🟠 **P1 - HIGH:** Required for production launch (1-2 weeks)
- 🟡 **P2 - MEDIUM:** Important for stability and UX (1-2 months)
- 🟢 **P3 - LOW:** Nice-to-have improvements (backlog)

---

## 🔴 P0 - CRITICAL TASKS (Block Production)

**Estimated Total Time:** 4-5 hours
**Deadline:** IMMEDIATE

### Security & Authentication

#### TASK-001: Fix Telegram Authentication Bypass
**Priority:** 🔴 P0-CRITICAL
**Effort:** 30 minutes
**File:** `backend/src/modules/auth/services/auth.service.ts`

**Steps:**
1. Inject `TelegramAuthService` into `AuthService`
2. Inject `ConfigService` to get bot token
3. Replace `parseTelegramInitData()` with proper validation
4. Add error handling for invalid signatures

**Code Changes:**
```typescript
// In auth.service.ts constructor
constructor(
  @InjectRepository(User)
  private readonly userRepository: Repository<User>,
  private readonly jwtService: JwtService,
  private readonly telegramAuthService: TelegramAuthService,  // ADD
  private readonly configService: ConfigService,  // ADD
) {}

// Replace validateTelegramAuth method
async validateTelegramAuth(initData: string): Promise<User> {
  const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
  if (!botToken) {
    throw new UnauthorizedException('Telegram bot token not configured');
  }

  await this.telegramAuthService.validateInitData(initData, botToken);
  const userData = await this.telegramAuthService.parseUserData(initData);
  return await this.findOrCreateUser(userData);
}
```

**Testing:**
```bash
# Test with invalid signature - should fail
curl -X POST http://localhost:3001/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData":"user=%7B%22id%22%3A123%7D&hash=invalid"}'
# Expected: 401 Unauthorized

# Test with valid Telegram initData - should succeed
```

---

#### TASK-002: Add TELEGRAM_BOT_TOKEN to Environment Validation
**Priority:** 🔴 P0-CRITICAL
**Effort:** 5 minutes
**File:** `backend/src/config/env.validation.ts`

**Code Changes:**
```typescript
class EnvironmentVariables {
  // ... existing fields ...

  @IsString()
  TELEGRAM_BOT_TOKEN!: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;
}
```

**Testing:**
```bash
# Without TELEGRAM_BOT_TOKEN - should fail
npm run start

# With TELEGRAM_BOT_TOKEN - should start
TELEGRAM_BOT_TOKEN=your_token npm run start
```

---

#### TASK-003: Configure Security Middleware in main.ts
**Priority:** 🔴 P0-CRITICAL
**Effort:** 20 minutes
**File:** `backend/src/main.ts`

**Steps:**
1. Install dependencies: `npm install helmet compression`
2. Import required packages
3. Configure Helmet, CORS, compression
4. Add graceful shutdown

**Complete Implementation:**
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4120',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-lang'],
  });

  // Compression
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Application running on: ${await app.getUrl()}`);
}
bootstrap();
```

**Testing:**
```bash
curl -I http://localhost:3001/api/v1/health
# Should see security headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# etc.
```

---

### Critical Bugs

#### TASK-004: Fix Async/Await Bug in Game Gateway
**Priority:** 🔴 P0-CRITICAL
**Effort:** 2 minutes
**File:** `backend/src/modules/game/gateways/game.gateway.ts:548`

**Code Changes:**
```typescript
// Line 548 - Add 'async' keyword
private async handleHandComplete(roomId: string) {
  // ... existing code works fine now
}
```

**Testing:**
```bash
# Play a full poker hand to completion
# Should not crash
```

---

#### TASK-005: Fix Chip Stack Tracking Between Hands
**Priority:** 🔴 P0-CRITICAL
**Effort:** 2-3 hours
**File:** `backend/src/modules/game/gateways/game.gateway.ts`

**Steps:**
1. Update `connectedPlayers` Map to include `chipStack`
2. Track chip stacks on join
3. Update chip stacks after each hand
4. Use tracked values when starting new hands
5. Handle edge cases (disconnection, cash-out)

**Implementation Outline:**
```typescript
// 1. Update interface
private connectedPlayers: Map<string, {
  socket: Socket;
  roomId: string;
  chipStack: number;  // ADD
}> = new Map();

// 2. Track on join
this.connectedPlayers.set(userId, {
  socket: client,
  roomId,
  chipStack: buyIn
});

// 3. Update after hand
private async handleHandComplete(roomId: string) {
  // Calculate winners and payouts...
  const payouts = this.calculatePayouts(winners, pots, rake);

  // Update chip stacks
  payouts.forEach((amount, userId) => {
    const player = this.connectedPlayers.get(userId);
    if (player) {
      player.chipStack += amount;
    }
  });

  // Save to DB
  await this.saveChipStacks(roomId, payouts);
}

// 4. Use tracked values
private startNewHand(roomId: string) {
  const connectedPlayers = Array.from(this.connectedPlayers.values())
    .filter(p => p.roomId === roomId)
    .map((p, idx) => ({
      userId: p.socket.data.user?.userId,
      chipStack: p.chipStack,  // USE TRACKED VALUE
      position: idx,
    }));
}

// 5. Helper method for payout calculation
private calculatePayouts(
  winners: WinnerInfo[],
  pots: Pot[],
  rakeAmount: number
): Map<string, number> {
  const payouts = new Map<string, number>();

  // Distribute pots to winners
  pots.forEach((pot, index) => {
    const potWinners = winners.filter(w =>
      pot.eligiblePlayers.includes(w.userId)
    );

    if (potWinners.length > 0) {
      const share = pot.amount / potWinners.length;
      potWinners.forEach(winner => {
        const current = payouts.get(winner.userId) || 0;
        payouts.set(winner.userId, current + share);
      });
    }
  });

  // Deduct rake from main pot
  const firstWinner = winners[0];
  if (firstWinner && rakeAmount > 0) {
    const current = payouts.get(firstWinner.userId) || 0;
    payouts.set(firstWinner.userId, current - rakeAmount);
  }

  return payouts;
}
```

**Testing:**
```bash
# Multi-hand test scenario:
# 1. Player A buys in with 1000
# 2. Player B buys in with 1000
# 3. Play hand 1: A wins 200
# 4. Verify A has 1200, B has 800
# 5. Play hand 2: B wins 400
# 6. Verify A has 800, B has 1200
```

---

#### TASK-006: Fix Hardcoded Blind Values in Crash Recovery
**Priority:** 🔴 P0-CRITICAL
**Effort:** 20 minutes
**File:** `backend/src/modules/game/gateways/game.gateway.ts:78`

**Code Changes:**
```typescript
constructor(
  // ... existing services ...
  private readonly roomService: RoomService,  // ADD
) {}

private async recoverActiveGames() {
  try {
    const recoveredGames = await this.gameStateStore.recoverAllGames();

    for (const [roomId, handState] of recoveredGames) {
      // Load room configuration
      const room = await this.roomService.findById(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found, skipping recovery`);
        continue;
      }

      this.rooms.set(roomId, {
        roomId,
        handState,
        smallBlind: room.smallBlind,
        bigBlind: room.bigBlind,
        actionTimeoutSeconds: 30,
      });

      console.log(`Recovered room ${roomId} (${room.smallBlind}/${room.bigBlind})`);
    }
  } catch (error) {
    console.error('Crash recovery failed:', error);
  }
}
```

---

#### TASK-007: Install Missing Dependencies
**Priority:** 🔴 P0-CRITICAL
**Effort:** 10 minutes

**Steps:**
```bash
# Backend
cd backend
npm install
npm run build  # Verify no errors

# Frontend
cd ../frontend
npm install
npm run build  # Verify no errors

# Run tests (if time permits)
cd ../backend
npm run test
```

---

### Environment & Configuration

#### TASK-008: Remove Hardcoded Database Credentials
**Priority:** 🔴 P0-CRITICAL
**Effort:** 5 minutes
**File:** `backend/src/config/env.validation.ts`

**Code Changes:**
```typescript
class EnvironmentVariables {
  // Remove defaults
  @IsString()
  DB_USERNAME!: string;  // Was: = 'poker_user'

  @IsString()
  DB_PASSWORD!: string;  // Was: = 'poker_dev_password'

  @IsString()
  DB_DATABASE!: string;  // Was: = 'poker_platform'
}
```

**Create `.env.example`:**
```bash
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=poker_platform

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=7d

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Frontend
FRONTEND_URL=http://localhost:4120
```

---

## 🟠 P1 - HIGH PRIORITY (Production Launch)

**Estimated Total Time:** 2-3 days
**Deadline:** Before production launch

### Security Enhancements

#### TASK-009: Implement Rate Limiting on Auth Endpoints
**Priority:** 🟠 P1-HIGH
**Effort:** 30 minutes

**Steps:**
1. Install: `npm install @nestjs/throttler`
2. Configure ThrottlerModule in app.module.ts
3. Apply rate limits to auth endpoints

**Implementation:**
```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    // ... other imports
  ],
})

// auth.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('telegram')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    // ...
  }

  @Get('me')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    // ...
  }
}
```

---

#### TASK-010: Implement Input Sanitization
**Priority:** 🟠 P1-HIGH
**Effort:** 1 hour

**Steps:**
1. Install: `npm install class-sanitizer sanitize-html`
2. Create sanitization decorators
3. Apply to all DTOs with user input

**Implementation:**
```typescript
// common/decorators/sanitize.decorator.ts
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
      });
    }
    return value;
  });
}

// Apply to DTOs
export class CreateWithdrawalDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  @Sanitize()  // ADD THIS
  notes?: string;
}
```

---

#### TASK-011: Implement Token Refresh Mechanism
**Priority:** 🟠 P1-HIGH
**Effort:** 2 hours

**Implementation:**
```typescript
// Add refresh token generation
async generateTokens(user: User) {
  const accessToken = this.jwtService.sign(
    { sub: user.id, role: user.role },
    { expiresIn: '15m' }
  );

  const refreshToken = this.jwtService.sign(
    { sub: user.id, type: 'refresh' },
    { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET }
  );

  return { accessToken, refreshToken };
}

// Add refresh endpoint
@Post('refresh')
async refresh(@Body('refreshToken') refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET
    });

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    return await this.generateTokens(user);
  } catch {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
```

---

### Monitoring & Observability

#### TASK-012: Add Health Check Endpoints
**Priority:** 🟠 P1-HIGH
**Effort:** 30 minutes

**Implementation:**
```bash
npm install @nestjs/terminus
```

```typescript
// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

---

#### TASK-013: Implement Security Event Logging
**Priority:** 🟠 P1-HIGH
**Effort:** 1 hour

**Implementation:**
```typescript
// common/logger/security-logger.service.ts
@Injectable()
export class SecurityLogger {
  private readonly logger = new Logger('SecurityEvents');

  logFailedLogin(details: {
    userId?: string;
    telegramId?: number;
    ip: string;
    reason: string;
  }) {
    this.logger.warn({
      event: 'FAILED_LOGIN',
      ...details,
      timestamp: new Date(),
    });
  }

  logWithdrawal(userId: string, amount: number, status: string) {
    this.logger.log({
      event: 'WITHDRAWAL',
      userId,
      amount,
      status,
      timestamp: new Date(),
    });
  }

  logSuspiciousActivity(type: string, details: any) {
    this.logger.warn({
      event: 'SUSPICIOUS_ACTIVITY',
      type,
      details,
      timestamp: new Date(),
    });
  }
}

// Use in auth.service.ts
async validateTelegramAuth(initData: string, ip: string): Promise<User> {
  try {
    // ... validation
  } catch (error) {
    this.securityLogger.logFailedLogin({
      ip,
      reason: error.message,
    });
    throw error;
  }
}
```

---

### Testing & Quality

#### TASK-014: Add E2E Tests for Critical Flows
**Priority:** 🟠 P1-HIGH
**Effort:** 4 hours

**Test Coverage:**
1. Authentication flow
2. Buy-in flow
3. Complete poker hand
4. Withdrawal flow
5. Admin operations

**Example:**
```typescript
// test/e2e/auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  it('should reject invalid Telegram auth', () => {
    return request(app.getHttpServer())
      .post('/auth/telegram')
      .send({ initData: 'invalid' })
      .expect(401);
  });

  it('should authenticate valid Telegram user', () => {
    const validInitData = generateValidTelegramInitData();
    return request(app.getHttpServer())
      .post('/auth/telegram')
      .send({ initData: validInitData })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
      });
  });
});
```

---

## 🟡 P2 - MEDIUM PRIORITY (Post-Launch)

**Estimated Time:** 1-2 weeks
**Deadline:** Within 1-2 months

### Performance Optimization

#### TASK-015: Implement Database Connection Pooling Optimization
**Priority:** 🟡 P2-MEDIUM
**Effort:** 30 minutes

#### TASK-016: Add Redis Caching for Frequently Accessed Data
**Priority:** 🟡 P2-MEDIUM
**Effort:** 2 hours

#### TASK-017: Optimize WebSocket Message Compression
**Priority:** 🟡 P2-MEDIUM
**Effort:** 1 hour

### User Experience

#### TASK-018: Add Loading States to All Frontend Components
**Priority:** 🟡 P2-MEDIUM
**Effort:** 2 hours

#### TASK-019: Implement Error Boundaries
**Priority:** 🟡 P2-MEDIUM
**Effort:** 1 hour

#### TASK-020: Add Toast Notifications for User Actions
**Priority:** 🟡 P2-MEDIUM
**Effort:** 1 hour

---

## 🟢 P3 - LOW PRIORITY (Backlog)

### Nice-to-Have Improvements

#### TASK-021: Add Rake Calculation Cryptographic Signatures
**Priority:** 🟢 P3-LOW
**Effort:** 2 hours

#### TASK-022: Implement Automated Security Scanning
**Priority:** 🟢 P3-LOW
**Effort:** 4 hours

#### TASK-023: Add Comprehensive Metrics Dashboard
**Priority:** 🟢 P3-LOW
**Effort:** 1 week

---

## Quick Start Guide

### Day 1: Critical Security Fixes (4-5 hours)
```bash
# 1. Install dependencies
TASK-007

# 2. Fix authentication
TASK-001
TASK-002

# 3. Security middleware
TASK-003

# 4. Fix critical bugs
TASK-004
TASK-006

# 5. Environment security
TASK-008
```

### Day 2-3: Chip Stack & Production Readiness (1-2 days)
```bash
# 1. Fix chip stack tracking
TASK-005

# 2. Add rate limiting
TASK-009

# 3. Input sanitization
TASK-010

# 4. Health checks
TASK-012

# 5. Security logging
TASK-013
```

### Week 2: Testing & Optimization (3-5 days)
```bash
# 1. Token refresh
TASK-011

# 2. E2E tests
TASK-014

# 3. Performance optimization
TASK-015, TASK-016

# 4. UX improvements
TASK-018, TASK-019
```

---

## Progress Tracking

Create a GitHub Project board with columns:
- 🔴 **P0 - Blocking Production**
- 🟠 **P1 - Pre-Launch**
- 🟡 **P2 - Post-Launch**
- 🟢 **P3 - Backlog**
- ✅ **Done**

**Current Status:** 0/47 tasks completed (0%)

**Target for Production:** Complete all P0 and P1 tasks (14 tasks, ~3-4 days)

---

**Next:** Review detailed reports for implementation guidance.
