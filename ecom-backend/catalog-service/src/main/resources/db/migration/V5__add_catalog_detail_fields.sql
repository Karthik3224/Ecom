SET @add_category_thumbnail = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE categories ADD COLUMN thumbnail_url VARCHAR(2048) NULL AFTER description', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'categories' AND column_name = 'thumbnail_url'
);
PREPARE add_category_thumbnail_stmt FROM @add_category_thumbnail;
EXECUTE add_category_thumbnail_stmt;
DEALLOCATE PREPARE add_category_thumbnail_stmt;

SET @add_product_ingredients = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN ingredients TEXT NULL AFTER brand', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'ingredients'
);
PREPARE add_product_ingredients_stmt FROM @add_product_ingredients;
EXECUTE add_product_ingredients_stmt;
DEALLOCATE PREPARE add_product_ingredients_stmt;

SET @add_product_specifications = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN specifications TEXT NULL AFTER ingredients', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'specifications'
);
PREPARE add_product_specifications_stmt FROM @add_product_specifications;
EXECUTE add_product_specifications_stmt;
DEALLOCATE PREPARE add_product_specifications_stmt;

SET @add_product_pack = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN pack VARCHAR(80) NULL AFTER specifications', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'pack'
);
PREPARE add_product_pack_stmt FROM @add_product_pack;
EXECUTE add_product_pack_stmt;
DEALLOCATE PREPARE add_product_pack_stmt;

SET @add_product_type = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN type VARCHAR(80) NULL AFTER pack', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'type'
);
PREPARE add_product_type_stmt FROM @add_product_type;
EXECUTE add_product_type_stmt;
DEALLOCATE PREPARE add_product_type_stmt;

SET @add_product_shelf_life = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN shelf_life VARCHAR(80) NULL AFTER type', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'shelf_life'
);
PREPARE add_product_shelf_life_stmt FROM @add_product_shelf_life;
EXECUTE add_product_shelf_life_stmt;
DEALLOCATE PREPARE add_product_shelf_life_stmt;

SET @add_product_tags = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN tags TEXT NULL AFTER shelf_life', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'tags'
);
PREPARE add_product_tags_stmt FROM @add_product_tags;
EXECUTE add_product_tags_stmt;
DEALLOCATE PREPARE add_product_tags_stmt;

SET @add_product_highlights = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN highlights TEXT NULL AFTER tags', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'highlights'
);
PREPARE add_product_highlights_stmt FROM @add_product_highlights;
EXECUTE add_product_highlights_stmt;
DEALLOCATE PREPARE add_product_highlights_stmt;

SET @add_product_about_source = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN about_source TEXT NULL AFTER highlights', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'about_source'
);
PREPARE add_product_about_source_stmt FROM @add_product_about_source;
EXECUTE add_product_about_source_stmt;
DEALLOCATE PREPARE add_product_about_source_stmt;
