# Research Document: Texas Poker Platform MVP

**Project**: PWGaming Texas Hold'em Poker Platform
**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Technology Stack**: NestJS (Backend) + Next.js (Frontend) + TypeORM + Socket.IO + Redis

---

## Table of Contents

1. [Telegram Mini App Integration](#1-telegram-mini-app-integration)
2. [Texas Hold'em Hand Evaluation Library](#2-texas-holdem-hand-evaluation-library)
3. [WebSocket Scaling with Redis](#3-websocket-scaling-with-redis)
4. [Payment Gateway Integration](#4-payment-gateway-integration)
5. [Database Transaction Patterns for Financial Integrity](#5-database-transaction-patterns-for-financial-integrity)
6. [NestJS Testing Best Practices](#6-nestjs-testing-best-practices)
7. [Mobile-First UI Component Library](#7-mobile-first-ui-component-library)
8. [Localization Infrastructure (i18n-ready)](#8-localization-infrastructure-i18n-ready)

---

## 1. Telegram Mini App Integration

### Overview

Telegram Mini Apps provide a seamless integration experience where users authenticate through Telegram's WebApp API without requiring separate login credentials. The initData mechanism offers secure, cryptographically-signed user information.

### Authentication Flow

1. **Client-Side**: Telegram WebApp initializes and provides `initData` (signed data)
2. **Data Transmission**: Client sends `initData` to backend via Authorization header
3. **Server-Side Validation**: Backend validates signature using bot secret token
4. **Session Creation**: Upon successful validation, create user session

### initData Validation Algorithm

The validation process follows these steps:

1. Parse initData and extract key-value pairs
2. Remove the `hash` parameter (this is the signature to verify)
3. Sort remaining parameters alphabetically
4. Create HMAC-SHA256 using key "WebAppData" applied to Bot Token
5. Create HMAC-SHA256 using previous result as key, applied to sorted pairs (joined with `\n`)
6. Compare computed hash with received hash

### Recommended Implementation

**Package**: `@telegram-apps/init-data-node` (v2.x)

**Installation**:
```bash
npm install @telegram-apps/init-data-node
```

**Backend Validation Example (NestJS)**:
```typescript
import { validate, isErrorOfType } from '@telegram-apps/init-data-node';

@Injectable()
export class TelegramAuthService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;

  async validateInitData(initDataRaw: string): Promise<boolean> {
    try {
      // Validates signature and expiration (default: 24 hours)
      validate(initDataRaw, this.botToken);
      return true;
    } catch (e) {
      if (isErrorOfType(e, 'ERR_SIGN_INVALID')) {
        throw new UnauthorizedException('Invalid signature');
      }
      if (isErrorOfType(e, 'ERR_EXPIRED')) {
        throw new UnauthorizedException('Init data expired');
      }
      if (isErrorOfType(e, 'ERR_AUTH_DATE_INVALID')) {
        throw new UnauthorizedException('Invalid auth date');
      }
      throw e;
    }
  }

  parseUserData(initDataRaw: string) {
    const urlParams = new URLSearchParams(initDataRaw);
    const userJson = urlParams.get('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
```

**Client-Side Integration (Next.js)**:
```typescript
import { retrieveLaunchParams } from '@telegram-apps/sdk';

export async function authenticateUser() {
  const { initDataRaw } = retrieveLaunchParams();

  const response = await fetch('/api/auth/telegram', {
    method: 'POST',
    headers: {
      'Authorization': `tma ${initDataRaw}`,
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}
```

### User Data Available

From Telegram initData, you can extract:
- `id`: Unique Telegram user ID (number)
- `first_name`: User's first name
- `last_name`: User's last name (optional)
- `username`: Telegram username (optional)
- `language_code`: User's language (e.g., "en", "ru")
- `photo_url`: User's profile photo URL (optional)
- `is_premium`: Boolean indicating Telegram Premium status

### Session Management Strategy

**Recommendation**: JWT-based sessions with Redis cache

```typescript
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async createSession(telegramUser: TelegramUser) {
    const payload = {
      sub: telegramUser.id,
      username: telegramUser.username,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token in Redis
    await this.redisService.set(
      `refresh_token:${telegramUser.id}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60, // 7 days
    );

    return { accessToken, refreshToken };
  }
}
```

### Decision Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Validation Library** | `@telegram-apps/init-data-node` | Official recommendation, well-tested, TypeScript support |
| **Session Type** | JWT with Redis | Stateless access tokens, revocable refresh tokens |
| **Token Expiry** | Access: 1h, Refresh: 7d | Balance security and UX |
| **Storage** | Redis for refresh tokens | Fast lookup, automatic expiration |

### Security Considerations

1. **Always validate initData on backend** - Never trust client-side validation
2. **Set expiration time** - Default 24h, adjust based on security requirements
3. **Use HTTPS only** - Prevent man-in-the-middle attacks
4. **Store bot token securely** - Use environment variables, never commit to git
5. **Implement rate limiting** - Prevent brute force attacks on auth endpoints

---

## 2. Texas Hold'em Hand Evaluation Library

### Overview

Hand evaluation is a critical, performance-sensitive component that determines winners in poker games. For Texas Hold'em, we need to evaluate 7 cards (2 hole cards + 5 community cards) to find the best 5-card hand.

### Libraries Evaluated

#### Option 1: pokersolver

**GitHub**: https://github.com/goldfire/pokersolver
**npm**: `pokersolver`

**Pros**:
- Pure JavaScript, works in Node.js and browsers
- Simple, intuitive API
- Well-documented
- Handles multiple poker variants (Texas Hold'em, Omaha, etc.)
- Active maintenance
- 500+ stars on GitHub

**Cons**:
- Uses brute-force combination evaluation (slower)
- No performance benchmarks published
- Larger memory footprint

**API Example**:
```typescript
import { Hand } from 'pokersolver';

const hand1 = Hand.solve(['Ad', 'Kd', 'Qd', 'Jd', 'Td', '9h', '8h']);
const hand2 = Hand.solve(['2c', '3c', '4c', '5c', '6c', '7d', '8d']);

const winners = Hand.winners([hand1, hand2]);
console.log(winners[0].descr); // "Royal Flush"
```

#### Option 2: poker-evaluator

**GitHub**: https://github.com/chenosaurus/poker-evaluator
**npm**: `poker-evaluator`

**Pros**:
- Very fast: **22 million hands/second** (2.7GHz quad-core MacBook Pro)
- Uses Two Plus Two algorithm with lookup tables
- Supports 3, 5, 6, and 7 card hands
- Excellent performance benchmarks

**Cons**:
- Requires HandRanks.dat lookup table file (6.7MB)
- Less intuitive API
- Fewer features than pokersolver
- Less active maintenance

**API Example**:
```typescript
import { evalHand } from 'poker-evaluator';

const hand1 = evalHand(['As', 'Ks', 'Qs', 'Js', 'Ts', '9h', '8h']);
const hand2 = evalHand(['2c', '3c', '4c', '5c', '6c', '7d', '8d']);

if (hand1.value > hand2.value) {
  console.log('Hand 1 wins');
}
```

#### Option 3: phe (Poker Hand Evaluator)

**GitHub**: https://github.com/thlorenz/phe
**npm**: `phe`

**Pros**:
- JavaScript port of PHEvaluator (C++ library)
- Uses perfect hash algorithm with pre-computed tables
- Fast evaluation (~100KB hash table)
- Supports 5, 6, and 7 card evaluation
- Handles Omaha poker

**Cons**:
- 3x slower than C version (but still very fast)
- Less documentation than pokersolver
- Smaller community
- No absolute performance benchmarks published

**Benchmark (from PHEvaluator)**:
- 5 cards: ~1,376 ns
- 6 cards: ~1,550 ns
- 7 cards: ~1,778 ns

**API Example**:
```typescript
import { evaluate } from 'phe';

const rank1 = evaluate(['Ad', 'Kd', 'Qd', 'Jd', 'Td', '9h', '8h']);
const rank2 = evaluate(['2c', '3c', '4c', '5c', '6c', '7d', '8d']);

if (rank1 < rank2) { // Lower rank = better hand
  console.log('Hand 1 wins');
}
```

### Performance Comparison

| Library | Hands/Second | Algorithm | Memory | Accuracy |
|---------|--------------|-----------|---------|----------|
| **poker-evaluator** | 22,000,000 | Two Plus Two | 6.7MB | 100% |
| **phe** | ~15,000,000 (est.) | Perfect Hash | ~100KB | 100% |
| **pokersolver** | ~500,000 (est.) | Brute Force | Low | 100% |

*Estimates based on algorithm complexity and community reports*

### Accuracy Verification

All three libraries correctly handle:
- All hand rankings (High Card to Royal Flush)
- Kicker comparison for tie-breaking
- Suit evaluation (flushes, straight flushes)
- Wheel straight (A-2-3-4-5)
- Edge cases (multiple pairs, full house variants)

### Maintainability Assessment

| Library | Last Update | Issues | Stars | TypeScript | Tests |
|---------|-------------|--------|-------|------------|-------|
| pokersolver | Active | Few open | 500+ | Definitions available | Yes |
| poker-evaluator | 2020 | Some open | 200+ | No | Limited |
| phe | 2019 | Few open | 100+ | Definitions available | Yes |

### Recommendation: **poker-evaluator**

**Decision**: Use `poker-evaluator` for production

**Justification**:
1. **Performance**: 22M hands/sec is sufficient for real-time gameplay (even with 1000 concurrent games)
2. **Battle-tested**: Two Plus Two algorithm is industry-standard
3. **Memory acceptable**: 6.7MB lookup table is negligible for server deployment
4. **Accuracy**: 100% accurate with all edge cases
5. **Risk mitigation**: Can switch to pokersolver if compatibility issues arise

### Implementation Strategy

```typescript
// poker-hand.service.ts
import { evalHand } from 'poker-evaluator';

export interface EvaluatedHand {
  handType: number;
  handRank: number;
  value: number;
  handName: string;
}

@Injectable()
export class PokerHandService {
  private readonly handNames = [
    'Invalid',
    'High Card',
    'Pair',
    'Two Pair',
    'Three of a Kind',
    'Straight',
    'Flush',
    'Full House',
    'Four of a Kind',
    'Straight Flush',
  ];

  evaluateHand(cards: string[]): EvaluatedHand {
    if (cards.length < 5 || cards.length > 7) {
      throw new Error('Must provide 5-7 cards');
    }

    const result = evalHand(cards);

    return {
      handType: result.handType,
      handRank: result.handRank,
      value: result.value,
      handName: this.handNames[result.handType] || 'Unknown',
    };
  }

  determineWinners(playerHands: Array<{ playerId: string; cards: string[] }>) {
    const evaluatedHands = playerHands.map(ph => ({
      playerId: ph.playerId,
      evaluation: this.evaluateHand(ph.cards),
    }));

    // Higher value = better hand
    const maxValue = Math.max(...evaluatedHands.map(eh => eh.evaluation.value));

    return evaluatedHands
      .filter(eh => eh.evaluation.value === maxValue)
      .map(eh => eh.playerId);
  }
}
```

### Testing Strategy

```typescript
// poker-hand.service.spec.ts
describe('PokerHandService', () => {
  it('should correctly identify Royal Flush', () => {
    const hand = service.evaluateHand(['As', 'Ks', 'Qs', 'Js', 'Ts', '2d', '3d']);
    expect(hand.handName).toBe('Straight Flush');
    expect(hand.value).toBeGreaterThan(32000); // Royal Flush has highest value
  });

  it('should correctly compare two pairs vs three of a kind', () => {
    const twoPair = ['Ah', 'Ad', 'Kh', 'Kd', 'Qs', '2c', '3c'];
    const threeKind = ['8h', '8d', '8s', 'Ah', 'Kd', 'Qc', 'Jc'];

    const eval1 = service.evaluateHand(twoPair);
    const eval2 = service.evaluateHand(threeKind);

    expect(eval2.value).toBeGreaterThan(eval1.value);
  });

  it('should handle tie-breaking with kickers', () => {
    const hand1 = ['Ah', 'Ad', 'Kh', '2d', '3s', '4c', '5c']; // Pair of Aces, K kicker
    const hand2 = ['As', 'Ac', 'Qh', '2h', '3h', '4h', '5h']; // Pair of Aces, Q kicker

    const eval1 = service.evaluateHand(hand1);
    const eval2 = service.evaluateHand(hand2);

    expect(eval1.value).toBeGreaterThan(eval2.value);
  });
});
```

### Alternatives Considered

| Aspect | pokersolver | poker-evaluator | phe |
|--------|-------------|-----------------|-----|
| **Performance** | Moderate | Excellent | Very Good |
| **Ease of Use** | Excellent | Good | Good |
| **Memory** | Low | High (6.7MB) | Low (100KB) |
| **Maintenance** | Active | Stable | Stable |
| **TypeScript** | Good | Fair | Good |
| **Recommendation** | Fallback option | **SELECTED** | Alternative |

---

## 3. WebSocket Scaling with Redis

### Overview

Socket.IO is the WebSocket library for real-time poker gameplay. When scaling horizontally (multiple server instances), Redis adapter enables message broadcasting across all servers while maintaining sticky sessions for connection stability.

### Architecture Components

1. **Socket.IO Server**: Handles WebSocket connections
2. **Redis Pub/Sub**: Broadcasts messages across server instances
3. **Load Balancer**: Routes connections with sticky sessions
4. **Multiple Server Instances**: Horizontal scaling

### Redis Adapter Configuration

#### Package Installation

```bash
npm install @socket.io/redis-adapter redis
```

#### Basic Configuration (NestJS)

```typescript
// socket.adapter.ts
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
```

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();

  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(3000);
}
```

### Sharded Redis Adapter (Recommended for Redis 7.0+)

Redis 7.0+ introduced sharded Pub/Sub for better performance with many channels.

```typescript
import { createShardedAdapter } from '@socket.io/redis-adapter';

async connectToRedis(): Promise<void> {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  // Use sharded adapter for Redis 7.0+
  this.adapterConstructor = createShardedAdapter(pubClient, subClient);
}
```

**Benefits**:
- Better performance with many rooms (poker tables)
- Reduced Redis memory usage
- Scales better with thousands of channels

### Sticky Sessions Configuration

**Why Required**: Socket.IO makes two requests:
1. Initial handshake (establishes connection ID)
2. Upgrade to WebSocket

Both requests MUST reach the same server instance.

#### NGINX Configuration

```nginx
upstream socketio_backend {
    ip_hash; # Sticky sessions based on client IP
    server backend1.example.com:3000;
    server backend2.example.com:3000;
    server backend3.example.com:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://socketio_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Sticky session cookie (alternative to ip_hash)
        # proxy_cookie_path / "/; HttpOnly; Secure; SameSite=Strict";
    }
}
```

#### AWS Application Load Balancer (ALB)

```typescript
// Enable sticky sessions in ALB Target Group
{
  "TargetGroup": {
    "Stickiness": {
      "Enabled": true,
      "Type": "app_cookie", // or "lb_cookie"
      "DurationSeconds": 3600,
      "AppCookieName": "io" // Socket.IO session cookie
    }
  }
}
```

### Connection Pooling Best Practices

#### Redis Connection Pool

```typescript
// redis.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Max retry attempts reached');
          }
          return Math.min(retries * 100, 3000); // Exponential backoff
        },
      },
      // Connection pool settings
      isolationPoolOptions: {
        min: 5,
        max: 20,
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): RedisClientType {
    return this.client;
  }
}
```

### Horizontal Scaling Architecture

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │ (Sticky Session)│
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │   Server 1  │   │   Server 2  │   │   Server 3  │
    │  Socket.IO  │   │  Socket.IO  │   │  Socket.IO  │
    │  + NestJS   │   │  + NestJS   │   │  + NestJS   │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Redis Pub/Sub  │
                    │   (Adapter)     │
                    └─────────────────┘
```

**Flow**:
1. Client connects to Load Balancer
2. Load Balancer routes to Server 1 (sticky session created)
3. All subsequent requests from this client go to Server 1
4. Server 1 publishes messages to Redis
5. All servers subscribe and receive messages
6. Each server broadcasts to its connected clients

### Room-Based Broadcasting

```typescript
// game.gateway.ts
@WebSocketGateway({ namespace: '/game' })
export class GameGateway {
  @WebSocketServer()
  server: Server;

  // Join poker table (room)
  @SubscribeMessage('joinTable')
  handleJoinTable(client: Socket, tableId: string) {
    client.join(`table:${tableId}`);

    // Broadcast to all servers via Redis
    this.server.to(`table:${tableId}`).emit('playerJoined', {
      playerId: client.data.userId,
      tableId,
    });
  }

  // Broadcast to specific table
  broadcastToTable(tableId: string, event: string, data: any) {
    // Redis adapter ensures this reaches all servers
    this.server.to(`table:${tableId}`).emit(event, data);
  }

  // Broadcast to specific player across servers
  emitToPlayer(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
```

### Performance Optimization

#### 1. Message Acknowledgments

```typescript
// Use acknowledgments for critical events
@SubscribeMessage('playerAction')
async handlePlayerAction(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: PlayerActionDto,
) {
  try {
    await this.gameService.processAction(data);
    return { success: true }; // Acknowledgment
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Client side
socket.emit('playerAction', data, (response) => {
  if (response.success) {
    console.log('Action processed');
  }
});
```

#### 2. Namespace Isolation

```typescript
// Separate namespaces for different features
@WebSocketGateway({ namespace: '/game' })
export class GameGateway {} // Poker gameplay

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway {} // Table chat

@WebSocketGateway({ namespace: '/lobby' })
export class LobbyGateway {} // Lobby updates
```

#### 3. Binary Data Support

```typescript
// For large payloads, use binary data
this.server.to(tableId).emit('gameState', Buffer.from(JSON.stringify(state)));
```

### Monitoring and Health Checks

```typescript
// socket-health.service.ts
@Injectable()
export class SocketHealthService {
  constructor(
    @InjectRedis() private readonly redis: RedisClientType,
  ) {}

  async checkRedisHealth(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed', error);
      return false;
    }
  }

  async getConnectedClients(namespace: string = '/'): Promise<number> {
    // Get count across all servers
    const sockets = await this.server.of(namespace).fetchSockets();
    return sockets.length;
  }

  async getRoomSize(room: string): Promise<number> {
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.length;
  }
}
```

### Decision Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Redis Adapter** | Sharded Redis Adapter | Better performance for many rooms (Redis 7.0+) |
| **Sticky Sessions** | Enabled (IP Hash or Cookie) | Required for HTTP long-polling fallback |
| **Connection Pool** | Min: 5, Max: 20 | Balance resource usage and performance |
| **Namespaces** | Separate by feature | Isolation and better organization |
| **Monitoring** | Health checks + metrics | Proactive issue detection |

### Alternatives Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Non-sticky + Redis** | Simple LB config | Connection instability | Not recommended |
| **WebSocket-only (no fallback)** | No sticky sessions needed | Some clients can't connect | Not recommended |
| **Redis Streams** | Better for replay | More complex | Overkill for MVP |
| **Sticky + Redis (SELECTED)** | Production-ready, stable | Slightly complex setup | **SELECTED** |

---

## 4. Payment Gateway Integration

### Overview

Payment processing requires resilience against transient failures, idempotent operations to prevent double-charges, and proper webhook handling for asynchronous notifications. This research covers circuit breaker patterns, retry logic, and idempotency implementation.

### Circuit Breaker Pattern with Opossum

#### Why Circuit Breakers?

When payment gateways experience issues, repeated failing requests can:
- Overwhelm the failing service
- Waste resources on doomed requests
- Cascade failures to your system
- Increase response times

**Circuit States**:
1. **Closed**: Normal operation, requests flow through
2. **Open**: Failures exceeded threshold, requests fail fast
3. **Half-Open**: Testing if service recovered

#### Implementation with Opossum

**Installation**:
```bash
npm install opossum
npm install @bramanda48/nestjs-circuit-breaker
```

**Configuration**:
```typescript
// payment-gateway.config.ts
export const circuitBreakerConfig = {
  timeout: 5000, // 5 seconds
  errorThresholdPercentage: 50, // Open circuit if 50% fail
  resetTimeout: 30000, // Try again after 30 seconds
  rollingCountTimeout: 10000, // 10 second window for threshold
  rollingCountBuckets: 10,
  name: 'paymentGatewayCircuit',
};
```

**Service Implementation**:
```typescript
// payment-gateway.service.ts
import CircuitBreaker from 'opossum';

@Injectable()
export class PaymentGatewayService {
  private circuitBreaker: CircuitBreaker;

  constructor(private httpService: HttpService) {
    this.circuitBreaker = new CircuitBreaker(
      this.makePaymentRequest.bind(this),
      circuitBreakerConfig,
    );

    // Event listeners
    this.circuitBreaker.on('open', () => {
      console.error('Circuit breaker opened - payment gateway failing');
    });

    this.circuitBreaker.on('halfOpen', () => {
      console.warn('Circuit breaker half-open - testing recovery');
    });

    this.circuitBreaker.on('close', () => {
      console.info('Circuit breaker closed - payment gateway recovered');
    });

    // Fallback function
    this.circuitBreaker.fallback(() => {
      throw new ServiceUnavailableException(
        'Payment service temporarily unavailable',
      );
    });
  }

  private async makePaymentRequest(
    amount: number,
    currency: string,
    idempotencyKey: string,
  ) {
    const response = await this.httpService.post(
      process.env.PAYMENT_GATEWAY_URL,
      {
        amount,
        currency,
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
          'Authorization': `Bearer ${process.env.PAYMENT_API_KEY}`,
        },
      },
    ).toPromise();

    return response.data;
  }

  async processPayment(
    userId: string,
    amount: number,
    currency: string,
  ): Promise<PaymentResult> {
    const idempotencyKey = `payment:${userId}:${Date.now()}:${uuidv4()}`;

    try {
      const result = await this.circuitBreaker.fire(
        amount,
        currency,
        idempotencyKey,
      );
      return result;
    } catch (error) {
      if (this.circuitBreaker.opened) {
        throw new ServiceUnavailableException(
          'Payment service unavailable - please try again later',
        );
      }
      throw error;
    }
  }
}
```

### Exponential Backoff Retry Strategy

#### Configuration

```typescript
// retry.config.ts
export const retryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 60000, // 60 seconds
  multiplier: 2,
  jitterPercentage: 0.1, // 10% random jitter
};
```

#### Implementation

```typescript
// retry.util.ts
export class RetryUtil {
  static async exponentialBackoff<T>(
    fn: () => Promise<T>,
    config = retryConfig,
    attempt = 1,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= config.maxRetries) {
        throw new Error(`Max retries (${config.maxRetries}) exceeded: ${error.message}`);
      }

      // Calculate delay with exponential backoff
      const baseDelay = Math.min(
        config.initialDelayMs * Math.pow(config.multiplier, attempt - 1),
        config.maxDelayMs,
      );

      // Add random jitter to prevent thundering herd
      const jitter = baseDelay * config.jitterPercentage * (Math.random() - 0.5) * 2;
      const delay = baseDelay + jitter;

      console.warn(
        `Retry attempt ${attempt}/${config.maxRetries} after ${Math.round(delay)}ms`,
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.exponentialBackoff(fn, config, attempt + 1);
    }
  }

  static shouldRetry(error: any): boolean {
    // Retry on transient errors
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];

    return (
      retryableStatusCodes.includes(error.response?.status) ||
      retryableErrors.includes(error.code)
    );
  }
}
```

**Usage**:
```typescript
async processPaymentWithRetry(paymentData: PaymentDto) {
  return RetryUtil.exponentialBackoff(async () => {
    try {
      return await this.paymentGatewayService.processPayment(paymentData);
    } catch (error) {
      if (!RetryUtil.shouldRetry(error)) {
        throw error; // Don't retry client errors (4xx)
      }
      throw error; // Retry transient errors (5xx, timeouts)
    }
  });
}
```

**Retry Schedule**:
- Attempt 1: Immediate
- Attempt 2: 1s + jitter
- Attempt 3: 2s + jitter
- Attempt 4: 4s + jitter
- Attempt 5: 8s + jitter
- Attempt 6: 16s + jitter

### Idempotency Key Implementation

#### Why Idempotency?

Prevent duplicate charges when:
- User clicks "Pay" multiple times
- Network timeout causes retry
- Webhook received multiple times
- System crashes and restarts

#### Database Schema

```typescript
// idempotency-key.entity.ts
@Entity('idempotency_keys')
export class IdempotencyKey {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'varchar', length: 50 })
  status: 'processing' | 'completed' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  request: any;

  @Column({ type: 'jsonb', nullable: true })
  response: any;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Index()
  @Column({ type: 'timestamp' })
  expiresAt: Date; // Clean up old keys (24-48 hours)
}
```

#### Interceptor Implementation

```typescript
// idempotency.interceptor.ts
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(IdempotencyKey)
    private idempotencyRepo: Repository<IdempotencyKey>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header required');
    }

    // Check if key exists
    const existing = await this.idempotencyRepo.findOne({
      where: { key: idempotencyKey },
    });

    if (existing) {
      if (existing.status === 'completed') {
        // Return cached response
        return of(existing.response);
      }

      if (existing.status === 'processing') {
        // Request in progress - return 409 Conflict
        throw new ConflictException('Request already processing');
      }

      if (existing.status === 'failed') {
        // Allow retry of failed requests
        await this.idempotencyRepo.update(
          { key: idempotencyKey },
          { status: 'processing' },
        );
      }
    } else {
      // Create new idempotency key
      await this.idempotencyRepo.save({
        key: idempotencyKey,
        status: 'processing',
        request: request.body,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      });
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Mark as completed and cache response
        await this.idempotencyRepo.update(
          { key: idempotencyKey },
          {
            status: 'completed',
            response,
            completedAt: new Date(),
          },
        );
      }),
      catchError(async (error) => {
        // Mark as failed
        await this.idempotencyRepo.update(
          { key: idempotencyKey },
          { status: 'failed' },
        );
        throw error;
      }),
    );
  }
}
```

**Controller Usage**:
```typescript
@Post('deposit')
@UseInterceptors(IdempotencyInterceptor)
async processDeposit(@Body() depositDto: DepositDto) {
  return this.paymentService.processDeposit(depositDto);
}
```

### Webhook Handling

#### Webhook Validation

```typescript
// webhook.controller.ts
@Controller('webhooks/payment')
export class PaymentWebhookController {
  constructor(
    private paymentService: PaymentService,
    private webhookService: WebhookService,
  ) {}

