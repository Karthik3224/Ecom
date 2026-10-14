-- Recipient contact captured on the order's shipping/billing address so downstream
-- consumers (delivery partner portal) can show who to deliver to without a cross-service lookup.
ALTER TABLE order_addresses
  ADD COLUMN recipient_name VARCHAR(180) NULL,
  ADD COLUMN recipient_phone VARCHAR(30) NULL;
