SET @schema_name = DATABASE();

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'delivery_radius_km'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE stores ADD COLUMN delivery_radius_km DECIMAL(8,2) NULL AFTER pickup_enabled',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'delivery_eta_minutes'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE stores ADD COLUMN delivery_eta_minutes INT NULL AFTER delivery_radius_km',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'delivery_charge'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE stores ADD COLUMN delivery_charge DECIMAL(10,2) NULL AFTER delivery_eta_minutes',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'free_delivery_above'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE stores ADD COLUMN free_delivery_above DECIMAL(10,2) NULL AFTER delivery_charge',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'delivery_modes'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE stores ADD COLUMN delivery_modes VARCHAR(300) NULL AFTER free_delivery_above',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'stores' AND column_name = 'delivery_notes'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE stores ADD COLUMN delivery_notes VARCHAR(500) NULL AFTER delivery_modes',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE stores
SET
  delivery_radius_km = COALESCE(delivery_radius_km, 10.00),
  delivery_eta_minutes = COALESCE(delivery_eta_minutes, 20),
  delivery_charge = COALESCE(delivery_charge, 35.00),
  free_delivery_above = COALESCE(free_delivery_above, 499.00),
  delivery_modes = COALESCE(delivery_modes, 'Standard Delivery,Instant Delivery,Store Pickup'),
  delivery_notes = COALESCE(delivery_notes, 'Standard delivery within service radius. Free delivery above configured order value.')
WHERE active = TRUE;