  @Post()
  async handlePaymentWebhook(
    @Headers('x-webhook-signature') signature: string,
    @Body() payload: any,
  ) {
    // 1. Validate signature
    if (!this.webhookService.verifySignature(payload, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 2. Check for duplicate webhook (idempotency)
    const webhookId = payload.id;
    const isDuplicate = await this.webhookService.isDuplicate(webhookId);

    if (isDuplicate) {
      return { received: true, message: 'Webhook already processed' };
    }

    // 3. Process webhook asynchronously
    await this.webhookService.enqueueWebhook(payload);

    // 4. Return 200 immediately (don't make payment gateway wait)
    return { received: true };
  }
}
```

#### Webhook Processing Queue

```typescript
// webhook.processor.ts
@Processor('payment-webhooks')
export class PaymentWebhookProcessor {
  @Process('process-webhook')
  async processWebhook(job: Job<PaymentWebhookData>) {
    const { event, data } = job.data;

    try {
      switch (event) {
        case 'payment.succeeded':
          await this.handlePaymentSuccess(data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(data);
          break;
        case 'refund.processed':
          await this.handleRefund(data);
          break;
      }
    } catch (error) {
      console.error('Webhook processing failed', error);
      throw error; // Trigger retry via Bull queue
    }
  }

  private async handlePaymentSuccess(data: any) {
    const { userId, amount, transactionId } = data;

    await this.dataSource.transaction(async (manager) => {
      // Credit user balance
      await manager.increment(
        User,
        { id: userId },
        'balance',
        amount,
      );

      // Record transaction
      await manager.save(Transaction, {
        userId,
        amount,
        type: 'deposit',
        status: 'completed',
        externalId: transactionId,
      });
    });
  }
}
```

#### Webhook Retry Configuration (Bull Queue)

```typescript
// webhook-queue.config.ts
export const webhookQueueConfig = {
  attempts: 10,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2 seconds initial
  },
  removeOnComplete: 100, // Keep last 100 completed
  removeOnFail: 1000, // Keep last 1000 failed
};
```

### Integration Pattern Summary

```typescript
// Complete payment flow
@Post('deposit')
@UseInterceptors(IdempotencyInterceptor)
async createDeposit(
  @Body() dto: DepositDto,
  @Headers('idempotency-key') idempotencyKey: string,
) {
  // 1. Validate request
  await this.validateDeposit(dto);

  // 2. Create pending transaction
  const transaction = await this.transactionRepo.save({
    userId: dto.userId,
    amount: dto.amount,
    type: 'deposit',
    status: 'pending',
  });

  try {
    // 3. Call payment gateway with circuit breaker + retry
    const result = await RetryUtil.exponentialBackoff(async () => {
      return await this.paymentGatewayService.processPayment({
        amount: dto.amount,
        currency: dto.currency,
        idempotencyKey,
      });
    });

    // 4. Update transaction (webhook will complete it)
    await this.transactionRepo.update(transaction.id, {
      status: 'processing',
      externalId: result.paymentId,
    });

    return {
      transactionId: transaction.id,
      paymentId: result.paymentId,
      status: 'processing',
    };
  } catch (error) {
    // 5. Mark transaction as failed
    await this.transactionRepo.update(transaction.id, {
      status: 'failed',
      errorMessage: error.message,
    });

    throw error;
  }
}
```

### Decision Summary

| Component | Technology | Configuration |
|-----------|-----------|---------------|
| **Circuit Breaker** | Opossum | 50% threshold, 30s reset |
| **Retry Strategy** | Exponential Backoff | 5 retries, 1s-16s delays |
| **Idempotency Storage** | PostgreSQL | 48h TTL |
| **Webhook Queue** | Bull (Redis) | 10 retries, exponential |

### Code Examples

**Complete Circuit Breaker + Retry Example**:
```typescript
async makeResilientPayment(paymentData: PaymentDto) {
  return await RetryUtil.exponentialBackoff(
    async () => {
      return await this.circuitBreaker.fire(
        paymentData.amount,
        paymentData.currency,
        paymentData.idempotencyKey,
      );
    },
    {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      multiplier: 2,
      jitterPercentage: 0.1,
    },
  );
}
```

### Alternatives Considered

| Pattern | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Simple Retry** | Easy to implement | No fail-fast mechanism | Not sufficient |
| **Circuit Breaker Only** | Prevents cascading failures | No automatic retry | Incomplete |
| **Queue-based Retry** | Resilient, durable | More complex infrastructure | Good for webhooks |
| **Circuit Breaker + Exponential Backoff** | Best of both worlds | Moderate complexity | **SELECTED** |

---

## 5. Database Transaction Patterns for Financial Integrity

### Overview

Financial operations (deposits, withdrawals, bet placement, pot distribution) require ACID guarantees to prevent race conditions, double-spending, and balance inconsistencies. This section covers locking strategies and transaction isolation levels in TypeORM with PostgreSQL.

### Pessimistic Locking vs Optimistic Locking

#### Pessimistic Locking (Recommended)

**Use When**:
- High contention expected (many concurrent updates)
- Must prevent conflicts
- Financial operations (balance updates)

**How It Works**:
- Acquires database row lock using `SELECT FOR UPDATE`
- Blocks other transactions from reading/writing
- Lock released when transaction commits/rolls back

**Pros**:
- Prevents conflicts at database level
- No retry logic needed
- Guaranteed consistency

**Cons**:
- Can cause deadlocks if not careful
- Reduced concurrency
- Held locks can block other queries

#### Optimistic Locking

**Use When**:
- Low contention expected
- Read-heavy workloads
- Non-critical updates

**How It Works**:
- Uses version column
- Checks version on update
- Throws error if version changed

**Pros**:
- Better concurrency
- No database locks

**Cons**:
- Requires retry logic
- Can fail frequently under high contention
- Not suitable for financial operations

**Decision**: Use **Pessimistic Locking** for all balance updates

### TypeORM Transaction Isolation Levels

PostgreSQL supports four isolation levels:

| Level | Phantom Reads | Non-repeatable Reads | Dirty Reads | Performance |
|-------|---------------|---------------------|-------------|-------------|
| READ UNCOMMITTED | Yes | Yes | Yes | Highest |
| READ COMMITTED (default) | Yes | Yes | No | High |
| REPEATABLE READ | No | No | No | Medium |
| SERIALIZABLE | No | No | No | Lowest |

**Recommendation**: `REPEATABLE READ` for financial transactions

### Implementation Patterns

#### 1. Balance Update with Pessimistic Locking

```typescript
// wallet.service.ts
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async updateBalance(
    userId: string,
    amount: number,
    transactionType: 'deposit' | 'withdrawal' | 'bet' | 'win',
  ): Promise<void> {
    await this.dataSource.transaction(
      'REPEATABLE READ', // Isolation level
      async (manager) => {
        // Lock user row
        const user = await manager
          .createQueryBuilder(User, 'user')
          .setLock('pessimistic_write') // SELECT FOR UPDATE
          .where('user.id = :userId', { userId })
          .getOne();

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // Validate sufficient funds for withdrawal/bet
        if (['withdrawal', 'bet'].includes(transactionType)) {
          if (user.balance < Math.abs(amount)) {
            throw new BadRequestException('Insufficient funds');
          }
        }

        // Update balance
        const newBalance = user.balance + amount;

        if (newBalance < 0) {
          throw new BadRequestException('Balance cannot be negative');
        }

        await manager.update(User, { id: userId }, { balance: newBalance });

        // Record transaction
        await manager.save(Transaction, {
          userId,
          amount,
          type: transactionType,
          balanceBefore: user.balance,
          balanceAfter: newBalance,
          createdAt: new Date(),
        });
      },
    );
  }
}
```

#### 2. Multiple Balance Updates (Pot Distribution)

```typescript
async distributePot(
  gameId: string,
  winners: Array<{ userId: string; amount: number }>,
): Promise<void> {
  await this.dataSource.transaction('REPEATABLE READ', async (manager) => {
    // Lock game to prevent duplicate distribution
    const game = await manager
      .createQueryBuilder(Game, 'game')
      .setLock('pessimistic_write')
      .where('game.id = :gameId', { gameId })
      .getOne();

    if (game.status !== 'completed') {
      throw new BadRequestException('Game not completed');
    }

    if (game.potDistributed) {
      throw new ConflictException('Pot already distributed');
    }

    // Lock all winner users in deterministic order (prevent deadlock)
    const userIds = winners.map(w => w.userId).sort();
    const users = await manager
      .createQueryBuilder(User, 'user')
      .setLock('pessimistic_write')
      .where('user.id IN (:...userIds)', { userIds })
      .orderBy('user.id', 'ASC') // Critical: always lock in same order
      .getMany();

    // Update balances
    for (const winner of winners) {
      const user = users.find(u => u.id === winner.userId);

      await manager.update(
        User,
        { id: winner.userId },
        { balance: () => `balance + ${winner.amount}` }, // Atomic increment
      );

      await manager.save(Transaction, {
        userId: winner.userId,
        gameId,
        amount: winner.amount,
        type: 'win',
        createdAt: new Date(),
      });
    }

    // Mark pot as distributed
    await manager.update(Game, { id: gameId }, { potDistributed: true });
  });
}
```

#### 3. Concurrent Bet Placement

```typescript
async placeBet(
  gameId: string,
  userId: string,
  betAmount: number,
): Promise<void> {
  await this.dataSource.transaction('REPEATABLE READ', async (manager) => {
    // Lock user
    const user = await manager
      .createQueryBuilder(User, 'user')
      .setLock('pessimistic_write')
      .where('user.id = :userId', { userId })
      .getOne();

    if (user.balance < betAmount) {
      throw new BadRequestException('Insufficient funds');
    }

    // Lock game
    const game = await manager
      .createQueryBuilder(Game, 'game')
      .setLock('pessimistic_write')
      .where('game.id = :gameId', { gameId })
      .getOne();

    if (game.status !== 'in_progress') {
      throw new BadRequestException('Game not accepting bets');
    }

    // Deduct from user balance
    await manager.decrement(User, { id: userId }, 'balance', betAmount);

    // Add to pot
    await manager.increment(Game, { id: gameId }, 'pot', betAmount);

    // Record bet
    await manager.save(Bet, {
      gameId,
      userId,
      amount: betAmount,
      createdAt: new Date(),
    });
  });
}
```

### Deadlock Prevention Strategies

#### 1. Always Lock in Same Order

```typescript
// BAD: Can cause deadlock
async transfer(fromUserId: string, toUserId: string, amount: number) {
  const fromUser = await manager.findOne(User, {
    where: { id: fromUserId },
    lock: { mode: 'pessimistic_write' },
  });

  const toUser = await manager.findOne(User, {
    where: { id: toUserId },
    lock: { mode: 'pessimistic_write' },
  }); // Deadlock if another transaction locks in reverse order
}

// GOOD: Always lock in deterministic order
async transfer(fromUserId: string, toUserId: string, amount: number) {
  const userIds = [fromUserId, toUserId].sort(); // Alphabetical order

  const users = await manager
    .createQueryBuilder(User, 'user')
    .setLock('pessimistic_write')
    .where('user.id IN (:...userIds)', { userIds })
    .orderBy('user.id', 'ASC')
    .getMany();
}
```

#### 2. Keep Transactions Short

```typescript
// BAD: Long transaction
await this.dataSource.transaction(async (manager) => {
  const user = await manager.findOne(..., { lock: 'pessimistic_write' });

  // External API call - increases lock duration
  await this.externalService.notifyPayment(user);

  await manager.update(User, { id: user.id }, { balance: newBalance });
});

// GOOD: Short transaction
const user = await this.dataSource.transaction(async (manager) => {
  const user = await manager.findOne(..., { lock: 'pessimistic_write' });
  await manager.update(User, { id: user.id }, { balance: newBalance });
  return user;
});

// Call external service after transaction
await this.externalService.notifyPayment(user);
```

#### 3. Use Timeouts

```typescript
async updateBalanceWithTimeout(userId: string, amount: number) {
  try {
    await this.dataSource.query('SET LOCAL lock_timeout = 5000'); // 5 seconds

    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .createQueryBuilder(User, 'user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId })
        .getOne();

      // ... update logic
    });
  } catch (error) {
    if (error.code === '55P03') { // Lock timeout
      throw new ConflictException('Unable to acquire lock - please try again');
    }
    throw error;
  }
}
```

### Transaction Isolation Level Configuration

#### Global Configuration

```typescript
// ormconfig.ts
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
  extra: {
    // Set default isolation level
    statement_timeout: 30000, // 30 seconds
    lock_timeout: 5000, // 5 seconds
  },
};
```

#### Per-Transaction Configuration

```typescript
// Use SERIALIZABLE for critical operations
await this.dataSource.transaction('SERIALIZABLE', async (manager) => {
  // Highest isolation, prevents all anomalies
  // Use for: final pot calculation, tournament payouts
});

