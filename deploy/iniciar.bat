@echo off
chcp 65001 >nul 2>&1
title Pulse Tribe Pro
color 0B

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║        PULSE TRIBE PRO                   ║
echo  ║        Iniciando aplicação...            ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Vai para a pasta do script
cd /d "%~dp0"

:: Verifica se o build existe
if not exist "dist\index.html" (
    echo  ERRO: Pasta "dist" nao encontrada!
    echo  Execute o "instalar.bat" primeiro.
    pause
    exit /b 1
)

:: Verifica se Node.js está disponível
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERRO: Node.js nao encontrado!
    echo  Execute o "instalar.bat" primeiro.
    pause
    exit /b 1
)

:: Inicia a aplicação unificada (Web + ANT+)
echo  Iniciando a aplicação (Web + ANT+)...
start "Pulse Tribe Pro" cmd /c "npm start"

:: Aguarda um momento e abre o navegador
timeout /t 5 /nobreak > nul
echo  Abrindo o navegador...
start http://localhost:8080

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║                                          ║
echo  ║   App rodando em: http://localhost:8080   ║
echo  ║                                          ║
echo  ║   Para PARAR, feche a janela do CMD      ║
echo  ║   ou pressione qualquer tecla abaixo.    ║
echo  ║                                          ║
echo  ╚══════════════════════════════════════════╝
echo.
echo  Pressione qualquer tecla para ENCERRAR tudo...
pause > nul

:: Encerra os processos
echo  Encerrando...
taskkill /FI "WINDOWTITLE eq Pulse Tribe Pro" /F >nul 2>&1
echo  Encerrado com sucesso!
timeout /t 2 /nobreak > nul
