param([int]$PortBase=22400,[string]$PreparedRun,[string]$BuildLogPrefix)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$dump='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe'
$java="$root\ecom-backend\tools\java\bin\java.exe"
$suffix=[guid]::NewGuid().ToString('N').Substring(0,8)
$run=Join-Path $root ".local\multistore-stack-$suffix"
if($PreparedRun){
  $run=[IO.Path]::GetFullPath($PreparedRun)
  if(!$run.StartsWith("$root\.local\multistore-stack-",[StringComparison]::OrdinalIgnoreCase) -or !(Test-Path "$run\manifest.json")){throw 'Prepared run must be an existing isolated stack directory'}
  $prior=Get-Content "$run\manifest.json" -Raw | ConvertFrom-Json
}
$entries=@();$saved=@{};$proxy=$null
function Sql([string]$query) {
  $value=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute=$query
  if($LASTEXITCODE -ne 0){throw 'Isolated SQL failed'}
  return $value
}
function Identity {if((Sql 'SELECT @@server_uuid') -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated MySQL UUID'}}
function Start-Owned($entry) {
  if(Get-NetTCPConnection -State Listen -LocalPort $entry.port -ErrorAction SilentlyContinue){throw "Occupied port $($entry.port)"}
  $tag=[guid]::NewGuid().ToString('N')
  $entry.process=Start-Process $java -ArgumentList "@`"$($entry.argsFile)`"" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$run\$($entry.module)-$tag.log" -RedirectStandardError "$run\$($entry.module)-$tag.err"
  $deadline=(Get-Date).AddSeconds(240)
  do {
    if($entry.process.HasExited){throw "Exited $($entry.module); inspect $run"}
    try {if((Invoke-RestMethod "http://127.0.0.1:$($entry.port)/actuator/health" -TimeoutSec 10).status -eq 'UP'){return}}catch{}
    Start-Sleep -Seconds 1
  }while((Get-Date) -lt $deadline)
  throw "Health timeout $($entry.module)"
}
function Stop-Owned($entry) {
  if(!$entry.process -or $entry.process.HasExited){return}
  $actual=Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.process.Id)"
  if(!$actual.CommandLine -or !$actual.CommandLine.Contains($entry.argsFile)){throw 'Cannot prove owned process identity'}
  $entry.process.Kill()
  if(!$entry.process.WaitForExit(30000)){throw 'Owned process stop timeout'}
}
Identity
if($PortBase -lt 20000 -or $PortBase -gt 60000){throw 'Use high isolated ports'}
foreach($port in $PortBase..($PortBase+9)){if(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue){throw "Occupied port $port"}}
if(!$PreparedRun){New-Item -ItemType Directory $run | Out-Null}
Start-Transcript "$run\runner.log" -Append | Out-Null
try {
  $modules=@('catalog','cart','inventory','payment','fulfillment','notification','order')
  $sources=@('catalog_service','cart_service','inventory-service','payment_service','fulfillment-service','notification_service','order-service')
  $secret=if($PreparedRun){$prior.secret}else{'qualification-'+[guid]::NewGuid().ToString('N')+('x'*64)}
  $variables=@{JWT_SECRET=$secret;JWT_ISSUER='org-access';ORDER_SYNC_KEY=$secret;INVENTORY_SYNC_KEY=$secret;PAYMENT_SYNC_KEY=$secret;FULFILLMENT_SYNC_KEY=$secret;NOTIFICATION_SENDING_ENABLED='false';KAFKA_BOOTSTRAP_SERVERS='127.0.0.1:1';SPRING_CLOUD_CONFIG_ENABLED='false';EUREKA_CLIENT_ENABLED='false'}
  for($i=0;$i -lt $modules.Count;$i++) {
    $module=$modules[$i]+'-service';$snapshot="$run\$module"
    if($BuildLogPrefix){
      $buildLog="$root\.local\$BuildLogPrefix-$module.log"
      $deadline=(Get-Date).AddMinutes(20)
      while(!(Test-Path $buildLog) -or !(Select-String -Path $buildLog -SimpleMatch 'BUILD SUCCESS' -Quiet)){
        if((Get-Date) -gt $deadline){throw "Waiting for main serial build timed out: $module"}
        Start-Sleep -Seconds 5
      }
    }
    $classes="$root\ecom-backend\$module\target\classes"
    if(!(Test-Path "$classes\com\metaarch\$($modules[$i])")){throw "Compiled classes unavailable: $module. Wait for main agent serial suite; no Maven started."}
    New-Item -ItemType Directory "$snapshot\lib" -Force | Out-Null
    New-Item -ItemType Directory "$snapshot\classes","$snapshot\sync" -Force | Out-Null
    Copy-Item "$classes\*" "$snapshot\classes" -Recurse -Force
    Copy-Item "$root\ecom-backend\http-sync\target\classes\*" "$snapshot\sync" -Recurse -Force
    if($module -ne 'catalog-service' -and !(Test-Path "$snapshot\sync\com\metaarch\sync\PublicApiSecurity.class")){throw 'Shared security class snapshot missing'}
    $jar=Get-ChildItem "$root\ecom-backend\$module\target\*.jar" | Select-Object -First 1
    if(!$jar){$jar=Get-Item "$root\.local\release-checkout-20261010-2302\backend\$module.jar"}
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip=[IO.Compression.ZipFile]::OpenRead($jar.FullName)
    try {foreach($file in $zip.Entries){if($file.FullName.StartsWith('BOOT-INF/lib/') -and $file.Name.EndsWith('.jar') -and !$file.Name.StartsWith('http-sync-')){[IO.Compression.ZipFileExtensions]::ExtractToFile($file,"$snapshot\lib\$($file.Name)",$true)}}}finally{$zip.Dispose()}
    Identity
    $db="qual_${suffix}_$($modules[$i])"
    if($PreparedRun){
      $db=$prior.databases.$module
      if($db -notmatch '^qual_[a-f0-9]{8}_[a-z]+$'){throw 'Unsafe prepared clone name'}
      $entries+=@{module=$module;db=$db;port=($PortBase+$i);argsFile="$snapshot\java.args";process=$null}
      continue
    }
    & $dump --no-defaults --host=127.0.0.1 --port=14306 --user=root --single-transaction --set-gtid-purged=OFF --no-tablespaces --result-file="$run\$module.sql" $sources[$i]
    if($LASTEXITCODE -ne 0){throw "Dump failed $module"}
    Sql "CREATE DATABASE $db CHARACTER SET utf8mb4 COLLATE utf8mb4_bin" | Out-Null
    $import="SOURCE $($run.Replace('\','/'))/$module.sql"
    & $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root $db --execute=$import
    if($LASTEXITCODE -ne 0){throw "Restore failed $module"}
    # Pending restored outbox work must never reach ordinary service ports.
    $entry=@{module=$module;db=$db;port=($PortBase+$i);argsFile="$snapshot\java.args";process=$null}
    $entries+=$entry
  }
  for($i=0;$i -lt $modules.Count;$i++){$variables[$modules[$i].ToUpper()+'_SERVICE_URL']="http://127.0.0.1:$($PortBase+$i)"}
  $variables['INVENTORY_SERVICE_URL']="http://127.0.0.1:$($PortBase+7)"
  foreach($key in $variables.Keys){$saved[$key]=[Environment]::GetEnvironmentVariable($key,'Process');[Environment]::SetEnvironmentVariable($key,$variables[$key],'Process')}
  foreach($entry in $entries) {
    $name=$entry.module.Replace('-service','');$main='com.metaarch.'+$name+'.'+(Get-Culture).TextInfo.ToTitleCase($name)+'ServiceApplication'
    $snapshot=Split-Path $entry.argsFile
    $classpath=if($name -eq 'catalog'){"$snapshot\classes;$snapshot\lib\*"}else{"$snapshot\classes;$snapshot\sync;$snapshot\lib\*"}
    $classpath=$classpath.Replace('\','/')
    $args=@('-Xms32m','-Xmx192m','-cp',"`"$classpath`"",$main,
      "--server.port=$($entry.port)",'--server.address=127.0.0.1','--spring.cloud.config.enabled=false','--eureka.client.enabled=false',
      '--spring.flyway.enabled=true','--spring.jpa.hibernate.ddl-auto=validate','--spring.datasource.username=root','--spring.datasource.password=',
      '--spring.datasource.hikari.maximum-pool-size=3','--spring.datasource.hikari.minimum-idle=0',
      "--spring.datasource.url=jdbc:mysql://127.0.0.1:14306/$($entry.db)?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
      '--checkout.multi-store.enabled=true','--sync.max-attempts=3','--sync.poll-ms=300','--management.endpoints.web.exposure.include=health')
    $args+=@('--debug=false','--logging.level.root=INFO','--logging.level.org.springframework=INFO')
    [IO.File]::WriteAllLines($entry.argsFile,$args,[Text.UTF8Encoding]::new($false))
  }
  Get-ChildItem $run -Recurse -File | Where-Object { $_.Extension -in @('.class','.jar','.args') } | ForEach-Object {
    $hash=Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256
    "$($hash.Hash)  $($_.FullName.Substring($run.Length+1))"
  } | Set-Content "$run\SHA256SUMS"
  $manifest=@{run=$run;ports=@{};databases=@{};mysql=$mysql;secret=$secret}
  foreach($entry in $entries){$manifest.ports[$entry.module]=$entry.port;$manifest.databases[$entry.module]=$entry.db}
  $manifest.ports.proxy=$PortBase+7;$manifest.ports.control=$PortBase+8
  $manifest.ports.orderDrop=$PortBase+9
  $manifest | ConvertTo-Json -Depth 6 | Set-Content "$run\manifest.json" -Encoding UTF8
  $proxy=Start-Process node -ArgumentList @("$PSScriptRoot\MultiStoreQualification.mjs",'proxy',"$run\manifest.json") -WindowStyle Hidden -PassThru -RedirectStandardOutput "$run\proxy.log" -RedirectStandardError "$run\proxy.err"
  foreach($entry in $entries){Start-Owned $entry;Write-Output "HEALTH UP $($entry.module) $($entry.port) clone=$($entry.db)"}
  & node "$PSScriptRoot\MultiStoreQualification.mjs" cases "$run\manifest.json"
  if($LASTEXITCODE -ne 0){throw 'API qualification failed; see cases.json and service logs'}
  Write-Output 'API_CASES_PASS; running owned sender/receiver restart checks'
  foreach($module in @('order-service','inventory-service','payment-service','cart-service')){$entry=$entries | Where-Object module -eq $module;Stop-Owned $entry;Start-Owned $entry}
  & node "$PSScriptRoot\MultiStoreQualification.mjs" verify "$run\manifest.json"
  if($LASTEXITCODE -ne 0){throw 'Restart verification failed'}
  Write-Output "QUALIFIED API/restart cases. Evidence $run. Browser/provider settlement not qualified."
}catch {
  $_.ToString() | Set-Content "$run\BLOCKER.txt"
  throw
}finally {
  foreach($entry in $entries){Stop-Owned $entry}
  if($proxy -and !$proxy.HasExited){$actual=Get-CimInstance Win32_Process -Filter "ProcessId=$($proxy.Id)";if($actual.CommandLine.Contains("$run\manifest.json")){$proxy.Kill();$proxy.WaitForExit(30000) | Out-Null}}
  foreach($key in $saved.Keys){[Environment]::SetEnvironmentVariable($key,$saved[$key],'Process')}
  Write-Output "Retained clones/evidence: $run"
  Stop-Transcript | Out-Null
}
