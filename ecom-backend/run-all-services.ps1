param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'restart')]
    [string]$Action = 'start',
    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Service = @(),
    [string]$MysqlHost = "localhost",
    [string]$MysqlPort = "3306",
    [string]$MysqlUsername = "root",
    [string]$MysqlPassword = $env:MYSQL_PASSWORD,
    [string]$KafkaBootstrapServers = "localhost:9092",
    [switch]$EnableLegacyAlerts,
    [switch]$StartFrontend,
    [switch]$IsolatedTest,
    [string]$ExpectedTestDatabaseUuid,
    [string]$PinnedRelease,
    [switch]$BrowserQualification
)

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoDir = Split-Path -Parent $rootDir
if ($PinnedRelease) {
    if (-not $IsolatedTest -or $Action -ne 'start' -or $MysqlHost -ne '127.0.0.1' -or $MysqlPort -ne '14306' -or
        $ExpectedTestDatabaseUuid -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa' -or $EnableLegacyAlerts -or $StartFrontend) {
        throw 'Pinned qualification requires the explicit isolated target; no live launch permitted.'
    }
    & (Join-Path $repoDir 'deployment\Test-PinnedStack.ps1') -Release $PinnedRelease -BrowserQualification:$BrowserQualification
    return
}
$localDir = Join-Path $repoDir ".local"
if ($IsolatedTest) {
    if ($Action -ne 'start') { throw 'IsolatedTest supports start only; stop test processes after checking their identity.' }
    $testMysqlPort=0
    if (-not [int]::TryParse($MysqlPort,[ref]$testMysqlPort) -or $testMysqlPort -lt 1 -or $testMysqlPort -gt 65535 -or $MysqlHost -notin @('127.0.0.1','localhost') -or $testMysqlPort -eq 3306 -or -not $ExpectedTestDatabaseUuid) {
        throw 'IsolatedTest requires a loopback non-live MySQL port and ExpectedTestDatabaseUuid.'
    }
    if ($EnableLegacyAlerts -or $StartFrontend) { throw 'IsolatedTest does not permit legacy alerts or the live frontend.' }
    if (-not $Service -or $Service -contains 'Ecom-frontend') { throw 'IsolatedTest requires explicitly selected backend services.' }
    $localDir = Join-Path $localDir "isolated-test-$MysqlPort"
}
$logDir = Join-Path $localDir "logs"
$pidDir = Join-Path $localDir "pids"
$toolsDir = Join-Path $repoDir "tools"
if (-not (Test-Path $toolsDir)) { $toolsDir = Join-Path $rootDir 'tools' }
$servicePorts = @{'Ecom-eureka-server'=8761;'Ecom-config-server'=8888;'Ecom-Org-access'=3310;'customer-profile-service'=8088;'catalog-service'=8089;'inventory-service'=8095;'cart-service'=8091;'order-service'=3311;'payment-service'=3314;'fulfillment-service'=3315;'notification-service'=3317;'Ecom-api-gateway'=8082;'Ecom-Alerts'=8087}
if ($IsolatedTest) {
    foreach ($name in @($servicePorts.Keys)) { $servicePorts[$name] += 10000 }
    $env:SPRING_CLOUD_CONFIG_ENABLED='false'
    $env:EUREKA_CLIENT_ENABLED='false'
    $env:NOTIFICATION_SENDING_ENABLED='false'
    $env:ORDER_SERVICE_URL='http://127.0.0.1:13311'
    $env:ORDERS_SERVICE_URL='http://127.0.0.1:13311'
    $env:PAYMENT_SERVICE_URL='http://127.0.0.1:13314'
    $env:FULFILLMENT_SERVICE_URL='http://127.0.0.1:13315'
    $env:NOTIFICATION_SERVICE_URL='http://127.0.0.1:13317'
    $env:NOTIFICATIONS_SERVICE_URL='http://127.0.0.1:13317'
    $env:CATALOG_SERVICE_URL='http://127.0.0.1:18089'
    $env:CART_SERVICE_URL='http://127.0.0.1:18091'
    $env:ORG_ACCESS_SERVICE_URL='http://127.0.0.1:13310'
    $env:CONFIG_SERVER_URL='http://127.0.0.1:18888'
    $env:EUREKA_SERVER_URL='http://127.0.0.1:18761/eureka'
}

