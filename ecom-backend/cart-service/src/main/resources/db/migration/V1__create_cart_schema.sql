CREATE TABLE carts (
  id BINARY(16) NOT NULL PRIMARY KEY,
  customer_id BINARY(16) NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  total_amount DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  INDEX idx_carts_customer_store_status (customer_id, store_id, status)
);

CREATE TABLE cart_items (
  id BINARY(16) NOT NULL PRIMARY KEY,
  cart_id BINARY(16) NOT NULL,
  product_id BINARY(16) NOT NULL,
  variant_id BINARY(16),
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(19,2) NOT NULL,
  total_price DECIMAL(19,2) NOT NULL,
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  INDEX idx_cart_items_cart (cart_id),
  INDEX idx_cart_items_product_variant (cart_id, product_id, variant_id)
);
