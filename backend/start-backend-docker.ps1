# Start backend Docker (PowerShell)
# Tries `docker compose` then falls back to `docker-compose`.
Set-StrictMode -Version Latest

function Command-Exists($name) {
    return (Get-Command $name -ErrorAction SilentlyContinue) -ne $null
}

if (-not (Command-Exists 'docker') -and -not (Command-Exists 'docker-compose')) {
    Write-Error "Docker not found. Install Docker Desktop and ensure 'docker' or 'docker-compose' is in PATH.`nRun: docker --version`nIf you use Docker Desktop, start it and enable command-line tools (or WSL integration)."
    exit 1
}

if (Command-Exists 'docker') {
    try { & docker --version } catch {}
    & docker compose version > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Output "Using 'docker compose' (v2)."
        & docker compose up --build -d
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to start containers with 'docker compose'."; exit $LASTEXITCODE }
        & docker compose ps
        Write-Output "Backend containers started. Use 'docker compose logs -f' to follow logs." 
        exit 0
    }
}

if (Command-Exists 'docker-compose') {
    try { & docker-compose --version } catch {}
    & docker-compose version > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Output "Using 'docker-compose' (v1)."
        & docker-compose up --build -d
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to start containers with 'docker-compose'."; exit $LASTEXITCODE }
        & docker-compose ps
        Write-Output "Backend containers started. Use 'docker-compose logs -f' to follow logs." 
        exit 0
    }
}

Write-Error "Docker Compose not found or not responding. Try running the following commands to diagnose:`n  docker --version`n  docker compose version`n  docker-compose version`nIf none work, install Docker Desktop and ensure the CLI is available in your PATH."
