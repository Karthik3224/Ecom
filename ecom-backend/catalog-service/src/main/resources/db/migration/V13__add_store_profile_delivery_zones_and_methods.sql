SET @schema_name = DATABASE();

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'store_code');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN store_code VARCHAR(60) NULL AFTER name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'logo_url');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN logo_url VARCHAR(2048) NULL AFTER store_code', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'description');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN description VARCHAR(1000) NULL AFTER logo_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'door_number');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN door_number VARCHAR(80) NULL AFTER address', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'street_name');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN street_name VARCHAR(180) NULL AFTER door_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'area');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN area VARCHAR(160) NULL AFTER street_name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'landmark');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN landmark VARCHAR(180) NULL AFTER area', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'city');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN city VARCHAR(120) NULL AFTER landmark', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'district');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN district VARCHAR(120) NULL AFTER city', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'state');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN state VARCHAR(120) NULL AFTER district', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'pincode');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN pincode VARCHAR(20) NULL AFTER state', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'alternate_phone');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN alternate_phone VARCHAR(30) NULL AFTER phone', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'store_rating');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN store_rating DECIMAL(3,2) NULL AFTER admin_name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'gst_number');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN gst_number VARCHAR(30) NULL AFTER store_rating', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'status');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE stores ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT ''Active'' AFTER gst_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @schema_name AND table_name = 'stores' AND index_name = 'idx_stores_status');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX idx_stores_status ON stores(status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = @schema_name AND table_name = 'stores' AND index_name = 'idx_stores_code');
SET @sql = IF(@index_exists = 0, 'CREATE INDEX idx_stores_code ON stores(store_code)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS store_managers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id VARCHAR(100) NOT NULL,
  name VARCHAR(180) NOT NULL,
  email VARCHAR(180) NOT NULL,
  mobile VARCHAR(30),
  password_hash VARCHAR(255),
  status VARCHAR(40) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_store_managers_store FOREIGN KEY (store_id) REFERENCES stores(id),
  INDEX idx_store_managers_store (store_id)
);

CREATE TABLE IF NOT EXISTS store_delivery_zones (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id VARCHAR(100) NOT NULL,
  min_radius_km DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  max_radius_km DECIMAL(8,2) NOT NULL,
  estimated_delivery_min INT,
  estimated_delivery_max INT,
  delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  free_delivery_above DECIMAL(10,2),
  minimum_order DECIMAL(10,2),
  status VARCHAR(40) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_store_delivery_zones_store FOREIGN KEY (store_id) REFERENCES stores(id),
  INDEX idx_store_delivery_zones_store (store_id),
  INDEX idx_store_delivery_zones_radius (store_id, min_radius_km, max_radius_km)
);

CREATE TABLE IF NOT EXISTS store_delivery_methods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  store_id VARCHAR(100) NOT NULL,
  delivery_zone_id BIGINT,
  delivery_type VARCHAR(60) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_charge DECIMAL(10,2),
  estimated_time VARCHAR(80),
  cutoff_time VARCHAR(20),
  settings_configuration TEXT,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_store_delivery_methods_store FOREIGN KEY (store_id) REFERENCES stores(id),
  CONSTRAINT fk_store_delivery_methods_zone FOREIGN KEY (delivery_zone_id) REFERENCES store_delivery_zones(id) ON DELETE CASCADE,
  INDEX idx_store_delivery_methods_store (store_id),
  INDEX idx_store_delivery_methods_zone (delivery_zone_id)
);

UPDATE stores
SET
  store_code = COALESCE(store_code, UPPER(REPLACE(LEFT(id, 24), '-', ''))),
  logo_url = COALESCE(logo_url, ''),
  description = COALESCE(description, CONCAT(name, ' serving ', location)),
  city = COALESCE(city, location),
  district = COALESCE(district, location),
  state = COALESCE(state, ''),
  status = CASE WHEN active = TRUE THEN 'Active' ELSE 'Inactive' END,
  store_rating = COALESCE(store_rating, 4.50)
WHERE id IS NOT NULL;

INSERT INTO store_managers(store_id, name, email, mobile, status, created_at, updated_at)
SELECT s.id, COALESCE(s.admin_name, CONCAT(s.name, ' Manager')), COALESCE(s.email, CONCAT(REPLACE(LOWER(s.id), '-', ''), '@metaarch.local')), s.phone, 'Active', NOW(6), NOW(6)
FROM stores s
WHERE NOT EXISTS (SELECT 1 FROM store_managers sm WHERE sm.store_id = s.id);

INSERT INTO store_delivery_zones(store_id, min_radius_km, max_radius_km, estimated_delivery_min, estimated_delivery_max, delivery_charge, free_delivery_above, minimum_order, status, created_at, updated_at)
SELECT s.id, 0.00, COALESCE(s.delivery_radius_km, 10.00), GREATEST(COALESCE(s.delivery_eta_minutes, 20) - 5, 5), COALESCE(s.delivery_eta_minutes, 20) + 10, COALESCE(s.delivery_charge, 35.00), COALESCE(s.free_delivery_above, 499.00), 0.00, 'Active', NOW(6), NOW(6)
FROM stores s
WHERE NOT EXISTS (SELECT 1 FROM store_delivery_zones z WHERE z.store_id = s.id);

INSERT INTO store_delivery_methods(store_id, delivery_zone_id, delivery_type, enabled, delivery_charge, estimated_time, settings_configuration, created_at, updated_at)
SELECT z.store_id, z.id, 'Standard Delivery', TRUE, z.delivery_charge, CONCAT(z.estimated_delivery_min, '-', z.estimated_delivery_max, ' min'), '{}', NOW(6), NOW(6)
FROM store_delivery_zones z
WHERE NOT EXISTS (SELECT 1 FROM store_delivery_methods m WHERE m.delivery_zone_id = z.id AND m.delivery_type = 'Standard Delivery');

INSERT INTO store_delivery_methods(store_id, delivery_zone_id, delivery_type, enabled, delivery_charge, estimated_time, settings_configuration, created_at, updated_at)
SELECT z.store_id, z.id, 'Instant Delivery', TRUE, z.delivery_charge + 25.00, CONCAT(z.estimated_delivery_min, ' min'), '{}', NOW(6), NOW(6)
FROM store_delivery_zones z
WHERE z.max_radius_km <= 10.00
  AND NOT EXISTS (SELECT 1 FROM store_delivery_methods m WHERE m.delivery_zone_id = z.id AND m.delivery_type = 'Instant Delivery');

INSERT INTO store_delivery_methods(store_id, delivery_zone_id, delivery_type, enabled, delivery_charge, estimated_time, settings_configuration, created_at, updated_at)
SELECT z.store_id, z.id, 'Store Pickup', TRUE, 0.00, 'Ready in 30 min', '{"pickupInstructions":"Collect from billing counter"}', NOW(6), NOW(6)
FROM store_delivery_zones z
WHERE NOT EXISTS (SELECT 1 FROM store_delivery_methods m WHERE m.delivery_zone_id = z.id AND m.delivery_type = 'Store Pickup');
