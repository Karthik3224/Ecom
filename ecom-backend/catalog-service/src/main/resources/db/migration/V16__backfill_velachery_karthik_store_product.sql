INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), 'store-velachery', 'Velachery Daily Foods', p.id, TRUE, NULL, NOW(6), NOW(6)
FROM products p
WHERE (LOWER(p.name) = 'karthik' OR LOWER(p.sku) = 'dfrefc13')
AND NOT EXISTS (
  SELECT 1 FROM store_products sp
  WHERE sp.store_id = 'store-velachery'
    AND sp.product_id = p.id
);
