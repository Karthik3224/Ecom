SET @add_global_product = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN global_product BOOLEAN NOT NULL DEFAULT FALSE AFTER best_seller', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'global_product'
);
PREPARE add_global_product_stmt FROM @add_global_product;
EXECUTE add_global_product_stmt;
DEALLOCATE PREPARE add_global_product_stmt;

SET @add_fulfillment_type = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN fulfillment_type VARCHAR(40) NULL AFTER global_product', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'fulfillment_type'
);
PREPARE add_fulfillment_type_stmt FROM @add_fulfillment_type;
EXECUTE add_fulfillment_type_stmt;
DEALLOCATE PREPARE add_fulfillment_type_stmt;

SET @add_delivery_method = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN delivery_method VARCHAR(80) NULL AFTER fulfillment_type', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'delivery_method'
);
PREPARE add_delivery_method_stmt FROM @add_delivery_method;
EXECUTE add_delivery_method_stmt;
DEALLOCATE PREPARE add_delivery_method_stmt;

INSERT INTO stores (
  id, name, store_code, description, location, address, city, district, state, pincode,
  latitude, longitude, provider, phone, email, admin_name, store_rating, status,
  delivery_enabled, pickup_enabled, delivery_radius_km, delivery_eta_minutes, delivery_charge,
  free_delivery_above, delivery_modes, delivery_notes, active, created_at, updated_at
) VALUES (
  'global-store', 'India-wide Global Store', 'GLOBAL-INDIA-001',
  'India-wide fulfillment store for Global products.',
  'India', 'India-wide delivery', 'India', 'India', 'India', '000000',
  20.5936840, 78.9628800, 'OPENSTREETMAP', '+91 91000 29999', 'global-store@metaarch.local',
  'Global Admin', 4.70, 'Active', TRUE, FALSE, NULL, NULL, 0.00, NULL,
  'Global Delivery', 'Tracking ID provided after dispatch. Global Admin updates shipment status and tracking ID.',
  TRUE, NOW(6), NOW(6)
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  store_code = VALUES(store_code),
  description = VALUES(description),
  location = VALUES(location),
  address = VALUES(address),
  delivery_enabled = VALUES(delivery_enabled),
  pickup_enabled = VALUES(pickup_enabled),
  delivery_charge = VALUES(delivery_charge),
  delivery_modes = VALUES(delivery_modes),
  delivery_notes = VALUES(delivery_notes),
  status = VALUES(status),
  active = VALUES(active),
  updated_at = NOW(6);

UPDATE products
SET global_product = TRUE,
    fulfillment_type = 'global',
    delivery_method = 'global',
    updated_at = NOW(6)
WHERE LOWER(COALESCE(type, '')) LIKE '%dry fruit%'
   OR LOWER(COALESCE(tags, '')) LIKE '%dry fruit%'
   OR LOWER(COALESCE(name, '')) LIKE '%cashew%'
   OR LOWER(COALESCE(name, '')) LIKE '%almond%'
   OR LOWER(COALESCE(name, '')) LIKE '%pistachio%';

INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), 'global-store', 'India-wide Global Store', p.id, TRUE, NULL, NOW(6), NOW(6)
FROM products p
WHERE p.global_product = TRUE
ON DUPLICATE KEY UPDATE
  store_name = VALUES(store_name),
  available = TRUE,
  updated_at = NOW(6);
