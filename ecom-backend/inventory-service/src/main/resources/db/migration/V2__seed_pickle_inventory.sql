INSERT INTO inventories(id, product_id, variant_id, variant_key, store_id, available_quantity, reserved_quantity, reorder_level, status, version, created_at, updated_at)
SELECT UUID_TO_BIN('40000000-0000-0000-0000-000000000001'), UUID_TO_BIN('20000000-0000-0000-0000-000000000001'), UUID_TO_BIN('30000000-0000-0000-0000-000000000001'), UUID_TO_BIN('30000000-0000-0000-0000-000000000001'), 'store-gachibowli', 75, 0, 10, 'ACTIVE', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000001') AND variant_key = UUID_TO_BIN('30000000-0000-0000-0000-000000000001') AND store_id = 'store-gachibowli');

INSERT INTO inventories(id, product_id, variant_id, variant_key, store_id, available_quantity, reserved_quantity, reorder_level, status, version, created_at, updated_at)
SELECT UUID_TO_BIN('40000000-0000-0000-0000-000000000002'), UUID_TO_BIN('20000000-0000-0000-0000-000000000001'), UUID_TO_BIN('30000000-0000-0000-0000-000000000002'), UUID_TO_BIN('30000000-0000-0000-0000-000000000002'), 'store-gachibowli', 42, 0, 8, 'ACTIVE', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000001') AND variant_key = UUID_TO_BIN('30000000-0000-0000-0000-000000000002') AND store_id = 'store-gachibowli');

INSERT INTO inventories(id, product_id, variant_id, variant_key, store_id, available_quantity, reserved_quantity, reorder_level, status, version, created_at, updated_at)
SELECT UUID_TO_BIN('40000000-0000-0000-0000-000000000003'), UUID_TO_BIN('20000000-0000-0000-0000-000000000002'), UUID_TO_BIN('30000000-0000-0000-0000-000000000003'), UUID_TO_BIN('30000000-0000-0000-0000-000000000003'), 'store-gachibowli', 60, 0, 10, 'ACTIVE', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000002') AND variant_key = UUID_TO_BIN('30000000-0000-0000-0000-000000000003') AND store_id = 'store-gachibowli');

INSERT INTO inventories(id, product_id, variant_id, variant_key, store_id, available_quantity, reserved_quantity, reorder_level, status, version, created_at, updated_at)
SELECT UUID_TO_BIN('40000000-0000-0000-0000-000000000004'), UUID_TO_BIN('20000000-0000-0000-0000-000000000003'), UUID_TO_BIN('30000000-0000-0000-0000-000000000004'), UUID_TO_BIN('30000000-0000-0000-0000-000000000004'), 'store-gachibowli', 36, 0, 8, 'ACTIVE', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000003') AND variant_key = UUID_TO_BIN('30000000-0000-0000-0000-000000000004') AND store_id = 'store-gachibowli');

INSERT INTO inventories(id, product_id, variant_id, variant_key, store_id, available_quantity, reserved_quantity, reorder_level, status, version, created_at, updated_at)
SELECT UUID_TO_BIN('40000000-0000-0000-0000-000000000005'), UUID_TO_BIN('20000000-0000-0000-0000-000000000004'), UUID_TO_BIN('30000000-0000-0000-0000-000000000005'), UUID_TO_BIN('30000000-0000-0000-0000-000000000005'), 'store-gachibowli', 90, 0, 15, 'ACTIVE', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000004') AND variant_key = UUID_TO_BIN('30000000-0000-0000-0000-000000000005') AND store_id = 'store-gachibowli');

INSERT INTO inventories(id, product_id, variant_id, variant_key, store_id, available_quantity, reserved_quantity, reorder_level, status, version, created_at, updated_at)
SELECT UUID_TO_BIN('40000000-0000-0000-0000-000000000006'), UUID_TO_BIN('20000000-0000-0000-0000-000000000005'), UUID_TO_BIN('30000000-0000-0000-0000-000000000006'), UUID_TO_BIN('30000000-0000-0000-0000-000000000006'), 'store-gachibowli', 25, 0, 5, 'ACTIVE', 0, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM inventories WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000005') AND variant_key = UUID_TO_BIN('30000000-0000-0000-0000-000000000006') AND store_id = 'store-gachibowli');

INSERT INTO stock_movements(id, inventory_id, quantity, movement_type, reason, created_at)
SELECT UUID_TO_BIN(UUID()), id, available_quantity, 'INCREASE', 'Initial pickle store sample stock', NOW(6)
FROM inventories
WHERE store_id = 'store-gachibowli'
  AND product_id IN (
    UUID_TO_BIN('20000000-0000-0000-0000-000000000001'),
    UUID_TO_BIN('20000000-0000-0000-0000-000000000002'),
    UUID_TO_BIN('20000000-0000-0000-0000-000000000003'),
    UUID_TO_BIN('20000000-0000-0000-0000-000000000004'),
    UUID_TO_BIN('20000000-0000-0000-0000-000000000005')
  )
  AND NOT EXISTS (
    SELECT 1 FROM stock_movements
    WHERE stock_movements.inventory_id = inventories.id
      AND stock_movements.reason = 'Initial pickle store sample stock'
  );
