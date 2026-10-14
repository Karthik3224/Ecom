UPDATE products
SET slug = 'legacy-california-almonds',
    status = 'INACTIVE',
    updated_at = NOW(6)
WHERE sku = 'THEJO-ALM'
  AND slug = 'california-almonds';

INSERT INTO products(id, category_id, name, slug, sku, description, brand, ingredients, specifications, pack, type, shelf_life, tags, highlights, about_source, status, created_at, updated_at)
SELECT UUID_TO_BIN('21000000-0000-0000-0000-000000000006'), c.id, 'California Almonds', 'california-almonds', 'DRY-CAL-ALMOND', 'Crisp whole almonds with a clean nutty flavour for snacking, soaking or desserts.', 'Metaarch Select', 'Whole almonds.', 'Pack: 250 g pouch\nType: Vegetarian\nShelf life: 9 months\nGrade: Whole kernels.', '250 g', 'Vegetarian', '9 months', 'dry-fruits,almonds,nuts', 'Whole almond kernels\nNaturally crunchy\nGood for daily snacking', 'Sourced from calibrated almond lots and packed in moisture-protected pouches.', 'ACTIVE', NOW(6), NOW(6)
FROM categories c
WHERE c.slug = 'premium-dry-fruits'
  AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'DRY-CAL-ALMOND');

INSERT INTO product_images(id, product_id, url, alt_text, display_order, primary_image, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), p.id, 'https://source.unsplash.com/900x700/?almonds', p.name, 0, TRUE, NOW(6), NOW(6)
FROM products p
WHERE p.sku = 'DRY-CAL-ALMOND'
  AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.primary_image = TRUE);

INSERT INTO product_variants(id, product_id, sku, name, attributes, price, compare_at_price, active, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), p.id, 'DRY-CAL-ALMOND-250G', '250 g', JSON_OBJECT('pack', '250 g', 'type', 'Vegetarian'), 299.00, 349.00, TRUE, NOW(6), NOW(6)
FROM products p
WHERE p.sku = 'DRY-CAL-ALMOND'
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku = 'DRY-CAL-ALMOND-250G');

INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), 'store-gachibowli', 'Thejo Gachibowli Store', p.id, TRUE, NULL, NOW(6), NOW(6)
FROM products p
WHERE p.sku = 'DRY-CAL-ALMOND'
  AND NOT EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = 'store-gachibowli' AND sp.product_id = p.id);
