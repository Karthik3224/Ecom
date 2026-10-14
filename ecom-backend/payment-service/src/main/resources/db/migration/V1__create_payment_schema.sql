CREATE TABLE payments (
  id BINARY(16) NOT NULL PRIMARY KEY,
  order_id BINARY(16) NOT NULL,
  customer_id BINARY(16) NOT NULL,
  payment_reference VARCHAR(50) NOT NULL,
  amount DECIMAL(19,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT uk_payments_payment_reference UNIQUE (payment_reference),
  CONSTRAINT uk_payments_order UNIQUE (order_id),
  INDEX idx_payments_order (order_id),
  INDEX idx_payments_customer_created (customer_id, created_at),
  INDEX idx_payments_status_created (status, created_at)
);

CREATE TABLE payment_transactions (
  id BINARY(16) NOT NULL PRIMARY KEY,
  payment_id BINARY(16) NOT NULL,
  transaction_reference VARCHAR(60) NOT NULL,
  transaction_type VARCHAR(30) NOT NULL,
  amount DECIMAL(19,2) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  CONSTRAINT fk_payment_transactions_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  CONSTRAINT uk_payment_transactions_reference UNIQUE (transaction_reference),
  INDEX idx_payment_transactions_payment (payment_id),
  INDEX idx_payment_transactions_type_status (transaction_type, status)
);
