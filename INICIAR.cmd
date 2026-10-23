@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Instala Node.js 24 para abrir la version local.
  echo https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules" (
  call npm ci --no-audit --no-fund
  if errorlevel 1 goto error
)
echo.
echo Prueba el formulario en http://localhost:4173/demo
echo No necesitas configurar una clave para la demostracion.
echo Para preparar el evento real: http://localhost:4173/admin
echo.
call npm start
if errorlevel 1 goto error
exit /b 0
:error
echo No se pudo iniciar. Revisa el mensaje anterior.
pause
exit /b 1

