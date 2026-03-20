@echo off
chcp 65001 >nul 2>&1
title Instalador - Ponte ANT+ para Pulse Tribe Pro
color 0A

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   INSTALADOR - PONTE ANT+               ║
echo  ║   Para usar com Pulse Tribe Pro          ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Verificar Node.js
echo [1/2] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ERRO: Node.js NAO encontrado!
    echo.
    echo  Baixe e instale o Node.js primeiro:
    echo  https://nodejs.org
    echo.
    echo  Escolha a versao LTS (recomendada).
    echo  Depois de instalar, rode este script novamente.
    echo.
    echo  Abrindo o site do Node.js...
    start https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo       Node.js encontrado: %NODE_VER%
echo.

:: Instalar dependencias
echo [2/2] Instalando dependencias da ponte ANT+...
cd /d "%~dp0ant-bridge"
call npm install >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo       ERRO ao instalar dependencias.
    pause
    exit /b 1
)
cd /d "%~dp0"
echo       Dependencias instaladas!
echo.

:: Criar atalho
set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\Ponte ANT+.lnk"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%SCRIPT_DIR%iniciar-ant.bat'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Ponte ANT+ - Pulse Tribe Pro'; $s.Save()" >nul 2>&1

if exist "%SHORTCUT%" (
    echo  Atalho criado na Area de Trabalho!
)

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   INSTALACAO CONCLUIDA!                  ║
echo  ║                                          ║
echo  ║   Para iniciar a ponte ANT+:             ║
echo  ║   - Use o atalho na Area de Trabalho     ║
echo  ║   - Ou clique em "iniciar-ant.bat"       ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
