-- Merchandising flags that drive the customer Home page sections
-- (Featured / Special / New Arrivals / Best Sellers).
SET @add_featured = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'featured'
);
PREPARE add_featured_stmt FROM @add_featured;
EXECUTE add_featured_stmt;
DEALLOCATE PREPARE add_featured_stmt;

SET @add_special = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN special BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'special'
);
PREPARE add_special_stmt FROM @add_special;
EXECUTE add_special_stmt;
DEALLOCATE PREPARE add_special_stmt;

SET @add_new_arrival = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN new_arrival BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'new_arrival'
);
PREPARE add_new_arrival_stmt FROM @add_new_arrival;
EXECUTE add_new_arrival_stmt;
DEALLOCATE PREPARE add_new_arrival_stmt;

SET @add_best_seller = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN best_seller BOOLEAN NOT NULL DEFAULT FALSE', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'best_seller'
);
PREPARE add_best_seller_stmt FROM @add_best_seller;
EXECUTE add_best_seller_stmt;
DEALLOCATE PREPARE add_best_seller_stmt;