function Use-ToolFallback {
    param(
        [string]$Command,
        [string]$FallbackBin
    )

    if (Get-Command $Command -ErrorAction SilentlyContinue) { return }
    if (Test-Path $FallbackBin) {
        $env:PATH = "$(Split-Path -Parent $FallbackBin);$env:PATH"
    }
}

Use-ToolFallback "java" (Join-Path $toolsDir "java\bin\java.exe")
Use-ToolFallback "mvn" (Join-Path $toolsDir "maven\bin\mvn.cmd")
Use-ToolFallback "npm" (Join-Path $toolsDir "node\npm.cmd")

$fallbackJavaHome = Join-Path $toolsDir "java"
$systemJavaVersion = (& java -version 2>&1 | Out-String)
if ((-not (Get-Command "java" -ErrorAction SilentlyContinue) -or $systemJavaVersion -notmatch 'version "21\.') -and (Test-Path (Join-Path $fallbackJavaHome "bin\java.exe"))) {
    $env:JAVA_HOME = $fallbackJavaHome
    $env:PATH = "$(Join-Path $fallbackJavaHome 'bin');$env:PATH"
}

function Get-JavaMajorVersion {
    $javaOutput = (& java -version 2>&1 | Out-String)
    $match = [regex]::Match($javaOutput, 'version "(?<version>[^".]+)')
    if (-not $match.Success) { return $null }
    return [int]$match.Groups['version'].Value
}

if (-not (Get-Command "java" -ErrorAction SilentlyContinue) -or (Get-JavaMajorVersion) -ne 21) {
    throw "Java 21 is required. Install Java 21 or place it under tools\java."
}
if (-not (Get-Command "mvn" -ErrorAction SilentlyContinue)) {
    throw "Maven is required. Install Maven or provide ecom-backend\tools\maven."
}
if ($StartFrontend -and -not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    throw "Node.js/npm is required. Install Node.js or provide ecom-backend\tools\node."
}

