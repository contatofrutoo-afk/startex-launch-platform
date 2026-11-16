@echo off
cd /d "%~dp0"
echo Iniciando Startex em modo DEMO (dados ficticios, sem login real)...
echo Abra no navegador: http://127.0.0.1:4173
call npm run preview:demo
pause
