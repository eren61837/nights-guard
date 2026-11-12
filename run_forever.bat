@echo off
chcp 65001 >nul
title Nights Guard • 7/24 Kesintisiz Bot Motoru (Made by erencix)
cd /d "C:\Users\dell\Desktop\dosyalar\discord-ai-architect"

echo ===================================================================
echo 🛡️ NIGHTS GUARD 7/24 KESİNTİSİZ NÖBETÇİ MOTORU (WATCHDOG)
echo 👤 Yapımcı: erencix (1138498666785677492)
echo ⚡ Bot kapansa veya çökse dahi 2 saniyede otomatik baştan başlar!
echo ===================================================================

:loop
echo.
echo [%date% %time%] 🚀 Nights Guard başlatılıyor...
node index.js
echo.
echo [%date% %time%] ⚠️ DİKKAT: Bot bir sebeple durdu veya kapandı!
echo [%date% %time%] 🔄 2 saniye içinde otomatik olarak yeniden başlatılıyor...
timeout /t 2 /nobreak >nul
goto loop
