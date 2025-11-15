# Quick Start Guide - PW Gaming

## Prerequisites Check

Before starting, ensure you have:
- ✅ Docker Desktop installed and running
- ✅ Node.js 18+ installed
- ✅ npm packages installed (run `npm install` in both backend and frontend)

## Method 1: Automated Start (Recommended)

### Step 1: Start Docker Services

**Windows:**
```bash
# Double-click or run from terminal:
scripts\start-dev.bat
```

This will:
- Check if Docker is running
- Start PostgreSQL, Redis, and pgAdmin containers
- Display next steps

### Step 2: Start Backend (New Terminal)

```bash
cd backend
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345  - 11/16/2025, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/16/2025, 10:30:00 AM     LOG [InstanceLoader] AppModule dependencies initialized
...
[Nest] 12345  - 11/16/2025, 10:30:01 AM     LOG Application is running on: http://localhost:4110
```

### Step 3: Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 16.0.3
  - Local:        http://localhost:4120
  - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 2.5s
```

### Step 4: Access the Application

Open your browser:
- **Main App:** http://localhost:4120
- **Backend Health:** http://localhost:4110/health
- **Database Admin:** http://localhost:4130

---

## Method 2: Manual Start

### Step 1: Start Docker Desktop

1. Open Docker Desktop application
2. Wait for Docker to fully start (icon turns green)
3. Verify: Open terminal and run `docker ps`

### Step 2: Start Docker Services

```bash
# Navigate to project root
cd C:\WebDev\PWGaming_2

# Start containers
docker-compose up -d

# Verify containers are running
docker-compose ps
```

**Expected Output:**
```
NAME                COMMAND                  SERVICE    STATUS         PORTS
poker-pgadmin       "/entrypoint.sh"        pgadmin    Up 5 seconds   0.0.0.0:4130->80/tcp
poker-postgres      "docker-entrypoint.s…"  postgres   Up 5 seconds   0.0.0.0:5432->5432/tcp
poker-redis         "docker-entrypoint.s…"  redis      Up 5 seconds   0.0.0.0:6379->6379/tcp
```

### Step 3: Start Backend

**Terminal 1:**
```bash
cd C:\WebDev\PWGaming_2\backend
npm run start:dev
```

Wait for:
```
[Nest] LOG Application is running on: http://localhost:4110
```

### Step 4: Start Frontend

**Terminal 2:**
```bash
cd C:\WebDev\PWGaming_2\frontend
npm run dev
```

Wait for:
```
- Local:        http://localhost:4120
✓ Ready in 2.5s
```

---

## Verification Steps

### 1. Check Docker Services

```bash
docker-compose ps
```

All services should show "Up" status.

### 2. Test Backend

```bash
curl http://localhost:4110/health
```

Expected response:
```json
{"status":"ok"}
```

Or open in browser: http://localhost:4110/health

### 3. Test Frontend

Open browser: http://localhost:4120

You should see the PW Gaming landing page.

### 4. Test pgAdmin (Optional)

1. Open: http://localhost:4130
2. Login:
   - Email: `admin@poker.local`
   - Password: `admin`

---

## Troubleshooting

### Docker not starting

**Problem:** `docker ps` returns error

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start (green icon)
3. Try again

### Port already in use

**Problem:** Error: `Port 4110/4120/4130 is already in use`

**Solution:**
```bash
# Windows - Find process using port
netstat -ano | findstr :4110

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Backend database connection error

**Problem:** Backend can't connect to PostgreSQL

**Solution:**
```bash
# Check if PostgreSQL container is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Frontend can't connect to backend

**Problem:** Frontend shows API connection errors

**Solution:**
1. Check backend is running: `curl http://localhost:4110/health`
2. Verify `.env.local` has correct URL: `NEXT_PUBLIC_API_URL=http://localhost:4110`
3. Restart frontend server

### Node modules not found

**Problem:** `Error: Cannot find module`

**Solution:**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## Stopping the Application

### Stop Backend & Frontend
Press `Ctrl+C` in each terminal window

### Stop Docker Services

```bash
# Navigate to project root
cd C:\WebDev\PWGaming_2

# Stop containers (keeps data)
docker-compose stop

# Or stop and remove containers (keeps data in volumes)
docker-compose down

# Or stop and remove everything including data
docker-compose down -v
```

---

## Development Workflow

### Daily Startup

1. **Start Docker Desktop** (if not running)
2. **Run startup script:** `scripts\start-dev.bat`
3. **Start backend:** New terminal → `cd backend` → `npm run start:dev`
4. **Start frontend:** New terminal → `cd frontend` → `npm run dev`
5. **Open browser:** http://localhost:4120

### Daily Shutdown

1. **Stop backend:** `Ctrl+C` in backend terminal
2. **Stop frontend:** `Ctrl+C` in frontend terminal
3. **Stop Docker:** `docker-compose stop` (or leave running)

### Running Tests

**Backend Tests:**
```bash
cd backend
npm test
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

---

## Access Credentials

### PostgreSQL
- **Host:** localhost
- **Port:** 5432
- **Database:** poker_platform
- **Username:** poker_user
- **Password:** poker_dev_password

### Redis
- **Host:** localhost
- **Port:** 6379
- **Password:** (none)

### pgAdmin
- **URL:** http://localhost:4130
- **Email:** admin@poker.local
- **Password:** admin

---

## Quick Reference

| Service | Port | URL | Status Check |
|---------|------|-----|--------------|
| Frontend | 4120 | http://localhost:4120 | Open in browser |
| Backend | 4110 | http://localhost:4110 | `curl http://localhost:4110/health` |
| pgAdmin | 4130 | http://localhost:4130 | Open in browser |
| PostgreSQL | 5432 | localhost:5432 | `docker-compose ps postgres` |
| Redis | 6379 | localhost:6379 | `docker-compose ps redis` |

---

## Common Commands

```bash
# Check all containers
docker-compose ps

# View container logs
docker-compose logs postgres
docker-compose logs redis
docker-compose logs pgadmin

# Restart a service
docker-compose restart postgres

# Stop all containers
docker-compose stop

# Start all containers
docker-compose start

# Remove all containers (keeps volumes)
docker-compose down

# Remove everything including data
docker-compose down -v
```

---

## Need Help?

1. **Check logs:**
   - Backend: Terminal output
   - Frontend: Terminal output + browser console (F12)
   - Docker: `docker-compose logs [service-name]`

2. **Restart everything:**
   ```bash
   # Stop all
   Ctrl+C in all terminals
   docker-compose down

   # Start fresh
   docker-compose up -d
   cd backend && npm run start:dev
   cd frontend && npm run dev
   ```

3. **Check documentation:**
   - Port configuration: `docs/PORT-CONFIGURATION.md`
   - Full setup guide: `SETUP.md`
   - Phase 3 docs: `docs/progress/07-phase3-authentication-complete.md`

---

**Ready to develop!** 🚀
