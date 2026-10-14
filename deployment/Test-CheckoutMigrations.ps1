$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$dump='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe'
$identity=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if($LASTEXITCODE -ne 0 -or $identity -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated server'}
$suffix=[guid]::NewGuid().ToString('N').Substring(0,8)
$directory=Join-Path $root ".local\multistore-migrations-$suffix"
New-Item -ItemType Directory -Path $directory | Out-Null
$libraries=(Get-Content "$root\.local\kafka-clone-mysql\classpath.txt" -Raw).Trim()
$OutputEncoding=[System.Text.UTF8Encoding]::new($false)
foreach($module in @('order','inventory')) {
  $source="$module-service"
  $target="multistore_${module}_$suffix"
  $history=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute="SELECT version,checksum,success FROM ``$source``.flyway_schema_history ORDER BY installed_rank"
  if($LASTEXITCODE -ne 0){throw "History read failed: $source"}
  $history | Set-Content -Encoding UTF8 -LiteralPath "$directory\$module-history-before.txt"
  & $dump --no-defaults --host=127.0.0.1 --port=14306 --user=root --single-transaction --set-gtid-purged=OFF --no-tablespaces --result-file="$directory\$module-restored-source.sql" $source
  if($LASTEXITCODE -ne 0){throw "Dump failed: $source"}
  & $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --execute="CREATE DATABASE ``$target`` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin"
  if($LASTEXITCODE -ne 0){throw 'Test database creation failed'}
  Get-Content -Raw -LiteralPath "$directory\$module-restored-source.sql" | & $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root $target
  if($LASTEXITCODE -ne 0){throw 'Isolated restore failed'}
  $classpath="$root\ecom-backend\$source\target\classes;$libraries"
  & "$root\ecom-backend\tools\java\bin\java.exe" --class-path $classpath "$PSScriptRoot\TestCheckoutMigration.java" $target $module
  if($LASTEXITCODE -ne 0){throw "Migration qualification failed: $target"}
  Write-Output "Evidence $directory; retained isolated database $target"
}