if ($EnableLegacyAlerts -and -not $env:KAFKA_HOME) {
    $installedKafka = @('C:\kafka', (Join-Path $toolsDir 'kafka')) |
        Where-Object { Test-Path (Join-Path $_ 'bin\windows\kafka-server-start.bat') } |
        Select-Object -First 1
    if ($installedKafka) { $env:KAFKA_HOME = $installedKafka }
}
if ($EnableLegacyAlerts -and -not $env:KAFKA_HOME) {
    throw "Kafka is required at C:\kafka or tools\kafka."
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path $pidDir | Out-Null

$env:MYSQL_HOST = $MysqlHost
$env:MYSQL_PORT = $MysqlPort
$env:MYSQL_USERNAME = $MysqlUsername
$env:MYSQL_PASSWORD = $MysqlPassword
if ($EnableLegacyAlerts) { $env:KAFKA_BOOTSTRAP_SERVERS = $KafkaBootstrapServers }
$env:CONFIG_SERVER_URL = "http://localhost:8888"
$env:EUREKA_SERVER_URL = "http://localhost:8761/eureka"
$env:FLYWAY_ENABLED = "false"
$env:SPRING_FLYWAY_ENABLED = "false"
$env:SPRING_JPA_HIBERNATE_DDL_AUTO = "validate"
$env:CUSTOMER_MIGRATION_JDBC_URL = "jdbc:mysql://$MysqlHost`:$MysqlPort/customer_profiles?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
$env:CUSTOMER_MIGRATION_DB_USER = $MysqlUsername
$env:CUSTOMER_MIGRATION_DB_PASSWORD = $MysqlPassword

$dependencyKafkaPidFile = Join-Path $pidDir "__launcher-kafka.pid"
$dependencyMysqlMarker = Join-Path $pidDir "__launcher-mysql.started"
$bundledKafkaHome = [IO.Path]::GetFullPath((Join-Path $toolsDir 'kafka'))
$usingBundledKafka = $EnableLegacyAlerts -and $env:KAFKA_HOME -and ([IO.Path]::GetFullPath($env:KAFKA_HOME) -ieq $bundledKafkaHome)

function Test-LocalPort {
    param([string]$HostName, [int]$Port)
    return [bool](Test-NetConnection -ComputerName $HostName -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue)
}

function Wait-LocalPort {
    param([string]$HostName, [int]$Port, [string]$Name, [int]$TimeoutSeconds = 60)
    for ($attempt = 1; $attempt -le $TimeoutSeconds; $attempt++) {
        if (Test-LocalPort -HostName $HostName -Port $Port) { return $true }
        Start-Sleep -Seconds 1
    }
    Write-Error "$Name did not become available at ${HostName}:$Port."
    return $false
}

function Start-Dependencies {
    Write-Host "[1/10] Checking MySQL..."
    if (Test-LocalPort -HostName $MysqlHost -Port ([int]$MysqlPort)) {
        Write-Host "MySQL is already running on ${MysqlHost}:$MysqlPort."
    } else {
        if ($IsolatedTest) { throw 'The isolated MySQL server is unavailable; no system MySQL service will be started.' }
        $mysqlService = Get-Service -Name "MySQL80" -ErrorAction SilentlyContinue
        if ($mysqlService) {
            if ($mysqlService.Status -ne "Running") {
                Write-Host "MySQL80 service found. Starting MySQL..."
                Start-Service -Name "MySQL80"
                Set-Content -Path $dependencyMysqlMarker -Value "MySQL80"
            }
            Write-Host "Waiting for ${MysqlHost}:$MysqlPort..."
            if (-not (Wait-LocalPort -HostName $MysqlHost -Port ([int]$MysqlPort) -Name "MySQL")) { throw "MySQL Server is required and must be running on localhost:3306." }
            Write-Host "MySQL is ready."
        } else {
            throw "MySQL Server is required and must be running on localhost:3306."
        }
    }

    if (-not $EnableLegacyAlerts) {
        Write-Host "Core e-commerce uses durable HTTP synchronization; Kafka is not started. Legacy booking/house alerts are excluded."
        return
    }
    Write-Host "[2/10] Checking Kafka for legacy alerts..."
    $kafkaHost, $kafkaPortText = $KafkaBootstrapServers -split ":", 2
    $kafkaPort = [int]$kafkaPortText
    if (Test-LocalPort -HostName $kafkaHost -Port $kafkaPort) {
        Write-Host "Kafka is already running on ${kafkaHost}:$kafkaPort."
        return
    }

    $kafkaStart = Join-Path $env:KAFKA_HOME "bin\windows\kafka-server-start.bat"
    $sourceKafkaConfig = Join-Path $env:KAFKA_HOME "config\kraft\server.properties"
    $kafkaConfig = $sourceKafkaConfig
    if (-not (Test-Path $kafkaStart) -or -not (Test-Path $sourceKafkaConfig)) {
        throw "Kafka installation or KRaft configuration was not found under $env:KAFKA_HOME."
    }

    if ($usingBundledKafka) {
        $bundledDataDir = Join-Path $env:KAFKA_HOME 'data'
        $runtimeKafkaDir = Join-Path $localDir 'kafka'
        $kafkaConfig = Join-Path $runtimeKafkaDir 'server.properties'
        New-Item -ItemType Directory -Force -Path $runtimeKafkaDir,$bundledDataDir | Out-Null

        $configText = Get-Content -LiteralPath $sourceKafkaConfig -Raw
        if ($configText -notmatch '(?m)^\s*process\.roles\s*=\s*broker,controller\s*$' -or
            $configText -notmatch '(?m)^\s*listeners\s*=.*PLAINTEXT://localhost:9092.*CONTROLLER://localhost:9093' -or
            $configText -notmatch '(?m)^\s*advertised\.listeners\s*=\s*PLAINTEXT://localhost:9092\s*$') {
            throw "Bundled Kafka configuration is not the required localhost KRaft configuration."
        }
        $dataPath = ($bundledDataDir -replace '\\','/')
        $configText = [regex]::Replace($configText, '(?m)^\s*log\.dirs\s*=.*$', "log.dirs=$dataPath")
        Set-Content -LiteralPath $kafkaConfig -Value $configText -Encoding UTF8
        if (-not (Test-Path -LiteralPath $kafkaConfig)) {
            throw "Kafka runtime configuration was not created: $kafkaConfig"
        }

        $dataFiles = @(Get-ChildItem -LiteralPath $bundledDataDir -Force -ErrorAction SilentlyContinue)
        $metaFile = Join-Path $bundledDataDir 'meta.properties'
        if (-not (Test-Path $metaFile)) {
            if ($dataFiles.Count -gt 0) {
                throw "Bundled Kafka data appears partially initialized. Manual recovery is required. No Kafka data was deleted or reformatted."
            }

            $storageTool = Join-Path $env:KAFKA_HOME 'bin\windows\kafka-storage.bat'
            if (-not (Test-Path $storageTool)) { throw "Bundled Kafka storage tool was not found." }
            Write-Host "Bundled Kafka is uninitialized. Creating its new KRaft cluster once..."
            $uuidOutput = & cmd.exe /c "`"$storageTool`" random-uuid" 2>&1 | Out-String
            $uuidMatch = [regex]::Match($uuidOutput, '[A-Za-z0-9_-]{20,30}')
            if (-not $uuidMatch.Success) { throw "Could not generate a KRaft cluster ID for bundled Kafka." }
            $clusterId = $uuidMatch.Value
            & cmd.exe /c "`"$storageTool`" format -t $clusterId -c `"$kafkaConfig`"" | Out-Host
            if ($LASTEXITCODE -ne 0 -or -not (Test-Path $metaFile)) { throw "Bundled Kafka storage initialization failed." }
        } else {
            Write-Host "Bundled Kafka data is already initialized; reusing it without formatting."
        }
    }

    Write-Host "Kafka installation found. Starting Kafka..."
    # cmd.exe needs the outer quotes around the complete /c command when the
    # command itself starts with a quoted batch-file path.
    if (-not (Test-Path -LiteralPath $kafkaConfig)) {
        throw "Kafka runtime configuration is missing: $kafkaConfig"
    }
    $kafkaCommand = '/d /s /c ""{0}" "{1}""' -f $kafkaStart, $kafkaConfig
    $kafkaProcess = Start-Process -FilePath "cmd.exe" -ArgumentList $kafkaCommand -WorkingDirectory $env:KAFKA_HOME -WindowStyle Hidden -PassThru
    Set-Content -Path $dependencyKafkaPidFile -Value $kafkaProcess.Id
    Write-Host "Waiting for ${kafkaHost}:$kafkaPort..."
    if (-not (Wait-LocalPort -HostName $kafkaHost -Port $kafkaPort -Name "Kafka" -TimeoutSeconds 90)) { throw "Kafka is unavailable. Check the Kafka KRaft log and try again." }
    Write-Host "Kafka is ready."
}

function Stop-Dependencies {
    if ($EnableLegacyAlerts -and (Test-Path $dependencyKafkaPidFile)) {
        $pidValue = (Get-Content $dependencyKafkaPidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
        if ($pidValue -match '^\d+$' -and (Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue)) {
            Stop-Process -Id ([int]$pidValue) -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped Kafka started by this launcher (PID $pidValue)."
        }
        Remove-Item $dependencyKafkaPidFile -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $dependencyMysqlMarker) {
        Stop-Service -Name "MySQL80" -ErrorAction SilentlyContinue
        Remove-Item $dependencyMysqlMarker -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped MySQL80 started by this launcher."
    }
}

$startupGroups = @(
    @("Ecom-eureka-server"),
    @("Ecom-config-server"),
    @(
        "Ecom-Org-access",
        "customer-profile-service",
        "catalog-service",
        "inventory-service",
        "cart-service",
        "notification-service",
        "fulfillment-service",
        "payment-service",
        "order-service",
        "Ecom-api-gateway"
    )
)
if ($EnableLegacyAlerts) { $startupGroups += ,@("Ecom-Alerts") }

$allServiceNames = @($startupGroups | ForEach-Object { $_ })

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command '$Name'. Install it and open a new PowerShell window."
    }
}

