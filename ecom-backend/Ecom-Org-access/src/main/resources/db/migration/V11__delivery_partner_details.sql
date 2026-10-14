ALTER TABLE app_users
  ADD COLUMN vehicle_type VARCHAR(40),
  ADD COLUMN vehicle_number VARCHAR(40),
  ADD COLUMN licence_number VARCHAR(60),
  ADD COLUMN address VARCHAR(700);
