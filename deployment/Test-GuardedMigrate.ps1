$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$identity=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid;'
if($LASTEXITCODE -ne 0 -or $identity -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated database'}
$testPassword=[guid]::NewGuid().ToString('N')
& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --execute="CREATE USER IF NOT EXISTS 'runner_qualification'@'localhost' IDENTIFIED BY '$testPassword'; ALTER USER 'runner_qualification'@'localhost' IDENTIFIED BY '$testPassword'; GRANT ALL PRIVILEGES ON ``order-service``.* TO 'runner_qualification'@'localhost';"
if($LASTEXITCODE -ne 0){throw 'Isolated account setup failed'}
$historyLines=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT version,checksum FROM `order-service`.flyway_schema_history ORDER BY installed_rank;'
if($LASTEXITCODE -ne 0){throw 'History read failed'}
$history=@($historyLines | ForEach-Object { $parts=$_ -split "`t"; @{version=$parts[0];checksum=if($parts[1] -eq 'NULL'){$null}else{[int]$parts[1]}} })
$backup='C:\Users\Admin\EcomMigrationBackups\nine-schema-20261010-qualification.sql'
$evidence="$root\KAFKA-NINE-SCHEMA-QUALIFICATION.md"
$sourceHashes=@{}
foreach($file in Get-ChildItem "$root\ecom-backend\order-service\src\main\resources\db\migration\*.sql"){$sourceHashes[$file.FullName]=(Get-FileHash $file.FullName).Hash}
$javaMigration="$root\ecom-backend\order-service\src\main\java\db\migration\V10__add_order_handling_fee.java"
$sourceHashes[$javaMigration]=(Get-FileHash $javaMigration).Hash
$plan=@{environment='isolated';host='127.0.0.1';port=14306;serverUuid=$identity;database='order-service';version='8.0.46';user='runner_qualification';sslMode='DISABLED';backupPath=$backup;backupSha256=(Get-FileHash $backup).Hash;restoreEvidencePath=$evidence;restoreEvidenceSha256=(Get-FileHash $evidence).Hash;migrationDirectory="$root\ecom-backend\order-service\src\main\resources\db\migration";sourceHashes=$sourceHashes;history=$history;pending=@();absentTables=@()}
$classpath=(Get-Content "$root\.local\kafka-clone-mysql\classpath.txt" -Raw).Trim()+";$root\ecom-backend\order-service\target\classes"
$env:MYSQL_PASSWORD=$testPassword
$cases=@('preflight','repeat','wrong-port','wrong-identity','missing-backup','backup-mismatch','evidence-mismatch','source-mismatch','history-mismatch','partial-schema','unexpected-pending')
$reasons=@{
 'wrong-port'='Live target rejected for isolation'; 'wrong-identity'='Database identity mismatch'
 'missing-backup'='NoSuchFileException'; 'backup-mismatch'='backup integrity mismatch'
 'evidence-mismatch'='restoreEvidence integrity mismatch'; 'source-mismatch'='Migration source mismatch'
 'history-mismatch'='History checksum mismatch'; 'partial-schema'='Unexpected/partial schema state'
 'unexpected-pending'='Unexpected pending migrations'
}
try {
  foreach($case in $cases){
    $candidate=$plan.Clone();$mode='preflight'
    switch($case){
      'repeat' {$mode='execute'}
      'wrong-port' {$candidate.port=3306}
      'wrong-identity' {$candidate.serverUuid=[guid]::NewGuid().ToString()}
      'missing-backup' {$candidate.backupPath="$root\.local\nonexistent-backup.sql"}
      'backup-mismatch' {$candidate.backupSha256='0'*64}
      'evidence-mismatch' {$candidate.restoreEvidenceSha256='0'*64}
      'source-mismatch' {$candidate.sourceHashes=@{$javaMigration=('0'*64)}}
      'history-mismatch' {$candidate.history=@($history | ForEach-Object { $_.Clone() });$candidate.history[0].checksum=0}
      'partial-schema' {$candidate.pending=@('13');$candidate.absentTables=@('sync_outbox')}
      'unexpected-pending' {$candidate.pending=@('13');$candidate.absentTables=@('nonexistent_qualification_table')}
    }
    $manifest="$root\.local\guarded-$case.json"
    $candidate | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath $manifest
    $previousPreference=$ErrorActionPreference
    try {
      $ErrorActionPreference='Continue'
      & "$root\ecom-backend\tools\java\bin\java.exe" --class-path $classpath "$root\ecom-backend\tools\GuardedMigrate.java" $mode $manifest *> "$root\.local\guarded-$case.log"
      $exitCode=$LASTEXITCODE
    } finally { $ErrorActionPreference=$previousPreference }
    $expectedSuccess=$case -in @('preflight','repeat')
    $output=Get-Content "$root\.local\guarded-$case.log" -Raw
    if(($exitCode -eq 0) -ne $expectedSuccess){throw "Unexpected exit code $exitCode : $case"}
    if(!$expectedSuccess -and !$output.Contains($reasons[$case])){throw "Wrong rejection reason: $case"}
    if($case -eq 'repeat' -and !$output.Contains('applied=0')){throw 'Repeated execution was not a no-op'}
    Write-Output "$case PASS"
  }
} finally {Remove-Item Env:MYSQL_PASSWORD -ErrorAction SilentlyContinue}
exit 0
