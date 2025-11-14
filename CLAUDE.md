# PWGaming_2 Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-14

## Active Technologies

- TypeScript 5.x with Node.js 18+ LTS (backend), TypeScript 5.x with React 18 (frontend) (001-poker-platform-mvp)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x with Node.js 18+ LTS (backend), TypeScript 5.x with React 18 (frontend): Follow standard conventions

## Recent Changes

- 001-poker-platform-mvp: Added TypeScript 5.x with Node.js 18+ LTS (backend), TypeScript 5.x with React 18 (frontend)

<!-- MANUAL ADDITIONS START -->

## Documentation Guidelines

### Progress Documentation
When creating documentation for implementation milestones, conclusions, or significant progress updates:
- Store in: `docs/progress/`
- Naming convention: `XX-descriptive-name.md` (where XX is sequential: 00, 01, 02, etc.)
- Examples:
  - `00-mvp-backend-implementation-complete.md` - Backend completion status
  - `01-implementation-status.md` - Current implementation state
  - `02-frontend-setup-complete.md` - Frontend initialization
  - `03-deployment-notes.md` - Deployment documentation

### When to Create Progress Docs
Create a new progress document when:
- A major phase or milestone is completed
- Important architectural decisions are made
- Deployment or infrastructure changes occur
- Future reference or handoff documentation is needed

### Log File
- `log.md` - Detailed execution log (not moved, stays in root for active reference)

<!-- MANUAL ADDITIONS END -->
