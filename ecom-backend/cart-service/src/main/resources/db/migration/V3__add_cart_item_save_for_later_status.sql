ALTER TABLE cart_items
  ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER total_price;

CREATE INDEX idx_cart_items_cart_status ON cart_items(cart_id, status);
