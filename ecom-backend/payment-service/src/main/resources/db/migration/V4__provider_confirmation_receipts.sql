CREATE TABLE provider_payment_bindings (
  provider_payment_id VARCHAR(128) PRIMARY KEY,
  payment_id VARCHAR(36) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE provider_payment_receipts (
  event_id VARCHAR(128) PRIMARY KEY,
  provider_payment_id VARCHAR(128) NOT NULL,
  evidence_id VARCHAR(128) NOT NULL,
  body_hash VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
