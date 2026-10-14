CREATE TABLE order_creation_requests (
  customer_id VARCHAR(36) NOT NULL,
  request_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  order_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (customer_id, request_key),
  UNIQUE KEY uk_order_creation_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
