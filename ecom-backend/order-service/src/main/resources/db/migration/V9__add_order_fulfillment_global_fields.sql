ALTER TABLE orders
  ADD COLUMN fulfillment_type VARCHAR(40) NULL AFTER delivery_method,
  ADD COLUMN global_approval VARCHAR(40) NULL AFTER fulfillment_type;

CREATE INDEX idx_orders_fulfillment_type ON orders(fulfillment_type);
