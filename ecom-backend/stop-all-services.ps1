param()

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $rootDir
$pidDir = Join-Path $repoDir ".local\pids"

if (-not (Test-Path $pidDir)) {
    Write-Host "No local PID directory found: $pidDir"
    return
}

Get-ChildItem -Path $pidDir -Filter "*.pid" | ForEach-Object {
    $serviceName = $_.BaseName
    $pidValue = Get-Content -Path $_.FullName -ErrorAction SilentlyContinue
    if ($pidValue -and (Get-Process -Id $pidValue -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $pidValue -Force
        Write-Host "Stopped $serviceName (PID $pidValue)"
    } else {
        Write-Host "Already stopped: $serviceName"
    }
}

