UPDATE orders
SET payment_status = 'PAID'
WHERE payment_status = 'SUCCESS'
  AND id = UUID_TO_BIN('70000000-0000-0000-0000-000000000001');