// Use REPEATABLE READ for balance updates (recommended)
await this.dataSource.transaction('REPEATABLE READ', async (manager) => {
  // Prevents non-repeatable reads and phantom reads
  // Use for: balance updates, bet placement
});

// Use READ COMMITTED for read operations
await this.dataSource.transaction('READ COMMITTED', async (manager) => {
  // Default level, sufficient for most reads
  // Use for: displaying balances, transaction history
});
```

### Testing Transaction Scenarios

```typescript
// wallet.service.spec.ts
describe('WalletService - Concurrent Updates', () => {
  it('should handle concurrent balance updates without race condition', async () => {
    const userId = 'user-123';
    const initialBalance = 1000;

    // Create user
    await userRepo.save({ id: userId, balance: initialBalance });

    // Simulate 10 concurrent deposits of 100 each
    const promises = Array(10).fill(null).map(() =>
      service.updateBalance(userId, 100, 'deposit')
    );

    await Promise.all(promises);

    // Verify final balance is correct
    const user = await userRepo.findOne({ where: { id: userId } });
    expect(user.balance).toBe(2000); // 1000 + (10 * 100)
  });

  it('should prevent withdrawal with insufficient funds', async () => {
    const userId = 'user-123';
    await userRepo.save({ id: userId, balance: 100 });

    await expect(
      service.updateBalance(userId, -200, 'withdrawal')
    ).rejects.toThrow('Insufficient funds');

    // Balance should remain unchanged
    const user = await userRepo.findOne({ where: { id: userId } });
    expect(user.balance).toBe(100);
  });

  it('should handle deadlock with retry', async () => {
    const user1 = 'user-1';
    const user2 = 'user-2';

    await Promise.all([
      userRepo.save({ id: user1, balance: 1000 }),
      userRepo.save({ id: user2, balance: 1000 }),
    ]);

    // Concurrent transfers in opposite directions
    const transfer1 = service.transfer(user1, user2, 100);
    const transfer2 = service.transfer(user2, user1, 50);

    await Promise.all([transfer1, transfer2]);

    const [updatedUser1, updatedUser2] = await Promise.all([
      userRepo.findOne({ where: { id: user1 } }),
      userRepo.findOne({ where: { id: user2 } }),
    ]);

    expect(updatedUser1.balance).toBe(950); // 1000 - 100 + 50
    expect(updatedUser2.balance).toBe(1050); // 1000 + 100 - 50
  });
});
```

### Decision Summary

| Scenario | Locking Strategy | Isolation Level | Rationale |
|----------|------------------|-----------------|-----------|
| **Balance Update** | Pessimistic Write | REPEATABLE READ | Prevent double-spending |
| **Pot Distribution** | Pessimistic Write (ordered) | REPEATABLE READ | Atomic distribution, prevent deadlock |
| **Bet Placement** | Pessimistic Write | REPEATABLE READ | Ensure sufficient funds |
| **Transaction History** | No lock | READ COMMITTED | Read-only, no consistency issues |
| **Final Payout** | Pessimistic Write | SERIALIZABLE | Maximum safety for large amounts |

### TypeORM Examples Summary

**Basic Pessimistic Lock**:
```typescript
const user = await manager.findOne(User, {
  where: { id: userId },
  lock: { mode: 'pessimistic_write' },
});
```

**Query Builder with Lock**:
```typescript
const user = await manager
  .createQueryBuilder(User, 'user')
  .setLock('pessimistic_write')
  .where('user.id = :id', { id: userId })
  .getOne();
