param(
    [string]$MysqlPort = "3306",
    [string]$KafkaBootstrapServers = "localhost:9092"
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $rootDir "ecom-backend"
$launcher = Join-Path $backendDir "run-all-services.ps1"

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing '$Name'. Install it and open a new PowerShell window."
    }
}

function Require-Port([string]$HostName, [int]$Port, [string]$Name) {
    if (-not (Test-NetConnection -ComputerName $HostName -Port $Port -InformationLevel Quiet)) {
        throw "$Name is not reachable at ${HostName}:$Port. Start it before running the application."
    }
}

function Start-ExistingMySql {
    $service = Get-Service -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -in @('MySQL80', 'MySQL84', 'mysql') } |
        Select-Object -First 1
    if ($service -and $service.Status -ne 'Running') {
        try {
            Start-Service -Name $service.Name -ErrorAction Stop
            Write-Host "Started MySQL service: $($service.Name)"
        } catch {
            Write-Warning "MySQL service exists but could not be started automatically. Start '$($service.Name)' manually."
        }
    }
}

function Start-ExistingKafka {
    $server = 'C:\kafka\bin\windows\kafka-server-start.bat'
    $config = 'C:\kafka\config\kraft\server.properties'
    if (-not (Test-Path $server) -or -not (Test-Path $config)) {
        Write-Warning "Kafka was not found at C:\kafka. Install Kafka 3.6.x in KRaft mode first."
        return
    }
    $kafkaPort = ([uri]("http://$KafkaBootstrapServers")).Port
    if (-not (Test-NetConnection localhost -Port $kafkaPort -InformationLevel Quiet -WarningAction SilentlyContinue)) {
        Start-Process -FilePath 'cmd.exe' -ArgumentList @('/c', "`"$server`" `"$config`"") -WorkingDirectory 'C:\kafka' -WindowStyle Minimized | Out-Null
        Write-Host "Starting Kafka..."
        Start-Sleep -Seconds 5
    }
}

if (-not (Test-Path $launcher)) { throw "Backend launcher not found: $launcher" }
Require-Command "java"
Require-Command "mvn"

$javaVersion = (cmd /c "java -version 2>&1" | Select-Object -First 1).ToString()
if ($javaVersion -notmatch 'version "(2[1-9]|[3-9][0-9])') {
    throw "Java 21 or newer is required. Detected: $javaVersion"
}

Start-ExistingMySql
Start-ExistingKafka
Start-Sleep -Seconds 2
Require-Port "localhost" ([int]$MysqlPort) "MySQL"
$kafkaHost, $kafkaPortText = $KafkaBootstrapServers -split ':', 2
Require-Port $kafkaHost ([int]$kafkaPortText) "Kafka"

if ([string]::IsNullOrWhiteSpace($env:MYSQL_PASSWORD)) {
    $env:MYSQL_PASSWORD = Read-Host "MySQL password"
}

Write-Host "Starting backend services and frontend..."
& powershell -NoProfile -ExecutionPolicy Bypass -File $launcher start `
    -MysqlPort $MysqlPort `
    -MysqlPassword $env:MYSQL_PASSWORD `
    -KafkaBootstrapServers $KafkaBootstrapServers
