CREATE TABLE inventories (
  id BINARY(16) NOT NULL PRIMARY KEY,
  product_id BINARY(16) NOT NULL,
  variant_id BINARY(16),
  variant_key BINARY(16) NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  available_quantity INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_inventories_lookup UNIQUE (product_id, variant_key, store_id),
  CONSTRAINT chk_inventory_available_non_negative CHECK (available_quantity >= 0),
  CONSTRAINT chk_inventory_reserved_non_negative CHECK (reserved_quantity >= 0),
  CONSTRAINT chk_inventory_reorder_non_negative CHECK (reorder_level >= 0),
  INDEX idx_inventories_product_variant_store (product_id, variant_id, store_id),
  INDEX idx_inventories_store_status (store_id, status),
  INDEX idx_inventories_reorder (status, available_quantity, reorder_level)
);

CREATE TABLE stock_movements (
  id BINARY(16) NOT NULL PRIMARY KEY,
  inventory_id BINARY(16) NOT NULL,
  quantity INT NOT NULL,
  movement_type VARCHAR(20) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT fk_stock_movements_inventory FOREIGN KEY (inventory_id) REFERENCES inventories(id),
  CONSTRAINT chk_stock_movements_quantity_positive CHECK (quantity > 0),
  INDEX idx_stock_movements_inventory_created (inventory_id, created_at),
  INDEX idx_stock_movements_type_created (movement_type, created_at)
);