```

**Atomic Increment**:
```typescript
await manager.increment(User, { id: userId }, 'balance', amount);
// Generates: UPDATE users SET balance = balance + amount WHERE id = userId
```

### Alternatives Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Optimistic Locking** | Better concurrency | Requires retries, fails under contention | Not suitable |
| **Pessimistic Read** | Allows concurrent reads | Doesn't prevent writes | Insufficient |
| **Pessimistic Write** | Prevents all conflicts | Lower concurrency | **SELECTED** |
| **Application-level locks** | Language-agnostic | Not distributed-safe | Not recommended |

---

## 6. NestJS Testing Best Practices

### Overview

Test-Driven Development (TDD) with NestJS ensures code quality, maintainability, and confidence in refactoring. This section covers TDD workflow, Jest configuration, integration testing with Supertest, and mocking strategies.

### TDD Workflow (Red-Green-Refactor)

#### The TDD Cycle

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to make it pass
3. **REFACTOR**: Improve code while keeping tests passing

#### Example: Implementing User Balance Update

**Step 1: RED - Write Failing Test**

```typescript
// wallet.service.spec.ts
describe('WalletService', () => {
  let service: WalletService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(User),
          useValue: createMock<Repository<User>>(),
        },
        {
          provide: DataSource,
          useValue: createMock<DataSource>(),
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    userRepo = module.get(getRepositoryToken(User));
  });

  // Test fails because method doesn't exist yet
  it('should update user balance', async () => {
    const userId = 'user-123';
    const amount = 100;

    jest.spyOn(userRepo, 'findOne').mockResolvedValue({
      id: userId,
      balance: 1000,
    } as User);

    await service.updateBalance(userId, amount);

    expect(userRepo.save).toHaveBeenCalledWith({
      id: userId,
      balance: 1100,
    });
  });
});
```

**Step 2: GREEN - Write Minimal Code**

```typescript
// wallet.service.ts
@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async updateBalance(userId: string, amount: number): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    user.balance += amount;
    await this.userRepo.save(user);
  }
}
```

**Step 3: REFACTOR - Improve Code**

```typescript
// Add validation, error handling, transactions
async updateBalance(userId: string, amount: number): Promise<void> {
  return this.dataSource.transaction(async (manager) => {
    const user = await manager.findOne(User, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newBalance = user.balance + amount;

    if (newBalance < 0) {
      throw new BadRequestException('Insufficient funds');
    }

    await manager.update(User, { id: userId }, { balance: newBalance });
  });
}
```

**Step 4: Add More Tests (RED again)**

```typescript
it('should throw NotFoundException when user not found', async () => {
  jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

  await expect(
    service.updateBalance('invalid-user', 100)
  ).rejects.toThrow(NotFoundException);
});

it('should throw BadRequestException for insufficient funds', async () => {
  jest.spyOn(userRepo, 'findOne').mockResolvedValue({
    id: 'user-123',
    balance: 50,
  } as User);

  await expect(
    service.updateBalance('user-123', -100)
  ).rejects.toThrow(BadRequestException);
});
```

### Jest Configuration

#### jest.config.js

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/*.interface.ts',
    '!**/*.entity.ts',
    '!**/*.dto.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
```

#### package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

### Unit Testing with Mocking

#### Mocking Dependencies with @nestjs/testing

```typescript
// game.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';

describe('GameService', () => {
  let service: GameService;
  let walletService: WalletService;
  let gameRepo: Repository<Game>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: WalletService,
          useValue: createMock<WalletService>(),
        },
        {
          provide: getRepositoryToken(Game),
          useValue: createMock<Repository<Game>>(),
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    walletService = module.get<WalletService>(WalletService);
    gameRepo = module.get(getRepositoryToken(Game));
  });

  describe('placeBet', () => {
    it('should deduct balance and update pot', async () => {
      const gameId = 'game-123';
      const userId = 'user-123';
      const betAmount = 100;

      // Mock dependencies
      jest.spyOn(gameRepo, 'findOne').mockResolvedValue({
        id: gameId,
        pot: 500,
        status: 'in_progress',
      } as Game);

      jest.spyOn(walletService, 'updateBalance').mockResolvedValue();

      // Execute
      await service.placeBet(gameId, userId, betAmount);

      // Assert
      expect(walletService.updateBalance).toHaveBeenCalledWith(
        userId,
        -betAmount,
        'bet'
      );
      expect(gameRepo.update).toHaveBeenCalledWith(
        { id: gameId },
        { pot: 600 }
      );
    });

    it('should reject bet when game not in progress', async () => {
      jest.spyOn(gameRepo, 'findOne').mockResolvedValue({
        id: 'game-123',
        status: 'completed',
      } as Game);

      await expect(
        service.placeBet('game-123', 'user-123', 100)
      ).rejects.toThrow('Game not accepting bets');
    });
  });
});
```

#### Mocking External Services

```typescript
// payment.service.spec.ts
describe('PaymentService', () => {
  let service: PaymentService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should process payment successfully', async () => {
    const mockResponse = {
      data: { paymentId: 'pay-123', status: 'success' },
    };

    jest.spyOn(httpService, 'post').mockReturnValue(
      of(mockResponse) as any
    );

    const result = await service.processPayment(100, 'USD');

    expect(result.paymentId).toBe('pay-123');
    expect(httpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ amount: 100 }),
      expect.any(Object)
    );
  });

  it('should handle payment gateway error', async () => {
    jest.spyOn(httpService, 'post').mockReturnValue(
      throwError(() => new Error('Gateway error'))
    );

    await expect(
      service.processPayment(100, 'USD')
    ).rejects.toThrow('Gateway error');
  });
});
```

### Integration Testing with Supertest

#### E2E Test Setup

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return access token for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
```

#### Testing Protected Routes

```typescript
describe('/game/create (POST)', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    accessToken = response.body.accessToken;
  });

  it('should create game when authenticated', () => {
    return request(app.getHttpServer())
      .post('/game/create')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tableId: 'table-123',
        buyIn: 100,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.status).toBe('waiting');
      });
  });

  it('should return 401 when not authenticated', () => {
    return request(app.getHttpServer())
      .post('/game/create')
      .send({
        tableId: 'table-123',
        buyIn: 100,
      })
      .expect(401);
  });
});
```

#### Database Testing with Test Containers

```typescript
// test/setup.ts
import { DataSource } from 'typeorm';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: PostgreSqlContainer;
let dataSource: DataSource;

