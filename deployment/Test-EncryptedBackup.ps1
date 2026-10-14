param([string]$RunId=(Get-Date -Format 'yyyyMMdd-HHmmss'))
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$mysqldump='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe'
$mysqld='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe'
$admin='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqladmin.exe'
$java="$root\ecom-backend\tools\java\bin\java.exe"
$sourceUuid=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if($LASTEXITCODE -ne 0 -or $sourceUuid -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated backup source'}
$backup=Join-Path $env:USERPROFILE "EcomMigrationBackups\encrypted-test-$RunId"
$keys=Join-Path $env:USERPROFILE "EcomBackupKeys\test-$RunId"
if((Test-Path $backup) -or (Test-Path $keys)){throw 'Never overwrite backups or keys'}
if(Get-NetTCPConnection -State Listen -LocalPort 15306 -ErrorAction SilentlyContinue){throw 'Restore test port occupied'}
$schemas=@('users_roles','customer_profiles','catalog_service','inventory-service','cart_service','order-service','payment_service','fulfillment-service','notification_service')
function RestrictedDirectory($path) {
  New-Item -ItemType Directory -Path $path -ErrorAction Stop | Out-Null
  $acl=New-Object Security.AccessControl.DirectorySecurity
  $acl.SetAccessRuleProtection($true,$false)
  foreach($identity in @([Security.Principal.WindowsIdentity]::GetCurrent().Name,'NT AUTHORITY\SYSTEM','BUILTIN\Administrators')){
    $acl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($identity,'FullControl','ContainerInherit,ObjectInherit','None','Allow')))
  }
  Set-Acl -LiteralPath $path -AclObject $acl
}
RestrictedDirectory $backup;RestrictedDirectory $keys
$plain=Join-Path $backup 'isolated-nine-schema.sql';$encrypted=Join-Path $backup 'isolated-nine-schema.aesgcm';$key=Join-Path $keys 'recovery.key';$recovered=Join-Path $backup 'recovered.sql'
& $mysqldump --no-defaults --host=127.0.0.1 --port=14306 --user=root --single-transaction --routines --triggers --events --hex-blob --set-gtid-purged=OFF --result-file=$plain --databases @schemas
if($LASTEXITCODE -ne 0){throw 'Isolated backup failed'}
& $java "$PSScriptRoot\BackupCipher.java" keygen $key;if($LASTEXITCODE){throw 'Key creation failed'}
& $java "$PSScriptRoot\BackupCipher.java" encrypt $plain $encrypted $key;if($LASTEXITCODE){throw 'Encryption failed'}
& $java "$PSScriptRoot\BackupCipher.java" decrypt $encrypted $recovered $key;if($LASTEXITCODE){throw 'Authenticated recovery failed'}
$plainHash=(Get-FileHash $plain).Hash;$encryptedHash=(Get-FileHash $encrypted).Hash
if($plainHash -ne (Get-FileHash $recovered).Hash){throw 'Recovered backup integrity mismatch'}
# Verify wrong-key authentication without leaving any accepted plaintext output.
$wrongKey=Join-Path $keys 'wrong-test.key';$wrongOutput=Join-Path $backup 'wrong-key-output.sql'
& $java "$PSScriptRoot\BackupCipher.java" keygen $wrongKey;if($LASTEXITCODE){throw 'Negative-case key creation failed'}
$old=$ErrorActionPreference
try{$ErrorActionPreference='Continue';& $java "$PSScriptRoot\BackupCipher.java" decrypt $encrypted $wrongOutput $wrongKey 2> "$backup\wrong-key.log";$code=$LASTEXITCODE}finally{$ErrorActionPreference=$old}
if($code -eq 0 -or (Test-Path $wrongOutput)){throw 'Wrong key was accepted or left a plaintext output'}
$data=Join-Path $backup 'restore-data';New-Item -ItemType Directory -Path $data | Out-Null
& $mysqld --no-defaults '--basedir=C:\Program Files\MySQL\MySQL Server 8.0' "--datadir=$data" --initialize-insecure *> "$backup\initialize.log"
if($LASTEXITCODE){throw 'Fresh isolated MySQL initialization failed'}
$process=$null;$restoreUuid=$null
try {
  $process=Start-Process $mysqld -ArgumentList @('--no-defaults','--basedir="C:\Program Files\MySQL\MySQL Server 8.0"',"--datadir=`"$data`"",'--port=15306','--bind-address=127.0.0.1','--mysqlx=OFF','--event-scheduler=OFF','--skip-log-bin',"--log-error=`"$backup\restore-server.log`"") -WindowStyle Hidden -PassThru
  $deadline=(Get-Date).AddSeconds(60)
  do {
    Start-Sleep -Seconds 2
    $restoreUuid=& $mysql --no-defaults --host=127.0.0.1 --port=15306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid' 2>$null
  }while($LASTEXITCODE -ne 0 -and (Get-Date) -lt $deadline)
  $fileUuid=((Get-Content "$data\auto.cnf" | Where-Object {$_ -like 'server-uuid=*'}) -split '=')[1]
  if($LASTEXITCODE -ne 0 -or $restoreUuid -ne $fileUuid -or $restoreUuid -eq $sourceUuid -or $restoreUuid -eq 'ec5657ba-b18a-11f1-8089-14cb19888cfa'){throw 'Restore target not positively identified'}
  & $mysql --no-defaults --host=127.0.0.1 --port=15306 --user=root --execute="source $($recovered.Replace('\','/'))"
  if($LASTEXITCODE){throw 'Isolated restore failed'}
  $checks=New-Object System.Collections.Generic.List[string]
  foreach($schema in $schemas) {
    $tables=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute="SELECT table_name FROM information_schema.tables WHERE table_schema='$schema' AND table_type='BASE TABLE' ORDER BY table_name"
    if($LASTEXITCODE){throw 'Source schema verification failed'}
    $restoredTables=& $mysql --no-defaults --host=127.0.0.1 --port=15306 --user=root --batch --skip-column-names --execute="SELECT table_name FROM information_schema.tables WHERE table_schema='$schema' AND table_type='BASE TABLE' ORDER BY table_name"
    if($LASTEXITCODE -ne 0 -or ($tables -join ',') -ne ($restoredTables -join ',')){throw "Restored table list mismatch: $schema"}
    foreach($table in $tables) {
      $query="SELECT COUNT(*) FROM ``$schema``.``$table``"
      $before=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute=$query
      $after=& $mysql --no-defaults --host=127.0.0.1 --port=15306 --user=root --batch --skip-column-names --execute=$query
      if($LASTEXITCODE -ne 0 -or $before -ne $after){throw "Restored count mismatch: $schema.$table"}
    }
    $checks.Add("$schema tables=$(@($tables).Count) counts=PASS")
  }
  $query='SELECT HEX(id),total_amount,handling_fee FROM `order-service`.orders ORDER BY id'
  $before=@(& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute=$query)
  $after=@(& $mysql --no-defaults --host=127.0.0.1 --port=15306 --user=root --batch --skip-column-names --execute=$query)
  if($LASTEXITCODE -ne 0 -or ($before -join "`n") -ne ($after -join "`n")){throw 'Restored order totals mismatch'}
  $report=@("Timestamp UTC=$([DateTime]::UtcNow.ToString('o'))","Source UUID=$sourceUuid port=14306","Restore UUID=$restoreUuid port=15306","Plain SHA256=$plainHash","Encrypted SHA256=$encryptedHash","AES-256-GCM recovery=PASS wrong-key rejection=PASS","Key stored separately; restricted ACL=owner/System/Administrators","MySQL version=8.0.46",$checks,"Order IDs/totals/handling fees=PASS count=$($before.Count)","Off-machine retention=NOT VERIFIED; destination not configured")
  $report | Set-Content -LiteralPath "$backup\restore-evidence.txt"
  $report | Set-Content -LiteralPath "$root\.local\encrypted-backup-current.txt"
  Write-Output "Encrypted nine-schema restore: PASS; evidence $backup\restore-evidence.txt"
} finally {
  if($process -and !$process.HasExited -and $restoreUuid) {
    $current=& $mysql --no-defaults --host=127.0.0.1 --port=15306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
    if($LASTEXITCODE -eq 0 -and $current -eq $restoreUuid){& $admin --no-defaults --host=127.0.0.1 --port=15306 --user=root shutdown}
  }
}
