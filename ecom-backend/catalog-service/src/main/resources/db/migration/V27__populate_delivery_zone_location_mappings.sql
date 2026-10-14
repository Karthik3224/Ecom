UPDATE store_delivery_zones
SET location_id = CASE id
  WHEN 1 THEN 'hyderabad'
  WHEN 2 THEN 'hyderabad'
  WHEN 3 THEN 'chennai'
  WHEN 4 THEN 'hyderabad'
  WHEN 5 THEN 'vijayawada'
  WHEN 6 THEN 'hyderabad'
  WHEN 7 THEN 'vijayawada'
  WHEN 8 THEN 'bengaluru'
  WHEN 9 THEN 'bengaluru'
  WHEN 10 THEN 'vijayawada'
  WHEN 11 THEN 'hyderabad'
  WHEN 12 THEN 'chennai'
  WHEN 13 THEN 'chennai'
  WHEN 14 THEN 'bengaluru'
  ELSE location_id
END
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