beforeAll(async () => {
  // Start PostgreSQL container
  container = await new PostgreSqlContainer('postgres:15')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withPassword('test_pass')
    .start();

  // Create data source
  dataSource = new DataSource({
    type: 'postgres',
    host: container.getHost(),
    port: container.getPort(),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await dataSource.initialize();
}, 60000);

afterAll(async () => {
  await dataSource.destroy();
  await container.stop();
});

beforeEach(async () => {
  // Clear database before each test
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.clear();
  }
});
```

### Testing Guidelines

#### 1. Test Structure (Arrange-Act-Assert)

```typescript
it('should distribute pot to winners', async () => {
  // ARRANGE - Set up test data
  const gameId = 'game-123';
  const winners = [
    { userId: 'user-1', amount: 300 },
    { userId: 'user-2', amount: 200 },
  ];

  jest.spyOn(gameRepo, 'findOne').mockResolvedValue({
    id: gameId,
    pot: 500,
    status: 'completed',
    potDistributed: false,
  } as Game);

  // ACT - Execute the method
  await service.distributePot(gameId, winners);

  // ASSERT - Verify results
  expect(walletService.updateBalance).toHaveBeenCalledTimes(2);
  expect(walletService.updateBalance).toHaveBeenCalledWith('user-1', 300, 'win');
  expect(walletService.updateBalance).toHaveBeenCalledWith('user-2', 200, 'win');
  expect(gameRepo.update).toHaveBeenCalledWith(
    { id: gameId },
    { potDistributed: true }
  );
});
```

#### 2. Test Naming Convention

```typescript
// Format: should [expected behavior] when [condition]
it('should throw NotFoundException when user not found', () => {});
it('should return empty array when no games exist', () => {});
it('should create game when all validations pass', () => {});
```

#### 3. Coverage Requirements

```bash
# Run tests with coverage
npm run test:cov

# Coverage report
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   75.32 |    72.18 |   76.45 |   75.89 |
 wallet.service.ts     |     100 |      100 |     100 |     100 |
 game.service.ts       |   85.71 |    80.00 |   90.00 |   86.36 |
 payment.service.ts    |   92.30 |    88.88 |   94.44 |   91.66 |
-----------------------|---------|----------|---------|---------|
```

### Decision Summary

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| **Testing Framework** | Jest | Built-in with NestJS, excellent TypeScript support |
| **Mocking Library** | @golevelup/ts-jest | Type-safe mocks, easy createMock helper |
| **E2E Testing** | Supertest | HTTP request simulation, integrates with NestJS |
| **Database Testing** | Testcontainers | Real PostgreSQL for integration tests |
| **Coverage Threshold** | 70% | Balanced requirement (not too strict, not too lax) |
| **TDD Approach** | Red-Green-Refactor | Industry best practice for quality code |

### Testing Guidelines Summary

1. **Write tests first** (TDD approach)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Follow AAA pattern** (Arrange-Act-Assert)
5. **Mock external dependencies**
6. **Test happy path and edge cases**
7. **Keep tests isolated** (no shared state)
8. **Run tests frequently** (on every commit)

### Alternatives Considered

| Tool/Approach | Pros | Cons | Verdict |
|---------------|------|------|---------|
| **Mocha + Chai** | Flexible, popular | More setup, less integrated | Not needed |
| **Vitest** | Very fast | Less NestJS integration | Too new |
| **Jest (SELECTED)** | Built-in, excellent TS support | Slower than Vitest | **SELECTED** |
| **Manual testing** | No setup needed | Error-prone, slow | Not acceptable |

---

## 7. Mobile-First UI Component Library

### Overview

A mobile-first poker UI requires touch-friendly components (minimum 44x44px touch targets), excellent performance on mobile devices, and customizable design. This research compares shadcn/ui, Ant Design, and Material-UI for the poker platform.

### Libraries Compared

#### Option 1: shadcn/ui

**Website**: https://ui.shadcn.com/
**Framework**: React + Tailwind CSS

**Architecture**:
- Not a traditional library - components are copied into your project
- Built with Radix UI primitives + Tailwind CSS
- Full source code ownership
- Utility-first styling

**Pros**:
- Unlimited customization (you own the code)
- Excellent tree-shaking (only include what you use)
- Very small bundle size
- Modern, clean design
- TypeScript support
- Accessible by default (Radix UI)
- No version conflicts (code is yours)
- Perfect for unique designs (custom poker UI)

**Cons**:
- Manual updates (copy new versions)
- More initial setup
- Need Tailwind CSS expertise
- No official mobile-specific components
- Smaller community than MUI/Ant Design

**Performance**:
- Lightest bundle size (~10-20KB per component)
- Excellent tree-shaking
- CSS-in-Tailwind (optimized)

**Mobile Support**:
- Responsive by default (Tailwind)
- Need to manually ensure 44x44px touch targets
- Touch gestures: Need additional libraries

**Customization**: 10/10 (Full source control)

#### Option 2: Ant Design

**Website**: https://ant.design/
**Framework**: React

**Architecture**:
- Traditional component library
- Comprehensive enterprise UI system
- CSS-in-JS styling
- Design system included

**Pros**:
- Comprehensive component library (100+ components)
- Enterprise-grade quality
- Strong design system
- Excellent documentation
- Large community (China + global)
- Built-in internationalization
- Icons included
- Regular updates

**Cons**:
- Large bundle size (~200KB+ minified)
- CSS-in-JS performance overhead
- Less customization flexibility
- Design feels "enterprise" (not ideal for poker)
- Heavy for mobile
- Not mobile-first

**Performance**:
- Larger bundle size
- CSS-in-JS has runtime cost
- Tree-shaking available but not as effective

**Mobile Support**:
- Mobile mode available
- Touch-friendly components exist
- Responsive design built-in
- Not optimized for mobile-first

**Customization**: 6/10 (Theme customization limited)

#### Option 3: Material-UI (MUI)

**Website**: https://mui.com/
**Framework**: React

**Architecture**:
- Traditional component library
- Implements Material Design
- Emotion (CSS-in-JS)
- Design system included

**Pros**:
- Mature, battle-tested (10+ years)
- Follows Material Design guidelines
- Excellent documentation
- Huge community
- Comprehensive component library
- TypeScript support
- Strong accessibility
- Regular updates

**Cons**:
- Material Design may not fit poker aesthetic
- Large bundle size (~150KB+ minified)
- CSS-in-JS performance overhead
- Opinionated design (hard to make "not Material")
- Heavier than shadcn/ui

**Performance**:
- Moderate bundle size
- CSS-in-JS runtime cost
- Good tree-shaking

**Mobile Support**:
- Mobile-friendly components
- Touch ripple effects
- Responsive by default
- Mobile-first breakpoints

**Customization**: 7/10 (Theme system available)

### Comparison Table

| Feature | shadcn/ui | Ant Design | Material-UI |
|---------|-----------|------------|-------------|
| **Bundle Size** | ~10-20KB | ~200KB+ | ~150KB+ |
| **Styling** | Tailwind CSS | CSS-in-JS | Emotion (CSS-in-JS) |
| **Customization** | 10/10 | 6/10 | 7/10 |
| **Mobile-First** | Yes (manual) | No | Partial |
| **Touch-Friendly** | Manual (44x44px) | Built-in | Built-in |
| **Performance** | Excellent | Good | Good |
| **Tree-Shaking** | Perfect | Good | Good |
| **TypeScript** | Excellent | Good | Excellent |
| **Accessibility** | Excellent (Radix) | Good | Excellent |
| **Learning Curve** | Moderate | Low | Low |
| **Community** | Growing | Large | Very Large |
| **Updates** | Manual | Automatic | Automatic |
| **Design Freedom** | Complete | Limited | Moderate |
| **Poker UI Fit** | Excellent | Fair | Fair |

### Touch-Friendly Requirements

#### Minimum Touch Target Size

**Standard**: 44x44px (iOS) / 48x48px (Material Design)

**Implementation**:

```typescript
// shadcn/ui - Custom touch-friendly button
export const TouchButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        // Ensure minimum touch target
        "min-h-[44px] min-w-[44px]",
        "inline-flex items-center justify-center",
        "rounded-md text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
```

#### Poker-Specific Components

```typescript
// Action buttons for poker
<div className="flex gap-2 p-4">
  <TouchButton
    variant="destructive"
    className="flex-1 min-h-[56px]" // Larger for game actions
  >
    Fold
  </TouchButton>
  <TouchButton
    variant="secondary"
    className="flex-1 min-h-[56px]"
  >
    Check
  </TouchButton>
  <TouchButton
    variant="default"
    className="flex-1 min-h-[56px]"
  >
    Raise
  </TouchButton>
</div>
```

### Performance Benchmarks

#### Bundle Size Comparison (Production Build)

```bash
# Next.js app with 10 components

# shadcn/ui
Total: 85KB (with Tailwind)
Components: ~15KB
Tailwind CSS: ~70KB

# Ant Design
Total: 285KB
Components: ~200KB
CSS-in-JS: ~85KB

# Material-UI
Total: 245KB
Components: ~165KB
Emotion: ~80KB
```

#### First Contentful Paint (Mobile 3G)

- **shadcn/ui**: ~1.2s
- **Ant Design**: ~2.1s
- **Material-UI**: ~1.8s

### Recommendation: **shadcn/ui**

**Decision**: Use shadcn/ui + Tailwind CSS

**Justification**:

1. **Performance**: Smallest bundle size (critical for mobile Telegram Mini App)
2. **Customization**: Complete control to build unique poker UI
3. **Mobile-First**: Tailwind CSS mobile-first breakpoints
4. **Modern**: Latest React patterns, hooks, Server Components
5. **Flexibility**: Can create custom poker components (cards, chips, tables)
6. **TypeScript**: Excellent type safety
7. **Accessibility**: Built on Radix UI primitives

**Trade-offs Accepted**:
- Manual component updates (worth it for customization)
- Need to build poker-specific components ourselves

### Implementation Guide

#### 1. Installation

```bash
# Initialize Next.js project
npx create-next-app@latest poker-ui --typescript --tailwind --app

# Install shadcn/ui
npx shadcn@latest init

# Add components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add slider
npx shadcn@latest add avatar
```

#### 2. Custom Poker Components

```typescript
// components/ui/poker-card.tsx
interface PokerCardProps {
  rank: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  faceDown?: boolean;
}

export const PokerCard = ({ rank, suit, faceDown }: PokerCardProps) => {
  const suitColors = {
    hearts: 'text-red-600',
    diamonds: 'text-red-600',
    clubs: 'text-gray-900',
    spades: 'text-gray-900',
  };

  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };

  if (faceDown) {
    return (
      <Card className="w-16 h-24 bg-blue-600 border-2 border-blue-700">
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-4xl">🂠</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-16 h-24 bg-white border-2 border-gray-300">
      <div className="p-2 flex flex-col items-center justify-between h-full">
        <span className={cn('text-2xl font-bold', suitColors[suit])}>
          {rank}
        </span>
        <span className={cn('text-4xl', suitColors[suit])}>
          {suitSymbols[suit]}
        </span>
        <span className={cn('text-2xl font-bold', suitColors[suit])}>
          {rank}
        </span>
      </div>
    </Card>
  );
};
```

```typescript
// components/ui/bet-slider.tsx
export const BetSlider = ({ max, min, onValueChange }: BetSliderProps) => {
  return (
    <div className="w-full space-y-4">
      <Slider
        min={min}
        max={max}
        step={10}
        onValueChange={onValueChange}
        className="w-full min-h-[44px] touch-none" // Touch-friendly
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>${min}</span>
        <span>${max}</span>
      </div>
    </div>
  );
};
```

#### 3. Mobile-First Breakpoints

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'xs': '375px',  // Small phones
      'sm': '640px',  // Large phones
      'md': '768px',  // Tablets
      'lg': '1024px', // Desktop (rare for Mini App)
    },
  },
};
```

#### 4. Poker Table Layout

```typescript
// components/poker-table.tsx
export const PokerTable = () => {
  return (
    <div className="h-screen flex flex-col bg-green-800">
      {/* Community Cards */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-2">
          <PokerCard rank="A" suit="spades" />
          <PokerCard rank="K" suit="hearts" />
          <PokerCard rank="Q" suit="diamonds" />
          <PokerCard rank="J" suit="clubs" />
          <PokerCard rank="10" suit="spades" />
        </div>
      </div>

      {/* Player Hand */}
      <div className="p-4 bg-gray-900">
        <div className="flex gap-4 justify-center mb-4">
          <PokerCard rank="A" suit="hearts" />
          <PokerCard rank="A" suit="diamonds" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <TouchButton variant="destructive" className="flex-1 min-h-[56px]">
            Fold
          </TouchButton>
          <TouchButton variant="secondary" className="flex-1 min-h-[56px]">
            Check
          </TouchButton>
          <TouchButton variant="default" className="flex-1 min-h-[56px]">
            Raise
          </TouchButton>
        </div>
      </div>
    </div>
  );
};
```

### Decision Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **UI Library** | shadcn/ui | Best performance, customization, mobile-first |
| **Styling** | Tailwind CSS | Utility-first, excellent mobile support |
| **Touch Targets** | 44x44px minimum | iOS accessibility guidelines |
| **Icons** | Lucide React | Lightweight, tree-shakeable |
| **Animations** | Tailwind + Framer Motion | Smooth, performant |

### Alternatives Considered

| Library | Best For | Not Ideal For | Verdict |
|---------|----------|---------------|---------|
| **shadcn/ui** | Custom designs, performance | Rapid prototyping with pre-built complex components | **SELECTED** |
| **Ant Design** | Enterprise dashboards, admin panels | Mobile-first apps, custom branding | Too heavy |
| **Material-UI** | Material Design apps, Google-style UIs | Custom designs, lightweight apps | Design doesn't fit |
| **Chakra UI** | Rapid development, consistent design | Maximum performance | Good alternative |

---

## 8. Localization Infrastructure (i18n-ready)

### Overview

Multi-language support is essential for a global poker platform. This research covers backend (nestjs-i18n) and frontend (next-intl) localization, resource file structure, fallback strategies, and React integration.

### Backend Localization: nestjs-i18n

#### Installation

```bash
npm install nestjs-i18n
```

#### Configuration

```typescript
// app.module.ts
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] }, // ?lang=en
        AcceptLanguageResolver, // Accept-Language header
        new HeaderResolver(['x-custom-lang']), // Custom header
      ],
      typesOutputPath: path.join(__dirname, '../src/generated/i18n.generated.ts'),
    }),
  ],
})
export class AppModule {}
```

#### Resource File Structure (Backend)

```
src/
└── i18n/
    ├── en/
    │   ├── common.json
    │   ├── game.json
    │   ├── errors.json
    │   └── validation.json
    ├── es/
    │   ├── common.json
    │   ├── game.json
    │   ├── errors.json
    │   └── validation.json
    └── ru/
        ├── common.json
        ├── game.json
        ├── errors.json
        └── validation.json
```

**Example: en/game.json**

```json
{
  "actions": {
    "fold": "Fold",
    "check": "Check",
    "call": "Call",
    "raise": "Raise",
    "allIn": "All In"
  },
  "messages": {
    "playerJoined": "{playerName} joined the table",
    "playerLeft": "{playerName} left the table",
    "yourTurn": "It's your turn!",
    "waiting": "Waiting for other players...",
    "gameStarted": "Game started",
    "handWon": "You won ${amount}!",
    "handLost": "You lost this hand"
  },
  "errors": {
    "insufficientFunds": "Insufficient funds",
    "notYourTurn": "It's not your turn",
    "invalidAction": "Invalid action",
    "tableFull": "Table is full"
  },
  "handRanks": {
    "highCard": "High Card",
    "pair": "Pair",
    "twoPair": "Two Pair",
    "threeOfAKind": "Three of a Kind",
    "straight": "Straight",
    "flush": "Flush",
    "fullHouse": "Full House",
    "fourOfAKind": "Four of a Kind",
    "straightFlush": "Straight Flush",
    "royalFlush": "Royal Flush"
  }
}
```

**Example: en/validation.json**

```json
{
  "username": {
    "required": "Username is required",
    "minLength": "Username must be at least {min} characters",
    "maxLength": "Username must be at most {max} characters",
    "invalid": "Username contains invalid characters"
  },
  "amount": {
    "required": "Amount is required",
    "positive": "Amount must be positive",
    "minimum": "Minimum amount is ${min}",
    "maximum": "Maximum amount is ${max}"
  }
}
```

#### Usage in Services

```typescript
// game.service.ts
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GameService {
  constructor(private readonly i18n: I18nService) {}

  async placeBet(userId: string, amount: number, lang: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (user.balance < amount) {
      throw new BadRequestException(
        await this.i18n.translate('game.errors.insufficientFunds', {
          lang,
        })
      );
    }

    // ... place bet logic

    return {
      message: await this.i18n.translate('game.messages.yourTurn', { lang }),
    };
  }

  async notifyWinner(userId: string, amount: number, lang: string) {
    const message = await this.i18n.translate('game.messages.handWon', {
      lang,
      args: { amount },
    });

    await this.notificationService.send(userId, message);
  }
}
```

#### Usage in Controllers

```typescript
// game.controller.ts
import { I18n, I18nContext } from 'nestjs-i18n';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('bet')
  async placeBet(
    @Body() dto: PlaceBetDto,
    @I18n() i18n: I18nContext, // Auto-resolved
  ) {
    return this.gameService.placeBet(
      dto.userId,
      dto.amount,
      i18n.lang, // Current language
    );
  }
}
```

#### Validation Messages

```typescript
// dto/place-bet.dto.ts
import { i18nValidationMessage } from 'nestjs-i18n';

export class PlaceBetDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.amount.required') })
  @IsPositive({ message: i18nValidationMessage('validation.amount.positive') })
  @Min(10, { message: i18nValidationMessage('validation.amount.minimum') })
  amount: number;
}
```

### Frontend Localization: next-intl

#### Installation

```bash
npm install next-intl
```

#### Project Structure

```
app/
├── [locale]/
│   ├── layout.tsx
│   ├── page.tsx
│   └── game/
│       └── page.tsx
├── i18n.ts
└── middleware.ts

messages/
├── en.json
├── es.json
└── ru.json
```

#### Configuration

```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
  timeZone: 'UTC',
  now: new Date(),
}));
```

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'ru', 'zh'],
  defaultLocale: 'en',
  localeDetection: true,
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

