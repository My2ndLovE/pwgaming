# Next Session: Phase 4 - Wallet Management UI Implementation

## Current Status

**Completed:**
- Phase 1: Setup & Infrastructure (Backend) - 100%
- Phase 2: Foundational Services (Backend) - 100%
- Phase 3: Authentication UI (Frontend) - 100%
  - 63 tests passing
  - All authentication flows implemented
  - Error boundaries and loading states
  - Protected routes and user profile

**Next Phase:**
- Phase 4: User Story 2 - Wallet Management UI (Frontend)

## Project Context

**Project:** PW Gaming - Texas Hold'em Poker Platform MVP
**Branch:** `001-poker-platform-mvp`
**Tech Stack:**
- Backend: NestJS + PostgreSQL + Redis (running on port 4110)
- Frontend: Next.js 16.0.3 + TypeScript + Tailwind CSS (running on port 4120)
- Methodology: TDD (RED → GREEN → REFACTOR)

**Ports:**
- Frontend: http://localhost:4120
- Backend: http://localhost:4110
- pgAdmin: http://localhost:4130
- PostgreSQL: localhost:5432
- Redis: localhost:6379

**Quick Start Scripts:**
```bash
# Start all services (opens 2 terminal windows)
scripts\start-all.bat

# Or manual startup
scripts\start-dev.bat  # Start Docker services
cd backend && npm run start:dev  # Terminal 1
cd frontend && npm run dev       # Terminal 2
```

## Next Phase: Wallet Management UI

### User Story 2 Context

**Goal:** Enable players to manage credits through deposits and withdrawals

**Independent Test:** Submit deposit request → Admin approves → Balance updates → Request withdrawal → Admin processes

**Value:** Essential for MVP revenue generation and enabling real-money gameplay

### Tasks to Implement (T66-T89)

**Phase 4 Frontend Tasks from `specs/001-poker-platform-mvp/tasks.md`:**

#### Wallet Page & Components
- T66: Create Wallet page at `frontend/app/(game)/wallet/page.tsx`
- T67: Create BalanceCard component showing current balance and pending amounts
- T68: Create TransactionHistory component with filtering (all/deposits/withdrawals)
- T69: Create DepositForm component with amount input and validation
- T70: Create WithdrawalForm component with amount validation against balance

#### API Integration & State Management
- T71: Implement wallet API service in `frontend/lib/api/wallet.ts`
  - `getBalance()`, `getTransactions()`, `submitDeposit()`, `submitWithdrawal()`
- T72: Create useWallet hook for wallet state management
- T73: Implement real-time balance updates via WebSocket

#### Transaction Components
- T74: Create TransactionCard component displaying transaction details
- T75: Implement transaction status badges (Pending/Approved/Rejected/Completed)
- T76: Create transaction filtering UI (date range, type, status)

#### Error Handling & UX
- T77: Add insufficient balance error handling
- T78: Implement pending transaction notifications
- T79: Create empty state UI for no transactions

#### Testing (TDD - Write tests FIRST)
- T80-T89: Write comprehensive tests for all components and hooks

### Implementation Approach

**1. Use SpecKit Workflow:**

Since this is a well-defined phase with tasks already broken down in `tasks.md`, follow this approach:

```
Option A - Direct Implementation (Recommended):
- Review tasks in specs/001-poker-platform-mvp/tasks.md (T66-T89)
- Follow TDD: RED (write failing test) → GREEN (pass test) → REFACTOR
- Mark tasks as completed in tasks.md as you finish them

Option B - Use SpecKit Planning (if you want to refine):
/speckit.plan  # Review and refine the implementation plan
/speckit.tasks # Generate/update task breakdown if needed
/speckit.implement # Execute the tasks
```

**2. TDD Workflow (MANDATORY):**

For EVERY component/hook/function:
```bash
# 1. RED - Write failing test first
npm test -- wallet-page.test.tsx

# 2. GREEN - Write minimum code to pass
npm test -- wallet-page.test.tsx

# 3. REFACTOR - Clean up while keeping tests green
npm test  # Run all tests to ensure nothing broke
```

**3. Component Structure:**

```
frontend/
├── app/
│   └── (game)/
│       └── wallet/
│           └── page.tsx          # T66: Main wallet page
├── components/
│   └── wallet/
│       ├── balance-card.tsx      # T67: Balance display
│       ├── transaction-history.tsx # T68: Transaction list
│       ├── deposit-form.tsx      # T69: Deposit submission
│       ├── withdrawal-form.tsx   # T70: Withdrawal submission
│       ├── transaction-card.tsx  # T74: Individual transaction
│       └── transaction-filters.tsx # T76: Filtering UI
├── hooks/
│   └── use-wallet.ts             # T72: Wallet state hook
├── lib/
│   └── api/
│       └── wallet.ts             # T71: API service
└── __tests__/
    ├── components/
    │   └── wallet/               # T80-T85: Component tests
    └── hooks/
        └── use-wallet.test.ts    # T86-T89: Hook tests
```

