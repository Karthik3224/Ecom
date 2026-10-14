DELETE sp
FROM store_products sp
JOIN products p ON p.id = sp.product_id
WHERE p.sku IN (
  'PKL-ANDHRA-AVAKAYA', 'PKL-GONGURA-RED', 'PKL-GARLIC-GINGER', 'PKL-LEMON-GREEN', 'PKL-TOMATO-GARLIC',
  'DRY-CAL-ALMOND', 'DRY-PREM-CASHEW', 'DRY-AFG-RAISIN', 'DRY-IRN-PISTA', 'DRY-PREM-WALNUT',
  'VEG-FRESH-TOMATO', 'VEG-FRESH-POTATO', 'VEG-GREEN-CHILLI', 'VEG-FRESH-CARROT', 'VEG-LADY-FINGER', 'VEG-FRESH-BRINJAL', 'VEG-FRESH-SPINACH',
  'NV-CHICKEN-CURRY', 'NV-CHICKEN-BONELESS', 'NV-CHICKEN-BREAST', 'NV-MUTTON-CURRY', 'NV-FISH-FILLET', 'NV-FRESH-PRAWNS'
)
OR LOWER(p.name) = 'karthik'
OR LOWER(p.sku) = 'dfrefc13';

DELETE sp
FROM store_products sp
JOIN products p ON p.id = sp.product_id
WHERE p.status = 'INACTIVE'
   OR p.sku IN ('PKL-MANGO', 'PKL-LEMON', 'PKL-GARLIC', 'SPC-RED-CHILLI', 'DRY-CASHEW', 'SPC-TURMERIC')
   OR p.slug IN ('mango-pickle', 'avakaya-pickle', 'lemon-pickle', 'gongura-pickle', 'garlic-pickle', 'red-chilli-powder', 'turmeric-powder', 'premium-cashews', 'premium-jumbo-cashews');

DELETE i
FROM product_images i
JOIN products p ON p.id = i.product_id
WHERE p.sku IN ('PKL-MANGO', 'PKL-LEMON', 'PKL-GARLIC', 'SPC-RED-CHILLI', 'DRY-CASHEW', 'SPC-TURMERIC')
   OR p.slug IN ('mango-pickle', 'avakaya-pickle', 'lemon-pickle', 'gongura-pickle', 'garlic-pickle', 'red-chilli-powder', 'turmeric-powder', 'premium-cashews', 'premium-jumbo-cashews');

DELETE v
FROM product_variants v
JOIN products p ON p.id = v.product_id
WHERE p.sku IN ('PKL-MANGO', 'PKL-LEMON', 'PKL-GARLIC', 'SPC-RED-CHILLI', 'DRY-CASHEW', 'SPC-TURMERIC')
   OR p.slug IN ('mango-pickle', 'avakaya-pickle', 'lemon-pickle', 'gongura-pickle', 'garlic-pickle', 'red-chilli-powder', 'turmeric-powder', 'premium-cashews', 'premium-jumbo-cashews');

DELETE FROM products
WHERE sku IN ('PKL-MANGO', 'PKL-LEMON', 'PKL-GARLIC', 'SPC-RED-CHILLI', 'DRY-CASHEW', 'SPC-TURMERIC')
   OR slug IN ('mango-pickle', 'avakaya-pickle', 'lemon-pickle', 'gongura-pickle', 'garlic-pickle', 'red-chilli-powder', 'turmeric-powder', 'premium-cashews', 'premium-jumbo-cashews');

INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), demo.store_id, demo.store_name, p.id, TRUE, demo.price_override, NOW(6), NOW(6)
FROM products p
JOIN (
  SELECT 'india-store-1-1' store_id, 'Hyderabad Main Store' store_name, 'PKL-ANDHRA-AVAKAYA' sku, NULL price_override UNION ALL
  SELECT 'india-store-1-1', 'Hyderabad Main Store', 'DRY-CAL-ALMOND', NULL UNION ALL
  SELECT 'india-store-1-1', 'Hyderabad Main Store', 'DRY-PREM-CASHEW', NULL UNION ALL
  SELECT 'india-store-1-1', 'Hyderabad Main Store', 'VEG-FRESH-TOMATO', NULL UNION ALL
  SELECT 'india-store-1-1', 'Hyderabad Main Store', 'VEG-FRESH-POTATO', NULL UNION ALL
  SELECT 'india-store-1-1', 'Hyderabad Main Store', 'VEG-GREEN-CHILLI', NULL UNION ALL
  SELECT 'india-store-1-1', 'Hyderabad Main Store', 'NV-CHICKEN-CURRY', NULL UNION ALL
  SELECT 'india-store-1-1', 'Hyderabad Main Store', 'NV-CHICKEN-BONELESS', NULL UNION ALL

  SELECT 'india-store-1-3', 'SR Nagar Store', 'PKL-GONGURA-RED', NULL UNION ALL
  SELECT 'india-store-1-3', 'SR Nagar Store', 'PKL-GARLIC-GINGER', NULL UNION ALL
  SELECT 'india-store-1-3', 'SR Nagar Store', 'DRY-CAL-ALMOND', NULL UNION ALL
  SELECT 'india-store-1-3', 'SR Nagar Store', 'DRY-AFG-RAISIN', NULL UNION ALL
  SELECT 'india-store-1-3', 'SR Nagar Store', 'VEG-FRESH-CARROT', NULL UNION ALL
  SELECT 'india-store-1-3', 'SR Nagar Store', 'VEG-LADY-FINGER', NULL UNION ALL
  SELECT 'india-store-1-3', 'SR Nagar Store', 'VEG-FRESH-SPINACH', NULL UNION ALL

  SELECT 'store-gachibowli', 'Gachibowli Fresh Hub', 'PKL-ANDHRA-AVAKAYA', NULL UNION ALL
  SELECT 'store-gachibowli', 'Gachibowli Fresh Hub', 'PKL-TOMATO-GARLIC', NULL UNION ALL
  SELECT 'store-gachibowli', 'Gachibowli Fresh Hub', 'DRY-PREM-CASHEW', NULL UNION ALL
  SELECT 'store-gachibowli', 'Gachibowli Fresh Hub', 'DRY-IRN-PISTA', NULL UNION ALL
  SELECT 'store-gachibowli', 'Gachibowli Fresh Hub', 'VEG-FRESH-TOMATO', NULL UNION ALL
  SELECT 'store-gachibowli', 'Gachibowli Fresh Hub', 'VEG-FRESH-BRINJAL', NULL UNION ALL
  SELECT 'store-gachibowli', 'Gachibowli Fresh Hub', 'NV-MUTTON-CURRY', NULL UNION ALL

  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'PKL-ANDHRA-AVAKAYA', NULL UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'PKL-GONGURA-RED', NULL UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'PKL-GARLIC-GINGER', NULL UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'DRY-PREM-CASHEW', NULL UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'NV-CHICKEN-CURRY', NULL UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'NV-CHICKEN-BONELESS', NULL UNION ALL

  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-FRESH-TOMATO', NULL UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-FRESH-POTATO', NULL UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-GREEN-CHILLI', NULL UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-FRESH-CARROT', NULL UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-LADY-FINGER', NULL UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'NV-FRESH-PRAWNS', NULL UNION ALL

  SELECT 'store-tnagar', 'T Nagar Family Foods', 'PKL-LEMON-GREEN', NULL UNION ALL
  SELECT 'store-tnagar', 'T Nagar Family Foods', 'PKL-TOMATO-GARLIC', NULL UNION ALL
  SELECT 'store-tnagar', 'T Nagar Family Foods', 'DRY-CAL-ALMOND', NULL UNION ALL
  SELECT 'store-tnagar', 'T Nagar Family Foods', 'VEG-FRESH-TOMATO', NULL UNION ALL
  SELECT 'store-tnagar', 'T Nagar Family Foods', 'VEG-FRESH-SPINACH', NULL UNION ALL
  SELECT 'store-tnagar', 'T Nagar Family Foods', 'NV-FISH-FILLET', NULL UNION ALL

  SELECT 'store-adyar', 'Adyar Organic Basket', 'PKL-GARLIC-GINGER', NULL UNION ALL
  SELECT 'store-adyar', 'Adyar Organic Basket', 'DRY-PREM-WALNUT', NULL UNION ALL
  SELECT 'store-adyar', 'Adyar Organic Basket', 'VEG-FRESH-TOMATO', NULL UNION ALL
  SELECT 'store-adyar', 'Adyar Organic Basket', 'VEG-FRESH-CARROT', NULL UNION ALL
  SELECT 'store-adyar', 'Adyar Organic Basket', 'VEG-FRESH-SPINACH', NULL UNION ALL
  SELECT 'store-adyar', 'Adyar Organic Basket', 'NV-FRESH-PRAWNS', NULL UNION ALL

  SELECT 'store-velachery', 'Velachery Daily Foods', 'PKL-LEMON-GREEN', NULL UNION ALL
  SELECT 'store-velachery', 'Velachery Daily Foods', 'DRY-AFG-RAISIN', NULL UNION ALL
  SELECT 'store-velachery', 'Velachery Daily Foods', 'VEG-FRESH-POTATO', NULL UNION ALL
  SELECT 'store-velachery', 'Velachery Daily Foods', 'NV-CHICKEN-CURRY', NULL UNION ALL
  SELECT 'store-velachery', 'Velachery Daily Foods', 'NV-CHICKEN-BONELESS', NULL UNION ALL
  SELECT 'store-velachery', 'Velachery Daily Foods', 'NV-CHICKEN-BREAST', NULL UNION ALL
  SELECT 'store-velachery', 'Velachery Daily Foods', 'NV-FISH-FILLET', NULL UNION ALL

  SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'PKL-TOMATO-GARLIC', NULL UNION ALL
  SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'DRY-CAL-ALMOND', NULL UNION ALL
  SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'DRY-IRN-PISTA', NULL UNION ALL
  SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'VEG-FRESH-CARROT', NULL UNION ALL
  SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'NV-FISH-FILLET', NULL UNION ALL

  SELECT 'store-indiranagar', 'Indiranagar Organic Foods', 'PKL-GONGURA-RED', NULL UNION ALL
  SELECT 'store-indiranagar', 'Indiranagar Organic Foods', 'DRY-PREM-WALNUT', NULL UNION ALL
  SELECT 'store-indiranagar', 'Indiranagar Organic Foods', 'VEG-FRESH-TOMATO', NULL UNION ALL
  SELECT 'store-indiranagar', 'Indiranagar Organic Foods', 'VEG-FRESH-SPINACH', NULL UNION ALL
  SELECT 'store-indiranagar', 'Indiranagar Organic Foods', 'NV-CHICKEN-BONELESS', NULL UNION ALL

  SELECT 'store-whitefield', 'Whitefield Fresh Basket', 'PKL-ANDHRA-AVAKAYA', NULL UNION ALL
  SELECT 'store-whitefield', 'Whitefield Fresh Basket', 'DRY-PREM-CASHEW', NULL UNION ALL
  SELECT 'store-whitefield', 'Whitefield Fresh Basket', 'VEG-FRESH-POTATO', NULL UNION ALL
  SELECT 'store-whitefield', 'Whitefield Fresh Basket', 'VEG-FRESH-BRINJAL', NULL UNION ALL
  SELECT 'store-whitefield', 'Whitefield Fresh Basket', 'NV-MUTTON-CURRY', NULL UNION ALL

  SELECT 'store-benzcircle', 'Benz Circle Fresh Basket', 'PKL-TOMATO-GARLIC', NULL UNION ALL
  SELECT 'store-benzcircle', 'Benz Circle Fresh Basket', 'DRY-AFG-RAISIN', NULL UNION ALL
  SELECT 'store-benzcircle', 'Benz Circle Fresh Basket', 'VEG-FRESH-TOMATO', NULL UNION ALL
  SELECT 'store-benzcircle', 'Benz Circle Fresh Basket', 'VEG-GREEN-CHILLI', NULL UNION ALL
  SELECT 'store-benzcircle', 'Benz Circle Fresh Basket', 'NV-FRESH-PRAWNS', NULL UNION ALL

  SELECT 'store-governorpet', 'Governorpet Spice Store', 'PKL-GARLIC-GINGER', NULL UNION ALL
  SELECT 'store-governorpet', 'Governorpet Spice Store', 'PKL-LEMON-GREEN', NULL UNION ALL
  SELECT 'store-governorpet', 'Governorpet Spice Store', 'DRY-IRN-PISTA', NULL UNION ALL
  SELECT 'store-governorpet', 'Governorpet Spice Store', 'VEG-FRESH-CARROT', NULL UNION ALL
  SELECT 'store-governorpet', 'Governorpet Spice Store', 'NV-CHICKEN-CURRY', NULL UNION ALL

  SELECT 'store-poranki', 'Poranki Fresh Mart', 'PKL-GONGURA-RED', NULL UNION ALL
  SELECT 'store-poranki', 'Poranki Fresh Mart', 'DRY-PREM-WALNUT', NULL UNION ALL
  SELECT 'store-poranki', 'Poranki Fresh Mart', 'VEG-FRESH-POTATO', NULL UNION ALL
  SELECT 'store-poranki', 'Poranki Fresh Mart', 'VEG-LADY-FINGER', NULL UNION ALL
  SELECT 'store-poranki', 'Poranki Fresh Mart', 'NV-MUTTON-CURRY', NULL UNION ALL

  SELECT 'store-velachery', 'Velachery Daily Foods', 'dfrefc13', NULL
) demo ON demo.sku = p.sku OR (demo.sku = 'dfrefc13' AND (LOWER(p.name) = 'karthik' OR LOWER(p.sku) = 'dfrefc13'))
WHERE NOT EXISTS (
  SELECT 1 FROM store_products sp
  WHERE sp.store_id = demo.store_id
    AND sp.product_id = p.id
);
