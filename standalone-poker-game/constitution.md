# Project Constitution: Standalone Texas Hold'em Poker Game

**Project Type**: Single-player poker game with bot opponents
**Purpose**: Production-ready Texas Hold'em implementation with complete rules and professional gameplay
**Target**: Standalone game application (no backend, no database, pure client-side)

---

## Core Principles (NON-NEGOTIABLE)

### I. Test-Driven Development (TDD)
**Commitment**: Every feature begins with failing tests

- **RED**: Write failing test first - verify expected behavior
- **GREEN**: Write minimum code to make test pass
- **REFACTOR**: Improve code quality while keeping tests green
- **Coverage**: Minimum 80% code coverage for game logic
- **No Exceptions**: Production code without tests is prohibited

**Rationale**: TDD ensures correctness of poker rules (complex domain) and prevents regression bugs

---

### II. Complete Poker Rules (No Shortcuts)
**Commitment**: Implement ALL Texas Hold'em rules correctly

**Must Include**:
- Blind posting system (small blind, big blind, heads-up rules)
- Burn cards (1 before flop, turn, river)
- Dealer button rotation and position calculations
- All betting actions (fold, check, call, bet, raise, all-in)
- Minimum raise validation
- Side pot calculation (multiple all-ins, odd chip distribution)
- Hand evaluation (all 10 hand ranks, tie-breaking)
- Showdown logic (card reveal order, mucking)
- Action timer with auto-actions
- Betting round completion detection

**Rationale**: This is a poker game - incomplete rules = broken experience

---

### III. Production-Quality Code
**Commitment**: Professional standards, not prototype code

- **TypeScript Strict Mode**: No `any` types, complete type safety
- **Modern React Patterns**: Hooks, functional components, proper state management
- **Clean Architecture**: Separation of concerns (UI, game logic, bot AI)
- **Error Handling**: Graceful failure, no unhandled exceptions
- **Performance**: Smooth animations (60fps), responsive UI (<100ms interactions)

**Rationale**: This game serves as a reference implementation

---

### IV. Bot AI Intelligence
**Commitment**: Bots that play believable poker

**Bot Levels**:
1. **Easy**: Random actions with basic logic (fold bad hands, call good hands)
2. **Medium**: Basic strategy (position awareness, pot odds consideration)
3. **Hard**: Advanced strategy (bluffing, hand reading, adaptive play)

**Bot Behavior**:
- Realistic thinking time (500ms - 3000ms delay)
- Personality traits (tight/loose, aggressive/passive)
- Memory of previous hands (basic pattern recognition)
- No cheating (bots cannot see hole cards)

**Rationale**: Single-player game needs engaging AI opponents

---

### V. User Experience Excellence
**Commitment**: Intuitive, polished, professional UI

- **Visual Design**: Clean poker table layout, professional card graphics
- **Animations**: Smooth card dealing, chip movements, winner celebrations
- **Feedback**: Clear action indicators, pot updates, hand strength hints
- **Accessibility**: Keyboard shortcuts, screen reader support, color blind modes
- **Settings**: Adjustable game speed, animation toggle, sound effects

**Rationale**: UX differentiates good poker games from great ones

---

### VI. In-Memory State Management
**Commitment**: No database, no backend, pure client-side

- **Game State**: In-memory only (Redux/Zustand for state management)
- **Persistence**: Optional localStorage for settings and statistics
- **No Network**: All computations client-side (bot AI, hand evaluation)
- **Fast**: Instant actions, no API latency

**Rationale**: Standalone game = no infrastructure dependencies

---

### VII. Localization Ready
**Commitment**: No hardcoded strings, internationalization from day 1

- **No Hardcoded Text**: All strings in localization files
- **Resource Keys**: Use `t('game.insufficient_chips')` pattern
- **Default Language**: English
- **Future Languages**: Architecture supports Vietnamese, Thai, Chinese

**Rationale**: Makes game accessible to global audiences

---

### VIII. Professional UI Standards
**Commitment**: Icon library, design system, no emojis

- **Icons**: Lucide React or similar professional library
- **No Emojis**: Use proper icons for suits, actions, buttons
- **Design System**: Consistent colors, typography, spacing
- **Responsive**: Works on desktop (1920x1080) to laptop (1366x768)

**Rationale**: Professional appearance builds trust and quality perception

---

## Architecture Principles

### Separation of Concerns

