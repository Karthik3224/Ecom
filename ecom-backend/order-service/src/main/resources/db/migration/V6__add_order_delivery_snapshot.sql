ALTER TABLE orders
  ADD COLUMN delivery_zone_id BIGINT NULL AFTER store_id,
  ADD COLUMN calculated_distance_km DECIMAL(8,2) NULL AFTER delivery_zone_id,
  ADD COLUMN customer_latitude DECIMAL(10,7) NULL AFTER calculated_distance_km,
  ADD COLUMN customer_longitude DECIMAL(10,7) NULL AFTER customer_latitude,
  ADD COLUMN store_latitude DECIMAL(10,7) NULL AFTER customer_longitude,
  ADD COLUMN store_longitude DECIMAL(10,7) NULL AFTER store_latitude,
  ADD COLUMN delivery_method VARCHAR(80) NULL AFTER store_longitude,
  ADD COLUMN delivery_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER delivery_method,
  ADD COLUMN estimated_delivery_min INT NULL AFTER delivery_charge,
  ADD COLUMN estimated_delivery_max INT NULL AFTER estimated_delivery_min,
  ADD COLUMN free_delivery_above DECIMAL(10,2) NULL AFTER estimated_delivery_max,
  ADD COLUMN free_delivery_applied BOOLEAN NOT NULL DEFAULT FALSE AFTER free_delivery_above,
  ADD COLUMN scheduled_delivery_date DATE NULL AFTER free_delivery_applied,
  ADD COLUMN scheduled_delivery_slot VARCHAR(80) NULL AFTER scheduled_delivery_date,
  ADD COLUMN pickup_details VARCHAR(1000) NULL AFTER scheduled_delivery_slot;

CREATE INDEX idx_orders_store_status_created ON orders(store_id, status, created_at);
CREATE INDEX idx_orders_delivery_method ON orders(delivery_method);
