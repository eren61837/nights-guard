@echo off
chcp 65001 > nul
title Discord AI Architect - 1-Click Sandbox Demo
color 0a

cd /d "%~dp0"

echo ==================================================================
echo   🚀 DISCORD AI ARCHITECT - 1-CLICK INTERAKTIF SANDBOX DEMO
echo   PeakBot Engine • Token ve API Key Gerekmez!
echo ==================================================================
echo.
echo Proje derleniyor ve demo sunucusu ayaga kaldiriliyor...
echo Web tarayiciniz otomatik olarak acilacaktir...
echo.

call npm run demo

pause
