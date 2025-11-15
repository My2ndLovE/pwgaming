@echo off
echo ========================================
echo PW Gaming - Development Startup Script
echo ========================================
echo.

REM Check if Docker is running
echo [1/7] Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo After Docker starts, run this script again.
    pause
    exit /b 1
)
echo [OK] Docker is running

REM Start Docker services
echo.
echo [2/7] Starting Docker services (PostgreSQL, Redis, pgAdmin)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker services
    pause
    exit /b 1
)

REM Wait for services to be healthy
echo.
echo [3/7] Waiting for services to be ready...
timeout /t 5 /nobreak >nul

REM Check Docker containers
echo.
echo [4/7] Verifying Docker containers...
docker-compose ps

echo.
echo ========================================
echo Docker Services Started Successfully!
echo ========================================
echo - PostgreSQL: localhost:5432
echo - Redis: localhost:6379
echo - pgAdmin: http://localhost:4130
echo   (login: admin@poker.local / admin)
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo Open TWO separate terminal windows and run:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm run start:dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo ========================================
echo Access URLs:
echo ========================================
echo - Frontend: http://localhost:4120
echo - Backend:  http://localhost:4110
echo - pgAdmin:  http://localhost:4130
echo.
pause