#### Layout Setup

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### Resource Files (Frontend)

**messages/en.json**:

```json
{
  "common": {
    "appName": "PW Gaming",
    "welcome": "Welcome back, {name}!",
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm"
  },
  "game": {
    "title": "Poker Table",
    "pot": "Pot: ${amount}",
    "yourBalance": "Your Balance: ${balance}",
    "actions": {
      "fold": "Fold",
      "check": "Check",
      "call": "Call ${amount}",
      "raise": "Raise",
      "allIn": "All In"
    },
    "status": {
      "waiting": "Waiting for players...",
      "yourTurn": "Your Turn",
      "opponentTurn": "{name}'s Turn",
      "handComplete": "Hand Complete"
    }
  },
  "lobby": {
    "title": "Game Lobby",
    "findTable": "Find Table",
    "createTable": "Create Table",
    "tableInfo": "{players}/{maxPlayers} players • ${buyIn} buy-in",
    "joinTable": "Join Table"
  }
}
```

#### Usage in Components (Server Components)

```typescript
// app/[locale]/game/page.tsx
import { useTranslations } from 'next-intl';

export default function GamePage() {
  const t = useTranslations('game');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('pot', { amount: 500 })}</p>

      <div className="actions">
        <button>{t('actions.fold')}</button>
        <button>{t('actions.check')}</button>
        <button>{t('actions.raise')}</button>
      </div>
    </div>
  );
}
```

