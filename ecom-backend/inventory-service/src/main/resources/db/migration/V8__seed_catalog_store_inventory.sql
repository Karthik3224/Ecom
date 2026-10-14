-- Keep local checkout availability aligned with the catalog store-product mapping.
-- This is intentionally idempotent so a client database can be upgraded safely.
INSERT INTO inventories (id, product_id, variant_id, variant_key, store_id,
                         available_quantity, reserved_quantity, reorder_level,
                         status, version, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), sp.product_id, pv.id, pv.id, sp.store_id,
       50, 0, 10, 'ACTIVE', 0, NOW(6), NOW(6)
FROM catalog_service.store_products sp
JOIN catalog_service.product_variants pv
  ON pv.product_id = sp.product_id AND pv.active = 1
JOIN catalog_service.products p
  ON p.id = sp.product_id
WHERE sp.available = 1
  AND p.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM inventories i
    WHERE i.product_id = sp.product_id
      AND i.variant_key = pv.id
      AND i.store_id = sp.store_id
  );

INSERT INTO inventories (id, product_id, variant_id, variant_key, store_id,
                         available_quantity, reserved_quantity, reorder_level,
                         status, version, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), p.id, pv.id, pv.id, 'global-store',
       100, 0, 10, 'ACTIVE', 0, NOW(6), NOW(6)
FROM catalog_service.products p
JOIN catalog_service.product_variants pv
  ON pv.product_id = p.id AND pv.active = 1
WHERE (p.global_product = 1 OR p.fulfillment_type = 'global')
  AND p.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1
    FROM inventories i
    WHERE i.product_id = p.id
      AND i.variant_key = pv.id
      AND i.store_id = 'global-store'
  );
