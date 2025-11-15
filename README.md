# PW Gaming - Texas Hold'em Poker Platform

A full-stack poker platform built with NestJS (backend) and Next.js (frontend).

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ installed
- npm installed

### Installation

1. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd frontend
   npm install
   ```

2. **Start the application:**
   ```bash
   # Option 1: One-click startup (opens 2 terminal windows)
   scripts\start-all.bat

   # Option 2: Manual startup
   scripts\start-dev.bat  # Start Docker services
   cd backend && npm run start:dev  # Terminal 1
   cd frontend && npm run dev       # Terminal 2
   ```

3. **Access the application:**
   - Frontend: http://localhost:4120
   - Backend: http://localhost:4110
   - pgAdmin: http://localhost:4130

## Documentation

### Setup & Configuration
- **Quick Start Guide:** [docs/setup/QUICK-START.md](docs/setup/QUICK-START.md)
- **Full Setup Instructions:** [docs/setup/SETUP.md](docs/setup/SETUP.md)
- **Port Configuration:** [docs/setup/PORT-CONFIGURATION.md](docs/setup/PORT-CONFIGURATION.md)

### Development
- **Scripts Documentation:** [scripts/README.md](scripts/README.md)
- **Development Workflow:** See Quick Start Guide
- **Claude Guidelines:** [CLAUDE.md](CLAUDE.md)
- **Next Session Prompts:** [docs/session-prompts/](docs/session-prompts/) - Continue in new sessions

### Progress & Implementation
- **Implementation Status:** [docs/progress/01-implementation-status.md](docs/progress/01-implementation-status.md)
- **Phase 3 Complete:** [docs/progress/07-phase3-authentication-complete.md](docs/progress/07-phase3-authentication-complete.md)
- **All Progress Docs:** [docs/progress/](docs/progress/)

### Technical Reference
- **Texas Hold'em Rules:** [docs/technical/texas-holdem-technical-reference.md](docs/technical/texas-holdem-technical-reference.md)
- **Azure Deployment:** [docs/technical/azure-deployment-guide.md](docs/technical/azure-deployment-guide.md)
- **Analysis:** [docs/analysis/](docs/analysis/)

## Project Structure

```
PWGaming_2/
├── backend/           # NestJS backend (port 4110)
├── frontend/          # Next.js frontend (port 4120)
├── scripts/           # Development scripts
│   ├── start-dev.bat  # Start Docker services
│   ├── start-all.bat  # Start all services
│   └── README.md      # Scripts documentation
├── docs/
│   ├── setup/         # Setup and configuration guides
│   ├── progress/      # Implementation progress docs
│   ├── session-prompts/ # Continuation prompts for new sessions
│   ├── technical/     # Technical reference documents
│   └── analysis/      # Technical analysis documents
├── docker-compose.yml # Docker services configuration
└── README.md          # This file
```

## Technology Stack

### Backend
- NestJS (Node.js framework)
- TypeScript 5.x
- PostgreSQL (database)
- Redis (caching/sessions)
- TypeORM
- Passport.js (authentication)

### Frontend
- Next.js 16.0.3
- React 18
- TypeScript 5.x
- Tailwind CSS
- lucide-react (icons)

### Infrastructure
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- pgAdmin 4

## Development Workflow

### Daily Startup
1. Start Docker Desktop
2. Run `scripts\start-all.bat`
3. Access http://localhost:4120

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Stopping Services
- Close terminal windows (Backend/Frontend)
- Stop Docker: `docker-compose stop`

## Current Status

**Phase 3 - Authentication UI: 100% Complete**
- 63 tests passing
- All authentication features implemented
- Error boundaries and loading states
- Protected routes and user profile

**Next Phase:** Phase 4 - Game UI Implementation

## Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 4120 | http://localhost:4120 |
| Backend | 4110 | http://localhost:4110 |
| pgAdmin | 4130 | http://localhost:4130 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## Credentials

**PostgreSQL:**
- Database: poker_platform
- Username: poker_user
- Password: poker_dev_password

**pgAdmin:**
- Email: admin@example.com
- Password: admin

## Troubleshooting

See [docs/setup/QUICK-START.md](docs/setup/QUICK-START.md) for detailed troubleshooting steps.

Common issues:
- Docker not running: Start Docker Desktop
- Port in use: `netstat -ano | findstr :PORT`
- Connection errors: Check Docker services with `docker-compose ps`

## License

Private project - All rights reserved
