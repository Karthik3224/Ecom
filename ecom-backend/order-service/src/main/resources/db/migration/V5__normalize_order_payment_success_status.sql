UPDATE orders
SET payment_status = 'SUCCESS'
WHERE payment_status = 'PAID';
