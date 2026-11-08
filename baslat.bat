@echo off
chcp 65001 > nul
title Discord AI Architect (PeakBot Engine)
color 0b

cd /d "%~dp0"

echo ========================================================
echo   🤖 DISCORD AI ARCHITECT (PeakBot / Onyx AI Engine)
echo ========================================================
echo.

if not exist .env (
    echo [BILGI] .env dosyasi bulunamadi. Kurulum sihirbazi baslatiliyor...
    call npm run setup
)

findstr /r "^DISCORD_TOKEN=..*" .env >nul 2>&1
if %errorlevel% neq 0 (
    echo [BILGI] DISCORD_TOKEN henuz tanimlanmamis!
    echo Token olmadan aninda test etmek icin demo.bat calistirabilirsiniz.
    echo Kurulum sihirbazi baslatiliyor...
    call npm run setup
)

echo [1/2] Proje TypeScript dosyalari derleniyor...
call npm run build
if %errorlevel% neq 0 (
    echo [HATA] Derleme basarisiz oldu!
    pause
    exit /b
)

echo [2/2] Discord AI Architect Botu Baslatiliyor...
echo.
call npm start

pause
