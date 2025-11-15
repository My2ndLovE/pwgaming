# How to Continue Development in a New Session

## Quick Start

**Step 1:** Open the appropriate session prompt file
- For Phase 4 (Wallet UI): `phase4-wallet-ui.md`

**Step 2:** Copy the ENTIRE contents of the prompt file

**Step 3:** Start a new Claude Code session

**Step 4:** Paste the prompt as your first message

**Step 5:** Claude will have full context and can continue exactly where you left off!

## What's Included in Session Prompts

Each prompt contains everything needed to continue:

1. **Current Status** - What's complete, what's next
2. **Project Context** - Tech stack, ports, credentials, scripts
3. **Phase Details** - User story, tasks, implementation approach
4. **TDD Workflow** - Exact RED→GREEN→REFACTOR instructions
5. **File Structure** - Where to create components
6. **API Integration** - Backend endpoints to use
7. **Design Patterns** - Examples from previous phases
8. **Acceptance Criteria** - Definition of done
9. **Quick Commands** - How to start working immediately
10. **Success Metrics** - How to know phase is complete

## Example Usage

```
# 1. You're starting a new session to work on Wallet UI
# 2. Open: docs/session-prompts/phase4-wallet-ui.md
# 3. Copy all text (Ctrl+A, Ctrl+C)
# 4. Open new Claude Code session
# 5. Paste and send

Claude responds:
"I'll help you implement Phase 4 - Wallet Management UI.
Let me start by reviewing the current status and creating
the first test file following TDD..."
```

## Why This Works

Session prompts are designed to:
- Eliminate "catch me up" overhead
- Provide exact context needed
- Reference existing patterns to follow
- Include all file paths and line numbers
- Specify exact commands to run
- Define clear success criteria

Instead of spending time explaining what's done and what's next, you can jump straight into productive work!

## Creating Your Own Session Prompts

When you complete a phase and want to prepare for the next session:

1. Copy the template from `docs/session-prompts/README.md`
2. Fill in all sections with current context
3. Review the tasks.md file for next phase tasks
4. Include examples from what you just completed
5. Save as `phaseX-[name].md`

## Tips for Best Results

1. **Copy the entire prompt** - Don't summarize or shorten it
2. **Use at session start** - Don't try to continue mid-conversation
3. **Follow the workflow** - The prompts include tested workflows
4. **Update when done** - Create next prompt when phase completes
5. **Keep them current** - If project structure changes, update prompts

## Current Available Prompts

- `phase4-wallet-ui.md` - Ready to use
- More prompts will be added as phases complete

## Questions?

The session prompts are comprehensive. If something is unclear in the prompt, that's a bug in the prompt - not in your understanding. Feel free to improve the prompts as you use them!
