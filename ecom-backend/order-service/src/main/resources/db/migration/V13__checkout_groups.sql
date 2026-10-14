CREATE TABLE checkout_groups (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  request_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  request_payload LONGTEXT NOT NULL,
  state VARCHAR(32) NOT NULL,
  handling_policy VARCHAR(32) NOT NULL,
  aggregate_total DECIMAL(19,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_checkout_customer_key (customer_id, request_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE checkout_children (
  checkout_id VARCHAR(36) NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  cart_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36) NULL,
  state VARCHAR(32) NOT NULL,
  handling_fee DECIMAL(19,2) NOT NULL,
  PRIMARY KEY (checkout_id, store_id),
  UNIQUE KEY uk_checkout_cart (cart_id),
  UNIQUE KEY uk_checkout_child_order (order_id),
  CONSTRAINT fk_checkout_child_group FOREIGN KEY (checkout_id) REFERENCES checkout_groups(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

CREATE TABLE checkout_audit (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  checkout_id VARCHAR(36) NOT NULL,
  previous_state VARCHAR(32) NULL,
  next_state VARCHAR(32) NOT NULL,
  actor VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_checkout_audit_group FOREIGN KEY (checkout_id) REFERENCES checkout_groups(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
