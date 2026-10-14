param([Parameter(Mandatory=$true)][string]$BackupDirectory)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$identity=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if($LASTEXITCODE -ne 0 -or $identity -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated database'}
$backup=Join-Path $BackupDirectory 'recovered.sql';$evidence=Join-Path $BackupDirectory 'restore-evidence.txt'
if(!(Test-Path $backup) -or !(Test-Path $evidence)){throw 'A successfully restored backup is required'}
$duplicates=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute="SELECT COUNT(*) FROM (SELECT customer_id,store_id FROM cart_service.carts WHERE status='ACTIVE' GROUP BY customer_id,store_id HAVING COUNT(*)>1) AS duplicate_carts"
if($LASTEXITCODE -ne 0 -or [int]$duplicates -ne 0){throw 'Existing duplicate active carts need review before V4 qualification'}
$before=@(& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT HEX(id),total_amount,handling_fee FROM `order-service`.orders ORDER BY id')
$historyLines=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT version,checksum FROM cart_service.flyway_schema_history ORDER BY installed_rank'
if($LASTEXITCODE){throw 'Cart migration history unavailable'}
$history=@($historyLines | ForEach-Object {$parts=$_ -split "`t";@{version=$parts[0];checksum=if($parts[1] -eq 'NULL'){$null}else{[int]$parts[1]}}})
$migration="$root\ecom-backend\cart-service\src\main\resources\db\migration"
$hashes=@{};Get-ChildItem $migration -Filter *.sql | ForEach-Object {$hashes[$_.FullName]=(Get-FileHash $_.FullName).Hash}
$password=[guid]::NewGuid().ToString('N')
& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --execute="CREATE USER IF NOT EXISTS 'cart_runner_qualification'@'localhost' IDENTIFIED BY '$password'; ALTER USER 'cart_runner_qualification'@'localhost' IDENTIFIED BY '$password'; GRANT ALL PRIVILEGES ON cart_service.* TO 'cart_runner_qualification'@'localhost';"
if($LASTEXITCODE){throw 'Isolated migration credentials could not be configured'}
$plan=@{environment='isolated';host='127.0.0.1';port=14306;serverUuid=$identity;database='cart_service';version='8.0.46';user='cart_runner_qualification';sslMode='DISABLED';backupPath=$backup;backupSha256=(Get-FileHash $backup).Hash;restoreEvidencePath=$evidence;restoreEvidenceSha256=(Get-FileHash $evidence).Hash;migrationDirectory=$migration;sourceHashes=$hashes;history=$history;pending=@('4');absentTables=@('cart_write_lock','cart_mutation_requests','cart_checkout_claims')}
$manifest="$root\.local\cart-v4-isolated-manifest.json";$plan | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $manifest
$classpath=(Get-Content "$root\.local\kafka-clone-mysql\classpath.txt" -Raw).Trim()+";$root\ecom-backend\order-service\target\classes"
$oldPassword=$env:MYSQL_PASSWORD
try {
  $env:MYSQL_PASSWORD=$password
  foreach($mode in @('preflight','execute')) {
    & "$root\ecom-backend\tools\java\bin\java.exe" --class-path $classpath "$root\ecom-backend\tools\GuardedMigrate.java" $mode $manifest
    if($LASTEXITCODE){throw "Cart V4 $mode failed; no live target was used"}
  }
} finally {$env:MYSQL_PASSWORD=$oldPassword}
$after=@(& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT HEX(id),total_amount,handling_fee FROM `order-service`.orders ORDER BY id')
if($LASTEXITCODE -ne 0 -or ($before -join "`n") -ne ($after -join "`n")){throw 'Existing order totals changed'}
& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --execute="SELECT version,checksum,success FROM cart_service.flyway_schema_history ORDER BY installed_rank; SELECT table_name,engine FROM information_schema.tables WHERE table_schema='cart_service' AND table_name IN ('cart_write_lock','cart_mutation_requests','cart_checkout_claims');"
if($LASTEXITCODE){throw 'Schema verification failed'}
Write-Output 'Cart V4 isolated migration and existing order totals: PASS'
