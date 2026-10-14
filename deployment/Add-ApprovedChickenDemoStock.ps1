$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$db='qual_99b106e3_inventory'
$identity=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if($LASTEXITCODE -ne 0 -or $identity -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated database'}
$processes=@(Get-CimInstance Win32_Process -Filter "Name='java.exe'" | Where-Object {$_.CommandLine -match 'server.port=8095'})
if($processes.Count -ne 1 -or !$processes[0].CommandLine.Contains("14306/$db")){throw 'Running inventory service is not the approved restored clone'}
$product='21000000000000000000000000000018'
$variant='c88eae9dc3cf11f1860d14cb19888cfa'
$stores=@('india-store-1-1','india-store-1-3')
$count=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute="SELECT COUNT(*) FROM $db.inventories WHERE product_id=UNHEX('$product') AND variant_key=UNHEX('$variant') AND store_id IN ('india-store-1-1','india-store-1-3')"
if($LASTEXITCODE -ne 0 -or $count -ne '0'){throw 'Stock already exists or lookup failed; no additional demo stock will be added'}
$statements=@('START TRANSACTION;',"SELECT id FROM $db.checkout_reservation_lock WHERE id=1 FOR UPDATE;")
$audit=@()
foreach($store in $stores){
 $id=[guid]::NewGuid().ToString('N');$movement=[guid]::NewGuid().ToString('N')
 $statements+="INSERT INTO $db.inventories(id,product_id,variant_id,variant_key,store_id,available_quantity,reserved_quantity,reorder_level,status,version,created_at,updated_at) VALUES(UNHEX('$id'),UNHEX('$product'),UNHEX('$variant'),UNHEX('$variant'),'$store',1,0,0,'ACTIVE',0,NOW(6),NOW(6));"
 $statements+="INSERT INTO $db.stock_movements(id,inventory_id,quantity,movement_type,reason,created_at) VALUES(UNHEX('$movement'),UNHEX('$id'),1,'INCREASE','User-approved local client demo fixture: exactly one Chicken unit per store, 2026-10-12',NOW(6));"
 $audit+=@{storeId=$store;inventoryId=$id;quantity=1;database=$db;movementId=$movement}
}
$statements+='COMMIT;'
$sql=$statements -join ' '
& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --execute=$sql
if($LASTEXITCODE -ne 0){throw 'Approved demo inventory transaction failed'}
$audit | ConvertTo-Json | Set-Content "$root\.local\approved-chicken-demo-stock.json"
& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --execute="SELECT store_id,available_quantity,reserved_quantity,status FROM $db.inventories WHERE product_id=UNHEX('$product') AND variant_key=UNHEX('$variant') AND store_id IN ('india-store-1-1','india-store-1-3')"
