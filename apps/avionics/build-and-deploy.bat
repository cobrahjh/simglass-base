@echo off
REM Lovable GTN750Xi - Build and Deploy Script
REM Builds React app and deploys to SimGlass UI directory

echo ========================================
echo Lovable GTN750Xi - Build and Deploy
echo ========================================
echo.

REM Step 1: Install dependencies (if needed)
echo [1/5] Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

REM Step 2: Build production bundle
echo.
echo [2/5] Building production bundle (SimWidget path)...
call npx vite build --base /ui/gtn750xi-react/
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

REM Step 3: Create UI directory if it doesn't exist
echo.
echo [3/5] Creating UI directory...
if not exist "..\simwidget-hybrid\ui\gtn750xi-react" mkdir "..\simwidget-hybrid\ui\gtn750xi-react"

REM Step 4: Copy build to SimGlass UI directory
echo.
echo [4/5] Copying build to SimGlass UI...
xcopy /E /I /Y dist ..\simwidget-hybrid\ui\gtn750xi-react
if errorlevel 1 (
    echo ERROR: Copy failed
    pause
    exit /b 1
)

REM Step 5: Deploy to commander-pc
echo.
echo [5/5] Deploying to commander-pc (192.168.1.42)...
powershell.exe -NoProfile -NonInteractive -Command "scp -r 'C:/LLM-DevOSWE/simwidget-hybrid/ui/gtn750xi-react' 'hjhar@192.168.1.42:C:/LLM-DevOSWE/simwidget-hybrid/ui/'; Write-Output 'Deployed to commander-pc'"

echo.
echo ========================================
echo SUCCESS!
echo ========================================
echo.
echo Lovable GTN750Xi deployed!
echo.
echo Access URLs:
echo   Local: http://localhost:8080/ui/gtn750xi-react/
echo   Remote: http://192.168.1.42:8080/ui/gtn750xi-react/
echo.
echo Note: Restart SimGlass server if WebSocket adapter was updated.
echo.
pause
