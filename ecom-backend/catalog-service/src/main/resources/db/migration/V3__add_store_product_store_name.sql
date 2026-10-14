SET @add_store_name = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE store_products ADD COLUMN store_name VARCHAR(180)',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'store_products'
    AND column_name = 'store_name'
);
PREPARE add_store_name_stmt FROM @add_store_name;
EXECUTE add_store_name_stmt;
DEALLOCATE PREPARE add_store_name_stmt;

UPDATE store_products
SET store_name = CASE store_id
  WHEN 'store-gachibowli' THEN 'Thejo Gachibowli Store'
  WHEN 'store-hyd-001' THEN 'Thejo Hyderabad Central'
  WHEN 'store-1' THEN 'Thejo Sample Store 1'
  WHEN 'store-2' THEN 'Thejo Sample Store 2'
  ELSE CONCAT('Store ', store_id)
END
WHERE store_name IS NULL OR store_name = '';

INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), 'store-gachibowli', 'Thejo Gachibowli Store', UUID_TO_BIN('42683bd8-4089-4440-a325-03de4a557241'), TRUE, NULL, NOW(6), NOW(6)
WHERE EXISTS (
  SELECT 1 FROM products WHERE id = UUID_TO_BIN('42683bd8-4089-4440-a325-03de4a557241')
) AND NOT EXISTS (
  SELECT 1 FROM store_products
  WHERE store_id = 'store-gachibowli'
    AND product_id = UUID_TO_BIN('42683bd8-4089-4440-a325-03de4a557241')
);
