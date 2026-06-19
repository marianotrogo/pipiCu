@echo off
title Configurar Arranque GastroPOS
cls

:: Verificar si se esta ejecutando como Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ========================================================
    echo  ERROR: Se requieren permisos de Administrador.
    echo  Por favor, haga clic derecho y elija "Ejecutar como admin".
    echo ========================================================
    pause
    exit /b
)

:: 🔥 PARCHE CLAVE: Fuerza a Windows a quedarse en esta carpeta y no irse a System32
cd /d "%~dp0"

:: Apuntamos al ejecutable (Si usas Python directo cambias la linea del reg add)
set EXE_PATH=%~dp0print_server.exe

echo ========================================================
echo     CONFIGURANDO IMPRESOR PARA ARRANCAR SIEMPRE DE FONDO     
echo ========================================================
echo.

:: 1. LIMPIEZA DE SEGURIDAD
sc stop GastroPOS_PrintServer >nul 2>&1
sc delete GastroPOS_PrintServer >nul 2>&1
taskkill /F /IM print_server.exe >nul 2>&1

:: 2. EL TRUCO MAESTRO: Registrar el EXE en el arranque de Windows
echo [INFO] Agregando el servidor al registro de Windows...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "GastroPOS_PrintServer" /t REG_SZ /d "\"%EXE_PATH%\"" /f >nul

if %errorLevel% neq 0 (
    echo [ERROR] No se pudo escribir en el registro de Windows.
    pause
    exit /b
)

:: 3. Lanzar el proceso ahora mismo en segundo plano
echo [INFO] Iniciando el servidor en segundo plano por primera vez...
start "" /b "%EXE_PATH%"

echo.
echo ========================================================
echo  ¡CONFIGURACION EXITOSA!
echo  1. El servidor ya esta corriendo de fondo de forma oculta.
echo  2. Arrancara SOLO y en silencio cada vez que se prenda la PC.
echo  3. Al NO ser servicio, SI podra mostrar la ventana de CustomTkinter.
echo ========================================================
echo.
timeout /t 5 /nobreak >nul
exit