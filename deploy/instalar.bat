@echo off
chcp 65001 >nul 2>&1
title Instalador - Pulse Tribe Pro
color 0A

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     INSTALADOR - PULSE TRIBE PRO         ║
echo  ║         Configuração Inicial             ║
echo  ╚══════════════════════════════════════════╝
echo.

:: -----------------------------------------------
:: 1. Verificar se Node.js está instalado
:: -----------------------------------------------
echo [1/4] Verificando Node.js...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ╔══════════════════════════════════════════╗
    echo  ║  ERRO: Node.js NAO encontrado!           ║
    echo  ║                                          ║
    echo  ║  Baixe e instale o Node.js primeiro:     ║
    echo  ║  https://nodejs.org                      ║
    echo  ║                                          ║
    echo  ║  Escolha a versao LTS (recomendada).     ║
    echo  ║  Depois de instalar, rode este script    ║
    echo  ║  novamente.                              ║
    echo  ╚══════════════════════════════════════════╝
    echo.
    echo Abrindo o site do Node.js...
    start https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo       Node.js encontrado: %NODE_VER% ✓
echo.

:: -----------------------------------------------
:: 2. Instalar servidor web (serve)
:: -----------------------------------------------
echo [2/4] Instalando servidor web...
call npm install -g serve >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo       ERRO ao instalar o servidor web.
    echo       Tente rodar como Administrador.
    pause
    exit /b 1
)
echo       Servidor web instalado ✓
echo.

:: -----------------------------------------------
:: 3. Instalar dependencias do ANT+ Bridge
:: -----------------------------------------------
echo [3/4] Instalando dependencias da ponte ANT+...
cd /d "%~dp0ant-bridge"
call npm install >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo       ERRO ao instalar dependencias ANT+.
    pause
    exit /b 1
)
cd /d "%~dp0"
echo       Dependencias ANT+ instaladas ✓
echo.

:: -----------------------------------------------
:: 4. Criar atalho na Area de Trabalho
:: -----------------------------------------------
echo [4/4] Criando atalho na Area de Trabalho...
set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\Pulse Tribe Pro.lnk"

:: Cria o atalho usando PowerShell
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%SCRIPT_DIR%iniciar.bat'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Pulse Tribe Pro'; $s.Save()" >nul 2>&1

if exist "%SHORTCUT%" (
    echo       Atalho criado na Area de Trabalho ✓
) else (
    echo       Nao foi possivel criar o atalho.
    echo       Voce pode rodar o "iniciar.bat" diretamente.
)

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║                                          ║
echo  ║   INSTALACAO CONCLUIDA COM SUCESSO! ✓    ║
echo  ║                                          ║
echo  ║   Para iniciar o app, use:               ║
echo  ║   - O atalho na Area de Trabalho         ║
echo  ║   - Ou clique em "iniciar.bat"           ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
