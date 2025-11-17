# Phase 7B: Wallet-Game Integration (T179)

**Date**: 2025-01-18
**Branch**: `001-poker-platform-mvp`
**Task**: T179 - Buy-in/Cash-out/Rebuy Wallet Integration
**Status**: Services Complete, Integration Pending

## Summary

Implemented comprehensive wallet-game integration system with **dual-mode architecture** supporting both manual admin operations (permanent feature) and future payment gateway integration.

## Architecture Decision: Dual Wallet System

### Design Philosophy

The platform supports **two complementary wallet modes**:

1. **Admin Operations** (PERMANENT) - Always available
2. **Payment Gateway** (FUTURE) - Automated processing

This is NOT a temporary/permanent split - **both modes coexist in production**.

### Why Admin Operations Are Permanent

Real-world poker platforms ALWAYS need manual wallet operations for:

✅ **Operational Resilience**:
- Payment gateway downtime/maintenance
- Disputed transaction reversals
- Emergency balance corrections

✅ **Business Operations**:
- Promotional bonuses and referral rewards
- VIP/whale custom payment arrangements
- Bug compensation and goodwill credits

✅ **Regulatory Compliance**:
- Freeze/unfreeze funds per legal requirements
- Manual adjustments for audit compliance
- Chargebacks and fraud reversals

✅ **Early Launch** (Temporary Use):
- MVP testing with trusted users before gateway integration
- Soft launch with manual approval workflow
- Gradual migration to automated processing

## Implementation Details

### 1. Transaction Entity Extensions

**File**: `backend/src/modules/wallet/entities/transaction.entity.ts`

**New Transaction Types**:
```typescript
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  GAME_WIN = 'game_win',
  GAME_LOSS = 'game_loss',
  GAME_BUYIN = 'game_buyin',      // ← New: Join table with chips
  GAME_CASHOUT = 'game_cashout',  // ← New: Leave table, return chips
  GAME_REBUY = 'game_rebuy',      // ← New: Top-up chips mid-session
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  ADMIN_CREDIT = 'admin_credit',  // ← New: Manual credit
  ADMIN_DEBIT = 'admin_debit',    // ← New: Manual debit
}
```

**Payment Gateway Fields** (prepared for future):
```typescript
@Column({ type: 'varchar', length: 255, nullable: true })
gatewayReference!: string | null; // NULL = internal, populated = external

@Column({ type: 'varchar', length: 50, nullable: true })
gatewayStatus!: string | null; // Gateway-specific status
```

**Balance Reconciliation** (updated):
- `GAME_BUYIN`, `ADMIN_DEBIT` → Deduct from balance
- `GAME_CASHOUT`, `GAME_REBUY`, `ADMIN_CREDIT` → Add to balance

### 2. GameWalletService

**File**: `backend/src/modules/wallet/services/game-wallet.service.ts`

**Features**:

#### Buy-in Validation (20-100 Big Blinds)
```typescript
async validateBuyIn(dto: BuyInDto): Promise<BuyInValidation> {
  const minBuyIn = 20 * bigBlind;
  const maxBuyIn = 100 * bigBlind;

  // Check range
  // Check balance
  // Return validation result
}
```

#### Atomic Buy-in Processing
```typescript
async processBuyIn(dto: BuyInDto): Promise<Transaction> {
  // 1. Validate (range + balance)
  // 2. BEGIN TRANSACTION
  // 3. Lock user row (pessimistic_write)
  // 4. Deduct from wallet
  // 5. Create GAME_BUYIN transaction
  // 6. COMMIT or ROLLBACK
}
```

#### Cash-out (Return Chips to Wallet)
```typescript
async processCashOut(dto: CashOutDto): Promise<Transaction> {
  // 1. Validate chipStack >= 0
  // 2. If chipStack == 0, create zero-chip audit record
  // 3. Otherwise, credit wallet atomically
  // 4. Create GAME_CASHOUT transaction
}
```

#### Rebuy (Top-up Between Hands)
```typescript
async processRebuy(dto: RebuyDto): Promise<Transaction> {
  // 1. Validate (same rules as buy-in: 20-100 BB)
  // 2. Deduct from wallet atomically
  // 3. Create GAME_REBUY transaction
  // Note: Game logic must enforce "between hands only"
}
```

**Constants**:
- `MIN_BB_BUYIN = 20` (minimum 20 big blinds)
- `MAX_BB_BUYIN = 100` (maximum 100 big blinds)

### 3. AdminWalletService

**File**: `backend/src/modules/wallet/services/admin-wallet.service.ts`

**Features**:

#### Manual Credit (Permanent Feature)
```typescript
async creditUser(dto: AdminCreditDto): Promise<Transaction> {
  // 1. Verify admin permissions
  // 2. BEGIN TRANSACTION
  // 3. Lock user row
  // 4. Credit balance
  // 5. Create ADMIN_CREDIT transaction with:
  //    - processedBy: adminId
  //    - notes: reason (required)
  //    - isImmutable: true (audit trail)
  // 6. COMMIT or ROLLBACK
}
```

