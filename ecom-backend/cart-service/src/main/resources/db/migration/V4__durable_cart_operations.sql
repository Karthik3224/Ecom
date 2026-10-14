CREATE TABLE cart_write_lock (id INT NOT NULL PRIMARY KEY) ENGINE=InnoDB;
INSERT INTO cart_write_lock (id) VALUES (1);

CREATE TABLE cart_mutation_requests (
  cart_id VARCHAR(36) NOT NULL,
  request_key VARCHAR(128) NOT NULL,
  request_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (cart_id, request_key)
) ENGINE=InnoDB;

CREATE TABLE cart_checkout_claims (
  cart_id VARCHAR(36) NOT NULL PRIMARY KEY,
  request_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;
