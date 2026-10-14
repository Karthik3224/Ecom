CREATE TABLE checkout_reservation_lock (id INT NOT NULL PRIMARY KEY);
INSERT INTO checkout_reservation_lock(id) VALUES (1);
CREATE TABLE checkout_reservations (
  child_id VARCHAR(36) NOT NULL PRIMARY KEY,
  checkout_id VARCHAR(36) NOT NULL,
  customer_id VARCHAR(36) NOT NULL,
  store_id VARCHAR(100) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  state VARCHAR(24) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE checkout_reservation_lines (
  child_id VARCHAR(36) NOT NULL,
  inventory_id BINARY(16) NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY(child_id, inventory_id),
  CONSTRAINT fk_reservation_line_child FOREIGN KEY(child_id) REFERENCES checkout_reservations(child_id),
  CONSTRAINT fk_reservation_line_inventory FOREIGN KEY(inventory_id) REFERENCES inventories(id),
  CONSTRAINT chk_reservation_quantity CHECK(quantity > 0)
) ENGINE=InnoDB;
CREATE TABLE checkout_reservation_audit (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  child_id VARCHAR(36) NOT NULL,
  previous_state VARCHAR(24) NULL,
  next_state VARCHAR(24) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reservation_audit_child FOREIGN KEY(child_id) REFERENCES checkout_reservations(child_id)
) ENGINE=InnoDB;
