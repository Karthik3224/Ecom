INSERT INTO carts(id, customer_id, store_id, status, total_amount, created_at, updated_at)
SELECT UUID_TO_BIN('61000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       'store-gachibowli',
       'ACTIVE',
       428.00,
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM carts WHERE id = UUID_TO_BIN('61000000-0000-0000-0000-000000000001'));

INSERT INTO cart_items(id, cart_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('62000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('61000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('20000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('30000000-0000-0000-0000-000000000002'),
       'Mango Pickle - 500 g Jar',
       1,
       279.00,
       279.00
WHERE NOT EXISTS (SELECT 1 FROM cart_items WHERE id = UUID_TO_BIN('62000000-0000-0000-0000-000000000001'));

INSERT INTO cart_items(id, cart_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('62000000-0000-0000-0000-000000000002'),
       UUID_TO_BIN('61000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('20000000-0000-0000-0000-000000000002'),
       UUID_TO_BIN('30000000-0000-0000-0000-000000000003'),
       'Lemon Pickle - 250 g Jar',
       1,
       149.00,
       149.00
WHERE NOT EXISTS (SELECT 1 FROM cart_items WHERE id = UUID_TO_BIN('62000000-0000-0000-0000-000000000002'));

UPDATE carts
SET total_amount = 428.00,
    updated_at = NOW(6)
WHERE id = UUID_TO_BIN('61000000-0000-0000-0000-000000000001');