```
presentation/        → React components, UI logic
├── components/      → Reusable UI primitives
├── pages/           → Game screens (menu, table, settings)
└── hooks/           → Custom React hooks

game-logic/          → Pure TypeScript game engine
├── engine/          → Core game loop, state machine
├── rules/           → Poker rules validation
├── evaluation/      → Hand ranking and comparison
└── pot/             → Pot calculation and side pots

bot-ai/              → Bot decision-making
├── strategies/      → Easy, Medium, Hard strategies
├── personality/     → Bot behavior traits
└── decision/        → Action selection logic

state-management/    → Redux/Zustand stores
├── game-state/      → Current game state (cards, pot, players)
├── player-state/    → Player stats, chips, settings
└── ui-state/        → UI visibility, animations
```

### Technology Constraints

**Required**:
- TypeScript 5.x (strict mode)
- React 18+ (functional components, hooks)
- State management library (Redux Toolkit or Zustand)
- Testing framework (Jest + React Testing Library)
- Build tool (Vite for fast development)

**Prohibited**:
- No external APIs or backend services
- No database (SQLite, IndexedDB discouraged - use localStorage only for settings)
- No WebSocket/network communication
- No server-side code

---

## Quality Gates

### Phase Completion Criteria

Each phase MUST pass these gates before proceeding:

1. **All tests passing** (unit + integration)
2. **Code coverage ≥80%** for game logic
3. **TypeScript compilation** with zero errors (strict mode)
4. **ESLint/Prettier** with zero errors
5. **Manual playtest** of new features
6. **Performance check** (no frame drops, <100ms actions)

### Definition of Done

A task is "Done" when:
- [ ] Tests written and passing (TDD: RED → GREEN → REFACTOR)
- [ ] Code reviewed for quality and correctness
- [ ] Documentation updated (code comments, README)
- [ ] No console errors or warnings
- [ ] Animations smooth and polished
- [ ] Feature works as specified in acceptance criteria

---

## Principles in Action

### Example: Implementing Side Pot Calculation

**Principle II (Complete Rules)** requires accurate side pot calculation.

**TDD Approach (Principle I)**:
```typescript
// RED: Write failing test first
test('should calculate side pots for 3-player all-in', () => {
  const players = [
    { id: 'A', bet: 25, stack: 0 },  // all-in $25
    { id: 'B', bet: 75, stack: 0 },  // all-in $75
    { id: 'C', bet: 100, stack: 25 } // call $100
  ];

  const pots = calculateSidePots(players);

  expect(pots.mainPot).toBe(75);  // $25 × 3
  expect(pots.sidePots).toHaveLength(2);
  expect(pots.sidePots[0]).toEqual({ amount: 100, eligible: ['B', 'C'] });
  expect(pots.sidePots[1]).toEqual({ amount: 25, eligible: ['C'] });
});

// GREEN: Implement minimum code to pass
function calculateSidePots(players) {
  // ... implementation
}

// REFACTOR: Clean up while keeping tests green
```

**Production Quality (Principle III)**:
- Type-safe implementation with interfaces
- Edge case handling (odd chips, 4+ players)
- Performance optimization (O(n log n) algorithm)

---

## Success Metrics

### Technical Metrics
- **Test Coverage**: ≥80% for game logic, ≥60% for UI
- **Performance**: 60fps animations, <100ms action response
- **Code Quality**: Zero ESLint errors, TypeScript strict mode
- **Build Size**: <2MB total bundle (code-splitting applied)

### Gameplay Metrics
- **Correctness**: 100% accurate poker rules (verified by test suite)
- **Bot Quality**: Medium bots win ~45-55% against Easy bots (balanced)
- **User Engagement**: Average session >15 minutes (measured via playtesting)

### User Experience Metrics
- **Time to First Hand**: <10 seconds from app launch
- **Action Clarity**: 100% of playtesters understand available actions
- **Visual Polish**: 95%+ playtesters rate UI as "professional"

---

## Risk Mitigation

### Risk: Incorrect Poker Rules
**Mitigation**: Comprehensive test suite with edge cases, manual verification against official rules

### Risk: Poor Bot AI
**Mitigation**: Playtest each bot level, iterate on strategy, benchmark bot vs bot win rates

### Risk: Performance Issues
**Mitigation**: Profile animations, lazy load components, optimize render cycles

### Risk: Scope Creep
**Mitigation**: Strict adherence to standalone game scope, defer multiplayer/tournaments

---

## Out of Scope (Post-Launch)

The following features are explicitly EXCLUDED from initial release:

- Multiplayer/online gameplay
- Tournament mode
- Real money or cryptocurrency
- User accounts and profiles (persistent across devices)
- Leaderboards
- Other poker variants (Omaha, 7-Card Stud)
- Mobile apps (focus on web desktop/laptop)
- Advanced statistics and hand history
- Replay functionality

These may be considered for future versions but are not part of the standalone game MVP.

---

**Constitution Version**: 1.0
**Last Updated**: 2025-11-18
**Status**: Active - All principles enforced