function Resolve-ServiceList {
    param([string[]]$Requested)

    if (-not $Requested -or $Requested.Count -eq 0) {
        return @($allServiceNames | Select-Object -Unique)
    }

    $result = New-Object System.Collections.Generic.List[string]
    foreach ($item in $Requested) {
        $value = [string]$item
        if ([string]::IsNullOrWhiteSpace($value)) { continue }
        if ($value -ieq 'all' -or $value -eq '*') {
            return @($allServiceNames | Select-Object -Unique)
        }
        if ($value -ieq 'frontend') {
            $result.Add('Ecom-frontend')
            continue
        }
        if ($value -ieq 'Ecom-Alerts' -and -not $EnableLegacyAlerts) {
            throw "Legacy alerts still require Kafka. Use -EnableLegacyAlerts explicitly."
        }

        $match = $allServiceNames | Where-Object {
            $_ -ieq $value -or $_.ToLower().Contains($value.ToLower())
        } | Select-Object -First 1

        if ($match) {
            $result.Add($match)
        } else {
            Write-Warning "Unknown service '$value'. Ignoring it."
        }
    }

    if ($result.Count -eq 0) {
        return @($allServiceNames | Select-Object -Unique)
    }

    return @($result | Select-Object -Unique)
}

function Stop-LocalService {
    param([string]$Name)

    $pidFile = Join-Path $pidDir "$Name.pid"
    if (-not (Test-Path $pidFile)) {
        Write-Host "Already stopped: $Name"
        return
    }

    $pidValue = (Get-Content -Path $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
    if ($pidValue -and $pidValue -match '^\d+$') {
        $process = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
        if ($process) {
            Stop-Process -Id ([int]$pidValue) -Force
            Write-Host ("Stopped {0} (PID {1})" -f $Name, $pidValue)
        } else {
            Write-Host "Already stopped: $Name"
        }
    }

    Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}

function Start-LocalProcess {
    param(
        [string]$Name,
        [string]$Directory,
        [string]$Command
    )

    if (-not (Test-Path $Directory)) {
        Write-Warning "Skipping missing directory: $Directory"
        return
    }

    $pidFile = Join-Path $pidDir "$Name.pid"
    if (Test-Path $pidFile) {
        $pidValue = (Get-Content -Path $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
        if ($pidValue -and $pidValue -match '^\d+$' -and (Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue)) {
            Write-Host ("Already running: {0} (PID {1})" -f $Name, $pidValue)
            return
        }
    }

    if ($servicePorts.ContainsKey($Name) -and (Test-LocalPort -HostName '127.0.0.1' -Port $servicePorts[$Name])) {
        throw "Port $($servicePorts[$Name]) for $Name is occupied by an unmanaged process. Review its identity and obtain replacement approval; no process was stopped."
    }
    $logFile = Join-Path $logDir "$Name.log"
    $script = "Set-Location -LiteralPath '$Directory'; $Command *> '$logFile'"
    $process = Start-Process -FilePath "powershell" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $script) -WindowStyle Hidden -PassThru
    Set-Content -Path $pidFile -Value $process.Id
    Write-Host ("Started {0} (PID {1}) -> {2}" -f $Name, $process.Id, $logFile)
}

function Start-Services {
    param([string[]]$Selected)

    if ($IsolatedTest) {
        $mysql = Get-Command mysql.exe -ErrorAction SilentlyContinue
        $mysqlPath = if ($mysql) { $mysql.Source } else { 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe' }
        $env:MYSQL_PWD=$MysqlPassword
        try {
            $identity = & $mysqlPath --host=$MysqlHost --port=$MysqlPort --user=$MysqlUsername --batch --skip-column-names --execute='SELECT @@server_uuid'
            if ($LASTEXITCODE -ne 0 -or $identity -ne $ExpectedTestDatabaseUuid) { throw 'Isolated database identity mismatch.' }
        } finally { Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue }
    }

    if ($Selected | Where-Object { $_ -in @('cart-service','order-service','payment-service','fulfillment-service','notification-service') }) {
        Assert-SyncSchemas -Selected $Selected
        foreach ($key in @('ORDER_SYNC_KEY','PAYMENT_SYNC_KEY','FULFILLMENT_SYNC_KEY')) {
            $value = [Environment]::GetEnvironmentVariable($key)
            if (-not $value -or $value.Length -lt 32) { throw "$key must be configured with at least 32 characters." }
        }
        Push-Location (Join-Path $rootDir 'http-sync')
        try {
            & mvn -DskipTests install
            if ($LASTEXITCODE -ne 0) { throw "HTTP synchronization library build failed." }
        } finally { Pop-Location }
    }

    foreach ($group in $startupGroups) {
        foreach ($serviceName in $group) {
            if ($Selected -contains $serviceName) {
                $serviceDir = Join-Path $rootDir $serviceName
                $command = 'mvn -DskipTests spring-boot:run'
                if ($IsolatedTest) {
                    $clientEnabled = if ($serviceName -eq 'Ecom-eureka-server') { 'true' } else { 'false' }
                    $command = "`$env:SERVER_PORT='$($servicePorts[$serviceName])'; `$env:SERVER_ADDRESS='127.0.0.1'; `$env:EUREKA_CLIENT_ENABLED='$clientEnabled'; $command"
                }
                Start-LocalProcess -Name $serviceName -Directory $serviceDir -Command $command
                Wait-ServiceHealth -Name $serviceName
            }
        }
        $groupHasSelected = $group | Where-Object { $Selected -contains $_ }
        if ($groupHasSelected) {
            Start-Sleep -Seconds 15
        }
    }

    if ($Selected -contains 'Ecom-frontend' -or $StartFrontend) {
        $frontendDir = Join-Path $repoDir "Ecom-frontend"
        Start-LocalProcess -Name "Ecom-frontend" -Directory $frontendDir -Command "if (-not (Test-Path 'node_modules')) { npm.cmd install }; node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173"
    }
}

function Assert-SyncSchemas {
    param([string[]]$Selected)
    if ($env:MYSQL_DB) { throw 'Unset the shared MYSQL_DB override: each service needs its own reviewed schema.' }
    $mysqlCommand = Get-Command mysql.exe -ErrorAction SilentlyContinue
    $mysql = if ($mysqlCommand) { $mysqlCommand.Source } else { Join-Path $env:ProgramFiles 'MySQL\MySQL Server 8.0\bin\mysql.exe' }
    if (-not (Test-Path $mysql)) { throw 'MySQL client is required for read-only schema preflight. Put mysql.exe on PATH.' }
    $schemas = @{'cart-service'='cart_service';'order-service'='order-service';'payment-service'='payment_service';'fulfillment-service'='fulfillment-service';'notification-service'='notification_service'}
    $columns = @{
        'sync_receiver_lock'='id'
        'sync_inbox'='source,event_id,body_hash,received_at'
        'sync_outbox'='id,event_id,target,aggregate_id,body,state,attempts,next_attempt,lease_token,lease_until,last_error'
        'order_creation_requests'='customer_id,request_key,request_hash,order_id'
        'provider_payment_bindings'='provider_payment_id,payment_id'
        'provider_payment_receipts'='event_id,provider_payment_id,evidence_id,body_hash'
        'cart_write_lock'='id'
        'cart_mutation_requests'='cart_id,request_key,request_hash,created_at'
        'cart_checkout_claims'='cart_id,request_hash,created_at'
    }
    $oldPassword = $env:MYSQL_PWD
    try {
        $env:MYSQL_PWD = $MysqlPassword
        foreach ($name in $Selected) {
            if (-not $schemas.ContainsKey($name)) { continue }
            $schema = $schemas[$name]
            $tables = @('sync_receiver_lock','sync_inbox','sync_outbox')
            if ($name -eq 'cart-service') { $tables = @('cart_write_lock','cart_mutation_requests','cart_checkout_claims') }
            if ($name -eq 'order-service') { $tables += 'order_creation_requests' }
            if ($name -eq 'payment-service') { $tables += @('provider_payment_bindings','provider_payment_receipts') }
            foreach ($table in $tables) {
                $query = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$schema' AND table_name='$table'"
                $count = & $mysql --host=$MysqlHost --port=$MysqlPort --user=$MysqlUsername --batch --skip-column-names --execute=$query
                if ($LASTEXITCODE -ne 0) { throw "Read-only schema preflight failed for $name. No service started." }
                if ([string]$count -ne '1') { throw "Missing $schema.$table. Obtain migration approval and provision the reviewed schema before starting services." }
                & $mysql --host=$MysqlHost --port=$MysqlPort --user=$MysqlUsername --batch --execute="SELECT $($columns[$table]) FROM ``$schema``.``$table`` LIMIT 0" | Out-Null
                if ($LASTEXITCODE -ne 0) { throw "Required columns are missing in $schema.$table." }
                $engine = & $mysql --host=$MysqlHost --port=$MysqlPort --user=$MysqlUsername --batch --skip-column-names --execute="SELECT engine FROM information_schema.tables WHERE table_schema='$schema' AND table_name='$table'"
                if ($LASTEXITCODE -ne 0 -or [string]$engine -ne 'InnoDB') { throw "Transactional InnoDB is required for $schema.$table." }
            }
            $lockTable = if ($name -eq 'cart-service') { 'cart_write_lock' } else { 'sync_receiver_lock' }
            $seed = & $mysql --host=$MysqlHost --port=$MysqlPort --user=$MysqlUsername --batch --skip-column-names --execute="SELECT COUNT(*) FROM ``$schema``.$lockTable WHERE id=1"
            if ($LASTEXITCODE -ne 0 -or [string]$seed -ne '1') { throw "Missing synchronization lock seed in $schema." }
            if ($name -eq 'order-service') {
                $fee = & $mysql --host=$MysqlHost --port=$MysqlPort --user=$MysqlUsername --batch --skip-column-names --execute="SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='$schema' AND table_name='orders' AND column_name='handling_fee' AND data_type='decimal' AND numeric_precision=10 AND numeric_scale=2 AND is_nullable='NO' AND column_default='0.00'"
                if ($LASTEXITCODE -ne 0 -or [string]$fee -ne '1') { throw 'Order handling_fee requires compatible reviewed V10 schema.' }
            }
        }
    } finally { $env:MYSQL_PWD = $oldPassword }
}

function Wait-ServiceHealth {
    param([string]$Name)
    $deadline = (Get-Date).AddSeconds(120)
    do {
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$($servicePorts[$Name])/actuator/health" -TimeoutSec 3
            if ($health.status -eq 'UP') { Write-Host "Healthy: $Name"; return }
        } catch { }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)
    throw "Service $Name did not become healthy. Inspect $logDir\$Name.log; startup is not verified."
}

function Stop-Services {
    param([string[]]$Selected)

    foreach ($serviceName in $Selected) {
        if ($serviceName -eq 'Ecom-frontend') {
            Stop-LocalService -Name $serviceName
            continue
        }

        $serviceDir = Join-Path $rootDir $serviceName
        if (Test-Path $serviceDir) {
            Stop-LocalService -Name $serviceName
        } else {
            Write-Warning "Skipping missing service folder: $serviceDir"
        }
    }
}

Require-Command "java"
Require-Command "mvn"
if ($StartFrontend -or ($Service -contains 'Ecom-frontend') -or ($Action -eq 'start' -and -not $Service)) {
    Require-Command "npm"
}

$selectedServices = Resolve-ServiceList -Requested $Service

if ($Action -eq 'stop') {
    Stop-Services -Selected $selectedServices
    Stop-Dependencies
    Write-Host ""
    Write-Host "Stop requested for: $($selectedServices -join ', ')"
    return
}

if ($Action -eq 'restart') {
    if ($selectedServices | Where-Object { $_ -in @('order-service','payment-service','fulfillment-service','notification-service') }) {
        Assert-SyncSchemas -Selected $selectedServices
    }
    Stop-Services -Selected $selectedServices
    Start-Dependencies
    Start-Services -Selected $selectedServices
    Write-Host ""
    Write-Host "Restart completed for: $($selectedServices -join ', ')"
    return
}

Start-Dependencies
Start-Services -Selected $selectedServices
Write-Host ""
Write-Host "Local startup requested for: $($selectedServices -join ', ')"
if ($IsolatedTest) {
    foreach ($name in $selectedServices) { Write-Host "Test service ${name}: http://127.0.0.1:$($servicePorts[$name])" }
} else {
    Write-Host "Frontend: http://127.0.0.1:5173"
    Write-Host "Gateway:  http://localhost:8082"
    Write-Host "Eureka:   http://localhost:8761"
}
Write-Host "Logs:     $logDir"
