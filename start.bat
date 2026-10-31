@echo off
cd /d "%~dp0"
title GitMusic Server
echo ========================================================
echo   Starting GitMusic Local Server...
echo ========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0start_server.ps1"
pause
