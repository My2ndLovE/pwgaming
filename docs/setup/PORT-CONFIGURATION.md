# Port Configuration Guide

**Updated:** 2025-11-16

## Current Port Assignment

### Application Ports
- **Backend API:** `http://localhost:4110`
- **Frontend Web:** `http://localhost:4120`
- **pgAdmin:** `http://localhost:4130` (when Docker is running)

### Infrastructure Ports (unchanged)
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`

## Configuration Files

### Backend Port Configuration

**File:** `backend/.env`
```env
PORT=4110
```

**File:** `backend/src/main.ts`
```typescript
await app.listen(process.env.PORT ?? 3000);
```

### Frontend Port Configuration

**File:** `frontend/package.json`
```json
{
  "scripts": {
    "dev": "next dev -p 4120",
    "start": "next start -p 4120"
  }
}
```

**File:** `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4110
NEXT_PUBLIC_WS_URL=http://localhost:4110
```

### Docker Configuration

**File:** `docker-compose.yml`
```yaml
pgadmin:
  ports:
    - '4130:80'
```

## Starting the Application

### Option 1: Full Stack with Docker

```bash
# Terminal 1 - Start Docker services (PostgreSQL, Redis, pgAdmin)
docker-compose up -d

# Terminal 2 - Start backend
cd backend
npm run start:dev
# Backend runs on http://localhost:4110

# Terminal 3 - Start frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:4120
```

### Option 2: Backend Only (without Docker)

Requires PostgreSQL and Redis installed locally.

```bash
# Terminal 1 - Start backend
cd backend
npm run start:dev
# Backend runs on http://localhost:4110
```

### Option 3: Frontend Only

Requires backend to be running.

```bash
# Terminal 1 - Start frontend
cd frontend
npm run dev
# Frontend runs on http://localhost:4120
```

## Access URLs

### Development
- **Frontend:** http://localhost:4120
- **Backend API:** http://localhost:4110
- **Backend Health:** http://localhost:4110/health
- **Backend API Docs:** http://localhost:4110/api/docs (when available)
- **pgAdmin:** http://localhost:4130

### pgAdmin Login
- **Email:** admin@poker.local
- **Password:** admin

## Testing Port Configuration

### Test Backend
```bash
# Check if backend is running
curl http://localhost:4110/health

# Expected response:
# {"status":"ok"}
```

### Test Frontend
```bash
# Open in browser
open http://localhost:4120

# Or check if port is listening
netstat -an | grep 4120
```

### Test pgAdmin
```bash
# Open in browser (requires Docker running)
open http://localhost:4130

# Or check if port is listening
netstat -an | grep 4130
```

## Port Conflicts

If you encounter port conflicts:

### Check What's Using a Port

**Windows:**
```bash
netstat -ano | findstr :4110
netstat -ano | findstr :4120
netstat -ano | findstr :4130
```

**Mac/Linux:**
```bash
lsof -i :4110
lsof -i :4120
lsof -i :4130
```

### Kill Process Using Port (if needed)

**Windows:**
```bash
# Find PID from netstat command above, then:
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
kill -9 <PID>
```

## Changing Ports

If you need to change ports:

1. **Backend Port:**
   - Update `backend/.env` → `PORT=<new-port>`
   - Update `backend/.env.example` → `PORT=<new-port>`
   - Update `frontend/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:<new-port>`
   - Update `frontend/.env.local.example` → `NEXT_PUBLIC_API_URL=http://localhost:<new-port>`

2. **Frontend Port:**
   - Update `frontend/package.json` scripts: `"dev": "next dev -p <new-port>"`
   - Update all documentation references

3. **pgAdmin Port:**
   - Update `docker-compose.yml` → ports: `'<new-port>:80'`

4. **Restart Services:**
   ```bash
   # Stop all services
   # Update configuration files
   # Restart services
   docker-compose down
   docker-compose up -d
   ```

## Environment-Specific Ports

### Development (Current)
- Backend: 4110
- Frontend: 4120
- pgAdmin: 4130

### Production
Ports are typically handled by reverse proxy (nginx, Azure App Service, etc.)
- Backend: Environment-specific (Azure assigns)
- Frontend: Environment-specific (Azure assigns)
- Database: Private VNet (not exposed)

## CORS Configuration

The backend CORS is configured to allow the frontend URL:

**File:** `backend/src/main.ts` (or app configuration)
```typescript
app.enableCors({
  origin: ['http://localhost:4120', /* production URLs */],
  credentials: true,
});
```

## WebSocket Configuration

WebSocket connections use the same backend port:

**Frontend:** `frontend/.env.local`
```env
NEXT_PUBLIC_WS_URL=http://localhost:4110
```

**Usage:**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4110/game', {
  auth: { token: accessToken }
});
```

## Troubleshooting

### Backend not accessible
1. Check if backend is running: `curl http://localhost:4110/health`
2. Check backend logs for errors
3. Verify PORT in `backend/.env` is 4110
4. Check for port conflicts

### Frontend can't connect to backend
1. Check `frontend/.env.local` has correct API URL
2. Check CORS configuration in backend
3. Verify backend is running
4. Check browser console for errors

### pgAdmin not accessible
1. Check Docker is running: `docker ps`
2. Verify pgAdmin container is up: `docker-compose ps`
3. Check port mapping in `docker-compose.yml`
4. Restart Docker: `docker-compose restart pgadmin`

### Database connection issues
1. PostgreSQL port is 5432 (internal to Docker)
2. Check `backend/.env` has correct DB_PORT=5432
3. Verify Docker PostgreSQL is running
4. Check database logs: `docker-compose logs postgres`

## Quick Reference

| Service | Port | URL | Notes |
|---------|------|-----|-------|
| Backend | 4110 | http://localhost:4110 | NestJS API |
| Frontend | 4120 | http://localhost:4120 | Next.js App |
| pgAdmin | 4130 | http://localhost:4130 | Database Admin |
| PostgreSQL | 5432 | localhost:5432 | Docker internal |
| Redis | 6379 | localhost:6379 | Docker internal |

## Summary

✅ All ports configured to avoid conflicts
✅ Backend: 4110
✅ Frontend: 4120
✅ pgAdmin: 4130
✅ Environment files updated
✅ Docker compose updated
✅ Documentation updated

**Ready to start development!**
