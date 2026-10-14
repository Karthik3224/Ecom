UPDATE stores
SET delivery_eta_minutes = CASE id
  WHEN 'store-banjara' THEN 35
  WHEN 'store-secunderabad' THEN 40
  ELSE delivery_eta_minutes
END,
updated_at = NOW(6)
WHERE id IN ('store-banjara', 'store-secunderabad');

UPDATE store_delivery_zones z
JOIN stores s ON s.id = z.store_id
SET
  z.estimated_delivery_min = GREATEST(s.delivery_eta_minutes - 5, 5),
  z.estimated_delivery_max = s.delivery_eta_minutes + 10,
  z.updated_at = NOW(6)
WHERE s.id IN ('store-banjara', 'store-secunderabad');
