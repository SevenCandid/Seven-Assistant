@echo off
echo.
echo ========================================
echo   Starting Seven AI Backend Server
echo ========================================
echo.

cd /d "%~dp0"
call venv\Scripts\activate.bat
python main.py

pause







