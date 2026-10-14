-- Development-only four-city admin hierarchy. Password for all accounts is admin123.
INSERT INTO app_users (username, email, password_hash)
VALUES
  ('globaladmin', 'globaladmin@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadmin', 'locationadmin@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanager', 'storemanager@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('deliverypartner', 'deliverypartner@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagerblr', 'storemanagerblr@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadminhyd2', 'locationadminhyd2@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadminvja', 'locationadminvja@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadminvja2', 'locationadminvja2@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadminchn', 'locationadminchn@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadminchn2', 'locationadminchn2@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadminblr', 'locationadminblr@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('locationadminblr2', 'locationadminblr2@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagerhydmain', 'storemanagerhydmain@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagerbanjara', 'storemanagerbanjara@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagersecunderabad', 'storemanagersecunderabad@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagerbenzcircle', 'storemanagerbenzcircle@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagergovernorpet', 'storemanagergovernorpet@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagerporanki', 'storemanagerporanki@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagertnagar', 'storemanagertnagar@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanageradyar', 'storemanageradyar@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagervelachery', 'storemanagervelachery@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagerindiranagar', 'storemanagerindiranagar@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.'),
  ('storemanagerwhitefield', 'storemanagerwhitefield@metaarch.local', '$2a$10$f6IKLs5gDqm9GfHjxs6YxuVkmXduPvAFQIJRq/mbDSBUrO1VnQIY.')
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM app_users u
JOIN (
  SELECT 'locationadminhyd2' username, 'LOCATION_ADMIN' role_name UNION ALL
  SELECT 'locationadminvja', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminvja2', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminchn', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminchn2', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminblr', 'LOCATION_ADMIN' UNION ALL
  SELECT 'locationadminblr2', 'LOCATION_ADMIN' UNION ALL
  SELECT 'globaladmin', 'GLOBAL_ADMIN' UNION ALL
  SELECT 'locationadmin', 'LOCATION_ADMIN' UNION ALL
  SELECT 'storemanager', 'STORE_MANAGER' UNION ALL
  SELECT 'deliverypartner', 'DELIVERY_PARTNER' UNION ALL
  SELECT 'storemanagerblr', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerhydmain', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerbanjara', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagersecunderabad', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerbenzcircle', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagergovernorpet', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerporanki', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagertnagar', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanageradyar', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagervelachery', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerindiranagar', 'STORE_MANAGER' UNION ALL
  SELECT 'storemanagerwhitefield', 'STORE_MANAGER'
) seeded ON seeded.username = u.username
JOIN roles r ON r.name = seeded.role_name;

INSERT INTO memberships (user_id, role_id, organization_id, location_id, store_id)
SELECT u.id, r.id, 'metaarch-commerce', seeded.location_id, seeded.store_id
FROM app_users u
JOIN (
  SELECT 'locationadminhyd2' username, 'hyderabad' location_id, NULL store_id UNION ALL
  SELECT 'locationadminvja', 'vijayawada', NULL UNION ALL
  SELECT 'locationadminvja2', 'vijayawada', NULL UNION ALL
  SELECT 'locationadminchn', 'chennai', NULL UNION ALL
  SELECT 'locationadminchn2', 'chennai', NULL UNION ALL
  SELECT 'locationadminblr', 'bengaluru', NULL UNION ALL
  SELECT 'locationadminblr2', 'bengaluru', NULL UNION ALL
  SELECT 'globaladmin', NULL, NULL UNION ALL
  SELECT 'locationadmin', 'hyderabad', NULL UNION ALL
  SELECT 'storemanager', 'hyderabad', 'store-gachibowli' UNION ALL
  SELECT 'deliverypartner', 'hyderabad', 'store-gachibowli' UNION ALL
  SELECT 'storemanagerblr', 'bengaluru', 'store-koramangala' UNION ALL
  SELECT 'storemanagerhydmain', 'hyderabad', 'india-store-1-1' UNION ALL
  SELECT 'storemanagerbanjara', 'hyderabad', 'store-banjara' UNION ALL
  SELECT 'storemanagersecunderabad', 'hyderabad', 'store-secunderabad' UNION ALL
  SELECT 'storemanagerbenzcircle', 'vijayawada', 'store-benzcircle' UNION ALL
  SELECT 'storemanagergovernorpet', 'vijayawada', 'store-governorpet' UNION ALL
  SELECT 'storemanagerporanki', 'vijayawada', 'store-poranki' UNION ALL
  SELECT 'storemanagertnagar', 'chennai', 'store-tnagar' UNION ALL
  SELECT 'storemanageradyar', 'chennai', 'store-adyar' UNION ALL
  SELECT 'storemanagervelachery', 'chennai', 'store-velachery' UNION ALL
  SELECT 'storemanagerindiranagar', 'bengaluru', 'store-indiranagar' UNION ALL
  SELECT 'storemanagerwhitefield', 'bengaluru', 'store-whitefield'
) seeded ON seeded.username = u.username
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE NOT EXISTS (
  SELECT 1 FROM memberships m
  WHERE m.user_id = u.id
    AND m.role_id = r.id
    AND COALESCE(m.location_id, '') = COALESCE(seeded.location_id, '')
    AND COALESCE(m.store_id, '') = COALESCE(seeded.store_id, '')
);
