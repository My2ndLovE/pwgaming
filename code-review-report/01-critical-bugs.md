# Critical Bugs - Immediate Fix Required

**Review Date:** 2025-11-17
**Total Critical Bugs:** 7

---

## 🔴 BUG-001: Async/Await Syntax Error in Game Gateway

**File:** `backend/src/modules/game/gateways/game.gateway.ts:573`
**Severity:** CRITICAL (Runtime Error)
**Impact:** Application crash during hand completion

### Issue
```typescript
// Line 548-594
private handleHandComplete(roomId: string) {  // ❌ NOT async
  // ... code ...

  // Line 573
  try {
    await this.gameStateStore.saveCompletedHand(  // ❌ Using await in non-async function
      roomId,
      room.handState,
      room.smallBlind,
      room.bigBlind,
    );
```

### Root Cause
Method `handleHandComplete` uses `await` but is not declared as `async`. This will cause a syntax error at runtime.

### Impact
- Application crashes when any poker hand completes
- Players lose their game state
- Potential chip/money loss

### Fix
```typescript
private async handleHandComplete(roomId: string) {  // ✅ Add async
  // ... existing code works correctly
}
```

**Priority:** 🔴 CRITICAL - Fix Immediately
**Estimated Time:** 5 minutes

---

## 🔴 BUG-002: Telegram Authentication Bypass Vulnerability

**File:** `backend/src/modules/auth/services/auth.service.ts:29-37`
**Severity:** CRITICAL (Security)
**Impact:** Anyone can impersonate any Telegram user

### Issue
```typescript
// auth.service.ts:29-37
async validateTelegramAuth(initData: string): Promise<User> {
  // For MVP: simplified validation
  // Production: Use @tma.js/init-data-node for proper validation  // ❌ Comment indicates it's incomplete
  try {
    const userData = this.parseTelegramInitData(initData);
    return await this.findOrCreateUser(userData);
  } catch (error) {
    throw new UnauthorizedException('Invalid Telegram authentication');
  }
}

// Line 77-85
private parseTelegramInitData(initData: string): TelegramUser {
  // Simplified parsing for MVP  // ❌ NO SIGNATURE VERIFICATION!
  const params = new URLSearchParams(initData);
  const userJson = params.get('user');
  if (!userJson) {
    throw new Error('No user data in initData');
  }
  return JSON.parse(userJson);  // ❌ Just parses JSON, no crypto validation
}
```

### Root Cause
The authentication service **parses** Telegram initData but **never validates the signature/hash**. A proper `TelegramAuthService` exists (line 1-69 of telegram-auth.service.ts) but is not being used!

### Exploit Scenario
```bash
# Attacker can craft a fake initData:
curl -X POST http://api.example.com/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "user=%7B%22id%22%3A123456%2C%22username%22%3A%22admin%22%7D"
  }'
# No signature check = authenticated as user 123456!
```

### Impact
- **Complete authentication bypass**
- Attacker can impersonate any user
- Access to all wallets and game state
- Fraudulent transactions possible

### Fix
```typescript
// In auth.service.ts
import { TelegramAuthService } from './telegram-auth.service';
import { ConfigService } from '@nestjs/config';

export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly telegramAuthService: TelegramAuthService,  // ✅ Inject
    private readonly configService: ConfigService,
  ) {}

  async validateTelegramAuth(initData: string): Promise<User> {
    // ✅ VALIDATE SIGNATURE
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('Telegram bot token not configured');
    }

    // This will throw if signature is invalid
    await this.telegramAuthService.validateInitData(initData, botToken);

    // Now safe to parse
    const userData = await this.telegramAuthService.parseUserData(initData);
    return await this.findOrCreateUser(userData);
  }
}
```

**Priority:** 🔴 CRITICAL - Fix Before ANY Production Deployment
**Estimated Time:** 30 minutes

---

## 🔴 BUG-003: Missing TELEGRAM_BOT_TOKEN Environment Variable Validation

