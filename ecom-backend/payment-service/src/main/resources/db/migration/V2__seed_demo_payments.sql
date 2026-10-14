INSERT INTO payments(id, order_id, customer_id, payment_reference, amount, currency, payment_method, status, created_at, updated_at)
SELECT UUID_TO_BIN('66000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       'PAY-1001',
       428.00,
       'INR',
       'DEMO_UPI',
       'SUCCESS',
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE payment_reference = 'PAY-1001');

INSERT INTO payment_transactions(id, payment_id, transaction_reference, transaction_type, amount, status, created_at)
SELECT UUID_TO_BIN('67000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('66000000-0000-0000-0000-000000000001'),
       'TXN-1001-AUTH',
       'AUTHORIZE',
       428.00,
       'SUCCESS',
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM payment_transactions WHERE transaction_reference = 'TXN-1001-AUTH');

INSERT INTO payment_transactions(id, payment_id, transaction_reference, transaction_type, amount, status, created_at)
SELECT UUID_TO_BIN('67000000-0000-0000-0000-000000000002'),
       UUID_TO_BIN('66000000-0000-0000-0000-000000000001'),
       'TXN-1001-CAPTURE',
       'CAPTURE',
       428.00,
       'SUCCESS',
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM payment_transactions WHERE transaction_reference = 'TXN-1001-CAPTURE');
