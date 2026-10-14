SET @add_product_subcategory = (
  SELECT IF(COUNT(*) = 0, 'ALTER TABLE products ADD COLUMN subcategory VARCHAR(80) NULL AFTER category_id', 'SELECT 1')
  FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'products' AND column_name = 'subcategory'
);
PREPARE add_product_subcategory_stmt FROM @add_product_subcategory;
EXECUTE add_product_subcategory_stmt;
DEALLOCATE PREPARE add_product_subcategory_stmt;

UPDATE products SET subcategory = 'Other' WHERE subcategory IS NULL OR TRIM(subcategory) = '';

UPDATE products SET subcategory = CASE sku
  WHEN 'PKL-ANDHRA-AVAKAYA' THEN 'Mango Pickles'
  WHEN 'PKL-GONGURA-RED' THEN 'Chilli Pickles'
  WHEN 'PKL-GARLIC-GINGER' THEN 'Other'
  WHEN 'PKL-LEMON-GREEN' THEN 'Chilli Pickles'
  WHEN 'PKL-TOMATO-GARLIC' THEN 'Other'
  WHEN 'DRY-CAL-ALMOND' THEN 'Nuts'
  WHEN 'DRY-PREM-CASHEW' THEN 'Nuts'
  WHEN 'DRY-AFG-RAISIN' THEN 'Dried Fruits'
  WHEN 'DRY-IRN-PISTA' THEN 'Nuts'
  WHEN 'DRY-PREM-WALNUT' THEN 'Other'
  WHEN 'VEG-FRESH-TOMATO' THEN 'Other'
  WHEN 'VEG-FRESH-POTATO' THEN 'Root Vegetables'
  WHEN 'VEG-GREEN-CHILLI' THEN 'Other'
  WHEN 'VEG-FRESH-CARROT' THEN 'Root Vegetables'
  WHEN 'VEG-LADY-FINGER' THEN 'Other'
  WHEN 'VEG-FRESH-BRINJAL' THEN 'Other'
  WHEN 'VEG-FRESH-SPINACH' THEN 'Leafy Greens'
  WHEN 'NV-CHICKEN-CURRY' THEN 'Poultry'
  WHEN 'NV-CHICKEN-BONELESS' THEN 'Poultry'
  WHEN 'NV-CHICKEN-BREAST' THEN 'Poultry'
  WHEN 'NV-MUTTON-CURRY' THEN 'Mutton'
  WHEN 'NV-FISH-FILLET' THEN 'Seafood'
  WHEN 'NV-FRESH-PRAWNS' THEN 'Seafood'
  ELSE COALESCE(NULLIF(TRIM(subcategory), ''), 'Other')
END;
