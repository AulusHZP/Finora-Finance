@echo off
:: Start backend Docker (batch)
:: Tries `docker compose` then falls back to `docker-compose`.

docker compose version >nul 2>&1















docker compose psecho Containers started.)    )        exit /b 1        echo Docker Compose not found. Install Docker Desktop or ensure docker-compose is in PATH.    ) else (        docker-compose up --build -d        echo Using 'docker-compose' (v1).    if %ERRORLEVEL%==0 (    docker-compose version >nul 2>&1) else (    docker compose up --build -d    echo Using 'docker compose' (v2).;if %ERRORLEVEL%==0 (