#### Manual Debit (Permanent Feature)
```typescript
async debitUser(dto: AdminDebitDto): Promise<Transaction> {
  // Same as credit but:
  // 1. Deduct from balance
  // 2. Validate balance >= amount
  // 3. Create ADMIN_DEBIT transaction
}
```

#### Wallet Mode Detection
```typescript
isInternalMode(): boolean {
  return process.env.WALLET_MODE === 'internal';
}
```

**Security**:
- Admin role verification on every operation
- Mandatory `reason` field for audit trail
- All transactions immutable once created
- `processedBy` logs which admin performed action

### 4. Module Configuration

**File**: `backend/src/modules/wallet/wallet.module.ts`

**Exports**:
- `GameWalletService` → Used by GameGateway
- `AdminWalletService` → Used by AdminController
- `TransactionService` → Existing functionality
- `BalanceService` → Existing functionality

## Environment Configuration

### .env Variables

```bash
# Wallet Mode
WALLET_MODE=internal  # Options: internal | external

# Internal Mode (MVP):
# - All deposits via admin credit
# - No payment gateway required
# - Manual approval workflow

# External Mode (Production):
# - Automated deposits via gateway
# - Admin operations still available
# - Manual withdrawals only
```

## Integration Points (Pending)

### GameGateway Integration

**File**: `backend/src/modules/game/gateways/game.gateway.ts`

**Pending Changes**:

```typescript
// T179.5: Buy-in integration
@SubscribeMessage('game:join')
async handleJoinGame(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { roomId: string; buyIn: number },
) {
  const userId = client.data.user?.userId;

  // NEW: Validate and process buy-in
  const validation = await this.gameWalletService.validateBuyIn({
    userId,
    roomId: data.roomId,
    buyInAmount: data.buyIn,
    bigBlind: roomState.bigBlind,
  });

  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  // Process buy-in (atomic wallet deduction)
  const transaction = await this.gameWalletService.processBuyIn({
    userId,
    roomId: data.roomId,
    buyInAmount: data.buyIn,
    bigBlind: roomState.bigBlind,
  });

  // Add player to game with chips
  // ...existing game logic
}

// T179.6: Cash-out integration
@SubscribeMessage('game:leave')
async handleLeaveGame(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { roomId: string },
) {
  const userId = client.data.user?.userId;

  // Get player's remaining chip stack from game state
  const chipStack = this.getPlayerChipStack(userId, data.roomId);

  // NEW: Return chips to wallet
  await this.gameWalletService.processCashOut({
    userId,
    roomId: data.roomId,
    chipStack,
  });

  // Remove player from game
  // ...existing game logic
}

// T179.7: Rebuy handler
@SubscribeMessage('game:rebuy')
async handleRebuy(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: { roomId: string; amount: number },
) {
  const userId = client.data.user?.userId;

  // NEW: Validate player is NOT in active hand
  const isInHand = this.isPlayerInActiveHand(userId, data.roomId);
  if (isInHand) {
    return { success: false, error: 'Cannot rebuy during active hand' };
  }

  // Process rebuy
  const transaction = await this.gameWalletService.processRebuy({
    userId,
    roomId: data.roomId,
    rebuyAmount: data.amount,
    bigBlind: roomState.bigBlind,
  });

  // Add chips to player's stack
  // ...
}
```

## Testing Plan (T179.8)

### Unit Tests

**File**: `backend/test/unit/wallet/game-wallet.service.spec.ts`

**Test Cases** (TDD):
1. ✅ Buy-in validation - valid amount (20-100 BB)
2. ✅ Buy-in validation - too low (< 20 BB) → error
3. ✅ Buy-in validation - too high (> 100 BB) → error
4. ✅ Buy-in validation - insufficient balance → error
5. ✅ Buy-in processing - atomic transaction success
6. ✅ Buy-in processing - rollback on failure
7. ✅ Cash-out - normal amount
8. ✅ Cash-out - zero chips (audit record created)
9. ✅ Cash-out - atomic transaction
10. ✅ Rebuy - validation (same as buy-in)
11. ✅ Rebuy - processing

**File**: `backend/test/unit/wallet/admin-wallet.service.spec.ts`

**Test Cases**:
1. ✅ Admin credit - verify admin role
2. ✅ Admin credit - non-admin → forbidden
3. ✅ Admin credit - atomic transaction
4. ✅ Admin credit - reason logged
5. ✅ Admin debit - verify sufficient balance
6. ✅ Admin debit - negative balance → error
7. ✅ Admin debit - reason required
8. ✅ Wallet mode detection

### Integration Tests

**File**: `backend/test/integration/wallet/game-wallet-integration.e2e-spec.ts`

**Test Cases**:
1. ✅ Complete buy-in flow (wallet → game)
2. ✅ Complete cash-out flow (game → wallet)
3. ✅ Rebuy during session
4. ✅ Concurrent buy-in attempts (pessimistic locking)
5. ✅ Balance reconciliation (before/after match)

**File**: `backend/test/integration/game/game-wallet.e2e-spec.ts`

