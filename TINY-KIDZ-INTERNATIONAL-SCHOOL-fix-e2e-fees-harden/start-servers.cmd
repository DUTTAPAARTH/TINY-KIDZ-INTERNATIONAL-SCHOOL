@echo off
set WORKDIR=C:\Users\PAARTH DUTTA\Downloads\TINY-KIDZ-INTERNATIONAL-SCHOOL-fix-e2e-fees-harden\TINY-KIDZ-INTERNATIONAL-SCHOOL-fix-e2e-fees-harden
cd /d "%WORKDIR%\backend"
start "Backend" /B node server.js
cd /d "%WORKDIR%\frontend"
start "Frontend" /B node node_modules\vite\bin\vite.js --port 5173 --host
