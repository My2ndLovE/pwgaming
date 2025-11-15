# PW Gaming - Development Scripts

This folder contains Windows batch scripts for easy development workflow.

## Available Scripts

### start-dev.bat
**Purpose:** Start Docker services (PostgreSQL, Redis, pgAdmin)

**Usage:**
```bash
# From project root
scripts\start-dev.bat

# Or double-click the file in Windows Explorer
```

**What it does:**
1. Checks if Docker Desktop is running
2. Starts Docker Compose services (PostgreSQL, Redis, pgAdmin)
3. Waits for services to be healthy
4. Displays service URLs and next steps

**Output:**
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- pgAdmin: http://localhost:4130

**Next steps after running:**
- Backend: Open terminal, run `cd backend && npm run start:dev`
- Frontend: Open another terminal, run `cd frontend && npm run dev`

---

### start-all.bat
**Purpose:** One-click startup for all services (Docker + Backend + Frontend)

**Usage:**
```bash
# From project root
scripts\start-all.bat

# Or double-click the file in Windows Explorer
```

**What it does:**
1. Starts backend in a new terminal window (port 4110)
2. Starts frontend in a new terminal window (port 4120)
3. Displays all access URLs

**Output:**
- Opens 2 new terminal windows (Backend and Frontend)
- Shows startup logs in each window
- Displays URLs to access the application

**Access URLs:**
- Frontend: http://localhost:4120
- Backend: http://localhost:4110
- pgAdmin: http://localhost:4130

**Note:** Docker services must be running first. Run `start-dev.bat` if Docker isn't started.

---

## Quick Start Workflow

### First Time / Daily Startup

1. **Start Docker services:**
   ```bash
   scripts\start-dev.bat
   ```

2. **Start application servers:**
   ```bash
   scripts\start-all.bat
   ```

3. **Access application:**
   - Open browser: http://localhost:4120

### Stopping Services

**Stop Backend & Frontend:**
- Close the terminal windows OR press `Ctrl+C` in each window

**Stop Docker services:**
```bash
docker-compose stop
```

---

## Troubleshooting

### Script won't run
- **Issue:** Double-clicking doesn't work
- **Solution:** Right-click → "Run as administrator"

### Docker not running
- **Issue:** `start-dev.bat` shows "Docker is not running!"
- **Solution:** Start Docker Desktop, wait for green icon, run script again

### Port already in use
- **Issue:** Error about port 4110/4120/4130 already in use
- **Solution:**
  ```bash
  # Find process using port (example: 4110)
  netstat -ano | findstr :4110

  # Kill process (replace <PID> with actual process ID)
  taskkill /PID <PID> /F
  ```

### Backend/Frontend won't start
- **Issue:** Terminal window closes immediately
- **Solution:**
  - Ensure Docker services are running (`docker-compose ps`)
  - Check `npm install` has been run in both backend/ and frontend/
  - Open terminal manually and check error messages

---

## Related Documentation

- **Setup Guide:** `docs/setup/QUICK-START.md`
- **Port Configuration:** `docs/setup/PORT-CONFIGURATION.md`
- **Full Setup Instructions:** `docs/setup/SETUP.md`

---

## Requirements

- Windows OS
- Docker Desktop installed and running
- Node.js 18+ installed
- npm packages installed (`npm install` in backend/ and frontend/)
