ALTER TABLE store_delivery_zones
  ADD COLUMN location_id VARCHAR(100) NULL AFTER store_id,
  ADD INDEX idx_store_delivery_zones_location (location_id);
