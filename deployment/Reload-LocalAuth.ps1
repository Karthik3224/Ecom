$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$identity = & $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if ($identity -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa') { throw 'Wrong local database server' }
$listener = netstat -ano -p tcp | Select-String '127.0.0.1:3310\s+.*LISTENING'
if (@($listener).Count -ne 1) { throw 'Expected one local authentication listener' }
$authProcessId = [int](($listener.Line.Trim() -split '\s+')[-1])
$process = Get-CimInstance Win32_Process -Filter "ProcessId=$authProcessId"
$expectedJava = "$root\ecom-backend\tools\java\bin\java.exe"
if ($process.ExecutablePath -ne $expectedJava -or !$process.CommandLine.Contains('jdbc:mysql://127.0.0.1:14306/users_roles?') -or !$process.CommandLine.Contains('--spring.flyway.enabled=false') -or !$process.CommandLine.Contains('--server.address=127.0.0.1')) { throw 'Not the verified local authentication service' }
$startupArguments = $process.CommandLine.Substring($process.CommandLine.IndexOf(' -Xms')).Trim()
$env:JAVA_HOME = "$root\ecom-backend\tools\java"
$env:JWT_SECRET = 'isolated-qualification-jwt-' + ('x' * 64)
$env:JWT_ISSUER = 'org-access'
Stop-Process -Id $authProcessId
try {
  & "$root\ecom-backend\tools\maven\bin\mvn.cmd" -f "$root\ecom-backend\Ecom-Org-access\pom.xml" -q '-DskipTests' package
  if ($LASTEXITCODE -ne 0) { throw 'Authentication packaging failed' }
} finally {
  $started = Start-Process $expectedJava -ArgumentList $startupArguments -WorkingDirectory "$root\ecom-backend\Ecom-Org-access" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$root\.local\auth-login-methods.log" -RedirectStandardError "$root\.local\auth-login-methods.err"
  Write-Output "Local authentication process started: $($started.Id)"
}
