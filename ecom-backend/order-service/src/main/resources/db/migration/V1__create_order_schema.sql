CREATE TABLE orders (
  id BINARY(16) NOT NULL PRIMARY KEY,
  customer_id BINARY(16) NOT NULL,
  cart_id BINARY(16) NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  order_number VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  total_amount DECIMAL(19,2) NOT NULL,
  payment_status VARCHAR(30) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_orders_order_number UNIQUE (order_number),
  INDEX idx_orders_customer_created (customer_id, created_at),
  INDEX idx_orders_customer_status_created (customer_id, status, created_at),
  INDEX idx_orders_cart (cart_id),
  INDEX idx_orders_store (store_id)
);

CREATE TABLE order_items (
  id BINARY(16) NOT NULL PRIMARY KEY,
  order_id BINARY(16) NOT NULL,
  product_id BINARY(16) NOT NULL,
  variant_id BINARY(16),
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(19,2) NOT NULL,
  total_price DECIMAL(19,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product_variant (product_id, variant_id)
);

CREATE TABLE order_addresses (
  id BINARY(16) NOT NULL PRIMARY KEY,
  order_id BINARY(16) NOT NULL,
  address_type VARCHAR(30) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  country VARCHAR(120) NOT NULL,
  postal_code VARCHAR(30) NOT NULL,
  CONSTRAINT fk_order_addresses_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_addresses_order (order_id),
  INDEX idx_order_addresses_type (order_id, address_type)
);
