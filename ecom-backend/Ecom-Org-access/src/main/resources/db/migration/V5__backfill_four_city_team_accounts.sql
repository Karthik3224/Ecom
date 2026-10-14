-- Backfill all real four-city team accounts. Password for all accounts is admin123.
CREATE TABLE IF NOT EXISTS memberships (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  organization_id VARCHAR(100),
  location_id VARCHAR(100),
  store_id VARCHAR(100),
  FOREIGN KEY (user_id) REFERENCES app_users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT IGNORE INTO roles(name)
VALUES ('SUPER_ADMIN'), ('GLOBAL_ADMIN'), ('LOCATION_ADMIN'), ('STORE_MANAGER'), ('DELIVERY_PARTNER'), ('CUSTOMER');

DELETE m FROM memberships m
JOIN app_users u ON u.id = m.user_id
JOIN roles r ON r.id = m.role_id
WHERE (u.username = 'storemanager' AND r.name = 'STORE_MANAGER' AND m.store_id = 'india-store-1-1')
   OR (u.username = 'deliverypartner' AND r.name = 'DELIVERY_PARTNER' AND m.store_id = 'india-store-1-1');

INSERT INTO app_users (username, email, password_hash, enabled, locked)
VALUES
  ('globaladmin', 'globaladmin@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('locationadmin', 'locationadmin@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('locationadminhyd2', 'locationadminhyd2@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('locationadminvja', 'locationadminvja@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('locationadminvja2', 'locationadminvja2@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('locationadminchn', 'locationadminchn@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('locationadminchn2', 'locationadminchn2@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('locationadminblr', 'locationadminblr@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('locationadminblr2', 'locationadminblr2@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanager', 'storemanager@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagerhydmain', 'storemanagerhydmain@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagerbanjara', 'storemanagerbanjara@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagersecunderabad', 'storemanagersecunderabad@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagerbenzcircle', 'storemanagerbenzcircle@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagergovernorpet', 'storemanagergovernorpet@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagerporanki', 'storemanagerporanki@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagertnagar', 'storemanagertnagar@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanageradyar', 'storemanageradyar@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagervelachery', 'storemanagervelachery@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagerblr', 'storemanagerblr@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagerindiranagar', 'storemanagerindiranagar@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('storemanagerwhitefield', 'storemanagerwhitefield@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE),
  ('deliverypartner', 'deliverypartner@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.', TRUE, FALSE)
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  password_hash = VALUES(password_hash),
  enabled = TRUE,
  locked = FALSE;

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM app_users u
JOIN (
  SELECT 'globaladmin' username, 'GLOBAL_ADMIN' role_name UNION ALL
  SELECT 'locationadmin', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminhyd2', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminvja', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminvja2', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminchn', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminchn2', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminblr', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminblr2', 'LOCATION_ADMIN' UNION ALL
  SELECT 'storemanager', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerhydmain', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerbanjara', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagersecunderabad', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerbenzcircle', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagergovernorpet', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerporanki', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagertnagar', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanageradyar', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagervelachery', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerblr', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerindiranagar', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerwhitefield', 'STORE_MANAGER' UNION ALL
  SELECT 'deliverypartner', 'DELIVERY_PARTNER'
) seeded ON seeded.username = u.username
JOIN roles r ON r.name = seeded.role_name;

INSERT INTO memberships (user_id, role_id, organization_id, location_id, store_id)
SELECT u.id, r.id, 'metaarch-commerce', seeded.location_id, seeded.store_id
FROM app_users u
JOIN (
  SELECT 'globaladmin' username, NULL location_id, NULL store_id UNION ALL
  SELECT 'locationadmin', 'hyderabad', NULL UNION ALL
  SELECT 'locationadminhyd2', 'hyderabad', NULL UNION ALL
  SELECT 'locationadminvja', 'vijayawada', NULL UNION ALL
  SELECT 'locationadminvja2', 'vijayawada', NULL UNION ALL
  SELECT 'locationadminchn', 'chennai', NULL UNION ALL
  SELECT 'locationadminchn2', 'chennai', NULL UNION ALL
  SELECT 'locationadminblr', 'bengaluru', NULL UNION ALL
  SELECT 'locationadminblr2', 'bengaluru', NULL UNION ALL
  SELECT 'storemanager', 'hyderabad', 'store-gachibowli' UNION ALL
  SELECT 'storemanagerhydmain', 'hyderabad', 'india-store-1-1' UNION ALL
  SELECT 'storemanagerbanjara', 'hyderabad', 'store-banjara' UNION ALL
  SELECT 'storemanagersecunderabad', 'hyderabad', 'store-secunderabad' UNION ALL
  SELECT 'storemanagerbenzcircle', 'vijayawada', 'store-benzcircle' UNION ALL
  SELECT 'storemanagergovernorpet', 'vijayawada', 'store-governorpet' UNION ALL
  SELECT 'storemanagerporanki', 'vijayawada', 'store-poranki' UNION ALL
  SELECT 'storemanagertnagar', 'chennai', 'store-tnagar' UNION ALL
  SELECT 'storemanageradyar', 'chennai', 'store-adyar' UNION ALL
  SELECT 'storemanagervelachery', 'chennai', 'store-velachery' UNION ALL
  SELECT 'storemanagerblr', 'bengaluru', 'store-koramangala' UNION ALL
  SELECT 'storemanagerindiranagar', 'bengaluru', 'store-indiranagar' UNION ALL
  SELECT 'storemanagerwhitefield', 'bengaluru', 'store-whitefield' UNION ALL
  SELECT 'deliverypartner', 'hyderabad', 'store-gachibowli'
) seeded ON seeded.username = u.username
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE NOT EXISTS (
  SELECT 1 FROM memberships m
  WHERE m.user_id = u.id
    AND m.role_id = r.id
    AND COALESCE(m.organization_id, '') = 'metaarch-commerce'
    AND COALESCE(m.location_id, '') = COALESCE(seeded.location_id, '')
    AND COALESCE(m.store_id, '') = COALESCE(seeded.store_id, '')
);
