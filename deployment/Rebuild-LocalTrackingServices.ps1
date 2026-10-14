param([string[]]$Modules=@('http-sync','order-service','fulfillment-service'))
$ErrorActionPreference='Stop'
if(!$Modules.Count -or @($Modules | Where-Object {$_ -notin @('http-sync','order-service','fulfillment-service','Ecom-Org-access')}).Count){throw 'Only approved local modules may be rebuilt'}
$root=Split-Path -Parent $PSScriptRoot
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$identity=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if($LASTEXITCODE -ne 0 -or $identity -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated database'}
$services=@(@('order-service',3311,'qual_99b106e3_order'),@('fulfillment-service',3315,'qual_99b106e3_fulfillment'),@('Ecom-Org-access',3310,'users_roles'))
$restart=@()
foreach($entry in $services | Where-Object {$Modules -contains $_[0]}){
 $process=Get-CimInstance Win32_Process | Where-Object {$_.Name -eq 'java.exe' -and $_.CommandLine -like "*--server.port=$($entry[1])*"}
 if(@($process).Count -ne 1 -or !$process.CommandLine.Contains("14306/$($entry[2])")){throw 'Only approved restored local services may restart'}
 $artifact=if($entry[0] -eq 'Ecom-Org-access'){'org-access'}else{$entry[0]}
 $jar="$root\ecom-backend\$($entry[0])\target\$artifact-0.0.1-SNAPSHOT.jar"
 $backup="$root\.local\tracking-backup-$($entry[0]).jar"
 Copy-Item -LiteralPath $jar -Destination $backup
 $arguments=$process.CommandLine.Substring($process.CommandLine.IndexOf(' -Xms')+1)
 if(!$arguments.StartsWith('-Xms')){throw 'Unexpected local launch arguments'}
 $restart+=@{name=$entry[0];pid=$process.ProcessId;arguments=$arguments;backup=$backup;jar=$jar}
}
$env:JAVA_HOME="$root\ecom-backend\tools\java"
$secret='isolated-qualification-jwt-'+('x'*64)
$env:JWT_SECRET=$secret;$env:JWT_ISSUER='org-access'
foreach($name in @('ORDER','INVENTORY','PAYMENT','FULFILLMENT')){[Environment]::SetEnvironmentVariable($name+'_SYNC_KEY',$secret,'Process')}
$env:ORDER_SERVICE_URL='http://127.0.0.1:3311';$env:ORDERS_SERVICE_URL=$env:ORDER_SERVICE_URL
$env:CATALOG_SERVICE_URL='http://127.0.0.1:8089';$env:CART_SERVICE_URL='http://127.0.0.1:8091'
$env:INVENTORY_SERVICE_URL='http://127.0.0.1:8095';$env:PAYMENT_SERVICE_URL='http://127.0.0.1:3314'
$env:FULFILLMENT_SERVICE_URL='http://127.0.0.1:3315';$env:NOTIFICATION_SERVICE_URL='http://127.0.0.1:3317'
$env:NOTIFICATIONS_SERVICE_URL=$env:NOTIFICATION_SERVICE_URL;$env:ORG_ACCESS_SERVICE_URL='http://127.0.0.1:3310'
$failed=$false
try {
 foreach($entry in $restart){Stop-Process -Id $entry.pid}
 foreach($name in $Modules){
  $goal=if($name -eq 'http-sync'){'install'}else{'package'}
  $ErrorActionPreference='Continue'
  & "$root\ecom-backend\tools\maven\bin\mvn.cmd" -f "$root\ecom-backend\$name\pom.xml" clean $goal *> "$root\.local\tracking-qualified-$name.log"
  $code=$LASTEXITCODE
  $ErrorActionPreference='Stop'
  if($code -ne 0){$failed=$true;throw "Build failed: $name"}
  Write-Output "BUILD SUCCESS $name"
 }
}catch{$failed=$true;Write-Output $_}finally{
 foreach($entry in $restart){
  if($failed){Copy-Item -LiteralPath $entry.backup -Destination $entry.jar -Force}
  $process=Start-Process "$root\ecom-backend\tools\java\bin\java.exe" -ArgumentList $entry.arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput "$root\.local\demo-$($entry.name).log" -RedirectStandardError "$root\.local\demo-$($entry.name).err"
  Write-Output "LOCAL RESTART $($entry.name) PID=$($process.Id)"
 }
}
if($failed){exit 1}
