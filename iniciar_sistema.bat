@echo off
title Sistema Ferreteria Hebert - Servidor POS
color 0A
cls
echo ======================================================================
echo           SISTEMA DE INVENTARIO Y VENTAS - FERRETERIA HEBERT
echo ======================================================================
echo.
echo Iniciando servidor local...
echo.

:: Check if build exists, otherwise build it
if not exist "client\dist\index.html" (
    echo Compilando interfaz web por primera vez...
    call npm run build
)

:: Get local IP address for 2nd PC and smartphone connection
for /f "tokens=4" %%a in ('route print^|find " 0.0.0.0"') do set IP=%%a
echo  * Acceso en esta PC:              http://localhost:3000
echo  * Acceso para 2da PC o Celular:   http://%IP%:3000
echo.
echo ======================================================================
echo Abriendo navegador automaticamente...

start "" "http://localhost:3000"

node server.js
pause
