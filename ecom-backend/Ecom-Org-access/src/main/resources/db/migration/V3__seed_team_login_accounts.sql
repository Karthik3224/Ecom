-- Development-only team accounts. Disable or replace these credentials before deployment.
INSERT INTO app_users (username, email, password_hash)
VALUES
  ('globaladmin', 'globaladmin@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadmin', 'locationadmin@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanager', 'storemanager@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('deliverypartner', 'deliverypartner@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM app_users u
JOIN roles r ON
  (u.username = 'globaladmin' AND r.name = 'GLOBAL_ADMIN') OR
  (u.username = 'locationadmin' AND r.name = 'LOCATION_ADMIN') OR
  (u.username = 'storemanager' AND r.name = 'STORE_MANAGER') OR
  (u.username = 'deliverypartner' AND r.name = 'DELIVERY_PARTNER');

INSERT INTO memberships (user_id, role_id, organization_id, location_id, store_id)
SELECT u.id, r.id, 'metaarch-commerce',
  CASE WHEN r.name IN ('LOCATION_ADMIN', 'STORE_MANAGER', 'DELIVERY_PARTNER') THEN 'hyderabad' END,
  CASE WHEN r.name IN ('STORE_MANAGER', 'DELIVERY_PARTNER') THEN 'india-store-1-1' END
FROM app_users u
JOIN roles r ON
  (u.username = 'globaladmin' AND r.name = 'GLOBAL_ADMIN') OR
  (u.username = 'locationadmin' AND r.name = 'LOCATION_ADMIN') OR
  (u.username = 'storemanager' AND r.name = 'STORE_MANAGER') OR
  (u.username = 'deliverypartner' AND r.name = 'DELIVERY_PARTNER');
