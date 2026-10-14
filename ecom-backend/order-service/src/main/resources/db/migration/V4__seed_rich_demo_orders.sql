INSERT INTO orders(id, customer_id, cart_id, store_id, order_number, status, total_amount, payment_status, created_at, updated_at)
SELECT UUID_TO_BIN('73000000-0000-0000-0000-000000000001'), UUID_TO_BIN('60000000-0000-0000-0000-000000000001'), UUID_TO_BIN('61000000-0000-0000-0000-000000000101'), 'store-gachibowli', 'DEMO-HYD-1001', 'CREATED', 890.00, 'PAID', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'DEMO-HYD-1001');

INSERT INTO orders(id, customer_id, cart_id, store_id, order_number, status, total_amount, payment_status, created_at, updated_at)
SELECT UUID_TO_BIN('73000000-0000-0000-0000-000000000002'), UUID_TO_BIN('60000000-0000-0000-0000-000000000002'), UUID_TO_BIN('61000000-0000-0000-0000-000000000102'), 'store-banjara', 'DEMO-HYD-1002', 'CONFIRMED', 2180.00, 'PAID', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'DEMO-HYD-1002');

INSERT INTO orders(id, customer_id, cart_id, store_id, order_number, status, total_amount, payment_status, created_at, updated_at)
SELECT UUID_TO_BIN('73000000-0000-0000-0000-000000000003'), UUID_TO_BIN('60000000-0000-0000-0000-000000000003'), UUID_TO_BIN('61000000-0000-0000-0000-000000000103'), 'store-secunderabad', 'DEMO-HYD-1003', 'PROCESSING', 1240.00, 'PENDING', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'DEMO-HYD-1003');

INSERT INTO orders(id, customer_id, cart_id, store_id, order_number, status, total_amount, payment_status, created_at, updated_at)
SELECT UUID_TO_BIN('73000000-0000-0000-0000-000000000004'), UUID_TO_BIN('60000000-0000-0000-0000-000000000004'), UUID_TO_BIN('61000000-0000-0000-0000-000000000104'), 'store-koramangala', 'DEMO-BLR-2001', 'SHIPPED', 1890.00, 'PAID', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'DEMO-BLR-2001');

INSERT INTO orders(id, customer_id, cart_id, store_id, order_number, status, total_amount, payment_status, created_at, updated_at)
SELECT UUID_TO_BIN('73000000-0000-0000-0000-000000000005'), UUID_TO_BIN('60000000-0000-0000-0000-000000000005'), UUID_TO_BIN('61000000-0000-0000-0000-000000000105'), 'store-tnagar', 'DEMO-CHN-3001', 'DELIVERED', 1545.00, 'PAID', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'DEMO-CHN-3001');

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('73100000-0000-0000-0000-000000000001'), UUID_TO_BIN('73000000-0000-0000-0000-000000000001'), UUID_TO_BIN('21000000-0000-0000-0000-000000000001'), NULL, 'Andhra Mango Avakaya Pickle', 2, 289.00, 578.00
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('73100000-0000-0000-0000-000000000001'));

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('73100000-0000-0000-0000-000000000002'), UUID_TO_BIN('73000000-0000-0000-0000-000000000001'), UUID_TO_BIN('21000000-0000-0000-0000-000000000011'), NULL, 'Fresh Tomatoes', 5, 42.00, 210.00
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('73100000-0000-0000-0000-000000000002'));

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('73100000-0000-0000-0000-000000000003'), UUID_TO_BIN('73000000-0000-0000-0000-000000000002'), UUID_TO_BIN('21000000-0000-0000-0000-000000000018'), NULL, 'Chicken Curry Cut', 3, 169.00, 507.00
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('73100000-0000-0000-0000-000000000003'));

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('73100000-0000-0000-0000-000000000004'), UUID_TO_BIN('73000000-0000-0000-0000-000000000002'), UUID_TO_BIN('21000000-0000-0000-0000-000000000007'), NULL, 'Premium Cashew Nuts', 2, 359.00, 718.00
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('73100000-0000-0000-0000-000000000004'));

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('73100000-0000-0000-0000-000000000005'), UUID_TO_BIN('73000000-0000-0000-0000-000000000003'), UUID_TO_BIN('21000000-0000-0000-0000-000000000014'), NULL, 'Fresh Carrots', 3, 54.00, 162.00
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('73100000-0000-0000-0000-000000000005'));

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('73100000-0000-0000-0000-000000000006'), UUID_TO_BIN('73000000-0000-0000-0000-000000000004'), UUID_TO_BIN('21000000-0000-0000-0000-000000000009'), NULL, 'Iranian Pistachios', 2, 399.00, 798.00
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('73100000-0000-0000-0000-000000000006'));

INSERT INTO order_items(id, order_id, product_id, variant_id, product_name, quantity, unit_price, total_price)
SELECT UUID_TO_BIN('73100000-0000-0000-0000-000000000007'), UUID_TO_BIN('73000000-0000-0000-0000-000000000005'), UUID_TO_BIN('21000000-0000-0000-0000-000000000022'), NULL, 'Fresh Fish Fillet', 4, 299.00, 1196.00
WHERE NOT EXISTS (SELECT 1 FROM order_items WHERE id = UUID_TO_BIN('73100000-0000-0000-0000-000000000007'));

INSERT INTO order_addresses(id, order_id, address_type, address_line1, address_line2, city, state, country, postal_code)
SELECT UUID_TO_BIN(UUID()), o.id, 'SHIPPING', address_data.address_line1, address_data.address_line2, address_data.city, address_data.state, 'India', address_data.postal_code
FROM orders o
JOIN (
  SELECT 'DEMO-HYD-1001' order_number, 'Gachibowli, Hyderabad' address_line1, 'Near DLF Road' address_line2, 'Hyderabad' city, 'Telangana' state, '500032' postal_code UNION ALL
  SELECT 'DEMO-HYD-1002', 'Banjara Hills, Hyderabad', 'Road No. 12', 'Hyderabad', 'Telangana', '500034' UNION ALL
  SELECT 'DEMO-HYD-1003', 'Begumpet, Hyderabad', 'Near metro station', 'Hyderabad', 'Telangana', '500016' UNION ALL
  SELECT 'DEMO-BLR-2001', 'HSR Layout, Bengaluru', 'Sector 2', 'Bengaluru', 'Karnataka', '560102' UNION ALL
  SELECT 'DEMO-CHN-3001', 'T Nagar, Chennai', 'Near Panagal Park', 'Chennai', 'Tamil Nadu', '600017'
) address_data ON address_data.order_number = o.order_number
WHERE NOT EXISTS (SELECT 1 FROM order_addresses a WHERE a.order_id = o.id AND a.address_type = 'SHIPPING');
