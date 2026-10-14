INSERT INTO fulfillment_order_snapshots(order_id, customer_id, store_id, shipping_address_id, fulfillment_type, cancelled, created_at, updated_at)
SELECT UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       'store-gachibowli',
       UUID_TO_BIN('63000000-0000-0000-0000-000000000001'),
       'SHIP_TO_HOME',
       FALSE,
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM fulfillment_order_snapshots WHERE order_id = UUID_TO_BIN('70000000-0000-0000-0000-000000000001'));

INSERT INTO fulfillments(id, order_id, customer_id, store_id, status, fulfillment_type, shipping_address_id, created_at, updated_at)
SELECT UUID_TO_BIN('80000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('60000000-0000-0000-0000-000000000001'),
       'store-gachibowli',
       'SHIPPED',
       'SHIP_TO_HOME',
       UUID_TO_BIN('63000000-0000-0000-0000-000000000001'),
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM fulfillments WHERE order_id = UUID_TO_BIN('70000000-0000-0000-0000-000000000001'));

INSERT INTO shipments(id, fulfillment_id, order_id, carrier, tracking_number, status, shipped_at, delivered_at, estimated_delivery_date, created_at, updated_at)
SELECT UUID_TO_BIN('81000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('80000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('70000000-0000-0000-0000-000000000001'),
       'Delhivery',
       'PKLTRACK1001',
       'IN_TRANSIT',
       NOW(6),
       NULL,
       DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY),
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM shipments WHERE tracking_number = 'PKLTRACK1001');

INSERT INTO tracking_events(id, shipment_id, status, location, description, event_time, created_at)
SELECT UUID_TO_BIN('82000000-0000-0000-0000-000000000001'),
       UUID_TO_BIN('81000000-0000-0000-0000-000000000001'),
       'CREATED',
       'Gachibowli Hub',
       'Pickup confirmed and ready for dispatch.',
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM tracking_events WHERE shipment_id = UUID_TO_BIN('81000000-0000-0000-0000-000000000001') AND status = 'CREATED');

INSERT INTO tracking_events(id, shipment_id, status, location, description, event_time, created_at)
SELECT UUID_TO_BIN('82000000-0000-0000-0000-000000000002'),
       UUID_TO_BIN('81000000-0000-0000-0000-000000000001'),
       'IN_TRANSIT',
       'Madhapur',
       'Package moved to transit route for delivery.',
       NOW(6),
       NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM tracking_events WHERE shipment_id = UUID_TO_BIN('81000000-0000-0000-0000-000000000001') AND status = 'IN_TRANSIT');