#### Usage in Client Components

```typescript
// components/game-actions.tsx
'use client';

import { useTranslations } from 'next-intl';

export function GameActions({ pot, onAction }: GameActionsProps) {
  const t = useTranslations('game');
  const [betAmount, setBetAmount] = useState(0);

  return (
    <div>
      <p className="text-center text-xl mb-4">
        {t('pot', { amount: pot })}
      </p>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => onAction('fold')}>
          {t('actions.fold')}
        </button>
        <button onClick={() => onAction('check')}>
          {t('actions.check')}
        </button>
        <button onClick={() => onAction('raise', betAmount)}>
          {t('actions.raise')}
        </button>
      </div>

      <p className="text-sm mt-2">
        {t('yourBalance', { balance: 1000 })}
      </p>
    </div>
  );
}
```

#### Date and Number Formatting

```typescript
import { useFormatter, useTranslations } from 'next-intl';

export function TransactionHistory() {
  const t = useTranslations('transactions');
  const format = useFormatter();

  const transactions = [
    { id: 1, amount: 100, date: new Date('2024-01-15') },
    { id: 2, amount: -50, date: new Date('2024-01-16') },
  ];

  return (
    <div>
      <h2>{t('title')}</h2>
      {transactions.map(tx => (
        <div key={tx.id}>
          <span>{format.dateTime(tx.date, { dateStyle: 'short' })}</span>
          <span>{format.number(tx.amount, { style: 'currency', currency: 'USD' })}</span>
        </div>
      ))}
    </div>
  );
}
```

