param([string]$Evidence='C:\ecom-final\.local\multistore-stack-99b106e3\manifest.json')
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$manifest=Get-Content -LiteralPath $Evidence -Raw | ConvertFrom-Json
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$identity=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if($LASTEXITCODE -ne 0 -or $identity -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated database'}
$secret='isolated-qualification-jwt-'+('x'*64)
$env:JWT_SECRET=$secret;$env:JWT_ISSUER='org-access'
foreach($name in @('ORDER','INVENTORY','PAYMENT','FULFILLMENT')){[Environment]::SetEnvironmentVariable($name+'_SYNC_KEY',$secret,'Process')}
$env:ORDER_SERVICE_URL='http://127.0.0.1:3311';$env:ORDERS_SERVICE_URL=$env:ORDER_SERVICE_URL
$env:CATALOG_SERVICE_URL='http://127.0.0.1:8089';$env:CART_SERVICE_URL='http://127.0.0.1:8091'
$env:INVENTORY_SERVICE_URL='http://127.0.0.1:8095';$env:PAYMENT_SERVICE_URL='http://127.0.0.1:3314'
$env:FULFILLMENT_SERVICE_URL='http://127.0.0.1:3315';$env:NOTIFICATION_SERVICE_URL='http://127.0.0.1:3317'
$env:NOTIFICATIONS_SERVICE_URL=$env:NOTIFICATION_SERVICE_URL;$env:ORG_ACCESS_SERVICE_URL='http://127.0.0.1:3310'
$env:NOTIFICATION_SENDING_ENABLED='false'
$entries=@(@('cart-service',8091),@('inventory-service',8095),@('payment-service',3314),@('fulfillment-service',3315),@('notification-service',3317),@('order-service',3311))
$owned=@()
try {
 foreach($entry in $entries){
  $name=$entry[0];$port=$entry[1];$db=$manifest.databases.$name
  if($db -notmatch '^qual_[a-f0-9]{8}_[a-z]+$'){throw 'Only qualified restored schemas are permitted'}
  $probe=[Net.Sockets.TcpClient]::new()
  try {$probe.Connect('127.0.0.1',$port);throw "Port $port is occupied; existing service will not be restarted"}catch [Net.Sockets.SocketException] {}finally{$probe.Dispose()}
  $jar=Get-ChildItem "$root\ecom-backend\$name\target" -Filter '*.jar' | Select-Object -First 1
  if(!$jar){throw "Built artifact missing for $name"}
  $args=@('-Xms32m','-Xmx192m','-jar',$jar.FullName,"--server.port=$port",'--server.address=127.0.0.1','--spring.cloud.config.enabled=false','--eureka.client.enabled=false','--spring.flyway.enabled=false','--spring.jpa.hibernate.ddl-auto=validate','--spring.datasource.username=root','--spring.datasource.password=',"--spring.datasource.url=jdbc:mysql://127.0.0.1:14306/$db`?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true",'--checkout.multi-store.enabled=true')
  $process=Start-Process "$root\ecom-backend\tools\java\bin\java.exe" -ArgumentList $args -WindowStyle Hidden -PassThru -RedirectStandardOutput "$root\.local\demo-$name.log" -RedirectStandardError "$root\.local\demo-$name.err"
  $owned+=@{name=$name;port=$port;database=$db;pid=$process.Id;process=$process}
 }
 foreach($entry in $owned){
  $deadline=(Get-Date).AddSeconds(180);$ready=$false
  do {if($entry.process.HasExited){throw "$($entry.name) exited"};try{if((Invoke-RestMethod "http://127.0.0.1:$($entry.port)/actuator/health" -TimeoutSec 3).status -eq 'UP'){$ready=$true;break}}catch{};Start-Sleep -Seconds 2}while((Get-Date) -lt $deadline)
  if(!$ready){throw "$($entry.name) did not become healthy"}
  Write-Output "UP $($entry.name) port=$($entry.port) restored=$($entry.database)"
 }
 if((Invoke-RestMethod 'http://127.0.0.1:3314/api/v1/payments/capabilities').processingEnabled){throw 'Real payments must remain disabled'}
 $owned | Select-Object name,port,database,pid | ConvertTo-Json | Set-Content "$root\.local\checkout-demo-services.json"
 Write-Output 'LOCAL_CHECKOUT_SERVICES_READY; real payment processing disabled; no migrations performed'
}catch{
 foreach($entry in $owned){if(!$entry.process.HasExited){$current=Get-CimInstance Win32_Process -Filter "ProcessId=$($entry.pid)";if($current.CommandLine.Contains($entry.database)){$entry.process.Kill()}}}
 throw
}
