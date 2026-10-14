INSERT INTO notification_templates(id, name, notification_type, channel, subject_template, message_template, status, created_at, updated_at)
SELECT UUID_TO_BIN('51000000-0000-0000-0000-000000000001'), 'pickle-order-created-email', 'ORDER_CREATED', 'EMAIL',
       'Your pickle order {{orderNumber}} is confirmed',
       'Thanks for ordering from Thejo Gachibowli Store. Your order {{orderNumber}} for mango and lemon pickles is confirmed.',
       'ACTIVE', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notification_templates WHERE name = 'pickle-order-created-email');

INSERT INTO notification_templates(id, name, notification_type, channel, subject_template, message_template, status, created_at, updated_at)
SELECT UUID_TO_BIN('51000000-0000-0000-0000-000000000002'), 'pickle-payment-success-email', 'PAYMENT_SUCCESS', 'EMAIL',
       'Payment received for {{orderNumber}}',
       'We received your payment of {{amount}} {{currency}} for order {{orderNumber}}. Your pickles are being packed.',
       'ACTIVE', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notification_templates WHERE name = 'pickle-payment-success-email');

INSERT INTO notification_templates(id, name, notification_type, channel, subject_template, message_template, status, created_at, updated_at)
SELECT UUID_TO_BIN('51000000-0000-0000-0000-000000000003'), 'pickle-shipment-created-email', 'SHIPMENT_CREATED', 'EMAIL',
       'Your pickle order has shipped',
       'Your order {{orderNumber}} has shipped with {{carrier}}. Tracking number: {{trackingNumber}}.',
       'ACTIVE', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notification_templates WHERE name = 'pickle-shipment-created-email');

INSERT INTO notification_templates(id, name, notification_type, channel, subject_template, message_template, status, created_at, updated_at)
SELECT UUID_TO_BIN('51000000-0000-0000-0000-000000000004'), 'pickle-shipment-delivered-email', 'SHIPMENT_DELIVERED', 'EMAIL',
       'Your pickle order was delivered',
       'Your order {{orderNumber}} was delivered. We hope the mango pickle brings proper meal-time joy.',
       'ACTIVE', NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notification_templates WHERE name = 'pickle-shipment-delivered-email');

INSERT INTO notifications(id, customer_id, order_id, notification_type, channel, recipient, subject, message, status, source_event_id, sent_at, created_at, updated_at)
SELECT UUID_TO_BIN('52000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       'ORDER_CREATED', 'EMAIL', 'pickle.customer@example.com',
       'Your pickle order PKL-ORDER-1001 is confirmed',
       'Thanks for ordering from Thejo Gachibowli Store. Your mango pickle and lemon pickle order is confirmed.',
       'SENT',
       UUID_TO_BIN('53000000-0000-0000-0000-000000000001'),
       NOW(6), NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = UUID_TO_BIN('52000000-0000-0000-0000-000000000001'));

INSERT INTO notifications(id, customer_id, order_id, notification_type, channel, recipient, subject, message, status, source_event_id, sent_at, created_at, updated_at)
SELECT UUID_TO_BIN('52000000-0000-0000-0000-000000000002'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       'PAYMENT_SUCCESS', 'EMAIL', 'pickle.customer@example.com',
       'Payment received for PKL-ORDER-1001',
       'We received your payment of 428.00 INR for your pickle order. Your jars are being packed.',
       'SENT',
       UUID_TO_BIN('53000000-0000-0000-0000-000000000002'),
       NOW(6), NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = UUID_TO_BIN('52000000-0000-0000-0000-000000000002'));

INSERT INTO notifications(id, customer_id, order_id, notification_type, channel, recipient, subject, message, status, source_event_id, sent_at, created_at, updated_at)
SELECT UUID_TO_BIN('52000000-0000-0000-0000-000000000003'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       'SHIPMENT_CREATED', 'SMS', '+919999999999',
       'Your pickle order has shipped',
       'PKL-ORDER-1001 shipped with Delhivery. Tracking number: PKLTRACK1001.',
       'SENT',
       UUID_TO_BIN('53000000-0000-0000-0000-000000000003'),
       NOW(6), NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = UUID_TO_BIN('52000000-0000-0000-0000-000000000003'));

INSERT INTO notifications(id, customer_id, order_id, notification_type, channel, recipient, subject, message, status, source_event_id, created_at, updated_at)
SELECT UUID_TO_BIN('52000000-0000-0000-0000-000000000004'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000002'),
       'ORDER_CREATED', 'PUSH', 'demo-device-token-pickle',
       'Garlic pickle order created',
       'Your garlic pickle order PKL-ORDER-1002 is waiting for payment confirmation.',
       'PENDING',
       UUID_TO_BIN('53000000-0000-0000-0000-000000000004'),
       NOW(6), NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE id = UUID_TO_BIN('52000000-0000-0000-0000-000000000004'));
