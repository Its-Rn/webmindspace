@echo off
start "MongoDB" /MIN "H:\Mongo DB\bin\mongod.exe" --dbpath "H:\Mongo DB\data" --port 27017
echo MongoDB starting on port 27017...
timeout /t 5 /nobreak >nul
netstat -an | findstr ":27017"
