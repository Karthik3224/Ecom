param(
    [string]$RootDir = "E:\ecom",
    [string]$MysqlUser = "root",
    [string]$MysqlPassword = "",
    [string]$MysqlBin = "",
    [string]$SqlFile = "",
    [switch]$SkipImport,
    [switch]$StartApp
)

$ErrorActionPreference = "Stop"
$GoogleMapsApiKey = $env:VITE_GOOGLE_MAPS_API_KEY

function Read-PlainSecret {
    param([string]$Prompt)
    $secure = Read-Host $Prompt -AsSecureString
    [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command '$Name'. Install it, then open a new terminal."
    }
}

function Find-MySqlTool {
    param([string]$Tool)
    if ($MysqlBin -and (Test-Path (Join-Path $MysqlBin $Tool))) {
        return Join-Path $MysqlBin $Tool
    }
    $known = @(
        "C:\Program Files\MySQL\MySQL Server 8.4\bin",
        "C:\Program Files\MySQL\MySQL Server 8.0\bin",
        "C:\Program Files\MySQL\MySQL Workbench 8.0 CE"
    )
    foreach ($dir in $known) {
        $candidate = Join-Path $dir $Tool
        if (Test-Path $candidate) { return $candidate }
    }
    $fromPath = Get-Command $Tool -ErrorAction SilentlyContinue
    if ($fromPath) { return $fromPath.Source }
    return ""
}

$backendDir = Join-Path $RootDir "ecom-backend"
$frontendDir = Join-Path $RootDir "ecom-frontend"
if (-not (Test-Path $backendDir)) { throw "Backend folder not found: $backendDir" }
if (-not (Test-Path $frontendDir)) { throw "Frontend folder not found: $frontendDir" }

Require-Command "java"
Require-Command "mvn"
Require-Command "node"
Require-Command "npm"

$mysql = Find-MySqlTool "mysql.exe"
if (-not $mysql) {
    $MysqlBin = Read-Host "Enter MySQL bin path, example C:\Program Files\MySQL\MySQL Server 8.0\bin"
    $mysql = Find-MySqlTool "mysql.exe"
    if (-not $mysql) { throw "mysql.exe not found. Check MySQL installation/path." }
}

if (-not $MysqlPassword) {
    $MysqlPassword = Read-PlainSecret "Enter MySQL password for user '$MysqlUser'"
}

if (-not $SqlFile) {
    $SqlFile = Join-Path $RootDir "ecom-data.sql"
}

if (-not $SkipImport) {
    if (-not (Test-Path $SqlFile)) { throw "SQL file not found: $SqlFile" }
    Write-Host "Importing database..."
    cmd /c "`"$mysql`" --binary-mode=1 -u $MysqlUser -p$MysqlPassword --force < `"$SqlFile`""
}

$envFile = Join-Path $frontendDir ".env"
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $frontendDir ".env.example") $envFile
}

$envContent = Get-Content -Raw $envFile
if ($GoogleMapsApiKey) {
    if ($envContent -match "VITE_GOOGLE_MAPS_API_KEY=") {
        $envContent = $envContent -replace "VITE_GOOGLE_MAPS_API_KEY=.*", "VITE_GOOGLE_MAPS_API_KEY=$GoogleMapsApiKey"
    } else {
        $envContent = $envContent.TrimEnd() + "`r`nVITE_GOOGLE_MAPS_API_KEY=$GoogleMapsApiKey`r`n"
    }
    Set-Content -Path $envFile -Value $envContent
    Write-Host "Google Maps key configured from VITE_GOOGLE_MAPS_API_KEY."
} else {
    Write-Warning "VITE_GOOGLE_MAPS_API_KEY is not set. Maps will remain unavailable until the client adds its own key to $envFile."
}

Write-Host "Installing frontend packages..."
Push-Location $frontendDir
npm install
Pop-Location

Write-Host "Setup complete."

if ($StartApp) {
    Push-Location $backendDir
    powershell -ExecutionPolicy Bypass -File .\run-all-services.ps1 restart -MysqlUsername $MysqlUser -MysqlPassword $MysqlPassword
    Pop-Location

    Push-Location $frontendDir
    npm run dev
    Pop-Location
}
