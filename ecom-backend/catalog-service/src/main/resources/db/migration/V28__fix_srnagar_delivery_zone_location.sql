UPDATE store_delivery_zones
SET location_id = 'hyderabad'
WHERE id = 16
  AND store_id = 'india-store-1-3'
  AND location_id IS NULL;
