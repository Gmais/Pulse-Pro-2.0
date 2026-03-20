@echo off
echo ==========================================
echo   Iniciando Pulse Tribe Pro com ANT+ Bridge
echo ==========================================

:: Inicia a aplicação e a ponte de forma unificada
echo Inciando tudo em uma única janela...
npm run dev

echo.
echo Aplicação e Ponte ANT+ iniciadas com sucesso!
echo Pressione qualquer tecla para fechar esta janela (o app continuará rodando).
pause > nul
