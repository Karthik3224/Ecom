SET @product_defaults = (
  SELECT IF(
    COUNT(*) = 4,
    'ALTER TABLE products
       MODIFY COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE,
       MODIFY COLUMN special BOOLEAN NOT NULL DEFAULT FALSE,
       MODIFY COLUMN new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
       MODIFY COLUMN best_seller BOOLEAN NOT NULL DEFAULT FALSE',
    'SELECT 1'
  )
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'products'
    AND column_name IN ('featured', 'special', 'new_arrival', 'best_seller')
);
PREPARE product_defaults_stmt FROM @product_defaults;
EXECUTE product_defaults_stmt;
DEALLOCATE PREPARE product_defaults_stmt;

INSERT INTO categories(id, name, slug, description, active, created_at, updated_at)
SELECT UUID_TO_BIN('10000000-0000-0000-0000-000000000001'), 'Traditional Pickles', 'traditional-pickles', 'Small-batch Indian pickles made for daily meals.', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'traditional-pickles');

INSERT INTO categories(id, name, slug, description, active, created_at, updated_at)
SELECT UUID_TO_BIN('10000000-0000-0000-0000-000000000002'), 'Home Spices', 'home-spices', 'Fresh ground spices and masala essentials.', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'home-spices');

INSERT INTO categories(id, name, slug, description, active, created_at, updated_at)
SELECT UUID_TO_BIN('10000000-0000-0000-0000-000000000003'), 'Dry Fruits', 'dry-fruits', 'Premium dry fruits for gifting and snacking.', TRUE, NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'dry-fruits');

INSERT INTO products(id, category_id, name, slug, sku, description, brand, status, created_at, updated_at)
SELECT UUID_TO_BIN('20000000-0000-0000-0000-000000000001'), c.id, 'Mango Pickle', 'mango-pickle', 'PKL-MANGO', 'Tangy raw mango pickle with chilli, mustard and cold-pressed oil.', 'Thejo Foods', 'ACTIVE', NOW(6), NOW(6)
FROM categories c
WHERE c.slug = 'traditional-pickles'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PKL-MANGO' OR slug = 'mango-pickle');

INSERT INTO products(id, category_id, name, slug, sku, description, brand, status, created_at, updated_at)
SELECT UUID_TO_BIN('20000000-0000-0000-0000-000000000002'), c.id, 'Lemon Pickle', 'lemon-pickle', 'PKL-LEMON', 'Classic lemon pickle with a bold sour and spicy finish.', 'Thejo Foods', 'ACTIVE', NOW(6), NOW(6)
FROM categories c
WHERE c.slug = 'traditional-pickles'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PKL-LEMON' OR slug = 'lemon-pickle');

INSERT INTO products(id, category_id, name, slug, sku, description, brand, status, created_at, updated_at)
SELECT UUID_TO_BIN('20000000-0000-0000-0000-000000000003'), c.id, 'Garlic Pickle', 'garlic-pickle', 'PKL-GARLIC', 'Garlic cloves pickled with chilli, fenugreek and aromatic spices.', 'Thejo Foods', 'ACTIVE', NOW(6), NOW(6)
FROM categories c
WHERE c.slug = 'traditional-pickles'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PKL-GARLIC' OR slug = 'garlic-pickle');

INSERT INTO products(id, category_id, name, slug, sku, description, brand, status, created_at, updated_at)
SELECT UUID_TO_BIN('20000000-0000-0000-0000-000000000004'), c.id, 'Red Chilli Powder', 'red-chilli-powder', 'SPC-RED-CHILLI', 'Bright red chilli powder for everyday cooking.', 'Thejo Foods', 'ACTIVE', NOW(6), NOW(6)
FROM categories c
WHERE c.slug = 'home-spices'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SPC-RED-CHILLI' OR slug = 'red-chilli-powder');

INSERT INTO products(id, category_id, name, slug, sku, description, brand, status, created_at, updated_at)
SELECT UUID_TO_BIN('20000000-0000-0000-0000-000000000005'), c.id, 'Premium Cashews', 'premium-cashews', 'DRY-CASHEW', 'Whole cashews for snacks, sweets and gifting.', 'Thejo Foods', 'ACTIVE', NOW(6), NOW(6)
FROM categories c
WHERE c.slug = 'dry-fruits'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'DRY-CASHEW' OR slug = 'premium-cashews');

INSERT INTO product_variants(id, product_id, sku, name, attributes, price, compare_at_price, active, created_at, updated_at)
SELECT UUID_TO_BIN('30000000-0000-0000-0000-000000000001'), UUID_TO_BIN('20000000-0000-0000-0000-000000000001'), 'PKL-MANGO-250G', '250 g Jar', JSON_OBJECT('size','250 g','pack','jar'), 149.00, 179.00, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000001'))
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'PKL-MANGO-250G');

