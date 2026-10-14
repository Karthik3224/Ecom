import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const mysql='C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe';
const sql=query=>execFileSync(mysql,['--no-defaults','--host=127.0.0.1','--port=14306','--user=root','--batch','--raw','--skip-column-names','--execute='+query],{encoding:'utf8',timeout:30000}).trim();
assert.equal(sql('SELECT @@server_uuid'),'580d1315-c4bf-11f1-bf4b-14cb19888cfa');
const rows=query=>{const value=sql(query);return value?value.split(/\r?\n/).map(line=>JSON.parse(line)):[];};
const inventory=rows("SELECT JSON_OBJECT('id',BIN_TO_UUID(id),'productId',BIN_TO_UUID(product_id),'variantId',BIN_TO_UUID(variant_id),'storeId',store_id,'available',available_quantity,'reserved',reserved_quantity,'status',status) FROM qual_99b106e3_inventory.inventories");
const variants=rows("SELECT JSON_OBJECT('id',BIN_TO_UUID(id),'productId',BIN_TO_UUID(product_id),'sku',sku,'active',active,'price',price) FROM catalog_service.product_variants");
const products=rows("SELECT JSON_OBJECT('id',BIN_TO_UUID(id),'name',name,'status',status) FROM catalog_service.products");
const stores=rows("SELECT JSON_OBJECT('id',id,'name',name,'active',active) FROM catalog_service.stores");
const offers=rows("SELECT JSON_OBJECT('productId',BIN_TO_UUID(product_id),'storeId',store_id,'available',available) FROM catalog_service.store_products");
const repairs=[];const problems=[];
for(const row of inventory){
 const product=products.find(p=>p.id===row.productId),store=stores.find(s=>s.id===row.storeId);
 const active=variants.filter(v=>v.productId===row.productId&&v.active);
 if(!product||!store||row.available<0||row.reserved<0){problems.push({kind:'invalid-inventory',row});continue;}
 if(row.variantId&&!variants.some(v=>v.id===row.variantId&&v.productId===row.productId)){problems.push({kind:'foreign-or-missing-variant',row});continue;}
 if(!row.variantId){
  if(active.length===1&&!inventory.some(other=>other.id!==row.id&&other.storeId===row.storeId&&other.productId===row.productId&&other.variantId===active[0].id)&&row.reserved===0){repairs.push({row,variant:active[0]});}
  else problems.push({kind:'ambiguous-or-held-product-stock',row,activeVariants:active.length});
 }
}
if(process.argv.includes('--repair-variants')){
 const processes=JSON.parse(execFileSync('powershell',['-NoProfile','-Command',"@(Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object {$_.CommandLine -match 'server.port=8095'} | Select-Object -ExpandProperty CommandLine) | ConvertTo-Json -Compress"],{encoding:'utf8'}));
 assert.ok([processes].flat().length===1&&[processes].flat()[0].includes('14306/qual_99b106e3_inventory'),'Only approved restored Inventory service');
 for(const {row,variant} of repairs){
  for(const id of [row.id,row.productId,variant.id])assert.match(id,/^[a-f0-9-]{36}$/i);
  const hex=id=>id.replaceAll('-','');
  const query=`START TRANSACTION; SELECT id FROM qual_99b106e3_inventory.checkout_reservation_lock WHERE id=1 FOR UPDATE;
   UPDATE qual_99b106e3_inventory.inventories i SET i.variant_id=UNHEX('${hex(variant.id)}'),i.variant_key=UNHEX('${hex(variant.id)}'),i.version=i.version+1,i.updated_at=NOW(6)
   WHERE i.id=UNHEX('${hex(row.id)}') AND i.variant_id IS NULL AND i.available_quantity=${row.available} AND i.reserved_quantity=0
   AND NOT EXISTS(SELECT 1 FROM qual_99b106e3_inventory.checkout_reservation_lines l WHERE l.inventory_id=i.id)
   AND (SELECT COUNT(*) FROM catalog_service.product_variants v WHERE v.product_id=i.product_id AND v.active=TRUE)=1
   AND EXISTS(SELECT 1 FROM catalog_service.product_variants v WHERE v.product_id=i.product_id AND v.id=UNHEX('${hex(variant.id)}') AND v.active=TRUE);
   INSERT INTO qual_99b106e3_inventory.stock_movements(id,inventory_id,quantity,movement_type,reason,created_at)
   SELECT UUID_TO_BIN(UUID()),UNHEX('${hex(row.id)}'),0,'ADJUST','Local inventory audit: sole active Catalog variant mapped; quantities unchanged',NOW(6) WHERE ROW_COUNT()=1; COMMIT;`;
  sql(query);
  const after=rows(`SELECT JSON_OBJECT('variantId',BIN_TO_UUID(variant_id),'available',available_quantity,'reserved',reserved_quantity) FROM qual_99b106e3_inventory.inventories WHERE id=UNHEX('${hex(row.id)}')`)[0];
  assert.equal(after.available,row.available);assert.equal(after.reserved,row.reserved);
  if(after.variantId===variant.id)row.variantId=variant.id;else problems.push({kind:'mapping-not-repaired-held-or-changed',row});
 }
}
for(const offer of offers.filter(o=>o.available)){
 const product=products.find(p=>p.id===offer.productId),store=stores.find(s=>s.id===offer.storeId);
 if(!product||!store){problems.push({kind:'invalid-store-offer',offer});continue;}
 for(const variant of variants.filter(v=>v.productId===offer.productId&&v.active)){
  const stock=inventory.find(i=>i.productId===offer.productId&&i.storeId===offer.storeId&&i.variantId===variant.id);
  if(!stock||stock.status!=='ACTIVE'||stock.available<1)problems.push({kind:stock?'out-of-stock-offer':'offer-without-variant-stock',storeId:store.id,storeName:store.name,productId:product.id,productName:product.name,variantId:variant.id,available:stock?.available??null});
 }
}
const report={database:'qual_99b106e3_inventory',catalogReadOnly:'catalog_service',counts:{stores:stores.length,products:products.length,variants:variants.length,offers:offers.length,inventory:inventory.length},variantMappingCandidates:repairs.length,repairRequested:process.argv.includes('--repair-variants'),problems,inventory,quantityPolicy:'No stock added or reset; only unambiguous existing variant metadata repaired'};
writeFileSync('.local/store-inventory-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({counts:report.counts,variantMappingCandidates:repairs.length,repairRequested:report.repairRequested,problemCounts:problems.reduce((counts,p)=>({...counts,[p.kind]:(counts[p.kind]||0)+1}),{})},null,2));