**File:** `backend/src/config/env.validation.ts:39`
**Severity:** CRITICAL (Configuration)
**Impact:** Authentication cannot work without bot token

### Issue
```typescript
// env.validation.ts - MISSING:
@IsString()
TELEGRAM_BOT_TOKEN!: string;  // ❌ Not defined!

@IsString()
JWT_SECRET!: string;  // ✅ This one exists
```

### Root Cause
The environment validation schema doesn't include `TELEGRAM_BOT_TOKEN`, which is required for Telegram authentication validation.

### Impact
- Application starts without bot token
- Authentication will fail at runtime
- No early detection of missing config

### Fix
```typescript
// env.validation.ts
class EnvironmentVariables {
  // ... existing fields ...

  @IsString()
  TELEGRAM_BOT_TOKEN!: string;  // ✅ Add this

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;  // ✅ Also add this for CORS
}
```

**Priority:** 🔴 CRITICAL - Required for auth fix
**Estimated Time:** 5 minutes

---

## 🔴 BUG-004: Missing Security Middleware in Main.ts

**File:** `backend/src/main.ts:1-9`
**Severity:** CRITICAL (Security)
**Impact:** Application exposed without security headers, CORS, or compression

### Issue
```typescript
// main.ts - TOO SIMPLE!
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);  // ❌ No security config!
}
bootstrap();
```

### Missing Configurations
1. ❌ No CORS setup
2. ❌ No Helmet (security headers)
3. ❌ No compression
4. ❌ No global prefix (/api)
5. ❌ No graceful shutdown
6. ❌ No request logging

### Impact
- **XSS attacks possible** (no Content-Security-Policy)
- **Clickjacking possible** (no X-Frame-Options)
- **MIME sniffing attacks** (no X-Content-Type-Options)
- **Cross-origin attacks** (no CORS restrictions)
- **Poor performance** (no compression)

### Fix
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ✅ Security headers
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

  // ✅ CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4120',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-lang'],
  });

  // ✅ Compression
  app.use(compression());

  // ✅ Global API prefix
  app.setGlobalPrefix('api/v1');

  // ✅ Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

**Priority:** 🔴 CRITICAL - Required for production
**Estimated Time:** 15 minutes

---

## 🔴 BUG-005: Hardcoded Values in Crash Recovery

**File:** `backend/src/modules/game/gateways/game.gateway.ts:86-88`
**Severity:** HIGH (Data Integrity)
**Impact:** Recovered games use wrong blinds

### Issue
```typescript
// Line 78-97
private async recoverActiveGames() {
  try {
    const recoveredGames = await this.gameStateStore.recoverAllGames();

    for (const [roomId, handState] of recoveredGames) {
      this.rooms.set(roomId, {
        roomId,
        handState,
        smallBlind: 50,    // ❌ HARDCODED! Should load from room
        bigBlind: 100,     // ❌ HARDCODED!
        actionTimeoutSeconds: 30,
      });
```

### Root Cause
When recovering games after a crash, the system uses hardcoded blind values instead of loading the correct values from the room configuration.

### Impact
- Players returning to a 25/50 room might play with 50/100 blinds
- Incorrect buy-in calculations
- Potential financial discrepancies

### Fix
```typescript
private async recoverActiveGames() {
  try {
    const recoveredGames = await this.gameStateStore.recoverAllGames();

    for (const [roomId, handState] of recoveredGames) {
      // ✅ Load room configuration
      const room = await this.roomService.findById(roomId);
      if (!room) {
        console.error(`Room ${roomId} not found during recovery, skipping`);
        continue;
      }

      this.rooms.set(roomId, {
        roomId,
        handState,
        smallBlind: room.smallBlind,  // ✅ Use actual values
        bigBlind: room.bigBlind,
        actionTimeoutSeconds: 30,
      });
```

**Priority:** 🔴 HIGH - Can cause financial issues
**Estimated Time:** 20 minutes

---

## 🔴 BUG-006: Chip Stack Not Persisted Between Hands

