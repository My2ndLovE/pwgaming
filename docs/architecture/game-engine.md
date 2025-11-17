# Game Engine Architecture

## Overview

The poker game engine is built using a state machine pattern with deterministic hand evaluation and pot management.

## Core Components

### 1. GameEngineService
**Responsibility**: Orchestrates game flow, manages state transitions

**Key Methods**:
- `startHand()` - Initialize new hand, deal hole cards
- `processAction()` - Handle player actions (fold, check, call, bet, raise)
- `advancePhase()` - Move to next phase (flop, turn, river, showdown)
- `determineWinners()` - Evaluate hands and distribute pots

### 2. DeckService
**Responsibility**: Card shuffling and dealing

**Features**:
- Cryptographically secure shuffle using Fisher-Yates algorithm
- Burn card implementation
- Deterministic shuffle with seed (for hand replay)

### 3. HandEvaluatorService
**Responsibility**: Poker hand evaluation

**Implementation**:
- Uses PHE (Poker Hand Evaluator) library
- 7-card evaluation (5 community + 2 hole cards)
- Hand ranking: High Card → Royal Flush

### 4. PotService
**Responsibility**: Pot and side pot management

**Features**:
- Main pot calculation
- Side pot creation for all-in scenarios
- Multi-way all-in handling
- Pot distribution to winners

### 5. BettingService
**Responsibility**: Betting logic and validation

**Rules**:
- Minimum raise = previous raise amount
- All-in when bet exceeds chip stack
- Blind posting automation

## State Machine

```
WAITING → PREFLOP → FLOP → TURN → RIVER → SHOWDOWN → WAITING
```

Each phase transition triggers:
1. Pot reconciliation
2. Community card dealing (if applicable)
3. Action position reset to first active player after dealer

## Data Flow

```
Player Action → Validation → State Update → Broadcast → DB Persist
```

**Validation**:
- Is it player's turn?
- Is action valid for current phase?
- Does player have sufficient chips?

**State Update**:
- Update player chip stack
- Update pot
- Advance action position
- Check if phase complete

**Broadcast**:
- Send game state to all connected players
- Send action confirmation to acting player
- Update timers

**Persistence**:
- Redis: Active game state (24h TTL)
- PostgreSQL: Hand history (permanent)

## Security Considerations

### Race Condition Prevention
- Action locking per room
- Pessimistic database locks for wallet operations
- Atomic state updates

### Cheating Prevention
- Server-authoritative game logic
- Card visibility enforcement
- Bot detection (timing analysis)
- Multi-account detection (IP tracking)

### Deterministic Replay
- Each hand has shuffle seed
- Admin can replay any hand for verification
- Audit trail in hand history

## Performance Optimizations

1. **State Caching**: Redis for active game state
2. **Connection Pooling**: PostgreSQL (max 20, min 5)
3. **WebSocket Compression**: perMessageDeflate enabled
4. **Query Optimization**: Indexed lookups, batch operations

## Testing Strategy

- **Unit Tests**: Each service tested independently (326 tests)
- **Integration Tests**: Full hand flow scenarios
- **Performance Tests**: <500ms p95 action processing
- **Load Tests**: 100 concurrent games
