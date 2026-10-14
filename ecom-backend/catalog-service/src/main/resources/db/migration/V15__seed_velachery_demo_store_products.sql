INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), 'store-velachery', 'Velachery Daily Foods', p.id, TRUE, NULL, NOW(6), NOW(6)
FROM products p
WHERE p.id IN (
  UUID_TO_BIN('21000000-0000-0000-0000-000000000008'),
  UUID_TO_BIN('21000000-0000-0000-0000-000000000018'),
  UUID_TO_BIN('21000000-0000-0000-0000-000000000019'),
  UUID_TO_BIN('21000000-0000-0000-0000-000000000020'),
  UUID_TO_BIN('21000000-0000-0000-0000-000000000022')
)
AND NOT EXISTS (
  SELECT 1 FROM store_products sp
  WHERE sp.store_id = 'store-velachery'
    AND sp.product_id = p.id
);
