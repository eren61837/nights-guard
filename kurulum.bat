@echo off
chcp 65001 > nul
title Discord AI Architect - Kurulum Sihirbazi
color 0b

cd /d "%~dp0"

echo ==================================================================
echo   🤖 DISCORD AI ARCHITECT - INTERAKTIF KURULUM SIHIRBAZI
echo   PeakBot & Onyx AI Engine
echo ==================================================================
echo.
echo Kurulum sihirbazi baslatiliyor...
echo.

call npm run setup

pause
