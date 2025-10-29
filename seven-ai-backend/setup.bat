@echo off
REM Seven AI Backend Setup Script for Windows

echo ╔══════════════════════════════════════════════╗
echo ║     🤖 SEVEN AI BACKEND SETUP 🤖            ║
echo ╚══════════════════════════════════════════════╝
echo.

REM Check Python version
python --version
if errorlevel 1 (
    echo ❌ Python not found! Please install Python 3.10+ from python.org
    pause
    exit /b 1
)
echo ✓ Python found

REM Create virtual environment
echo.
echo Creating virtual environment...
python -m venv venv
call venv\Scripts\activate.bat
echo ✓ Virtual environment created

REM Install dependencies
echo.
echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo ✓ Dependencies installed

REM Create .env file if it doesn't exist
if not exist .env (
    echo.
    echo Creating .env file...
    copy .env.example .env
    echo ✓ .env file created
    echo.
    echo ⚠️  Please edit .env and add your API keys!
)

REM Create data directory
if not exist data mkdir data
echo ✓ Data directory created

echo.
echo ╔══════════════════════════════════════════════╗
echo ║          🎉 SETUP COMPLETE! 🎉              ║
echo ╠══════════════════════════════════════════════╣
echo ║  Next steps:                                 ║
echo ║  1. Edit .env file with your API keys        ║
echo ║  2. Run: venv\Scripts\activate               ║
echo ║  3. Run: python main.py                      ║
echo ║  4. Optional: ngrok http 5000                ║
echo ╚══════════════════════════════════════════════╝
echo.
pause