**File:** `backend/src/modules/game/gateways/game.gateway.ts:604`
**Severity:** HIGH (Data Loss)
**Impact:** Players lose chip stacks between hands

### Issue
```typescript
// Line 596-625
private startNewHand(roomId: string) {
  // ... code ...

  const connectedPlayers = Array.from(this.connectedPlayers.values())
    .filter(p => p.roomId === roomId)
    .map((p, idx) => ({
      userId: p.socket.data.user?.userId,
      chipStack: 1000,  // ❌ TODO: Track chip stacks - ALWAYS 1000!
      position: idx,
    }));
```

### Root Cause
Each new hand resets all players to 1000 chips instead of tracking their actual chip stacks from previous hands.

### Impact
- **Players lose all winnings** between hands
- **Financial fraud** - players can effectively get free chips every hand
- **Game integrity completely broken**

### Fix Strategy
```typescript
// Add chip stack tracking to connectedPlayers Map
private connectedPlayers: Map<string, {
  socket: Socket;
  roomId: string;
  chipStack: number;  // ✅ Add this
}> = new Map();

// Update on join
@SubscribeMessage('game:join')
async handleJoinGame(...) {
  // ... existing code ...
  this.connectedPlayers.set(userId, {
    socket: client,
    roomId,
    chipStack: buyIn  // ✅ Track buy-in amount
  });
}

// Update after each hand
private handleHandComplete(roomId: string) {
  // ... existing code ...

  // ✅ Update chip stacks based on hand results
  const updatedStacks = this.calculateUpdatedStacks(room.handState, winners, pots);
  updatedStacks.forEach((newStack, userId) => {
    const player = this.connectedPlayers.get(userId);
    if (player) {
      player.chipStack = newStack;
    }
  });
}

// Use tracked values
private startNewHand(roomId: string) {
  const connectedPlayers = Array.from(this.connectedPlayers.values())
    .filter(p => p.roomId === roomId)
    .map((p, idx) => ({
      userId: p.socket.data.user?.userId,
      chipStack: p.chipStack,  // ✅ Use tracked value
      position: idx,
    }));
}
```

**Priority:** 🔴 CRITICAL - Game is unplayable
**Estimated Time:** 2 hours

---

## 🔴 BUG-007: Test Dependencies Not Installed

**File:** `backend/package.json`
**Severity:** HIGH (Development)
**Impact:** Cannot run tests or linters

### Issue
```bash
$ npm run test:cov
sh: 1: jest: not found

$ npm run lint
Cannot find package '@eslint/js'
```

### Root Cause
Dependencies are defined in package.json but `npm install` was never run.

### Impact
- **Cannot verify code quality**
- **No test coverage reports**
- **Cannot detect regressions**

### Fix
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Verify
npm run test
npm run lint
```

**Priority:** 🔴 HIGH - Required for QA
**Estimated Time:** 10 minutes (download time)

---

## Summary

| Bug ID | Severity | File | Estimated Fix Time |
|--------|----------|------|-------------------|
| BUG-001 | CRITICAL | game.gateway.ts:573 | 5 min |
| BUG-002 | CRITICAL | auth.service.ts:29 | 30 min |
| BUG-003 | CRITICAL | env.validation.ts | 5 min |
| BUG-004 | CRITICAL | main.ts | 15 min |
| BUG-005 | HIGH | game.gateway.ts:86 | 20 min |
| BUG-006 | CRITICAL | game.gateway.ts:604 | 2 hours |
| BUG-007 | HIGH | package.json | 10 min |

**Total Estimated Fix Time:** ~3.5 hours

**Recommended Order:**
1. BUG-007 (Install dependencies) - 10 min
2. BUG-003 (Add env validation) - 5 min
3. BUG-002 (Fix Telegram auth) - 30 min
4. BUG-004 (Add security middleware) - 15 min
5. BUG-001 (Fix async bug) - 5 min
6. BUG-005 (Fix crash recovery) - 20 min
7. BUG-006 (Fix chip stack tracking) - 2 hours

---

**Next:** Review `02-security-vulnerabilities.md` for additional security findings.
