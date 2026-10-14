SET @schema_name = DATABASE();

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'shipments' AND column_name = 'delivery_partner_id'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE shipments ADD COLUMN delivery_partner_id VARCHAR(100) NULL AFTER tracking_number',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'shipments' AND column_name = 'delivery_partner_name'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE shipments ADD COLUMN delivery_partner_name VARCHAR(180) NULL AFTER delivery_partner_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'shipments' AND column_name = 'delivery_partner_phone'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE shipments ADD COLUMN delivery_partner_phone VARCHAR(40) NULL AFTER delivery_partner_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'shipments' AND column_name = 'delivery_partner_vehicle_number'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE shipments ADD COLUMN delivery_partner_vehicle_number VARCHAR(40) NULL AFTER delivery_partner_phone',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'shipments' AND column_name = 'delivery_assigned_at'
);
SET @sql = IF(@column_exists = 0,
  'ALTER TABLE shipments ADD COLUMN delivery_assigned_at TIMESTAMP(6) NULL AFTER delivery_partner_vehicle_number',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = @schema_name AND table_name = 'shipments' AND index_name = 'idx_shipments_delivery_partner'
);
SET @sql = IF(@index_exists = 0,
  'CREATE INDEX idx_shipments_delivery_partner ON shipments(delivery_partner_id, status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
