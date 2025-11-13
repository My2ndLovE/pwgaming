# Texas Poker Platform MVP - Developer Quickstart Guide

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Running the Application](#3-running-the-application)
4. [TDD Workflow](#4-tdd-workflow-critical)
5. [Running Tests](#5-running-tests)
6. [Code Quality](#6-code-quality)
7. [Database Migrations](#7-database-migrations)
8. [API Testing](#8-api-testing)
9. [WebSocket Testing](#9-websocket-testing)
10. [Debugging](#10-debugging)
11. [Contribution Guidelines](#11-contribution-guidelines)
12. [Troubleshooting](#12-troubleshooting)
13. [Resources](#13-resources)

---

## 1. Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js 18+ LTS** - JavaScript runtime
  - Download from: https://nodejs.org/
  - Verify: `node --version` (should be 18.x or higher)

- **PostgreSQL 15+** - Primary database
  - Download from: https://www.postgresql.org/download/
  - Verify: `psql --version`

- **Redis 7+** - Caching and session storage
  - Download from: https://redis.io/download
  - Verify: `redis-cli --version`

- **Docker & Docker Compose** (recommended) - Containerization
  - Download from: https://www.docker.com/products/docker-desktop
  - Verify: `docker --version && docker-compose --version`

- **Git** - Version control
  - Download from: https://git-scm.com/downloads
  - Verify: `git --version`

### Development Tools

- **Telegram Account** - For Mini App testing
  - Mobile app recommended for testing

- **IDE Recommendations**
  - **VS Code** (recommended) with extensions:
    - ESLint
    - Prettier
    - TypeScript and JavaScript Language Features
    - Jest
    - GitLens
    - Thunder Client (API testing)
    - Docker
    - PostgreSQL Explorer

### Optional Tools

- **Postman** or **Insomnia** - API testing
- **Redis Desktop Manager** - Redis GUI
- **pgAdmin** - PostgreSQL GUI
- **websocat** - WebSocket testing CLI

---

## 2. Environment Setup

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd PWGaming_2

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

#### Backend Configuration

Create `backend/.env` file with the following variables:

```bash
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/poker_platform
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=poker_platform

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=30d

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
TELEGRAM_BOT_USERNAME=your_bot_username
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# Payment Gateway (Stars)
PAYMENT_GATEWAY_API_KEY=your-payment-gateway-api-key
PAYMENT_WEBHOOK_SECRET=your-payment-webhook-secret

# CORS
CORS_ORIGIN=http://localhost:3001,https://your-telegram-mini-app-domain

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# WebSocket
WS_PORT=3000
WS_PATH=/socket.io

# Game Settings
GAME_ACTION_TIMEOUT=30000
GAME_MIN_PLAYERS=2
GAME_MAX_PLAYERS=9
GAME_BLIND_INCREASE_INTERVAL=600000
```

#### Frontend Configuration

Create `frontend/.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Telegram
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username

# Application
NEXT_PUBLIC_APP_NAME=Texas Poker Platform
NEXT_PUBLIC_APP_VERSION=1.0.0

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### Database Setup

#### Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify containers are running
docker ps

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

#### Manual Setup

```bash
# Create database
createdb poker_platform

# Or using psql
psql -U postgres
CREATE DATABASE poker_platform;
\q

# Run migrations
cd backend
npm run migration:run

# Seed initial data (optional)
npm run seed
```

#### Verify Database Connection

```bash
# Test PostgreSQL connection
psql -U postgres -d poker_platform -c "SELECT version();"

# Test Redis connection
redis-cli ping
# Should return: PONG
```

---

## 3. Running the Application

### Development Mode

#### Backend (NestJS)

```bash
cd backend

# Start development server (port 3000)
npm run start:dev

# Server will be available at:
# - API: http://localhost:3000/api
# - Swagger Docs: http://localhost:3000/api/docs
# - Health Check: http://localhost:3000/health
```

#### Frontend (Next.js)

```bash
cd frontend

# Start development server (port 3001)
npm run dev

# Application will be available at:
# - Web App: http://localhost:3001
```

#### Run Both with Docker Compose

```bash
# Start all services (backend, frontend, postgres, redis)
docker-compose up

# Run in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Production Build

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run start
```

### Testing Telegram Mini App

#### 1. Create Test Bot

```bash
# Open Telegram and message @BotFather
/newbot
# Follow prompts to create bot
# Save the bot token
```

#### 2. Configure Ngrok for Local HTTPS

```bash
# Install ngrok
# macOS: brew install ngrok
# Windows: download from https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Add to backend/.env as TELEGRAM_WEBHOOK_URL
```

#### 3. Set Up Webhook

```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://abc123.ngrok.io/api/telegram/webhook"}'

# Verify webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

#### 4. Test with Telegram

- Open Telegram app (web or mobile)
- Search for your bot username
- Send `/start` command
- Click the "Play Poker" button
- Mini App should open with your frontend

---

## 4. TDD Workflow (CRITICAL)

This project follows strict Test-Driven Development (TDD) practices. All production code MUST be written using the Red-Green-Refactor cycle.

### Red-Green-Refactor Cycle

#### Step 1 - RED: Write Failing Test

Write a test that fails because the functionality doesn't exist yet.

```typescript
// backend/test/unit/game/side-pot.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SidePotService } from '../../../src/modules/game/services/side-pot.service';

describe('SidePotService', () => {
  let service: SidePotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SidePotService],
    }).compile();

    service = module.get<SidePotService>(SidePotService);
  });

  describe('calculateSidePots', () => {
    it('should calculate side pots with multiple all-ins', () => {
      const players = [
        { id: '1', name: 'Alice', bet: 50, isAllIn: true, stack: 0 },
        { id: '2', name: 'Bob', bet: 100, isAllIn: true, stack: 0 },
        { id: '3', name: 'Charlie', bet: 150, isAllIn: false, stack: 50 },
      ];

      const result = service.calculateSidePots(players);

      // Test FAILS - service.calculateSidePots() doesn't exist yet
      expect(result.mainPot).toBe(150);
      expect(result.sidePots).toHaveLength(2);
      expect(result.sidePots[0].amount).toBe(100);
      expect(result.sidePots[0].eligiblePlayerIds).toEqual(['2', '3']);
    });
  });
});
```

Run the test - it should FAIL:

```bash
npm run test -- side-pot.service.spec.ts
# Expected: Test fails because calculateSidePots() doesn't exist
```

#### Step 2 - GREEN: Write Minimum Code to Pass

Write the minimum code necessary to make the test pass.

```typescript
// backend/src/modules/game/services/side-pot.service.ts
import { Injectable } from '@nestjs/common';

interface Player {
  id: string;
  name: string;
  bet: number;
  isAllIn: boolean;
  stack: number;
}

interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

interface PotState {
  mainPot: number;
  sidePots: SidePot[];
}

@Injectable()
export class SidePotService {
  calculateSidePots(players: Player[]): PotState {
    // Minimum implementation to pass test
    return {
      mainPot: 150,
      sidePots: [
        {
          amount: 100,
          eligiblePlayerIds: ['2', '3'],
        },
      ],
    };
  }
}
```

Run the test - it should PASS:

```bash
npm run test -- side-pot.service.spec.ts
# Expected: Test passes
```

#### Step 3 - REFACTOR: Improve Code While Tests Pass

Refactor the implementation for correctness, edge cases, and maintainability.

```typescript
// backend/src/modules/game/services/side-pot.service.ts
import { Injectable } from '@nestjs/common';

interface Player {
  id: string;
  name: string;
  bet: number;
  isAllIn: boolean;
  stack: number;
}

interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

interface PotState {
  mainPot: number;
  sidePots: SidePot[];
}

@Injectable()
export class SidePotService {
  calculateSidePots(players: Player[]): PotState {
    // Sort players by bet amount
    const sortedPlayers = [...players].sort((a, b) => a.bet - b.bet);

    const sidePots: SidePot[] = [];
    let remainingPlayers = [...sortedPlayers];
    let previousBet = 0;

    for (let i = 0; i < sortedPlayers.length; i++) {
      const player = sortedPlayers[i];
      const betDifference = player.bet - previousBet;

      if (betDifference > 0 && remainingPlayers.length > 1) {
        const potAmount = betDifference * remainingPlayers.length;
        const eligiblePlayerIds = remainingPlayers.map(p => p.id);

        if (i === 0) {
          // Main pot
          sidePots.push({
            amount: potAmount,
            eligiblePlayerIds,
          });
        } else {
          // Side pot
          sidePots.push({
            amount: potAmount,
            eligiblePlayerIds,
          });
        }
      }

      previousBet = player.bet;

      // Remove all-in players from eligible players for next pot
      if (player.isAllIn) {
        remainingPlayers = remainingPlayers.filter(p => p.id !== player.id);
      }
    }

    const mainPot = sidePots.length > 0 ? sidePots[0].amount : 0;
    const actualSidePots = sidePots.slice(1);

    return {
      mainPot,
      sidePots: actualSidePots,
    };
  }
}
```

Run tests again - they should still PASS:

```bash
npm run test -- side-pot.service.spec.ts
# Expected: All tests pass after refactoring
```

### Git Workflow with TDD

Commit at each stage of the TDD cycle:

```bash
# 1. Write failing test (commit RED state)
git add test/unit/game/side-pot.service.spec.ts
git commit -m "test: add side pot calculation test (RED)"

# 2. Implement minimum code (commit GREEN state)
git add src/modules/game/services/side-pot.service.ts
git commit -m "feat: implement side pot calculation (GREEN)"

# 3. Refactor (commit REFACTOR state)
git add src/modules/game/services/side-pot.service.ts
git commit -m "refactor: optimize side pot algorithm (REFACTOR)"
```

### TDD Best Practices

1. **Always write the test first** - No exceptions
2. **Make it fail** - Ensure the test fails before writing implementation
3. **Write minimum code** - Only write enough code to pass the test
4. **Refactor with confidence** - Tests ensure your refactoring doesn't break functionality
5. **One test at a time** - Focus on one behavior per test
6. **Test behavior, not implementation** - Tests should describe what the code does, not how
7. **Keep tests fast** - Unit tests should run in milliseconds

### When to Write Tests

- **Unit Tests**: For all services, utilities, and business logic
- **Integration Tests**: For API endpoints and database operations
- **E2E Tests**: For complete user workflows

---

## 5. Running Tests

### Unit Tests

Unit tests verify individual components in isolation.

```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test -- side-pot.service.spec.ts

# Run tests for specific module
npm run test -- wallet

# Watch mode (re-run tests on file changes)
npm run test:watch

# Watch mode for specific file
npm run test:watch -- side-pot.service.spec.ts

# Generate coverage report (must meet 70% minimum)
npm run test:cov

# Open coverage report in browser
open coverage/lcov-report/index.html
```

### Integration Tests

Integration tests verify API endpoints and database interactions using TestContainers.

```bash
# Run all integration tests
npm run test:integration

# Run specific endpoint tests
npm run test:integration -- auth

# Run with coverage
npm run test:integration:cov
```

Example integration test:

```typescript
// backend/test/integration/wallet/deposit.e2e-spec.ts
describe('Wallet Deposit (Integration)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // TestContainers will start PostgreSQL and Redis
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /wallet/deposit - should create deposit request', async () => {
    const response = await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 100,
        currency: 'XTR',
      })
      .expect(201);

    expect(response.body).toHaveProperty('transactionId');
    expect(response.body.amount).toBe(100);
    expect(response.body.status).toBe('PENDING');
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### E2E Tests

E2E tests verify complete user workflows.

```bash
# Run all E2E tests
npm run test:e2e

# Run specific user story
npm run test:e2e -- user-story-1

# Run with specific browser (Playwright)
npm run test:e2e -- --project=chromium
```

Example E2E test:

```typescript
// backend/test/e2e/user-story-1.e2e-spec.ts
describe('User Story 1: Telegram Authentication and Wallet Funding', () => {
  it('should complete full authentication and deposit flow', async () => {
    // 1. Authenticate via Telegram
    const authResponse = await request(app.getHttpServer())
      .post('/auth/telegram')
      .send({ initData: mockTelegramInitData })
      .expect(200);

    const token = authResponse.body.accessToken;

    // 2. Check wallet balance (should be 0)
    const balanceResponse = await request(app.getHttpServer())
      .get('/wallet/balance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(balanceResponse.body.balance).toBe(0);

    // 3. Create deposit request
    const depositResponse = await request(app.getHttpServer())
      .post('/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000, currency: 'XTR' })
      .expect(201);

    // 4. Simulate payment webhook
    await request(app.getHttpServer())
      .post('/payment/webhook')
      .send({
        transactionId: depositResponse.body.transactionId,
        status: 'SUCCESS',
      })
      .expect(200);

    // 5. Verify balance updated
    const updatedBalanceResponse = await request(app.getHttpServer())
      .get('/wallet/balance')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(updatedBalanceResponse.body.balance).toBe(1000);
  });
});
```

### Coverage Gates

The project enforces minimum code coverage:

- **Overall Coverage**: 70% minimum
- **Branch Coverage**: 70% minimum
- **Function Coverage**: 70% minimum
- **Line Coverage**: 70% minimum

Pull requests will be blocked if coverage drops below threshold.

```bash
# Generate coverage report
npm run test:cov

# View coverage summary
cat coverage/coverage-summary.json

# Open HTML report
open coverage/lcov-report/index.html
```

---

## 6. Code Quality

### Linting

ESLint enforces code style and catches potential bugs.

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Lint specific files
npm run lint -- src/modules/game/**/*.ts
```

### Formatting

Prettier enforces consistent code formatting.

```bash
# Check formatting
npm run format:check

# Auto-format all files
npm run format

# Format specific files
npm run format -- src/modules/game/**/*.ts
```

### Type Checking

TypeScript type checking ensures type safety.

```bash
# Run TypeScript type check
npm run type-check

# Watch mode
npm run type-check:watch
```

### Pre-commit Hooks (Husky)

Pre-commit hooks automatically run checks before commits:

- **Lint-staged**: Runs linter on staged files
- **Format**: Formats staged files with Prettier
- **Type-check**: Runs TypeScript type checking
- **Tests**: Runs tests affected by changes

If any check fails, the commit will be blocked.

```bash
# To bypass pre-commit hooks (not recommended)
git commit --no-verify -m "commit message"
```

### Code Quality Standards

- **No `any` types**: Use proper TypeScript types
- **No `console.log`**: Use proper logging service
- **No hardcoded strings**: Use i18n resources
- **No emojis in code**: Use icon libraries for UI
- **Error handling**: All async operations must have try-catch
- **Documentation**: All public methods must have JSDoc comments

---

## 7. Database Migrations

### Create Migration

```bash
# Generate migration from entity changes
npm run migration:generate -- -n AddTransactionTable

# Create empty migration
npm run migration:create -- -n AddIndexToUsersTable
```

Example migration:

```typescript
// backend/src/database/migrations/1234567890-AddTransactionTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddTransactionTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'SUCCESS', 'FAILED'],
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transactions');
  }
}
```

### Run Migrations

```bash
# Run all pending migrations
npm run migration:run

# Show migration status
npm run migration:show

# Revert last migration
npm run migration:revert

# Revert all migrations
npm run migration:revert:all
```

### Migration Best Practices

1. **Never modify existing migrations** - Create new ones
2. **Always implement `down` method** - For rollback support
3. **Test migrations** - Run up and down before committing
4. **Use transactions** - Ensure atomic operations
5. **Add indexes** - For frequently queried columns

---

## 8. API Testing

### Using Swagger UI

1. Start the backend server:
   ```bash
   npm run start:dev
   ```

2. Navigate to Swagger UI:
   ```
   http://localhost:3000/api/docs
   ```

3. Authenticate:
   - Click "Authorize" button
   - Use `/auth/telegram` endpoint to get JWT token
   - Copy `accessToken` from response
   - Paste into "Authorize" dialog
   - Click "Authorize"

4. Test endpoints:
   - Expand endpoint
   - Click "Try it out"
   - Fill in parameters
   - Click "Execute"
   - View response

### Using curl

```bash
# Authenticate
TOKEN=$(curl -X POST http://localhost:3000/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "initData": "query_id=AAHdF6IQAAAAAN0XohDhrOrc"
  }' | jq -r '.accessToken')

# Get wallet balance
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer $TOKEN" | jq

# Create deposit request
curl -X POST http://localhost:3000/api/wallet/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "XTR"
  }' | jq

# Get transaction history
curl "http://localhost:3000/api/wallet/transactions?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq

# Join game room
curl -X POST http://localhost:3000/api/room/123/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buyIn": 1000
  }' | jq
```

### Using Postman

1. Import OpenAPI spec:
   - Download spec from http://localhost:3000/api/docs-json
   - Import into Postman

2. Create environment:
   - Add `baseUrl`: `http://localhost:3000`
   - Add `token`: `<your-jwt-token>`

3. Use `{{baseUrl}}` and `{{token}}` in requests

---

## 9. WebSocket Testing

### Using websocat

```bash
# Install websocat
# macOS:
brew install websocat

# Linux:
wget https://github.com/vi/websocat/releases/download/v1.11.0/websocat_linux64
chmod +x websocat_linux64
sudo mv websocat_linux64 /usr/local/bin/websocat

# Windows: Download from GitHub releases

# Connect to game namespace
websocat "ws://localhost:3000/game?token=$TOKEN"

# Send events (type in terminal):
{"event": "game:join", "data": {"gameId": "123"}}
{"event": "game:action", "data": {"action": "CALL"}}
{"event": "game:leave"}

# Listen for events from server
# Server will send: {"event": "game:state", "data": {...}}
```

### Using Socket.IO Client (Node.js)

```typescript
// test-websocket.ts
import { io } from 'socket.io-client';

const token = 'YOUR_JWT_TOKEN';

const socket = io('http://localhost:3000/game', {
  auth: { token },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected to game server');

  // Join game
  socket.emit('game:join', { gameId: '123' });
});

socket.on('game:state', (data) => {
  console.log('Game state update:', data);
});

socket.on('game:action_required', (data) => {
  console.log('Action required:', data);

  // Respond with action
  socket.emit('game:action', { action: 'CALL' });
});

socket.on('game:hand_complete', (data) => {
  console.log('Hand complete:', data);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from game server');
});
```

Run the test:

```bash
npx ts-node test-websocket.ts
```

### Using Socket.IO Client (Browser)

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebSocket Test</title>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Game WebSocket Test</h1>
  <div id="log"></div>

  <script>
    const token = 'YOUR_JWT_TOKEN';
    const socket = io('http://localhost:3000/game', {
      auth: { token },
      transports: ['websocket'],
    });

    function log(message) {
      document.getElementById('log').innerHTML += `<p>${message}</p>`;
    }

    socket.on('connect', () => {
      log('Connected to game server');
      socket.emit('game:join', { gameId: '123' });
    });

    socket.on('game:state', (data) => {
      log('Game state: ' + JSON.stringify(data));
    });

    socket.on('game:action_required', (data) => {
      log('Action required: ' + JSON.stringify(data));
      // Auto-call for testing
      setTimeout(() => {
        socket.emit('game:action', { action: 'CALL' });
      }, 1000);
    });

    socket.on('error', (error) => {
      log('Error: ' + error.message);
    });
  </script>
</body>
</html>
```

### WebSocket Events Reference

#### Client to Server

- `game:join` - Join a game
- `game:leave` - Leave a game
- `game:action` - Perform game action (CHECK, CALL, RAISE, FOLD, ALL_IN)

#### Server to Client

- `game:state` - Full game state update
- `game:action_required` - Player's turn to act
- `game:hand_complete` - Hand finished
- `game:player_joined` - Player joined game
- `game:player_left` - Player left game
- `error` - Error occurred

---

## 10. Debugging

### Backend (NestJS)

#### Debug with VS Code

1. Add launch configuration:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to NestJS",
      "port": 9229,
      "restart": true,
      "stopOnEntry": false,
      "protocol": "inspector"
    }
  ]
}
```

2. Start backend in debug mode:

```bash
cd backend
npm run start:debug
```

3. Attach VS Code debugger:
   - Press F5 or click "Run and Debug"
   - Select "Attach to NestJS"
   - Set breakpoints in code
   - Make API requests to trigger breakpoints

#### Debug Tests

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": [
    "${fileBasename}",
    "--config",
    "jest.config.js",
    "--runInBand"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "disableOptimisticBPs": true
}
```

### Frontend (Next.js)

#### Debug with VS Code

1. Add launch configuration:

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Next.js: debug server-side",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "port": 9229,
  "cwd": "${workspaceFolder}/frontend",
  "serverReadyAction": {
    "pattern": "started server on .+, url: (https?://.+)",
    "uriFormat": "%s",
    "action": "debugWithChrome"
  }
}
```

2. Start debugging:
   - Press F5
   - Next.js automatically enables debugging
   - Set breakpoints in components or API routes

#### Debug Client-Side

Use Chrome DevTools:
- Press F12 in browser
- Set breakpoints in Sources tab
- Use React DevTools extension

### Logging

```typescript
// Use Logger service, not console.log
import { Logger } from '@nestjs/common';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  async startGame(gameId: string) {
    this.logger.log(`Starting game: ${gameId}`);
    this.logger.debug(`Game state: ${JSON.stringify(gameState)}`);
    this.logger.warn(`Low player count: ${playerCount}`);
    this.logger.error(`Failed to start game: ${error.message}`, error.stack);
  }
}
```

Set log level in `.env`:

```bash
LOG_LEVEL=debug  # debug, log, warn, error
```

---

## 11. Contribution Guidelines

### Branch Naming

Follow this naming convention:

```bash
# Feature branches
feature/user-story-1-telegram-auth
feature/user-story-2-wallet-funding
feature/side-pot-calculation

# Bugfix branches
bugfix/wallet-negative-balance
bugfix/websocket-disconnect

# Test branches
test/game-service-unit-tests
test/integration-wallet-endpoints

# Refactor branches
refactor/room-service-optimization
```

### Commit Messages (Conventional Commits)

Follow Conventional Commits specification:

```bash
# Format
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `perf`: Performance improvements
- `chore`: Build process or tooling changes

#### Examples

```bash
# Feature
feat(wallet): add deposit request endpoint

# Test (TDD)
test(game): add side pot calculation tests (RED)

# Fix
fix(auth): handle expired JWT tokens

# Refactor
refactor(room): optimize room query performance

# Documentation
docs(api): update OpenAPI spec for wallet module

# Multiple lines
feat(game): implement Texas Hold'em hand evaluation

- Add hand ranking algorithm
- Implement kicker comparison
- Add unit tests for all hand types

Closes #123
```

### Pull Request Process

1. **Create feature branch**:
   ```bash
   git checkout -b feature/user-story-3-game-lobby
   ```

2. **Write tests first (TDD)**:
   ```bash
   # Write failing test
   git add test/unit/lobby/lobby.service.spec.ts
   git commit -m "test: add lobby room listing test (RED)"
   ```

3. **Implement feature**:
   ```bash
   # Minimum implementation
   git add src/modules/lobby/lobby.service.ts
   git commit -m "feat: implement lobby room listing (GREEN)"

   # Refactor
   git add src/modules/lobby/lobby.service.ts
   git commit -m "refactor: optimize lobby query with indexes (REFACTOR)"
   ```

4. **Ensure all tests pass**:
   ```bash
   npm run test
   npm run test:integration
   npm run test:e2e
   ```

5. **Run linter and formatter**:
   ```bash
   npm run lint:fix
   npm run format
   ```

6. **Check coverage**:
   ```bash
   npm run test:cov
   # Ensure coverage meets 70% minimum
   ```

7. **Push and create PR**:
   ```bash
   git push origin feature/user-story-3-game-lobby
   # Create PR on GitHub
   ```

8. **Wait for CI/CD checks**:
   - All tests must pass
   - Coverage must meet threshold
   - Linting must pass
   - Type checking must pass

9. **Request code review**:
   - Tag at least 2 reviewers
   - Respond to comments
   - Make requested changes

10. **Merge after approval**:
    - Squash and merge (preferred)
    - Rebase and merge
    - Delete branch after merge

### Code Review Checklist

Reviewers should verify:

- [ ] Tests written first (TDD approach)
- [ ] All tests passing
- [ ] Coverage meets 70% minimum
- [ ] No hardcoded strings (i18n-ready)
- [ ] No emojis in production UI (use icon library)
- [ ] Error handling implemented
- [ ] API contracts followed
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] No sensitive data in commits
- [ ] No console.log statements
- [ ] No `any` types
- [ ] Proper TypeScript types used
- [ ] Code follows project conventions
- [ ] Commit messages follow Conventional Commits

### Definition of Done

A feature is "Done" when:

1. Tests written first (RED)
2. Implementation completed (GREEN)
3. Code refactored (REFACTOR)
4. All tests passing
5. Coverage meets 70% minimum
6. Linting and formatting pass
7. Documentation updated
8. Code reviewed and approved
9. PR merged to main branch
10. Feature deployed to staging

---

## 12. Troubleshooting

### Database Connection Fails

#### Check PostgreSQL is Running

```bash
# Docker
docker ps | grep postgres

# If not running
docker-compose up -d postgres

# Check logs
docker-compose logs postgres
```

#### Test Connection

```bash
# Using psql
psql $DATABASE_URL

# Or
psql -h localhost -p 5432 -U postgres -d poker_platform

# If connection fails, check:
# 1. PostgreSQL is running
# 2. Port 5432 is not in use by another process
# 3. Database credentials are correct
# 4. Database exists
```

#### Create Database Manually

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE poker_platform;

# Verify
\l

# Exit
\q
```

### Redis Connection Fails

#### Check Redis is Running

```bash
# Docker
docker ps | grep redis

# If not running
docker-compose up -d redis

# Check logs
docker-compose logs redis
```

#### Test Connection

```bash
# Using redis-cli
redis-cli ping
# Should return: PONG

# If connection fails, check:
# 1. Redis is running
# 2. Port 6379 is not in use
# 3. Redis URL is correct
```

### Tests Fail with Timeout

```bash
# Increase Jest timeout globally
# jest.config.js
module.exports = {
  testTimeout: 30000, // 30 seconds
};

# Or in specific test file
jest.setTimeout(30000);

# Or in specific test
it('should complete long operation', async () => {
  // Test code
}, 30000); // 30 seconds timeout
```

### WebSocket Connection Fails

#### Check CORS Configuration

```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:3001', 'https://your-domain.com'],
  credentials: true,
});
```

#### Verify JWT Token

```bash
# Decode JWT token
echo "YOUR_TOKEN" | cut -d. -f2 | base64 -d | jq

# Check expiration
# If expired, get new token from /auth/telegram
```

#### Check Firewall

```bash
# Allow port 3000
# Windows:
netsh advfirewall firewall add rule name="NestJS" dir=in action=allow protocol=TCP localport=3000

# macOS/Linux:
sudo ufw allow 3000
```

#### Try HTTP First

```javascript
// Test with HTTP before upgrading to WSS
const socket = io('http://localhost:3000/game', {
  auth: { token },
  transports: ['websocket'],
});
```

### Port Already in Use

```bash
# Find process using port
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000

# Kill process
# Windows:
taskkill /PID <PID> /F

# macOS/Linux:
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
npm install

# Check Node.js version
node --version
# Should be 18.x or higher
```

### Docker Container Issues

```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild containers
docker-compose up --build

# Check container logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs redis

# Restart specific container
docker-compose restart backend
```

### Migration Fails

```bash
# Check migration status
npm run migration:show

# Revert last migration
npm run migration:revert

# Drop all tables and re-run migrations
# WARNING: This deletes all data
npm run migration:drop
npm run migration:run

# Check database schema
psql -d poker_platform -c "\dt"
```

### Environment Variables Not Loaded

```bash
# Check .env file exists
ls -la backend/.env
ls -la frontend/.env.local

# Print environment variables (be careful with secrets)
node -e "console.log(process.env.DATABASE_URL)"

# Restart development server after changing .env
# Kill server (Ctrl+C) and restart
npm run start:dev
```

---

## 13. Resources

### Project Documentation

- **API Contracts**: `/specs/001-poker-platform-mvp/contracts/`
  - `auth.contract.md` - Authentication endpoints
  - `wallet.contract.md` - Wallet endpoints
  - `room.contract.md` - Room management endpoints
  - `game.contract.md` - Game WebSocket events

- **Data Models**: `/specs/001-poker-platform-mvp/data-model.md`
  - Database schema
  - Entity relationships
  - Field descriptions

- **Technical Reference**: `/docs/texas-holdem-technical-reference.md`
  - Game rules and logic
  - Hand ranking algorithm
  - Betting rounds
  - Pot calculation

- **Research Decisions**: `/specs/001-poker-platform-mvp/research.md`
  - Architecture decisions
  - Technology choices
  - Trade-offs and rationale

### External Documentation

#### Backend (NestJS)

- **NestJS Documentation**: https://docs.nestjs.com
  - Controllers and routing
  - Providers and dependency injection
  - Modules
  - WebSocket gateways
  - Testing

- **TypeORM Documentation**: https://typeorm.io
  - Entity definitions
  - Repository API
  - Migrations
  - Query builder

- **Socket.IO Documentation**: https://socket.io/docs
  - WebSocket events
  - Rooms and namespaces
  - Authentication

#### Frontend (Next.js)

- **Next.js Documentation**: https://nextjs.org/docs
  - App Router
  - Server components
  - API routes
  - Deployment

- **React Documentation**: https://react.dev
  - Hooks
  - Components
  - State management

- **Tailwind CSS Documentation**: https://tailwindcss.com/docs
  - Utility classes
  - Customization
  - Responsive design

#### Telegram

- **Telegram Mini Apps**: https://core.telegram.org/bots/webapps
  - Web App initialization
  - User authentication
  - Payment integration

- **Telegram Bot API**: https://core.telegram.org/bots/api
  - Bot commands
  - Webhooks
  - Updates

#### Testing

- **Jest Documentation**: https://jestjs.io/docs
  - Test syntax
  - Matchers
  - Mocking

- **TestContainers**: https://www.testcontainers.org
  - Docker containers for testing
  - Database integration tests

### Team Communication

- **GitHub Issues**: Report bugs and request features
  - Use issue templates
  - Add appropriate labels
  - Assign to team members

- **GitHub Discussions**: Ask questions and share ideas
  - Q&A for technical questions
  - Ideas for new features
  - Show and tell for demos

- **Pull Requests**: Code review and collaboration
  - Link to related issues
  - Provide clear description
  - Respond to feedback promptly

### Getting Help

1. **Check documentation first**:
   - Read relevant docs in `/specs/` and `/docs/`
   - Search existing issues on GitHub

2. **Search Stack Overflow**:
   - Look for similar problems
   - Check official documentation

3. **Ask in GitHub Discussions**:
   - Provide context and error messages
   - Share code snippets
   - Describe what you've tried

4. **Contact team lead**:
   - For urgent issues
   - For architectural questions
   - For access or permission issues

---

## Quick Reference

### Essential Commands

```bash
# Start development
cd backend && npm run start:dev
cd frontend && npm run dev

# Run tests
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage report

# Code quality
npm run lint              # Lint code
npm run format            # Format code
npm run type-check        # Type check

# Database
npm run migration:run     # Run migrations
npm run migration:revert  # Revert migration

# Docker
docker-compose up         # Start all services
docker-compose down       # Stop all services
docker-compose logs       # View logs
```

### Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed
- [ ] Redis 7+ installed
- [ ] Docker installed (optional)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` files created and configured
- [ ] Database created
- [ ] Migrations run
- [ ] Tests passing
- [ ] Development server running

### TDD Workflow Checklist

- [ ] Write failing test (RED)
- [ ] Run test to verify it fails
- [ ] Commit test (RED state)
- [ ] Write minimum code to pass (GREEN)
- [ ] Run test to verify it passes
- [ ] Commit implementation (GREEN state)
- [ ] Refactor code (REFACTOR)
- [ ] Run tests to ensure they still pass
- [ ] Commit refactoring (REFACTOR state)

---

## Welcome to the Team!

You're now ready to start contributing to the Texas Poker Platform MVP. Remember:

1. **Always follow TDD** - Write tests first, every time
2. **Ask questions** - No question is too small
3. **Review the docs** - Refer to `/specs/` and `/docs/` often
4. **Commit frequently** - Small, focused commits are better
5. **Communicate** - Use GitHub Issues and Discussions
6. **Have fun** - Building a poker platform is exciting!

Happy coding!
