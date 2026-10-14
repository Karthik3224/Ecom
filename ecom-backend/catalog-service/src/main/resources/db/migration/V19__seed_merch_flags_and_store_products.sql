-- Flag a spread of the demo catalogue as Featured / Special / New Arrival / Best Seller
-- and make every store carry those products, so the customer Home page sections are populated
-- regardless of which store/city the shopper is browsing.

UPDATE products SET featured = TRUE
  WHERE sku IN ('PKL-ANDHRA-AVAKAYA', 'DRY-CAL-ALMOND', 'VEG-FRESH-TOMATO', 'NV-CHICKEN-CURRY');

UPDATE products SET special = TRUE
  WHERE sku IN ('PKL-GONGURA-RED', 'DRY-PREM-CASHEW', 'PKL-GARLIC-GINGER', 'NV-MUTTON-CURRY');

UPDATE products SET new_arrival = TRUE
  WHERE sku IN ('PKL-TOMATO-GARLIC', 'DRY-IRN-PISTA', 'VEG-FRESH-SPINACH', 'NV-FISH-FILLET');

UPDATE products SET best_seller = TRUE
  WHERE sku IN ('PKL-LEMON-GREEN', 'DRY-AFG-RAISIN', 'VEG-FRESH-CARROT', 'NV-FRESH-PRAWNS');

-- Map every flagged product into every demo store (idempotent: unique key is (store_id, product_id)).
INSERT INTO store_products(id, store_id, store_name, product_id, available, price_override, created_at, updated_at)
SELECT UUID_TO_BIN(UUID()), s.store_id, s.store_name, p.id, TRUE, NULL, NOW(6), NOW(6)
FROM products p
JOIN (
  SELECT 'india-store-1-1'   store_id, 'Hyderabad Main Store'        store_name UNION ALL
  SELECT 'india-store-1-3',   'SR Nagar Store'                                  UNION ALL
  SELECT 'store-gachibowli',  'Gachibowli Fresh Hub'                            UNION ALL
  SELECT 'store-banjara',     'Banjara Hills Pickle House'                      UNION ALL
  SELECT 'store-secunderabad','Secunderabad Daily Foods'                        UNION ALL
  SELECT 'store-benzcircle',  'Benz Circle Fresh Basket'                        UNION ALL
  SELECT 'store-governorpet', 'Governorpet Spice Store'                         UNION ALL
  SELECT 'store-poranki',     'Poranki Fresh Mart'                              UNION ALL
  SELECT 'store-tnagar',      'T Nagar Family Foods'                            UNION ALL
  SELECT 'store-adyar',       'Adyar Organic Basket'                            UNION ALL
  SELECT 'store-velachery',   'Velachery Daily Foods'                           UNION ALL
  SELECT 'store-koramangala', 'Koramangala Gourmet Mart'                        UNION ALL
  SELECT 'store-indiranagar', 'Indiranagar Organic Foods'                       UNION ALL
  SELECT 'store-whitefield',  'Whitefield Fresh Basket'
) s
WHERE (p.featured OR p.special OR p.new_arrival OR p.best_seller)
  AND p.status = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 FROM store_products sp
    WHERE sp.store_id = s.store_id AND sp.product_id = p.id
  );
