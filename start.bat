@echo off
title ticketlean
color a
echo Starting lean...
echo ======================
echo.

REM Change directory to the folder of the script
cd /d "%~dp0"

REM Run the bot
node reset.js

echo.
echo Bot stopped or crashed.
pause

