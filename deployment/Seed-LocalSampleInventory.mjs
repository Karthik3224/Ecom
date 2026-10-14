import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const mysql = 'C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe';
const inventoryDb = 'qual_99b106e3_inventory';
const catalogDb = 'catalog_service';
const expectedServerUuid = '580d1315-c4bf-11f1-bf4b-14cb19888cfa';
const seedQuantity = Number(process.env.LOCAL_SAMPLE_STOCK_QTY || 100);
const seedReason = 'Local client sample stock seed 2026-10-12';

assert.ok(Number.isInteger(seedQuantity) && seedQuantity > 0, 'Seed quantity must be positive');

const sql = query => execFileSync(mysql, [
  '--no-defaults',
  '--host=127.0.0.1',
  '--port=14306',
  '--user=root',
  '--batch',
  '--raw',
  '--skip-column-names',
  `--execute=${query}`,
], { encoding: 'utf8', timeout: 120000 }).trim();

const rows = query => {
  const value = sql(query);
  return value ? value.split(/\r?\n/).map(line => JSON.parse(line)) : [];
};

const hex = id => {
  assert.match(id, /^[a-f0-9-]{36}$/i);
  return id.replaceAll('-', '');
};

const serverUuid = sql('SELECT @@server_uuid');
assert.equal(serverUuid, expectedServerUuid, 'Refusing to seed any database except the restored local test MySQL');

const inventoryProcesses = JSON.parse(execFileSync('powershell', [
  '-NoProfile',
  '-Command',
  "@(Get-CimInstance Win32_Process -Filter \"Name='java.exe'\" | Where-Object {$_.CommandLine -match 'server.port=8095'} | Select-Object -ExpandProperty CommandLine) | ConvertTo-Json -Compress",
], { encoding: 'utf8', timeout: 30000 }) || '[]');
const inventoryCommandLines = [inventoryProcesses].flat().filter(Boolean);
assert.ok(
  inventoryCommandLines.length === 1 && inventoryCommandLines[0].includes(`14306/${inventoryDb}`),
  'Only the approved restored local Inventory service may be running for this seed'
);

mkdirSync('.local', { recursive: true });

const candidates = rows(`
SELECT JSON_OBJECT(
  'storeId', s.id,
  'storeName', s.name,
  'productId', BIN_TO_UUID(p.id),
  'productName', p.name,
  'variantId', BIN_TO_UUID(v.id),
  'sku', v.sku,
  'existingInventoryId', BIN_TO_UUID(i.id),
  'existingAvailable', i.available_quantity,
  'existingReserved', i.reserved_quantity,
  'existingStatus', i.status,
  'alreadySeeded', EXISTS (
    SELECT 1
    FROM ${inventoryDb}.stock_movements sm
    WHERE sm.inventory_id = i.id
      AND sm.reason = '${seedReason.replaceAll("'", "''")}'
  )
) AS payload
FROM ${catalogDb}.store_products sp
JOIN ${catalogDb}.stores s ON s.id = sp.store_id
JOIN ${catalogDb}.products p ON p.id = sp.product_id
JOIN ${catalogDb}.product_variants v ON v.product_id = p.id AND v.active = TRUE
LEFT JOIN ${inventoryDb}.inventories i
  ON i.store_id = s.id
 AND i.product_id = p.id
 AND i.variant_id = v.id
WHERE sp.available = TRUE
  AND s.active = TRUE
  AND p.status = 'ACTIVE'
  AND (
    i.id IS NULL
    OR (
      i.status = 'OUT_OF_STOCK'
      AND i.available_quantity = 0
      AND i.reserved_quantity = 0
      AND NOT EXISTS (
        SELECT 1
        FROM ${inventoryDb}.stock_movements sm
        WHERE sm.inventory_id = i.id
          AND sm.reason = '${seedReason.replaceAll("'", "''")}'
      )
    )
  )
ORDER BY s.id, p.name, v.sku
`);

const seeded = [];
const skipped = [];