**Test Cases**:
1. ✅ Join game with valid buy-in
2. ✅ Join game with insufficient balance → rejected
3. ✅ Leave game, chips returned to wallet
4. ✅ Rebuy between hands
5. ✅ Rebuy during hand → rejected

## Database Migration

**File**: `backend/migrations/YYYYMMDDHHMMSS-add-wallet-game-integration.ts`

**Changes**:
```sql
-- Add new transaction types (enum update)
ALTER TYPE transaction_type ADD VALUE 'game_buyin';
ALTER TYPE transaction_type ADD VALUE 'game_cashout';
ALTER TYPE transaction_type ADD VALUE 'game_rebuy';
ALTER TYPE transaction_type ADD VALUE 'admin_credit';
ALTER TYPE transaction_type ADD VALUE 'admin_debit';

-- Add payment gateway fields
ALTER TABLE transactions
ADD COLUMN gateway_reference VARCHAR(255) NULL,
ADD COLUMN gateway_status VARCHAR(50) NULL;

-- Add indexes for performance
CREATE INDEX idx_transaction_gateway_ref ON transactions(gateway_reference) WHERE gateway_reference IS NOT NULL;
```

## API Endpoints (Admin Controller)

### POST /admin/wallet/credit/:userId

**Purpose**: Manual credit to user balance (permanent feature)

**Request**:
```json
{
  "amount": 100.50,
  "reason": "Promotional bonus for early adopter"
}
```

**Response**:
```json
{
  "transactionId": "uuid",
  "userId": "uuid",
  "amount": 100.50,
  "balanceBefore": 50.00,
  "balanceAfter": 150.50,
  "processedBy": "admin-uuid",
  "processedAt": "2025-01-18T10:30:00Z",
  "notes": "Promotional bonus for early adopter"
}
```

### POST /admin/wallet/debit/:userId

**Purpose**: Manual debit from user balance

**Request**:
```json
{
  "amount": 25.00,
  "reason": "Penalty for rule violation"
}
```

### GET /admin/wallet/mode

**Purpose**: Check current wallet mode status

**Response**:
```json
{
  "mode": "internal",
  "features": [
    "Admin can credit/debit user balances",
    "No payment gateway integration",
    "Manual approval for all transactions"
  ]
}
```

## Success Criteria

### ✅ Completed (Services)
- [x] Transaction entity supports all game transaction types
- [x] GameWalletService validates 20-100 BB buy-in range
- [x] Atomic buy-in processing (wallet → game)
- [x] Atomic cash-out processing (game → wallet)
- [x] Rebuy functionality (same validation as buy-in)
- [x] AdminWalletService for manual credit/debit
- [x] Wallet mode configuration (internal/external)
- [x] WalletModule exports all services

### ⏳ Pending (Integration & Tests)
- [ ] GameGateway buy-in integration (T179.5)
- [ ] GameGateway cash-out integration (T179.6)
- [ ] GameGateway rebuy handler (T179.7)
- [ ] TDD tests for all operations (T179.8)
- [ ] Admin wallet controller endpoints
- [ ] Database migration
- [ ] Frontend UI for admin wallet operations

## Next Steps

### Immediate (T179.5-T179.8)
1. **Integrate with GameGateway** - Add wallet calls to join/leave/rebuy
2. **Write TDD Tests** - Comprehensive test coverage
3. **Create Admin Controller** - REST endpoints for manual operations
4. **Generate Migration** - Update database schema

### Future (Post-T179)
1. **Payment Gateway Integration** - Stripe/PayPal for external mode
2. **Frontend Admin UI** - Dashboard for wallet operations
3. **Monitoring Dashboard** - Real-time transaction tracking
4. **Reconciliation Reports** - Daily balance verification

## Documentation Updates

### Updated Files
- ✅ `specs/001-poker-platform-mvp/tasks.md` - T179 progress tracked
- ✅ `docs/progress/16-phase7b-wallet-integration.md` - This file

### Architecture Notes

**Key Design Decisions**:
1. **Permanent Admin Operations** - NOT temporary workaround
2. **Atomic Transactions** - Pessimistic locking prevents race conditions
3. **Audit Trail** - All operations logged with admin ID + reason
4. **Dual Mode** - Seamless transition from internal → external
5. **Zero Code Changes** - Same API interface for both modes

## Compliance & Audit

### Transaction Immutability
- All game transactions: `isImmutable: true`
- All admin transactions: `isImmutable: true`
- Cannot modify after creation (enforced by entity lifecycle hook)

### Audit Fields
- `processedBy`: UUID of admin who performed operation
- `processedAt`: Timestamp of operation
- `notes`: Required reason for all admin operations
- `referenceId`: Links to game room ID

### Balance Reconciliation
- Every transaction records `balanceBefore` and `balanceAfter`
- Entity validates: `balanceAfter = balanceBefore ± amount`
- Prevents partial updates or corruption

---

**Status**: Services Complete, Integration Pending
**Next Task**: T179.5 - GameGateway Integration
**Estimated Completion**: 4 hours (integration + tests)
