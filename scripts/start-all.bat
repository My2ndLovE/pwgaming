@echo off
echo Starting all PWGaming services...
echo.

REM Start backend in new window
echo [1/2] Starting Backend on port 4110...
start "PWGaming Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"
timeout /t 2 /nobreak > nul

REM Start frontend in new window
echo [2/2] Starting Frontend on port 4120...
start "PWGaming Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo All services are starting!
echo ========================================
echo.
echo Backend:  http://localhost:4110 (check the Backend window)
echo Frontend: http://localhost:4120 (check the Frontend window)
echo pgAdmin:  http://localhost:4130
echo.
echo Two new windows should have opened.
echo Wait for them to finish starting, then visit:
echo   http://localhost:4120
echo.
pause
