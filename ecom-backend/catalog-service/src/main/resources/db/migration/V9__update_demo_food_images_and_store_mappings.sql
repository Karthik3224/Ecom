UPDATE categories
SET thumbnail_url = CASE slug
  WHEN 'traditional-pickles' THEN 'https://loremflickr.com/900/650/indian,pickle,food?lock=101'
  WHEN 'premium-dry-fruits' THEN 'https://loremflickr.com/900/650/dry-fruits,nuts,food?lock=102'
  WHEN 'fresh-vegetables' THEN 'https://loremflickr.com/900/650/fresh,vegetables,market?lock=103'
  WHEN 'fresh-non-veg' THEN 'https://loremflickr.com/900/650/fresh,meat,seafood?lock=104'
  ELSE thumbnail_url
END,
updated_at = NOW(6)
WHERE slug IN ('traditional-pickles', 'premium-dry-fruits', 'fresh-vegetables', 'fresh-non-veg');

UPDATE product_images i
JOIN products p ON p.id = i.product_id
SET i.url = CASE p.sku
  WHEN 'PKL-ANDHRA-AVAKAYA' THEN 'https://loremflickr.com/900/700/mango,pickle,indian-food?lock=201'
  WHEN 'PKL-GONGURA-RED' THEN 'https://loremflickr.com/900/700/pickle,leafy,indian-food?lock=202'
  WHEN 'PKL-GARLIC-GINGER' THEN 'https://loremflickr.com/900/700/garlic,ginger,food?lock=203'
  WHEN 'PKL-LEMON-GREEN' THEN 'https://loremflickr.com/900/700/lemon,chilli,pickle?lock=204'
  WHEN 'PKL-TOMATO-GARLIC' THEN 'https://loremflickr.com/900/700/tomato,pickle,food?lock=205'
  WHEN 'DRY-CAL-ALMOND' THEN 'https://loremflickr.com/900/700/almonds,nuts,food?lock=206'
  WHEN 'DRY-PREM-CASHEW' THEN 'https://loremflickr.com/900/700/cashew,nuts,food?lock=207'
  WHEN 'DRY-AFG-RAISIN' THEN 'https://loremflickr.com/900/700/raisins,dry-fruits,food?lock=208'
  WHEN 'DRY-IRN-PISTA' THEN 'https://loremflickr.com/900/700/pistachios,nuts,food?lock=209'
  WHEN 'DRY-PREM-WALNUT' THEN 'https://loremflickr.com/900/700/walnuts,nuts,food?lock=210'
  WHEN 'VEG-FRESH-TOMATO' THEN 'https://loremflickr.com/900/700/tomatoes,vegetables,food?lock=211'
  WHEN 'VEG-FRESH-POTATO' THEN 'https://loremflickr.com/900/700/potatoes,vegetables,food?lock=212'
  WHEN 'VEG-GREEN-CHILLI' THEN 'https://loremflickr.com/900/700/green-chilli,vegetables,food?lock=213'
  WHEN 'VEG-FRESH-CARROT' THEN 'https://loremflickr.com/900/700/carrots,vegetables,food?lock=214'
  WHEN 'VEG-LADY-FINGER' THEN 'https://loremflickr.com/900/700/okra,vegetables,food?lock=215'
  WHEN 'VEG-FRESH-BRINJAL' THEN 'https://loremflickr.com/900/700/eggplant,vegetables,food?lock=216'
  WHEN 'VEG-FRESH-SPINACH' THEN 'https://loremflickr.com/900/700/spinach,vegetables,food?lock=217'
  WHEN 'NV-CHICKEN-CURRY' THEN 'https://loremflickr.com/900/700/chicken,meat,food?lock=218'
  WHEN 'NV-CHICKEN-BONELESS' THEN 'https://loremflickr.com/900/700/chicken,boneless,food?lock=219'
  WHEN 'NV-CHICKEN-BREAST' THEN 'https://loremflickr.com/900/700/chicken-breast,food?lock=220'
  WHEN 'NV-MUTTON-CURRY' THEN 'https://loremflickr.com/900/700/mutton,meat,food?lock=221'
  WHEN 'NV-FISH-FILLET' THEN 'https://loremflickr.com/900/700/fish,seafood,food?lock=222'
  WHEN 'NV-FRESH-PRAWNS' THEN 'https://loremflickr.com/900/700/prawns,seafood,food?lock=223'
  ELSE i.url
