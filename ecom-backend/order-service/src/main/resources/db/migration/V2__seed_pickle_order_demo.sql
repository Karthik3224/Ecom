INSERT INTO orders(id, customer_id, cart_id, store_id, order_number, status, total_amount, payment_status, created_at, updated_at)
SELECT UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('61000000-0000-0000-0000-000000000001'),
       'store-gachibowli',
       'PKL-ORDER-1001',
       'CREATED',
       428.00,
       'SUCCESS',
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE id = UUID_TO_BIN('70000000-0000-0000-0000-000000000001'));

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('71000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('20000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('30000000-0000-0000-0000-000000000002'),
       'Mango Pickle - 500 g Jar',
       1,
       279.00,
       279.00
WHERE EXISTS (SELECT 1 FROM orders WHERE id = UUID_TO_BIN('70000000-0000-0000-0000-000000000001'))
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('71000000-0000-0000-0000-000000000001'));

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('71000000-0000-0000-0000-000000000002'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('20000000-0000-0000-0000-000000000002'),
       UUID_TO_BIN('30000000-0000-0000-0000-000000000003'),
       'Lemon Pickle - 250 g Jar',
       1,
       129.00,
       129.00
WHERE EXISTS (SELECT 1 FROM orders WHERE id = UUID_TO_BIN('70000000-0000-0000-0000-000000000001'))
  AND NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('71000000-0000-0000-0000-000000000002'));

INSERT INTO order_addresses(id, order_id, address_type, address_line1, address_line2, city, state, country, postal_code)
SELECT UUID_TO_BIN('72000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       'SHIPPING',
       'Plot 24, Pickle Demo Street',
       'Near Gachibowli Circle',
       'Hyderabad',
       'Telangana',
       'India',
       '500032'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = UUID_TO_BIN('70000000-0000-0000-0000-000000000001'))
  AND NOT EXISTS (SELECT 1 FROM order_addresses WHERE id = UUID_TO_BIN('72000000-0000-0000-0000-000000000001'));
