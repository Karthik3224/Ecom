ALTER TABLE orders
  ADD COLUMN route_distance_meters BIGINT NULL AFTER calculated_distance_km,
  ADD COLUMN route_duration_seconds INT NULL AFTER route_distance_meters,
  ADD COLUMN route_duration_minutes INT NULL AFTER route_duration_seconds,
  ADD COLUMN matched_zone_label VARCHAR(80) NULL AFTER route_duration_minutes;