END,
i.updated_at = NOW(6)
WHERE p.sku IN (
  'PKL-ANDHRA-AVAKAYA', 'PKL-GONGURA-RED', 'PKL-GARLIC-GINGER', 'PKL-LEMON-GREEN', 'PKL-TOMATO-GARLIC',
  'DRY-CAL-ALMOND', 'DRY-PREM-CASHEW', 'DRY-AFG-RAISIN', 'DRY-IRN-PISTA', 'DRY-PREM-WALNUT',
  'VEG-FRESH-TOMATO', 'VEG-FRESH-POTATO', 'VEG-GREEN-CHILLI', 'VEG-FRESH-CARROT', 'VEG-LADY-FINGER', 'VEG-FRESH-BRINJAL', 'VEG-FRESH-SPINACH',
  'NV-CHICKEN-CURRY', 'NV-CHICKEN-BONELESS', 'NV-CHICKEN-BREAST', 'NV-MUTTON-CURRY', 'NV-FISH-FILLET', 'NV-FRESH-PRAWNS'
);

UPDATE store_products
SET store_name = 'Gachibowli Fresh Hub',
    updated_at = NOW(6)
WHERE store_id = 'store-gachibowli';

INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), store_data.store_id, store_data.store_name, p.id, TRUE, NULL, NOW(6), NOW(6)
FROM products p
JOIN (
  SELECT 'store-banjara' store_id, 'Banjara Hills Pickle House' store_name, 'PKL-ANDHRA-AVAKAYA' sku UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'PKL-GONGURA-RED' UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'PKL-GARLIC-GINGER' UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'DRY-PREM-CASHEW' UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'NV-CHICKEN-CURRY' UNION ALL
  SELECT 'store-banjara', 'Banjara Hills Pickle House', 'NV-CHICKEN-BONELESS' UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-FRESH-TOMATO' UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-FRESH-POTATO' UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-GREEN-CHILLI' UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-FRESH-CARROT' UNION ALL
  SELECT 'store-secunderabad', 'Secunderabad Daily Foods', 'VEG-LADY-FINGER' UNION ALL
  SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'DRY-CAL-ALMOND' UNION ALL
  SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'DRY-IRN-PISTA' UNION ALL
  SELECT 'store-koramangala', 'Koramangala Gourmet Mart', 'VEG-FRESH-CARROT' UNION ALL
  SELECT 'store-indiranagar', 'Indiranagar Organic Foods', 'VEG-FRESH-TOMATO' UNION ALL
  SELECT 'store-indiranagar', 'Indiranagar Organic Foods', 'VEG-FRESH-SPINACH' UNION ALL
  SELECT 'store-tnagar', 'T Nagar Family Foods', 'PKL-LEMON-GREEN' UNION ALL
  SELECT 'store-tnagar', 'T Nagar Family Foods', 'NV-FISH-FILLET' UNION ALL
  SELECT 'store-benzcircle', 'Benz Circle Fresh Basket', 'PKL-TOMATO-GARLIC' UNION ALL
  SELECT 'store-benzcircle', 'Benz Circle Fresh Basket', 'DRY-AFG-RAISIN'
) store_data ON store_data.sku = p.sku
WHERE NOT EXISTS (
  SELECT 1 FROM store_products sp WHERE sp.store_id = store_data.store_id AND sp.product_id = p.id
);