INSERT INTO product_variants(id, product_id, sku, name, attributes, price, compare_at_price, active, created_at, updated_at)
SELECT UUID_TO_BIN('30000000-0000-0000-0000-000000000002'), UUID_TO_BIN('20000000-0000-0000-0000-000000000001'), 'PKL-MANGO-500G', '500 g Jar', JSON_OBJECT('size','500 g','pack','jar'), 279.00, 329.00, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000001'))
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'PKL-MANGO-500G');

INSERT INTO product_variants(id, product_id, sku, name, attributes, price, compare_at_price, active, created_at, updated_at)
SELECT UUID_TO_BIN('30000000-0000-0000-0000-000000000003'), UUID_TO_BIN('20000000-0000-0000-0000-000000000002'), 'PKL-LEMON-250G', '250 g Jar', JSON_OBJECT('size','250 g','pack','jar'), 129.00, 159.00, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000002'))
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'PKL-LEMON-250G');

INSERT INTO product_variants(id, product_id, sku, name, attributes, price, compare_at_price, active, created_at, updated_at)
SELECT UUID_TO_BIN('30000000-0000-0000-0000-000000000004'), UUID_TO_BIN('20000000-0000-0000-0000-000000000003'), 'PKL-GARLIC-250G', '250 g Jar', JSON_OBJECT('size','250 g','pack','jar'), 169.00, 199.00, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000003'))
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'PKL-GARLIC-250G');

INSERT INTO product_variants(id, product_id, sku, name, attributes, price, compare_at_price, active, created_at, updated_at)
SELECT UUID_TO_BIN('30000000-0000-0000-0000-000000000005'), UUID_TO_BIN('20000000-0000-0000-0000-000000000004'), 'SPC-RED-CHILLI-200G', '200 g Pack', JSON_OBJECT('size','200 g','pack','pouch'), 99.00, 119.00, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000004'))
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'SPC-RED-CHILLI-200G');

INSERT INTO product_variants(id, product_id, sku, name, attributes, price, compare_at_price, active, created_at, updated_at)
SELECT UUID_TO_BIN('30000000-0000-0000-0000-000000000006'), UUID_TO_BIN('20000000-0000-0000-0000-000000000005'), 'DRY-CASHEW-250G', '250 g Pack', JSON_OBJECT('size','250 g','pack','pouch'), 349.00, 399.00, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000005'))
  AND NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = 'DRY-CASHEW-250G');

INSERT INTO product_images(id, product_id, url, alt_text, display_order, primary_image, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), UUID_TO_BIN('20000000-0000-0000-0000-000000000001'), '/assets/images/mango_pickle_jar.png', 'Mango pickle jar', 1, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000001'))
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000001') AND primary_image = TRUE);

INSERT INTO product_images(id, product_id, url, alt_text, display_order, primary_image, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), UUID_TO_BIN('20000000-0000-0000-0000-000000000002'), '/assets/images/lemon_pickle_jar.png', 'Lemon pickle jar', 1, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000002'))
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000002') AND primary_image = TRUE);

INSERT INTO product_images(id, product_id, url, alt_text, display_order, primary_image, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), UUID_TO_BIN('20000000-0000-0000-0000-000000000003'), '/assets/images/garlic_pickle_jar.png', 'Garlic pickle jar', 1, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000003'))
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000003') AND primary_image = TRUE);

INSERT INTO product_images(id, product_id, url, alt_text, display_order, primary_image, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), UUID_TO_BIN('20000000-0000-0000-0000-000000000004'), '/assets/images/red_chilli_powder.png', 'Red chilli powder pack', 1, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000004'))
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000004') AND primary_image = TRUE);

INSERT INTO product_images(id, product_id, url, alt_text, display_order, primary_image, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), UUID_TO_BIN('20000000-0000-0000-0000-000000000005'), '/assets/images/dry_fruits.png', 'Premium dry fruits', 1, TRUE, NOW(6), NOW(6)
WHERE EXISTS (SELECT 1 FROM products WHERE id = UUID_TO_BIN('20000000-0000-0000-0000-000000000005'))
  AND NOT EXISTS (SELECT 1 FROM product_images WHERE product_id = UUID_TO_BIN('20000000-0000-0000-0000-000000000005') AND primary_image = TRUE);

INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), 'store-gachibowli', 'Thejo Gachibowli Store', id, TRUE, NULL, NOW(6), NOW(6)
FROM products
WHERE sku IN ('PKL-MANGO', 'PKL-LEMON', 'PKL-GARLIC', 'SPC-RED-CHILLI', 'DRY-CASHEW')
  AND NOT EXISTS (
    SELECT 1 FROM store_products
    WHERE store_products.store_id = 'store-gachibowli'
      AND store_products.product_id = products.id
  );
