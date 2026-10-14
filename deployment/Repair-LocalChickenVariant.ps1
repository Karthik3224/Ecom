$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$mysql='C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
$db='qual_99b106e3_inventory'
$identity=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute='SELECT @@server_uuid'
if($LASTEXITCODE -ne 0 -or $identity -ne '580d1315-c4bf-11f1-bf4b-14cb19888cfa'){throw 'Wrong isolated database'}
$running=@(Get-CimInstance Win32_Process -Filter "Name='java.exe'" | Where-Object {$_.CommandLine -match 'server.port=8095'})
if($running.Count -ne 1 -or !$running[0].CommandLine.Contains("14306/$db")){throw 'Wrong Inventory service target'}
$product='21000000-0000-0000-0000-000000000018'
$variant='c88eae9d-c3cf-11f1-860d-14cb19888cfa'
$catalog=Invoke-RestMethod "http://localhost:5184/catalog/api/v1/products/$product" -TimeoutSec 15
$active=@($catalog.variants | Where-Object {$_.active})
if($active.Count -ne 1 -or $active[0].id -ne $variant -or $active[0].sku -ne 'NV-CHICKEN-CURRY-500G'){throw 'Catalog does not uniquely establish this variant'}
$p=$product.Replace('-','');$v=$variant.Replace('-','')
$before=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute="SELECT HEX(id),available_quantity,reserved_quantity FROM $db.inventories WHERE product_id=UNHEX('$p') AND variant_id IS NULL AND store_id='store-gachibowli'"
if($LASTEXITCODE -ne 0 -or @($before).Count -ne 1){throw 'Exactly one existing unassigned row required'}
$fields=$before -split "`t"
if($fields.Count -ne 3 -or $fields[1] -ne '40' -or $fields[2] -ne '0'){throw 'Existing quantities changed; aborting correction'}
$id=$fields[0];$audit=[guid]::NewGuid().ToString('N')
$sql=@('START TRANSACTION;',"SELECT id FROM $db.checkout_reservation_lock WHERE id=1 FOR UPDATE;",
 "UPDATE $db.inventories SET variant_id=UNHEX('$v'),variant_key=UNHEX('$v'),version=version+1,updated_at=NOW(6) WHERE id=UNHEX('$id') AND variant_id IS NULL AND available_quantity=40 AND reserved_quantity=0 AND NOT EXISTS(SELECT 1 FROM $db.checkout_reservation_lines WHERE inventory_id=UNHEX('$id'));",
 "INSERT INTO $db.stock_movements(id,inventory_id,quantity,movement_type,reason,created_at) SELECT UNHEX('$audit'),UNHEX('$id'),0,'ADJUST','Local metadata repair: assign sole Catalog Chicken 500g variant; available 40 and reserved 0 unchanged',NOW(6) WHERE ROW_COUNT()=1;",'COMMIT;') -join ' '
& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --execute=$sql
if($LASTEXITCODE -ne 0){throw 'Correction transaction failed'}
$after=& $mysql --no-defaults --host=127.0.0.1 --port=14306 --user=root --batch --skip-column-names --execute="SELECT HEX(id),available_quantity,reserved_quantity,BIN_TO_UUID(variant_id) FROM $db.inventories WHERE id=UNHEX('$id')"
if($LASTEXITCODE -ne 0 -or $after -ne "$id`t40`t0`t$variant"){throw 'Correction not verified; do not retry blindly'}
@{database=$db;store='store-gachibowli';productId=$product;variantId=$variant;inventoryId=$id;availableBefore=40;availableAfter=40;reservedBefore=0;reservedAfter=0;movementId=$audit;reason='Sole active Catalog variant mapped; no quantity added'} | ConvertTo-Json | Set-Content "$root\.local\chicken-variant-correction.json"
Write-Output 'PASS existing local Gachibowli Chicken stock mapped to sole Catalog variant: 40 available, 0 reserved; quantities unchanged'
