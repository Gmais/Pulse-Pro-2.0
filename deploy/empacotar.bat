@echo off
chcp 65001 >nul 2>&1
title Empacotador - Pulse Tribe Pro
color 0E

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   EMPACOTADOR - PULSE TRIBE PRO          ║
echo  ║   Criando pacote para outro computador   ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Resolve paths - deploy/ is inside project root
set "SCRIPT_DIR=%~dp0"
:: Go up one level from deploy/ to get root
for %%I in ("%SCRIPT_DIR%..") do set "ROOT=%%~fI\"
set "DEPLOY_DIR=%ROOT%PulseTribePro-Instalador"

echo  Pasta raiz: %ROOT%
echo  Destino:    %DEPLOY_DIR%
echo.

:: Limpa pasta anterior se existir
if exist "%DEPLOY_DIR%" (
    echo Removendo pacote anterior...
    rmdir /s /q "%DEPLOY_DIR%"
)

:: Cria estrutura
echo [1/5] Criando estrutura de pastas...
mkdir "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%\dist"
mkdir "%DEPLOY_DIR%\ant-bridge"
echo       OK

:: Copia o build
echo [2/5] Copiando app compilado (dist)...
xcopy "%ROOT%dist\*" "%DEPLOY_DIR%\dist\" /E /Q /Y >nul
echo       OK

:: Copia ANT+ Bridge (sem node_modules)
echo [3/5] Copiando ponte ANT+...
copy "%ROOT%ant-bridge\index.js" "%DEPLOY_DIR%\ant-bridge\" >nul
copy "%ROOT%ant-bridge\package.json" "%DEPLOY_DIR%\ant-bridge\" >nul
if exist "%ROOT%ant-bridge\package-lock.json" (
    copy "%ROOT%ant-bridge\package-lock.json" "%DEPLOY_DIR%\ant-bridge\" >nul
)
echo       OK

:: Copia .env
echo [4/5] Copiando configuracoes...
if exist "%ROOT%.env" (
    copy "%ROOT%.env" "%DEPLOY_DIR%\" >nul
    echo       .env copiado OK
) else (
    echo       AVISO: .env nao encontrado!
)

:: Copia scripts
echo [5/5] Copiando scripts...
copy "%SCRIPT_DIR%instalar.bat" "%DEPLOY_DIR%\" >nul
copy "%SCRIPT_DIR%iniciar.bat" "%DEPLOY_DIR%\" >nul
copy "%SCRIPT_DIR%TUTORIAL.txt" "%DEPLOY_DIR%\" >nul
echo       OK

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║                                          ║
echo  ║   PACOTE CRIADO COM SUCESSO!             ║
echo  ║                                          ║
echo  ║   Pasta: PulseTribePro-Instalador        ║
echo  ║                                          ║
echo  ║   Copie essa pasta inteira para um       ║
echo  ║   pendrive e leve ao outro computador.   ║
echo  ║                                          ║
echo  ║   No outro PC, rode: instalar.bat        ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Abre a pasta no explorador
explorer "%DEPLOY_DIR%"

pause
