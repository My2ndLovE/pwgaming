# Session Continuation Prompts

This folder contains comprehensive prompts for continuing development in new sessions.

## Available Prompts

### phase4-wallet-ui.md
**Next Phase:** Wallet Management UI (Frontend)
**Status:** Ready to start
**Prerequisites:** Phase 3 (Authentication UI) complete

**Quick Start:**
```bash
# 1. Copy the entire contents of phase4-wallet-ui.md
# 2. Start a new Claude Code session
# 3. Paste the prompt
# 4. Claude will have full context to continue Phase 4
```

## How to Use

Each prompt file contains:
- Current status summary
- Complete context (tech stack, ports, scripts)
- Detailed task breakdown
- Implementation approach
- TDD workflow instructions
- Acceptance criteria
- Quick reference links
- Success criteria

Simply copy and paste the entire prompt into a new session to continue development seamlessly.

## Creating New Session Prompts

When completing a phase, create a new prompt for the next phase following this template:

```markdown
# Next Session: Phase X - [Phase Name]

## Current Status
[What's complete, what's next]

## Project Context
[Tech stack, ports, quick start]

## Next Phase: [Phase Name]
[User story context, tasks, implementation approach]

## Important Guidelines
[TDD, code quality, patterns to follow]

## Getting Started Commands
[Exact commands to start working]

## Quick Reference
[Links to key files and docs]

## Success Criteria
[How to know when phase is complete]
```

## Notes

- Keep prompts comprehensive but concise
- Include exact file paths and line numbers
- Reference existing patterns from completed work
- Always include TDD workflow
- Specify all acceptance criteria
- Make prompts self-contained (no external context needed)
