# 🚀 Quick Start: Phase 7A Implementation

**For New Session**: Copy and paste this prompt to begin Phase 7A implementation.

---

## Session Prompt

```
I'm starting work on Phase 7A: Core Gameplay for the Texas Hold'em poker platform.

Please read the comprehensive session prompt at:
c:\WebDev\PWGaming_2\docs\session-prompts\phase7a-core-gameplay-implementation.md

Key context:
- Project: PW Gaming - Texas Hold'em Poker Platform MVP
- Branch: 001-poker-platform-mvp
- Phase: 7A - Core Gameplay (MVP)
- Tasks: T128-T176 (49 tasks)
- Timeline: 2-3 weeks
- Methodology: TDD (RED-GREEN-REFACTOR)

Objective: Implement playable poker game where players can join, play complete hands, and receive winnings.

Reference documents:
- Tasks: specs/001-poker-platform-mvp/tasks.md (lines 381-467)
- Architecture: specs/001-poker-platform-mvp/plan.md (Phase 7 Deep Dive)
- Spec: specs/001-poker-platform-mvp/spec.md (User Story 5)

Start with T128: Write failing test for deck shuffle using Fisher-Yates with crypto.randomBytes

Follow TDD strictly: Test FIRST, code SECOND. RED → GREEN → REFACTOR.

Ready to begin?
```

---

## Quick Checklist

Before starting, verify:

✅ Services running:
```bash
scripts\start-all.bat
```

✅ Frontend accessible: http://localhost:4120
✅ Backend healthy: http://localhost:4110/health
✅ Branch correct: `001-poker-platform-mvp`
✅ Session prompt read: `phase7a-core-gameplay-implementation.md`

---

## First Task

**T128**: Write failing test for card deck shuffle using Fisher-Yates with crypto.randomBytes

**File**: `backend/test/unit/game/deck.service.spec.ts`

**Reference**: See `plan.md` section 0.2 for shuffle algorithm implementation

---

## Need Help?

**Session Prompt**: Full details in `phase7a-core-gameplay-implementation.md`
**Architecture**: `specs/001-poker-platform-mvp/plan.md` (lines 431-577)
**Tasks**: `specs/001-poker-platform-mvp/tasks.md` (lines 381-467)
**Constitution**: `.specify/memory/constitution.md`

---

**Remember**: TDD is NON-NEGOTIABLE. Test first, always. 🧪