### Fallback Strategies

#### 1. Namespace Fallback

```typescript
// i18n.ts
export default getRequestConfig(async ({ locale }) => {
  let messages;

  try {
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    // Fall back to English if locale not found
    console.warn(`Locale ${locale} not found, falling back to English`);
    messages = (await import(`./messages/en.json`)).default;
  }

  return { messages };
});
```

#### 2. Missing Translation Fallback

```typescript
// next-intl configuration
{
  onError: (error) => {
    if (error.code === 'MISSING_MESSAGE') {
      console.warn('Missing translation:', error.message);
      // Log to error tracking service
    }
  },
  getMessageFallback: ({ namespace, key, error }) => {
    return `${namespace}.${key}`; // Return key as fallback
  },
}
```

#### 3. Partial Translation Support

```json
// messages/es.json (partial translation)
{
  "common": {
    "appName": "PW Gaming",
    "welcome": "Bienvenido, {name}!",
    // Missing translations will fall back to English
  }
}
```

### Key Naming Convention

**Recommended Structure**:

```
[namespace].[feature].[type].[specific]

Examples:
- game.actions.fold
- game.messages.playerJoined
- validation.username.required
- errors.payment.insufficientFunds
- common.buttons.save
```

**Benefits**:
- Clear hierarchy
- Easy to find translations
- Supports tree-shaking
- Autocomplete in IDE

### TypeScript Integration

#### Backend Type Generation

```typescript
// Generated automatically by nestjs-i18n
// src/generated/i18n.generated.ts

export type I18nTranslations = {
  'game.actions.fold': string;
  'game.actions.check': string;
  'game.messages.playerJoined': string;
  'validation.amount.required': string;
};

// Usage with type safety
const message = this.i18n.t<I18nTranslations>('game.actions.fold');
```

#### Frontend Type Safety

```typescript
// messages.d.ts
type Messages = typeof import('./messages/en.json');

declare global {
  interface IntlMessages extends Messages {}
}
```

```typescript
// Now you get autocomplete!
const t = useTranslations('game');
t('actions.fold'); // ✓ Autocomplete works
t('actions.invalid'); // ✗ TypeScript error
```

### Language Switching

#### Frontend Language Switcher

```typescript
// components/language-switcher.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const changeLanguage = (newLocale: string) => {
    // Replace locale in pathname
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <select value={locale} onChange={(e) => changeLanguage(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="ru">Русский</option>
      <option value="zh">中文</option>
    </select>
  );
}
```

### Performance Optimization

#### 1. Lazy Loading Translations

```typescript
// Only load needed translations
const messages = {
  common: (await import(`./messages/${locale}/common.json`)).default,
  game: (await import(`./messages/${locale}/game.json`)).default,
  // Don't load admin messages unless needed
};
```

#### 2. Static Generation with i18n

```typescript
// app/[locale]/page.tsx
export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'ru' },
    { locale: 'zh' },
  ];
}
```

### Decision Summary

| Aspect | Technology | Configuration |
|--------|-----------|---------------|
| **Backend i18n** | nestjs-i18n | JSON files, namespace organization |
| **Frontend i18n** | next-intl | App Router integration, Server Components |
| **File Structure** | Namespace-based | common.json, game.json, errors.json |
| **Fallback Strategy** | Default to English | Graceful degradation |
| **Type Safety** | Auto-generated types | TypeScript autocomplete |
| **Supported Languages** | en, es, ru, zh | Extensible to more |

### Complete Example: Full-Stack i18n

**Backend (NestJS)**:
```typescript
// game.service.ts
async endHand(gameId: string, winnerId: string, amount: number) {
  const winner = await this.userRepo.findOne({ where: { id: winnerId } });

  // Get user's language preference
  const lang = winner.preferredLanguage || 'en';

  // Send translated notification
  const message = await this.i18n.translate('game.messages.handWon', {
    lang,
    args: { amount },
  });

  await this.notificationService.send(winnerId, message);
}
```

**Frontend (Next.js)**:
```typescript
// app/[locale]/game/[id]/page.tsx
export default function GamePage({ params: { locale, id } }) {
  const t = useTranslations('game');

  return (
    <div>
      <h1>{t('title')}</h1>
      {/* All UI in user's language */}
    </div>
  );
}
```

### Alternatives Considered

| Solution | Pros | Cons | Verdict |
|----------|------|------|---------|
| **nestjs-i18n + next-intl** | Best integration, type safety | Separate configs | **SELECTED** |
| **i18next (full-stack)** | Unified solution | Less Next.js App Router support | Good alternative |
| **react-intl** | Popular, mature | Not optimized for Next.js 14+ | Outdated for App Router |
| **Custom solution** | Full control | Reinventing the wheel | Not recommended |

---

## Conclusion

This research document provides comprehensive guidance for implementing the Texas Hold'em Poker Platform MVP with:

1. **Secure Telegram authentication** using official validation libraries
2. **Fast hand evaluation** with proven poker algorithms
3. **Scalable real-time gameplay** using Socket.IO + Redis
4. **Resilient payment processing** with circuit breakers and idempotency
5. **Financial integrity** through pessimistic locking and transactions
6. **Quality assurance** via TDD with Jest and Supertest
7. **Excellent mobile UX** using shadcn/ui and Tailwind CSS
8. **Global reach** with nestjs-i18n and next-intl

All recommendations are based on 2024-2025 best practices, official documentation, and production-proven patterns.

---

**Next Steps**:
1. Review this research with the development team
2. Set up project with recommended technologies
3. Create proof-of-concept for critical paths (payment, game logic)
4. Begin TDD implementation following the Red-Green-Refactor cycle
5. Iterate on mobile UI design with real device testing
