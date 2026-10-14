param([Parameter(Mandatory=$true)][string]$Release,[switch]$BrowserQualification,[switch]$DemoOnly)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$releasePath=[IO.Path]::GetFullPath($Release)
if(!$releasePath.StartsWith("$root\.local\",[StringComparison]::OrdinalIgnoreCase)){throw 'Isolated release must be inside .local'}
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$uuid=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if($LASTEXITCODE -ne 0 -or $uuid -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated database'}
foreach($line in Get-Content "$releasePath\SHA256SUMS") {
  $parts=$line -split '  ',2
  $path=[IO.Path]::GetFullPath((Join-Path $releasePath $parts[1]))
  if(!$path.StartsWith("$releasePath\",[StringComparison]::OrdinalIgnoreCase) -or (Get-FileHash $path).Hash -ne $parts[0]){throw 'Pinned artifact mismatch'}
}
$services=@(
 @('Ecom-eureka-server','',18761),@('Ecom-config-server','',18888),
 @('Ecom-Org-access','users_roles',13310),@('customer-profile-service','customer_profiles',18088),
 @('catalog-service','catalog_service',18089),@('inventory-service','inventory-service',18095),
 @('cart-service','cart_service',18091),@('notification-service','notification_service',13317),
 @('fulfillment-service','fulfillment-service',13315),@('payment-service','payment_service',13314),
 @('order-service','order-service',13311),@('Ecom-api-gateway','',18082))
foreach($service in $services) {
  if(Get-NetTCPConnection -State Listen -LocalPort $service[2] -ErrorAction SilentlyContinue){throw "Test port occupied: $($service[2])"}
}
$log=Join-Path $releasePath 'qualification'
if(Test-Path $log){throw 'Use a fresh release staging directory for each qualification run'}
New-Item -ItemType Directory -Path $log -ErrorAction Stop | Out-Null
$variables=@{JWT_SECRET=('isolated-qualification-jwt-' + ('x'*64));JWT_ISSUER='org-access';
 ORDER_SYNC_KEY=('isolated-order-'+('x'*48));PAYMENT_SYNC_KEY=('isolated-payment-'+('y'*48));FULFILLMENT_SYNC_KEY=('isolated-fulfillment-'+('z'*48));
 ORDER_SERVICE_URL='http://127.0.0.1:13311';ORDERS_SERVICE_URL='http://127.0.0.1:13311';PAYMENT_SERVICE_URL='http://127.0.0.1:13314';
 FULFILLMENT_SERVICE_URL='http://127.0.0.1:13315';NOTIFICATION_SERVICE_URL='http://127.0.0.1:13317';NOTIFICATIONS_SERVICE_URL='http://127.0.0.1:13317';
 CATALOG_SERVICE_URL='http://127.0.0.1:18089';CART_SERVICE_URL='http://127.0.0.1:18091';ORG_ACCESS_SERVICE_URL='http://127.0.0.1:13310';
 MYSQL_HOST='127.0.0.1';MYSQL_PORT='14306';MYSQL_USERNAME='root';MYSQL_PASSWORD='';
 NOTIFICATION_SENDING_ENABLED='false';KAFKA_BOOTSTRAP_SERVERS='127.0.0.1:1';
 SPRING_CLOUD_CONFIG_ENABLED='false';EUREKA_CLIENT_ENABLED='false';SPRING_FLYWAY_ENABLED='false';SPRING_JPA_HIBERNATE_DDL_AUTO='validate'}
$saved=@{};$started=New-Object System.Collections.Generic.List[object]
function Wait-Healthy($service,$process) {
  $deadline=(Get-Date).AddSeconds(150)
  do {
    if($process.HasExited){throw "Exited: $($service[0]); inspect qualification log"}
    try {if((Invoke-RestMethod "http://127.0.0.1:$($service[2])/actuator/health" -TimeoutSec 3).status -eq 'UP'){return}} catch {}
    Start-Sleep -Seconds 2
  } while((Get-Date) -lt $deadline)
  throw "Unhealthy: $($service[0])"
}
function Stop-TestService($entry) {
  $process=$entry.Process
  if($process.HasExited){return}
  $current=Get-CimInstance Win32_Process -Filter "ProcessId=$($process.Id)"
  if(!$current.CommandLine -or !$current.CommandLine.Contains($entry.Jar)){throw 'Test process identity could not be proven'}
  Stop-Process -Id $process.Id -ErrorAction Stop
  if(!$process.WaitForExit(15000)){throw 'Test process did not stop'}
}
function Restart-TestService($entry) {
  Stop-TestService $entry
  $name=$entry.Service[0]
  $suffix=[guid]::NewGuid().ToString('N')
  $entry.Process=Start-Process "$root\ecom-backend\tools\java\bin\java.exe" -ArgumentList $entry.Arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput "$log\$name-restart-$suffix.log" -RedirectStandardError "$log\$name-restart-$suffix.err"
  Wait-Healthy $entry.Service $entry.Process
}
try {
  foreach($key in $variables.Keys){$saved[$key]=[Environment]::GetEnvironmentVariable($key,'Process');[Environment]::SetEnvironmentVariable($key,$variables[$key],'Process')}
  foreach($service in $services) {
    $name=$service[0];$jar=Join-Path $releasePath "backend\$name.jar"
    $arguments=@('-Xms32m','-Xmx192m','-jar',$jar,"--server.port=$($service[2])",'--server.address=127.0.0.1',
      '--spring.cloud.config.enabled=false','--eureka.client.enabled=false','--spring.flyway.enabled=false','--spring.jpa.hibernate.ddl-auto=validate',
      '--management.endpoints.web.exposure.include=health','--spring.datasource.username=root','--spring.datasource.password=')
    if($name -eq 'Ecom-eureka-server'){
      $arguments=@($arguments | Where-Object {$_ -ne '--eureka.client.enabled=false'})
      $arguments+='--eureka.client.enabled=true'
    }
    if($service[1]){$arguments+="--spring.datasource.url=jdbc:mysql://127.0.0.1:14306/$($service[1])?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"}
    $process=Start-Process "$root\ecom-backend\tools\java\bin\java.exe" -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput "$log\$name.log" -RedirectStandardError "$log\$name.err"
    $started.Add(@{Process=$process;Jar=$jar;Arguments=$arguments;Service=$service})
    Wait-Healthy $service $process
    Write-Output "$name port=$($service[2]) HEALTH UP"
  }
  foreach($path in @('products?status=ACTIVE','stores','categories')) {
    $response=Invoke-WebRequest "http://127.0.0.1:18089/api/v1/$path" -UseBasicParsing -TimeoutSec 10
    if($response.StatusCode -ne 200){throw "Catalog probe failed: $path"}
    Write-Output "Catalog $path HTTP 200"
  }
  $capabilities=Invoke-RestMethod 'http://127.0.0.1:13314/api/v1/payments/capabilities' -TimeoutSec 10
  if($capabilities.processingEnabled -ne $false){throw 'Real payments unexpectedly enabled'}
  Write-Output 'Payment capabilities disabled: PASS'
  if (!$DemoOnly) {
    . "$PSScriptRoot\Test-IsolatedWorkflows.ps1"
    Test-IsolatedWorkflows
    Write-Output 'Complete 12-service startup and scoped API/restart workflows: PASS. Provider settlement remains disabled.'
  }
  if ($BrowserQualification) {
    if(Get-NetTCPConnection -State Listen -LocalPort 5184 -ErrorAction SilentlyContinue){throw 'Isolated frontend port occupied'}
    $env:ECOM_ISOLATED_TEST='true'
    foreach($setting in @('VITE_ORG_ACCESS_URL','VITE_CUSTOMER_PROFILE_URL','VITE_CATALOG_URL','VITE_CART_URL','VITE_ORDER_URL','VITE_PAYMENT_URL')) {
      if([Environment]::GetEnvironmentVariable($setting)){throw "Unset API overrides before isolated browser qualification: $setting"}
    }
    $frontend=Start-Process node -ArgumentList @("$root\ecom-frontend\node_modules\vite\bin\vite.js",'--host','127.0.0.1','--port','5184','--strictPort') -WorkingDirectory "$root\ecom-frontend" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$log\frontend.log" -RedirectStandardError "$log\frontend.err"
    try {
      Write-Output "Browser qualification: http://127.0.0.1:5184/login; complete by creating $log\browser.done"
      $deadline=if($DemoOnly){(Get-Date).AddDays(1)}else{(Get-Date).AddMinutes(8)}
      while(!(Test-Path "$log\browser.done") -and (Get-Date) -lt $deadline) {
        if($frontend.HasExited){throw 'Isolated frontend exited'}
        Start-Sleep -Seconds 2
      }
      if(!(Test-Path "$log\browser.done")){throw 'Browser qualification timed out; NOT VERIFIED'}
    } finally {
      if(!$frontend.HasExited){Stop-Process -Id $frontend.Id}
      Remove-Item Env:ECOM_ISOLATED_TEST -ErrorAction SilentlyContinue
    }
  }
} finally {
  for($index=$started.Count-1;$index -ge 0;$index--) {
    $entry=$started[$index]
    $process=$entry.Process
    if(!$process.HasExited) {
      $current=Get-CimInstance Win32_Process -Filter "ProcessId=$($process.Id)"
      if($current.CommandLine -and $current.CommandLine.Contains($entry.Jar)){Stop-Process -Id $process.Id -ErrorAction Continue}
    }
  }
  foreach($key in $saved.Keys){[Environment]::SetEnvironmentVariable($key,$saved[$key],'Process')}
}
