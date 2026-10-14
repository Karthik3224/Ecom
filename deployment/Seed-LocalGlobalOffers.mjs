import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const mysql = 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe';
const sql = query => execFileSync(mysql, ['--no-defaults', '--host=127.0.0.1', '--port=14306', '--user=root', '--batch', '--skip-column-names', `--execute=${query}`], { encoding: 'utf8' }).trim();
assert.equal(sql('SELECT @@server_uuid'), '580d1315-c4bf-11f1-bf4b-14cb19888cfa');
assert.equal(sql("SELECT COUNT(*) FROM catalog_service.stores WHERE id='global-store' AND active=TRUE"), '1');
sql(`START TRANSACTION;
INSERT INTO catalog_service.store_products (id,created_at,updated_at,available,price_override,store_id,store_name,product_id)
SELECT UUID_TO_BIN(UUID()),NOW(6),NOW(6),TRUE,NULL,'global-store','India-wide Global Store',p.id
FROM catalog_service.products p JOIN catalog_service.categories c ON c.id=p.category_id
WHERE p.status='ACTIVE' AND (p.global_product=TRUE OR LOWER(COALESCE(p.fulfillment_type,''))='global' OR LOWER(c.name) LIKE '%dry fruit%')
AND NOT EXISTS (SELECT 1 FROM catalog_service.store_products sp WHERE sp.product_id=p.id AND sp.store_id='global-store');
SELECT ROW_COUNT(); COMMIT;`);
console.log('Local India-wide Catalog product mappings ready; existing prices and offers preserved.');
