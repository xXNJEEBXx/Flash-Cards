@echo off
setlocal enableextensions enabledelayedexpansion

REM Optional quick validation mode
if /I "%~1"=="--check" (
  pushd "%~dp0" || ( echo [ERROR] Failed to pushd to script directory & exit /b 1 )
  cd /d "%~dp0flash-cards" || ( echo [ERROR] Could not change directory to "flash-cards". & popd & exit /b 1 )
  if not exist "package.json" (
    echo [ERROR] package.json not found in flash-cards.
    popd
    exit /b 1
  )
  where npm >nul 2>nul || ( echo [ERROR] npm is not installed or not in PATH. & popd & exit /b 1 )
  rem Verify react-scripts availability (installed locally via CRA)
  call npx --yes --no-install react-scripts --version >nul 2>nul || (
    echo [ERROR] react-scripts not available. Run npm install inside flash-cards.
    popd
    exit /b 1
  )
  echo [OK] Environment check passed.
  popd
  exit /b 0
)

REM Change to repository root (directory of this script)
pushd "%~dp0"

REM Go to the CRA app folder
cd /d "%~dp0flash-cards" || (
  echo [ERROR] Could not change directory to "flash-cards". Ensure the folder exists next to this script.
  pause
  exit /b 1
)

REM Ensure package.json exists
if not exist "package.json" (
  echo [ERROR] package.json not found in flash-cards. Check project structure.
  pause
  exit /b 1
)

REM Check npm availability
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not in PATH. Install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

REM Install dependencies if node_modules is missing
if not exist "node_modules" (
  echo Installing dependencies ^(npm install^)...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

REM Start the development server
echo Starting development server (npm start)...
call npm start

REM Keep window open on error
if errorlevel 1 (
  echo Dev server exited with errors.
  pause
)

popd
endlocal