for (const candidate of candidates) {
  const productHex = hex(candidate.productId);
  const variantHex = hex(candidate.variantId);
  const inventoryHex = candidate.existingInventoryId ? hex(candidate.existingInventoryId) : null;
  const storeId = candidate.storeId.replaceAll("'", "''");

  const query = candidate.existingInventoryId ? `
START TRANSACTION;
SELECT id FROM ${inventoryDb}.checkout_reservation_lock WHERE id = 1 FOR UPDATE;
UPDATE ${inventoryDb}.inventories i
SET i.available_quantity = i.available_quantity + ${seedQuantity},
    i.status = 'ACTIVE',
    i.version = i.version + 1,
    i.updated_at = NOW(6)
WHERE i.id = UNHEX('${inventoryHex}')
  AND i.product_id = UNHEX('${productHex}')
  AND i.variant_id = UNHEX('${variantHex}')
  AND i.store_id = '${storeId}'
  AND i.status = 'OUT_OF_STOCK'
  AND i.available_quantity = 0
  AND i.reserved_quantity = 0
  AND NOT EXISTS (
    SELECT 1 FROM ${inventoryDb}.stock_movements sm
    WHERE sm.inventory_id = i.id AND sm.reason = '${seedReason.replaceAll("'", "''")}'
  )
  AND EXISTS (
    SELECT 1 FROM ${catalogDb}.store_products sp
    JOIN ${catalogDb}.stores s ON s.id = sp.store_id
    JOIN ${catalogDb}.products p ON p.id = sp.product_id
    JOIN ${catalogDb}.product_variants v ON v.product_id = p.id
    WHERE sp.store_id = i.store_id
      AND sp.product_id = i.product_id
      AND sp.available = TRUE
      AND s.active = TRUE
      AND p.status = 'ACTIVE'
      AND v.id = i.variant_id
      AND v.active = TRUE
  );
INSERT INTO ${inventoryDb}.stock_movements(id, inventory_id, quantity, movement_type, reason, created_at)
SELECT UUID_TO_BIN(UUID()), UNHEX('${inventoryHex}'), ${seedQuantity}, 'INCREASE', '${seedReason.replaceAll("'", "''")}', NOW(6)
WHERE ROW_COUNT() = 1;
COMMIT;
` : `
START TRANSACTION;
SELECT id FROM ${inventoryDb}.checkout_reservation_lock WHERE id = 1 FOR UPDATE;
SET @inventory_id = UUID_TO_BIN(UUID());
INSERT INTO ${inventoryDb}.inventories(
  id, product_id, variant_id, variant_key, store_id,
  available_quantity, reserved_quantity, reorder_level, status,
  version, created_at, updated_at
)
SELECT @inventory_id, UNHEX('${productHex}'), UNHEX('${variantHex}'), UNHEX('${variantHex}'), '${storeId}',
       ${seedQuantity}, 0, 0, 'ACTIVE', 0, NOW(6), NOW(6)
WHERE EXISTS (
    SELECT 1 FROM ${catalogDb}.store_products sp
    JOIN ${catalogDb}.stores s ON s.id = sp.store_id
    JOIN ${catalogDb}.products p ON p.id = sp.product_id
    JOIN ${catalogDb}.product_variants v ON v.product_id = p.id
    WHERE sp.store_id = '${storeId}'
      AND sp.product_id = UNHEX('${productHex}')
      AND sp.available = TRUE
      AND s.active = TRUE
      AND p.status = 'ACTIVE'
      AND v.id = UNHEX('${variantHex}')
      AND v.active = TRUE
  )
  AND NOT EXISTS (
    SELECT 1 FROM ${inventoryDb}.inventories i
    WHERE i.store_id = '${storeId}'
      AND i.product_id = UNHEX('${productHex}')
      AND i.variant_key = UNHEX('${variantHex}')
  );
INSERT INTO ${inventoryDb}.stock_movements(id, inventory_id, quantity, movement_type, reason, created_at)
SELECT UUID_TO_BIN(UUID()), @inventory_id, ${seedQuantity}, 'INCREASE', '${seedReason.replaceAll("'", "''")}', NOW(6)
WHERE ROW_COUNT() = 1;
COMMIT;
`;

  sql(query);
  const after = rows(`
SELECT JSON_OBJECT(
  'inventoryId', BIN_TO_UUID(id),
  'available', available_quantity,
  'reserved', reserved_quantity,
  'status', status,
  'seedMovements', (
    SELECT COUNT(*) FROM ${inventoryDb}.stock_movements sm
    WHERE sm.inventory_id = inventories.id
      AND sm.reason = '${seedReason.replaceAll("'", "''")}'
  )
) FROM ${inventoryDb}.inventories
WHERE store_id = '${storeId}'
  AND product_id = UNHEX('${productHex}')
  AND variant_id = UNHEX('${variantHex}')
`)[0];

  if (after?.seedMovements > 0) seeded.push({ ...candidate, after });
  else skipped.push({ ...candidate, reason: 'guard-held-or-already-changed', after });
}

const report = {
  database: inventoryDb,
  catalogReadOnly: catalogDb,
  seedReason,
  seedQuantity,
  candidateCount: candidates.length,
  seededCount: seeded.length,
  skippedCount: skipped.length,
  seeded,
  skipped,
  note: 'Local test database only. Existing positive stock, reservations, orders, payments, and catalog data were not overwritten.',
};
writeFileSync('.local/local-sample-inventory-seed.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  seedQuantity,
  candidateCount: candidates.length,
  seededCount: seeded.length,
  skippedCount: skipped.length,
}, null, 2));
