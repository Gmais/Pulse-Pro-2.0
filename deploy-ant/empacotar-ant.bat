@echo off
chcp 65001 >nul 2>&1
echo Criando pacote da Ponte ANT+...

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT=%%~fI\"
set "OUT=%ROOT%PonteANT-Instalador"

if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"
mkdir "%OUT%\ant-bridge"

echo Copiando ponte ANT+...
copy "%ROOT%ant-bridge\index.js" "%OUT%\ant-bridge\" >nul
copy "%ROOT%ant-bridge\package.json" "%OUT%\ant-bridge\" >nul
if exist "%ROOT%ant-bridge\package-lock.json" copy "%ROOT%ant-bridge\package-lock.json" "%OUT%\ant-bridge\" >nul

echo Copiando scripts...
copy "%SCRIPT_DIR%instalar-ant.bat" "%OUT%\" >nul
copy "%SCRIPT_DIR%iniciar-ant.bat" "%OUT%\" >nul
copy "%SCRIPT_DIR%TUTORIAL-ANT.txt" "%OUT%\" >nul

echo.
echo Pacote criado em: %OUT%
explorer "%OUT%"
pause
