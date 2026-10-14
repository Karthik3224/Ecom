ALTER TABLE checkout_children ADD COLUMN reservation_id VARCHAR(36) NULL;
UPDATE checkout_children SET reservation_id=UUID() WHERE reservation_id IS NULL;
ALTER TABLE checkout_children MODIFY reservation_id VARCHAR(36) NOT NULL;
CREATE UNIQUE INDEX uk_checkout_reservation ON checkout_children(reservation_id);
