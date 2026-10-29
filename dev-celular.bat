@echo off
rem Clique duplo para subir o sistema e ver a URL de acesso pelo celular.
chcp 65001 >nul
cd /d "%~dp0"
call npm run dev:celular
pause