**4. API Integration:**

Backend endpoints are already implemented (Phase 2). Use these:
```typescript
// In frontend/lib/api/wallet.ts
GET    /api/wallet/balance           # Get current balance
GET    /api/wallet/transactions      # Get transaction history
POST   /api/wallet/deposit           # Submit deposit request
POST   /api/wallet/withdraw          # Submit withdrawal request
```

**5. Design Consistency:**

Follow existing patterns from Phase 3 Authentication UI:
- Use lucide-react for icons (NOT emojis)
- Use existing UI components from `frontend/components/ui/`
- Follow Tailwind CSS dark mode patterns
- Ensure ARIA accessibility
- Use LoadingSpinner and Skeleton components for loading states
- Use ErrorBoundary for error handling

### Acceptance Criteria

Before considering Phase 4 complete, ensure:

**Functional:**
- [ ] User can view current balance and pending amounts
- [ ] User can submit deposit requests
- [ ] User can submit withdrawal requests (with balance validation)
- [ ] User can view transaction history with filtering
- [ ] Real-time balance updates when transactions are processed
- [ ] Error handling for insufficient balance
- [ ] Validation for invalid amounts

**Technical:**
- [ ] All tests passing (aim for similar coverage to Phase 3: 63+ tests)
- [ ] TDD methodology followed for all code
- [ ] TypeScript strict mode with no errors
- [ ] Build successful with no warnings
- [ ] Components accessible (ARIA compliant)
- [ ] Dark mode support
- [ ] Responsive design (mobile and desktop)

**Documentation:**
- [ ] Update tasks.md with completed tasks
- [ ] Create progress doc: `docs/progress/08-phase4-wallet-ui-complete.md`
- [ ] Update main README.md with current phase status

## Important Guidelines

**From CLAUDE.md:**
1. **TDD is mandatory** - Always write failing test first
2. **No emojis** - Use proper icon library (lucide-react)
3. **Ask before fixing unrelated errors** - If you encounter errors from previous work not related to current changes, ASK first
4. **No hardcoded strings** - Use proper text (localization consideration for future)
5. **Concise documentation** - Key points in CLAUDE.md, details in docs/claude/

**Code Quality:**
- Follow existing patterns from Phase 3 components
- Use TypeScript types strictly
- Implement proper error boundaries
- Include loading states for all async operations
- Validate all user inputs
- Handle edge cases (zero balance, pending transactions, etc.)

## Getting Started Commands

```bash
# 1. Start the application
scripts\start-all.bat

# 2. Verify services are running
# - Frontend: http://localhost:4120
# - Backend: http://localhost:4110/health (should return {"status":"ok"})

# 3. Create first test file
cd frontend
touch __tests__/components/wallet/balance-card.test.tsx

# 4. Start TDD cycle
npm test -- balance-card.test.tsx --watch
```

## Quick Reference

**Documentation:**
- Spec: `specs/001-poker-platform-mvp/spec.md` (User Story 2, lines 27-42)
- Tasks: `specs/001-poker-platform-mvp/tasks.md` (T66-T89, around line 259)
- Phase 3 Complete: `docs/progress/07-phase3-authentication-complete.md`
- Setup Guide: `docs/setup/QUICK-START.md`

**Key Files to Reference:**
- Auth Context Pattern: `frontend/lib/contexts/auth-context.tsx`
- Protected Route Pattern: `frontend/components/auth/protected-route.tsx`
- API Service Pattern: `frontend/lib/api/auth.ts`
- Hook Pattern: `frontend/hooks/use-auth.ts`
- Test Pattern: `frontend/__tests__/components/auth/login-page.test.tsx`

**Scripts:**
```bash
npm test                    # Run all tests
npm test -- wallet          # Run wallet-related tests
npm run dev                 # Start frontend dev server
npm run build              # Build for production
```

## Success Criteria

Phase 4 is complete when:
1. All T66-T89 tasks are checked off in tasks.md
2. Test suite passes with 80+ tests (Phase 3 had 63, adding ~20 for wallet)
3. User can perform complete wallet workflow: view balance → deposit → view pending → withdrawal
4. Progress documentation created
5. Ready to proceed to Phase 5 (User Story 9 - Admin Withdrawal Management)

---

**Ready to Start?**

Run: `scripts\start-all.bat` and begin with T66 (Wallet Page) following TDD!
