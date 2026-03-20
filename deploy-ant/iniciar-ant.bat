@echo off
chcp 65001 >nul 2>&1
title Ponte ANT+ - Pulse Tribe Pro
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║        PONTE ANT+ - PULSE TRIBE PRO      ║
echo  ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERRO: Node.js nao encontrado!
    echo  Execute "instalar-ant.bat" primeiro.
    pause
    exit /b 1
)

:: Verificar se ant-bridge existe
if not exist "ant-bridge\index.js" (
    echo  ERRO: Pasta "ant-bridge" nao encontrada!
    pause
    exit /b 1
)

:: Verificar se node_modules existe
if not exist "ant-bridge\node_modules" (
    echo  Dependencias nao instaladas. Instalando...
    cd /d "%~dp0ant-bridge"
    call npm install
    cd /d "%~dp0"
)

:: Verificar dongle ANT+
echo  IMPORTANTE: Certifique-se de que o dongle
echo  ANT+ USB esta plugado no computador!
echo.
echo  Iniciando a ponte ANT+...
echo  Aguardando conexoes em ws://localhost:8765
echo.
echo  ─────────────────────────────────────────
echo  Para usar:
echo  1. Abra o Pulse Tribe Pro no navegador
echo  2. Va na pagina Monitor
echo  3. Clique em "Conectar ANT+"
echo  ─────────────────────────────────────────
echo.
echo  Para PARAR, pressione Ctrl+C ou feche
echo  esta janela.
echo.

cd /d "%~dp0ant-bridge"
node index.js
pause
